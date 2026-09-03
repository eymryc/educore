import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CanteenAccountsContent } from "@/presentation/components/modules/comptes_rechargements_cantine/CanteenAccountsContent";

const listCanteenAccounts = vi.fn();
const topUpCanteenAccount = vi.fn();
const deleteCanteenAccount = vi.fn();

vi.mock("@/infrastructure/api/resources/canteen", () => ({
  listCanteenAccounts: (...a: unknown[]) => listCanteenAccounts(...a),
  topUpCanteenAccount: (...a: unknown[]) => topUpCanteenAccount(...a),
  deleteCanteenAccount: (...a: unknown[]) => deleteCanteenAccount(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      roles: ["ADMIN"],
      permissions: [],
      institution_id: 1,
    },
  }),
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));


const account = {
  id: 3,
  institution_id: 1,
  student_id: 7,
  balance: "1000.00",
  status: "ACTIVE" as const,
  student: {
    id: 7,
    institution_id: 1,
    user_id: null,
    matricule: "EL-007",
    first_name: "Awa",
    last_name: "Koné",
    birth_date: null,
    gender: "F" as const,
    email: null,
    phone: null,
    address: null,
    level_id: null,
    class_group_id: null,
    status: "active" as const,
    enrolled_at: null,
    avatar_url: null,
  },
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("CanteenAccountsContent", () => {
  beforeEach(() => {
    listCanteenAccounts.mockReset();
    topUpCanteenAccount.mockReset();
    listCanteenAccounts.mockResolvedValue([account]);
    topUpCanteenAccount.mockResolvedValue({ id: 9, amount: 5000 });
  });

  it("lists accounts and submits a topup", async () => {
    const user = userEvent.setup();
    render(<CanteenAccountsContent />);
    await screen.findByText("Koné Awa");
    await user.click(screen.getByRole("button", { name: /Actions pour Koné Awa/i }));
    await user.click(screen.getByRole("menuitem", { name: "Recharger" }));
    expect(screen.getByTestId("canteen-topup-form")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Montant/i), "5000");
    await user.click(screen.getByRole("button", { name: /Valider le rechargement/i }));
    await waitFor(() =>
      expect(topUpCanteenAccount).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          amount: 5000,
          payment_method: "especes",
        })
      )
    );
    expect(await screen.findByText(/Rechargement enregistré/i)).toBeInTheDocument();
  });
});
