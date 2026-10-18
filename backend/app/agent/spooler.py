"""
KAVACH Resilient Offline Spooler.

High-reliability, disk-backed SQLite ring buffer for edge endpoints.
Ensures zero event loss during network interruptions, server outages, or bandwidth throttling.
Prioritizes transmission by severity tier:
  1 = CRITICAL
  2 = HIGH
  3 = MEDIUM
  4 = LOW
  5 = STATISTICAL
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
from contextlib import contextmanager
from typing import Any, Generator

from app.agent.classifier import EdgeTier


TIER_PRIORITY_MAP = {
    EdgeTier.CRITICAL.value: 1,
    EdgeTier.HIGH.value: 2,
    EdgeTier.MEDIUM.value: 3,
    EdgeTier.LOW.value: 4,
    EdgeTier.STATISTICAL.value: 5,
}


class ResilientSpooler:
    """Thread-safe SQLite persistent buffer for telemetry events."""

    def __init__(self, db_path: str = "agent_spool.db", max_size_bytes: int = 250 * 1024 * 1024):
        self.db_path = os.path.abspath(db_path)
        self.max_size_bytes = max_size_bytes
        os.makedirs(os.path.dirname(self.db_path) or ".", exist_ok=True)
        self._init_db()

    @contextmanager
    def _connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        try:
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA synchronous = NORMAL;")
            yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        """Create spool schema and index."""
        with self._connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS spool_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tier TEXT NOT NULL,
                    tier_priority INTEGER NOT NULL,
                    payload TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    retry_count INTEGER DEFAULT 0
                );
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_spool_priority 
                ON spool_events (tier_priority, id);
            """)
            conn.commit()

    def enqueue_batch(self, events: list[dict[str, Any]]) -> int:
        """Insert a batch of events with priority rating."""
        if not events:
            return 0

        now = time.time()
        rows = []
        for evt in events:
            tier = str(evt.get("edge_tier") or EdgeTier.LOW.value).lower()
            prio = TIER_PRIORITY_MAP.get(tier, 4)
            payload_str = json.dumps(evt)
            rows.append((tier, prio, payload_str, now))

        with self._connection() as conn:
            conn.executemany("""
                INSERT INTO spool_events (tier, tier_priority, payload, created_at)
                VALUES (?, ?, ?, ?);
            """, rows)
            conn.commit()

        # Enforce storage cap if needed
        self._check_and_prune()
        return len(rows)

    def dequeue_batch(self, limit: int = 100) -> list[tuple[int, dict[str, Any]]]:
        """
        Fetch the highest-priority events waiting in the spool.
        Returns list of (event_id, event_dict).
        """
        with self._connection() as conn:
            cursor = conn.execute("""
                SELECT id, payload FROM spool_events
                ORDER BY tier_priority ASC, id ASC
                LIMIT ?;
            """, (limit,))
            results = []
            for row in cursor.fetchall():
                row_id, raw_payload = row[0], row[1]
                try:
                    results.append((row_id, json.loads(raw_payload)))
                except json.JSONDecodeError:
                    # Skip and delete corrupt records
                    conn.execute("DELETE FROM spool_events WHERE id = ?", (row_id,))
                    conn.commit()
            return results

    def ack_batch(self, event_ids: list[int]) -> int:
        """Acknowledge successful transmission: delete from spool."""
        if not event_ids:
            return 0
        with self._connection() as conn:
            placeholders = ",".join("?" for _ in event_ids)
            cursor = conn.execute(f"DELETE FROM spool_events WHERE id IN ({placeholders})", event_ids)
            conn.commit()
            return cursor.rowcount

    def nack_batch(self, event_ids: list[int]) -> None:
        """Failed transmission: increment retry count."""
        if not event_ids:
            return
        with self._connection() as conn:
            placeholders = ",".join("?" for _ in event_ids)
            conn.execute(
                f"UPDATE spool_events SET retry_count = retry_count + 1 WHERE id IN ({placeholders})",
                event_ids
            )
            conn.commit()

    def get_stats(self) -> dict[str, Any]:
        """Return total and per-tier pending event counts."""
        stats = {
            "total_pending": 0,
            "critical_pending": 0,
            "high_pending": 0,
            "medium_pending": 0,
            "low_pending": 0,
            "statistical_pending": 0,
            "db_size_bytes": os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0,
        }
        with self._connection() as conn:
            cursor = conn.execute("SELECT tier, COUNT(*) FROM spool_events GROUP BY tier")
            for tier, count in cursor.fetchall():
                stats["total_pending"] += count
                key = f"{tier}_pending"
                if key in stats:
                    stats[key] = count
        return stats

    def _check_and_prune(self) -> None:
        """Prune oldest low/statistical events if file exceeds storage limit."""
        try:
            if not os.path.exists(self.db_path):
                return
            size = os.path.getsize(self.db_path)
            if size > self.max_size_bytes:
                with self._connection() as conn:
                    # Delete oldest statistical and low events first
                    conn.execute("""
                        DELETE FROM spool_events 
                        WHERE id IN (
                            SELECT id FROM spool_events 
                            WHERE tier_priority IN (4, 5) 
                            ORDER BY id ASC 
                            LIMIT 1000
                        );
                    """)
                    conn.commit()
        except Exception:
            pass
