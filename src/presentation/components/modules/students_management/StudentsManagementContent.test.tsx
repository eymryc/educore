import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentsManagementContent } from "@/presentation/components/modules/students_management/StudentsManagementContent";

const listStudents = vi.fn();
const listLevels = vi.fn();
const listClassGroups = vi.fn();
const listAcademicYears = vi.fn();
const deleteStudent = vi.fn();

vi.mock("@/infrastructure/api/resources/students", () => ({
  listStudents: (...args: unknown[]) => listStudents(...args),
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
describe("StudentsManagementContent", () => {
  beforeEach(() => {
    listStudents.mockReset();
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
    listStudents.mockResolvedValue([
      {
        id: 5,
        institution_id: 1,
        user_id: null,
        matricule: "ELV-2024-005",
        first_name: "Aminata",
        last_name: "Koné",
        birth_date: "2008-01-01",
        gender: "F",
        email: "a@ecole.ci",
        phone: null,
        address: null,
        level_id: 1,
        class_group_id: 10,
        status: "active",
        enrolled_at: null,
        avatar_url: null,
        level: { id: 1, name: "2nde" },
        class_group: { id: 10, name: "2nde A" },
      },
    ]);

    render(<StudentsManagementContent />);
    expect(screen.getByTestId("students-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("students-table")).toBeInTheDocument();
    });

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

  it("filters by search input", async () => {
    const user = userEvent.setup();
    listStudents.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        user_id: null,
        matricule: "A-1",
        first_name: "Aminata",
        last_name: "Koné",
        birth_date: "2008-01-01",
        gender: "F",
        email: null,
        phone: null,
        address: null,
        level_id: 1,
        class_group_id: 10,
        status: "active",
        enrolled_at: null,
        avatar_url: null,
        level: { id: 1, name: "2nde" },
        class_group: { id: 10, name: "2nde A" },
      },
      {
        id: 2,
        institution_id: 1,
        user_id: null,
        matricule: "B-2",
        first_name: "Jean",
        last_name: "Traoré",
        birth_date: "2008-01-01",
        gender: "M",
        email: null,
        phone: null,
        address: null,
        level_id: 1,
        class_group_id: 10,
        status: "active",
        enrolled_at: null,
        avatar_url: null,
        level: { id: 1, name: "2nde" },
        class_group: { id: 10, name: "2nde A" },
      },
    ]);

    render(<StudentsManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/Rechercher par nom ou matricule/i), "traoré");
    expect(screen.queryByText("Koné")).not.toBeInTheDocument();
    expect(screen.getByText("Traoré")).toBeInTheDocument();
    expect(screen.getByText("Jean")).toBeInTheDocument();
  });

  it("shows empty state when API returns no students", async () => {
    listStudents.mockResolvedValue([]);
    render(<StudentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("students-empty")).toBeInTheDocument();
    });
  });

  it("shows an error when listing fails", async () => {
    listStudents.mockRejectedValue(new Error("API indisponible"));
    render(<StudentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("API indisponible");
    });
  });
});
