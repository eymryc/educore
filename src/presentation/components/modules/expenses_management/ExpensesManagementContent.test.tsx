import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpensesManagementContent } from "@/presentation/components/modules/expenses_management/ExpensesManagementContent";

const listExpenses = vi.fn();
const deleteExpense = vi.fn();

vi.mock("@/infrastructure/api/resources/finance", () => ({
  listExpenses: (...args: unknown[]) => listExpenses(...args),
  deleteExpense: (...args: unknown[]) => deleteExpense(...args),
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
describe("ExpensesManagementContent", () => {
  beforeEach(() => {
    listExpenses.mockReset();
    deleteExpense.mockReset();
  });

  it("lists expenses and shows total", async () => {
    listExpenses.mockResolvedValue([
      {
        id: 4,
        institution_id: 1,
        cash_register_id: null,
        category: "Fournitures",
        description: "Cahiers",
        amount: 2500,
        expense_date: "2026-09-02",
        reference: null,
        recorded_by: 1,
      },
    ]);

    render(<ExpensesManagementContent />);
    expect(screen.getByTestId("expenses-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("expenses-table")).toHaveTextContent("Cahiers");
    });
  });

  it("shows error state", async () => {
    listExpenses.mockRejectedValue(new Error("Dépenses KO"));
    render(<ExpensesManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("expenses-error")).toHaveTextContent("Dépenses KO");
    });
  });
});
