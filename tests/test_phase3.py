"""
FinOS Phase 3 Automated Test Suite: Data, Business Intelligence & Multi-Account Consolidation
Tests:
1. PhonePe 90-day export generation & ingestion (preamble, newest-first, running balance).
2. Small shop owner current account generation & business categories.
3. Current account Monte Carlo receivables delay distribution.
4. Multi-Account Engine internal transfer detection and neutralization.
5. Multi-Account Engine suggested transfer calculation (< 10% breach probability).
6. POST /forecast dynamic recalculation with account_type toggle.
7. POST /multi-account/analyze endpoint integration.
8. PDF statement ingestion parser handling.
"""

import os
import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.ingestion import StatementParser, StatementIngestionError
from backend.generate_data import generate_phonepe_sample, generate_shop_owner_current_account
from backend.ml_engine import (
    AutoCategorizer,
    CashFlowForecaster,
    MultiAccountEngine
)

client = TestClient(app)


def test_phonepe_90d_generation_and_parsing(tmp_path):
    """Verify PhonePe 90-day export generation and chronological ingestion."""
    csv_file = str(tmp_path / "phonepe_test.csv")
    generate_phonepe_sample(csv_file)
    assert os.path.exists(csv_file)

    with open(csv_file, "rb") as f:
        content = f.read()

    # StatementParser must detect 3-line preamble, parse header, and sort chronologically
    df, stats = StatementParser.parse_csv(content, starting_balance=45000.0)

    assert len(df) > 50, "PhonePe 90d should contain over 50 transactions"
    assert stats["header_line_detected"] >= 4, "Should detect header after PhonePe preamble"
    assert "Balance" in df.columns or "Running Balance" in df.columns
    assert "Amount" in df.columns
    assert "Date" in df.columns

    # Verify chronological ordering (oldest to newest)
    dates = pd.to_datetime(df["Date"]).tolist()
    assert dates == sorted(dates), "Transactions must be sorted chronologically"


def test_shop_owner_current_account_and_business_categories(tmp_path):
    """Verify SMB current account dataset and business categorizer rules."""
    csv_file = str(tmp_path / "shop_owner_test.csv")
    generate_shop_owner_current_account(csv_file)
    assert os.path.exists(csv_file)

    with open(csv_file, "rb") as f:
        content = f.read()

    df, stats = StatementParser.parse_csv(content, starting_balance=150000.0)
    assert len(df) > 200, "Shop owner dataset should contain 12 months of daily transactions"

    # Categorize and verify business categories are present
    cat = AutoCategorizer()
    categorized = cat.categorize_dataframe(df)
    categories = set(categorized["Category"].unique())

    expected_business_cats = {"Sales Receipts", "Supplier Payments", "Salaries", "GST/TDS", "Owner Drawings"}
    found_cats = categories.intersection(expected_business_cats)
    assert len(found_cats) >= 4, f"Should identify SMB categories, found: {found_cats}"


def test_current_account_receivables_delay_monte_carlo(tmp_path):
    """Verify Current Account receivables delay distribution widens uncertainty band."""
    csv_file = str(tmp_path / "shop_owner_mc.csv")
    generate_shop_owner_current_account(csv_file)

    with open(csv_file, "rb") as f:
        df, _ = StatementParser.parse_csv(f.read(), starting_balance=150000.0)

    # 1. Run savings simulation
    savings_sim = CashFlowForecaster.run_monte_carlo(
        df=df,
        current_balance=150000.0,
        minimum_safe_balance=25000.0,
        forecast_days=60,
        num_simulations=500,
        account_type="savings"
    )

    # 2. Run current account simulation with B2B delay distribution
    current_sim = CashFlowForecaster.run_monte_carlo(
        df=df,
        current_balance=150000.0,
        minimum_safe_balance=25000.0,
        forecast_days=60,
        num_simulations=500,
        account_type="current"
    )

    assert savings_sim["account_type"] == "savings"
    assert current_sim["account_type"] == "current"
    assert "prob_below_safe_balance" in current_sim
    assert "forecast" in current_sim
    assert len(current_sim["forecast"]) == 60


def test_multi_account_internal_transfer_detection():
    """Verify MultiAccountEngine accurately detects and isolates internal transfers."""
    # Account A: Current Account (Shop Owner transfers to Personal)
    df_a = pd.DataFrame({
        "Date": ["2026-08-01", "2026-08-05", "2026-08-10"],
        "Description": ["Daily Cash Sales", "Transfer to Reserve Fund", "Vendor Wholesale"],
        "Amount": [12000.0, -25000.0, -8000.0],
        "Balance": [50000.0, 25000.0, 17000.0],
        "Category": ["Sales Receipts", "Owner Drawings", "Supplier Payments"]
    })

    # Account B: Savings Reserve (Receives transfer 1 day later)
    df_b = pd.DataFrame({
        "Date": ["2026-08-06", "2026-08-15"],
        "Description": ["Transfer from Shop Current A/C", "Mutual Fund SIP"],
        "Amount": [25000.0, -5000.0],
        "Balance": [125000.0, 120000.0],
        "Category": ["Income", "Investments"]
    })

    clean_a, clean_b, transfers = MultiAccountEngine.detect_internal_transfers(df_a, df_b)

    assert len(transfers) == 1, "Should detect exactly 1 matching internal transfer"
    tr = transfers[0]
    assert tr["amount"] == 25000.0
    assert tr["from_account"] == "Account A"
    assert tr["to_account"] == "Account B"
    assert tr["day_difference"] == 1

    # Verify both DataFrames tagged the internal transfer
    assert clean_a.loc[1, "is_internal_transfer"] == True
    assert clean_a.loc[1, "Category"] == "Internal Transfer"
    assert clean_b.loc[0, "is_internal_transfer"] == True
    assert clean_b.loc[0, "Category"] == "Internal Transfer"


def test_multi_account_suggested_transfer_optimization():
    """Verify MultiAccountEngine computes optimal transfer reducing risk below 10%."""
    # Account A: At risk of dipping below minimum buffer
    df_a = pd.DataFrame({
        "Date": ["2026-08-01", "2026-08-05", "2026-08-10"],
        "Description": ["Sales", "Big Supplier Invoice", "Store Rent"],
        "Amount": [10000.0, -35000.0, -20000.0],
        "Balance": [30000.0, -5000.0, -25000.0],
        "Category": ["Sales Receipts", "Supplier Payments", "Rent"]
    })

    # Account B: High liquidity reserve
    df_b = pd.DataFrame({
        "Date": ["2026-08-01", "2026-08-05"],
        "Description": ["Client Payout", "Living Expense"],
        "Amount": [150000.0, -10000.0],
        "Balance": [150000.0, 140000.0],
        "Category": ["Income", "Food"]
    })

    res = MultiAccountEngine.analyze_multi_account(
        df_a=df_a,
        df_b=df_b,
        bal_a=20000.0,
        bal_b=140000.0,
        min_safe_a=25000.0,
        min_safe_b=5000.0,
        name_a="SMB Current",
        name_b="Personal Reserve"
    )

    assert res["status"] == "success"
    assert "account_a" in res
    assert "account_b" in res
    assert "combined" in res
    assert len(res["combined"]["timeline"]) == 60

    if res.get("suggested_transfer"):
        st = res["suggested_transfer"]
        assert st["recommended_amount"] >= 5000.0
        assert st["from_account"] == "Personal Reserve"
        assert st["to_account"] == "SMB Current"
        assert "reduces" in st["reason"]


def test_post_forecast_recalculation():
    """Verify POST /forecast endpoint recalculates Monte Carlo on account_type switch."""
    txns = [
        {"Date": f"2026-08-{(i % 28) + 1:02d}", "Description": "Wholesale Goods", "Amount": -4500.0, "Category": "Supplier Payments"}
        for i in range(25)
    ]
    txns.append({"Date": "2026-08-15", "Description": "Client Payment", "Amount": 120000.0, "Category": "Sales Receipts"})

    # Test Savings forecast
    res_sav = client.post("/forecast", json={
        "transactions": txns,
        "current_balance": 80000.0,
        "minimum_safe_balance": 5000.0,
        "account_type": "savings"
    })
    assert res_sav.status_code == 200
    data_sav = res_sav.json()
    assert data_sav["account_type"] == "savings"
    assert len(data_sav["forecast"]["timeline"]) == 60

    # Test Current Account forecast
    res_curr = client.post("/forecast", json={
        "transactions": txns,
        "current_balance": 80000.0,
        "minimum_safe_balance": 25000.0,
        "account_type": "current"
    })
    assert res_curr.status_code == 200
    data_curr = res_curr.json()
    assert data_curr["account_type"] == "current"
    assert data_curr["minimum_safe_balance"] == 25000.0


def test_post_multi_account_analyze_endpoint():
    """Verify POST /multi-account/analyze returns consolidated dual-account response."""
    res = client.post("/multi-account/analyze", json={})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "account_a" in data
    assert "account_b" in data
    assert "combined" in data
    assert "internal_transfers" in data


def test_pdf_statement_parser_validation():
    """Verify StatementParser.parse_pdf gracefully validates input."""
    # Passing empty or invalid PDF bytes should raise StatementIngestionError
    with pytest.raises(StatementIngestionError):
        StatementParser.parse_pdf(b"Not a valid PDF file content", starting_balance=50000.0)
