# FinOS MVP Technical Audit (Phase 0)

## 1. Executive Summary

This audit assesses the initial codebase of **FinOS** (`github.com/vikasmaleyur-prog/FinOS`), an AI-powered personal financial operating system built with FastAPI (backend) and Next.js + Tailwind + Recharts (frontend). 

The platform aims to solve predictive cash flow management for irregular earners and small businesses in the Indian context (UPI, ₹).

---

## 2. Component Implementation Matrix (Post Phase 4)

| Component | Initial Status | Final Status | Production Implementation Details |
| :--- | :--- | :--- | :--- |
| **Bank Ingestion (`ingestion.py`)** | REAL (Basic) | **REAL & COMPLETE** | Dynamic preamble detection (handles PhonePe 3-line header and missing balance); chronological sort inversion; running balance generation; PDF statement extraction via `pdfplumber`. |
| **Privacy / DPDP Act (`ml_engine.py`)** | REAL (Buggy) | **REAL & AUDITED** | In-memory regex masking for 10-digit Indian phones, UPI IDs, 12-digit UTRs, PAN cards, and bank account numbers. Masking precedence fixed. Sanitizes all payloads before reaching Gemini LLM. |
| **Auto-Categorizer (`ml_engine.py`)** | HYBRID (35-sample) | **REAL & BENCHMARKED** | 14 Indian personal & SMB categories (including `Insurance`, `Sales Receipts`, `Supplier Payments`, `Salaries`, `GST/TDS`, `Owner Drawings`). Word-bounded heuristics + TF-IDF Logistic Regression. Official Google Gen AI SDK (`gemini-2.5-flash`) fallback with in-memory caching. 93.1% benchmark on held-out split. Inline manual user re-categorization (`POST /categorize/correct`). |
| **Recurring Detection (`ml_engine.py`)** | REAL (Basic) | **REAL & INTEGRATED** | Merchant key extraction; cadence analysis via inter-transaction day intervals (Monthly: 22–38 days, Weekly: 6–8 days) with amount CV < 0.40. Computes individual confidence scores (50%–99%) and feeds detected commitments directly into Monte Carlo. |
| **Cash Flow Forecasting (`ml_engine.py`)** | REAL (Naive Normal) | **REAL & RIGOROUS** | 1,000-path Monte Carlo simulation. Bootstrapped historical daily variable burn ($\ge 0$) or log-normal. Bayesian renewal income modeling for sparse history ($< 4$ incomes). Calculates multi-horizon projections (7, 15, 30, 60, 90 days), $P_{10}, P_{50}, P_{90}$, expected future balance, minimum expected balance, and zero-breach probability. |
| **Backtesting & Evaluation (`ml_engine.py`)** | MISSING | **REAL & COMPLETE** | Rolling-origin cross-validation (`GET/POST /backtest`). Computes Model MAE, Naive Moving-Average MAE, % improvement, Model RMSE, Naive RMSE, Model MAPE, and Calibration coverage. Integrated into dedicated `AccuracyView.tsx` dashboard. |
| **Personalized Limits (`ml_engine.py`)** | MISSING | **REAL & COMPLETE** | Binary search optimizer (`GET/POST /limits`) over 1,000 simulation paths to find the highest safe daily, weekly, and monthly spending caps keeping breach probability $< 10\%$. Proportional caps for top 3 variable categories. Actionable card on Overview dashboard. |
| **Anomaly Detection (`ml_engine.py`)** | REAL (1D Feature) | **REAL & MULTI-FEATURE** | Scikit-learn `IsolationForest` across 4 normalized features: Category Z-score, Merchant Frequency, Day of Month, and Amount / Median ratio. Duplicate payment detection (same amount to same merchant within 48h). Plain-English explainable reasons. |
| **Explainability & AI Advisor** | SEMI-REAL | **REAL & COMPLETE** | Simulation-driven diagnostic generator (bills before inflow, arrival gaps, breach range, top 3 drivers with ₹ impact). Official Google Gen AI SDK (`google-genai`) integration with `gemini-2.5-flash` model for `/explain` and interactive "Ask FinOS" chat copilot (`/chat`) with in-chat What-If simulation interpreter. Transparent offline fallback banner. |
| **What-If Scenario Simulator** | MISSING / BASIC | **REAL & COMPREHENSIVE** | Preset buttons (Buy ₹30k Laptop, Take ₹1L Loan, Add ₹15k EMI, Delay Salary 20d, Delay Client Payment 25d, Increase Expenses +20%, Cut Discretionary -25%). Side-by-side comparative analytics (Forecast Balance, Shortage Risk, Min Balance, Safe Spend Limit). |
| **Business & Current Accounts** | MISSING | **REAL & COMPLETE** | Savings vs Current Account toggle. Configurable safe buffer and overdraft limit. B2B receivables delay modeling via log-normal payment lag distributions. SMB Current Account sample dataset (`data/shop_owner_current_account.csv`). |
| **Multi-Account Consolidation** | MISSING | **REAL & COMPLETE** | Dual-account analysis (`MultiAccountEngine`, `POST /multi-account/analyze`). $O(N)$ hash-table internal transfer detection and neutralization. Suggested transfer optimizer to keep breach probability $< 10\%$. Dedicated `MultiAccountView.tsx` UI. |
| **Session & State (`main.py`)** | REAL (Stateless) | **REAL (Stateless)** | The server is 100% stateless REST; requests receive full in-memory processed JSON. Zero database or server session storage. |
| **Authentication (`/login`)** | DEMO ONLY | **DEMO DISCLOSED** | Split-screen UI clearly badged as "Interactive Demo Showcase" (no real auth required; direct sandbox entry). |

---

## 3. Discrepancies Found & Rectified in Phase 0

1. **Hardcoded User Path in `generate_data.py` & `README.md`**:
   - `generate_data.py` had `generate_synthetic_transactions("/Users/vikasn/.gemini/antigravity/scratch/finos/data/synthetic_transactions.csv")`.
   - `README.md` had `cd /Users/vikasn/.gemini/antigravity/scratch/finos`.
   - **Fix**: Replaced with dynamic relative paths based on project root.
2. **README Statelessness vs "Session Manager" Claim**:
   - `README.md` line 45 advertised `main.py (all REST endpoints & session manager)`.
   - In reality, `main.py` is entirely stateless with zero session manager classes.
   - **Fix**: Updated `README.md` to accurately describe `main.py` as a stateless REST analytics pipeline.
3. **Demo Status of `/login` and SSO**:
   - The login page appeared like a functional auth gate, but simply pushed route to `/dashboard`.
   - **Fix**: Added explicit demo badge ("Interactive Demo Showcase") and labeled SSO buttons as demo access in both `/login` and `README.md`.
4. **UTR Regex Precedence Bug in `PrivacyMasker`**:
   - In `backend/ml_engine.py`, `ACCOUNT_REGEX` was executed before `UTR_REGEX`. Because `ACCOUNT_REGEX` allowed an optional prefix and matched any 9-18 digit number, 12-digit UTRs were mistakenly masked as bank accounts (`A/C XXXXXX...`).
   - **Fix**: Moved `UTR_REGEX` before `ACCOUNT_REGEX` in `PrivacyMasker.mask_text`, aligning with `StatementParser`. Verified with pytest.

---

## 4. Phase 1 Implementation Plan

1. **Backtesting & Accuracy Engine (`GET /backtest`)**:
   - Implement rolling-origin evaluation (train on months $1..K$, forecast month $K+1$).
   - Compute MAE, MAPE, and Calibration (fraction of actual balances within the 80% confidence interval, target $\sim 80\%$).
   - Compute naive moving-average baseline and percentage improvement.
   - Add new "Accuracy" view in frontend dashboard.
2. **Personalized Spending Limits (`GET /limits`)**:
   - Binary search algorithm over 1,000 Monte Carlo runs to find maximum safe daily spend cap (and top 3 variable category caps) that maintains breach probability $< 10\%$.
   - Display actionable card on Overview.
3. **Explainability & Root-Cause Diagnostics**:
   - Extract simulation drivers: bills falling before next income arrival, arrival gap in days, breach window, and top 3 drivers with ₹ impact.
4. **Simulation Statistical Hardening**:
   - Draw daily variable spend from bootstrapped historical days (or log-normal distribution), clipped $\ge 0$.
   - Fit empirical income gap/amount distributions with sensible priors for low-history accounts ($< 4$ incomes).
   - Add data-sufficiency badge and confidence score per recurring commitment.
