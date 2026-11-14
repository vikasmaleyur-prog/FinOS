import os
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from backend.ingestion import StatementParser
from backend.ml_engine import (
    AutoCategorizer,
    RecurringPaymentDetector,
    CashFlowForecaster,
    SpendingLimitOptimizer,
    AnomalyDetector,
    BacktestEngine,
    FinOSLLMService
)

client = TestClient(app)
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "synthetic_transactions.csv")


def test_google_genai_sdk_and_offline_fallback():
    """Verify FinOSLLMService provides structured status and offline fallback when API key is missing."""
    ctx = {
        "current_balance": 80000.0,
        "minimum_safe_balance": 5000.0,
        "forecast": {
            "forecast_meta": {"prob_below_safe_balance": 12.0, "risk_level": "HEALTHY"},
            "burn_metrics": {"mean_daily_burn": 950.0}
        },
        "limits": {"recommended_daily_cap": 850.0}
    }
    res = FinOSLLMService.chat_copilot(message="Why is my balance low?", context=ctx)
    assert "reply" in res
    assert "is_llm_generated" in res
    assert "is_llm_active" in res
    assert "llm_provider" in res
    assert "offline_fallback_active" in res
    if not os.environ.get("GEMINI_API_KEY"):
        assert res["offline_fallback_active"] is True
        assert "Offline Mode" in res["reply"]


def test_manual_category_correction():
    """Verify manual category override via AutoCategorizer and POST /categorize/correct."""
    cat = AutoCategorizer()
    desc = "Cloudflare Domain Registration Services"
    # Initial classification
    pred_init = cat.predict(desc, -1200.0)
    
    # Apply manual correction
    res = client.post("/categorize/correct", json={
        "description": desc,
        "category": "Subscriptions"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["new_category"] == "Subscriptions"

    # Test that AutoCategorizer records user correction
    cat.record_user_correction(desc, "Subscriptions")
    pred_after = cat.predict(desc, -1200.0)
    assert pred_after["category"] == "Subscriptions"
    assert pred_after["method"] == "user_override"


def test_insurance_category_detection():
    """Verify insurance merchants are categorized into Insurance."""
    cat = AutoCategorizer()
    for desc in ["LIC Monthly Premium Debit", "ICICI Prudential Life Insurance ECS", "Star Health Insurance Premium"]:
        pred = cat.predict(desc, -3500.0)
        assert pred["category"] == "Insurance", f"Expected Insurance for '{desc}', got '{pred['category']}'"


def test_multi_horizon_and_zero_breach_forecasting():
    """Verify Monte Carlo produces multi-horizon metrics (7, 15, 30, 60, 90d) and prob_below_zero."""
    with open(DATA_PATH, "rb") as f:
        df, _ = StatementParser.parse_csv(f.read(), 75000.0)

    res = CashFlowForecaster.run_monte_carlo(
        df=df,
        current_balance=60000.0,
        forecast_days=90,
        num_simulations=150,
        minimum_safe_balance=5000.0
    )

    assert "prob_below_zero" in res
    assert isinstance(res["prob_below_zero"], float)
    assert "expected_future_balance" in res
    assert "horizon_metrics" in res
    hm = res["horizon_metrics"]
    for horizon in ["7d", "15d", "30d", "60d", "90d"]:
        assert horizon in hm
        assert "p50" in hm[horizon]
        assert "prob_below_safe_balance" in hm[horizon]
        assert "prob_below_zero" in hm[horizon]


def test_duplicate_payment_anomaly_detection():
    """Verify AnomalyDetector identifies duplicate payments within 48 hours."""
    df = pd.DataFrame({
        "Date": [
            "2026-08-01", "2026-08-02", "2026-08-05", "2026-08-06", "2026-08-10",
            "2026-08-12", "2026-08-14", "2026-08-15", "2026-08-18", "2026-08-20"
        ],
        "Description": [
            "Swiggy Delivery", "Swiggy Delivery", "Uber India", "Blue Tokai Coffee", "Zepto Groceries",
            "Chai Point", "Amazon Shopping", "Airtel Fiber", "Petrol Pump", "McDonalds Meal"
        ],
        "Amount": [
            -850.0, -850.0, -320.0, -250.0, -450.0,
            -120.0, -1499.0, -1178.0, -2000.0, -450.0
        ],
        "Category": [
            "Food", "Food", "Travel", "Food", "Food",
            "Food", "Shopping", "Bills & Utilities", "Travel", "Food"
        ]
    })

    anomalies = AnomalyDetector.detect_anomalies(df)
    dup = [a for a in anomalies if "duplicate payment" in a["reason"].lower()]
    assert len(dup) >= 1, "Should flag duplicate Swiggy payment within 48h"
    assert dup[0]["severity"] == "HIGH"


def test_spending_limits_weekly_cap():
    """Verify SpendingLimitOptimizer computes recommended weekly cap."""
    with open(DATA_PATH, "rb") as f:
        df, _ = StatementParser.parse_csv(f.read(), 75000.0)

    limits = SpendingLimitOptimizer.calculate_optimal_limits(
        df=df,
        current_balance=120000.0,
        minimum_safe_balance=5000.0,
        target_max_breach_prob=10.0
    )
    assert "recommended_weekly_cap" in limits
    assert limits["recommended_weekly_cap"] == round(limits["recommended_daily_cap"] * 7, 2)
    assert "current_weekly_burn" in limits
    for cat in limits.get("top_category_caps", []):
        assert "weekly_cap" in cat


def test_backtest_rmse_computation():
    """Verify BacktestEngine computes RMSE and % improvement over baseline."""
    with open(DATA_PATH, "rb") as f:
        df, _ = StatementParser.parse_csv(f.read(), 75000.0)

    bt = BacktestEngine.run_rolling_backtest(df, initial_balance=75000.0, test_window_days=30)
    metrics = bt["metrics"]
    assert "model_rmse" in metrics
    assert "naive_rmse" in metrics
    assert "pct_improvement_rmse" in metrics
    assert metrics["model_rmse"] > 0


def test_what_if_simulator_scenarios():
    """Verify /simulate endpoint handles loan inflows and returns comparative safe limits."""
    res = client.post("/simulate", json={
        "current_balance": 85000.0,
        "minimum_safe_balance": 5000.0,
        "lump_sum_inflow": 100000.0,
        "new_recurring_emis": [
            {"name": "Loan EMI", "amount": 15000.0, "day_of_month": 5, "duration_months": 6}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    delta = data["delta_metrics"]
    assert "baseline_safe_limit" in delta
    assert "simulated_safe_limit" in delta
    assert "baseline_ending_balance" in delta
    assert "simulated_ending_balance" in delta
