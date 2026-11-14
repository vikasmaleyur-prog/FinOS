"""
FinOS - Purchase Affordability Intelligence Service
Dedicated financial decision and purchase affordability advisor.
Uses the existing FinOS Monte Carlo stochastic simulation engine to evaluate
future cash flow impacts, shortage probabilities, and timing recommendations.
"""

import os
import re
import datetime
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd

from backend.ml_engine import CashFlowForecaster, RecurringPaymentDetector, FinOSLLMService

class PurchaseAdvisorService:
    """
    Evaluates purchase affordability against simulated future cash flow.
    Integrates with Monte Carlo stochastic projections, EMI modeling,
    alternative purchase timing, and conversational memory.
    """

    SUPPORTED_ITEMS = [
        "phone", "iphone", "mobile", "smartphone", "android", "samsung", "oneplus",
        "laptop", "macbook", "pc", "computer", "desktop", "ipad", "tablet",
        "bike", "motorcycle", "scooter", "car", "vehicle",
        "tv", "television", "refrigerator", "fridge", "ac", "air conditioner", "washing machine",
        "watch", "smartwatch", "apple watch", "shoes", "camera", "dslr", "headphone", "earphone", "airpods",
        "trip", "vacation", "flight", "shopping", "course", "furniture", "sofa"
    ]

    @classmethod
    def parse_indian_amount(cls, text: str) -> Optional[float]:
        """
        Parses amounts from natural language text, supporting:
        - ₹70,000 / Rs 70000 / 70000
        - 1.2 lakh / 1.5 lakhs / 2 lac
        - 50k / 35K
        """
        if not text:
            return None

        # 1. Lakh match: e.g. 1.2 lakh, 1.5 lakhs, 2 lacs, 1 lakh
        lakh_match = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:lakhs?|lacs?|l)\b', text, re.IGNORECASE)
        if lakh_match:
            try:
                return float(lakh_match.group(1)) * 100000.0
            except ValueError:
                pass

        # 2. 'K' match: e.g. 50k, 35K, ₹30k
        k_match = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*k\b', text, re.IGNORECASE)
        if k_match:
            try:
                return float(k_match.group(1)) * 1000.0
            except ValueError:
                pass

        # 3. Standard comma/plain numbers with or without currency symbol: e.g. ₹70,000, Rs. 50000, 30000
        # Exclude dates like 2026, or days like 30 days
        std_matches = re.finditer(r'(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{3,7}(?:\.[0-9]+)?)', text, re.IGNORECASE)
        for m in std_matches:
            val_str = m.group(1).replace(',', '')
            try:
                val = float(val_str)
                if val >= 500:  # Reasonable purchase minimum
                    return val
            except ValueError:
                continue

        # 4. Bare numeric matches preceded by purchase words or budget words
        bare_match = re.search(r'(?:budget|cost|price|worth|around|for|spend|of|pay)\s*(?:of|is|around|about)?\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{4,7})', text, re.IGNORECASE)
        if bare_match:
            val_str = bare_match.group(1).replace(',', '')
            try:
                return float(val_str)
            except ValueError:
                pass

        # 5. Look for standalone ₹ or Rs amounts
        curr_match = re.search(r'(?:₹|rs\.?)\s*([0-9]+(?:\.[0-9]+)?)', text, re.IGNORECASE)
        if curr_match:
            try:
                return float(curr_match.group(1))
            except ValueError:
                pass

        return None

    @classmethod
    def extract_intent_and_entities(
        cls,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Extracts product, amount, timing, EMI structure, and conversational context.
        Resolves pronouns ('it', 'that phone') and budget updates from chat history.
        """
        msg_lower = message.lower()
        hist = history or []

        # Find historical context (last mentioned item, amount, emi)
        last_item = None
        last_amount = None
        last_is_emi = False
        last_emi_amount = None

        for h in reversed(hist):
            content = h.get("content", "")
            if h.get("role") == "user":
                parsed_amt = cls.parse_indian_amount(content)
                if parsed_amt and not last_amount:
                    last_amount = parsed_amt

                for candidate in cls.SUPPORTED_ITEMS:
                    if re.search(r'\b' + re.escape(candidate) + r'\b', content.lower()):
                        last_item = candidate.title()
                        break

                if any(w in content.lower() for w in ["emi", "installment", "monthly plan"]):
                    last_is_emi = True

        # 1. Detect purchase question intent
        purchase_keywords = [
            "buy", "purchase", "afford", "can i spend", "should i buy", "want to buy",
            "can i get", "take an emi", "pay on emi", "take a loan", "cost of", "buying a",
            "can i purchase", "thinking of buying", "planning to buy", "safely spend",
            "affecting my savings", "without affecting", "can i take"
        ]
        is_purchase_query = any(k in msg_lower for k in purchase_keywords)

        # Also detect follow-up questions modifying previous context
        is_follow_up_budget = bool(re.search(r'^(?:what about|how about|what if|can i do|how about for|reduce to)\s*(?:₹|rs\.?|inr)?\s*[0-9]', msg_lower))
        is_follow_up_timing = any(w in msg_lower for w in ["next month", "wait until", "wait for next salary", "defer", "delay", "after salary"])
        is_follow_up_emi = any(w in msg_lower for w in ["in emi", "on emi", "with emi", "monthly emi", "pay in emi", "take an emi"])
        is_pronoun_reference = bool(re.search(r'\b(?:it|that|this|the same|this product|this phone)\b', msg_lower))

        # Check if previous assistant message asked for budget
        asked_for_budget = False
        if hist:
            last_bot_msg = next((h.get("content", "") for h in reversed(hist) if h.get("role") == "assistant"), "")
            if "budget" in last_bot_msg.lower():
                asked_for_budget = True

        current_amount = cls.parse_indian_amount(message)
        if current_amount and (asked_for_budget or last_item or is_follow_up_budget):
            is_purchase_query = True

        if is_follow_up_budget or is_follow_up_timing or is_follow_up_emi or (is_pronoun_reference and last_item):
            is_purchase_query = True

        # Exclude daily living spend cap / spending limit queries (e.g. "How much can I spend safely each day?")
        if any(w in msg_lower for w in ["each day", "per day", "daily", "daily cap", "living limit", "daily limit", "daily spend"]):
            is_purchase_query = False
            is_budget_inquiry = False

        # 2. Extract item
        extracted_item = None
        for candidate in cls.SUPPORTED_ITEMS:
            if re.search(r'\b' + re.escape(candidate) + r'\b', msg_lower):
                extracted_item = candidate.title()
                break

        if not extracted_item:
            if is_pronoun_reference and last_item:
                extracted_item = last_item
            else:
                # Check for general item patterns: e.g. "buy a [word]"
                item_match = re.search(r'(?:buy|purchase|get|acquire)\s+(?:a|an|the)?\s*([a-zA-Z0-9_\-]+)(?:\s+for|\s+at|\s+in|\s+on|\?|\.|$)', message, re.IGNORECASE)
                if item_match:
                    candidate = item_match.group(1).strip()
                    # filter out non-nouns
                    candidate_clean = re.sub(r'(?i)(?:₹|rs\.?|inr|[0-9,]+|\bk\b|new|used)', '', candidate).strip()
                    if candidate_clean and len(candidate_clean) > 2 and candidate_clean.lower() not in ["it", "this", "that", "something", "product", "item"]:
                        extracted_item = candidate_clean.title()

        # If not extracted from current turn, resolve from history
        final_item = extracted_item or last_item or "Planned Purchase"

        # 3. Extract amount
        final_amount = current_amount if current_amount is not None else (last_amount if (is_follow_up_timing or is_follow_up_emi or is_pronoun_reference) else None)

        # 4. Check for budget inquiry ("How much can I safely spend on a phone?")
        is_budget_inquiry = any(w in msg_lower for w in ["how much can i safely spend", "how much can i spend", "what is my safe budget", "what budget can i afford", "how much to spend"])

        # 5. Extract Timing (day offset)
        day_offset = 7  # default: within a week
        if any(w in msg_lower for w in ["next month", "30 days", "in a month", "after 30 days"]):
            day_offset = 30
        elif any(w in msg_lower for w in ["tomorrow", "1 day", "next day"]):
            day_offset = 1
        elif any(w in msg_lower for w in ["next week", "7 days", "in a week"]):
            day_offset = 7
        elif any(w in msg_lower for w in ["15 days", "in 2 weeks", "mid month"]):
            day_offset = 15
        elif any(w in msg_lower for w in ["next salary", "next income", "next client", "after salary"]):
            day_offset = 25

        # 6. Extract EMI parameters
        is_emi = bool(re.search(r'\b(?:emi|installment|months? tenure|down payment)\b', msg_lower)) or is_follow_up_emi or last_is_emi
        emi_amount = None
        emi_months = 6  # default 6-month tenure

        # Match either "emi of ₹15,000" or "₹15,000 emi"
        emi_match = re.search(r'(?:(?:emi|installment)\s*(?:of)?\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]+)|(?:₹|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]+)\s*(?:emi|installment))', message, re.IGNORECASE)
        if emi_match:
            try:
                amt_str = (emi_match.group(1) or emi_match.group(2)).replace(',', '')
                emi_amount = float(amt_str)
            except (ValueError, AttributeError):
                pass

        months_match = re.search(r'([0-9]+)\s*(?:months?|mo)\b', message, re.IGNORECASE)
        if months_match:
            try:
                emi_months = int(months_match.group(1))
            except ValueError:
                pass

        # If EMI is requested with total amount but no monthly EMI specified:
        if is_emi and final_amount and not emi_amount:
            # Standard 6-month calculation with nominal 12% APR financing assumption
            total_with_interest = final_amount * 1.06
            emi_amount = round(total_with_interest / float(emi_months))
        elif is_emi and emi_amount and not final_amount:
            final_amount = round(emi_amount * float(emi_months))

        missing_price = (is_purchase_query and final_amount is None and not is_budget_inquiry)

        return {
            "is_purchase_query": is_purchase_query,
            "is_budget_inquiry": is_budget_inquiry,
            "item": final_item,
            "amount": final_amount,
            "day_offset": day_offset,
            "is_emi": is_emi,
            "emi_amount": emi_amount,
            "emi_months": emi_months,
            "missing_price": missing_price,
            "is_follow_up": bool(is_follow_up_budget or is_follow_up_timing or is_follow_up_emi)
        }

    @classmethod
    def evaluate_affordability(
        cls,
        df: Optional[pd.DataFrame],
        current_balance: float,
        minimum_safe_balance: float,
        item: str,
        amount: float,
        day_offset: int = 7,
        is_emi: bool = False,
        emi_amount: Optional[float] = None,
        emi_months: int = 6,
        account_type: str = "savings",
        recurring_bills: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Executes future balance predictions using the existing Monte Carlo engine:
        1. Runs baseline forecast without the purchase (90 days).
        2. Runs simulated forecast with the proposed purchase/EMI (90 days).
        3. Runs alternative timing forecast (delay to day 30) if purchase creates strain.
        4. Calculates multi-horizon comparisons (7d, 15d, 30d, 60d, 90d) and safe budget limits.
        """
        bills = recurring_bills if recurring_bills is not None else (RecurringPaymentDetector.detect_recurring(df) if df is not None and len(df) > 0 else [])
        fixed_monthly = sum(float(b.get("average_amount", 0.0)) for b in bills if b.get("cadence") == "Monthly")

        # 1. Baseline Simulation (90 days, 1,000 paths, seed=42)
        baseline = CashFlowForecaster.run_monte_carlo(
            df=df if df is not None and len(df) > 0 else pd.DataFrame(),
            current_balance=float(current_balance),
            forecast_days=90,
            num_simulations=1000,
            minimum_safe_balance=float(minimum_safe_balance),
            account_type=account_type,
            recurring_bills=bills,
            seed=42
        )

        # 2. Simulated Forecast with proposed purchase
        one_time_expenses = []
        new_emis = []

        if is_emi and emi_amount:
            new_emis.append({
                "merchant": f"{item} EMI",
                "amount": float(emi_amount),
                "day_of_month": 5
            })
        else:
            one_time_expenses.append({
                "name": item,
                "amount": float(amount),
                "day_offset": int(day_offset)
            })

        simulated = CashFlowForecaster.run_monte_carlo(
            df=df if df is not None and len(df) > 0 else pd.DataFrame(),
            current_balance=float(current_balance),
            forecast_days=90,
            num_simulations=1000,
            minimum_safe_balance=float(minimum_safe_balance),
            account_type=account_type,
            recurring_bills=bills,
            one_time_expenses=one_time_expenses,
            new_recurring_emis=new_emis,
            seed=42
        )

        # Multi-horizon extraction (7d, 15d, 30d, 60d, 90d)
        base_h = baseline.get("horizon_metrics", {})
        sim_h = simulated.get("horizon_metrics", {})

        def get_h(metrics_dict: dict, horizon_key: str) -> dict:
            return metrics_dict.get(horizon_key, {
                "expected_future_balance": 0.0,
                "p10": 0.0, "p50": 0.0, "p90": 0.0,
                "prob_below_safe_balance": 0.0,
                "prob_below_zero": 0.0
            })

        h30_base = get_h(base_h, "30d")
        h30_sim = get_h(sim_h, "30d")
        h60_base = get_h(base_h, "60d")
        h60_sim = get_h(sim_h, "60d")
        h90_base = get_h(base_h, "90d")
        h90_sim = get_h(sim_h, "90d")

        base_risk_60 = float(h60_base.get("prob_below_safe_balance", baseline.get("prob_below_safe_balance", 0.0)))
        sim_risk_60 = float(h60_sim.get("prob_below_safe_balance", simulated.get("prob_below_safe_balance", 0.0)))
        risk_delta = round(sim_risk_60 - base_risk_60, 1)

        sim_lowest_med = float(simulated.get("lowest_median_balance", 0.0))
        base_lowest_med = float(baseline.get("lowest_median_balance", 0.0))
        sim_prob_zero = float(simulated.get("prob_below_zero", 0.0))

        # 3. Decision Categorization Engine
        # Categories:
        # A. AFFORDABLE
        # B. AFFORDABLE WITH CAUTION
        # C. NOT RECOMMENDED RIGHT NOW
        if sim_lowest_med < (minimum_safe_balance * 0.7) or sim_risk_60 >= 40.0 or sim_prob_zero >= 30.0:
            category = "NOT RECOMMENDED RIGHT NOW"
            status_code = "NOT_RECOMMENDED"
            badge_color = "critical"
        elif sim_risk_60 >= 15.0 or risk_delta >= 5.0 or sim_lowest_med < (minimum_safe_balance * 2.0):
            category = "AFFORDABLE WITH CAUTION"
            status_code = "CAUTION"
            badge_color = "warning"
        else:
            category = "AFFORDABLE"
            status_code = "AFFORDABLE"
            badge_color = "success"

        # 4. Alternative Timing Check: What if delayed to next month (30 days)?
        timing_recommendation = None
        if category != "AFFORDABLE":
            delayed_sim = CashFlowForecaster.run_monte_carlo(
                df=df if df is not None and len(df) > 0 else pd.DataFrame(),
                current_balance=float(current_balance),
                forecast_days=90,
                num_simulations=1000,
                minimum_safe_balance=float(minimum_safe_balance),
                account_type=account_type,
                recurring_bills=bills,
                one_time_expenses=[{"name": item, "amount": float(amount), "day_offset": 30}],
                seed=42
            )
            delayed_risk = float(delayed_sim.get("prob_below_safe_balance", 0.0))
            delayed_lowest = float(delayed_sim.get("lowest_median_balance", 0.0))
            if delayed_risk < sim_risk_60:
                timing_recommendation = {
                    "suggested_offset_days": 30,
                    "suggested_date_desc": "in 30 days (next month after next income receipt)",
                    "delayed_risk": delayed_risk,
                    "risk_reduction": round(sim_risk_60 - delayed_risk, 1),
                    "delayed_lowest_balance": delayed_lowest
                }

        # 5. Safer Budget Recommendation
        # What is the maximum purchase amount that keeps 60-day shortage risk under 15%?
        safe_discretionary = max(0.0, current_balance - (fixed_monthly * 0.75) - minimum_safe_balance)
        suggested_safe_budget = round(min(amount * 0.7, max(5000.0, safe_discretionary)), -2)

        # 6. Data Confidence Assessment
        history_days = baseline.get("data_sufficiency", {}).get("history_days", 0)
        confidence_level = "High Confidence" if history_days >= 60 else ("Moderate Confidence" if history_days >= 20 else "Low Confidence")

        # 7. Summary structure
        return {
            "item": item,
            "item_name": item,
            "purchase_amount": amount,
            "amount": amount,
            "day_offset": day_offset,
            "delay_days": day_offset,
            "scenario_type": "emi_purchase" if is_emi else "one_time_purchase",
            "is_emi": is_emi,
            "emi_amount": emi_amount,
            "emi_months": emi_months,
            "category": category,
            "status_code": status_code,
            "badge_color": badge_color,
            "current_balance": current_balance,
            "minimum_safe_balance": minimum_safe_balance,
            "fixed_monthly_obligations": fixed_monthly,
            "baseline_risk": base_risk_60,
            "simulated_risk": sim_risk_60,
            "risk_delta": risk_delta,
            "baseline_lowest_balance": base_lowest_med,
            "simulated_lowest_balance": sim_lowest_med,
            "simulated_safe_limit": suggested_safe_budget,
            "simulated_prob_zero": sim_prob_zero,
            "first_breach_date": simulated.get("first_breach_date"),
            "new_breach_date": simulated.get("first_breach_date"),
            "horizons": {
                "7d": {"baseline_p50": h30_base.get("p50"), "simulated_p50": h30_sim.get("p50")},
                "30d": {
                    "baseline_p50": h30_base.get("p50"),
                    "simulated_p50": h30_sim.get("p50"),
                    "simulated_p10": h30_sim.get("p10"),
                    "simulated_p90": h30_sim.get("p90"),
                    "simulated_risk": h30_sim.get("prob_below_safe_balance")
                },
                "60d": {
                    "baseline_p50": h60_base.get("p50"),
                    "simulated_p50": h60_sim.get("p50"),
                    "simulated_p10": h60_sim.get("p10"),
                    "simulated_p90": h60_sim.get("p90"),
                    "simulated_risk": h60_sim.get("prob_below_safe_balance")
                },
                "90d": {
                    "baseline_p50": h90_base.get("p50"),
                    "simulated_p50": h90_sim.get("p50"),
                    "simulated_p10": h90_sim.get("p10"),
                    "simulated_p90": h90_sim.get("p90"),
                    "simulated_risk": h90_sim.get("prob_below_safe_balance")
                }
            },
            "timing_recommendation": timing_recommendation,
            "suggested_safe_budget": suggested_safe_budget,
            "data_confidence": confidence_level,
            "history_days": history_days
        }

    @classmethod
    def generate_conversational_advice(
        cls,
        eval_result: Dict[str, Any],
        user_message: str
    ) -> Dict[str, Any]:
        """
        Creates a conversational financial explanation conforming to the 9-part structured format.
        Uses Google Gemini API if available, falling back deterministically with exact numbers.
        """
        r = eval_result
        item = r["item"]
        amt = r["purchase_amount"]
        cat = r["category"]
        curr_bal = r["current_balance"]
        min_safe = r["minimum_safe_balance"]
        base_30 = r["horizons"]["30d"]["baseline_p50"]
        sim_30 = r["horizons"]["30d"]["simulated_p50"]
        base_60 = r["horizons"]["60d"]["baseline_p50"]
        sim_60 = r["horizons"]["60d"]["simulated_p50"]
        base_risk = r["baseline_risk"]
        sim_risk = r["simulated_risk"]
        risk_delta = r["risk_delta"]
        fixed_obs = r["fixed_monthly_obligations"]
        timing = r["timing_recommendation"]
        safe_budget = r["suggested_safe_budget"]
        confidence = r["data_confidence"]

        # Actionable recommendation string
        if cat == "AFFORDABLE":
            rec_text = (
                f"You have sufficient liquidity runway. After this purchase, your 30-day median balance remains strong at "
                f"₹{round(sim_30):,}, safely above your ₹{round(min_safe):,} buffer with only a {sim_risk:.1f}% risk of breach."
            )
        elif cat == "AFFORDABLE WITH CAUTION":
            timing_note = f" Alternatively, waiting {timing['suggested_date_desc']} reduces risk by {timing['risk_reduction']}%." if timing else ""
            rec_text = (
                f"The purchase is possible, but narrows your financial buffer. Your projected 30-day median balance dips from "
                f"₹{round(base_30):,} to ₹{round(sim_30):,}, and shortage risk increases by +{risk_delta:.1f}%. "
                f"Consider choosing a model closer to ₹{round(safe_budget):,}.{timing_note}"
            )
        else:
            timing_note = f" Recommend waiting {timing['suggested_date_desc']} when new income arrives." if timing else f" Consider choosing an option within ₹{round(safe_budget):,} or deferring."
            rec_text = (
                f"This purchase creates substantial financial risk. It increases your 60-day buffer breach probability to "
                f"{sim_risk:.1f}% and drives your projected minimum balance down to ₹{round(r['simulated_lowest_balance']):,}. "
                f"Upcoming fixed obligations of ₹{round(fixed_obs):,} must be prioritized.{timing_note}"
            )

        # 1. Deterministic clean response
        timing_line = f"\n- **Timing Alternative**: Deferring to {timing['suggested_date_desc']} brings risk down to **{timing['delayed_risk']:.1f}%** (saves {timing['risk_reduction']}% risk)." if timing else ""
        emi_line = f"\n- **Financing Option**: At 6-month EMI of ~₹{round(r['emi_amount']):,}/month, monthly cash flow remains more balanced." if r["is_emi"] else ""

        confidence_note = (
            f"\n\n⚠️ **Notice**: Limited transaction history ({r['history_days']} days). This recommendation has low statistical confidence; consider uploading a longer statement for higher accuracy."
            if confidence == "Low Confidence"
            else f"\n\n*(Evaluation confidence: {confidence} based on {r['history_days']} days of ledger history)*"
        )

        deterministic_reply = (
            f"Based on your future cash flow predictions, a **₹{round(amt):,} {item} purchase** is **{cat}**.\n\n"
            f"- **Current Balance**: ₹{round(curr_bal):,}\n"
            f"- **30-Day Median Balance**: Shifts from **₹{round(base_30):,}** ➔ **₹{round(sim_30):,}**\n"
            f"- **60-Day Median Balance**: Shifts from **₹{round(base_60):,}** ➔ **₹{round(sim_60):,}**\n"
            f"- **Shortage Probability**: Shifts from **{base_risk:.1f}%** ➔ **{sim_risk:.1f}%** ({'+' if risk_delta >= 0 else ''}{risk_delta:.1f}%)\n"
            f"- **Fixed Commitments**: ₹{round(fixed_obs):,}/month (Rent & EMIs)\n"
            f"- **Safety Buffer Target**: ₹{round(min_safe):,}\n"
            f"- **Assessment**: {rec_text}{timing_line}{emi_line}"
            f"{confidence_note}"
        )

        # 2. Try Gemini if API key is present
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            system_prompt = (
                "You are Ask FinOS, an expert AI Personal Financial Advisor for India. "
                "The Python backend has run exact Monte Carlo cash flow simulations for this proposed purchase. "
                "You MUST follow these strict guidelines:\n"
                "1. State the exact verdict upfront: Affordable / Affordable with caution / Not recommended right now.\n"
                "2. Cite the exact Python-calculated figures: current balance, 30-day baseline vs simulated balance, shortage probabilities, and upcoming obligations.\n"
                "3. NEVER invent balances, dates, or probability numbers.\n"
                "4. Be conversational, empathetic, and constructive.\n"
                "5. Give a practical recommendation: safer purchase timing or safer budget limit."
            )
            chat_prompt = (
                f"Calculated Simulation Results from Python:\n"
                f"- User Question: {user_message}\n"
                f"- Item: {item}\n"
                f"- Purchase Amount: ₹{amt:,.0f}\n"
                f"- Verdict: {cat}\n"
                f"- Current Balance: ₹{curr_bal:,.2f}\n"
                f"- Minimum Safe Balance: ₹{min_safe:,.2f}\n"
                f"- 30-Day Median Balance Before: ₹{base_30:,.0f}\n"
                f"- 30-Day Median Balance After: ₹{sim_30:,.0f}\n"
                f"- 60-Day Median Balance Before: ₹{base_60:,.0f}\n"
                f"- 60-Day Median Balance After: ₹{sim_60:,.0f}\n"
                f"- 60-Day Breach Risk: {base_risk:.1f}% -> {sim_risk:.1f}% (Delta: {'+' if risk_delta >= 0 else ''}{risk_delta:.1f}%)\n"
                f"- Lowest Projected Balance After: ₹{r['simulated_lowest_balance']:,.0f}\n"
                f"- Fixed Monthly Obligations: ₹{fixed_obs:,.0f}\n"
                f"- Timing Suggestion: {timing['suggested_date_desc'] if timing else 'Current timing is absorbable'}\n"
                f"- Suggested Safe Budget: ₹{safe_budget:,.0f}\n"
                f"- Data Confidence: {confidence}\n\n"
                f"Provide your conversational advice to the user."
            )
            llm_text = FinOSLLMService.call_gemini(chat_prompt, system_instruction=system_prompt)
            if llm_text:
                return {
                    "reply": llm_text,
                    "simulated_result": r,
                    "is_llm_generated": True,
                    "is_llm_active": True,
                    "llm_provider": "Google Gemini 2.5 Flash",
                    "offline_fallback_active": False
                }

        return {
            "reply": deterministic_reply,
            "simulated_result": r,
            "is_llm_generated": False,
            "is_llm_active": False,
            "llm_provider": "FinOS Deterministic Purchase Decision Engine",
            "offline_fallback_active": True
        }
