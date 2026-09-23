"""
KAVACH Hybrid Risk Scoring Engine.

Combines Deterministic Rules (30%), ML Anomaly Detection (30%), Threat Intelligence (25%),
and Behavioral Indicators (15%) with dynamic weight normalization when signals are unavailable.
Generates plain-English explainability for Normal User Mode and technical breakdowns for analysts.
"""

from __future__ import annotations

from typing import Any


class HybridRiskEngine:
    """Calculates multi-signal risk scores with dynamic weight normalization."""

    DEFAULT_WEIGHTS = {
        "rules": 0.30,
        "ml": 0.30,
        "threat_intel": 0.25,
        "behavior": 0.15,
    }

    SEVERITY_LEVELS = [
        (85.0, "CRITICAL"),
        (65.0, "HIGH"),
        (40.0, "MEDIUM"),
        (20.0, "LOW"),
        (0.0, "SAFE"),
    ]

    def calculate_risk(
        self,
        *,
        rule_score: float,
        rule_matches: list[dict[str, Any]],
        ml_res: dict[str, Any],
        ti_score: float = 0.0,
        behavior_score: float = 0.0,
    ) -> dict[str, Any]:
        """
        Calculate normalized risk score across available signals.
        """
        active_weights: dict[str, float] = {}
        scores: dict[str, float] = {}
        evidence_items: list[str] = []

        # 1. Rule signal (always active if rules ran)
        active_weights["rules"] = self.DEFAULT_WEIGHTS["rules"]
        scores["rules"] = max(0.0, min(100.0, rule_score))
        for m in rule_matches:
            evidence_items.append(f"Rule match: {m['name']} ({m.get('mitre_id', '')})")

        # 2. ML signal (only active if model is trained and returned predictions)
        ml_status = ml_res.get("status", "insufficient_data")
        if ml_status != "insufficient_data" and "anomaly_percentile" in ml_res:
            active_weights["ml"] = self.DEFAULT_WEIGHTS["ml"]
            ml_scaled = float(ml_res.get("anomaly_percentile", 0.0)) * 100.0
            scores["ml"] = max(0.0, min(100.0, ml_scaled))
            if ml_res.get("is_anomaly"):
                evidence_items.append(f"ML Anomaly: {ml_res.get('explanation', 'Statistical deviation detected')}")
        else:
            scores["ml"] = 0.0

        # 3. Threat Intelligence signal (active if TI match or explicit score available)
        if ti_score is not None and ti_score > 0.0:
            active_weights["threat_intel"] = self.DEFAULT_WEIGHTS["threat_intel"]
            scores["threat_intel"] = max(0.0, min(100.0, ti_score))
            evidence_items.append(f"Threat Intelligence: IOC correlation match (score: {ti_score:.0f})")
        else:
            scores["threat_intel"] = 0.0

        # 4. Behavioral score (active if behavior metrics were evaluated)
        if behavior_score is not None and behavior_score > 0.0:
            active_weights["behavior"] = self.DEFAULT_WEIGHTS["behavior"]
            scores["behavior"] = max(0.0, min(100.0, behavior_score))
            if behavior_score > 30:
                evidence_items.append("Behavioral: Unusual burst rate or non-standard port deviation")
        else:
            scores["behavior"] = 0.0

        # Dynamic Normalization: sum(active_weights) normalizes to 1.0 across AVAILABLE signals
        total_active_weight = sum(active_weights.values())
        if total_active_weight <= 0.0:
            total_active_weight = 1.0

        weighted_sum = sum(scores[k] * (active_weights[k] / total_active_weight) for k in active_weights)
        
        # Max signal anchor: Prevent signal dilution where lack of secondary hits
        # artificially suppresses a high-confidence deterministic detection
        max_signal = max(scores.values()) if scores else 0.0
        if max_signal > weighted_sum:
            blended_score = (0.5 * max_signal) + (0.5 * weighted_sum)
        else:
            blended_score = weighted_sum

        final_risk_score = round(max(0.0, min(100.0, blended_score)), 1)

        # Determine categorical level
        risk_level = "SAFE"
        for threshold, level in self.SEVERITY_LEVELS:
            if final_risk_score >= threshold:
                risk_level = level
                break

        # Calculate confidence & evidence coverage
        available_signal_count = len(active_weights)
        max_possible_signals = 4
        evidence_coverage = round(available_signal_count / max_possible_signals, 2)
        confidence = round(min(1.0, 0.4 + (0.3 if rule_matches else 0.0) + (0.3 if ml_status != "insufficient_data" else 0.0)), 2)

        # Human-readable explanation for Normal User Mode
        if final_risk_score >= 85:
            summary = "Critical security anomaly detected that requires immediate containment."
        elif final_risk_score >= 65:
            summary = "High-risk suspicious activity identified. System behavior deviates from normal patterns."
        elif final_risk_score >= 40:
            summary = "Moderate anomaly observed. Monitored for correlation."
        elif final_risk_score >= 20:
            summary = "Low-level system deviation within acceptable operational thresholds."
        else:
            summary = "System behavior is verified safe and normal."

        why_explanation = {
            "summary": summary,
            "evidence": evidence_items if evidence_items else ["Routine system baseline activity"],
            "recommendation": (
                "Review incident details and execute recommended containment playbook."
                if final_risk_score >= 65
                else "No action needed. KAVACH continues real-time background protection."
            ),
        }

        return {
            "risk_score": final_risk_score,
            "risk_level": risk_level,
            "confidence": confidence,
            "evidence_coverage": evidence_coverage,
            "breakdown": {
                "rules": round(scores.get("rules", 0.0), 1),
                "ml": round(scores.get("ml", 0.0), 1),
                "threat_intel": round(scores.get("threat_intel", 0.0), 1),
                "behavior": round(scores.get("behavior", 0.0), 1),
            },
            "weights_applied": {k: round(v / total_active_weight, 2) for k, v in active_weights.items()},
            "why_explanation": why_explanation,
        }
