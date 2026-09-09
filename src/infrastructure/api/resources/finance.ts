import { api, apiRequest } from "@/infrastructure/api/client";
import { emptyPaginationMeta } from "@/shared/types/api.types";
import type {
  CashRegister,
  CashTransaction,
  Expense,
  FeeCategory,
  FeeItem,
  FeeStructure,
  FinanceOverview,
  Invoice,
  InvoiceListResult,
} from "@/shared/types/finance.types";

export function getFinanceOverview(): Promise<FinanceOverview> {
  return api.get<FinanceOverview>("/finance/overview");
}

export function listUnpaidInvoices(): Promise<Invoice[]> {
  return api.get<Invoice[]>("/finance/unpaid-invoices");
}

export type InvoiceListQuery = {
  student_id?: number | string;
  class_group_id?: number | string;
  status?: string;
  search?: string;
  page?: number | string;
  per_page?: number | string;
};

export async function listInvoices(query?: InvoiceListQuery): Promise<InvoiceListResult> {
  const result = await api.getWithMeta<Invoice[]>("/invoices", query);
  return {
    data: result.data ?? [],
    meta: result.meta ?? emptyPaginationMeta(),
  };
}

export function getInvoice(id: number | string): Promise<Invoice> {
  return api.get<Invoice>(`/invoices/${id}`);
}

export function createInvoice(payload: Record<string, unknown>): Promise<Invoice> {
  return api.post<Invoice>("/invoices", payload);
}

/**
 * Génère les factures d'un élève pour une année scolaire à partir de sa
 * grille de frais (inscription/réinscription selon son historique + frais
 * annexes en une facture, scolarité répartie sur les trimestres).
 */
export function generateInvoices(payload: {
  student_id: number | string;
  academic_year_id: number | string;
}): Promise<Invoice[]> {
  return api.post<Invoice[]>("/invoices/generate", payload);
}

export function updateInvoice(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Invoice> {
  return api.put<Invoice>(`/invoices/${id}`, payload);
}

export function deleteInvoice(id: number | string): Promise<null> {
  return api.delete<null>(`/invoices/${id}`);
}

export function issueInvoice(id: number | string): Promise<Invoice> {
  return api.post<Invoice>(`/invoices/${id}/issue`);
}

export async function downloadInvoiceReceipt(id: number | string): Promise<void> {
  const response = await apiRequest<Response>(`/invoices/${id}/receipt`, {
    method: "GET",
    raw: true,
  });
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
  const filename = match?.[1]?.replace(/['"]/g, "") || `facture-${id}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export type ExpenseListQuery = {
  cash_register_id?: number | string;
};

export function listExpenses(query?: ExpenseListQuery): Promise<Expense[]> {
  return api.get<Expense[]>("/expenses", query);
}

export function getExpense(id: number | string): Promise<Expense> {
  return api.get<Expense>(`/expenses/${id}`);
}

export function createExpense(payload: Record<string, unknown>): Promise<Expense> {
  return api.post<Expense>("/expenses", payload);
}

export function updateExpense(
  id: number | string,
  payload: Record<string, unknown>
): Promise<Expense> {
  return api.put<Expense>(`/expenses/${id}`, payload);
}

export function deleteExpense(id: number | string): Promise<null> {
  return api.delete<null>(`/expenses/${id}`);
}

export function listCashRegisters(): Promise<CashRegister[]> {
  return api.get<CashRegister[]>("/cash-registers");
}

export function getCashRegister(id: number | string): Promise<CashRegister> {
  return api.get<CashRegister>(`/cash-registers/${id}`);
}

export function createCashRegister(payload: Record<string, unknown>): Promise<CashRegister> {
  return api.post<CashRegister>("/cash-registers", payload);
}

export function updateCashRegister(
  id: number | string,
  payload: Record<string, unknown>
): Promise<CashRegister> {
  return api.put<CashRegister>(`/cash-registers/${id}`, payload);
}

export function deleteCashRegister(id: number | string): Promise<null> {
  return api.delete<null>(`/cash-registers/${id}`);
}

export type CashTransactionListQuery = {
  cash_register_id?: number | string;
};

export function listCashTransactions(
  query?: CashTransactionListQuery
): Promise<CashTransaction[]> {
  return api.get<CashTransaction[]>("/cash-transactions", query);
}

export function getCashTransaction(id: number | string): Promise<CashTransaction> {
  return api.get<CashTransaction>(`/cash-transactions/${id}`);
}

export function createCashTransaction(
  payload: Record<string, unknown>
): Promise<CashTransaction> {
  return api.post<CashTransaction>("/cash-transactions", payload);
}

export function listFeeCategories(): Promise<FeeCategory[]> {
  return api.get<FeeCategory[]>("/fee-categories");
}

export function getFeeCategory(id: number | string): Promise<FeeCategory> {
  return api.get<FeeCategory>(`/fee-categories/${id}`);
}

export function createFeeCategory(payload: Record<string, unknown>): Promise<FeeCategory> {
  return api.post<FeeCategory>("/fee-categories", payload);
}

export function updateFeeCategory(
  id: number | string,
  payload: Record<string, unknown>
): Promise<FeeCategory> {
  return api.put<FeeCategory>(`/fee-categories/${id}`, payload);
}

export function deleteFeeCategory(id: number | string): Promise<null> {
  return api.delete<null>(`/fee-categories/${id}`);
}

export function listFeeStructures(): Promise<FeeStructure[]> {
  return api.get<FeeStructure[]>("/fee-structures");
}

export function getFeeStructure(id: number | string): Promise<FeeStructure> {
  return api.get<FeeStructure>(`/fee-structures/${id}`);
}

export function createFeeStructure(payload: Record<string, unknown>): Promise<FeeStructure> {
  return api.post<FeeStructure>("/fee-structures", payload);
}

export function updateFeeStructure(
  id: number | string,
  payload: Record<string, unknown>
): Promise<FeeStructure> {
  return api.put<FeeStructure>(`/fee-structures/${id}`, payload);
}

export function deleteFeeStructure(id: number | string): Promise<null> {
  return api.delete<null>(`/fee-structures/${id}`);
}

export function listFeeItems(): Promise<FeeItem[]> {
  return api.get<FeeItem[]>("/fee-items");
}

export function getFeeItem(id: number | string): Promise<FeeItem> {
  return api.get<FeeItem>(`/fee-items/${id}`);
}

export function createFeeItem(payload: Record<string, unknown>): Promise<FeeItem> {
  return api.post<FeeItem>("/fee-items", payload);
}

export function updateFeeItem(
  id: number | string,
  payload: Record<string, unknown>
): Promise<FeeItem> {
  return api.put<FeeItem>(`/fee-items/${id}`, payload);
}

export function deleteFeeItem(id: number | string): Promise<null> {
  return api.delete<null>(`/fee-items/${id}`);
}
