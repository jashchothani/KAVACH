"""
AntiGravity Machine Learning — Unsupervised Telemetry Anomaly Detector.

Utilizes scikit-learn's Isolation Forest to profile system telemetry
and flag zero-day process/network/USB deviations.
"""

from __future__ import annotations

import os
import joblib
import numpy as np
from typing import Any, Sequence
from sklearn.ensemble import IsolationForest

from core.config import get_settings
from core.logging import get_logger

logger = get_logger(__name__)

# Severity mapping for numerical conversion
SEVERITY_MAP = {
    "critical": 5.0,
    "high": 4.0,
    "medium": 3.0,
    "low": 2.0,
    "info": 1.0
}


class TelemetryAnomalyDetector:
    """Isolation Forest based anomaly detector for system telemetry events."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._model_dir = self._settings.paths.model_path
        self._model_path = os.path.join(self._model_dir, "anomaly_detector.joblib")
        self._model: IsolationForest | None = None
        self._feature_keys = ["risk_score", "severity_val", "has_mitre", "collector_hash"]
        self.load_model()

    def load_model(self) -> bool:
        """Load trained Isolation Forest model from disk."""
        if os.path.exists(self._model_path):
            try:
                self._model = joblib.load(self._model_path)
                logger.info("ml_model_loaded", path=self._model_path)
                return True
            except Exception as exc:
                logger.error("ml_model_load_failed", error=str(exc))
        
        # Initialize default model if none exists
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.05,  # Expected proportion of anomalies (5%)
            random_state=42
        )
        logger.info("ml_model_initialized_awaiting_training")
        return False

    def save_model(self) -> None:
        """Save trained model to disk."""
        try:
            os.makedirs(self._model_dir, exist_ok=True)
            joblib.dump(self._model, self._model_path)
            logger.info("ml_model_saved", path=self._model_path)
        except Exception as exc:
            logger.error("ml_model_save_failed", error=str(exc))

    def _extract_features(self, event: dict[str, Any]) -> np.ndarray:
        """Convert a raw/normalized event dict into a numerical feature vector."""
        risk_score = float(event.get("risk_score") or 0.0)
        
        sev = str(event.get("severity") or "info").lower()
        severity_val = SEVERITY_MAP.get(sev, 1.0)
        
        has_mitre = 1.0 if event.get("mitre_technique") or event.get("mitre_technique_id") else 0.0
        
        collector = str(event.get("source_collector") or event.get("collector") or "unknown")
        collector_hash = float(hash(collector) % 100) / 100.0

        return np.array([risk_score, severity_val, has_mitre, collector_hash])

    @property
    def is_fitted(self) -> bool:
        """Check if the scikit-learn model has been fitted."""
        return self._model is not None and hasattr(self._model, "estimators_")

    def train(self, events: Sequence[dict[str, Any]]) -> dict[str, Any]:
        """Train the Isolation Forest model on historical telemetry logs."""
        if not events:
            logger.warning("ml_training_no_data")
            raise ValueError("Cannot train model: No original/historical alert events found in database.")

        X = []
        for event in events:
            X.append(self._extract_features(event))
        
        X_train = np.array(X)
        
        # Fit Isolation Forest
        self._model.fit(X_train)
        self.save_model()
        
        # Calculate training statistics
        scores = self._model.decision_function(X_train)
        anomalies = self._model.predict(X_train)
        anomaly_count = int(np.sum(anomalies == -1))

        return {
            "status": "trained",
            "samples_count": len(events),
            "anomaly_rate": round(anomaly_count / len(events), 4),
            "average_score": float(np.mean(scores)),
        }

    def predict(self, event: dict[str, Any]) -> dict[str, Any]:
        """Evaluate if an event is anomalous and calculate anomaly score."""
        if not self.is_fitted:
            return {"is_anomaly": False, "score": 0.0, "raw_score": 0.0}

        features = self._extract_features(event).reshape(1, -1)
        
        # decision_function returns scores where lower is more anomalous (negative values are anomalies)
        raw_score = float(self._model.decision_function(features)[0])
        prediction = int(self._model.predict(features)[0])
        
        # Map raw decision function score to a 0-100 anomaly scale
        # Typically scores range between -0.5 and +0.5
        normalized_score = max(0.0, min(100.0, (0.5 - raw_score) * 100.0))

        return {
            "is_anomaly": prediction == -1,
            "score": normalized_score,
            "raw_score": raw_score
        }

    def _generate_baseline_data(self) -> list[dict[str, Any]]:
        """Generate baseline normal system telemetry logs for initial model fitting."""
        import random
        collectors = ["process", "network", "fim", "registry", "scheduled_task"]
        severities = ["info", "low", "medium"]
        
        data = []
        for _ in range(200):
            # Normal events: low risk, mostly info/low severity, no MITRE mapping
            data.append({
                "risk_score": random.uniform(5.0, 30.0),
                "severity": random.choices(severities, weights=[0.7, 0.25, 0.05])[0],
                "mitre_technique": None,
                "source_collector": random.choice(collectors)
            })
            
        # Add a tiny amount of anomalies (high severity, high risk)
        for _ in range(10):
            data.append({
                "risk_score": random.uniform(70.0, 95.0),
                "severity": "critical",
                "mitre_technique": "T1059",
                "source_collector": "process"
            })
            
        return data


# Singleton
_anomaly_detector: TelemetryAnomalyDetector | None = None


def get_anomaly_detector() -> TelemetryAnomalyDetector:
    global _anomaly_detector
    if _anomaly_detector is None:
        _anomaly_detector = TelemetryAnomalyDetector()
    return _anomaly_detector
