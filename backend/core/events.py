"""
KAVACH Event Bus.

Unified bridge that re-exports the singleton message bus from app.core.events
to prevent split-brain event bus state between legacy collectors and new pipeline.
"""

from __future__ import annotations

from app.core.events import (
    MessageBus,
    InMemoryMessageBus,
    get_event_bus,
    set_event_bus,
    SubscriberCallback,
)

__all__ = [
    "MessageBus",
    "InMemoryMessageBus",
    "get_event_bus",
    "set_event_bus",
    "SubscriberCallback",
]

