import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentsManagementContent } from "@/presentation/components/modules/students_management/StudentsManagementContent";

const listStudentsPage = vi.fn();
const listLevels = vi.fn();
const listClassGroups = vi.fn();
const listAcademicYears = vi.fn();
const deleteStudent = vi.fn();

vi.mock("@/infrastructure/api/resources/students", () => ({
  listStudentsPage: (...args: unknown[]) => listStudentsPage(...args),
  deleteStudent: (...args: unknown[]) => deleteStudent(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listLevels: (...args: unknown[]) => listLevels(...args),
  listClassGroups: (...args: unknown[]) => listClassGroups(...args),
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
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

function paginated<T>(data: T[], meta?: { total?: number; last_page?: number; current_page?: number }) {
  return {
    data,
    meta: {
      current_page: meta?.current_page ?? 1,
      per_page: 10,
      total: meta?.total ?? data.length,
      last_page: meta?.last_page ?? 1,
    },
  };
}

const aminata = {
  id: 5,
  institution_id: 1,
  user_id: null,
  matricule: "ELV-2024-005",
  first_name: "Aminata",
  last_name: "Koné",
  birth_date: "2008-01-01",
  gender: "F" as const,
  email: "a@ecole.ci",
  phone: null,
  address: null,
  level_id: 1,
  class_group_id: 10,
  status: "active" as const,
  enrolled_at: null,
  avatar_url: null,
  level: { id: 1, name: "2nde" },
  class_group: { id: 10, name: "2nde A" },
};

const jean = {
  ...aminata,
  id: 2,
  matricule: "B-2",
  first_name: "Jean",
  last_name: "Traoré",
  email: null,
};

describe("StudentsManagementContent", () => {
  beforeEach(() => {
    listStudentsPage.mockReset();
    listLevels.mockReset();
    listClassGroups.mockReset();
    listAcademicYears.mockReset();
    deleteStudent.mockReset();
    listLevels.mockResolvedValue([{ id: 1, name: "2nde" }]);
    listAcademicYears.mockResolvedValue([{ id: 1, name: "2025-2026", is_active: true }]);
    listClassGroups.mockResolvedValue([
      { id: 10, name: "2nde A", level_id: 1, academic_year_id: 1 },
    ]);
  });

  it("shows loading then student rows from the API", async () => {
    listStudentsPage.mockResolvedValue(paginated([aminata]));

    render(<StudentsManagementContent />);
    expect(screen.getByTestId("students-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("students-table")).toBeInTheDocument();
    });

    expect(listStudentsPage).toHaveBeenCalledWith({ page: 1, per_page: 10 });
    expect(screen.getByText("Koné")).toBeInTheDocument();
    expect(screen.getByText("Aminata")).toBeInTheDocument();
    expect(screen.getByText("a@ecole.ci")).toBeInTheDocument();
    expect(screen.getByText("ELV-2024-005")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Koné.*Aminata/i })).toHaveTextContent("2nde A");
    expect(screen.getByRole("columnheader", { name: /^Nom$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^Prénom$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /E-mail/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Actions/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("row-actions").length).toBeGreaterThan(0);

    await userEvent.setup().click(
      screen.getByRole("button", { name: /Actions pour Koné Aminata/i })
    );
    expect(screen.getByRole("menuitem", { name: /Voir le dossier/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Modifier/i })).toBeInTheDocument();
  });

  it("searches server-side when typing in the search box", async () => {
    const user = userEvent.setup();
    listStudentsPage.mockImplementation(async (query?: { search?: string }) => {
      const q = (query?.search ?? "").toLowerCase();
      const rows = [aminata, jean].filter((s) =>
        `${s.first_name} ${s.last_name} ${s.matricule}`.toLowerCase().includes(q)
      );
      return paginated(rows);
    });

    render(<StudentsManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/Rechercher par nom ou matricule/i), "traoré");
    await waitFor(() => {
      expect(listStudentsPage).toHaveBeenLastCalledWith({
        search: "traoré",
        page: 1,
        per_page: 10,
      });
      expect(screen.queryByText("Koné")).not.toBeInTheDocument();
      expect(screen.getByText("Traoré")).toBeInTheDocument();
      expect(screen.getByText("Jean")).toBeInTheDocument();
    });
  });

  it("fetches the next page from the server", async () => {
    const user = userEvent.setup();
    listStudentsPage.mockResolvedValue(paginated([aminata], { total: 15, last_page: 2 }));

    render(<StudentsManagementContent />);
    await waitFor(() => expect(screen.getByTestId("students-table")).toHaveTextContent("Koné"));

    await user.click(screen.getByLabelText("Page suivante"));

    await waitFor(() => {
      expect(listStudentsPage).toHaveBeenLastCalledWith({ page: 2, per_page: 10 });
    });
  });

  it("shows empty state when API returns no students", async () => {
    listStudentsPage.mockResolvedValue(paginated([]));
    render(<StudentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("students-empty")).toBeInTheDocument();
    });
  });

  it("shows an error when listing fails", async () => {
    listStudentsPage.mockRejectedValue(new Error("API indisponible"));
    render(<StudentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("API indisponible");
    });
  });
});
