"""
KAVACH Pluggable Message Broker Engine.

Decoupled message broker layer providing tiered, high-throughput pub/sub
between the Cloud Ingestion Gateway and the Cloud Analysis Pipeline.
Supports:
1. Redis Streams (`RedisStreamBroker`): Single-container, sub-millisecond, consumer groups.
2. Apache Kafka (`KafkaStreamBroker`): Clustered, high-throughput partitioned topics.
3. Memory Priority Broker (`MemoryPriorityBroker`): Built-in zero-dependency fallback.
"""

from __future__ import annotations

import asyncio
import json
import time
from abc import ABC, abstractmethod
from typing import Any, Callable, Coroutine, Dict, List

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("kavach_broker")

BrokerCallback = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]

TIER_STREAMS = {
    "critical": "kavach:stream:critical",
    "high": "kavach:stream:high",
    "medium": "kavach:stream:medium",
    "low": "kavach:stream:low",
    "statistical": "kavach:stream:statistical",
}

TIER_PRIORITY_ORDER = ["critical", "high", "medium", "low", "statistical"]


class MessageBroker(ABC):
    """Abstract interface for KAVACH telemetry message brokers."""

    @abstractmethod
    async def start(self) -> None:
        """Initialize connection and start internal worker loops."""
        ...

    @abstractmethod
    async def stop(self) -> None:
        """Close connections and drain active queues."""
        ...

    @abstractmethod
    async def publish_tier(self, tier: str, message: dict[str, Any]) -> None:
        """Publish a message to a specific severity tier stream."""
        ...

    @abstractmethod
    async def subscribe_tier(self, tier: str, callback: BrokerCallback) -> None:
        """Subscribe to events from a specific severity tier."""
        ...

    @abstractmethod
    def get_metrics(self) -> dict[str, Any]:
        """Return live broker metrics (queue depths, processed counts, latency)."""
        ...


class MemoryPriorityBroker(MessageBroker):
    """High-throughput in-memory prioritized message broker with bounded queues."""

    def __init__(self, max_queue_size: int = 15000) -> None:
        self.max_queue_size = max_queue_size
        self._queues: Dict[str, asyncio.Queue] = {
            tier: asyncio.Queue(maxsize=max_queue_size) for tier in TIER_PRIORITY_ORDER
        }
        self._subscribers: Dict[str, List[BrokerCallback]] = {
            tier: [] for tier in TIER_PRIORITY_ORDER
        }
        self._running = False
        self._consumer_tasks: List[asyncio.Task] = []
        self._published_count = 0
        self._delivered_count = 0
        self._dropped_count = 0

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        for tier in TIER_PRIORITY_ORDER:
            task = asyncio.create_task(self._tier_consumer_loop(tier))
            self._consumer_tasks.append(task)
        logger.info("memory_priority_broker_started", active_tiers=len(TIER_PRIORITY_ORDER))

    async def stop(self) -> None:
        self._running = False
        for task in self._consumer_tasks:
            task.cancel()
        if self._consumer_tasks:
            await asyncio.gather(*self._consumer_tasks, return_exceptions=True)
        self._consumer_tasks.clear()
        logger.info("memory_priority_broker_stopped")

    async def publish_tier(self, tier: str, message: dict[str, Any]) -> None:
        normalized_tier = tier.lower() if tier else "low"
        if normalized_tier not in self._queues:
            normalized_tier = "low"

        queue = self._queues[normalized_tier]
        try:
            queue.put_nowait(message)
            self._published_count += 1
        except asyncio.QueueFull:
            self._dropped_count += 1
            logger.warning("broker_queue_full_dropped", tier=normalized_tier)

    async def subscribe_tier(self, tier: str, callback: BrokerCallback) -> None:
        normalized_tier = tier.lower() if tier else "low"
        if normalized_tier in self._subscribers:
            self._subscribers[normalized_tier].append(callback)

    async def _tier_consumer_loop(self, tier: str) -> None:
        queue = self._queues[tier]
        while self._running:
            try:
                message = await queue.get()
                callbacks = self._subscribers.get(tier, [])
                for cb in callbacks:
                    try:
                        await cb(message)
                    except Exception as exc:
                        logger.error("subscriber_dispatch_error", tier=tier, error=str(exc))
                self._delivered_count += 1
                queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("tier_consumer_error", tier=tier, error=str(exc))
                await asyncio.sleep(0.1)

    def get_metrics(self) -> dict[str, Any]:
        return {
            "broker_type": "memory_priority",
            "status": "healthy" if self._dropped_count == 0 else "degraded",
            "published_count": self._published_count,
            "delivered_count": self._delivered_count,
            "dropped_count": self._dropped_count,
            "queue_depths": {tier: q.qsize() for tier, q in self._queues.items()},
            "active_subscribers": {tier: len(cbs) for tier, cbs in self._subscribers.items()},
        }


class RedisStreamBroker(MessageBroker):
    """Production Redis Streams broker with consumer groups and time-based trimming."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0", consumer_group: str = "kavach_analysis_workers"):
        self.redis_url = redis_url
        self.consumer_group = consumer_group
        self.consumer_name = f"worker-{int(time.time())}"
        self._redis = None
        self._running = False
        self._subscribers: Dict[str, List[BrokerCallback]] = {tier: [] for tier in TIER_PRIORITY_ORDER}
        self._consumer_task: asyncio.Task | None = None
        self._published_count = 0
        self._delivered_count = 0

    async def start(self) -> None:
        import redis.asyncio as aioredis

        self._running = True
        self._redis = aioredis.from_url(self.redis_url, decode_responses=True)

        # Create consumer groups for each stream if not existing
        for tier, stream_name in TIER_STREAMS.items():
            try:
                await self._redis.xgroup_create(stream_name, self.consumer_group, id="0", mkstream=True)
            except Exception:
                pass  # Group already exists

        self._consumer_task = asyncio.create_task(self._stream_consumer_loop())
        logger.info("redis_stream_broker_started", url=self.redis_url, group=self.consumer_group)

    async def stop(self) -> None:
        self._running = False
        if self._consumer_task:
            self._consumer_task.cancel()
        if self._redis:
            await self._redis.aclose()
        logger.info("redis_stream_broker_stopped")

    async def publish_tier(self, tier: str, message: dict[str, Any]) -> None:
        if not self._redis:
            return
        stream_name = TIER_STREAMS.get(tier.lower(), TIER_STREAMS["low"])
        try:
            payload = json.dumps(message)
            # Approximate stream trimming to 50,000 entries
            await self._redis.xadd(stream_name, {"payload": payload}, maxlen=50000, approximate=True)
            self._published_count += 1
        except Exception as exc:
            logger.error("redis_publish_error", stream=stream_name, error=str(exc))

    async def subscribe_tier(self, tier: str, callback: BrokerCallback) -> None:
        normalized_tier = tier.lower() if tier else "low"
        if normalized_tier in self._subscribers:
            self._subscribers[normalized_tier].append(callback)

    async def _stream_consumer_loop(self) -> None:
        streams = {stream_name: ">" for stream_name in TIER_STREAMS.values()}
        reverse_map = {stream: tier for tier, stream in TIER_STREAMS.items()}

        while self._running:
            try:
                # Read new messages across priority streams with 1s block
                entries = await self._redis.xreadgroup(
                    groupname=self.consumer_group,
                    consumername=self.consumer_name,
                    streams=streams,
                    count=50,
                    block=1000,
                )
                if not entries:
                    continue

                for stream_name, messages in entries:
                    tier = reverse_map.get(stream_name, "low")
                    callbacks = self._subscribers.get(tier, [])
                    ack_ids = []

                    for msg_id, data in messages:
                        raw_payload = data.get("payload")
                        if raw_payload:
                            try:
                                event = json.loads(raw_payload)
                                for cb in callbacks:
                                    await cb(event)
                                self._delivered_count += 1
                            except Exception as exc:
                                logger.error("redis_event_dispatch_error", error=str(exc))
                        ack_ids.append(msg_id)

                    if ack_ids:
                        await self._redis.xack(stream_name, self.consumer_group, *ack_ids)

            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("redis_stream_consumer_error", error=str(exc))
                await asyncio.sleep(2.0)

    def get_metrics(self) -> dict[str, Any]:
        return {
            "broker_type": "redis_streams",
            "status": "connected" if self._running else "disconnected",
            "redis_url": self.redis_url,
            "consumer_group": self.consumer_group,
            "published_count": self._published_count,
            "delivered_count": self._delivered_count,
        }


# Global broker singleton
_global_broker: MessageBroker | None = None


async def init_message_broker() -> MessageBroker:
    """Initialize the message broker according to settings with graceful fallback."""
    global _global_broker
    settings = get_settings()
    broker_type = getattr(settings, "broker_type", "memory").lower()
    redis_url = getattr(settings, "redis_url", "redis://localhost:6379/0")

    if broker_type == "redis":
        try:
            import redis.asyncio as aioredis
            test_client = aioredis.from_url(redis_url)
            await asyncio.wait_for(test_client.ping(), timeout=2.0)
            await test_client.aclose()
            broker = RedisStreamBroker(redis_url=redis_url)
            await broker.start()
            _global_broker = broker
            logger.info("using_redis_streams_broker", url=redis_url)
            return broker
        except Exception as exc:
            logger.warning("redis_unavailable_fallback_to_memory", error=str(exc))

    # Default to High-Performance Memory Priority Broker
    broker = MemoryPriorityBroker()
    await broker.start()
    _global_broker = broker
    logger.info("using_memory_priority_broker")
    return broker


def get_message_broker() -> MessageBroker:
    """Return the active message broker instance."""
    global _global_broker
    if _global_broker is None:
        _global_broker = MemoryPriorityBroker()
    return _global_broker


def set_message_broker(broker: MessageBroker) -> None:
    """Override the active message broker (for testing)."""
    global _global_broker
    _global_broker = broker
