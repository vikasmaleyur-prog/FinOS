import os
import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from backend.ingestion import StatementParser
from backend.ml_engine import (
    CashFlowForecaster,
    SpendingLimitOptimizer,
    BacktestEngine,
    FinancialExplainer
)

client = TestClient(app)
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "synthetic_transactions.csv")


def test_simulation_fixes_and_sufficiency():
    with open(DATA_PATH, "rb") as f:
        df, _ = StatementParser.parse_csv(f.read(), 75000.0)

    res = CashFlowForecaster.run_monte_carlo(
        df=df,
        current_balance=50000.0,
        forecast_days=30,
        num_simulations=100,
        minimum_safe_balance=5000.0
    )

    # Verify data sufficiency badge
    assert "data_sufficiency" in res
    assert res["data_sufficiency"]["level"] in ["LOW", "MODERATE", "HIGH"]
    assert "badge" in res["data_sufficiency"]

    # Verify simulation-derived explainability drivers
    assert "bills_before_inflow" in res
    assert "expected_inflow_gap_days" in res
    assert res["expected_inflow_gap_days"] > 0
    assert "top_drivers" in res
    assert len(res["top_drivers"]) <= 3


def test_spending_limits_binary_search():
    with open(DATA_PATH, "rb") as f:
        df, _ = StatementParser.parse_csv(f.read(), 75000.0)

    # 1. Standard balance test where safe cap can be found
    limits = SpendingLimitOptimizer.calculate_optimal_limits(
        df=df,
        current_balance=150000.0,
        minimum_safe_balance=5000.0,
        target_max_breach_prob=10.0
    )

    assert "recommended_daily_cap" in limits
    assert limits["recommended_daily_cap"] > 0.0
    assert "top_category_caps" in limits
    assert len(limits["top_category_caps"]) <= 3
    assert limits["breach_prob_at_cap"] <= 12.0  # target <= 10%, within Monte Carlo tolerance

    # 2. Extreme low balance test where fixed commitments alone exceed balance
    low_limits = SpendingLimitOptimizer.calculate_optimal_limits(
        df=df,
        current_balance=25000.0,
        minimum_safe_balance=5000.0,
        target_max_breach_prob=10.0
    )
    assert low_limits["recommended_daily_cap"] <= 10.0


def test_backtest_rolling_origin():
    with open(DATA_PATH, "rb") as f:
        df, _ = StatementParser.parse_csv(f.read(), 75000.0)

    backtest = BacktestEngine.run_rolling_backtest(
        df=df,
        initial_balance=75000.0,
        test_window_days=30
    )

    assert backtest["status"] == "success"
    assert "metrics" in backtest
    metrics = backtest["metrics"]
    assert "model_mae" in metrics
    assert "naive_mae" in metrics
    assert "calibration_80_pct" in metrics
    assert "pct_improvement_mae" in metrics
    # Verify timeline chart points
    assert len(backtest["timeline"]) > 0
    assert "forecast_p50" in backtest["timeline"][0]
    assert "actual" in backtest["timeline"][0]


def test_api_endpoints_phase1():
    # Test GET /limits
    res_limits = client.get("/limits")
    assert res_limits.status_code == 200
    limits_data = res_limits.json()
    assert "recommended_daily_cap" in limits_data

    # Test GET /backtest
    res_backtest = client.get("/backtest")
    assert res_backtest.status_code == 200
    backtest_data = res_backtest.json()
    assert "metrics" in backtest_data
    assert "calibration_80_pct" in backtest_data["metrics"]
