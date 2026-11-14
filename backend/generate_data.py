#!/usr/bin/env python3
"""
FinOS Synthetic Data Generator
Generates 18-24 months of realistic Indian banking transactions for an irregular earner / freelancer.
Features:
- Realistic UPI strings, IMPS, NEFT, ACH auto-debits with embedded PII (phone numbers, account numbers, UPI handles).
- Irregular freelance project payouts with varying frequencies (20-50 days) and amounts (₹35,000 - ₹2,10,000).
- Fixed recurring outflows: Rent, Loan EMI, Cloud/SaaS subscriptions, Utilities.
- Variable daily outflows: Food delivery (Swiggy, Zomato), Groceries (Blinkit, Zepto), Commute (Uber, Ola), Healthcare.
- Planted historical cash shortage (delayed client milestone while Rent + EMI hit).
- Planted expense anomalies (abnormally high gadget/hospital expenses).
- Accurately calculated running balance.
"""

import os
import random
import datetime
import pandas as pd
import numpy as np

def generate_synthetic_transactions(output_path="data/synthetic_transactions.csv", seed=42):
    random.seed(seed)
    np.random.seed(seed)

    # Date range: 24 months (Nov 2024 back to Dec 2022, or 2024 to end of 2026)
    start_date = datetime.date(2024, 1, 1)
    end_date = datetime.date(2025, 12, 31)
    total_days = (end_date - start_date).days

    transactions = []

    # Initial opening balance
    current_balance = 75000.0

    # Recurring templates
    fixed_bills = [
        {"desc": "ACH Dr/HDFC000214/HDFC PERSONAL LOAN EMI/A/C 501004928172", "amount": -16500.0, "day": 5, "cat": "EMI"},
        {"desc": "UPI/419201948291/Rent to Landlord Sunita Rao/sunita.rao@okaxis/Rent Nov", "amount": -28000.0, "day": 1, "cat": "Rent"},
        {"desc": "UPI/429103948192/ACT Fibernet Broadband 9845012345/actcorp@icici", "amount": -1499.0, "day": 8, "cat": "Subscriptions"},
        {"desc": "POS/DEBIT/FIGMA DESIGN SUBSCRIPTION/USD 15.00/CARD 4532", "amount": -1250.0, "day": 12, "cat": "Subscriptions"},
        {"desc": "POS/DEBIT/GITHUB CO-PILOT PRO/CARD 4532", "amount": -850.0, "day": 18, "cat": "Subscriptions"},
        {"desc": "UPI/481920394812/Cult.Fit Healthcare Membership/cultfit@hdfc/Gym", "amount": -1850.0, "day": 15, "cat": "Health"},
    ]

    # Variable expense templates
    food_merchants = [
        ("UPI/{ref}/Swiggy India Food/swiggy@icici/{phone}", (-180.0, -850.0), "Food"),
        ("UPI/{ref}/Zomato Order/zomato@hdfcbank/{phone}", (-220.0, -1150.0), "Food"),
        ("UPI/{ref}/Chai Point Koramangala/chaipoint@axis", (-80.0, -260.0), "Food"),
        ("UPI/{ref}/Blue Tokai Coffee Bangalore/bluetokai@yesbank", (-240.0, -580.0), "Food"),
        ("UPI/{ref}/Blinkit Quick Delivery/blinkit@kotak", (-350.0, -2200.0), "Food"),
        ("UPI/{ref}/Zepto Grocery Bangalore/zepto@icici", (-400.0, -2800.0), "Food"),
    ]

    travel_merchants = [
        ("UPI/{ref}/Uber Rides Mumbai-BLR/uber.india@icici", (-140.0, -850.0), "Travel"),
        ("UPI/{ref}/Ola Cabs Bangalore/olacabs@axisbank", (-120.0, -680.0), "Travel"),
        ("UPI/{ref}/Fastag Recharge ICICI/{phone}", (-500.0, -2000.0), "Travel"),
        ("UPI/{ref}/Indian Oil Petrol Pump/iocl@sbi", (-800.0, -3200.0), "Travel"),
    ]

    health_merchants = [
        ("UPI/{ref}/Apollo Pharmacy Koramangala/apollopharmacy@hdfc", (-250.0, -1800.0), "Health"),
        ("UPI/{ref}/1mg Technologies Bangalore/1mg@icici", (-450.0, -3400.0), "Health"),
        ("UPI/{ref}/Dr Lal PathLabs Diagnostics/lalpath@sbi", (-800.0, -3200.0), "Health"),
    ]

    other_merchants = [
        ("UPI/{ref}/Amazon Retail India/amazonpay@icici", (-300.0, -6500.0), "Other"),
        ("UPI/{ref}/BookMyShow Bangalore/bms@kotak", (-450.0, -1600.0), "Other"),
        ("UPI/{ref}/Electricity BESCOM Online/bescom@sbi/CA 9821049281", (-950.0, -3800.0), "Other"),
        ("ATM WDL/SBI ATM KORAMANGALA BLR/TXN {ref}", (-2000.0, -10000.0), "Other"),
    ]

    # Freelance Clients (Irregular income)
    clients = [
        {"name": "Upwork Global Inc / Escrow Release", "base": 65000.0, "type": "NEFT/N10293847291/{name}/A/C 501004928172"},
        {"name": "Razorpay Payouts / FinTech Client MVP", "base": 115000.0, "type": "IMPS/{ref}/Razorpay Payouts / {name}"},
        {"name": "Studio Kraft Design Retainer", "base": 45000.0, "type": "UPI/{ref}/Studio Kraft/studiokraft@icici/Invoice {inv}"},
        {"name": "Nexus AI Tech Consultant Fee", "base": 140000.0, "type": "NEFT/INDB2024098172/{name}/A/C 501004928172"},
        {"name": "US Client Wire Transfer / UX Sprint", "base": 88000.0, "type": "FOREX/USD 1050/DIRECT WIRE/{name}"},
    ]

    # Random generation day by day
    current_date = start_date
    next_income_day = 8  # first income arrival day offset
    
    # Track months for fixed bills
    processed_months = set()

    txn_counter = 1000

    while current_date <= end_date:
        month_key = (current_date.year, current_date.month)
        day_of_month = current_date.day

        # 1. Fixed bills on specific day of month
        for bill in fixed_bills:
            if bill["day"] == day_of_month:
                txn_counter += 1
                ref_num = f"{random.randint(400000000000, 499999999999)}"
                desc = bill["desc"].format(ref=ref_num, phone="98450" + str(random.randint(10000, 99999)))
                amt = bill["amount"]
                transactions.append({
                    "Date": current_date.strftime("%Y-%m-%d"),
                    "Description": desc,
                    "Amount": amt,
                    "Category": bill["cat"],
                    "Reference_No": f"REF{txn_counter}"
                })

        # 2. Check for planted Cash Shortage in November 2024 (Month 11 of 2024)
        # In this window, client income is intentionally delayed from Nov 5 to Nov 28,
        # while rent (28k), EMI (16.5k), and a medical emergency expense hit early in the month.
        is_shortage_month = (current_date.year == 2024 and current_date.month == 11)

        # 3. Freelance Income Arrival
        if not is_shortage_month and current_date >= (start_date + datetime.timedelta(days=next_income_day)):
            client = random.choice(clients)
            # Irregular payout amount with +- 25% variation
            variation = random.uniform(0.85, 1.35)
            income_amount = round(client["base"] * variation, -2)
            
            txn_counter += 1
            ref_num = f"{random.randint(400000000000, 499999999999)}"
            inv_num = f"INV-2024-{random.randint(100, 999)}"
            desc = client["type"].format(ref=ref_num, name=client["name"], inv=inv_num)

            transactions.append({
                "Date": current_date.strftime("%Y-%m-%d"),
                "Description": desc,
                "Amount": income_amount,
                "Category": "Income",
                "Reference_No": f"REF{txn_counter}"
            })
            # Next income scheduled in 18 to 42 days (irregular)
            days_until_next = random.randint(18, 42)
            next_income_day = (current_date - start_date).days + days_until_next

        elif is_shortage_month and current_date.day == 28:
            # Delayed income finally arrives on Nov 28th
            txn_counter += 1
            ref_num = f"{random.randint(400000000000, 499999999999)}"
            desc = f"NEFT/N10293847291/Delayed Milestone Release - US Client/A/C 501004928172"
            transactions.append({
                "Date": current_date.strftime("%Y-%m-%d"),
                "Description": desc,
                "Amount": 125000.0,
                "Category": "Income",
                "Reference_No": f"REF{txn_counter}"
            })

        # 4. Planted Anomaly 1: Sudden large tech purchase in August 2024 (Aug 14)
        if current_date.year == 2024 and current_date.month == 8 and current_date.day == 14:
            txn_counter += 1
            transactions.append({
                "Date": current_date.strftime("%Y-%m-%d"),
                "Description": "POS/DEBIT/APPLE STORE BKC MUMBAI/MACBOOK PRO M3 MAX/CARD 4532/A/C 501004928172",
                "Amount": -189900.0,
                "Category": "Other",
                "Reference_No": f"REF{txn_counter}"
            })

        # 5. Planted Anomaly 2: Hospital emergency expense in November 2024 (during cash crunch)
        if current_date.year == 2024 and current_date.month == 11 and current_date.day == 7:
            txn_counter += 1
            transactions.append({
                "Date": current_date.strftime("%Y-%m-%d"),
                "Description": "UPI/482910492819/Manipal Hospital Emergency/manipal@axis/Patient Bill 9876543210",
                "Amount": -34500.0,
                "Category": "Health",
                "Reference_No": f"REF{txn_counter}"
            })

        # 6. Daily variable micro-transactions (0 to 3 transactions per day)
        num_txns = random.choices([0, 1, 2, 3], weights=[0.25, 0.40, 0.25, 0.10])[0]
        for _ in range(num_txns):
            pool = random.choices(
                [food_merchants, travel_merchants, health_merchants, other_merchants],
                weights=[0.55, 0.25, 0.08, 0.12]
            )[0]
            tmpl, (min_a, max_a), cat = random.choice(pool)
            amt = round(random.uniform(min_a, max_a), 2)
            
            ref_num = f"{random.randint(400000000000, 499999999999)}"
            phone_num = f"98{random.randint(10000000, 99999999)}"
            desc = tmpl.format(ref=ref_num, phone=phone_num)
            
            txn_counter += 1
            transactions.append({
                "Date": current_date.strftime("%Y-%m-%d"),
                "Description": desc,
                "Amount": amt,
                "Category": cat,
                "Reference_No": f"REF{txn_counter}"
            })

        current_date += datetime.timedelta(days=1)

    # Sort transactions strictly chronologically
    df = pd.DataFrame(transactions)
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values(by=["Date", "Reference_No"]).reset_index(drop=True)

    # Calculate exact Running Balance
    running_balance = 75000.0  # Opening balance on Jan 1, 2024
    balances = []
    for _, row in df.iterrows():
        running_balance += row["Amount"]
        balances.append(round(running_balance, 2))
    
    df["Balance"] = balances
    df["Date"] = df["Date"].dt.strftime("%Y-%m-%d")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} transactions spanning {df['Date'].min()} to {df['Date'].max()}.")
    print(f"Saved synthetic dataset to: {output_path}")
    print(f"Ending Balance: ₹{balances[-1]:,.2f} | Min Balance reached: ₹{min(balances):,.2f}")
    return df

if __name__ == "__main__":
    generate_synthetic_transactions("/Users/vikasn/.gemini/antigravity/scratch/finos/data/synthetic_transactions.csv")
