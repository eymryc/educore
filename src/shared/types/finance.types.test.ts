import { describe, expect, it } from "vitest";
import {
  canIssueInvoice,
  canOpenPaystackCheckout,
  filterExpenses,
  filterInvoices,
  filterPayments,
  formatMoneyFcfa,
  type Expense,
  type Invoice,
  type Payment,
} from "@/shared/types/finance.types";

const student = {
  id: 7,
  institution_id: 1,
  user_id: null,
  matricule: "EL-007",
  first_name: "Awa",
  last_name: "Koné",
  birth_date: "2010-01-01",
  gender: "F" as const,
  email: null,
  phone: null,
  address: null,
  level_id: 1,
  class_group_id: 2,
  status: "active" as const,
  enrolled_at: null,
  avatar_url: null,
};

describe("finance helpers", () => {
  it("formats money and gates invoice/payment actions", () => {
    expect(formatMoneyFcfa(1500)).toContain("1");
    expect(formatMoneyFcfa(1500)).toContain("FCFA");
    expect(canIssueInvoice("DRAFT")).toBe(true);
    expect(canIssueInvoice("ISSUED")).toBe(false);
    expect(
      canOpenPaystackCheckout({
        status: "PROCESSING",
        authorization_url: "https://paystack.test/checkout",
      })
    ).toBe(true);
    expect(
      canOpenPaystackCheckout({ status: "SUCCESS", authorization_url: "https://x" })
    ).toBe(false);
  });

  it("filters invoices, payments and expenses", () => {
    const invoices: Invoice[] = [
      {
        id: 1,
        institution_id: 1,
        student_id: 7,
        academic_year_id: 1,
        invoice_number: "INV-001",
        issue_date: "2026-09-01",
        due_date: "2026-09-30",
        status: "ISSUED",
        subtotal: 10000,
        discount_amount: 0,
        penalty_amount: 0,
        total_amount: 10000,
        amount_paid: 0,
        balance_due: 10000,
        notes: null,
        created_by: 1,
        student,
      },
    ];
    expect(filterInvoices(invoices, { search: "koné" })).toHaveLength(1);
    expect(filterInvoices(invoices, { status: "PAID" })).toHaveLength(0);

    const payments: Payment[] = [
      {
        id: 2,
        institution_id: 1,
        invoice_id: 1,
        student_id: 7,
        amount: 5000,
        currency: "XOF",
        status: "PROCESSING",
        provider: "paystack",
        provider_reference: "ref-abc",
        provider_transaction_id: null,
        receipt_number: null,
        method: "PAYSTACK",
        refund_amount: null,
        paid_at: null,
        failed_at: null,
        refunded_at: null,
        initiated_by: 1,
        student,
      },
    ];
    expect(filterPayments(payments, { search: "ref-abc" })).toHaveLength(1);

    const expenses: Expense[] = [
      {
        id: 3,
        institution_id: 1,
        cash_register_id: null,
        category: "Fournitures",
        description: "Cahiers",
        amount: 2000,
        expense_date: "2026-09-01",
        reference: "FAC-9",
        recorded_by: 1,
      },
    ];
    expect(filterExpenses(expenses, { category: "Fournitures" })).toHaveLength(1);
    expect(filterExpenses(expenses, { search: "cahiers" })).toHaveLength(1);
  });
});
