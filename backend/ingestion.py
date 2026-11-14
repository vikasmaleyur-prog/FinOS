r"""
FinOS Resilient Statement Ingestion Engine
Optimized for:
- PhonePe UPI CSV exports (with 3-line preamble: Date,Time,Transaction Details,Transaction ID,UTR,Transaction Type,Credit/debit instrument,Amount)
- Indian Bank statements (HDFC, SBI, ICICI, Axis, Paytm, Razorpay)
- Dynamic header row detection (skips preamble lines until finding 'Transaction Details' and 'Amount' or equivalent)
- Date and Time column combination & robust pd.to_datetime parsing
- Amount cleaning via regex ([^\d.]), strict float casting, and DEBIT inversion (-1 * amount)
- Chronological sorting (oldest to newest): df.sort_values('Date', ascending=True).reset_index(drop=True)
- Running balance calculation: df['Running Balance'] = starting_balance + df['Amount'].cumsum()
- DPDP Act 2023 PII sanitization (UPI IDs, 10-digit phone numbers, UTR numbers)
"""

import io
import re
import datetime
from typing import Tuple, Dict, Any, Optional, List
import pandas as pd
import numpy as np


class StatementIngestionError(Exception):
    pass


class StatementParser:
    """Production-grade fault-tolerant parser for messy Indian bank/UPI statements."""

    # PII Regex Patterns (DPDP Act 2023)
    UPI_REGEX = re.compile(r'\b[A-Za-z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b')
    PHONE_REGEX = re.compile(r'\b(?:\+91|91|0)?[6-9]\d{9}\b|\b\d{10}\b')
    UTR_REGEX = re.compile(r'\b(?:UTR|REF|TXN)?[:\s/]?([0-9]{12})\b', re.IGNORECASE)
    ACCOUNT_REGEX = re.compile(r'\b(?:A/C\s*|SB-|CA\s*|CARD\s*)?(\d{9,18})\b', re.IGNORECASE)

    @classmethod
    def mask_pii_string(cls, text: str) -> str:
        """Sanitizes UPI IDs, 10-digit phone numbers, and UTR/account numbers in text."""
        if not text or not isinstance(text, str):
            return ""

        masked = text

        # 1. Mask Phone Numbers (keep last 3 digits, e.g., XXXXXX345)
        def phone_sub(m):
            s = m.group(0)
            return f"XXXXXX{s[-3:]}"
        masked = cls.PHONE_REGEX.sub(phone_sub, masked)

        # 2. Mask UPI IDs (e.g., ramesha@okaxis -> r***@okaxis)
        def upi_sub(m):
            val = m.group(0)
            parts = val.split('@')
            if len(parts) == 2:
                handle, bank = parts[0], parts[1]
                masked_handle = handle[0] + "***" if len(handle) > 1 else "***"
                return f"{masked_handle}@{bank}"
            return "u***@upi"
        masked = cls.UPI_REGEX.sub(upi_sub, masked)

        # 3. Mask 12-digit UTRs
        def utr_sub(m):
            return "UTR-XXXXXX"
        masked = cls.UTR_REGEX.sub(utr_sub, masked)

        # 4. Mask Account Numbers
        def acc_sub(m):
            digits = re.sub(r'\D', '', m.group(0))
            if len(digits) >= 9:
                return f"A/C XXXXXX{digits[-4:]}"
            return m.group(0)
        masked = cls.ACCOUNT_REGEX.sub(acc_sub, masked)

        return masked

    @classmethod
    def clean_amount_value(cls, val: Any) -> float:
        r"""
        Extracts amount value, strips commas, currency symbols, whitespace via [^\d.],
        and casts strictly to float.
        """
        if val is None or pd.isna(val):
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)

        s = str(val).strip()
        if not s or s in ['-', 'nil', 'nan', 'null', 'None']:
            return 0.0

        is_negative = '-' in s or s.lower().endswith('dr') or s.lower().startswith('dr')
        
        # Regex [^\d.] strictly keeps numbers and decimal point
        cleaned = re.sub(r'[^\d.]', '', s)
        if not cleaned:
            return 0.0

        try:
            num = float(cleaned)
            return -abs(num) if is_negative else abs(num)
        except (ValueError, TypeError):
            return 0.0

    @classmethod
    def locate_header_line(cls, raw_lines: List[str]) -> int:
        """
        Dynamically finds the true header row index.
        Skips preamble lines until finding a row containing:
        1. 'Transaction Details' and 'Amount' (PhonePe format)
        2. Or general financial headers ('Date' and 'Amount' / 'Debit' / 'Credit')
        """
        for idx, line in enumerate(raw_lines[:60]):
            clean = line.strip().lower()
            if not clean or clean.startswith('#') or clean.startswith('---'):
                continue

            # Check PhonePe header specifically
            if 'transaction details' in clean and 'amount' in clean:
                return idx

            # Check general header
            has_date = any(k in clean for k in ['date', 'txn date', 'transaction date', 'value date'])
            has_desc = any(k in clean for k in ['description', 'narration', 'particulars', 'remarks', 'details'])
            has_amount = any(k in clean for k in ['amount', 'withdrawal', 'debit', 'deposit', 'credit'])

            if has_date and (has_desc or has_amount):
                return idx

        return 0

    @classmethod
    def parse_csv(
        cls,
        file_bytes: bytes,
        starting_balance: float = 75000.0
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Parses PhonePe / Bank CSV with complete fault tolerance:
        - Skips preamble lines.
        - Parses Date and Time columns into pd.to_datetime.
        - Cleans Amount, casts to float, inverts if DEBIT.
        - Sorts chronologically: df.sort_values('Date', ascending=True).reset_index(drop=True)
        - Rebuilds running balance: df['Running Balance'] = starting_balance + df['Amount'].cumsum()
        - Sanitizes PII under DPDP Act 2023.
        """
        text = None
        for enc in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
            try:
                text = file_bytes.decode(enc)
                break
            except UnicodeDecodeError:
                continue

        if not text:
            raise StatementIngestionError("Unable to decode statement file using UTF-8 or Latin-1.")

        raw_lines = text.splitlines()
        if not raw_lines:
            raise StatementIngestionError("Uploaded file is empty.")

        header_idx = cls.locate_header_line(raw_lines)
        truncated_content = "\n".join(raw_lines[header_idx:])

        # Parse CSV with on_bad_lines='skip' & python engine
        try:
            df = pd.read_csv(
                io.StringIO(truncated_content),
                on_bad_lines='skip',
                sep=None,
                engine='python',
                skip_blank_lines=True
            )
        except Exception:
            df = pd.read_csv(
                io.StringIO(truncated_content),
                on_bad_lines='skip',
                sep=',',
                engine='python',
                skip_blank_lines=True
            )

        if df.empty or len(df.columns) < 2:
            raise StatementIngestionError("Failed to extract valid tabular columns from CSV.")

        # Strip whitespace from column headers
        df.columns = [str(c).strip() for c in df.columns]
        col_map = {c.lower(): c for c in df.columns}

        # 1. PhonePe / Bank Date & Time Parsing
        date_col = next((col_map[c] for c in col_map if c in ['date', 'txn date', 'transaction date', 'value date']), None)
        if not date_col:
            date_col = df.columns[0]

        time_col = next((col_map[c] for c in col_map if c in ['time', 'txn time', 'transaction time']), None)

        if date_col and time_col:
            combined = df[date_col].astype(str).str.strip() + ' ' + df[time_col].astype(str).str.strip()
            try:
                df['Parsed_Date'] = pd.to_datetime(combined, format='mixed', errors='coerce')
            except Exception:
                df['Parsed_Date'] = pd.to_datetime(combined, dayfirst=True, errors='coerce')

            mask_na = df['Parsed_Date'].isna()
            if mask_na.any():
                try:
                    df.loc[mask_na, 'Parsed_Date'] = pd.to_datetime(df.loc[mask_na, date_col], format='mixed', errors='coerce')
                except Exception:
                    df.loc[mask_na, 'Parsed_Date'] = pd.to_datetime(df.loc[mask_na, date_col], dayfirst=True, errors='coerce')
        else:
            try:
                df['Parsed_Date'] = pd.to_datetime(df[date_col], format='mixed', errors='coerce')
            except Exception:
                df['Parsed_Date'] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')

        # Drop rows where date could not be parsed
        df = df.dropna(subset=['Parsed_Date']).copy()

        # 2. Transaction Details / Description
        details_col = next((col_map[c] for c in col_map if c in ['transaction details', 'details', 'narration', 'description', 'particulars', 'remarks']), None)
        if not details_col:
            non_date = [c for c in df.columns if c not in [date_col, time_col, 'Parsed_Date']]
            details_col = non_date[0] if non_date else date_col

        # 3. Transaction Type (DEBIT vs CREDIT)
        type_col = next((col_map[c] for c in col_map if c in ['transaction type', 'type', 'cr/dr', 'txn type']), None)

        # 4. Amount Column & Split Debit/Credit Handling
        amt_col = next((col_map[c] for c in col_map if c in ['amount', 'amt', 'txn amt', 'transaction amount']), None)
        dr_col = next((col_map[c] for c in col_map if any(k in c for k in ['debit', 'withdrawal']) and 'balance' not in c), None)
        cr_col = next((col_map[c] for c in col_map if any(k in c for k in ['credit', 'deposit']) and 'balance' not in c), None)

        cleaned_amounts = []
        for idx, row in df.iterrows():
            if amt_col:
                raw_amt = row.get(amt_col)
                amt_float = abs(cls.clean_amount_value(raw_amt))

                if type_col:
                    t_val = str(row.get(type_col, '')).strip().upper()
                    if 'DEBIT' in t_val or t_val == 'DR':
                        amt_float = -amt_float
                    elif 'CREDIT' in t_val or t_val == 'CR':
                        amt_float = amt_float
                    else:
                        if str(raw_amt).strip().startswith('-'):
                            amt_float = -amt_float
                else:
                    if str(raw_amt).strip().startswith('-'):
                        amt_float = -amt_float
                cleaned_amounts.append(float(amt_float))
            elif dr_col and cr_col:
                dr_val = abs(cls.clean_amount_value(row.get(dr_col)))
                cr_val = abs(cls.clean_amount_value(row.get(cr_col)))
                cleaned_amounts.append(float(cr_val - dr_val))
            elif dr_col:
                dr_val = abs(cls.clean_amount_value(row.get(dr_col)))
                cleaned_amounts.append(float(-dr_val))
            elif cr_col:
                cr_val = abs(cls.clean_amount_value(row.get(cr_col)))
                cleaned_amounts.append(float(cr_val))
            else:
                cleaned_amounts.append(0.0)

        df['Amount'] = cleaned_amounts

        # Drop NaN amounts and zero amounts
        df = df.dropna(subset=['Amount']).copy()
        df = df[df['Amount'] != 0.0].copy()

        if df.empty:
            raise StatementIngestionError("No valid transaction amount rows found in statement.")

        # Standardize Date representation
        df['Date'] = df['Parsed_Date'].dt.strftime('%Y-%m-%d')
        df['Time'] = df['Parsed_Date'].dt.strftime('%H:%M:%S')

        # CHRONOLOGICAL SORTING FIX:
        # PhonePe and Indian bank CSVs list newest transactions first.
        # BEFORE calculating the running balance, MUST sort chronologically (oldest to newest)
        df = df.sort_values(by=['Parsed_Date', 'Date'], ascending=True).reset_index(drop=True)

        # RUNNING BALANCE FIX:
        # Calculate running balance as: df['Running Balance'] = starting_balance + df['Amount'].cumsum()
        start_bal = float(starting_balance) if starting_balance is not None else 75000.0
        df['Running Balance'] = (start_bal + df['Amount'].cumsum()).round(2).astype(float)
        df['Balance'] = df['Running Balance']

        # Reference No / Transaction ID
        ref_col = next((col_map[c] for c in col_map if c in ['transaction id', 'txn id', 'utr', 'ref', 'chq', 'reference']), None)
        if ref_col:
            df['Reference_No'] = df[ref_col].astype(str)
        else:
            df['Reference_No'] = [f"TXN{1000 + i}" for i in range(len(df))]

        # DPDP Act 2023 PII Sanitization
        raw_descs = df[details_col].astype(str).tolist()
        masked_descs = [cls.mask_pii_string(d) for d in raw_descs]

        df['Raw_Description'] = raw_descs
        df['Description'] = masked_descs
        df['Transaction Details'] = masked_descs

        # Select standardized final columns
        standard_cols = ['Date', 'Description', 'Transaction Details', 'Amount', 'Running Balance', 'Balance', 'Reference_No', 'Raw_Description']
        final_df = df[standard_cols].copy()

        # Audit stats
        inflows = float(final_df[final_df['Amount'] > 0]['Amount'].sum())
        outflows = float(abs(final_df[final_df['Amount'] < 0]['Amount'].sum()))
        ending_bal = float(final_df['Balance'].iloc[-1]) if len(final_df) > 0 else start_bal

        stats = {
            "rows_parsed": int(len(final_df)),
            "header_line_detected": int(header_idx + 1),
            "date_range": f"{final_df['Date'].min()} to {final_df['Date'].max()}",
            "starting_balance": float(start_bal),
            "ending_balance": round(ending_bal, 2),
            "total_inflows": round(inflows, 2),
            "total_outflows": round(outflows, 2),
        }

        return final_df, stats

    @classmethod
    def parse_pdf(cls, file_bytes: bytes, starting_balance: Optional[float] = 75000.0) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Parses PhonePe or Indian bank PDF statement using pdfplumber:
        - Extracts tabular rows across all pages
        - Dynamically locates header row containing Date and Amount
        - Cleans, standardizes, sorts chronologically, and builds running balance
        """
        try:
            import pdfplumber
        except ImportError:
            raise StatementIngestionError("pdfplumber is required for PDF ingestion. Please run 'pip install pdfplumber'.")

        all_rows = []
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if row and any(cell and str(cell).strip() for cell in row):
                                cleaned_cells = [str(c or "").replace('\n', ' ').strip() for c in row]
                                all_rows.append(cleaned_cells)
        except Exception as e:
            raise StatementIngestionError(f"Failed to read PDF pages: {str(e)}")

        if not all_rows:
            raise StatementIngestionError("No readable table data could be extracted from this PDF statement.")

        # Find header row
        header_idx = None
        for i, row in enumerate(all_rows[:15]):
            row_lower = [str(c).lower() for c in row]
            has_date = any('date' in c for c in row_lower)
            has_amt = any('amount' in c or 'debit' in c or 'credit' in c for c in row_lower)
            if has_date and has_amt:
                header_idx = i
                break

        if header_idx is None:
            header_idx = 0

        header = all_rows[header_idx]
        data_rows = all_rows[header_idx + 1:]

        # Convert to in-memory CSV string
        csv_buffer = io.StringIO()
        def fmt_row(r):
            # Normalize row length to header length
            r_padded = r[:len(header)] + [""] * max(0, len(header) - len(r))
            return ",".join([f'"{cell.replace("\"", "\"\"")}"' for cell in r_padded])

        csv_buffer.write(fmt_row(header) + "\n")
        for r in data_rows:
            if any(cell.strip() for cell in r):
                csv_buffer.write(fmt_row(r) + "\n")

        csv_bytes = csv_buffer.getvalue().encode('utf-8')
        return cls.parse_csv(csv_bytes, starting_balance=starting_balance)
