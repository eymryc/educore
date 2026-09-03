import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CashManagementContent } from "@/presentation/components/modules/cash_management/CashManagementContent";

const listCashRegisters = vi.fn();
const listCashTransactions = vi.fn();
const deleteCashRegister = vi.fn();

vi.mock("@/infrastructure/api/resources/finance", () => ({
  listCashRegisters: (...args: unknown[]) => listCashRegisters(...args),
  listCashTransactions: (...args: unknown[]) => listCashTransactions(...args),
  deleteCashRegister: (...args: unknown[]) => deleteCashRegister(...args),
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
describe("CashManagementContent", () => {
  beforeEach(() => {
    listCashRegisters.mockReset();
    listCashTransactions.mockReset();
    deleteCashRegister.mockReset();
  });

  it("loads cash registers", async () => {
    listCashRegisters.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        name: "Caisse principale",
        code: "CP",
        opening_balance: 0,
        current_balance: 50000,
        is_active: true,
        responsible_user_id: null,
      },
    ]);
    listCashTransactions.mockResolvedValue([]);

    render(<CashManagementContent />);

    expect(screen.getByTestId("cash-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("cash-registers-table")).toHaveTextContent("Caisse principale");
    });
  });

  it("shows error state", async () => {
    listCashRegisters.mockRejectedValue(new Error("Caisse indisponible"));
    listCashTransactions.mockResolvedValue([]);

    render(<CashManagementContent />);

    await waitFor(() => {
      expect(screen.getByTestId("cash-error")).toHaveTextContent("Caisse indisponible");
    });
  });
});
