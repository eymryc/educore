import type { AcademicYear, NamedRef } from "@/shared/types/academic.types";
import type { Student } from "@/shared/types/student.types";
import { studentFullName } from "@/shared/types/student.types";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface FinanceOverview {
  total_invoiced: number | string;
  total_paid: number | string;
  total_unpaid: number | string;
  total_expenses: number | string;
  cash_balance: number | string;
  invoices_count: number;
  unpaid_invoices_count: number;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  fee_item_id?: number | null;
  description: string;
  quantity: number | string;
  unit_amount: number | string;
  total_amount?: number | string;
}

export interface Invoice {
  id: number;
  institution_id: number;
  student_id: number;
  academic_year_id: number;
  invoice_number: string | null;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number | string;
  discount_amount: number | string;
  penalty_amount: number | string;
  total_amount: number | string;
  amount_paid: number | string;
  balance_due: number | string;
  notes: string | null;
  created_by: number | null;
  student?: Student | null;
  academic_year?: AcademicYear | NamedRef | null;
  items?: InvoiceItem[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Payment {
  id: number;
  institution_id: number;
  invoice_id: number;
  student_id: number | null;
  amount: number | string;
  currency: string | null;
  status: PaymentStatus;
  provider: string | null;
  provider_reference: string | null;
  provider_transaction_id: string | null;
  authorization_url?: string | null;
  refund_amount: number | string | null;
  paid_at: string | null;
  failed_at: string | null;
  refunded_at: string | null;
  initiated_by: number | null;
  invoice?: Invoice | null;
  student?: Student | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Expense {
  id: number;
  institution_id: number;
  cash_register_id: number | null;
  category: string;
  description: string;
  amount: number | string;
  expense_date: string;
  reference: string | null;
  recorded_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CashRegister {
  id: number;
  institution_id: number;
  name: string;
  code: string | null;
  opening_balance: number | string;
  current_balance: number | string;
  is_active: boolean;
  responsible_user_id: number | null;
}

export interface FeeCategory {
  id: number;
  institution_id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FeeItem {
  id: number;
  institution_id: number;
  fee_structure_id: number;
  fee_category_id: number;
  label: string;
  amount: number | string;
  is_mandatory: boolean;
  sort_order: number | null;
  fee_category?: FeeCategory | null;
  fee_structure?: FeeStructure | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FeeStructure {
  id: number;
  institution_id: number;
  academic_year_id: number;
  level_id: number | null;
  name: string;
  description: string | null;
  is_active: boolean;
  academic_year?: AcademicYear | NamedRef | null;
  level?: NamedRef | null;
  items?: FeeItem[];
  created_at?: string | null;
  updated_at?: string | null;
}

export type CashTransactionType = "INCOME" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT";
export type CashTransactionDirection = "IN" | "OUT";

export interface CashTransaction {
  id: number;
  institution_id: number;
  cash_register_id: number;
  type: CashTransactionType;
  direction: CashTransactionDirection;
  amount: number | string;
  reference_type: string | null;
  reference_id: number | null;
  description: string;
  transaction_date: string | null;
  recorded_by: number | null;
  cash_register?: CashRegister | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const CASH_TRANSACTION_TYPE_LABELS: Record<CashTransactionType, string> = {
  INCOME: "Recette",
  EXPENSE: "Dépense",
  TRANSFER: "Transfert",
  ADJUSTMENT: "Ajustement",
};

export const CASH_TRANSACTION_DIRECTION_LABELS: Record<CashTransactionDirection, string> = {
  IN: "Entrée",
  OUT: "Sortie",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  PROCESSING: "En cours",
  SUCCESS: "Réussi",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  PARTIALLY_PAID: "Partiellement payée",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
};

export function toMoneyNumber(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoneyFcfa(value: number | string | null | undefined): string {
  return `${toMoneyNumber(value).toLocaleString("fr-FR")} FCFA`;
}

export function canIssueInvoice(status: InvoiceStatus): boolean {
  return status === "DRAFT";
}

export function canEditInvoice(status: InvoiceStatus): boolean {
  return status === "DRAFT";
}

export function canPayInvoice(status: InvoiceStatus): boolean {
  return status === "ISSUED" || status === "PARTIALLY_PAID" || status === "OVERDUE";
}

export function canOpenPaystackCheckout(payment: Pick<Payment, "status" | "authorization_url">): boolean {
  return (
    Boolean(payment.authorization_url) &&
    (payment.status === "PENDING" || payment.status === "PROCESSING")
  );
}

export function filterInvoices(
  items: Invoice[],
  filters: { search?: string; status?: string }
): Invoice[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((inv) => {
    if (filters.status && inv.status !== filters.status) return false;
    if (!q) return true;
    const name = inv.student ? studentFullName(inv.student) : "";
    return `${inv.invoice_number ?? ""} ${name}`.toLowerCase().includes(q);
  });
}

export function filterPayments(
  items: Payment[],
  filters: { search?: string; status?: string }
): Payment[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (!q) return true;
    const name = p.student ? studentFullName(p.student) : "";
    return `${p.provider_reference ?? ""} ${name} ${p.invoice_id}`.toLowerCase().includes(q);
  });
}

export function filterExpenses(
  items: Expense[],
  filters: { search?: string; category?: string }
): Expense[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((e) => {
    if (filters.category && e.category !== filters.category) return false;
    if (!q) return true;
    return `${e.description} ${e.category} ${e.reference ?? ""}`.toLowerCase().includes(q);
  });
}
