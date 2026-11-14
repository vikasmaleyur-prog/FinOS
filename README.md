# FinOS: Predictive Cash Flow Operating System

FinOS is an enterprise-grade, privacy-first FinTech platform built for **freelancers, irregular earners, and small business (SMB) owners** in India. It models cash timing asymmetry, detects recurring commitments, runs **1,000 Monte Carlo stochastic forecast simulations**, flags spending anomalies via 4-feature Isolation Forests, evaluates prediction accuracy via rolling-origin backtesting, and enables interactive "What-If" decision stress testing—all packaged inside a pixel-perfect dark UI inspired by **Ramp.com**.

---

## 🌟 Key Capabilities & Architectural Upgrades

### 1. Robust Real-World Statement Ingestion (`backend/ingestion.py`)
- **PhonePe 90-Day Statement Ingestion**: Handles messy real-world PhonePe exports (`data/phonepe_sample_90d.csv`) with variable-length metadata preambles, newest-first reverse chronological sorting, missing running balances, and UPI reference strings (`UPI/P2A/...`).
- **PDF Statement Parsing**: Built-in `pdfplumber` engine parses bank and UPI statement PDFs directly, infers header locations, and standardizes to the canonical FinOS transaction schema.
- **Chronological Sorting & Balance Rebuilding**: Inverts reverse-chronological statements and rebuilds true running balances:
  $$\text{Balance}_t = \text{StartingBalance} + \sum_{i=1}^t \text{Amount}_i$$
- **100% Stateless & Privacy-First (DPDP Act 2023)**: Zero server-side session persistence. Uploaded files are processed strictly in memory and returned immediately. PII (phone numbers, UPI IDs, UTRs) is masked on the fly before reaching the client or any optional LLM.

### 2. Dual Persona Support: Individual Savings vs. SMB Current Accounts
- **Account Type Toggle**: Instant switching between **Savings Account** (Individual / Freelancer, ₹5,000 buffer) and **Current Account** (SMB Shop Owner / Overdraft, ₹25,000 buffer) across the UI and REST API.
- **Small Shop Owner Current Account Dataset (`data/shop_owner_current_account.csv`)**: 12 months of high-velocity retail SMB transactions including daily counter sales receipts, wholesale supplier payments, employee payroll on the 1st, GST on the 20th, commercial store rent, and owner drawings.
- **B2B Receivables Delay Distribution**: For Current Accounts, Monte Carlo modeling incorporates right-skewed log-normal invoice payment delays that organically widen the forecast cone ($P_{10}-P_{90}$) to reflect real-world late-paying commercial clients.

### 3. Multi-Account Consolidation & Inter-Account Balancing (`MultiAccountEngine`)
- **Dual Statement Analysis (`POST /multi-account/analyze`)**: Ingests two statements simultaneously (e.g., Primary Business Current Account + Liquid Savings Reserve).
- **Internal Transfer Neutralization**: High-speed $O(N)$ hash-table detector identifies round-trip transfers (opposite sign, identical amount within 2 days), tags them as `"Internal Transfer"`, and excludes them from operating cash burn to prevent double-counting.
- **Suggested Transfer Optimizer**: Binary search algorithm calculates the smallest inter-account transfer and execution date that brings an at-risk account's buffer breach probability under 10% (e.g., *"Transfer ₹20,000 from Savings Reserve on 22 Aug reduces Current Account breach probability from 18.2% to 3.5%"*).
- **Consolidated UI (`MultiAccountView.tsx`)**: Displays dual account risk cards, recommended transfer impact, 60-day consolidated cash flow cone, and neutralized transfers audit table.

### 4. Hybrid Categorization & AI Fallback (`AutoCategorizer`)
- **Three-Tier Architecture**:
  1. *Heuristics*: High-precision regex matching for Indian payees and business categories (`Sales Receipts`, `Supplier Payments`, `Salaries`, `GST/TDS`, `Owner Drawings`, `Food`, `Travel`, `Investments`, `Bills & Utilities`, `Shopping`, `Health`, `EMI/Loans`, `Rent`).
  2. *NLP*: TF-IDF + Regularized Logistic Regression for semantic similarity.
  3. *LLM Fallback & Cache*: Ambiguous low-scoring merchants query Gemini 2.5 Flash via REST (with DPDP-masked snippets) and cache predictions in memory.
- **Empirical Accuracy Benchmark**: Evaluated honestly on a 58-sample held-out split of realistic Indian financial transactions (`AutoCategorizer.evaluate_benchmark()`), achieving **93.1% overall accuracy** (100% on Travel, Bills, Shopping, Health, Loans, Rent, Income, Other/Transfer; 78% on Food; 80% on Investments/Subscriptions).

### 5. Smarter 4-Feature Anomaly Detection (`AnomalyDetector`)
- **Multi-Dimensional Isolation Forest**: Evaluates expenses across 4 behavioral features:
  1. `category_zscore`: Deviation from category mean expenditure.
  2. `merchant_frequency`: Normalized historical visit frequency for the payee.
  3. `day_of_month`: Monthly timing distribution ($1..31$).
  4. `amount_typical_ratio`: Ratio of transaction amount to category median.
- **Plain-English Reasons**: Surfaces clear, actionable explanations (e.g. *"5.2x your usual Food spend (₹3,200 vs typical ₹615)"*).

### 6. Rolling-Origin Backtesting & Accuracy Radar (`BacktestEngine`)
- **Out-of-Sample Validation (`GET /backtest`, `POST /backtest`)**: Repeatedly trains on months $1..N$, forecasts month $N+1$, and computes MAE, MAPE, and $80\%$ CI calibration (share of actual daily balances inside $P_{10}-P_{90}$; target $\approx 80\%$).
- **Naive Baseline Comparison**: Measures % improvement over a moving-average baseline forecast.
- **Accuracy View (`AccuracyView.tsx`)**: Displays backtest KPI metric cards, actual-vs-forecast trajectory chart with 80% confidence bands, and calibration audit table.

### 7. Personalized Safe Spending Limits (`SpendingLimitOptimizer`)
- **Binary Search Optimization (`GET /limits`, `POST /limits`)**: Discovers the highest daily living spend cap (and per-category caps for top 3 variable categories) that keeps buffer breach probability below 10%. Displayed as an actionable card on Overview (*"Spend ≤ ₹X/day to stay safe"*).

### 8. "Ask FinOS" AI Copilot & Grounded Explanations (`POST /chat`, `POST /explain`)
- **Zero Hallucinated Numbers**: Forecast figures, dates, and risk levels derive strictly from the Python Monte Carlo engine; the LLM provides grounded executive narrative synthesis.
- **Interactive Chat Drawer**: Slide-out panel answering queries strictly from context facts ("Why is my balance low on the 22nd?").
- **Automatic What-If Decision Simulation**: Queries like *"What if I buy a ₹35,000 laptop in 10 days?"* trigger a 500-run comparative Monte Carlo simulation and return a structured Before vs After impact card.
- **Resilient Fallback**: Operates deterministically without errors if `GEMINI_API_KEY` is not set.

### 9. What-If Cash Flow Stress Testing (`SimulatorView.tsx`)
- Interactive sliders for one-time purchases, invoice arrival delays, and new EMI debt.
- **One-Click Business Scenarios**:
  - ⏱️ *Customer Pays 20d Late* (client receivable delay stress test)
  - 📦 *Bulk Stock Purchase (₹75k)* (major inventory capital expenditure)
  - 👥 *New Staff Hire (₹20k/mo)* (monthly payroll addition starting on the 1st)
- Recharts Before vs After trajectory comparison chart showing median paths and safe buffer lines.

---

## 🏗️ Architecture & Project Structure

```
finos/
├── backend/
│   ├── ingestion.py          # Robust CSV & PDF parsing with preamble detection
│   ├── generate_data.py      # Freelancer 24mo, PhonePe 90d, and Shop Owner current account generators
│   ├── ml_engine.py          # Monte Carlo, Limits Optimizer, BacktestEngine, AnomalyDetector, MultiAccountEngine, LLM
│   ├── main.py               # FastAPI server (Stateless REST endpoints & analytics pipeline)
│   └── requirements.txt      # Python dependencies
├── data/
│   ├── synthetic_transactions.csv      # 24-month Freelancer reference statement (1,082 txns)
│   ├── phonepe_sample_90d.csv          # 90-day PhonePe UPI export (188 txns)
│   └── shop_owner_current_account.csv  # 12-month Retail SMB current account (524 txns)
├── frontend/
│   ├── app/
│   │   ├── globals.css       # Tailwind CSS & Ramp dark theme tokens
│   │   ├── layout.tsx        # Typography and root layout
│   │   ├── login/page.tsx    # Interactive demo authentication showcase
│   │   └── dashboard/page.tsx # Main dashboard (Overview, Ledger, Simulator, Accuracy, Multi-Account)
│   ├── components/
│   │   ├── Sidebar.tsx             # Collapsible navigation & quick controls
│   │   ├── RiskBanner.tsx          # Dynamic headline risk radar & root cause drivers
│   │   ├── PersonalizedLimitsCard.tsx # Optimal spending cap card (< 10% breach risk)
│   │   ├── MetricsRow.tsx          # Liquidity, 30-day net flow, fixed bills, daily burn
│   │   ├── ForecastChart.tsx       # 60-Day Recharts stochastic forecast with 80% CI
│   │   ├── RecurringBillsCard.tsx  # Detected subscriptions, EMIs, and confidence scores
│   │   ├── CategoryDonutCard.tsx   # Category spending breakdown
│   │   ├── TransactionTable.tsx    # Ledger with AI pills, search, and anomaly reasons
│   │   ├── SimulatorView.tsx       # What-If decision simulator with quick business presets
│   │   ├── AccuracyView.tsx        # Rolling-origin backtest actual vs forecast & calibration
│   │   ├── MultiAccountView.tsx    # Dual-account consolidation, internal transfers & transfer suggestions
│   │   ├── AskFinOSChat.tsx        # AI copilot slide-out drawer with What-If simulations
│   │   ├── EmptyState.tsx          # One-click cards for Freelancer, PhonePe, and Shop Owner datasets
│   │   └── UploadModal.tsx         # Drag-and-drop CSV & PDF importer with account type selector
│   ├── package.json
│   ├── tailwind.config.js          # Ramp colors (#d9f154 neon lime, #0a0a0a dark)
│   └── tsconfig.json
├── tests/
│   ├── test_baseline.py      # Baseline ingestion, sanitization, categorization, Monte Carlo
│   ├── test_phase1.py        # Limits binary search, rolling backtest, explainability drivers
│   ├── test_phase2.py        # 4-feature Isolation Forest, LLM cache, benchmark, /explain, /chat
│   └── test_phase3.py        # PhonePe 90d, SMB current a/c, receivables delay, multi-account, PDF
├── AUDIT.md                  # Complete architectural audit of real vs demo components
├── CHANGELOG.md              # Detailed log of all phases
├── DEMO.md                   # 2-Minute hackathon demonstration script
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
# In repository root
pip install -r backend/requirements.txt

# (Optional) Export Gemini API Key for AI explanations & conversational copilot
# If unset, FinOS seamlessly uses deterministic templates
export GEMINI_API_KEY="your-gemini-api-key"

# Launch FastAPI Backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API runs on `http://127.0.0.1:8000` (Swagger interactive docs: `http://127.0.0.1:8000/docs`).*

### 2. Frontend Setup

```bash
# In frontend directory
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

### 3. Run Automated Tests

```bash
# Run complete test suite across all phases (23 passing tests)
python -m pytest tests/ -v
```

---

## 🔒 Sensible Assumptions & Privacy Design

1. **Target Audiences & Account Types**:
   - **Freelancers / Gig Consultants**: Irregular milestone earnings (₹40,000–₹1,80,000), monthly rent on the 1st, personal loan EMI on the 5th, variable living expenses. Default safe buffer: ₹5,000.
   - **SMB Retail Shop Owners**: High-velocity daily sales receipts, weekly supplier wholesale debits, employee salaries on the 1st, GST on the 20th, owner drawings. Default overdraft buffer: ₹25,000.
2. **Indian Financial Text Semantics**:
   - Handles PhonePe 3-line preambles, UPI 12-digit reference numbers (`UPI/P2A/...`), NEFT transaction strings, ACH auto-debits, and ATM withdrawals.
3. **Internal Transfers**:
   - Paired debit/credit transactions between an individual's or business's accounts within a 2-day window with opposite signs ($\pm \text{amount}$) are identified as internal transfers and excluded from operational income/spend to prevent double-counting.
4. **Zero Persistent Storage (DPDP Act 2023 Compliance)**:
   - Statements are parsed in-memory. Zero personal transaction data or session files are stored on disk or database. Clicking "Delete My Data" in the sidebar instantly resets all client session state.
5. **Interactive Demo Notice**:
   - The `/login` page and SSO buttons (Google / Apple) are designed as a visual showcase of the Ramp dark theme; clicking Sign In or Continue as Guest immediately navigates to the live dashboard.
