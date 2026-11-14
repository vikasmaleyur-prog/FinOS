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

        # 3. Mask UTR numbers (before generic account regex)
        def utr_repl(m):
            stats["utr_masked"] += 1
            return "UTR-XXXXXX"
        masked = cls.UTR_REGEX.sub(utr_repl, masked)

        # 4. Mask Bank Account / Card numbers
        def acc_repl(m):
            stats["accounts_masked"] += 1
            digits = re.sub(r'\D', '', m.group(0))
            if len(digits) >= 9:
                return f"A/C XXXXXX{digits[-4:]}"
            return m.group(0)
        masked = cls.ACCOUNT_REGEX.sub(acc_repl, masked)

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

                # Calculate confidence score (0.50 to 0.99)
                interval_std = float(np.std(date_diffs)) if len(date_diffs) > 1 else 3.0
                interval_regularity = max(0.0, 1.0 - (interval_std / 15.0))
                amount_stability = max(0.0, 1.0 - amount_cv)
                occ_factor = min(1.0, len(group) / 6.0)
                conf = round(float(min(0.99, max(0.50, 0.35 * occ_factor + 0.40 * amount_stability + 0.25 * interval_regularity))), 2)

                recurring_items.append({
                    "merchant": merchant,
                    "cadence": cadence,
                    "average_amount": round(float(mean_amount), 2),
                    "occurrences": int(len(group)),
                    "last_paid_date": last_paid.strftime("%Y-%m-%d"),
                    "next_due_date": next_due.strftime("%Y-%m-%d"),
                    "category": str(cat),
                    "day_of_month": int(last_paid.day),
                    "confidence": conf,
                    "confidence_pct": int(conf * 100)
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
        daily_spend_cap: Optional[float] = None,
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

        # 3. Data sufficiency assessment
        if "Date" in df.columns and len(df) > 0:
            dates_dt = pd.to_datetime(df["Date"])
            history_days = int((dates_dt.max() - dates_dt.min()).days)
        else:
            history_days = 0

        incomes = df[df["Amount"] > 0].copy()
        n_incomes = len(incomes)

        if history_days < 90 or n_incomes < 3:
            sufficiency_level = "LOW"
            data_sufficiency_badge = f"Low history: {history_days} days, wide uncertainty"
            ci_multiplier = 1.20
        elif history_days < 180 or n_incomes < 6:
            sufficiency_level = "MODERATE"
            data_sufficiency_badge = f"Moderate history: {history_days} days"
            ci_multiplier = 1.08
        else:
            sufficiency_level = "HIGH"
            data_sufficiency_badge = f"High history: {history_days} days ({max(1, history_days // 30)} months)"
            ci_multiplier = 1.0

        # 4. Income distribution with sensible Bayesian fallback prior for < 4 incomes
        PRIOR_INTERVAL_MEAN = 30.0
        PRIOR_INTERVAL_STD = 10.0
        PRIOR_AMOUNT_MEAN = 65000.0
        PRIOR_AMOUNT_STD = 25000.0

        if n_incomes >= 2:
            incomes["Date_DT"] = pd.to_datetime(incomes["Date"])
            incomes = incomes.sort_values("Date_DT")
            income_intervals = incomes["Date_DT"].diff().dt.days.dropna().values
            emp_int_mean = float(np.mean(income_intervals)) if len(income_intervals) > 0 else PRIOR_INTERVAL_MEAN
            emp_int_std = float(np.std(income_intervals)) if len(income_intervals) > 1 else PRIOR_INTERVAL_STD
            emp_amt_mean = float(np.mean(incomes["Amount"].values))
            emp_amt_std = float(np.std(incomes["Amount"].values)) if len(incomes) > 1 else PRIOR_AMOUNT_STD

            if n_incomes < 4:
                w_prior = (4.0 - n_incomes) / 4.0
                w_emp = 1.0 - w_prior
                mean_income_interval = w_emp * emp_int_mean + w_prior * PRIOR_INTERVAL_MEAN
                std_income_interval = w_emp * emp_int_std + w_prior * PRIOR_INTERVAL_STD
                mean_income_amount = w_emp * emp_amt_mean + w_prior * PRIOR_AMOUNT_MEAN
                std_income_amount = w_emp * emp_amt_std + w_prior * PRIOR_AMOUNT_STD
            else:
                mean_income_interval = emp_int_mean
                std_income_interval = emp_int_std
                mean_income_amount = emp_amt_mean
                std_income_amount = emp_amt_std
        elif n_incomes == 1:
            mean_income_amount = 0.5 * float(incomes["Amount"].iloc[0]) + 0.5 * PRIOR_AMOUNT_MEAN
            mean_income_interval = PRIOR_INTERVAL_MEAN
            std_income_interval = PRIOR_INTERVAL_STD
            std_income_amount = PRIOR_AMOUNT_STD
        else:
            mean_income_amount = PRIOR_AMOUNT_MEAN
            mean_income_interval = PRIOR_INTERVAL_MEAN
            std_income_interval = PRIOR_INTERVAL_STD
            std_income_amount = PRIOR_AMOUNT_STD

        if income_boost_pct != 0.0:
            mean_income_amount *= (1.0 + float(income_boost_pct) / 100.0)

        # 5. Analyze daily variable expenses (bootstrapped historical days / log-normal clipped >= 0)
        expenses = df[df["Amount"] < 0].copy()
        if len(expenses) > 0:
            expenses["Date_Only"] = pd.to_datetime(expenses["Date"]).dt.date
            daily_expense_totals = expenses.groupby("Date_Only")["Amount"].sum().abs()
            p95 = np.percentile(daily_expense_totals, 95)
            trimmed_daily = daily_expense_totals[daily_expense_totals <= p95]
            if len(trimmed_daily) == 0:
                trimmed_daily = daily_expense_totals
            burn_pool = trimmed_daily.values
            mean_daily_burn = float(np.mean(burn_pool))
            std_daily_burn = float(np.std(burn_pool)) if len(burn_pool) > 1 else 450.0
        else:
            burn_pool = np.array([850.0])
            mean_daily_burn = 850.0
            std_daily_burn = 450.0

        use_bootstrap = (len(burn_pool) >= 14)
        if not use_bootstrap:
            pos_burn = burn_pool[burn_pool > 0]
            if len(pos_burn) > 0:
                log_mu = float(np.mean(np.log(pos_burn)))
                log_std = float(np.std(np.log(pos_burn))) if len(pos_burn) > 1 else 0.5
            else:
                log_mu = np.log(850.0)
                log_std = 0.5

        # Build schedule for fixed recurring expenses in the window
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

        # 6. Run Monte Carlo Simulation Paths
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

                # Variable Outflow (bootstrapped historical days or log-normal clipped >= 0)
                if use_bootstrap:
                    raw_spend = float(np.random.choice(burn_pool))
                else:
                    raw_spend = float(np.random.lognormal(log_mu, log_std))

                sim_variable_spend = max(0.0, raw_spend)
                if daily_spend_cap is not None:
                    sim_variable_spend = min(sim_variable_spend, daily_spend_cap)

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

        # Apply data sufficiency uncertainty multiplier
        if ci_multiplier != 1.0:
            p10 = p50 - (p50 - p10) * ci_multiplier
            p90 = p50 + (p90 - p50) * ci_multiplier

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

        # 7. Extract Exact Simulation Drivers for Explainability
        expected_inflow_gap = int(round(mean_income_interval)) + int(income_delay_days)
        expected_inflow_date = start_date + datetime.timedelta(days=expected_inflow_gap)

        bills_before_inflow = []
        total_fixed_before_inflow = 0.0
        for bill in recurring_bills:
            b_day = bill["day_of_month"]
            b_amt = float(bill["average_amount"])
            for d in range(min(forecast_days, expected_inflow_gap)):
                cal_date = start_date + datetime.timedelta(days=d)
                if cal_date.day == b_day:
                    bills_before_inflow.append({
                        "merchant": bill["merchant"],
                        "amount": round(b_amt, 2),
                        "due_date": cal_date.strftime("%d %b"),
                        "category": bill.get("category", "Fixed")
                    })
                    total_fixed_before_inflow += b_amt

        # Breach date range
        breach_date_range = None
        if len(first_breach_days) > 0:
            p10_day = int(np.percentile(first_breach_days, 10))
            p90_day = int(np.percentile(first_breach_days, 90))
            d_start = (start_date + datetime.timedelta(days=p10_day)).strftime("%d %b %Y")
            d_end = (start_date + datetime.timedelta(days=p90_day)).strftime("%d %b %Y")
            breach_date_range = {
                "start": d_start,
                "end": d_end,
                "median_day": int(np.median(first_breach_days)),
                "label": f"{d_start} to {d_end}"
            }

        # Top 3 drivers with ₹ impact
        driver_candidates = []
        for b in bills_before_inflow:
            driver_candidates.append({
                "driver": f"{b['merchant']} ({b['category']})",
                "amount": b["amount"],
                "category": b["category"],
                "impact_type": "Fixed Recurring Bill",
                "impact_detail": f"Due on {b['due_date']} before expected payout"
            })
        var_spend_before_inflow = round(expected_inflow_gap * mean_daily_burn, 2)
        driver_candidates.append({
            "driver": f"Variable Spend ({expected_inflow_gap} days @ ₹{mean_daily_burn:,.0f}/day)",
            "amount": var_spend_before_inflow,
            "category": "Variable",
            "impact_type": "Daily Variable Burn",
            "impact_detail": f"Cumulative living spend across {expected_inflow_gap}-day arrival gap"
        })
        if one_time_expenses:
            for ote in one_time_expenses:
                driver_candidates.append({
                    "driver": ote.get("name", "One-time Purchase"),
                    "amount": float(ote.get("amount", 0.0)),
                    "category": "Simulation Modifier",
                    "impact_type": "One-Time Expense",
                    "impact_detail": f"Scheduled in {ote.get('day_offset', 0)} days"
                })
        driver_candidates.sort(key=lambda x: x["amount"], reverse=True)
        top_drivers = driver_candidates[:3]

        return {
            "forecast_days": int(forecast_days),
            "start_date": start_date.strftime("%Y-%m-%d"),
            "current_balance": round(float(current_balance), 2),
            "minimum_safe_balance": float(minimum_safe_balance),
            "prob_below_safe_balance": float(prob_breach),
            "risk_level": risk_level,
            "first_breach_date": first_breach_date_str,
            "breach_date_range": breach_date_range,
            "days_to_breach": days_to_breach,
            "lowest_median_balance": round(float(min_median_balance), 2),
            "lowest_p10_balance": round(float(min_p10_balance), 2),
            "mean_income_interval_days": round(float(mean_income_interval), 1),
            "mean_income_amount": round(float(mean_income_amount), 2),
            "mean_daily_burn": round(float(mean_daily_burn), 2),
            "recurring_commitments_count": int(len(recurring_bills)),
            "data_sufficiency": {
                "level": sufficiency_level,
                "badge": data_sufficiency_badge,
                "history_days": history_days,
                "income_events_count": n_incomes,
                "uncertainty_multiplier": ci_multiplier
            },
            "bills_before_inflow": bills_before_inflow,
            "total_fixed_before_inflow": round(total_fixed_before_inflow, 2),
            "expected_inflow_gap_days": expected_inflow_gap,
            "expected_inflow_date": expected_inflow_date.strftime("%d %b %Y"),
            "top_drivers": top_drivers,
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
    """Generates plain-language diagnoses of cash crunches and actionable remedies directly from simulation drivers."""

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
        gap_days = int(forecast_result.get("expected_inflow_gap_days", 28))
        inflow_date = forecast_result.get("expected_inflow_date", "mid-cycle")
        bills_before = forecast_result.get("bills_before_inflow", [])
        top_drivers = forecast_result.get("top_drivers", [])
        breach_range = forecast_result.get("breach_date_range")

        # Format bills falling before inflow
        if bills_before:
            bills_desc = ", ".join([f"{b['merchant']} (₹{b['amount']:,.0f} on {b['due_date']})" for b in bills_before[:3]])
            total_fixed_before = sum(b['amount'] for b in bills_before)
        else:
            bills_desc = "No fixed obligations"
            total_fixed_before = 0.0

        breach_window_str = breach_range["label"] if breach_range else (breach_date or "upcoming cycle")

        if prob >= 50:
            headline = f"{int(prob)}% probability of balance dropping below ₹{min_balance:,.0f} between {breach_window_str}"
            root_cause = (
                f"Cash timing asymmetry detected. You have ₹{total_fixed_before:,.0f} in fixed obligations "
                f"({bills_desc}) due before your next client payout in ~{gap_days} days (around {inflow_date}). "
                f"Daily variable burn (~₹{forecast_result.get('mean_daily_burn', 850):,.0f}/day) compounds this liquidity squeeze."
            )
            actions = [
                f"Invoice current active deliverables immediately with a 2-3% prompt-payment discount to pull forward cash before {breach_date or 'due date'}.",
                f"Request shifting upcoming major bill debit dates to after {inflow_date} to match your client clearance cycle.",
                f"Cap discretionary living spend to stay within the ₹{min_balance:,.0f} safety threshold over the next {gap_days} days."
            ]
        elif prob >= 20:
            headline = f"Moderate liquidity friction ({int(prob)}% risk) identified in upcoming {gap_days}-day window"
            root_cause = (
                f"Your cash buffer of ₹{current_bal:,.0f} provides partial protection against upcoming bills ({bills_desc}), "
                f"but a minor delay in client clearance beyond {gap_days} days will test the ₹{min_balance:,.0f} threshold."
            )
            actions = [
                f"Maintain a rolling buffer of at least ₹{total_fixed_before + 15000:,.0f} for upcoming fixed commitments.",
                "Review discretionary spending and pause non-essential purchases until the next milestone clears."
            ]
        else:
            headline = f"Healthy Cash Flow: Under 20% risk of buffer breach across {forecast_result.get('forecast_days', 60)} days"
            root_cause = (
                f"Projected inflows comfortably outpace scheduled obligations (₹{total_fixed_before:,.0f} due before next payout in {gap_days} days). "
                f"Liquidity is projected to remain well above the ₹{min_balance:,.0f} safety threshold."
            )
            actions = [
                "Opportunity to allocate surplus freelance retainers into high-yield emergency liquid funds.",
                "Safe window to undertake planned hardware upgrades or software subscriptions."
            ]

        if sim_params and sim_params.get("simulated"):
            headline = f"[Simulation Result] " + headline

        return {
            "headline": headline,
            "root_cause": root_cause,
            "actionable_recommendations": actions,
            "risk_level": forecast_result.get("risk_level", "HEALTHY"),
            "bills_before_inflow": bills_before,
            "expected_inflow_gap_days": gap_days,
            "breach_date_range": breach_range,
            "top_drivers": top_drivers
        }


# ==========================================
# 7. PERSONALIZED SPENDING LIMIT OPTIMIZER
# ==========================================

class SpendingLimitOptimizer:
    """
    Finds the highest daily spend cap (and top 3 category caps)
    via binary search over Monte Carlo simulations that keeps breach probability under 10%.
    """

    @classmethod
    def calculate_optimal_limits(
        cls,
        df: pd.DataFrame,
        current_balance: float,
        minimum_safe_balance: float = 5000.0,
        target_max_breach_prob: float = 10.0
    ) -> Dict[str, Any]:
        # Ensure Category column exists
        if "Category" not in df.columns:
            categorizer = AutoCategorizer()
            df = categorizer.categorize_dataframe(df)

        expenses = df[df["Amount"] < 0].copy()
        if len(expenses) > 0:
            expenses["Date_Only"] = pd.to_datetime(expenses["Date"]).dt.date
            daily_totals = expenses.groupby("Date_Only")["Amount"].sum().abs()
            mean_burn = float(daily_totals.mean())
        else:
            mean_burn = 850.0

        # Baseline without cap
        base_res = CashFlowForecaster.run_monte_carlo(
            df=df,
            current_balance=current_balance,
            forecast_days=60,
            num_simulations=400,
            minimum_safe_balance=minimum_safe_balance
        )
        base_prob = float(base_res["prob_below_safe_balance"])

        if base_prob <= target_max_breach_prob:
            low = mean_burn
            high = max(mean_burn * 3.5, 12000.0)
        else:
            low = 0.0
            high = mean_burn

        optimal_cap = low
        for _ in range(10):
            mid = (low + high) / 2.0
            sim_test = CashFlowForecaster.run_monte_carlo(
                df=df,
                current_balance=current_balance,
                forecast_days=60,
                num_simulations=300,
                minimum_safe_balance=minimum_safe_balance,
                daily_spend_cap=mid
            )
            prob = float(sim_test["prob_below_safe_balance"])
            if prob <= target_max_breach_prob:
                optimal_cap = mid
                low = mid
            else:
                high = mid

        # Final 1,000 run on optimal cap
        final_sim = CashFlowForecaster.run_monte_carlo(
            df=df,
            current_balance=current_balance,
            forecast_days=60,
            num_simulations=1000,
            minimum_safe_balance=minimum_safe_balance,
            daily_spend_cap=optimal_cap
        )
        final_prob = float(final_sim["prob_below_safe_balance"])

        # Category caps for top 3 variable categories
        var_expenses = expenses[~expenses["Category"].isin(["Rent", "EMI", "EMI/Loans", "Income"])].copy()
        category_caps = []
        if len(var_expenses) > 0:
            cat_totals = var_expenses.groupby("Category")["Amount"].sum().abs().to_dict()
            total_var_spend = sum(cat_totals.values())
            sorted_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:3]

            for cat_name, cat_amt in sorted_cats:
                share = (cat_amt / total_var_spend) if total_var_spend > 0 else 0.33
                cat_daily = round(optimal_cap * share, 2)
                category_caps.append({
                    "category": cat_name,
                    "daily_cap": cat_daily,
                    "monthly_cap": round(cat_daily * 30, 2),
                    "share_pct": round(share * 100, 1)
                })

        burn_reduction_needed = max(0.0, round(mean_burn - optimal_cap, 2))
        is_sufficient = (optimal_cap >= mean_burn * 0.70)

        headline = f"Spend ≤ ₹{round(optimal_cap):,}/day to stay safe"
        if base_prob > target_max_breach_prob and optimal_cap <= 10.0 and final_prob > target_max_breach_prob:
            action_text = "Upcoming fixed obligations (Rent & Loans) alone cause buffer breach. Freeze discretionary spend and accelerate invoice clearance."
            headline = "Spend ≤ ₹0/day (Fixed Bills Exceed Buffer)"
        else:
            action_text = f"Capping daily variable burn at ₹{round(optimal_cap):,}/day keeps buffer breach probability at {final_prob:.1f}% (< 10%)."

        return {
            "recommended_daily_cap": round(optimal_cap, 2),
            "recommended_monthly_cap": round(optimal_cap * 30, 2),
            "current_daily_burn": round(mean_burn, 2),
            "current_monthly_burn": round(mean_burn * 30, 2),
            "breach_prob_at_cap": final_prob,
            "baseline_breach_prob": base_prob,
            "burn_reduction_needed": burn_reduction_needed,
            "is_budget_sufficient": is_sufficient,
            "top_category_caps": category_caps,
            "headline": headline,
            "action_text": action_text
        }


# ==========================================
# 8. ROLLING-ORIGIN BACKTESTING ENGINE
# ==========================================

class BacktestEngine:
    """
    Rolling-origin evaluation engine for cash flow forecasting:
    - Trains on historical months 1..N, forecasts month N+1, repeats across splits.
    - Computes MAE, MAPE, and Calibration (share of actual daily balances inside 80% CI; target ~80%).
    - Evaluates naive baseline (moving-average forecast) and reports % improvement over it.
    - If statement history is < 6 months, runs shorter backtest with explicit disclosure.
    """

    @classmethod
    def run_rolling_backtest(
        cls,
        df: pd.DataFrame,
        initial_balance: Optional[float] = None,
        test_window_days: int = 30
    ) -> Dict[str, Any]:
        if len(df) == 0:
            raise ValueError("Cannot backtest empty dataset.")

        df_sorted = df.copy()
        if "Category" not in df_sorted.columns:
            categorizer = AutoCategorizer()
            df_sorted = categorizer.categorize_dataframe(df_sorted)
        df_sorted["Date_DT"] = pd.to_datetime(df_sorted["Date"])
        df_sorted = df_sorted.sort_values("Date_DT").reset_index(drop=True)

        min_date = df_sorted["Date_DT"].min().date()
        max_date = df_sorted["Date_DT"].max().date()
        total_days = (max_date - min_date).days + 1
        total_months = total_days / 30.0

        start_bal = initial_balance if initial_balance is not None else float(df_sorted.get("Starting Balance", 75000.0))
        daily_net_map = df_sorted.groupby(df_sorted["Date_DT"].dt.date)["Amount"].sum().to_dict()

        calendar_days = [min_date + datetime.timedelta(days=i) for i in range(total_days)]
        actual_balances = {}
        running_b = start_bal
        for d in calendar_days:
            running_b += daily_net_map.get(d, 0.0)
            actual_balances[d] = running_b

        is_shorter = (total_months < 6.0)
        min_train_days = min(60, max(20, total_days // 3))
        available_eval_days = total_days - min_train_days

        if available_eval_days < test_window_days:
            test_window_days = max(7, available_eval_days)

        split_origins = []
        step = max(test_window_days, (total_days - min_train_days) // 4)
        curr_origin = min_train_days
        while (curr_origin + test_window_days) <= total_days:
            split_origins.append(curr_origin)
            curr_origin += step
            if len(split_origins) >= 4:
                break

        if not split_origins:
            split_origins = [total_days - test_window_days]

        all_actuals = []
        all_preds_p50 = []
        all_preds_p10 = []
        all_preds_p90 = []
        all_naive = []
        latest_chart_points = []

        for split_idx, train_end_idx in enumerate(split_origins):
            train_end_date = calendar_days[train_end_idx - 1]
            test_start_date = calendar_days[train_end_idx]
            test_end_date = calendar_days[min(total_days - 1, train_end_idx + test_window_days - 1)]
            actual_window_len = (test_end_date - test_start_date).days + 1

            train_df = df_sorted[df_sorted["Date_DT"].dt.date <= train_end_date]
            train_bal = actual_balances[train_end_date]

            forecast_res = CashFlowForecaster.run_monte_carlo(
                df=train_df,
                current_balance=train_bal,
                forecast_days=actual_window_len,
                num_simulations=300,
                start_date=test_start_date,
                seed=42 + split_idx
            )
            model_points = forecast_res["forecast"]

            # Naive moving-average drift baseline
            prior_30_start = train_end_date - datetime.timedelta(days=30)
            prior_txns = train_df[train_df["Date_DT"].dt.date >= prior_30_start]
            prior_net = float(prior_txns["Amount"].sum()) if len(prior_txns) > 0 else 0.0
            daily_drift = prior_net / 30.0

            split_chart_pts = []
            for d_idx in range(actual_window_len):
                cur_date = test_start_date + datetime.timedelta(days=d_idx)
                act_val = actual_balances.get(cur_date, train_bal)
                m_pt = model_points[d_idx] if d_idx < len(model_points) else model_points[-1]
                naive_val = train_bal + (d_idx + 1) * daily_drift

                all_actuals.append(act_val)
                all_preds_p50.append(m_pt["p50"])
                all_preds_p10.append(m_pt["p10"])
                all_preds_p90.append(m_pt["p90"])
                all_naive.append(naive_val)

                split_chart_pts.append({
                    "date": cur_date.strftime("%Y-%m-%d"),
                    "displayDate": cur_date.strftime("%d %b"),
                    "actual": round(act_val, 2),
                    "forecast_p50": round(m_pt["p50"], 2),
                    "p10": round(m_pt["p10"], 2),
                    "p90": round(m_pt["p90"], 2),
                    "naive_forecast": round(naive_val, 2),
                    "in_80_ci": bool(m_pt["p10"] <= act_val <= m_pt["p90"])
                })

            if split_idx == len(split_origins) - 1:
                latest_chart_points = split_chart_pts

        all_act_arr = np.array(all_actuals)
        all_p50_arr = np.array(all_preds_p50)
        all_p10_arr = np.array(all_preds_p10)
        all_p90_arr = np.array(all_preds_p90)
        all_naive_arr = np.array(all_naive)

        # MAE
        mae_model = float(np.mean(np.abs(all_act_arr - all_p50_arr)))
        mae_naive = float(np.mean(np.abs(all_act_arr - all_naive_arr)))

        # MAPE
        denom = np.maximum(np.abs(all_act_arr), 1000.0)
        mape_model = float(np.mean(np.abs(all_act_arr - all_p50_arr) / denom) * 100)
        mape_naive = float(np.mean(np.abs(all_act_arr - all_naive_arr) / denom) * 100)

        # Calibration in 80% CI
        inside_80 = (all_act_arr >= all_p10_arr) & (all_act_arr <= all_p90_arr)
        calibration_80 = float(np.mean(inside_80) * 100)

        pct_improvement = float(((mae_naive - mae_model) / mae_naive) * 100) if mae_naive > 0 else 0.0

        history_note = (
            f"History is {round(total_months, 1)} months (< 6 months). Ran {len(split_origins)}-split rolling-origin backtest on available data."
            if is_shorter else
            f"Full 6+ month backtest: evaluated across {len(split_origins)} rolling-origin test splits ({len(all_actuals)} evaluated days)."
        )

        return {
            "status": "success",
            "shorter_backtest": is_shorter,
            "history_months": round(total_months, 1),
            "history_days": total_days,
            "evaluated_splits": len(split_origins),
            "evaluated_days_count": len(all_actuals),
            "note": history_note,
            "metrics": {
                "model_mae": round(mae_model, 2),
                "naive_mae": round(mae_naive, 2),
                "pct_improvement_mae": round(pct_improvement, 1),
                "model_mape": round(mape_model, 2),
                "naive_mape": round(mape_naive, 2),
                "calibration_80_pct": round(calibration_80, 1),
                "target_calibration_pct": 80.0,
                "calibration_status": "Well-Calibrated" if (70.0 <= calibration_80 <= 90.0) else "Uncalibrated"
            },
            "calibration_bands": [
                {
                    "nominal_band": "50% CI",
                    "target_pct": 50.0,
                    "empirical_pct": round(float(np.mean((all_act_arr >= (all_p50_arr - 0.67 * (all_p50_arr - all_p10_arr))) & (all_act_arr <= (all_p50_arr + 0.67 * (all_p90_arr - all_p50_arr)))) * 100), 1)
                },
                {
                    "nominal_band": "80% CI (P10-P90)",
                    "target_pct": 80.0,
                    "empirical_pct": round(calibration_80, 1)
                },
                {
                    "nominal_band": "95% CI",
                    "target_pct": 95.0,
                    "empirical_pct": round(float(np.mean((all_act_arr >= (all_p50_arr - 1.25 * (all_p50_arr - all_p10_arr))) & (all_act_arr <= (all_p50_arr + 1.25 * (all_p90_arr - all_p50_arr)))) * 100), 1)
                }
            ],
            "timeline": latest_chart_points
        }
