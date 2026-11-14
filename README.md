# FinOS: Predictive Cash Flow Manager for Irregular Earners

FinOS is an enterprise-grade, privacy-first FinTech platform built specifically for freelancers, gig consultants, and irregular earners. It models cash timing asymmetry, detects recurring commitments, runs **1,000 Monte Carlo stochastic forecast simulations**, flags spending anomalies via Isolation Forests, and provides interactive "What-If" stress testing—all packaged inside a pixel-perfect conceptual clone of the **Ramp.com** design system.

---

## 🌟 Key Capabilities & Upgrades

### 1. Robust Real-World Bank Data Ingestion (`backend/ingestion.py`)
- **PhonePe & Bank Statement Preambles**: Automatically skips preambles (such as PhonePe's 3-line metadata preamble) by locating header lines containing `Transaction Details` and `Amount`.
- **Chronological Sorting & Balance Rebuilding**: Indian UPI statements order transactions newest-first. The engine sorts chronologically (`ascending=True`) before executing `df['Running Balance'] = starting_balance + df['Amount'].cumsum()`.
- **100% Stateless Architecture**: Eliminates server-side session state leakage. The `/upload` endpoint processes files in memory and immediately returns the full payload to the React client. Zero persistent session or database storage is retained on the backend.
- **DPDP Act 2023 Compliance**: Built-in regex sanitization strips phone numbers (`XXXXXX1234`), UPI IDs (`u***@bank`), and UTRs before client delivery.

### 2. Hybrid Indian-Context Auto-Categorizer (`backend/ml_engine.py`)
- **Heuristics-First, ML-Second**: Targets common Indian payees with high-precision regex matching (`Investments`, `Travel`, `Food`, `Bills & Utilities`, `Shopping`, `Health`, `EMI/Loans`, `Rent`, `Subscriptions`, `Income`).
- **P2P Transfer Fallback**: Individual UPI payments (e.g., "Paid to RAMESHA") default to `Other/Transfer` instead of misclassifying into `Food`.

### 3. Resilient Client-Side State & Error Boundaries (`frontend/`)
- **Zero Undefined Crashes**: Safe optional chaining (`?.map`, `?.length`) across all components with dedicated `<EmptyState />` fallback.
- **Instant State Invalidation**: Uploading a new statement immediately resets previous state (`setTransactions(null)`, `setForecast(null)`) to prevent stale data display.
- **HTTP Error Toasts**: Network failures or invalid statements catch 400/500 backend responses, stop loaders, and render dismissible alerts without breaking the UI.

### 4. Premium Ramp.com Design System Clone
- **Color Tokens**: Deep charcoal backgrounds (`#0a0a0a`), stark elevated cards (`#121418`, `#1b1d23`), hairline borders (`border-white/10`), and Ramp's signature neon lime accent (`#d9f154`).
- **Split-Screen Auth Showcase (`/login`)**:
  - **Demo Notice**: Authentication page and SSO buttons (Google/Apple) are designed as a front-end interactive demo showcase; no external OAuth server is required. Clicking sign-in instantly navigates to the dashboard.
  - Left: Minimalist login with glassmorphism inputs, demo credentials, and DPDP compliance indicators.
  - Right: Deep ambient gradient backdrop with a live 60-day runway radar card and value-prop customer quote.
- **Dashboard (`/dashboard`)**:
  - **View 1 (Overview)**: Dynamic headline risk radar, key metrics row, 60-day Recharts forecast chart with shaded 80% CI bands, recurring obligations card, and category breakdown.
  - **View 2 (Ledger)**: Enterprise data table with category pills, DPDP masking audit badges, search, and anomaly warnings.
  - **View 3 (What-If Simulator)**: Interactive sliders for capital purchases, freelance invoice delays, new EMIs, and a "Before vs After" comparative Recharts visualization.
  - **Empty State**: Polished empty state with one-click sample dataset restoration.

---

## 🏗️ Architecture & Project Structure

```
finos/
├── backend/
│   ├── ingestion.py          # Robust CSV parsing for real messy Indian bank data
│   ├── generate_data.py      # Synthetic 2-year Indian bank transaction generator
│   ├── ml_engine.py          # DPDP Masking, NLP Categorizer, Monte Carlo, Isolation Forest
│   ├── main.py               # FastAPI server (Stateless REST endpoints & analytics pipeline)
│   └── requirements.txt      # Python dependencies
├── data/
│   └── synthetic_transactions.csv  # 24-month reference dataset (1,082 txns)
├── frontend/
│   ├── app/
│   │   ├── globals.css       # Tailwind CSS & Ramp dark theme styles
│   │   ├── layout.tsx        # Inter & JetBrains Mono typography injection
│   │   ├── page.tsx          # Root redirect to /login
│   │   ├── login/
│   │   │   └── page.tsx      # Interactive demo login page
│   │   └── dashboard/
│   │       └── page.tsx      # Main dashboard (Overview, Ledger, Simulator, Empty States)
│   ├── components/
│   │   ├── Sidebar.tsx       # Ramp collapsible navigation & quick controls
│   │   ├── RiskBanner.tsx    # Dynamic headline alert & root-cause card
│   │   ├── MetricsRow.tsx    # Liquidity, 30-day net flow, fixed bills, runway
│   │   ├── ForecastChart.tsx # 60-Day Recharts stochastic forecast with 80% CI
│   │   ├── RecurringBillsCard.tsx # Auto-detected subscriptions & cadence
│   │   ├── CategoryDonutCard.tsx  # NLP category spending breakdown
│   │   ├── TransactionTable.tsx   # Enterprise ledger with search, filters & PII tags
│   │   ├── SimulatorView.tsx      # What-If sliders, Before-vs-After comparison chart
│   │   ├── EmptyState.tsx         # Polished empty state with one-click sample loader
│   │   └── UploadModal.tsx        # Drag-and-drop CSV importer with DPDP audit
│   ├── package.json
│   ├── tailwind.config.js     # Ramp colors (#d9f154 neon lime, #0a0a0a dark)
│   └── tsconfig.json
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
# From repository root
pip install -r backend/requirements.txt

# Generate or verify synthetic dataset
python backend/generate_data.py

# Launch FastAPI Backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API runs on `http://127.0.0.1:8000` (Interactive docs: `http://127.0.0.1:8000/docs`).*

### 2. Frontend Setup

```bash
# In frontend directory
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000` (Redirects to `/login`).*

---

## 🧠 Machine Learning & Statistical Modeling

### 1. Monte Carlo Simulation Engine
Irregular earners cannot be modeled with simple linear moving averages. FinOS models the next 60 days using 1,000 stochastic trajectories:
$$\text{Balance}_t = \text{Balance}_{t-1} + \mathbb{I}_{\text{Inflow}}(t) \cdot X_{\text{inflow}} - \text{FixedBills}(t) - X_{\text{daily\_burn}} - \text{Modifiers}(t)$$
Where:
- $\mathbb{I}_{\text{Inflow}}(t)$ represents freelance payout arrival drawn from an empirical renewal process.
- $\text{FixedBills}(t)$ locks identified recurring bills strictly to day-of-month calendar dates.
- $X_{\text{daily\_burn}} \sim \mathcal{N}(\mu_{\text{burn}}, \sigma_{\text{burn}})$ models daily living expenses.
- 1,000 independent simulation paths are aggregated to compute $P_{10}, P_{25}, P_{50}, P_{75}, P_{90}$ and the risk breach probability:
$$\mathbb{P}(\text{Breach}) = \frac{1}{1000} \sum_{k=1}^{1000} \mathbb{I}\left(\min_{t \in [1, 60]} B_t^{(k)} < B_{\text{safe}}\right) \times 100\%$$

### 2. Isolation Forest Anomaly Detection
Uses `sklearn.ensemble.IsolationForest(contamination=0.02)` on log-transformed amounts:
$$x = \ln(1 + |\text{Amount}|)$$
Surfaces outsized expenditures (e.g. ₹1,89,900 MacBook Pro purchase, ₹34,500 emergency hospital bill).

### 3. NLP Text Categorization
Combines TF-IDF vectorization with regularized Logistic Regression trained on Indian merchant semantics (Swiggy, Blinkit, Cult.fit, HDFC Loan, Upwork, BESCOM), reinforced with rule-based deterministic precedence for high accuracy.

---

## 🔒 Sensible Assumptions & Privacy Design

1. **Freelancer Persona**:
   - Consultant earning ₹40,000–₹1,80,000 per milestone from global/local clients (Upwork, Razorpay, wire transfers).
   - Incurring monthly rent (₹28,000 on 1st), personal loan EMI (₹16,500 on 5th), and SaaS subscriptions.
2. **Indian Financial Text Format**:
   - Accounts for UPI 12-digit reference numbers (`UPI/412...`), NEFT transaction strings, ACH auto-debits, and ATM withdrawals.
3. **Planted Cash Crunch Scenario**:
   - Includes an intentional historical stress period in Month 11 where client milestone payment is delayed by 23 days while Rent and EMI hit within 4 days, causing balance to drop to ₹4,334.30 (breaching the ₹5,000 safety threshold).
4. **Zero Persistent Storage (DPDP Act 2023)**:
   - Statements are parsed in-memory. Clicking "Delete My Data" in the sidebar instantly resets all session state.
