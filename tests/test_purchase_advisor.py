"""
Unit and Integration Tests for FinOS Purchase Affordability Advisor
Tests all 14 required test cases:
1. User asks about buying a phone without specifying price.
2. User provides a ₹30,000 phone budget.
3. User asks about a ₹70,000 phone.
4. User asks about buying a laptop.
5. User asks about purchasing with EMI.
6. User asks whether waiting until next month is better.
7. User changes the purchase budget.
8. User asks a follow-up question with pronoun resolution.
9. No financial data is loaded.
10. Insufficient historical data (low confidence).
11. Gemini API unavailable (offline deterministic fallback).
12. Purchase creates a future shortage.
13. Purchase remains affordable.
14. Purchase increases shortage probability.
"""

import pytest
import pandas as pd
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.purchase_advisor import PurchaseAdvisorService

client = TestClient(app)

@pytest.fixture
def synthetic_history():
    """Generates 90 days of synthetic financial transaction data."""
    dates = pd.date_range(end="2026-11-14", periods=90, freq="D")
    records = []
    bal = 100000.0
    for d in dates:
        amt = -800.0  # Daily living burn
        cat = "Food & Dining"
        # Bi-weekly freelance income
        if d.day in [1, 15]:
            amt = 45000.0
            cat = "Income"
        elif d.day == 5:
            amt = -16500.0
            cat = "EMI/Loans"
        elif d.day == 2:
            amt = -25000.0
            cat = "Rent"
        bal += amt
        records.append({
            "Date": d.strftime("%Y-%m-%d"),
            "Description": f"Transaction {cat}",
            "Amount": amt,
            "Category": cat,
            "Balance": bal
        })
    return pd.DataFrame(records)

# 1. User asks about buying a phone without specifying price
def test_case_1_missing_price():
    res = client.post("/chat", json={
        "message": "I want to buy a new phone. Can I afford it?",
        "context": {"current_balance": 65000.0, "minimum_safe_balance": 5000.0}
    })
    assert res.status_code == 200
    data = res.json()
    assert "budget" in data["reply"].lower()
    assert "phone" in data["reply"].lower()
    assert data["simulated_result"] is None

# 2. User provides a ₹30,000 phone budget
def test_case_2_phone_budget_30k(synthetic_history):
    res = client.post("/api/ai/purchase-advice", json={
        "message": "Can I buy a phone for ₹30,000?",
        "transactions": synthetic_history.to_dict(orient="records"),
        "current_balance": 95000.0,
        "minimum_safe_balance": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim is not None
    assert sim["amount"] == 30000.0
    assert sim["item"] == "Phone"
    assert sim["category"] in ["AFFORDABLE", "AFFORDABLE WITH CAUTION"]
    assert "30d" in sim["horizons"]
    assert "60d" in sim["horizons"]
    assert "90d" in sim["horizons"]
    assert "₹30,000" in data["reply"] or "30,000" in data["reply"]

# 3. User asks about a ₹70,000 phone (creates heavy strain / shortage)
def test_case_3_phone_budget_70k(synthetic_history):
    res = client.post("/api/ai/purchase-advice", json={
        "message": "Can I buy an iPhone for ₹70,000?",
        "transactions": synthetic_history.to_dict(orient="records"),
        "current_balance": 45000.0,
        "minimum_safe_balance": 10000.0
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["amount"] == 70000.0
    assert sim["category"] == "NOT RECOMMENDED RIGHT NOW"
    assert sim["status_code"] == "NOT_RECOMMENDED"

# 4. User asks about buying a laptop
def test_case_4_laptop_purchase(synthetic_history):
    res = client.post("/chat", json={
        "message": "Can I purchase a laptop for ₹45,000?",
        "transactions": synthetic_history.to_dict(orient="records"),
        "context": {"current_balance": 75000.0, "minimum_safe_balance": 5000.0}
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["item"] == "Laptop"
    assert sim["amount"] == 45000.0
    assert "laptop" in data["reply"].lower()

# 5. User asks about purchasing with EMI
def test_case_5_emi_purchase(synthetic_history):
    res = client.post("/api/ai/purchase-advice", json={
        "message": "Can I buy a ₹60,000 phone on EMI?",
        "transactions": synthetic_history.to_dict(orient="records"),
        "current_balance": 55000.0,
        "minimum_safe_balance": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["is_emi"] is True
    assert sim["emi_amount"] > 0
    assert sim["scenario_type"] == "emi_purchase"

# 6. User asks whether waiting until next month is better
def test_case_6_timing_recommendation(synthetic_history):
    res = client.post("/chat", json={
        "message": "What if I buy this phone next month?",
        "history": [
            {"role": "user", "content": "Can I buy a phone for ₹50,000?"},
            {"role": "assistant", "content": "A ₹50,000 phone is Affordable with Caution."}
        ],
        "transactions": synthetic_history.to_dict(orient="records"),
        "context": {"current_balance": 50000.0, "minimum_safe_balance": 5000.0}
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["item"] == "Phone"
    assert sim["day_offset"] == 30

# 7. User changes the purchase budget
def test_case_7_change_budget(synthetic_history):
    res = client.post("/chat", json={
        "message": "What about ₹20,000?",
        "history": [
            {"role": "user", "content": "Can I buy a phone for ₹50,000?"},
            {"role": "assistant", "content": "A ₹50,000 phone is Not Recommended."}
        ],
        "transactions": synthetic_history.to_dict(orient="records"),
        "context": {"current_balance": 50000.0, "minimum_safe_balance": 5000.0}
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["item"] == "Phone"
    assert sim["amount"] == 20000.0

# 8. User asks follow-up with pronoun resolution
def test_case_8_pronoun_resolution(synthetic_history):
    res = client.post("/chat", json={
        "message": "Can I buy it without affecting my savings?",
        "history": [
            {"role": "user", "content": "Can I buy a laptop for ₹35,000?"},
            {"role": "assistant", "content": "A ₹35,000 laptop is Affordable with Caution."}
        ],
        "transactions": synthetic_history.to_dict(orient="records"),
        "context": {"current_balance": 65000.0, "minimum_safe_balance": 5000.0}
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["item"] == "Laptop"
    assert sim["amount"] == 35000.0

# 9. No financial data loaded
def test_case_9_no_financial_data():
    res = client.post("/api/ai/purchase-advice", json={
        "message": "Can I buy an iPhone for ₹60,000?",
        "transactions": [],
        "current_balance": 0.0
    })
    assert res.status_code == 200
    data = res.json()
    assert "no active financial" in data["reply"].lower() or "upload" in data["reply"].lower()
    assert data["simulated_result"] is None

# 10. Insufficient historical data (Low Confidence)
def test_case_10_low_confidence():
    # Only 5 days of transactions
    dates = pd.date_range(end="2026-11-14", periods=5, freq="D")
    short_df = pd.DataFrame([
        {"Date": d.strftime("%Y-%m-%d"), "Description": "Expense", "Amount": -500.0, "Category": "Food", "Balance": 20000.0}
        for d in dates
    ])
    res = client.post("/api/ai/purchase-advice", json={
        "message": "Can I buy a phone for ₹15,000?",
        "transactions": short_df.to_dict(orient="records"),
        "current_balance": 20000.0,
        "minimum_safe_balance": 2000.0
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["data_confidence"] == "Low Confidence"
    assert "low" in data["reply"].lower() or "confidence" in data["reply"].lower()

# 11. Gemini API unavailable (Deterministic offline fallback)
def test_case_11_offline_fallback(synthetic_history, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    res = client.post("/api/ai/purchase-advice", json={
        "message": "Can I buy a bike for ₹80,000?",
        "transactions": synthetic_history.to_dict(orient="records"),
        "current_balance": 90000.0,
        "minimum_safe_balance": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["offline_fallback_active"] is True
    assert "Bike" in data["simulated_result"]["item"]
    assert "₹80,000" in data["reply"] or "80,000" in data["reply"]

# 12. Purchase creates a future shortage
def test_case_12_shortage_creation(synthetic_history):
    res = client.post("/api/ai/purchase-advice", json={
        "item": "Luxury Watch",
        "amount": 95000.0,
        "transactions": synthetic_history.to_dict(orient="records"),
        "current_balance": 50000.0,
        "minimum_safe_balance": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["category"] == "NOT RECOMMENDED RIGHT NOW"
    assert sim["simulated_risk"] > 50.0

# 13. Purchase remains affordable
def test_case_13_affordable_purchase(synthetic_history):
    res = client.post("/api/ai/purchase-advice", json={
        "item": "Book & Stationery",
        "amount": 2500.0,
        "transactions": synthetic_history.to_dict(orient="records"),
        "current_balance": 95000.0,
        "minimum_safe_balance": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["category"] == "AFFORDABLE"
    assert sim["status_code"] == "AFFORDABLE"
    assert sim["simulated_risk"] <= 20.0

# 14. Purchase increases shortage probability
def test_case_14_risk_increase(synthetic_history):
    res = client.post("/api/ai/purchase-advice", json={
        "item": "Electronics",
        "amount": 35000.0,
        "transactions": synthetic_history.to_dict(orient="records"),
        "current_balance": 60000.0,
        "minimum_safe_balance": 5000.0
    })
    assert res.status_code == 200
    data = res.json()
    sim = data["simulated_result"]
    assert sim["risk_delta"] >= 0.0
    assert "baseline_risk" in sim
    assert "simulated_risk" in sim
