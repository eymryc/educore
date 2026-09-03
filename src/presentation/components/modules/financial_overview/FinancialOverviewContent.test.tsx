import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialOverviewContent } from "@/presentation/components/modules/financial_overview/FinancialOverviewContent";

const getFinanceOverview = vi.fn();
const listUnpaidInvoices = vi.fn();

vi.mock("@/infrastructure/api/resources/finance", () => ({
  getFinanceOverview: (...args: unknown[]) => getFinanceOverview(...args),
  listUnpaidInvoices: (...args: unknown[]) => listUnpaidInvoices(...args),
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

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("FinancialOverviewContent", () => {
  beforeEach(() => {
    getFinanceOverview.mockReset();
    listUnpaidInvoices.mockReset();
  });

  it("shows loading then KPIs", async () => {
    getFinanceOverview.mockResolvedValue({
      total_invoiced: 100000,
      total_paid: 60000,
      total_unpaid: 40000,
      total_expenses: 15000,
      cash_balance: 45000,
      invoices_count: 12,
      unpaid_invoices_count: 3,
    });
    listUnpaidInvoices.mockResolvedValue([]);

    render(<FinancialOverviewContent />);
    expect(screen.getByTestId("finance-overview-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("finance-overview-kpis")).toBeInTheDocument();
    });
    expect(screen.getByTestId("finance-kpi-paid")).toHaveTextContent("FCFA");
    expect(screen.getByTestId("finance-unpaid-list")).toHaveTextContent(
      "Aucune facture impayée"
    );
  });

  it("shows error state", async () => {
    getFinanceOverview.mockRejectedValue(new Error("API down"));
    listUnpaidInvoices.mockResolvedValue([]);
    render(<FinancialOverviewContent />);
    await waitFor(() => {
      expect(screen.getByTestId("finance-overview-error")).toHaveTextContent("API down");
    });
  });
});
