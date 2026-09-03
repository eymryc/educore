import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoicesManagementContent } from "@/presentation/components/modules/invoices_management/InvoicesManagementContent";

const listInvoices = vi.fn();
const issueInvoice = vi.fn();
const downloadInvoiceReceipt = vi.fn();
const deleteInvoice = vi.fn();

vi.mock("@/infrastructure/api/resources/finance", () => ({
  listInvoices: (...args: unknown[]) => listInvoices(...args),
  issueInvoice: (...args: unknown[]) => issueInvoice(...args),
  downloadInvoiceReceipt: (...args: unknown[]) => downloadInvoiceReceipt(...args),
  deleteInvoice: (...args: unknown[]) => deleteInvoice(...args),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Admin",
      email: "admin@educore.ci",
      institution_id: 1,
      roles: ["ADMIN"],
      permissions: [],
      email_verified_at: null,
      created_at: null,
    },
  }),
  getAuthErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Une erreur est survenue.",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const draftInvoice = {
  id: 1,
  institution_id: 1,
  student_id: 7,
  academic_year_id: 1,
  invoice_number: "INV-001",
  issue_date: "2026-09-01",
  due_date: "2026-09-30",
  status: "DRAFT" as const,
  subtotal: 10000,
  discount_amount: 0,
  penalty_amount: 0,
  total_amount: 10000,
  amount_paid: 0,
  balance_due: 10000,
  notes: null,
  created_by: 1,
  student: {
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
  },
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("InvoicesManagementContent", () => {
  beforeEach(() => {
    listInvoices.mockReset();
    issueInvoice.mockReset();
    downloadInvoiceReceipt.mockReset();
    deleteInvoice.mockReset();
  });

  it("lists invoices and issues a draft", async () => {
    listInvoices.mockResolvedValue([draftInvoice]);
    issueInvoice.mockResolvedValue({ ...draftInvoice, status: "ISSUED" });

    render(<InvoicesManagementContent />);
    expect(screen.getByTestId("invoices-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("invoices-table")).toHaveTextContent("INV-001");
    });

    await userEvent.click(screen.getByRole("button", { name: /Actions pour/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /émettre/i }));
    await waitFor(() => {
      expect(issueInvoice).toHaveBeenCalledWith(1);
    });
  });

  it("shows error state", async () => {
    listInvoices.mockRejectedValue(new Error("Factures KO"));
    render(<InvoicesManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("invoices-error")).toHaveTextContent("Factures KO");
    });
  });
});
