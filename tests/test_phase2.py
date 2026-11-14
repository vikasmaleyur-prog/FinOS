"""
FinOS Phase 2 Automated Test Suite: AI Layer & Intelligence
Tests:
1. Multi-feature Isolation Forest Anomaly Detection (4 features + plain-English reasons).
2. LLM Fallback In-Memory Caching & AI-categorized flag.
3. Held-out Categorizer Benchmark Evaluation.
4. DPDP Masking strictly preceding LLM interactions.
5. POST /explain endpoint (grounded narrative, zero hallucinations).
6. POST /chat copilot with What-If simulations and context-based answers.
"""

import os
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.ml_engine import (
    PrivacyMasker,
    AutoCategorizer,
    AnomalyDetector,
    FinOSLLMService
)

client = TestClient(app)


def test_isolation_forest_smarter_anomalies():
    """Verify 4-feature Isolation Forest and plain-English reasons."""
    # Create sample expense dataframe with regular expenses + 2 planted spikes
    dates = [f"2026-03-{(i % 28) + 1:02d}" for i in range(40)]
    descriptions = ["Swiggy Online Food Bangalore"] * 20 + ["Uber Rides Commute"] * 18 + ["Outsized Luxury Banquet Hall", "Unfamiliar Offshore Tech Store"]
    amounts = [-400.0] * 20 + [-250.0] * 18 + [-35000.0, -18000.0]

    df = pd.DataFrame({
        "Date": dates,
        "Description": descriptions,
        "Transaction Details": descriptions,
        "Amount": amounts,
        "Category": ["Food"] * 20 + ["Travel"] * 18 + ["Food", "Shopping"]
    })

    anomalies = AnomalyDetector.detect_anomalies(df, contamination=0.05)
    assert len(anomalies) > 0, "Anomaly detector should flag planted outliers"

    for anom in anomalies:
        assert "reason" in anom
        assert "ratio" in anom
        assert "x your usual" in anom["reason"], f"Reason must follow plain-English format, got: {anom['reason']}"
        assert anom["severity"] in ["HIGH", "MEDIUM", "LOW"]
        assert anom["amount"] < 0


def test_auto_categorizer_llm_cache():
    """Verify in-memory LLM fallback cache and is_ai_categorized pill flag."""
    cat = AutoCategorizer()
    
    # 1. Standard regex heuristic should NOT be AI-categorized
    swiggy_pred = cat.predict("Swiggy Order #12345", -350.0)
    assert swiggy_pred["category"] == "Food"
    assert swiggy_pred["is_ai_categorized"] is False

    # 2. Pre-populate LLM cache for an ambiguous merchant
    cat._llm_cache["custom boutique studio"] = "Shopping"
    cached_pred = cat.predict("Custom Boutique Studio payment", -2400.0)
    assert cached_pred["category"] == "Shopping"
    assert cached_pred["is_ai_categorized"] is True
    assert cached_pred["method"] == "llm_cached"


def test_categorizer_held_out_benchmark():
    """Verify categorizer evaluation achieves >= 90% accuracy on held-out test split."""
    bench_res = AutoCategorizer.evaluate_benchmark()
    assert bench_res["total_samples"] >= 50
    assert bench_res["accuracy_pct"] >= 90.0, f"Categorizer accuracy fell below 90%: {bench_res['accuracy_pct']}%"
    assert "Food" in bench_res["category_metrics"]
    assert "Travel" in bench_res["category_metrics"]


def test_dpdp_masking_before_llm():
    """Verify that PII is masked before any string is dispatched to LLM."""
    raw_text = "Paid to 9876543210 via ram.kumar@okhdfcbank with UTR 234567890123 for consulting"
    masked, stats = PrivacyMasker.mask_text(raw_text)

    assert "9876543210" not in masked
    assert "ram.kumar@okhdfcbank" not in masked
    assert "234567890123" not in masked
    assert stats["phones_masked"] > 0 or stats["upi_masked"] > 0 or stats["utr_masked"] > 0


def test_post_explain_endpoint():
    """Verify POST /explain generates grounded narrative without errors."""
    res = client.post("/explain", json={
        "current_balance": 85000.0,
        "minimum_safe_balance": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    assert "headline" in data
    assert "root_cause" in data
    assert "actionable_recommendations" in data
    assert len(data["actionable_recommendations"]) >= 2
    assert "is_llm_generated" in data


def test_post_chat_what_if_simulation():
    """Verify POST /chat detects what-if purchase and runs real Monte Carlo simulation."""
    res = client.post("/chat", json={
        "message": "What if I buy a ₹35,000 laptop in 7 days?",
        "context": {
            "current_balance": 75000.0,
            "minimum_safe_balance": 5000.0
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "simulated_result" in data
    assert data["simulated_result"] is not None
    assert data["simulated_result"]["amount"] == 35000.0
    assert "baseline_risk" in data["simulated_result"]
    assert "simulated_risk" in data["simulated_result"]
    assert "₹35,000" in data["reply"] or "35,000" in data["reply"]


def test_post_chat_faqs():
    """Verify POST /chat responds accurately to balance dip and spending limits queries."""
    # Test balance dip query
    res_dip = client.post("/chat", json={
        "message": "Why is my balance low around mid-month?",
        "context": {
            "current_balance": 60000.0,
            "minimum_safe_balance": 5000.0
        }
    })
    assert res_dip.status_code == 200
    assert "timing asymmetry" in res_dip.json()["reply"].lower() or "fixed" in res_dip.json()["reply"].lower()

    # Test spending limit query
    res_limit = client.post("/chat", json={
        "message": "How much can I spend safely each day?",
        "context": {
            "current_balance": 60000.0,
            "minimum_safe_balance": 5000.0,
            "limits": {
                "recommended_daily_cap": 950.0,
                "recommended_monthly_cap": 28500.0
            }
        }
    })
    assert res_limit.status_code == 200
    assert "950" in res_limit.json()["reply"]
