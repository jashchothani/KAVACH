"""
Tests for KAVACH Dedicated URL Security & SSRF Protection Engine.
"""

import pytest
from app.url_security.analyzer import URLSecurityEngine


def test_url_security_trusted():
    engine = URLSecurityEngine()
    res = engine.analyze("https://google.com/search?q=cybersecurity")
    assert res["risk_level"] == "SAFE"
    assert res["risk_score"] == 0.0


def test_url_security_ssrf_protection():
    engine = URLSecurityEngine()

    # Localhost
    res_local = engine.analyze("http://localhost:8000/admin")
    assert res_local["risk_level"] == "CRITICAL"
    assert res_local["is_ssrf_risk"] is True

    # 127.0.0.1
    res_loopback = engine.analyze("http://127.0.0.1:5000/api")
    assert res_loopback["risk_level"] == "CRITICAL"
    assert res_loopback["is_ssrf_risk"] is True

    # Private RFC 1918 IP
    res_priv = engine.analyze("http://192.168.1.1/router-login")
    assert res_priv["risk_level"] == "CRITICAL"
    assert res_priv["is_ssrf_risk"] is True

    # AWS/GCP Metadata endpoint
    res_meta = engine.analyze("http://169.254.169.254/latest/meta-data")
    assert res_meta["risk_level"] == "CRITICAL"
    assert res_meta["is_ssrf_risk"] is True


def test_url_security_punycode_and_phishing():
    engine = URLSecurityEngine()
    res = engine.analyze("http://xn--gogle-pra.xyz/login-verify-account-password")
    assert res["risk_score"] >= 50.0
    assert res["risk_level"] in {"HIGH RISK", "CRITICAL"}
    indicators_str = " ".join(res["indicators"]).lower()
    assert "punycode" in indicators_str
    assert "keywords" in indicators_str
