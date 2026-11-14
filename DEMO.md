# FinOS: 2-Minute Hackathon Demo Script

> **Problem Statement**: *"AI-Powered Personal Financial Operating System for Predictive Cash Flow Management"*  
> **Audience**: Individuals, Freelancers, & Small Business (SMB) Owners | Savings & Current Accounts | India (₹, UPI)

---

## ⏱️ Timeline Overview (120 Seconds)

| Time | Section | Key Feature / Screen Highlight |
|---|---|---|
| **0:00 – 0:20** | **Real-World Ingestion & Dual Personas** | Empty State, PhonePe 90d, Shop Owner SMB Current Account |
| **0:20 – 0:45** | **Forecast Cone & Explainable "Why"** | 1,000 Monte Carlo Runs, 80% CI, Exact Simulation Drivers |
| **0:45 – 1:10** | **What-If Decision Stress Testing** | One-Click Scenarios (Late Payment, Bulk Stock Purchase, New Hire) |
| **1:10 – 1:30** | **Predictive Accuracy & Backtesting** | Rolling-Origin Backtesting, MAE vs Naive Baseline, Calibration |
| **1:30 – 1:45** | **Ask FinOS AI Copilot** | Grounded Conversational Q&A + In-Chat What-If Simulation |
| **1:45 – 2:00** | **Multi-Account Consolidation** | Internal Transfer Neutralization & Optimal Transfer Recommendation |

---

## 🎬 Step-by-Step Walkthrough

### 1. Real-World Statement Ingestion & Empty State (0:00 – 0:20)
1. Navigate to `http://localhost:3000/dashboard`.
2. **Talking Point**:
   > *"Traditional personal finance apps look backward at historical spend. FinOS is an operating system that looks forward 60 days into the future. We support both irregular earners and small business shop owners with Savings and Current accounts."*
3. Point to the **Empty State** showing the three pre-packaged Indian sample datasets:
   - **Freelancer (24 Mo)**: High-variance consulting milestone payouts and living expenses.
   - **PhonePe (90 Days)**: Real-world export with 3-line preamble, newest-first ordering, no running balance column, and UPI strings.
   - **Shop Owner (SMB Current A/C)**: Daily counter sales, weekly supplier payments, payroll on 1st, GST on 20th, and overdraft buffer.
4. Click **"Load Freelancer (24 Mo)"** (or **"Load Shop Owner"**).
5. Watch the dashboard instantly populate in under 1 second without any server-side database storage (**100% stateless under DPDP Act 2023**).

---

### 2. Cash Flow Forecast & The "Why" (0:20 – 0:45)
1. **Risk Radar Banner**:
   - Point to the **Breach Probability** badge (e.g., `HIGH RISK` or `HEALTHY`).
   - Highlight the **Data Sufficiency Badge** (`HIGH HISTORY: 730 DAYS`).
2. **The Explainable "Why" (Zero Hallucinations)**:
   - Expand the **Why is my cash flow at risk?** section.
   - Point out that FinOS doesn't guess: it calculates the exact **Bills Before Expected Inflow** (e.g. *Rent ₹28,000* and *HDFC Loan EMI ₹16,500* due before payout), the **Expected Inflow Arrival Gap** (28 days), and the **Top 3 Cash Drivers** with exact ₹ impact.
3. **Personalized Spending Limits Card**:
   - Point to the **"Spend ≤ ₹850/day to stay safe"** card.
   - Mention: *"Calculated via binary search across 1,000 Monte Carlo runs to ensure your buffer breach probability stays strictly below 10%."*
4. **60-Day Recharts Forecast**:
   - Hover over the fan chart showing the median ($P_{50}$), optimistic ($P_{90}$), and stress ($P_{10}$) paths along with the dashed ₹5,000 Minimum Safe Buffer line.

---

### 3. What-If Cash Flow Stress Testing (0:45 – 1:10)
1. Click **What-If Simulator** in the sidebar.
2. **Talking Point**:
   > *"Before making a large purchase or signing a lease, users need to know: 'Will this trigger a cash crunch?'"*
3. Click the Quick Scenario chip: **"📦 Bulk Stock Purchase (₹75k)"** (or **"⏱️ Customer Pays 20d Late"**).
4. Watch the simulator immediately recompute 1,000 comparative paths:
   - **Breach Probability Delta**: e.g., `0.0% → 34.2% (+34.2% increase in risk)`.
   - **Lowest Median Balance**: Visualizes the exact drop.
   - **Before vs After Chart**: White line (current baseline) vs. Neon Lime line (simulated scenario) showing exactly when the cash breach occurs.

---

### 4. Predictive Accuracy & Backtesting (1:10 – 1:30)
1. Click **Accuracy & Backtest** in the sidebar.
2. **Talking Point**:
   > *"Judges often ask: 'Can we trust these forecast numbers?' We evaluate model accuracy directly against the user's historical statement using rolling-origin backtesting."*
3. Highlight the 4 KPI Cards:
   - **Model MAE**: Mean absolute balance error across rolling out-of-sample test months.
   - **Naive Baseline MAE**: Moving-average benchmark.
   - **Improvement Over Naive**: e.g. **+38.4% improvement** over standard moving average.
   - **80% CI Calibration**: e.g. **81.5%** of actual balances fall inside the predicted $P_{10}-P_{90}$ band (target: 80%).
4. Show the **Out-of-Sample Actual vs. Forecast Chart** showing historical actuals tracking inside the shaded predictive cone.

---

### 5. "Ask FinOS" Grounded AI Copilot (1:30 – 1:45)
1. Click the **"Ask FinOS"** button in the top header.
2. The slide-out drawer opens with suggested question chips.
3. Ask or click: *"What if I buy a ₹35,000 laptop in 10 days?"*
4. **Talking Point**:
   > *"Our LLM is strictly restricted: it cannot invent numbers. When asked a financial decision, it triggers our Python simulation engine and returns a structured Before vs After delta card alongside an empathetic explanation."*
5. Show the generated reply with the inline **What-If Simulation Delta card** showing risk change and balance impact.

---

### 6. Multi-Account Consolidation & Liquidity Balancing (1:45 – 2:00)
1. Click **Multi-Account** in the sidebar.
2. **Talking Point**:
   > *"Most small business owners have a Current Account for operations and a Savings Account for reserves. FinOS consolidates them without double-counting internal round-trips."*
3. Point out the **Neutralized Internal Transfers** table:
   - Shows matching paired debits and credits within 2 days (e.g. ₹25,000 transfer between accounts) tagged as `"Internal Transfer"` and excluded from operating cash burn.
4. Point out the **Recommended Inter-Account Transfer Card**:
   - Highlight the prescription: *"Transfer ₹20,000 from Savings Reserve on 22 Aug reduces Current Account breach risk from 18.2% to 3.5% (< 10%)"*.
5. Conclude:
   > *"FinOS transforms raw bank statements into an autonomous financial operating system: predicting crunches before they happen, explaining why, and recommending the exact transfer to stay safe."*

---

## 🏆 Key Judge Questions & Answers

- **Q: Are the numbers generated by an LLM?**  
  **A**: Absolutely not. All numbers come strictly from our Python engine (1,000 Monte Carlo runs, Isolation Forest, and binary search limit optimizer). The LLM is strictly used for text synthesis and categorization fallback.
- **Q: How is user privacy protected?**  
  **A**: FinOS is 100% stateless and compliant with India's DPDP Act 2023. No financial records are stored on disk or database. All UPI IDs, phone numbers, and UTRs are masked before processing.
- **Q: How do you handle small business shop owners vs. freelancers?**  
  **A**: Users can toggle between Savings (₹5,000 buffer) and Current (₹25,000 overdraft buffer) modes. For Current accounts, we model B2B receivables delay distributions that widen the forecast cone to reflect late-paying clients.
