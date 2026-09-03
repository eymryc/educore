import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DriversManagementContent } from "@/presentation/components/modules/gestion_des_chauffeurs/DriversManagementContent";

const listTransportDrivers = vi.fn();
const deleteTransportDriver = vi.fn();

vi.mock("@/infrastructure/api/resources/transport", () => ({
  listTransportDrivers: (...a: unknown[]) => listTransportDrivers(...a),
  deleteTransportDriver: (...a: unknown[]) => deleteTransportDriver(...a),
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
describe("DriversManagementContent", () => {
  beforeEach(() => {
    listTransportDrivers.mockReset();
    listTransportDrivers.mockResolvedValue([
      {
        id: 2,
        institution_id: 1,
        first_name: "Jean",
        last_name: "Koffi",
        phone: "07000000",
        email: null,
        license_number: "P-99",
        status: "ACTIVE",
        hired_at: null,
      },
    ]);
  });

  it("lists drivers", async () => {
    render(<DriversManagementContent />);
    await waitFor(() => expect(listTransportDrivers).toHaveBeenCalled());
    expect(await screen.findByText("Jean Koffi")).toBeInTheDocument();
  });
});
