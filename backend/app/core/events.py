"""
KAVACH Event Bus.

Topic-based asynchronous publish/subscribe system with bounded queues,
queue monitoring, dropped-event tracking, and backpressure protection.
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Any, Callable, Coroutine

from app.core.constants import Topic
from app.core.logging import get_logger

logger = get_logger(__name__)

SubscriberCallback = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]


class MessageBus(ABC):
    """Abstract message bus interface."""

    @abstractmethod
    async def publish(self, topic: Topic | str, message: dict[str, Any]) -> None:
        """Publish a message to a topic."""
        ...

    @abstractmethod
    async def subscribe(
        self, topic: Topic | str, callback: SubscriberCallback, group: str = "default"
    ) -> None:
        """Subscribe to a topic with a callback."""
        ...

    @abstractmethod
    async def start(self) -> None:
        """Start the message bus."""
        ...

    @abstractmethod
    async def stop(self) -> None:
        """Stop the message bus and drain queues."""
        ...

    @abstractmethod
    def is_running(self) -> bool:
        """Check if the bus is active."""
        ...

    @abstractmethod
    def get_stats(self) -> dict[str, Any]:
        """Get queue sizes, processed counts, and dropped counts."""
        ...


class InMemoryMessageBus(MessageBus):
    """
    In-process message bus using bounded asyncio.Queue per topic.
    Provides backpressure and dropped-event monitoring.
    """

    def __init__(self, max_queue_size: int = 10_000) -> None:
        self._max_queue_size = max_queue_size
        self._queues: dict[str, asyncio.Queue[dict[str, Any]]] = defaultdict(
            lambda: asyncio.Queue(maxsize=self._max_queue_size)
        )
        self._subscribers: dict[str, list[SubscriberCallback]] = defaultdict(list)
        self._tasks: list[asyncio.Task] = []
        self._running = False
        self._published_count = 0
        self._dropped_count = 0
        self._delivered_count = 0

    async def publish(self, topic: Topic | str, message: dict[str, Any]) -> None:
        """Publish a message. Drops gracefully if queue is completely saturated."""
        topic_str = topic.value if isinstance(topic, Topic) else str(topic)
        queue = self._queues[topic_str]

        try:
            queue.put_nowait(message)
            self._published_count += 1
        except asyncio.QueueFull:
            self._dropped_count += 1
            logger.warning("event_queue_full_dropped_event", topic=topic_str, dropped_total=self._dropped_count)

    async def subscribe(
        self, topic: Topic | str, callback: SubscriberCallback, group: str = "default"
    ) -> None:
        """Subscribe a callback to a topic."""
        topic_str = topic.value if isinstance(topic, Topic) else str(topic)
        self._subscribers[topic_str].append(callback)

    async def start(self) -> None:
        """Start consumer loops for all topics."""
        if self._running:
            return
        self._running = True

        for topic_str, callbacks in self._subscribers.items():
            queue = self._queues[topic_str]
            task = asyncio.create_task(
                self._consumer_loop(topic_str, queue, callbacks),
                name=f"bus-consumer-{topic_str}",
            )
            self._tasks.append(task)
        logger.info("message_bus_started", topics=list(self._subscribers.keys()))

    async def _consumer_loop(
        self,
        topic_str: str,
        queue: asyncio.Queue[dict[str, Any]],
        callbacks: list[SubscriberCallback],
    ) -> None:
        """Consume messages and dispatch to all registered callbacks."""
        while self._running:
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=1.0)
                for cb in callbacks:
                    try:
                        await cb(msg)
                        self._delivered_count += 1
                    except Exception as exc:
                        logger.error("subscriber_callback_error", topic=topic_str, error=str(exc))
                queue.task_done()
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("bus_consumer_error", topic=topic_str, error=str(exc))

    async def stop(self) -> None:
        """Drain queues and stop consumer tasks."""
        self._running = False
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("message_bus_stopped")

    def is_running(self) -> bool:
        return self._running

    def get_stats(self) -> dict[str, Any]:
        """Expose queue health and backpressure metrics."""
        queue_sizes = {t: q.qsize() for t, q in self._queues.items()}
        total_queued = sum(queue_sizes.values())
        return {
            "status": "healthy" if total_queued < (self._max_queue_size * 0.8) else "degraded",
            "total_queued": total_queued,
            "max_queue_size": self._max_queue_size,
            "published_count": self._published_count,
            "delivered_count": self._delivered_count,
            "dropped_count": self._dropped_count,
            "topics": queue_sizes,
        }


_bus_instance: MessageBus | None = None


def get_event_bus() -> MessageBus:
    """Get the singleton message bus instance."""
    global _bus_instance
    if _bus_instance is None:
        _bus_instance = InMemoryMessageBus(max_queue_size=10_000)
    return _bus_instance
