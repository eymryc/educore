import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeacherDetailContent } from "@/presentation/components/modules/teachers_management/TeacherDetailContent";

const getTeacher = vi.fn();
const listTeacherAssignments = vi.fn();
const listTeacherHistories = vi.fn();
const listSubjects = vi.fn();
const listClassGroups = vi.fn();
const listAcademicYears = vi.fn();
const createTeacherAssignment = vi.fn();
const deleteTeacherAssignment = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "4" }),
}));

vi.mock("@/infrastructure/api/resources/teachers", () => ({
  getTeacher: (...args: unknown[]) => getTeacher(...args),
  listTeacherAssignments: (...args: unknown[]) => listTeacherAssignments(...args),
  listTeacherHistories: (...args: unknown[]) => listTeacherHistories(...args),
  createTeacherAssignment: (...args: unknown[]) => createTeacherAssignment(...args),
  deleteTeacherAssignment: (...args: unknown[]) => deleteTeacherAssignment(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listSubjects: (...args: unknown[]) => listSubjects(...args),
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
describe("TeacherDetailContent", () => {
  beforeEach(() => {
    getTeacher.mockReset();
    listTeacherAssignments.mockReset();
    listTeacherHistories.mockReset();
    listSubjects.mockReset();
    listClassGroups.mockReset();
    listAcademicYears.mockReset();
    listAcademicYears.mockResolvedValue([]);
    createTeacherAssignment.mockReset();
    deleteTeacherAssignment.mockReset();

    getTeacher.mockResolvedValue({
      id: 4,
      institution_id: 1,
      user_id: 8,
      employee_number: "ENS-004",
      first_name: "Fatou",
      last_name: "Diabaté",
      email: "f@ci",
      phone: "01",
      main_subject_id: 1,
      main_subject: { id: 1, name: "Mathématiques" },
      grade_title: "Certifié",
      hired_at: "2020-09-01",
      status: "active",
      assignments_count: 1,
    });
    listSubjects.mockResolvedValue([{ id: 1, name: "Mathématiques" }]);
    listClassGroups.mockResolvedValue([{ id: 2, name: "2nde A" }]);
    listTeacherHistories.mockResolvedValue([]);
  });

  it("renders teacher and assignments", async () => {
    listTeacherAssignments.mockResolvedValue([
      {
        id: 10,
        institution_id: 1,
        teacher_id: 8,
        class_group_id: 2,
        subject_id: 1,
        class_group: { id: 2, name: "2nde A" },
        subject: { id: 1, name: "Mathématiques" },
      },
    ]);

    render(<TeacherDetailContent />);
    expect(screen.getByTestId("teacher-detail-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("teacher-detail-name")).toHaveTextContent("Diabaté Fatou");
    });

    expect(screen.getByTestId("teacher-main-subject")).toHaveTextContent("Mathématiques");
    expect(screen.getByTestId("teacher-assignments-list")).toHaveTextContent("2nde A");
  });

  it("creates an assignment", async () => {
    const user = userEvent.setup();
    listTeacherAssignments.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 11,
        institution_id: 1,
        teacher_id: 8,
        class_group_id: 2,
        subject_id: 1,
        class_group: { id: 2, name: "2nde A" },
        subject: { id: 1, name: "Mathématiques" },
      },
    ]);
    createTeacherAssignment.mockResolvedValue({ id: 11 });

    render(<TeacherDetailContent />);
    await waitFor(() => expect(screen.getByTestId("teacher-assignments-empty")).toBeInTheDocument());

    await user.click(screen.getByLabelText(/^Classe$/i));
    await user.click(await screen.findByRole("option", { name: /2nde A/i }));
    await user.click(screen.getByLabelText(/^Matière$/i));
    await user.click(await screen.findByRole("option", { name: /Mathématiques/i }));
    await user.click(screen.getByRole("button", { name: /Ajouter l'affectation/i }));

    await waitFor(() => {
      expect(createTeacherAssignment).toHaveBeenCalledWith("4", {
        class_group_id: 2,
        subject_id: 1,
      });
    });
  });

  it("shows error when teacher fails to load", async () => {
    getTeacher.mockRejectedValue(new Error("Introuvable"));
    listTeacherAssignments.mockResolvedValue([]);
    render(<TeacherDetailContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Introuvable");
    });
  });
});
