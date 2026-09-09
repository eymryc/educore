import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ParentsManagementContent } from "@/presentation/components/modules/parents_management/ParentsManagementContent";

const listGuardiansPage = vi.fn();
const deleteGuardian = vi.fn();

vi.mock("@/infrastructure/api/resources/guardians", () => ({
  listGuardiansPage: (...args: unknown[]) => listGuardiansPage(...args),
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

function paginated<T>(data: T[]) {
  return { data, meta: { current_page: 1, per_page: 10, total: data.length, last_page: 1 } };
}

const moussa = {
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
};

const awa = {
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
};

describe("ParentsManagementContent", () => {
  beforeEach(() => {
    listGuardiansPage.mockReset();
    deleteGuardian.mockReset();
  });

  it("shows loading then guardians from the API", async () => {
    listGuardiansPage.mockResolvedValue(paginated([moussa]));

    render(<ParentsManagementContent />);
    expect(screen.getByTestId("parents-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("parents-table")).toBeInTheDocument();
    });

    expect(listGuardiansPage).toHaveBeenCalledWith({ page: 1, per_page: 10 });
    expect(screen.getByText("Koné")).toBeInTheDocument();
    expect(screen.getByText("Moussa")).toBeInTheDocument();
    expect(screen.getByText("moussa@ci")).toBeInTheDocument();
  });

  it("searches server-side when typing in the search box", async () => {
    const user = userEvent.setup();
    listGuardiansPage.mockImplementation(async (query?: { search?: string }) => {
      const q = (query?.search ?? "").toLowerCase();
      const rows = [moussa, awa].filter((g) =>
        `${g.first_name} ${g.last_name} ${g.email} ${g.phone}`.toLowerCase().includes(q)
      );
      return paginated(rows);
    });

    render(<ParentsManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/Rechercher par nom/i), "diallo");
    await waitFor(() => {
      expect(listGuardiansPage).toHaveBeenLastCalledWith({
        search: "diallo",
        page: 1,
        per_page: 10,
      });
      expect(screen.queryByText("Koné")).not.toBeInTheDocument();
      expect(screen.getByText("Diallo")).toBeInTheDocument();
      expect(screen.getByText("Awa")).toBeInTheDocument();
    });
  });

  it("shows empty and error states", async () => {
    listGuardiansPage.mockResolvedValue(paginated([]));
    const { unmount } = render(<ParentsManagementContent />);
    await waitFor(() => expect(screen.getByTestId("parents-empty")).toBeInTheDocument());
    unmount();

    listGuardiansPage.mockRejectedValue(new Error("Réseau coupé"));
    render(<ParentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Réseau coupé");
    });
  });
});
