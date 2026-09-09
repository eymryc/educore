import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsRolesContent } from "@/presentation/components/modules/system_settings/SettingsRolesContent";

const listRoles = vi.fn();
const listPermissions = vi.fn();
const updateRolePermissions = vi.fn();

vi.mock("@/infrastructure/api/resources/identity", () => ({
  listRoles: (...args: unknown[]) => listRoles(...args),
  listPermissions: (...args: unknown[]) => listPermissions(...args),
  updateRolePermissions: (...args: unknown[]) => updateRolePermissions(...args),
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

describe("SettingsRolesContent", () => {
  beforeEach(() => {
    listRoles.mockReset();
    listPermissions.mockReset();
    updateRolePermissions.mockReset();
    listRoles.mockResolvedValue([
      { id: 1, name: "SUPER_ADMIN", permissions: ["settings.view", "settings.update"] },
      { id: 2, name: "TEACHER", permissions: ["students.view"] },
    ]);
    listPermissions.mockResolvedValue([
      { name: "students.view", domain: "students", action: "view" },
      { name: "students.create", domain: "students", action: "create" },
      { name: "grades.view", domain: "grades", action: "view" },
      { name: "grades.validate", domain: "grades", action: "validate" },
    ]);
    updateRolePermissions.mockResolvedValue({
      id: 2,
      name: "TEACHER",
      permissions: ["students.view", "students.create"],
    });
  });

  it("lists roles and updates teacher permissions", async () => {
    const user = userEvent.setup();
    render(<SettingsRolesContent />);

    await waitFor(() => expect(screen.getByTestId("roles-panel")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Enseignant/i }));
    expect(screen.getByTestId("roles-matrix")).toBeInTheDocument();
    expect(screen.getByText("Élèves")).toBeInTheDocument();
    expect(screen.getByText("Scolarité")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Élèves — Créer" }));
    await waitFor(() => {
      expect(updateRolePermissions).toHaveBeenCalledWith(2, ["students.view", "students.create"]);
    });
    expect(await screen.findByText("Enregistré")).toBeInTheDocument();
  });
});
