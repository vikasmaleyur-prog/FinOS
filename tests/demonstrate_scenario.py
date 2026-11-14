"""
FinOS Complete Hackathon Workflow Demonstration
Sequence:
1. Load Freelancer dataset (/sample/load)
2. Analyze transactions (summary, recurring, categorization, anomalies)
3. Predict cash shortage (Monte Carlo forecast, breach date, risk drivers)
4. Ask FinOS (Natural-language financial Q&A using calculated context)
5. Simulate ₹30,000 laptop purchase (/simulate)
6. Compare financial risk (Baseline vs Simulated risk, ending balance, safe limit)
7. View historical backtesting (Rolling-origin cross validation, MAE, RMSE, Calibration)
"""

import os
import sys
import json
import requests

sys.path.insert(0, os.path.abspath("."))

BACKEND_URL = "http://127.0.0.1:8000"

def run_demonstration():
    print("=" * 80)
    print("FINOS COMPLETE WORKFLOW DEMONSTRATION")
    print("Scenario: Freelancer Cash Flow Analysis -> Ask FinOS -> ₹30k Laptop What-If -> Backtest")
    print("=" * 80)

    # -------------------------------------------------------------
    # Step 1: Load Freelancer dataset
    # -------------------------------------------------------------
    print("\n[STEP 1] Loading Reference Freelancer Dataset (24 Months, ₹75,000 Starting Balance)...")
    res1 = requests.post(f"{BACKEND_URL}/sample/load", json={
        "dataset_name": "freelancer",
        "starting_balance": 75000.0,
        "minimum_safe_balance": 5000.0,
        "account_type": "savings"
    })
    assert res1.status_code == 200, f"Failed to load dataset: {res1.text}"
    data = res1.json()
    txns = data["transactions"]
    print(f"  -> Ingested: {len(txns)} transactions across {data.get('date_range')}")
    print(f"  -> Current Ending Balance: ₹{data.get('current_balance'):,.2f}")
    print(f"  -> Account Persona: {data.get('account_type', 'savings').upper()} (Safe Buffer: ₹{data.get('minimum_safe_balance'):,.0f})")

    # -------------------------------------------------------------
    # Step 2: Analyze transactions
    # -------------------------------------------------------------
    print("\n[STEP 2] Analyzing Ingested Transactions...")
    m30 = data.get("metrics_30d", {})
    print(f"  -> 30-Day Cash Flow: Inflows ₹{m30.get('inflows', 0):,.2f} | Outflows ₹{m30.get('outflows', 0):,.2f} | Net Flow: ₹{m30.get('net_flow', 0):,.2f}")
    recurring = data.get("recurring_bills", [])
    print(f"  -> Recurring Commitments Detected: {len(recurring)} obligations")
    for r in recurring[:3]:
        print(f"     - {r.get('merchant')}: ₹{r.get('average_amount'):,.0f} ({r.get('cadence')}, Day {r.get('day_of_month')}, {r.get('confidence_score')}% confidence)")
    anomalies = data.get("anomalies", [])
    print(f"  -> Spending Anomalies Flagged: {len(anomalies)} irregular transactions")
    for a in anomalies[:2]:
        print(f"     - {a.get('description')} (₹{abs(a.get('amount', 0)):,.0f}): {a.get('reason')}")

    # -------------------------------------------------------------
    # Step 3: Predict cash shortage
    # -------------------------------------------------------------
    print("\n[STEP 3] Predicting Cash Shortages (1,000-Path Monte Carlo Simulation)...")
    r_sum = data.get("risk_summary", {})
    limits = data.get("limits", {})
    print(f"  -> 60-Day Buffer Breach Risk: {r_sum.get('prob_below_safe_balance')}% ({r_sum.get('risk_level')})")
    print(f"  -> Zero-Balance Breach Risk: {r_sum.get('prob_below_zero')}%")
    print(f"  -> Earliest Projected Shortage Date: {r_sum.get('first_breach_date', 'None')} (Range: {(r_sum.get('breach_date_range') or {}).get('label', 'No breach projected within 60 days')})")
    print(f"  -> Lowest Expected Median Balance: ₹{r_sum.get('lowest_median_balance', 0):,.2f}")
    print(f"  -> Safe Living Spend Limit (< 10% breach probability): ≤ ₹{limits.get('recommended_daily_cap', 0):,.0f}/day (₹{limits.get('recommended_weekly_cap', 0):,.0f}/week)")
    print(f"  -> Top Risk Drivers:")
    for d in r_sum.get("top_drivers", [])[:3]:
        print(f"     - {d.get('driver')}: ₹{d.get('amount', 0):,.0f} ({d.get('impact_detail')})")

    # -------------------------------------------------------------
    # Step 4: Ask FinOS Copilot
    # -------------------------------------------------------------
    print("\n[STEP 4] Consulting Ask FinOS AI Advisor...")
    q1 = "Why is my balance projected to dip, and what can I do to prevent a shortage?"
    chat_res1 = requests.post(f"{BACKEND_URL}/chat", json={
        "message": q1,
        "context": {
            "forecast": data.get("forecast"),
            "limits": limits,
            "recurring_bills": recurring,
            "anomalies": anomalies,
            "current_balance": data.get("current_balance"),
            "minimum_safe_balance": data.get("minimum_safe_balance")
        },
        "transactions": txns[:50]
    })
    assert chat_res1.status_code == 200, f"Chat call failed: {chat_res1.text}"
    c_out1 = chat_res1.json()
    print(f"  Question: '{q1}'")
    print(f"  Ask FinOS Advisor Response (Provider: {c_out1.get('llm_provider')}):")
    print("-" * 60)
    print(c_out1.get("reply", ""))
    print("-" * 60)

    # -------------------------------------------------------------
    # Step 5 & 6: Simulate ₹30,000 laptop purchase & compare financial risk
    # -------------------------------------------------------------
    print("\n[STEP 5 & 6] Simulating Decision: Purchase ₹30,000 Laptop in 7 Days...")
    sim_res = requests.post(f"{BACKEND_URL}/simulate", json={
        "current_balance": 35000.0,
        "minimum_safe_balance": 5000.0,
        "transactions": txns[:100],
        "one_time_expenses": [
            {"name": "MacBook / Laptop Purchase", "amount": 30000.0, "day_offset": 7}
        ]
    })
    assert sim_res.status_code == 200, f"Simulation call failed: {sim_res.text}"
    sim_data = sim_res.json()
    delta = sim_data.get("delta_metrics", {})
    print("  -> WHAT-IF COMPARATIVE RISK ANALYSIS:")
    print(f"     * Shortage Probability: {delta.get('baseline_breach_probability')}%  -->  {delta.get('simulated_breach_probability')}%  (Change: {delta.get('breach_probability_change')}%)")
    print(f"     * Expected Ending Balance: ₹{delta.get('baseline_ending_balance', 0):,.2f}  -->  ₹{delta.get('simulated_ending_balance', 0):,.2f}")
    print(f"     * Lowest Projected Balance: ₹{delta.get('baseline_lowest_balance', delta.get('baseline_min_balance', 0)):,.2f}  -->  ₹{delta.get('simulated_lowest_balance', delta.get('simulated_min_balance', 0)):,.2f}")
    print(f"     * Safe Daily Spending Cap: ≤ ₹{delta.get('baseline_safe_limit', 0):,.0f}/day  -->  ≤ ₹{delta.get('simulated_safe_limit', 0):,.0f}/day")
    print(f"  -> Decision Recommendation: {delta.get('recommendation', 'N/A')}")

    # -------------------------------------------------------------
    # Step 7: View historical backtesting
    # -------------------------------------------------------------
    print("\n[STEP 7] Evaluating Model Prediction Accuracy via Historical Rolling-Origin Backtesting...")
    bt_res = requests.post(f"{BACKEND_URL}/backtest", json={
        "account_type": "savings",
        "starting_balance": 75000.0,
        "test_window_days": 30
    })
    assert bt_res.status_code == 200, f"Backtest call failed: {bt_res.text}"
    bt_data = bt_res.json()
    metrics = bt_data.get("metrics", {})
    print(f"  -> Training Horizon: {bt_data.get('history_months', 0)} months ({bt_data.get('history_days', 0)} days, {bt_data.get('evaluated_splits', 0)} evaluation splits) | Test Window: {bt_data.get('test_window_days', 30)} days")
    print(f"  -> Forecast Model MAE: ₹{metrics.get('model_mae', 0):,.2f} (vs Naive Baseline ₹{metrics.get('naive_mae', 0):,.2f} -> {metrics.get('pct_improvement_mae')}% improvement)")
    print(f"  -> Forecast Model RMSE: ₹{metrics.get('model_rmse', 0):,.2f} (vs Naive Baseline ₹{metrics.get('naive_rmse', 0):,.2f} -> {metrics.get('pct_improvement_rmse')}% improvement)")
    print(f"  -> Model MAPE: {metrics.get('model_mape')}%")
    print(f"  -> 80% Confidence Interval Calibration: {metrics.get('calibration_80_pct', metrics.get('calibration_coverage_pct', 0))}% (Target: ~80% coverage)")
    print(f"  -> Calibration Quality: {metrics.get('calibration_status', metrics.get('calibration_assessment', 'N/A'))}")

    print("\n" + "=" * 80)
    print("DEMONSTRATION COMPLETED SUCCESSFULLY WITHOUT ERRORS.")
    print("=" * 80)

if __name__ == "__main__":
    run_demonstration()
