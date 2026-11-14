import pytest
import datetime
import pandas as pd
import numpy as np

from backend.ingestion import StatementParser
from backend.ml_engine import (
    PrivacyMasker,
    AutoCategorizer,
    RecurringPaymentDetector,
    CashFlowForecaster,
    AnomalyDetector,
    FinancialExplainer
)


def test_amount_cleaner():
    assert StatementParser.clean_amount_value("1,250.50") == 1250.50
    assert StatementParser.clean_amount_value("-500.00") == -500.00
    assert StatementParser.clean_amount_value("₹ 2,400.00 Dr") == -2400.00
    assert StatementParser.clean_amount_value("3500.00 Cr") == 3500.00
    assert StatementParser.clean_amount_value(None) == 0.0


def test_privacy_masker():
    text = "Paid to 9845012345 via ramesha@okaxis with UTR 412345678901 and PAN ABCDE1234F"
    masked, stats = PrivacyMasker.mask_text(text)
    assert "9845012345" not in masked
    assert "XXXXXX345" in masked
    assert "ramesha@okaxis" not in masked
    assert "r***@okaxis" in masked
    assert "412345678901" not in masked
    assert "UTR-XXXXXX" in masked
    assert stats["phones_masked"] >= 1
    assert stats["upi_masked"] >= 1
    assert stats["utr_masked"] >= 1


def test_auto_categorizer_heuristics():
    cat = AutoCategorizer()
    res1 = cat.predict("UPI/123/Swiggy Bangalore/swiggy@icici", -450.0)
    assert res1["category"] == "Food"

    res2 = cat.predict("BESCOM Electricity Bill Online", -1200.0)
    assert res2["category"] == "Bills & Utilities"

    res3 = cat.predict("Zerodha Broking Equity Shares", -5000.0)
    assert res3["category"] == "Investments"

    res4 = cat.predict("Upwork Escrow Milestone Payout", 65000.0)
    assert res4["category"] == "Income"


def test_monte_carlo_forecaster():
    # Construct a minimal DataFrame
    dates = pd.date_range(start="2024-01-01", periods=60, freq="D")
    amounts = [-500.0] * 60
    amounts[5] = 75000.0
    amounts[35] = 75000.0
    df = pd.DataFrame({
        "Date": dates.strftime("%Y-%m-%d"),
        "Description": ["Daily spend"] * 60,
        "Amount": amounts,
        "Category": ["Food"] * 60
    })
    df.loc[5, "Category"] = "Income"
    df.loc[35, "Category"] = "Income"

    res = CashFlowForecaster.run_monte_carlo(
        df=df,
        current_balance=50000.0,
        forecast_days=30,
        num_simulations=100,
        minimum_safe_balance=5000.0
    )

    assert res["forecast_days"] == 30
    assert len(res["forecast"]) == 30
    assert "p10" in res["forecast"][0]
    assert "p50" in res["forecast"][0]
    assert "p90" in res["forecast"][0]
    assert 0.0 <= res["prob_below_safe_balance"] <= 100.0
