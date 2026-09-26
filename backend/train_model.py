import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.ml.anomaly_detector import get_anomaly_detector
from app.core.constants import EventType

def train():
    print("Generating baseline telemetry for Isolation Forest...")
    
    events = []
    
    # Generate 100 NORMAL baseline events (typical background noise)
    for i in range(100):
        events.append({
            "event_type": "network_connection" if i % 2 == 0 else "process_start",
            "process_name": "svchost.exe" if i % 2 == 0 else "explorer.exe",
            "destination_ip": f"192.168.1.{i%50}",
            "bytes_sent": 500 + i * 10,
            "bytes_received": 1000 + i * 20,
            "cpu_percent": 1.0 + (i % 5),
            "memory_mb": 50.0 + (i % 10),
            "status": "normal",
        })
        
    detector = get_anomaly_detector()
    result = detector.train(events)
    print("Training result:", result)
    
if __name__ == "__main__":
    train()
