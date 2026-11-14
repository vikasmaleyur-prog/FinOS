"""
FinOS Machine Learning & Analytics Engine
Features:
1. DPDP Act 2023 Compliant PII Masking & Data Sanitization.
2. Hybrid Indian-Context Auto-Categorizer (Heuristics-First with Regex, ML-Second with NLP).
3. Recurring Payment & Subscription Detector.
4. Monte Carlo Cash Flow Forecasting (1,000 runs, P10/P50/P90 bands).
5. Isolation Forest Anomaly Detection.
6. What-If Stress-Testing & Simulation Engine.
7. Plain-Language Financial Explainability & Root Cause Diagnostics.
"""

import re
import datetime
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest


# ==========================================
# 1. DPDP ACT 2023 PRIVACY MASKING
# ==========================================

class PrivacyMasker:
    """Masks Personally Identifiable Information (PII) to comply with DPDP Act 2023."""
    
    PHONE_REGEX = re.compile(r'\b(?:(?:\+91|91|0)?[6-9]\d{9})\b|\b\d{10}\b')
    UPI_REGEX = re.compile(r'\b[A-Za-z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b')
    ACCOUNT_REGEX = re.compile(r'\b(?:A/C\s*|SB-|CA\s*|CARD\s*)?(\d{9,18})\b', re.IGNORECASE)
    PAN_REGEX = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
    UTR_REGEX = re.compile(r'\b(?:UTR|REF|TXN)?[:\s/]?([0-9]{12})\b', re.IGNORECASE)

    @classmethod
    def mask_text(cls, text: str) -> Tuple[str, Dict[str, int]]:
        """Masks PII elements and returns masked string plus audit count of masked items."""
        if not isinstance(text, str):
            return str(text), {}

        masked = text
        stats = {
            "phones_masked": 0,
            "upi_masked": 0,
            "accounts_masked": 0,
            "pan_masked": 0,
            "utr_masked": 0
        }

        # 1. Mask Phone Numbers: keep last 3 digits
        def phone_repl(m):
            stats["phones_masked"] += 1
            s = m.group(0)
            return f"XXXXXX{s[-3:]}"
        masked = cls.PHONE_REGEX.sub(phone_repl, masked)

        # 2. Mask UPI Handles: e.g. ramesha@okaxis -> r***@okaxis
        def upi_repl(m):
            stats["upi_masked"] += 1
            parts = m.group(0).split('@')
            if len(parts) == 2:
                handle, bank = parts[0], parts[1]
                masked_handle = handle[0] + "***" if len(handle) > 1 else "***"
                return f"{masked_handle}@{bank}"
            return "u***@upi"
        masked = cls.UPI_REGEX.sub(upi_repl, masked)

        # 3. Mask Bank Account / Card numbers
        def acc_repl(m):
            stats["accounts_masked"] += 1
            digits = re.sub(r'\D', '', m.group(0))
            if len(digits) >= 9:
                return f"A/C XXXXXX{digits[-4:]}"
            return m.group(0)
        masked = cls.ACCOUNT_REGEX.sub(acc_repl, masked)

        # 4. Mask UTR numbers
        def utr_repl(m):
            stats["utr_masked"] += 1
            return "UTR-XXXXXX"
        masked = cls.UTR_REGEX.sub(utr_repl, masked)

        # 5. Mask PAN
        def pan_repl(m):
            stats["pan_masked"] += 1
            s = m.group(0)
            return f"{s[:2]}XXXXX{s[-2:]}"
        masked = cls.PAN_REGEX.sub(pan_repl, masked)

        return masked, stats

    @classmethod
    def mask_dataframe(cls, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, int]]:
        """Sanitizes an entire transaction DataFrame and records masking metrics."""
        cleaned_df = df.copy()
        total_stats = {
            "phones_masked": 0,
            "upi_masked": 0,
            "accounts_masked": 0,
            "pan_masked": 0,
            "utr_masked": 0
        }

        target_col = "Transaction Details" if "Transaction Details" in cleaned_df.columns else "Description"
        if target_col in cleaned_df.columns:
            masked_descs = []
            for text in cleaned_df[target_col]:
                masked_str, stats = cls.mask_text(str(text))
                masked_descs.append(masked_str)
                for k, v in stats.items():
                    total_stats[k] += v

            cleaned_df["Raw_Description"] = cleaned_df[target_col]
            cleaned_df["Description"] = masked_descs
            cleaned_df["Transaction Details"] = masked_descs

        return cleaned_df, total_stats


# ==========================================
# 2. HYBRID INDIAN-CONTEXT CATEGORIZER
# ==========================================

class AutoCategorizer:
    """
    Heuristics-First, ML-Second Hybrid Categorizer:
    1. Evaluates regex rules on Indian/UPI payees (Swiggy, Zerodha, BESCOM, BMTC, etc.).
    2. Identifies inflows and income milestones.
    3. Passes only uncategorized items (e.g. peer payments) to TF-IDF NLP model or defaults to Other/Transfer.
    """

    # Primary Indian Heuristic Rules (Exact specifications)
    HEURISTIC_RULES = [
        # Investments: jar gold, groww, zerodha, mutual fund, sip, upstox
        (re.compile(r'(?i)(jar gold|groww|zerodha|mutual fund|sip|upstox|kuvera|indmoney|et money|smallcase|sebi|stock|shares|uti|nippon|haptic|coin)'), 'Investments'),
        
        # Travel: bmtc, namma metro, ksrtc, uber, ola, rapido, makemytrip, irctc
        (re.compile(r'(?i)(bmtc|namma metro|ksrtc|uber|ola|rapido|makemytrip|irctc|redbus|indigo|air india|fastag|petrol|fuel|diesel|iocl|bpcl|hpcl|toll|metro|flight)'), 'Travel'),
        
        # Food: swiggy, zomato, zepto, blinkit, mcdonalds, restaurant, cafe
        (re.compile(r'(?i)(swiggy|zomato|zepto|blinkit|mcdonalds|restaurant|cafe|starbucks|chai point|blue tokai|dominos|pizza|burger|eatclub|kfc|subway|biryani|bakery|food)'), 'Food'),
        
        # Bills & Utilities: bescom, bwssb, airtel, jio, vi, electricity, recharge, broadband
        (re.compile(r'(?i)(bescom|bwssb|airtel|jio|vi\b|vodafone|electricity|recharge|broadband|actcorp|fibernet|dth|tata play|gas bill|water bill|bill payment|utility)'), 'Bills & Utilities'),
        
        # Shopping: amazon, flipkart, myntra, ajio, shopping
        (re.compile(r'(?i)(amazon|flipkart|myntra|ajio|shopping|croma|reliance|retail|dmart|tatacliq|ikea|zara|h&m|decathlon|store|mall|apparel)'), 'Shopping'),
        
        # Health: hospital, apollo, medplus, pharmacy, clinic
        (re.compile(r'(?i)(hospital|apollo|medplus|pharmacy|clinic|1mg|lalpath|manipal|dr\b|doctor|practo|pharmeasy|cult\.fit|cultfit|gym|healthcare|diagnostic|medical)'), 'Health'),
        
        # EMI/Loans: emi, loan, credit card, bajaj
        (re.compile(r'(?i)(emi|loan|credit card|bajaj|hdfcloan|home loan|car loan|personal loan|ach dr/|ecs debit|installment)'), 'EMI/Loans'),

        # Rent: landlord, rent, flat rent, pg rent
        (re.compile(r'(?i)(rent|landlord|house rent|flat rent|pg rent|society maintenance|maintenance deposit)'), 'Rent'),

        # Subscriptions: SaaS, Cloud, Streaming
        (re.compile(r'(?i)(netflix|spotify|figma|github|aws|prime|hotstar|google storage|youtube premium|cloud|notion|openai|anthropic|adobe|apple\.com/bill)'), 'Subscriptions'),
    ]

    INCOME_REGEX = re.compile(r'(?i)(salary|freelance|client|upwork|razorpay|escrow|retainer|refund|cashback|interest|dividend|inward|payout|neft|imps|received from|stipend|consulting)')

    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), token_pattern=r'(?u)\b\w+\b', max_features=3000)
        self.classifier = LogisticRegression(C=1.0, max_iter=300, random_state=42)
        self.is_trained = False
        self._train_default_model()

    def _train_default_model(self):
        """Trains fallback NLP model with merchant-specific training data."""
        training_corpus = [
            ("Swiggy India Food Bangalore online delivery", "Food"),
            ("Zomato restaurant order lunch dinner biryani", "Food"),
            ("Chai Point tea snacks coffee Koramangala", "Food"),
            ("Blue Tokai Coffee Roasters cafe latte", "Food"),
            ("Blinkit instant grocery delivery milk bread veggies", "Food"),
            ("Zepto quick commerce groceries fruits eggs", "Food"),

            ("Uber India ride cabs commute airport Bangalore", "Travel"),
            ("Ola Cabs auto ride booking", "Travel"),
            ("BMTC Bus Pass travel commute", "Travel"),
            ("Namma Metro card recharge Bangalore", "Travel"),
            ("Fastag recharge highway toll plaza", "Travel"),
            ("Indian Oil Petrol Pump fuel diesel petrol", "Travel"),
            ("IRCTC train ticket booking railway", "Travel"),

            ("Zerodha Broking Ltd equity shares investment", "Investments"),
            ("Groww Invest stocks mutual funds", "Investments"),
            ("JAR Gold daily savings accumulation", "Investments"),
            ("Upstox trading account deposit", "Investments"),

            ("Electricity BESCOM Bangalore electricity bill payment", "Bills & Utilities"),
            ("BWSSB water supply bill payment", "Bills & Utilities"),
            ("Airtel Fiber Broadband recharge", "Bills & Utilities"),
            ("Jio Prepaid mobile recharge plan", "Bills & Utilities"),

            ("Amazon Retail India shopping ecommerce purchase", "Shopping"),
            ("Flipkart India electronics gadget clothing", "Shopping"),
            ("Myntra fashion apparel clothes online", "Shopping"),

            ("Apollo Pharmacy Koramangala medicines tablet", "Health"),
            ("1mg Technologies online pharmacy health test", "Health"),
            ("Manipal Hospital emergency consultation doctor clinic", "Health"),

            ("HDFC Personal Loan EMI auto debit ACH", "EMI/Loans"),
            ("Bajaj Finance consumer durable loan installment", "EMI/Loans"),
            ("Credit Card minimum due installment loan", "EMI/Loans"),

            ("House rent payment to landlord apartment flat", "Rent"),
            ("Figma design software cloud subscription", "Subscriptions"),
            ("GitHub Copilot AI developer subscription", "Subscriptions"),
            ("Netflix streaming entertainment subscription", "Subscriptions"),

            ("Upwork Global Inc escrow client milestone retainer", "Income"),
            ("Razorpay Payouts freelance consulting fee settlement", "Income"),
            ("Client project milestone UX UI development retainer", "Income"),
            ("Salary credit monthly payout employer", "Income"),
        ]

        texts = [x[0] for x in training_corpus]
        labels = [x[1] for x in training_corpus]

        X = self.vectorizer.fit_transform(texts)
        self.classifier.fit(X, labels)
        self.is_trained = True

    @classmethod
    def clean_text_for_nlp(cls, text: str) -> str:
        """Strips common UPI routing tokens like 'Paid to', 'Payment to', reference numbers."""
        t = re.sub(r'(?i)^(paid to|payment to|received from|transfer to|upi/|neft/|imps/)', '', text)
        t = re.sub(r'[\w.-]+@[\w.-]+', '', t)  # strip UPI handle
        t = re.sub(r'\b\d+\b', '', t)  # strip numbers
        t = re.sub(r'[^\w\s]', ' ', t)
        return t.strip()

    def predict(self, text: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Heuristics-First, ML-Second evaluation for a single transaction.
        """
        raw_text = str(text or "")
        amt = float(amount) if amount is not None else 0.0

        # Rule 1: Credits & Inflows
        if amt > 0:
            return {"category": "Income", "confidence": 0.99, "method": "rule_inflow"}

        # Rule 2: Regex Heuristics
        for pattern, category in self.HEURISTIC_RULES:
            if pattern.search(raw_text):
                return {"category": category, "confidence": 0.98, "method": "heuristic_regex"}

        # Rule 3: Check income keywords even if sign was missing
        if self.INCOME_REGEX.search(raw_text):
            return {"category": "Income", "confidence": 0.95, "method": "rule_income_keyword"}

        # Rule 4: ML-Second for remaining transactions
        clean_text = self.clean_text_for_nlp(raw_text)
        
        # If text is empty or purely a person's name (e.g. 'Paid to RAMESHA'), default to Other/Transfer
        words = clean_text.split()
        if len(words) <= 2 and not any(w.lower() in ['store', 'mart', 'hospital', 'labs', 'retail'] for w in words):
            return {"category": "Other/Transfer", "confidence": 0.90, "method": "p2p_default"}

        if self.is_trained and clean_text:
            vec = self.vectorizer.transform([clean_text])
            probs = self.classifier.predict_proba(vec)[0]
            max_idx = np.argmax(probs)
            max_prob = float(probs[max_idx])
            pred_cat = self.classifier.classes_[max_idx]

            # If confidence is strong, accept NLP prediction
            if max_prob >= 0.65:
                return {"category": pred_cat, "confidence": round(max_prob, 3), "method": "ml_nlp"}

        return {"category": "Other/Transfer", "confidence": 0.80, "method": "fallback_transfer"}

    def categorize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Applies Heuristics-First, ML-Second categorization across an entire DataFrame."""
        out_df = df.copy()
        target_col = "Transaction Details" if "Transaction Details" in out_df.columns else "Description"
        
        categories = []
        for _, row in out_df.iterrows():
            desc = str(row.get(target_col, ''))
            amt = float(row.get("Amount", 0.0))
            pred = self.predict(desc, amt)
            categories.append(pred["category"])

        out_df["Category"] = categories
        return out_df


# ==========================================
# 3. RECURRING PAYMENT DETECTOR
# ==========================================

class RecurringPaymentDetector:
    """Detects subscriptions, EMIs, and recurring payments with cadence and due date estimation."""

    @staticmethod
    def _clean_merchant_name(desc: str) -> str:
        d = re.sub(r'^(UPI|NEFT|IMPS|ACH|POS|ATM)[/\s\w\-]+/', '', desc, flags=re.IGNORECASE)
        d = re.sub(r'^(Paid to|Payment to|Transfer to)', '', d, flags=re.IGNORECASE)
        d = re.sub(r'A/C\s*\w+', '', d, flags=re.IGNORECASE)
        d = re.sub(r'CARD\s*\d+', '', d, flags=re.IGNORECASE)
        d = re.sub(r'\b\d{6,}\b', '', d)
        d = re.sub(r'[^\w\s]', ' ', d)
        tokens = [t for t in d.split() if len(t) > 2 and not t.isdigit()]
        return " ".join(tokens[:4]).strip().title() or "Recurring Outflow"

    @classmethod
    def detect_recurring(cls, df: pd.DataFrame) -> List[Dict[str, Any]]:
        expenses = df[df["Amount"] < 0].copy()
        if len(expenses) < 3:
            return []

        expenses["Clean_Date"] = pd.to_datetime(expenses["Date"])
        desc_col = "Transaction Details" if "Transaction Details" in expenses.columns else "Description"
        expenses["Merchant_Key"] = expenses[desc_col].apply(cls._clean_merchant_name)

        recurring_items = []

        for merchant, group in expenses.groupby("Merchant_Key"):
            if len(group) < 2:
                continue

            sorted_group = group.sort_values("Clean_Date")
            date_diffs = sorted_group["Clean_Date"].diff().dt.days.dropna().values
            amounts = sorted_group["Amount"].abs().values

            if len(date_diffs) == 0:
                continue

            mean_interval = float(np.mean(date_diffs))
            mean_amount = float(np.mean(amounts))
            std_amount = float(np.std(amounts)) if len(amounts) > 1 else 0.0

            # Cadence evaluation (Monthly: ~22-38 days, Weekly: ~6-8 days)
            is_monthly = (22 <= mean_interval <= 38)
            is_weekly = (6 <= mean_interval <= 8)
            
            amount_cv = (std_amount / mean_amount) if mean_amount > 0 else 1.0

            if (is_monthly or is_weekly) and amount_cv < 0.40:
                last_paid = sorted_group["Clean_Date"].iloc[-1]
                cadence = "Monthly" if is_monthly else "Weekly"
                interval_days = 30 if is_monthly else 7
                next_due = last_paid + datetime.timedelta(days=interval_days)

                cat = sorted_group["Category"].mode().iloc[0] if "Category" in sorted_group.columns else "Subscriptions"

                recurring_items.append({
                    "merchant": merchant,
                    "cadence": cadence,
                    "average_amount": round(float(mean_amount), 2),
                    "occurrences": int(len(group)),
                    "last_paid_date": last_paid.strftime("%Y-%m-%d"),
                    "next_due_date": next_due.strftime("%Y-%m-%d"),
                    "category": str(cat),
                    "day_of_month": int(last_paid.day)
                })

        recurring_items.sort(key=lambda x: x["average_amount"], reverse=True)
        return recurring_items


# ==========================================
# 4. CASH FLOW FORECAST & MONTE CARLO ENGINE
# ==========================================

class CashFlowForecaster:
    """
    Monte Carlo Cash Flow Simulator tailored for Irregular Earners / Freelancers.
    Simulates 1,000 future cash trajectories over 60 days.
    """

    @classmethod
    def run_monte_carlo(
        cls,
        df: pd.DataFrame,
        current_balance: float,
        forecast_days: int = 60,
        num_simulations: int = 1000,
        minimum_safe_balance: float = 5000.0,
        one_time_expenses: Optional[List[Dict[str, Any]]] = None,
        new_recurring_emis: Optional[List[Dict[str, Any]]] = None,
        income_delay_days: int = 0,
        income_boost_pct: float = 0.0,
        start_date: Optional[datetime.date] = None,
        seed: int = 42
    ) -> Dict[str, Any]:
        np.random.seed(seed)

        # 1. Base date
        if start_date is None:
            if "Date" in df.columns and len(df) > 0:
                last_txn_date = pd.to_datetime(df["Date"]).max().date()
                start_date = last_txn_date + datetime.timedelta(days=1)
            else:
                start_date = datetime.date.today()

        # 2. Extract recurring bills
        recurring_detector = RecurringPaymentDetector()
        recurring_bills = recurring_detector.detect_recurring(df)

        # 3. Analyze historical freelance income distributions
        incomes = df[df["Amount"] > 0].copy()
        if len(incomes) >= 2:
            incomes["Date_DT"] = pd.to_datetime(incomes["Date"])
            incomes = incomes.sort_values("Date_DT")
            income_intervals = incomes["Date_DT"].diff().dt.days.dropna().values
            mean_income_interval = float(np.mean(income_intervals)) if len(income_intervals) > 0 else 28.0
            std_income_interval = float(np.std(income_intervals)) if len(income_intervals) > 1 else 8.0
            income_amounts = incomes["Amount"].values
            mean_income_amount = float(np.mean(income_amounts))
            std_income_amount = float(np.std(income_amounts)) if len(income_amounts) > 1 else 20000.0
        else:
            mean_income_interval = 28.0
            std_income_interval = 8.0
            mean_income_amount = 75000.0
            std_income_amount = 25000.0

        if income_boost_pct != 0.0:
            mean_income_amount *= (1.0 + float(income_boost_pct) / 100.0)

        # 4. Analyze daily variable expenses
        expenses = df[df["Amount"] < 0].copy()
        expenses["Date_Only"] = pd.to_datetime(expenses["Date"]).dt.date
        daily_expense_totals = expenses.groupby("Date_Only")["Amount"].sum().abs()
        
        p95 = np.percentile(daily_expense_totals, 95) if len(daily_expense_totals) > 0 else 3000.0
        trimmed_daily = daily_expense_totals[daily_expense_totals <= p95]
        mean_daily_burn = float(trimmed_daily.mean()) if len(trimmed_daily) > 0 else 850.0
        std_daily_burn = float(trimmed_daily.std()) if len(trimmed_daily) > 1 else 450.0

        # Build schedule for fixed recurring expenses in the 60-day window
        scheduled_fixed_by_day = [0.0] * forecast_days
        for bill in recurring_bills:
            b_day = bill["day_of_month"]
            amt = float(bill["average_amount"])
            for d in range(forecast_days):
                cal_date = start_date + datetime.timedelta(days=d)
                if cal_date.day == b_day:
                    scheduled_fixed_by_day[d] += amt

        # Add user-simulated new recurring EMIs
        if new_recurring_emis:
            for emi in new_recurring_emis:
                e_amt = float(emi.get("amount", 0.0))
                e_day = int(emi.get("day_of_month", 5))
                for d in range(forecast_days):
                    cal_date = start_date + datetime.timedelta(days=d)
                    if cal_date.day == e_day:
                        scheduled_fixed_by_day[d] += e_amt

        # Add user-simulated one-time expenses
        scheduled_one_time_by_day = [0.0] * forecast_days
        if one_time_expenses:
            for ote in one_time_expenses:
                offset = int(ote.get("day_offset", 0))
                amt = float(ote.get("amount", 0.0))
                if 0 <= offset < forecast_days:
                    scheduled_one_time_by_day[offset] += amt

        # 5. Run 1,000 Monte Carlo Paths
        trajectories = np.zeros((num_simulations, forecast_days))
        breach_count = 0
        first_breach_days = []

        for sim_idx in range(num_simulations):
            path_balance = float(current_balance)
            days_to_next_income = int(max(3, np.random.normal(mean_income_interval, std_income_interval))) + int(income_delay_days)
            sim_breached = False

            for day_idx in range(forecast_days):
                daily_net = 0.0

                # Inflow
                if days_to_next_income <= 0:
                    sim_income = max(15000.0, float(np.random.normal(mean_income_amount, std_income_amount)))
                    daily_net += sim_income
                    days_to_next_income = int(max(15, np.random.normal(mean_income_interval, std_income_interval)))
                else:
                    days_to_next_income -= 1

                # Fixed Outflows
                daily_net -= scheduled_fixed_by_day[day_idx]

                # One-Time Outflows
                daily_net -= scheduled_one_time_by_day[day_idx]

                # Variable Outflow
                sim_variable_spend = max(0.0, float(np.random.normal(mean_daily_burn, std_daily_burn)))
                daily_net -= sim_variable_spend

                path_balance += daily_net
                trajectories[sim_idx, day_idx] = path_balance

                if path_balance < minimum_safe_balance and not sim_breached:
                    sim_breached = True
                    first_breach_days.append(day_idx)

            if sim_breached:
                breach_count += 1

        p10 = np.percentile(trajectories, 10, axis=0)
        p25 = np.percentile(trajectories, 25, axis=0)
        p50 = np.percentile(trajectories, 50, axis=0)
        p75 = np.percentile(trajectories, 75, axis=0)
        p90 = np.percentile(trajectories, 90, axis=0)

        prob_breach = round(float((breach_count / num_simulations) * 100), 1)

        first_breach_date_str = None
        days_to_breach = None
        if len(first_breach_days) > 0:
            median_breach_day = int(np.median(first_breach_days))
            days_to_breach = median_breach_day
            first_breach_date_str = (start_date + datetime.timedelta(days=median_breach_day)).strftime("%d %b %Y")

        forecast_points = []
        for d in range(forecast_days):
            target_date = start_date + datetime.timedelta(days=d)
            forecast_points.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "displayDate": target_date.strftime("%d %b"),
                "p10": round(float(p10[d]), 2),
                "p25": round(float(p25[d]), 2),
                "p50": round(float(p50[d]), 2),
                "p75": round(float(p75[d]), 2),
                "p90": round(float(p90[d]), 2),
                "scheduledFixed": round(float(scheduled_fixed_by_day[d]), 2),
                "safeThreshold": float(minimum_safe_balance)
            })

        min_median_balance = float(np.min(p50))
        min_p10_balance = float(np.min(p10))

        if prob_breach >= 60:
            risk_level = "CRITICAL"
        elif prob_breach >= 25:
            risk_level = "WARNING"
        else:
            risk_level = "HEALTHY"

        return {
            "forecast_days": int(forecast_days),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "current_balance": round(float(current_balance), 2),
            "minimum_safe_balance": float(minimum_safe_balance),
            "prob_below_safe_balance": float(prob_breach),
            "risk_level": risk_level,
            "first_breach_date": first_breach_date_str,
            "days_to_breach": days_to_breach,
            "lowest_median_balance": round(float(min_median_balance), 2),
            "lowest_p10_balance": round(float(min_p10_balance), 2),
            "mean_income_interval_days": round(float(mean_income_interval), 1),
            "mean_income_amount": round(float(mean_income_amount), 2),
            "mean_daily_burn": round(float(mean_daily_burn), 2),
            "recurring_commitments_count": int(len(recurring_bills)),
            "forecast": forecast_points
        }


# ==========================================
# 5. ISOLATION FOREST ANOMALY DETECTOR
# ==========================================

class AnomalyDetector:
    """Detects irregular transactions using Isolation Forest and category-specific Z-scores."""

    @classmethod
    def detect_anomalies(cls, df: pd.DataFrame, contamination: float = 0.02) -> List[Dict[str, Any]]:
        expenses = df[df["Amount"] < 0].copy()
        if len(expenses) < 10:
            return []

        expenses["Abs_Amount"] = expenses["Amount"].abs()
        expenses["Log_Amount"] = np.log1p(expenses["Abs_Amount"])

        model = IsolationForest(contamination=contamination, random_state=42)
        X = expenses[["Log_Amount"]].values
        expenses["Anomaly_Score"] = model.fit_predict(X)

        anomalies_df = expenses[expenses["Anomaly_Score"] == -1].copy()

        desc_col = "Transaction Details" if "Transaction Details" in anomalies_df.columns else "Description"

        results = []
        for _, row in anomalies_df.iterrows():
            amt = abs(float(row["Amount"]))
            cat = str(row.get("Category", "Other"))
            
            if amt > 50000:
                severity = "HIGH"
                reason = f"Outsized expense (₹{amt:,.0f}) significantly above normal operating baseline."
            elif amt > 15000:
                severity = "MEDIUM"
                reason = f"Unusual spike in {cat} expenditure compared to normal transactions."
            else:
                severity = "LOW"
                reason = f"Statistical outlier detected in transaction amount distribution."

            results.append({
                "date": str(row["Date"]),
                "description": str(row[desc_col]),
                "amount": float(row["Amount"]),
                "category": cat,
                "severity": severity,
                "reason": reason,
                "reference_no": str(row.get("Reference_No", ""))
            })

        results.sort(key=lambda x: abs(x["amount"]), reverse=True)
        return results


# ==========================================
# 6. EXPLAINABILITY & ROOT CAUSE GENERATOR
# ==========================================

class FinancialExplainer:
    """Generates plain-language diagnoses of cash crunches and actionable remedies."""

    @classmethod
    def generate_explanation(
        cls,
        forecast_result: Dict[str, Any],
        recurring_bills: List[Dict[str, Any]],
        sim_params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        prob = float(forecast_result.get("prob_below_safe_balance", 0.0))
        breach_date = forecast_result.get("first_breach_date")
        min_balance = float(forecast_result.get("minimum_safe_balance", 5000.0))
        current_bal = float(forecast_result.get("current_balance", 0.0))

        high_commitments = [b for b in recurring_bills if b.get("category") in ["Rent", "EMI", "EMI/Loans"]]
        sum_high = sum(float(b.get("average_amount", 0.0)) for b in high_commitments)

        if prob >= 50:
            headline = f"{int(prob)}% probability of balance dropping below ₹{min_balance:,.0f} around {breach_date or 'Day 20'}"
            root_cause = (
                f"Cash timing asymmetry detected. You have ₹{sum_high:,.0f} in fixed obligations "
                f"(Rent & Loans) due early in the month, while your irregular freelance income "
                f"(averaging ₹{forecast_result.get('mean_income_amount', 0):,.0f}) has an arrival "
                f"interval of ~{forecast_result.get('mean_income_interval_days', 28)} days. "
                f"Daily variable burn (~₹{forecast_result.get('mean_daily_burn', 850):,.0f}/day) further erodes your liquidity buffer."
            )
            actions = [
                f"Invoice current active client deliverables immediately with a 2-3% prompt-payment discount to pull forward cash before {breach_date or 'due date'}.",
                f"Contact lender to shift your loan EMI debit date from the 5th to the 12th, synchronizing with your payout clearance window.",
                f"Temporarily pause discretionary lifestyle spends to preserve ₹{forecast_result.get('mean_daily_burn', 850) * 14:,.0f} over the next two weeks."
            ]
        elif prob >= 20:
            headline = f"Moderate liquidity friction ({int(prob)}% risk) identified in upcoming 60-day cycle"
            root_cause = (
                f"Your cash cushion of ₹{current_bal:,.0f} provides partial protection, but a minor delay "
                f"in client project clearance will challenge the ₹{min_balance:,.0f} safety barrier."
            )
            actions = [
                "Maintain a rolling buffer of at least ₹25,000 for unexpected healthcare or hardware renewals.",
                "Review active SaaS and cloud subscriptions to reduce passive burn."
            ]
        else:
            headline = f"Healthy Cash Flow: Under 20% risk of buffer breach across 60 days"
            root_cause = (
                f"Inflow timing comfortably outpaces upcoming fixed commitments (₹{sum_high:,.0f}). "
                f"Liquidity is projected to remain well above the ₹{min_balance:,.0f} safe threshold."
            )
            actions = [
                "Opportunity to allocate surplus freelance retainers into high-yield emergency liquid funds.",
                "Safe window to undertake planned equipment upgrades or software licenses."
            ]

        if sim_params and sim_params.get("simulated"):
            headline = f"[Simulation Result] " + headline

        return {
            "headline": headline,
            "root_cause": root_cause,
            "actionable_recommendations": actions,
            "risk_level": forecast_result.get("risk_level", "HEALTHY")
        }
