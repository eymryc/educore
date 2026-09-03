import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InventoryAssetsContent } from "@/presentation/components/modules/inventory_assets/InventoryAssetsContent";

const listInventoryAssets = vi.fn();
const getInventoryAsset = vi.fn();
const assignInventoryAsset = vi.fn();
const deleteInventoryAsset = vi.fn();
const listStaffMembers = vi.fn();
const listInstitutionRooms = vi.fn();

vi.mock("@/infrastructure/api/resources/inventory", () => ({
  listInventoryAssets: (...a: unknown[]) => listInventoryAssets(...a),
  getInventoryAsset: (...a: unknown[]) => getInventoryAsset(...a),
  assignInventoryAsset: (...a: unknown[]) => assignInventoryAsset(...a),
  deleteInventoryAsset: (...a: unknown[]) => deleteInventoryAsset(...a),
}));

vi.mock("@/infrastructure/api/resources/hr", () => ({
  listStaffMembers: (...a: unknown[]) => listStaffMembers(...a),
}));

vi.mock("@/infrastructure/api/resources/institution", () => ({
  listInstitutionRooms: (...a: unknown[]) => listInstitutionRooms(...a),
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
describe("InventoryAssetsContent", () => {
  beforeEach(() => {
    listInventoryAssets.mockReset();
    getInventoryAsset.mockReset();
    assignInventoryAsset.mockReset();
    listStaffMembers.mockResolvedValue([]);
    listInstitutionRooms.mockResolvedValue([]);
    listInventoryAssets.mockResolvedValue([
      {
        id: 4,
        institution_id: 1,
        designation: "Projecteur",
        category: "IT",
        serial_number: "SN-1",
        acquisition_date: "2024-01-01",
        value: 250000,
        location: "Salle info",
        status: "en_service",
        assigned_staff_member_id: null,
        assigned_room_id: null,
      },
    ]);
    getInventoryAsset.mockResolvedValue({
      id: 4,
      institution_id: 1,
      designation: "Projecteur",
      category: "IT",
      serial_number: "SN-1",
      acquisition_date: "2024-01-01",
      value: 250000,
      location: "Salle info",
      status: "en_service",
      assigned_staff_member_id: null,
      assigned_room_id: null,
      histories: [
        {
          id: 1,
          inventory_asset_id: 4,
          event_type: "created",
          description: "Créé",
          old_status: null,
          new_status: "en_service",
          old_location: null,
          new_location: null,
          assigned_staff_member_id: null,
          assigned_room_id: null,
          recorded_by: 1,
          created_at: "2026-09-01T10:00:00Z",
        },
      ],
    });
    assignInventoryAsset.mockResolvedValue({
      id: 4,
      institution_id: 1,
      designation: "Projecteur",
      category: "IT",
      serial_number: "SN-1",
      acquisition_date: "2024-01-01",
      value: 250000,
      location: "Bureau RH",
      status: "en_service",
      assigned_staff_member_id: null,
      assigned_room_id: null,
    });
  });

  it("lists assets, shows history, and assigns", async () => {
    const user = userEvent.setup();
    render(<InventoryAssetsContent />);
    await waitFor(() => expect(listInventoryAssets).toHaveBeenCalled());
    expect(await screen.findByText("Projecteur")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actions pour Projecteur/i }));
    await user.click(screen.getByRole("menuitem", { name: "Historique" }));
    await waitFor(() => expect(getInventoryAsset).toHaveBeenCalledWith(4));
    expect(await screen.findByTestId("asset-history")).toHaveTextContent("Création");

    await user.click(screen.getByRole("button", { name: /Actions pour Projecteur/i }));
    await user.click(screen.getByRole("menuitem", { name: "Affecter" }));
    expect(screen.getByTestId("assign-form")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Localisation/i));
    await user.type(screen.getByLabelText(/Localisation/i), "Bureau RH");
    await user.click(screen.getByRole("button", { name: /Valider l'affectation/i }));
    await waitFor(() =>
      expect(assignInventoryAsset).toHaveBeenCalledWith(
        4,
        expect.objectContaining({ location: "Bureau RH" })
      )
    );
  });
});
