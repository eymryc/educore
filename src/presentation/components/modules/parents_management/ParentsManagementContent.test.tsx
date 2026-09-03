import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParentsManagementContent } from "@/presentation/components/modules/parents_management/ParentsManagementContent";

const listGuardians = vi.fn();
const deleteGuardian = vi.fn();

vi.mock("@/infrastructure/api/resources/guardians", () => ({
  listGuardians: (...args: unknown[]) => listGuardians(...args),
  deleteGuardian: (...args: unknown[]) => deleteGuardian(...args),
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
describe("ParentsManagementContent", () => {
  beforeEach(() => {
    listGuardians.mockReset();
    deleteGuardian.mockReset();
  });

  it("shows loading then guardians from the API", async () => {
    listGuardians.mockResolvedValue([
      {
        id: 7,
        institution_id: 1,
        user_id: 3,
        first_name: "Moussa",
        last_name: "Koné",
        email: "moussa@ci",
        phone: "0700000000",
        profession: "Commerçant",
        address: null,
        students_count: 2,
      },
    ]);

    render(<ParentsManagementContent />);
    expect(screen.getByTestId("parents-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("parents-table")).toBeInTheDocument();
    });

    expect(screen.getByText("Koné")).toBeInTheDocument();
    expect(screen.getByText("Moussa")).toBeInTheDocument();
    expect(screen.getByText("moussa@ci")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    const user = userEvent.setup();
    listGuardians.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        user_id: null,
        first_name: "Moussa",
        last_name: "Koné",
        email: "moussa@ci",
        phone: "01",
        profession: null,
        address: null,
        students_count: 0,
      },
      {
        id: 2,
        institution_id: 1,
        user_id: 1,
        first_name: "Awa",
        last_name: "Diallo",
        email: "awa@ci",
        phone: "02",
        profession: null,
        address: null,
        students_count: 1,
      },
    ]);

    render(<ParentsManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/Rechercher par nom/i), "diallo");
    expect(screen.queryByText("Koné")).not.toBeInTheDocument();
    expect(screen.getByText("Diallo")).toBeInTheDocument();
    expect(screen.getByText("Awa")).toBeInTheDocument();
  });

  it("shows empty and error states", async () => {
    listGuardians.mockResolvedValue([]);
    const { unmount } = render(<ParentsManagementContent />);
    await waitFor(() => expect(screen.getByTestId("parents-empty")).toBeInTheDocument());
    unmount();

    listGuardians.mockRejectedValue(new Error("Réseau coupé"));
    render(<ParentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Réseau coupé");
    });
  });
});
