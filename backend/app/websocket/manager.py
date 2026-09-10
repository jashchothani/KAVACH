"""
KAVACH Backend - WebSocket Connection Manager
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio

websocket_router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # Maps user session or connection ID to active WebSockets
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Active connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        # Broadcast concurrently to avoid blocking
        await asyncio.gather(
            *(connection.send_text(payload) for connection in self.active_connections),
            return_exceptions=True
        )


manager = ConnectionManager()


@websocket_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial confirmation message
        await manager.send_personal_message(
            {"type": "connection_established", "message": "Connected to KAVACH Realtime Engine"},
            websocket
        )
        
        while True:
            # Keep connection alive and listen for incoming packets
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Echo or process client requests if needed
                action = message.get("action")
                if action == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
