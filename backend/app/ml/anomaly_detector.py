"""
KAVACH Machine Learning Anomaly Detection Engine.

Uses scikit-learn's Isolation Forest on engineered feature vectors.
Strictly adheres to:
- No fake predictions: returns "insufficient_data" when not trained.
- Model metadata versioning in data/models/model_meta.json.
- Model persistence in data/models/isolation_forest.joblib.
- Separates raw anomaly score, percentile, confidence, and evidence coverage.
"""

from __future__ import annotations

import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest

from app.core.config import get_settings
from app.core.logging import get_logger
from app.ml.feature_extractor import FeatureExtractor, FEATURE_SCHEMA

logger = get_logger(__name__)


class TelemetryAnomalyDetector:
    """Adaptive Isolation Forest anomaly detector for system telemetry."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._extractor = FeatureExtractor()
        self._model_path = Path(self._settings.ml.model_path)
        self._meta_path = Path(self._settings.ml.meta_path)
        self._model: IsolationForest | None = None
        self._metadata: dict[str, Any] = {
            "model_id": "none",
            "version": "v0.0.0",
            "trained_at": None,
            "sample_count": 0,
            "contamination": self._settings.ml.contamination,
            "feature_schema": FEATURE_SCHEMA,
            "validation_status": "NOT_TRAINED",
        }
        self.load_model()

    def load_model(self) -> bool:
        """Load trained Isolation Forest model and metadata from disk."""
        if self._model_path.exists() and self._meta_path.exists():
            try:
                self._model = joblib.load(str(self._model_path))
                with open(self._meta_path, "r", encoding="utf-8") as f:
                    self._metadata = json.load(f)
                logger.info("ml_model_loaded", version=self._metadata.get("version"), samples=self._metadata.get("sample_count"))
                return True
            except Exception as exc:
                logger.error("ml_model_load_failed", error=str(exc))

        self._model = None
        logger.info("ml_model_awaiting_training")
        return False

    def save_model(self) -> None:
        """Save model and metadata to disk."""
        try:
            self._model_path.parent.mkdir(parents=True, exist_ok=True)
            if self._model is not None:
                joblib.dump(self._model, str(self._model_path))
            with open(self._meta_path, "w", encoding="utf-8") as f:
                json.dump(self._metadata, f, indent=2, default=str)
            logger.info("ml_model_saved", path=str(self._model_path), version=self._metadata.get("version"))
        except Exception as exc:
            logger.error("ml_model_save_failed", error=str(exc))

    @property
    def is_fitted(self) -> bool:
        """Check if model is trained and ready for real inference."""
        return self._model is not None and hasattr(self._model, "estimators_")

    def get_status(self) -> dict[str, Any]:
        """Return diagnostic status of the ML pipeline."""
        return {
            "status": "ready" if self.is_fitted else "insufficient_data",
            "is_fitted": self.is_fitted,
            "min_samples_required": self._settings.ml.min_train_samples,
            "current_sample_count": self._metadata.get("sample_count", 0),
            "model_id": self._metadata.get("model_id"),
            "version": self._metadata.get("version"),
            "trained_at": self._metadata.get("trained_at"),
            "contamination": self._metadata.get("contamination"),
            "validation_status": self._metadata.get("validation_status"),
            "feature_schema": FEATURE_SCHEMA,
        }

    def predict(self, event: dict[str, Any]) -> dict[str, Any]:
        """
        Predict whether an event is an anomaly.
        STRICT REQUIREMENT: Never fake results when model has not been trained.
        """
        if not self.is_fitted:
            return {
                "status": "insufficient_data",
                "is_anomaly": False,
                "raw_anomaly_score": 0.0,
                "anomaly_percentile": 0.0,
                "confidence": 0.0,
                "evidence_coverage": 0.0,
                "model_version": None,
                "feature_contributions": {},
                "explanation": "ML anomaly detection inactive: insufficient baseline data collected to train model.",
            }

        features_dict = self._extractor.extract_features_dict(event)
        vec = np.array([[features_dict[k] for k in FEATURE_SCHEMA]], dtype=np.float32)

        # Isolation forest: negative = anomaly, positive = normal
        raw_score = float(self._model.decision_function(vec)[0])
        pred = int(self._model.predict(vec)[0])  # -1 is anomaly, 1 is normal
        is_anomaly = (pred == -1)

        # Convert decision function score to anomaly percentile (0.0 to 1.0)
        # Decision scores typically fall in range [-0.5, 0.5]
        anomaly_percentile = min(1.0, max(0.0, (0.5 - raw_score)))

        # Evidence coverage: proportion of active feature signals present
        active_features = sum(1 for v in features_dict.values() if v > 0.1)
        evidence_coverage = round(active_features / len(FEATURE_SCHEMA), 2)
        confidence = round(min(1.0, evidence_coverage * 0.5 + (0.5 if is_anomaly else 0.3)), 2)

        # Identify top contributing features
        top_factors = [
            k.replace("_", " ").title()
            for k, v in sorted(features_dict.items(), key=lambda item: item[1], reverse=True)[:3]
            if v > 0.2
        ]

        explanation = (
            f"Isolation Forest flagged statistical deviation (score: {raw_score:.3f}). "
            f"Key factors: {', '.join(top_factors) if top_factors else 'Multi-variable shift'}."
            if is_anomaly
            else "Event matches established system behavior profile."
        )

        return {
            "status": "detected" if is_anomaly else "normal",
            "is_anomaly": is_anomaly,
            "raw_anomaly_score": round(raw_score, 4),
            "anomaly_percentile": round(anomaly_percentile, 4),
            "confidence": confidence,
            "evidence_coverage": evidence_coverage,
            "model_version": self._metadata.get("version"),
            "feature_contributions": features_dict,
            "explanation": explanation,
        }

    def train(self, events: Sequence[dict[str, Any]]) -> dict[str, Any]:
        """Train or retrain the Isolation Forest model on historical events."""
        min_required = self._settings.ml.min_train_samples
        if len(events) < min_required:
            logger.warning("ml_training_insufficient_data", count=len(events), required=min_required)
            raise ValueError(
                f"Insufficient telemetry data to train ML model. Found {len(events)} events; requires at least {min_required}."
            )

        X = []
        for e in events:
            X.append(self._extractor.extract_vector(e))
        X_train = np.array(X)

        model = IsolationForest(
            n_estimators=100,
            contamination=self._settings.ml.contamination,
            random_state=42,
        )
        model.fit(X_train)

        version_num = int(time.time())
        version_str = f"v1.{version_num}"
        model_id = f"isoforest-{version_num}"

        self._model = model
        self._metadata = {
            "model_id": model_id,
            "version": version_str,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "sample_count": len(events),
            "contamination": self._settings.ml.contamination,
            "feature_schema": FEATURE_SCHEMA,
            "validation_status": "ACTIVE",
        }
        self.save_model()

        logger.info("ml_model_training_completed", version=version_str, sample_count=len(events))
        return {
            "status": "success",
            "model_id": model_id,
            "version": version_str,
            "samples_trained": len(events),
            "contamination": self._settings.ml.contamination,
        }


_detector_instance: TelemetryAnomalyDetector | None = None


def get_anomaly_detector() -> TelemetryAnomalyDetector:
    """Singleton getter for the anomaly detector."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = TelemetryAnomalyDetector()
    return _detector_instance
