# FinOS Changelog

All notable changes to the FinOS Predictive Cash Flow Operating System will be documented in this file.

## [Unreleased]

---

## [Phase 2: AI Layer & Conversational Copilot] - 2026-11-14

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
