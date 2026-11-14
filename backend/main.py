"""
FinOS Stateless FastAPI Application
Completely STATELESS:
- Zero global DataFrames stored on the server.
- The /upload endpoint processes the CSV and immediately returns the full processed JSON payload.
- No cross-request state leakage.
- DPDP Act 2023 compliant.
"""

import os
import io
import datetime
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.ingestion import StatementParser, StatementIngestionError
from backend.ml_engine import (
    PrivacyMasker,
    AutoCategorizer,
    RecurringPaymentDetector,
    CashFlowForecaster,
    AnomalyDetector,
    FinancialExplainer,
    SpendingLimitOptimizer,
    BacktestEngine,
    FinOSLLMService
)

app = FastAPI(
    title="FinOS API: Predictive Cash Flow Manager",
    description="Stateless FinTech ML backend for irregular earners, DPDP Act 2023 compliant.",
    version="2.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared stateless categorizer instance (model weights only, zero user data)
categorizer = AutoCategorizer()

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "synthetic_transactions.csv")


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class CategorizeRequest(BaseModel):
    descriptions: List[str]
    amounts: Optional[List[float]] = None

class OneTimeExpense(BaseModel):
    name: str = "One-time Purchase"
    amount: float
    day_offset: int = 10

class RecurringEMI(BaseModel):
    name: str = "New Loan EMI"
    amount: float
    day_of_month: int = 5
    duration_months: int = 6

class SimulateRequest(BaseModel):
    transactions: Optional[List[Dict[str, Any]]] = None
    current_balance: Optional[float] = None
    minimum_safe_balance: Optional[float] = 5000.0
    income_delay_days: int = 0
    income_boost_pct: float = 0.0
    one_time_expenses: Optional[List[OneTimeExpense]] = None
    new_recurring_emis: Optional[List[RecurringEMI]] = None

class LimitsRequest(BaseModel):
    transactions: Optional[List[Dict[str, Any]]] = None
    current_balance: Optional[float] = None
    minimum_safe_balance: Optional[float] = 5000.0
    target_max_breach_prob: Optional[float] = 10.0

class BacktestRequest(BaseModel):
    transactions: Optional[List[Dict[str, Any]]] = None
    starting_balance: Optional[float] = 75000.0
    test_window_days: Optional[int] = 30

class ExplainRequest(BaseModel):
    forecast: Optional[Dict[str, Any]] = None
    limits: Optional[Dict[str, Any]] = None
    anomalies: Optional[List[Dict[str, Any]]] = None
    recurring_bills: Optional[List[Dict[str, Any]]] = None
    current_balance: Optional[float] = None
    minimum_safe_balance: Optional[float] = 5000.0

class ChatMessage(BaseModel):
    role: str = "user"
    content: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    history: Optional[List[ChatMessage]] = None
    transactions: Optional[List[Dict[str, Any]]] = None


# ==========================================
# HELPER: RUN COMPLETE STATELESS PIPELINE
# ==========================================

def run_pipeline_for_dataframe(
    df: pd.DataFrame,
    start_bal: float,
    min_safe: float,
    header_line: int = 1,
    date_range: str = ""
) -> Dict[str, Any]:
    """
    Executes full predictive cash flow pipeline on a DataFrame
    and returns a consolidated, serializable JSON payload.
    """
    # 1. Hybrid Categorization (Heuristics First, ML Second)
    categorized_df = categorizer.categorize_dataframe(df)

    # 2. Extract Key Financials
    ending_balance = float(categorized_df["Balance"].iloc[-1]) if len(categorized_df) > 0 else float(start_bal)
    total_inflows = float(categorized_df[categorized_df["Amount"] > 0]["Amount"].sum()) if len(categorized_df) > 0 else 0.0
    total_outflows = float(abs(categorized_df[categorized_df["Amount"] < 0]["Amount"].sum())) if len(categorized_df) > 0 else 0.0

    # 30-Day Flow Window
    if len(categorized_df) > 0:
        last_dt = pd.to_datetime(categorized_df["Date"]).max()
        thirty_days_ago = last_dt - datetime.timedelta(days=30)
        recent_df = categorized_df[pd.to_datetime(categorized_df["Date"]) >= thirty_days_ago]
        inflows_30d = float(recent_df[recent_df["Amount"] > 0]["Amount"].sum()) if len(recent_df) > 0 else 0.0
        outflows_30d = float(abs(recent_df[recent_df["Amount"] < 0]["Amount"].sum())) if len(recent_df) > 0 else 0.0
        net_30d = inflows_30d - outflows_30d
    else:
        inflows_30d, outflows_30d, net_30d = 0.0, 0.0, 0.0

    # 3. Detect Recurring Obligations & Subscriptions
    recurring_bills = RecurringPaymentDetector.detect_recurring(categorized_df)
    fixed_monthly = sum(float(b["average_amount"]) for b in recurring_bills if b["cadence"] == "Monthly")

    # 4. Detect Anomalies (Isolation Forest)
    anomalies = AnomalyDetector.detect_anomalies(categorized_df)

    # 5. Stochastic Cash Flow Forecast (1,000 Monte Carlo runs)
    forecast_res = CashFlowForecaster.run_monte_carlo(
        df=categorized_df,
        current_balance=ending_balance,
        forecast_days=60,
        num_simulations=1000,
        minimum_safe_balance=min_safe
    )

    # 6. Personalized Spending Limits via Binary Search (<10% breach probability)
    limits = SpendingLimitOptimizer.calculate_optimal_limits(
        df=categorized_df,
        current_balance=ending_balance,
        minimum_safe_balance=min_safe,
        target_max_breach_prob=10.0
    )

    # 7. Plain-Language Explainability (Gemini AI + Resilient Fallback)
    explanation = FinOSLLMService.generate_ai_explanation(forecast_res, recurring_bills, limits)

    # 8. Category Spending Breakdown
    expenses_only = categorized_df[categorized_df["Amount"] < 0]
    if len(expenses_only) > 0:
        cat_breakdown = expenses_only.groupby("Category")["Amount"].sum().apply(abs).to_dict()
    else:
        cat_breakdown = {}

    # 9. Clean Transaction Records (strict float type casting)
    transaction_records = []
    for _, row in categorized_df.iterrows():
        amt_f = float(row["Amount"])
        bal_f = float(row.get("Running Balance", row.get("Balance", ending_balance)))
        desc_str = str(row["Description"])
        cat_str = str(row.get("Category", "Other/Transfer"))
        ref_str = str(row.get("Reference_No", ""))
        date_str = str(row["Date"])

        transaction_records.append({
            "Date": date_str,
            "date": date_str,
            "Description": desc_str,
            "description": desc_str,
            "Transaction Details": str(row.get("Transaction Details", desc_str)),
            "Amount": amt_f,
            "amount": amt_f,
            "Running Balance": bal_f,
            "Balance": bal_f,
            "balance": bal_f,
            "Category": cat_str,
            "category": cat_str,
            "Reference_No": ref_str,
            "is_ai_categorized": bool(row.get("is_ai_categorized", False)),
            "categorization_method": str(row.get("categorization_method", "heuristic"))
        })

    return {
        "status": "success",
        "has_data": True,
        "message": f"Successfully ingested {len(categorized_df)} transactions (Header at line {header_line}). PII sanitized under DPDP Act 2023.",
        "transactions_count": int(len(categorized_df)),
        "header_line_detected": int(header_line),
        "date_range": date_range or f"{categorized_df['Date'].min()} to {categorized_df['Date'].max()}",
        "current_balance": round(ending_balance, 2),
        "starting_balance": round(start_bal, 2),
        "minimum_safe_balance": float(min_safe),
        "data_sufficiency": forecast_res.get("data_sufficiency", {}),
        "limits": limits,
        "metrics_30d": {
            "inflows": round(inflows_30d, 2),
            "outflows": round(outflows_30d, 2),
            "net_flow": round(net_30d, 2),
            "fixed_commitments": round(fixed_monthly, 2)
        },
        "risk_summary": {
            "prob_below_safe_balance": float(forecast_res["prob_below_safe_balance"]),
            "risk_level": forecast_res["risk_level"],
            "first_breach_date": forecast_res["first_breach_date"],
            "breach_date_range": forecast_res.get("breach_date_range"),
            "lowest_median_balance": float(forecast_res["lowest_median_balance"]),
            "headline": explanation["headline"],
            "root_cause": explanation["root_cause"],
            "recommendations": explanation["actionable_recommendations"],
            "top_drivers": forecast_res.get("top_drivers", []),
            "bills_before_inflow": forecast_res.get("bills_before_inflow", []),
            "total_fixed_before_inflow": forecast_res.get("total_fixed_before_inflow", 0.0),
            "expected_inflow_gap_days": forecast_res.get("expected_inflow_gap_days", 28),
            "expected_inflow_date": forecast_res.get("expected_inflow_date")
        },
        "forecast": {
            "forecast_meta": {
                "forecast_days": int(forecast_res["forecast_days"]),
                "start_date": forecast_res["start_date"],
                "current_balance": float(forecast_res["current_balance"]),
                "minimum_safe_balance": float(forecast_res["minimum_safe_balance"]),
                "prob_below_safe_balance": float(forecast_res["prob_below_safe_balance"]),
                "risk_level": forecast_res["risk_level"],
                "first_breach_date": forecast_res["first_breach_date"],
                "breach_date_range": forecast_res.get("breach_date_range"),
                "lowest_median_balance": float(forecast_res["lowest_median_balance"]),
                "lowest_p10_balance": float(forecast_res["lowest_p10_balance"]),
                "data_sufficiency": forecast_res.get("data_sufficiency", {})
            },
            "burn_metrics": {
                "mean_income_interval_days": float(forecast_res["mean_income_interval_days"]),
                "mean_income_amount": float(forecast_res["mean_income_amount"]),
                "mean_daily_burn": float(forecast_res["mean_daily_burn"]),
                "recurring_bills_count": int(len(recurring_bills))
            },
            "explanation": explanation,
            "timeline": forecast_res["forecast"]
        },
        "recurring_bills": recurring_bills,
        "anomalies": anomalies,
        "category_spending": [{"category": k, "amount": round(float(v), 2)} for k, v in cat_breakdown.items()],
        "transactions": transaction_records,
        "sample": transaction_records[:10]
    }


# ==========================================
# ENDPOINTS
# ==========================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "stateless": True,
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    starting_balance: Optional[float] = Form(None),
    opening_balance: Optional[float] = Form(None),
    minimum_safe_balance: Optional[float] = Form(5000.0)
):
    """
    Stateless Ingestion Endpoint:
    - Parses PhonePe and Indian bank statements.
    - Sorts chronologically (oldest to newest).
    - Computes running balance: starting_balance + Amount.cumsum().
    - Runs NLP hybrid categorization, Monte Carlo forecast, anomaly detection.
    - Returns full JSON payload in the response without saving server-side state.
    """
    if not file.filename.lower().endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    start_bal = starting_balance if starting_balance is not None else (opening_balance if opening_balance is not None else 75000.0)
    min_safe = minimum_safe_balance if minimum_safe_balance is not None else 5000.0

    try:
        contents = await file.read()
        parsed_df, parse_stats = StatementParser.parse_csv(
            contents,
            starting_balance=float(start_bal)
        )
    except StatementIngestionError as sie:
        raise HTTPException(status_code=422, detail=str(sie))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process statement: {str(e)}")

    try:
        payload = run_pipeline_for_dataframe(
            df=parsed_df,
            start_bal=float(start_bal),
            min_safe=float(min_safe),
            header_line=parse_stats["header_line_detected"],
            date_range=parse_stats["date_range"]
        )
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics pipeline failure: {str(e)}")

@app.post("/simulate")
def simulate_scenario(payload: SimulateRequest):
    """
    Stateless What-If Simulation:
    - Accepts transaction records or uses generated baseline.
    - Runs comparative 1,000-run Monte Carlo simulations.
    - Returns Before vs After forecasts and risk deltas.
    """
    min_safe = payload.minimum_safe_balance if payload.minimum_safe_balance is not None else 5000.0

    try:
        if payload.transactions and len(payload.transactions) > 0:
            df = pd.DataFrame(payload.transactions)
            if "Amount" not in df.columns and "amount" in df.columns:
                df["Amount"] = df["amount"]
            if "Date" not in df.columns and "date" in df.columns:
                df["Date"] = df["date"]
            if "Category" not in df.columns and "category" in df.columns:
                df["Category"] = df["category"]
            start_bal = payload.current_balance if payload.current_balance is not None else float(df["Balance"].iloc[-1])
        else:
            # Fallback to reference dataset
            if os.path.exists(DATA_PATH):
                with open(DATA_PATH, "rb") as f:
                    df, _ = StatementParser.parse_csv(f.read())
                    df = categorizer.categorize_dataframe(df)
                    start_bal = payload.current_balance if payload.current_balance is not None else float(df["Balance"].iloc[-1])
            else:
                raise HTTPException(status_code=400, detail="No transactions provided for simulation.")

        # 1. Baseline Forecast
        baseline = CashFlowForecaster.run_monte_carlo(
            df=df,
            current_balance=float(start_bal),
            forecast_days=60,
            num_simulations=1000,
            minimum_safe_balance=float(min_safe)
        )

        # 2. Simulated Forecast with Modifiers
        ote_dicts = [o.model_dump() for o in payload.one_time_expenses] if payload.one_time_expenses else []
        emi_dicts = [e.model_dump() for e in payload.new_recurring_emis] if payload.new_recurring_emis else []

        simulated = CashFlowForecaster.run_monte_carlo(
            df=df,
            current_balance=float(start_bal),
            forecast_days=60,
            num_simulations=1000,
            minimum_safe_balance=float(min_safe),
            one_time_expenses=ote_dicts,
            new_recurring_emis=emi_dicts,
            income_delay_days=payload.income_delay_days,
            income_boost_pct=payload.income_boost_pct
        )

        recurring_bills = RecurringPaymentDetector.detect_recurring(df)
        explanation = FinancialExplainer.generate_explanation(
            simulated,
            recurring_bills,
            sim_params={"simulated": True, "income_delay": payload.income_delay_days}
        )

        combined_timeline = []
        for b_pt, s_pt in zip(baseline["forecast"], simulated["forecast"]):
            combined_timeline.append({
                "date": b_pt["date"],
                "displayDate": b_pt["displayDate"],
                "baseline_p50": b_pt["p50"],
                "baseline_p10": b_pt["p10"],
                "baseline_p90": b_pt["p90"],
                "simulated_p50": s_pt["p50"],
                "simulated_p10": s_pt["p10"],
                "simulated_p90": s_pt["p90"],
                "safeThreshold": float(min_safe)
            })

        delta_risk = round(float(simulated["prob_below_safe_balance"] - baseline["prob_below_safe_balance"]), 1)
        delta_min_balance = round(float(simulated["lowest_median_balance"] - baseline["lowest_median_balance"]), 2)

        return {
            "status": "success",
            "delta_metrics": {
                "baseline_risk": float(baseline["prob_below_safe_balance"]),
                "simulated_risk": float(simulated["prob_below_safe_balance"]),
                "risk_increase_pct": delta_risk,
                "baseline_min_balance": float(baseline["lowest_median_balance"]),
                "simulated_min_balance": float(simulated["lowest_median_balance"]),
                "balance_impact": delta_min_balance,
                "new_breach_date": simulated["first_breach_date"],
                "simulated_risk_level": simulated["risk_level"]
            },
            "explanation": explanation,
            "timeline": combined_timeline
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.post("/sample/load")
def load_sample_dataset(starting_balance: Optional[float] = 75000.0, minimum_safe_balance: Optional[float] = 5000.0):
    """Statelessly generates and returns the 2-year sample dataset without server retention."""
    if not os.path.exists(DATA_PATH):
        from backend.generate_data import generate_synthetic_transactions
        generate_synthetic_transactions(DATA_PATH)

    try:
        with open(DATA_PATH, "rb") as f:
            df, stats = StatementParser.parse_csv(f.read(), starting_balance=float(starting_balance))
        return run_pipeline_for_dataframe(
            df=df,
            start_bal=float(starting_balance),
            min_safe=float(minimum_safe_balance),
            header_line=stats["header_line_detected"],
            date_range=stats["date_range"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sample dataset: {str(e)}")

@app.post("/categorize")
def categorize_endpoint(payload: CategorizeRequest):
    """Categorizes descriptions statelessly."""
    results = []
    amounts = payload.amounts or [None] * len(payload.descriptions)
    for desc, amt in zip(payload.descriptions, amounts):
        masked_desc, _ = PrivacyMasker.mask_text(desc)
        pred = categorizer.predict(masked_desc, amt)
        results.append({
            "original_snippet": desc[:25] + "...",
            "masked_snippet": masked_desc,
            "category": pred["category"],
            "confidence": pred["confidence"],
            "method": pred["method"]
        })
    return {"categories": results}

@app.get("/limits")
def get_limits(current_balance: Optional[float] = None, minimum_safe_balance: Optional[float] = 5000.0):
    """Computes personalized daily spending limit keeping buffer breach risk < 10% via binary search."""
    if not os.path.exists(DATA_PATH):
        from backend.generate_data import generate_synthetic_transactions
        generate_synthetic_transactions(DATA_PATH)
    try:
        with open(DATA_PATH, "rb") as f:
            df, _ = StatementParser.parse_csv(f.read())
        df = categorizer.categorize_dataframe(df)
        bal = current_balance if current_balance is not None else float(df["Balance"].iloc[-1])
        return SpendingLimitOptimizer.calculate_optimal_limits(
            df=df,
            current_balance=bal,
            minimum_safe_balance=float(minimum_safe_balance or 5000.0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Limits calculation error: {str(e)}")

@app.post("/limits")
def post_limits(payload: LimitsRequest):
    """Computes personalized daily spending limit on uploaded/custom transactions."""
    try:
        if payload.transactions and len(payload.transactions) > 0:
            df = pd.DataFrame(payload.transactions)
            for col, alt in [("Amount", "amount"), ("Date", "date"), ("Category", "category"), ("Balance", "balance")]:
                if col not in df.columns and alt in df.columns:
                    df[col] = df[alt]
            bal = payload.current_balance if payload.current_balance is not None else float(df["Balance"].iloc[-1])
        else:
            with open(DATA_PATH, "rb") as f:
                df, _ = StatementParser.parse_csv(f.read())
            df = categorizer.categorize_dataframe(df)
            bal = payload.current_balance if payload.current_balance is not None else float(df["Balance"].iloc[-1])

        return SpendingLimitOptimizer.calculate_optimal_limits(
            df=df,
            current_balance=bal,
            minimum_safe_balance=float(payload.minimum_safe_balance or 5000.0),
            target_max_breach_prob=float(payload.target_max_breach_prob or 10.0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Limits calculation error: {str(e)}")

@app.get("/backtest")
def get_backtest(starting_balance: Optional[float] = 75000.0, test_window_days: int = 30):
    """Executes rolling-origin backtest on the reference dataset."""
    if not os.path.exists(DATA_PATH):
        from backend.generate_data import generate_synthetic_transactions
        generate_synthetic_transactions(DATA_PATH)
    try:
        with open(DATA_PATH, "rb") as f:
            df, _ = StatementParser.parse_csv(f.read(), starting_balance=float(starting_balance or 75000.0))
        return BacktestEngine.run_rolling_backtest(
            df=df,
            initial_balance=float(starting_balance or 75000.0),
            test_window_days=test_window_days
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest error: {str(e)}")

@app.post("/backtest")
def post_backtest(payload: BacktestRequest):
    """Executes rolling-origin backtest on custom/uploaded transactions."""
    try:
        if payload.transactions and len(payload.transactions) > 0:
            df = pd.DataFrame(payload.transactions)
            for col, alt in [("Amount", "amount"), ("Date", "date"), ("Category", "category"), ("Balance", "balance")]:
                if col not in df.columns and alt in df.columns:
                    df[col] = df[alt]
            bal = payload.starting_balance if payload.starting_balance is not None else 75000.0
        else:
            with open(DATA_PATH, "rb") as f:
                df, _ = StatementParser.parse_csv(f.read(), starting_balance=75000.0)
            bal = 75000.0

        return BacktestEngine.run_rolling_backtest(
            df=df,
            initial_balance=float(bal),
            test_window_days=payload.test_window_days or 30
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest error: {str(e)}")

@app.post("/explain")
def post_explain(payload: ExplainRequest):
    """
    Synthesizes executive plain-language explanation of risk drivers and recommendations.
    Uses Gemini if GEMINI_API_KEY is configured, else falls back cleanly to deterministic engine.
    """
    try:
        if payload.forecast:
            forecast_data = payload.forecast
            recurring_bills = payload.recurring_bills or []
            limits = payload.limits or {}
        else:
            with open(DATA_PATH, "rb") as f:
                df, _ = StatementParser.parse_csv(f.read())
            categorized_df = categorizer.categorize_dataframe(df)
            bal = payload.current_balance if payload.current_balance is not None else float(categorized_df["Balance"].iloc[-1])
            min_safe = payload.minimum_safe_balance or 5000.0
            recurring_bills = RecurringPaymentDetector.detect_recurring(categorized_df)
            forecast_data = CashFlowForecaster.run_monte_carlo(
                df=categorized_df,
                current_balance=bal,
                forecast_days=60,
                num_simulations=1000,
                minimum_safe_balance=min_safe
            )
            limits = SpendingLimitOptimizer.calculate_optimal_limits(
                df=categorized_df,
                current_balance=bal,
                minimum_safe_balance=min_safe
            )

        return FinOSLLMService.generate_ai_explanation(forecast_data, recurring_bills, limits)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explanation generation error: {str(e)}")

@app.post("/chat")
def post_chat(payload: ChatRequest):
    """
    'Ask FinOS' Chat Copilot:
    - Answers financial questions strictly grounded in the provided simulation context.
    - If user asks a what-if decision (e.g. 'What if I buy a ₹30k laptop in 7 days?'), simulates it automatically.
    - DPDP Act compliant: PII is masked before any LLM inference.
    """
    try:
        raw_df = None
        if payload.transactions and len(payload.transactions) > 0:
            raw_df = pd.DataFrame(payload.transactions)
            for col, alt in [("Amount", "amount"), ("Date", "date"), ("Category", "category"), ("Balance", "balance")]:
                if col not in raw_df.columns and alt in raw_df.columns:
                    raw_df[col] = raw_df[alt]
        elif os.path.exists(DATA_PATH):
            with open(DATA_PATH, "rb") as f:
                raw_df, _ = StatementParser.parse_csv(f.read())
            raw_df = categorizer.categorize_dataframe(raw_df)

        history_dicts = [h.model_dump() for h in payload.history] if payload.history else []
        return FinOSLLMService.chat_copilot(
            message=payload.message,
            context=payload.context or {},
            history=history_dicts,
            raw_df=raw_df
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat copilot error: {str(e)}")

@app.post("/privacy/delete")
def delete_all_data():
    """Confirms complete statelessness (no server persistence)."""
    return {
        "status": "success",
        "message": "Server is 100% stateless. Zero personal transaction data is stored on server."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
