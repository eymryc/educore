import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeachersManagementContent } from "@/presentation/components/modules/teachers_management/TeachersManagementContent";

const listTeachers = vi.fn();
const listSubjects = vi.fn();
const deleteTeacher = vi.fn();

vi.mock("@/infrastructure/api/resources/teachers", () => ({
  listTeachers: (...args: unknown[]) => listTeachers(...args),
  deleteTeacher: (...args: unknown[]) => deleteTeacher(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listSubjects: (...args: unknown[]) => listSubjects(...args),
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
describe("TeachersManagementContent", () => {
  beforeEach(() => {
    listTeachers.mockReset();
    listSubjects.mockReset();
    deleteTeacher.mockReset();
    listSubjects.mockResolvedValue([{ id: 1, name: "Mathématiques" }]);
  });

  it("shows loading then teachers from the API", async () => {
    listTeachers.mockResolvedValue([
      {
        id: 4,
        institution_id: 1,
        user_id: 8,
        employee_number: "ENS-004",
        first_name: "Fatou",
        last_name: "Diabaté",
        email: "f.diabate@ecole.ci",
        phone: "01",
        main_subject_id: 1,
        main_subject: { id: 1, name: "Mathématiques" },
        grade_title: "Certifié",
        hired_at: "2020-09-01",
        status: "active",
        assignments_count: 3,
      },
    ]);

    render(<TeachersManagementContent />);
    expect(screen.getByTestId("teachers-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("teachers-table")).toBeInTheDocument();
    });

    expect(screen.getByText("Diabaté")).toBeInTheDocument();
    expect(screen.getByText("Fatou")).toBeInTheDocument();
    expect(screen.getByText("f.diabate@ecole.ci")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Diabaté.*Fatou/i })).toHaveTextContent("Mathématiques");
    expect(screen.getByText("ENS-004")).toBeInTheDocument();
  });

  it("filters by search", async () => {
    const user = userEvent.setup();
    listTeachers.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        user_id: 1,
        employee_number: "A",
        first_name: "Fatou",
        last_name: "Diabaté",
        email: "f@ci",
        phone: "01",
        main_subject_id: null,
        grade_title: null,
        hired_at: null,
        status: "active",
        assignments_count: 0,
      },
      {
        id: 2,
        institution_id: 1,
        user_id: 2,
        employee_number: "B",
        first_name: "Jean",
        last_name: "Kouassi",
        email: "j@ci",
        phone: "02",
        main_subject_id: null,
        grade_title: null,
        hired_at: null,
        status: "active",
        assignments_count: 0,
      },
    ]);

    render(<TeachersManagementContent />);
    await waitFor(() => expect(screen.getByText("Diabaté")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText(/Rechercher par nom/i), "kouassi");
    expect(screen.queryByText("Diabaté")).not.toBeInTheDocument();
    expect(screen.getByText("Kouassi")).toBeInTheDocument();
    expect(screen.getByText("Jean")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    listTeachers.mockResolvedValue([]);
    render(<TeachersManagementContent />);
    await waitFor(() => expect(screen.getByTestId("teachers-empty")).toBeInTheDocument());
  });
});
