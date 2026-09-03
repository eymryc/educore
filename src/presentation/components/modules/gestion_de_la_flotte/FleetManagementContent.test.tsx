import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FleetManagementContent } from "@/presentation/components/modules/gestion_de_la_flotte/FleetManagementContent";

const listTransportVehicles = vi.fn();
const deleteTransportVehicle = vi.fn();

vi.mock("@/infrastructure/api/resources/transport", () => ({
  listTransportVehicles: (...a: unknown[]) => listTransportVehicles(...a),
  deleteTransportVehicle: (...a: unknown[]) => deleteTransportVehicle(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 1, roles: ["ADMIN"], permissions: [], institution_id: 1 } }),
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
describe("FleetManagementContent", () => {
  beforeEach(() => {
    listTransportVehicles.mockReset();
    listTransportVehicles.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        plate_number: "CI-1234-AB",
        label: "Bus 1",
        capacity: 40,
        status: "ACTIVE",
        notes: null,
      },
    ]);
  });

  it("lists vehicles", async () => {
    render(<FleetManagementContent />);
    await waitFor(() => expect(listTransportVehicles).toHaveBeenCalled());
    expect(await screen.findByText("CI-1234-AB")).toBeInTheDocument();
    expect(screen.getByText("Bus 1")).toBeInTheDocument();
  });
});
