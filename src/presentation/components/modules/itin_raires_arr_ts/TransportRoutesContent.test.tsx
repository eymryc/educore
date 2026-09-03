import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransportRoutesContent } from "@/presentation/components/modules/itin_raires_arr_ts/TransportRoutesContent";

const listTransportRoutes = vi.fn();
const deleteTransportRoute = vi.fn();

vi.mock("@/infrastructure/api/resources/transport", () => ({
  listTransportRoutes: (...a: unknown[]) => listTransportRoutes(...a),
  deleteTransportRoute: (...a: unknown[]) => deleteTransportRoute(...a),
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
describe("TransportRoutesContent", () => {
  beforeEach(() => {
    listTransportRoutes.mockReset();
    listTransportRoutes.mockResolvedValue([
      {
        id: 5,
        institution_id: 1,
        name: "Ligne Nord",
        code: "LN",
        description: null,
        transport_vehicle_id: 1,
        transport_driver_id: 2,
        is_active: true,
        vehicle: { id: 1, label: "Bus 1", plate_number: "CI-1" },
        driver: { id: 2, first_name: "Jean", last_name: "Koffi" },
        stops: [
          {
            id: 10,
            transport_route_id: 5,
            name: "Cocody",
            address: null,
            stop_order: 1,
            pickup_time: "06:30",
          },
        ],
        subscriptions_count: 3,
      },
    ]);
  });

  it("lists routes and expands stops", async () => {
    const user = userEvent.setup();
    render(<TransportRoutesContent />);
    await waitFor(() => expect(listTransportRoutes).toHaveBeenCalled());
    expect(await screen.findByText("Ligne Nord")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Arrêts \(1\)/i }));
    expect(await screen.findByTestId("route-stops-5")).toHaveTextContent("Cocody");
  });
});
