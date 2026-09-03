import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TransportSubscriptionsContent } from "@/presentation/components/modules/abonnements_transport/TransportSubscriptionsContent";

const listTransportSubscriptions = vi.fn();
const deleteTransportSubscription = vi.fn();

vi.mock("@/infrastructure/api/resources/transport", () => ({
  listTransportSubscriptions: (...a: unknown[]) => listTransportSubscriptions(...a),
  deleteTransportSubscription: (...a: unknown[]) => deleteTransportSubscription(...a),
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
describe("TransportSubscriptionsContent", () => {
  beforeEach(() => {
    listTransportSubscriptions.mockReset();
    listTransportSubscriptions.mockResolvedValue([
      {
        id: 8,
        institution_id: 1,
        student_id: 7,
        transport_route_id: 5,
        transport_route_stop_id: 10,
        academic_year_id: 1,
        status: "ACTIVE",
        start_date: "2026-09-01",
        end_date: null,
        monthly_fee: 15000,
        student: {
          id: 7,
          institution_id: 1,
          user_id: null,
          matricule: "EL-007",
          first_name: "Awa",
          last_name: "Koné",
          birth_date: null,
          gender: "F",
          email: null,
          phone: null,
          address: null,
          level_id: null,
          class_group_id: null,
          status: "active",
          enrolled_at: null,
          avatar_url: null,
        },
        route: { id: 5, name: "Ligne Nord" },
        stop: { id: 10, name: "Cocody", transport_route_id: 5, address: null, stop_order: 1, pickup_time: null },
      },
    ]);
  });

  it("lists subscriptions", async () => {
    render(<TransportSubscriptionsContent />);
    await waitFor(() => expect(listTransportSubscriptions).toHaveBeenCalled());
    expect(await screen.findByText("Koné Awa")).toBeInTheDocument();
    expect(screen.getByText(/Ligne Nord/)).toBeInTheDocument();
  });
});
