"""
Test suite verifying the multi-stage PDF bank statement ingestion pipeline.
Tests all 12 required scenarios from Section 7:
1. PhonePe text-based PDF.
2. Multi-page PhonePe PDF.
3. PDF with introductory text before transaction rows.
4. PDF with irregular transaction headers.
5. PDF with debit and credit transactions.
6. PDF with refunds and reversals.
7. Scanned PDF requiring OCR (detection & error handling).
8. Password-protected PDF.
9. Corrupted PDF.
10. PDF with no transaction records.
11. Duplicate transactions.
12. PDF with multiple transactions on the same date.
"""

import io
import datetime
import pytest
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from pypdf import PdfWriter, PdfReader

def create_phonepe_pdf(
    num_pages: int = 1,
    include_preamble: bool = True,
    include_refunds: bool = True,
    include_same_date_multiple: bool = True,
    include_duplicates: bool = False,
    include_failed: bool = True
) -> bytes:
    """Generates synthetic PhonePe PDF statement matching real PhonePe app export."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    
    for page_num in range(1, num_pages + 1):
        y = 750
        # Preamble / Header
        if include_preamble and page_num == 1:
            c.setFont("Helvetica-Bold", 16)
            c.drawString(50, y, "PhonePe")
            y -= 22
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, y, "Transaction Statement for 919876543210")
            y -= 16
            c.setFont("Helvetica", 9)
            c.drawString(50, y, "Statement Period: 01 Oct 2026 to 30 Nov 2026")
            y -= 14
            c.drawString(50, y, "Account: State Bank of India - 4829 | UPI ID: arjun@oksbi")
            y -= 14
            c.drawString(50, y, "Generated on: 15 Nov 2026, 05:30 AM")
            y -= 25
            c.line(50, y, 550, y)
            y -= 20
        else:
            c.setFont("Helvetica-Bold", 10)
            c.drawString(50, y, f"PhonePe Statement - Page {page_num} of {num_pages}")
            y -= 15
            c.line(50, y, 550, y)
            y -= 20

        # Page transactions
        txns = []
        if page_num == 1:
            txns = [
                ("30 Nov 2026, 09:15 PM", "Paid to Zepto Quick Grocery", "UPI/41920268/Zepto", "DEBIT", "₹ 381.20"),
                ("30 Nov 2026, 08:30 PM", "Paid to Swiggy India Food", "UPI/41920265/Swiggy", "DEBIT", "₹ 494.44"),
                ("28 Nov 2026, 11:20 AM", "Received from Client Acme Corp", "UPI/41920260/Acme", "CREDIT", "₹ 50,000.00"),
                ("25 Nov 2026, 02:45 PM", "Refund from Amazon Pay India", "UPI/41920250/AmazonRefund", "REFUND", "₹ 1,499.00"),
                ("20 Nov 2026, 06:10 PM", "Reversal of Paid to Zomato Online", "UPI/41920240/ZomatoRev", "REVERSAL", "₹ 350.00"),
                ("18 Nov 2026, 04:00 PM", "Paid to Uber Rides Bangalore", "UPI/41920230/Uber", "FAILED", "₹ 420.00"), # Failed should be skipped
                ("15 Nov 2026, 10:00 AM", "Payment to Landlord Rent Koramangala", "UPI/41920220/Rent", "DEBIT", "₹ 25,000.00"),
            ]
            if include_duplicates:
                txns.append(("15 Nov 2026, 10:00 AM", "Payment to Landlord Rent Koramangala", "UPI/41920220/Rent", "DEBIT", "₹ 25,000.00"))
        else:
            txns = [
                ("10 Nov 2026, 01:15 PM", "Paid to Apollo Pharmacy Koramangala", "UPI/41920210/Apollo", "DEBIT", "₹ 850.00"),
                ("05 Nov 2026, 09:00 AM", "Auto-debit / EMI to HDFC Bank Loan", "UPI/41920205/LoanEMI", "DEBIT", "₹ 15,000.00"),
                ("02 Nov 2026, 03:30 PM", "Cashback from PhonePe Promotion", "UPI/41920202/Cashback", "CREDIT", "₹ 100.00"),
                ("01 Nov 2026, 11:00 AM", "Received from Freelance Retainer Tech", "UPI/41920201/Retainer", "CREDIT", "₹ 35,000.00"),
            ]

        for date_str, desc, ref, t_type, amt_str in txns:
            c.setFont("Helvetica-Bold", 10)
            c.drawString(50, y, date_str)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(380, y, t_type)
            c.drawString(460, y, amt_str)
            y -= 14
            c.setFont("Helvetica", 9)
            c.drawString(50, y, desc)
            y -= 12
            c.setFont("Helvetica-Oblique", 8)
            c.drawString(50, y, ref)
            y -= 18
            if y < 60:
                break

        c.showPage()
    c.save()
    return buf.getvalue()


def create_password_protected_pdf(password: str = "secret123") -> bytes:
    """Generates a password-protected PDF."""
    raw_pdf = create_phonepe_pdf(num_pages=1)
    reader = PdfReader(io.BytesIO(raw_pdf))
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(password)
    out = io.BytesIO()
    writer.write(out)
    return out.getvalue()


def create_corrupted_pdf() -> bytes:
    """Returns invalid/corrupted PDF bytes."""
    return b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\nCORRUPTED DATA INVALID OBJECTS 999999999"


def create_no_txns_pdf() -> bytes:
    """Returns a valid PDF document with header & legal disclaimer but no financial transactions."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 750, "Bank of India - Customer Terms & Conditions")
    c.setFont("Helvetica", 10)
    c.drawString(50, 720, "This document outlines account terms, interest rates, and customer service guidelines.")
    c.drawString(50, 700, "Please visit your nearest branch for statement requests or dispute settlements.")
    c.showPage()
    c.save()
    return buf.getvalue()
