# FinOS Changelog

All notable changes to the FinOS Predictive Cash Flow Operating System will be documented in this file.

## [Unreleased]

---

## [Phase 4: Official Google Gen AI SDK Integration, Multi-Horizon Projections & Complete What-If Engine] - 2026-11-14

### Added
- **Official Google Gen AI SDK (`google-genai`)**:
  - Migrated `FinOSLLMService.call_gemini` and `AutoCategorizer._query_gemini_fallback` to official `from google import genai; from google.genai import types` with `gemini-2.5-flash`.
  - Implemented multi-tier graceful fallback: Official Gen AI SDK -> REST Fallback -> Deterministic Statistical Financial Intelligence.
  - Transparent execution: returns `is_llm_active`, `llm_provider`, and `offline_fallback_active` metadata on all AI endpoints.
  - Explicit offline banner rendered by Ask FinOS when `GEMINI_API_KEY` is not present (`*(⚡ Offline Mode: Operating with deterministic statistical financial intelligence. Set GEMINI_API_KEY to activate Google Gemini 2.5 Flash AI Advisor.)*`).
- **Interactive Manual Category Correction**:
  - Backend: Added `record_user_correction` and `POST /categorize/correct` in `backend/main.py`.
  - Frontend: Added interactive category dropdown badge in `frontend/components/TransactionTable.tsx` allowing instant inline category overrides by users.
- **Dedicated Insurance Category & Heuristic Word Boundary Protection**:
  - Added `Insurance` category across heuristic rules, classifier models, and sample data.
  - Word-bounded `\bemi\b` and `\bloan\b` regular expressions to eliminate false positive collisions on words like "pr**emi**um".
- **Multi-Horizon Cash Flow Projections (7d, 15d, 30d, 60d, 90d)**:
  - `CashFlowForecaster.run_monte_carlo` computes granular `horizon_metrics` across 7, 15, 30, 60, and 90 days.
  - Computes `prob_below_zero` (probability of dipping strictly below ₹0), `prob_breach_buffer` (probability of breaching minimum safe balance), `expected_future_balance`, and `min_expected_balance`.
  - Added horizon toggle buttons (7D, 15D, 30D, 60D, 90D) and Zero-Breach Risk badge in `frontend/components/ForecastChart.tsx`.
- **Duplicate Payment Detection**:
  - Upgraded `AnomalyDetector.detect_anomalies` to flag duplicate debits of identical amounts to the same merchant within a 48-hour window.
  - Flags duplicate charges with severity `HIGH` and plain-English reasons (`Potential duplicate payment: ₹X charged twice (...)`).
- **Weekly Safe Spending Limits**:
  - `SpendingLimitOptimizer.calculate_optimal_limits` computes `recommended_weekly_cap` and `current_weekly_burn`.
  - `frontend/components/PersonalizedLimitsCard.tsx` displays weekly spending cap alongside daily and monthly caps.
- **Forecast Accuracy RMSE Metric**:
  - `BacktestEngine.run_rolling_backtest` computes `model_rmse`, `naive_rmse`, and `pct_improvement_rmse`.
  - Displayed Model RMSE as the 5th metric card in `frontend/components/AccuracyView.tsx`.
- **Comprehensive What-If Simulator Scenarios**:
  - Added 7 instant scenario presets in `frontend/components/SimulatorView.tsx` (Buy ₹30k Laptop, Take ₹1L Loan, Add ₹15k EMI, Delay Salary 20d, Delay Client Payment 25d, Increase Expenses +20%, Cut Discretionary -25%).
  - Added 4 comparative side-by-side KPI cards: Forecast Balance, Shortage Probability, Minimum Balance, and Safe Spending Limit.
- **Demo Data Badging**:
  - Added clear amber `"DEMO DATA (<dataset>)"` pill in dashboard header when sample datasets are active.
- **Automated Tests (`tests/test_phase4.py`)**:
  - Added 8 tests covering Google Gen AI SDK integration, offline fallback transparency, manual category correction, insurance classification, multi-horizon forecasts, duplicate payment detection, weekly safe caps, RMSE computation, and What-If loan simulation (8/8 passed).

---

## [Phase 3: Data & Business Support - SMB Current Accounts, PhonePe & Multi-Account] - 2026-11-14

### Added
- **PhonePe 90-Day Real-World Statement Ingestion (`generate_phonepe_sample`)**:
  - Synthesized `data/phonepe_sample_90d.csv` matching actual PhonePe UPI statement exports (3-line preamble, newest-first descending chronological sort, no running-balance column, realistic UPI reference strings).
  - Enhanced `StatementParser.parse_csv` to dynamically detect variable-length preambles, reverse reverse-chronological rows, and compute running balance automatically from `starting_balance + Amount.cumsum()`.
- **Small Shop Owner SMB Current Account (`generate_shop_owner_current_account`)**:
  - Generated `data/shop_owner_current_account.csv` with 12 months of high-velocity retail SMB transactions: daily counter sales, weekly supplier payments, employee payroll on the 1st, GST on the 20th, commercial store rent, EMI, owner drawings, and a planted B2B delayed payment crunch.
  - Extended `AutoCategorizer` with canonical SMB categories: `Sales Receipts`, `Supplier Payments`, `Salaries`, `GST/TDS`, and `Owner Drawings`.
- **Account Types & B2B Receivables Delay Modeling**:
  - Added Savings vs Current Account toggle across backend and frontend (`/upload`, `/forecast`, `/simulate`, header toggle).
  - Added support for user-configurable minimum safe buffers and overdraft limits (₹5,000 default for Savings, ₹25,000 for Current).
  - Hardened `CashFlowForecaster.run_monte_carlo` for Current Accounts: models counter receipts plus B2B receivables using right-skewed log-normal delay distributions that widen the uncertainty cone ($P_{10}-P_{90}$) to reflect payment lags.
- **Simulator One-Click Business Stress Scenarios (`frontend/components/SimulatorView.tsx`)**:
  - Added one-click scenario chips for business decision testing:
    1. *Customer Pays 20d Late* (client receivable delay stress test)
    2. *Bulk Stock Purchase (₹75k)* (major inventory capital expenditure)
    3. *New Staff Hire (₹20k/mo)* (new recurring employee salary obligation)
- **Multi-Account Consolidation & Liquidity Balancing (`MultiAccountEngine`)**:
  - Analyzes dual accounts simultaneously (e.g. Primary Current Business Account + Liquid Savings Reserve).
  - **Internal Transfer Neutralization**: High-speed $O(N)$ hash-table detector (`detect_internal_transfers`) identifies round-trips (opposite sign, identical amount within 2 days), tags them as `"Internal Transfer"`, and excludes them from operating cash burn to prevent double-counting.
  - **Suggested Transfer Optimizer**: Binary search algorithm computes the smallest inter-account transfer and execution date that brings an at-risk account's buffer breach risk under 10% (e.g. *"Transfer ₹20,000 from Savings Reserve on 22 Aug reduces Current Account breach risk from 18.2% to 3.5%"*).
  - **Consolidated Dual-Account UI (`frontend/components/MultiAccountView.tsx`)**: Dedicated dashboard view with account risk cards, recommended transfer card with before/after risk impact, 60-day consolidated multi-account liquidity cone, and neutralized transfers audit table.
  - Backed by `POST /multi-account/analyze` endpoint.
- **PDF Statement Parsing (`StatementParser.parse_pdf`)**:
  - Integrated `pdfplumber` to extract tabular data from statement PDFs, locate header rows, and standardize to FinOS schema. Updated `/upload` to accept `.pdf`.
- **Automated Tests (`tests/test_phase3.py`)**:
  - Added 8 tests covering PhonePe 90d ingestion, shop owner current account categorization, receivables delay Monte Carlo, internal transfer neutralization, transfer optimizer, dynamic `/forecast` recalculation, `/multi-account/analyze` integration, and PDF parser validation (8/8 passing; 23/23 overall across the entire test suite).

### Added
- **Multi-Feature Isolation Forest Anomaly Detection (`AnomalyDetector`)**:
  - Upgraded anomaly model from 1D log-amount to 4-dimensional feature vector: Category Z-score, Merchant Frequency, Day of Month ($1..31$), and Amount / Category Median ratio.
  - Generated plain-English explanations for every flagged anomaly formatted with exact multiples (e.g. *"5.2x your usual Food spend (₹3,200 vs typical ₹615)"*).
  - Categorized severity into HIGH, MEDIUM, and LOW based on relative ratio and absolute exposure.
- **LLM Fallback Categorization & In-Memory Cache (`AutoCategorizer`)**:
  - Ambiguous merchants scoring low on heuristics/NLP query Gemini 2.5 Flash via REST API (strictly sanitized under DPDP Act 2023) and cache results in memory.
  - Flagged transactions display an `"AI-categorized"` pill (✨) in the ledger.
  - Seamless fallback to heuristic/NLP logic when `GEMINI_API_KEY` is not present.
- **Empirical Accuracy Benchmark (`AutoCategorizer.evaluate_benchmark`)**:
  - Evaluated on a 58-sample held-out benchmark of realistic Indian financial transactions.
  - Achieved **93.1% overall accuracy** (100% on Travel, Bills & Utilities, Shopping, Health, EMI/Loans, Rent, Income, Other/Transfer).
- **Gemini Explanations (`POST /explain`)**:
  - Executive narrative synthesis grounded strictly in verified Monte Carlo drivers (bills before inflow, inflow arrival gap, breach range) without hallucinating figures.
- **"Ask FinOS" Conversational Chat Copilot (`POST /chat` & `frontend/components/AskFinOSChat.tsx`)**:
  - Slide-out copilot drawer in Ramp dark UI with quick suggested question chips.
  - Built-in What-If decision interpreter that automatically simulates purchases (e.g. *"What if I buy a ₹35,000 laptop in 7 days?"*) or late payment delays via comparative Monte Carlo runs and renders a structured delta impact card.
- **Automated Tests (`tests/test_phase2.py`)**:
  - Added 7 comprehensive automated tests for multi-feature Isolation Forest, LLM cache, benchmark evaluation, DPDP masking, `/explain`, and `/chat` with What-If simulations (7/7 passing; 15/15 overall).

---

## [Phase 1: Must-Haves - Core Financial Intelligence] - 2026-11-14

### Added
- **Rolling-Origin Backtesting Engine (`BacktestEngine`)**:
  - Implemented rolling-origin cross-validation (`GET /backtest`, `POST /backtest`) training on historical months $1..N$ and testing out-of-sample on month $N+1$.
  - Computes Model MAE, Naive Moving-Average MAE, % Improvement over naive baseline, Model MAPE, and Calibration (fraction of actual daily balances within the 80% CI; target $\sim 80\%$).
  - Added short history disclosure for statements $< 6$ months.
- **Accuracy View (`frontend/components/AccuracyView.tsx`)**:
  - Dedicated **Accuracy & Backtest** dashboard view with 4 KPI cards, out-of-sample Recharts composed chart (Actual vs $P_{50}$ with 80% CI and Naive MA), and uncertainty band calibration audit table.
- **Personalized Spending Limits (`SpendingLimitOptimizer`)**:
  - Binary search algorithm (`GET /limits`, `POST /limits`) over 1,000 Monte Carlo runs to determine the maximum safe daily spend cap keeping breach risk $< 10\%$.
  - Calculates proportional daily/monthly caps for top 3 variable spending categories.
  - Added **Personalized Spending Limit Card** on Overview dashboard (`Spend ≤ ₹X/day to stay safe`).
- **Simulation-Driven Explainability**:
  - Root cause and diagnostic explanation generator extracts exact simulation drivers: fixed bills due before next inflow, expected inflow gap in days, breach date range, and top 3 financial drivers with ₹ impact.
- **Simulation Hardening & Data Sufficiency**:
  - Replaced plain Gaussian variable spend with bootstrapped historical days (or log-normal clipped $\ge 0$).
  - Implemented Bayesian renewal prior blending for accounts with $< 4$ income events.
  - Added dynamic data-sufficiency badge (`LOW`, `MODERATE`, `HIGH`) and expanded uncertainty bands for sparse history.
  - Added algorithmic confidence scores (50% to 99%) for recurring subscriptions and EMIs.
- **Automated Tests (`tests/test_phase1.py`)**:
  - Added pytest tests for limits binary search, rolling-origin backtesting, data sufficiency, and simulation drivers (8/8 tests passing).

---

## [Phase 0: Architecture & Codebase Audit] - 2026-11-14

### Added
- Comprehensive technical audit document [AUDIT.md](AUDIT.md) cataloging real vs mocked features and technical debt across the stack.
- Baseline automated test suite [tests/test_baseline.py](tests/test_baseline.py) covering amount cleaning, DPDP masking, categorizer heuristics, and Monte Carlo forecasting.

### Fixed
- **Regex Masking Precedence Bug**: Resolved ordering issue in `PrivacyMasker` where generic account regex was capturing 12-digit UTR numbers before `UTR_REGEX`.
- **Hardcoded File Paths**: Replaced hardcoded `/Users/vikasn/...` paths in `backend/generate_data.py` and `README.md` with dynamic relative paths.
- **Documentation Mismatches**: Clarified in `README.md` that FinOS uses a 100% stateless in-memory REST architecture (removing contradictory "session manager" claims).
- **Authentication Demo Labeling**: Added clear "Interactive Demo Showcase" indicators on the login screen and documentation.
