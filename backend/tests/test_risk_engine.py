"""
Tests for KAVACH Rule Engine and Hybrid Risk Engine.
"""

import pytest
from app.detection.rule_engine import RuleEngine
from app.detection.risk_engine import HybridRiskEngine


def test_rule_engine_lolbin_and_encoded():
    engine = RuleEngine()
    event = {
        "process_name": "powershell.exe",
        "command_line": "powershell.exe -enc aW1wb3J0...",
        "tags": ["encoded_command"],
    }
    res = engine.evaluate(event)
    assert res["matched_count"] >= 1
    assert res["rule_score"] >= 60.0
    assert res["primary_mitre"]["technique_id"] in {"T1027", "T1218"}


def test_hybrid_risk_engine_dynamic_weights():
    engine = HybridRiskEngine()

    # Case 1: When ML has insufficient data, weights normalize across available signals
    res = engine.calculate_risk(
        rule_score=80.0,
        rule_matches=[{"name": "Encoded PowerShell", "mitre_id": "T1027"}],
        ml_res={"status": "insufficient_data"},
        ti_score=0.0,
        behavior_score=20.0,
    )

    assert res["risk_score"] > 0.0
    assert res["risk_level"] in {"HIGH", "CRITICAL"}
    assert "why_explanation" in res
    assert "summary" in res["why_explanation"]
    assert "evidence" in res["why_explanation"]
