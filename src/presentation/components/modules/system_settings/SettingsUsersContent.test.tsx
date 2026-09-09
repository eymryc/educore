import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsUsersContent } from "@/presentation/components/modules/system_settings/SettingsUsersContent";

const listUsers = vi.fn();
const createUser = vi.fn();
const updateUser = vi.fn();
const deleteUser = vi.fn();

vi.mock("@/infrastructure/api/resources/identity", () => ({
  listUsers: (...args: unknown[]) => listUsers(...args),
  createUser: (...args: unknown[]) => createUser(...args),
  updateUser: (...args: unknown[]) => updateUser(...args),
  deleteUser: (...args: unknown[]) => deleteUser(...args),
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

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

describe("SettingsUsersContent", () => {
  beforeEach(() => {
    listUsers.mockReset();
    createUser.mockReset();
    updateUser.mockReset();
    deleteUser.mockReset();
    listUsers.mockResolvedValue({
      data: [
        {
          id: 2,
          name: "Aminata Diallo",
          email: "secretary@educore.ci",
          institution_id: 1,
          roles: ["SECRETARY"],
          permissions: [],
          email_verified_at: null,
          created_at: null,
        },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
    });
  });

  it("lists users and creates a new account", async () => {
    const user = userEvent.setup();
    createUser.mockResolvedValue({
      id: 9,
      name: "Yao Kouassi",
      email: "yao@educore.ci",
      institution_id: 1,
      roles: ["SECRETARY"],
      permissions: [],
      email_verified_at: null,
      created_at: null,
    });

    render(<SettingsUsersContent />);
    await waitFor(() => expect(screen.getByText("Aminata Diallo")).toBeInTheDocument());
    expect(screen.getByText("secretary@educore.ci")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nouvel utilisateur/i }));
    expect(screen.getByTestId("user-form")).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Nom complet/i));
    await user.type(screen.getByLabelText(/Nom complet/i), "Yao Kouassi");
    await user.clear(screen.getByLabelText(/E-mail/i));
    await user.type(screen.getByLabelText(/E-mail/i), "yao@educore.ci");
    await user.type(screen.getByLabelText(/Mot de passe/i), "password1");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith({
        name: "Yao Kouassi",
        email: "yao@educore.ci",
        password: "password1",
        roles: ["SECRETARY"],
      });
    });
  });
});
