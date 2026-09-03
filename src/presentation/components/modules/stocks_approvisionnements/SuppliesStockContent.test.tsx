import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuppliesStockContent } from "@/presentation/components/modules/stocks_approvisionnements/SuppliesStockContent";

const listInventorySupplies = vi.fn();
const restockInventorySupply = vi.fn();
const deleteInventorySupply = vi.fn();

vi.mock("@/infrastructure/api/resources/inventory", () => ({
  listInventorySupplies: (...a: unknown[]) => listInventorySupplies(...a),
  restockInventorySupply: (...a: unknown[]) => restockInventorySupply(...a),
  deleteInventorySupply: (...a: unknown[]) => deleteInventorySupply(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1, roles: ["ADMIN"], permissions: [], institution_id: 1 },
  }),
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("SuppliesStockContent", () => {
  beforeEach(() => {
    listInventorySupplies.mockReset();
    restockInventorySupply.mockReset();
    listInventorySupplies.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        designation: "Craies",
        category: "Fournitures",
        quantity: 3,
        alert_threshold: 10,
        unit: "boîte",
        supplier: null,
        is_active: true,
        is_low_stock: true,
      },
    ]);
    restockInventorySupply.mockResolvedValue({ id: 9, type: "restock" });
  });

  it("lists supplies and restocks", async () => {
    const user = userEvent.setup();
    render(<SuppliesStockContent />);
    await waitFor(() => expect(listInventorySupplies).toHaveBeenCalled());
    expect(await screen.findByText("Craies")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mouvement" }));
    expect(screen.getByTestId("restock-form")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Quantité/i), "20");
    await user.click(screen.getByRole("button", { name: "Valider" }));
    await waitFor(() =>
      expect(restockInventorySupply).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ quantity: 20, type: "restock" })
      )
    );
  });
});
