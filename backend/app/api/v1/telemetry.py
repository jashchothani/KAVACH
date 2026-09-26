from typing import List, Any
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.core.events import get_event_bus
from app.core.constants import Topic
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

class TelemetryPayload(BaseModel):
    events: List[dict[str, Any]]

@router.post("/ingest", status_code=202)
async def ingest_telemetry(payload: TelemetryPayload, background_tasks: BackgroundTasks):
    """
    Ingest batch of raw telemetry events from external standalone collectors.
    """
    if not payload.events:
        return {"status": "ok", "ingested": 0}

    bus = get_event_bus()
    
    async def process_batch(events):
        for event in events:
            try:
                await bus.publish(Topic.RAW_EVENTS, event)
            except Exception as e:
                logger.error("telemetry_ingest_publish_error", error=str(e))
                
    background_tasks.add_task(process_batch, payload.events)
    
    return {"status": "accepted", "ingested": len(payload.events)}
