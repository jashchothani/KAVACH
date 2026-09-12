"""
Tests for KAVACH Machine Learning & Isolation Forest Pipeline.
"""

import pytest
from app.ml.feature_extractor import FeatureExtractor, FEATURE_SCHEMA
from app.ml.anomaly_detector import TelemetryAnomalyDetector


def test_feature_extractor():
    extractor = FeatureExtractor()
    sample_event = {
        "event_type": "process_create",
        "process_name": "powershell.exe",
        "command_line": "powershell.exe -enc SQBFAFgA...",
        "risk_score": 85.0,
        "severity": "high",
        "destination_port": 4444,
        "domain": "very-long-anomalous-domain-for-dns-tunneling-detection.xyz",
        "tags": ["encoded_command"],
    }
    vec = extractor.extract_vector(sample_event)
    assert len(vec) == len(FEATURE_SCHEMA)
    assert vec.dtype.name == "float32"

    f_dict = extractor.extract_features_dict(sample_event)
    assert f_dict["is_lolbin"] == 1.0
    assert f_dict["is_nonstandard_port"] == 1.0
    assert f_dict["encoded_cmd_flag"] == 1.0


def test_ml_anomaly_detector_insufficient_data():
    detector = TelemetryAnomalyDetector()
    # If untrained or freshly initialized without fitted estimators
    if not detector.is_fitted:
        res = detector.predict({"risk_score": 50})
        # Strictly verify no fake ML detection
        assert res["status"] == "insufficient_data"
        assert res["is_anomaly"] is False
        assert res["raw_anomaly_score"] == 0.0


def test_ml_anomaly_detector_training_and_inference(tmp_path):
    detector = TelemetryAnomalyDetector()
    detector._model_path = tmp_path / "test_isoforest.joblib"
    detector._meta_path = tmp_path / "test_meta.json"
    detector._settings.ml.min_train_samples = 10

    # Generate 15 baseline clean events
    training_data = []
    for i in range(15):
        training_data.append({
            "process_name": "svchost.exe",
            "risk_score": 5.0,
            "severity": "info",
            "destination_port": 443,
        })

    train_res = detector.train(training_data)
    assert train_res["status"] == "success"
    assert detector.is_fitted is True

    # Test inference on normal event
    normal_pred = detector.predict({"process_name": "svchost.exe", "risk_score": 5.0, "destination_port": 443})
    assert normal_pred["status"] in {"normal", "detected"}

    # Test inference on anomalous deviation
    anom_pred = detector.predict({
        "process_name": "mimikatz.exe",
        "command_line": "-enc malicious_payload",
        "risk_score": 95.0,
        "destination_port": 4444,
        "tags": ["encoded_command", "lsass_access"],
    })
    assert "raw_anomaly_score" in anom_pred
    assert "anomaly_percentile" in anom_pred
