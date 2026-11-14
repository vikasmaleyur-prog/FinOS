# FinOS MVP Technical Audit (Phase 0)

## 1. Executive Summary

This audit assesses the initial codebase of **FinOS** (`github.com/vikasmaleyur-prog/FinOS`), an AI-powered personal financial operating system built with FastAPI (backend) and Next.js + Tailwind + Recharts (frontend). 

The platform aims to solve predictive cash flow management for irregular earners and small businesses in the Indian context (UPI, ₹).

---

## 2. Real vs. Mocked / Hardcoded Components

| Component | Status | Real Implementation Details | Mocked / Hardcoded / Limitations |
| :--- | :--- | :--- | :--- |
| **Bank Ingestion (`ingestion.py`)** | **REAL** | Dynamic header line detection (skips preambles like PhonePe's 3 metadata lines); regex-based amount cleaning (`[^\d.]`); chronological sorting; running balance recalculation. | Default starting balance is ₹75,000 if not provided or inferrable. No PDF ingestion yet (PhonePe CSV only). |
| **Privacy / DPDP Act (`ml_engine.py`)** | **REAL** | In-memory regex masking for 10-digit Indian phones, UPI IDs (`user@bank`), 12-digit UTR numbers, PAN cards, and bank account numbers. Masking audit metrics returned to caller. | In `PrivacyMasker`, generic account regex was running before UTR regex, masking UTRs as accounts (fixed during audit). |
| **Auto-Categorizer (`ml_engine.py`)** | **HYBRID (Real)** | High-precision regex heuristics for 8 Indian categories (`Food`, `Travel`, `Investments`, `Bills & Utilities`, `Shopping`, `Health`, `EMI/Loans`, `Rent`, `Subscriptions`); inflow rule (`Amount > 0` -> `Income`). Fallback TF-IDF + LogisticRegression model. | The fallback NLP model was trained on a small hardcoded 35-sample corpus in-memory. No offline model checkpoint or held-out benchmark score. No Gemini LLM fallback yet for low-confidence payees. |
| **Recurring Detection (`ml_engine.py`)** | **REAL** | Merchant key extraction; cadence analysis via inter-transaction day intervals (Monthly: 22–38 days, Weekly: 6–8 days) with amount Coefficient of Variation (CV) < 0.40. | Hardcoded day interval thresholds; lacks individual confidence scores per recurring obligation. |
| **Cash Flow Forecasting (`ml_engine.py`)** | **REAL (Naive Simulation)** | 1,000-run Monte Carlo stochastic simulation over 60 days; quantile aggregation ($P_{10}, P_{25}, P_{50}, P_{75}, P_{90}$); breach probability against minimum safe balance (default ₹5,000). | **Statistical flaws**: Daily variable burn is sampled from a plain Gaussian $\mathcal{N}(\mu, \sigma)$ clipped at 0, ignoring heavy-tailed spending; income intervals and amounts use naive Normal distributions with static defaults when $< 2$ incomes exist; no uncertainty badge. |
| **Backtesting & Evaluation** | **MISSING** | None. No rolling-origin backtest endpoint, no accuracy tracking, and no historical validation. | **100% Missing**: No MAE, MAPE, calibration evaluation, or naive moving-average baseline comparison. |
| **Personalized Limits** | **MISSING** | None. | **100% Missing**: No binary search limit optimizer to guarantee $< 10\%$ breach probability. |
| **Anomaly Detection (`ml_engine.py`)** | **REAL (Basic)** | Scikit-learn `IsolationForest(contamination=0.02)`. | **Oversimplified**: Trained on only 1 single feature (`Log_Amount`); explanation strings are hardcoded threshold tiers (`> ₹50,000`, `> ₹15,000`). Lacks category z-score, merchant frequency, and day-of-month features. |
| **Explainability (`ml_engine.py`)** | **SEMI-REAL** | Dynamic template generation combining breach probability, breach date, and sum of fixed commitments. | Template-based prose; does not pinpoint exact simulation drivers (which bills precede the next inflow, exact arrival gap, or ₹ impact of top 3 drivers). |
| **Session & State (`main.py`)** | **REAL (Stateless)** | The server is 100% stateless; requests receive full in-memory processed JSON. Zero database or server session storage. | `README.md` claimed a "session manager in main.py", creating a documentation mismatch (fixed in Phase 0). |
| **Authentication (`/login`)** | **DEMO ONLY** | Clean split-screen UI with email inputs, SSO buttons (Google, Apple), and security badges. | **Mocked**: Neither SSO nor email form connects to an authentication provider; clicking sign-in navigates straight to `/dashboard`. |
| **Business Accounts & Multiple Accounts** | **MISSING** | Supports single individual freelancer bank statements only. | No current account toggle, no business categories (`Sales Receipts`, `Supplier Payments`, `GST/TDS`, `Salaries`), and no multi-statement consolidation. |

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
