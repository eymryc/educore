import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();
const apiRequest = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

import {
  createExpense,
  createFeeCategory,
  createInvoice,
  downloadInvoiceReceipt,
  getFinanceOverview,
  issueInvoice,
  listCashTransactions,
  listUnpaidInvoices,
} from "@/infrastructure/api/resources/finance";
import {
  initiatePayment,
  listPayments,
  refundPayment,
} from "@/infrastructure/api/resources/payments";

describe("finance API resources", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
    apiRequest.mockReset();
  });

  it("loads overview and unpaid invoices", async () => {
    apiGet.mockResolvedValueOnce({ total_paid: 1 }).mockResolvedValueOnce([]);
    await getFinanceOverview();
    expect(apiGet).toHaveBeenCalledWith("/finance/overview");
    await listUnpaidInvoices();
    expect(apiGet).toHaveBeenCalledWith("/finance/unpaid-invoices");
  });

  it("lists cash transactions and creates fee categories", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 1 });
    await listCashTransactions({ cash_register_id: 2 });
    expect(apiGet).toHaveBeenCalledWith("/cash-transactions", { cash_register_id: 2 });
    await createFeeCategory({ name: "Scolarité", is_active: true });
    expect(apiPost).toHaveBeenCalledWith(
      "/fee-categories",
      expect.objectContaining({ name: "Scolarité" })
    );
  });

  it("creates invoice, issues it, and downloads receipt", async () => {
    apiPost.mockResolvedValue({ id: 1 });
    await createInvoice({
      student_id: 7,
      academic_year_id: 1,
      issue_date: "2026-09-01",
      due_date: "2026-09-30",
      items: [{ description: "Scolarité", unit_amount: 10000 }],
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/invoices",
      expect.objectContaining({ student_id: 7 })
    );

    await issueInvoice(1);
    expect(apiPost).toHaveBeenCalledWith("/invoices/1/issue");

    const blob = new Blob(["pdf"], { type: "application/pdf" });
    apiRequest.mockResolvedValue({
      blob: async () => blob,
      headers: { get: () => 'attachment; filename="facture-1.pdf"' },
    });
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    const remove = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click,
      remove,
      set href(_: string) {},
      get href() {
        return "";
      },
      set download(_: string) {},
      get download() {
        return "";
      },
    } as unknown as HTMLAnchorElement);

    await downloadInvoiceReceipt(1);
    expect(apiRequest).toHaveBeenCalledWith("/invoices/1/receipt", {
      method: "GET",
      raw: true,
    });
    expect(click).toHaveBeenCalled();
    appendChild.mockRestore();
    vi.unstubAllGlobals();
  });

  it("initiates payment and refunds without a client confirm endpoint", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 9, status: "PROCESSING" });

    await listPayments({ invoice_id: 3 });
    expect(apiGet).toHaveBeenCalledWith("/payments", { invoice_id: 3 });

    await initiatePayment({ invoice_id: 3, amount: 5000 });
    expect(apiPost).toHaveBeenCalledWith("/payments", {
      invoice_id: 3,
      amount: 5000,
    });
    expect(apiPost.mock.calls.every((c) => !String(c[0]).includes("confirm"))).toBe(
      true
    );

    await refundPayment(9, { amount: 1000 });
    expect(apiPost).toHaveBeenCalledWith("/payments/9/refund", { amount: 1000 });
  });

  it("creates expenses", async () => {
    apiPost.mockResolvedValue({ id: 4 });
    await createExpense({
      category: "Maintenance",
      description: "Climatisation",
      amount: 3000,
      expense_date: "2026-09-02",
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/expenses",
      expect.objectContaining({ category: "Maintenance" })
    );
  });
});
