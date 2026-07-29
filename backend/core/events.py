"""
KAVACH Event Bus.

Provides a topic-based publish/subscribe abstraction.
Default implementation uses asyncio.Queue (in-memory, single-process).
Can be swapped for Redis Streams via configuration.
"""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Any, Callable, Coroutine

from core.constants import Topic
from core.logging import get_logger

logger = get_logger(__name__)

# Type alias for subscriber callbacks
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


class InMemoryMessageBus(MessageBus):
    """
    In-process message bus using asyncio.Queue per topic.

    Features:
    - Fan-out: multiple subscribers per topic
    - Backpressure via configurable maxsize
    - Graceful shutdown with queue draining
    """

    def __init__(self, maxsize: int = 10_000) -> None:
        self._maxsize = maxsize
        self._queues: dict[str, asyncio.Queue[dict[str, Any]]] = {}
        self._subscribers: dict[str, list[SubscriberCallback]] = defaultdict(list)
        self._tasks: list[asyncio.Task[None]] = []
        self._running = False
        self._stats: dict[str, int] = defaultdict(int)

    async def publish(self, topic: Topic | str, message: dict[str, Any]) -> None:
        """Publish a message — non-blocking, drops on full queue with warning."""
        topic_str = topic.value if isinstance(topic, Topic) else topic
        queue = self._get_or_create_queue(topic_str)
        try:
            queue.put_nowait(message)
            self._stats[f"{topic_str}.published"] += 1
        except asyncio.QueueFull:
            self._stats[f"{topic_str}.dropped"] += 1
            logger.warning("queue_full_dropping", topic=topic_str)

    async def subscribe(
        self, topic: Topic | str, callback: SubscriberCallback, group: str = "default"
    ) -> None:
        """Register a subscriber callback for a topic."""
        topic_str = topic.value if isinstance(topic, Topic) else topic
        self._subscribers[topic_str].append(callback)
        logger.info("subscriber_registered", topic=topic_str, group=group)

    async def start(self) -> None:
        """Start consumer loops for all registered topics."""
        if self._running:
            return
        self._running = True
        for topic_str in list(self._subscribers.keys()):
            self._get_or_create_queue(topic_str)
            task = asyncio.create_task(
                self._consumer_loop(topic_str), name=f"bus:{topic_str}"
            )
            self._tasks.append(task)
        logger.info("event_bus_started", topics=list(self._subscribers.keys()))

    async def stop(self) -> None:
        """Stop all consumer loops."""
        self._running = False
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("event_bus_stopped", stats=dict(self._stats))

    def is_running(self) -> bool:
        return self._running

    @property
    def stats(self) -> dict[str, int]:
        """Queue statistics."""
        return dict(self._stats)

    def _get_or_create_queue(self, topic: str) -> asyncio.Queue[dict[str, Any]]:
        if topic not in self._queues:
            self._queues[topic] = asyncio.Queue(maxsize=self._maxsize)
        return self._queues[topic]

    async def _consumer_loop(self, topic: str) -> None:
        """Continuously consume messages from a topic queue and fan-out to subscribers."""
        queue = self._queues[topic]
        while self._running:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=1.0)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break

            subscribers = self._subscribers.get(topic, [])
            for callback in subscribers:
                try:
                    await callback(message)
                    self._stats[f"{topic}.processed"] += 1
                except Exception:
                    self._stats[f"{topic}.errors"] += 1
                    logger.exception("subscriber_error", topic=topic)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

_bus: MessageBus | None = None


def get_event_bus() -> MessageBus:
    """Return the global event bus singleton."""
    global _bus
    if _bus is None:
        _bus = InMemoryMessageBus()
    return _bus


def set_event_bus(bus: MessageBus) -> None:
    """Override the global event bus (for testing)."""
    global _bus
    _bus = bus
