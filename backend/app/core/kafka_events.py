from __future__ import annotations
import asyncio
import json
from typing import Any, Callable, Coroutine
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

from app.core.constants import Topic
from app.core.logging import get_logger
from app.core.events import MessageBus, SubscriberCallback
from app.core.config import get_settings

logger = get_logger(__name__)

class KafkaMessageBus(MessageBus):
    """
    Message bus using Kafka via aiokafka.
    """

    def __init__(self, bootstrap_servers: str = None) -> None:
        settings = get_settings()
        self.bootstrap_servers = bootstrap_servers or settings.kafka_bootstrap_servers if hasattr(settings, 'kafka_bootstrap_servers') else "localhost:29092"
        self._producer = None
        self._consumers = []
        self._subscribers: dict[str, list[SubscriberCallback]] = {}
        self._tasks: list[asyncio.Task] = []
        self._running = False
        self._published_count = 0

    async def publish(self, topic: Topic | str, message: dict[str, Any]) -> None:
        """Publish a message to Kafka."""
        if not self._producer:
            logger.warning("kafka_producer_not_started_dropping_message")
            return
            
        topic_str = topic.value if isinstance(topic, Topic) else str(topic)
        value = json.dumps(message).encode('utf-8')
        try:
            await self._producer.send_and_wait(topic_str, value)
            self._published_count += 1
        except Exception as e:
            logger.error("kafka_publish_failed", error=str(e), topic=topic_str)

    async def subscribe(
        self, topic: Topic | str, callback: SubscriberCallback, group: str = "kavach-backend"
    ) -> None:
        """Subscribe a callback to a topic."""
        topic_str = topic.value if isinstance(topic, Topic) else str(topic)
        if topic_str not in self._subscribers:
            self._subscribers[topic_str] = []
        self._subscribers[topic_str].append(callback)

    async def _consume_loop(self, topic: str, callbacks: list[SubscriberCallback]):
        consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id="kavach-backend",
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        self._consumers.append(consumer)
        await consumer.start()
        logger.info("kafka_consumer_started", topic=topic)
        
        try:
            async for msg in consumer:
                for callback in callbacks:
                    try:
                        await callback(msg.value)
                    except Exception as e:
                        logger.error("kafka_subscriber_callback_error", error=str(e), topic=topic)
        finally:
            await consumer.stop()

    async def start(self) -> None:
        """Start Kafka producer and consumer loops."""
        if self._running:
            return
            
        # Start Producer
        self._producer = AIOKafkaProducer(bootstrap_servers=self.bootstrap_servers)
        await self._producer.start()
        logger.info("kafka_producer_started", bootstrap_servers=self.bootstrap_servers)

        # Start Consumers
        for topic, callbacks in self._subscribers.items():
            task = asyncio.create_task(self._consume_loop(topic, callbacks))
            self._tasks.append(task)
            
        self._running = True

    async def stop(self) -> None:
        """Stop Kafka clients."""
        if not self._running:
            return
        self._running = False

        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
            
        if self._producer:
            await self._producer.stop()

    def is_running(self) -> bool:
        return self._running

    def get_stats(self) -> dict[str, Any]:
        return {
            "bus_type": "kafka",
            "published": self._published_count,
            "running": self._running
        }

_global_bus = None

def get_event_bus() -> MessageBus:
    global _global_bus
    if _global_bus is None:
        _global_bus = KafkaMessageBus()
    return _global_bus
