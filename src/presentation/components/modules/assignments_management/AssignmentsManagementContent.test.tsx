import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssignmentsManagementContent } from "@/presentation/components/modules/assignments_management/AssignmentsManagementContent";

const listAssignments = vi.fn();
const deleteAssignment = vi.fn();
const listSubmissions = vi.fn();
const gradeSubmission = vi.fn();
const listClassGroups = vi.fn();
const listSubjects = vi.fn();
const listAcademicYears = vi.fn();

vi.mock("@/infrastructure/api/resources/assignments", () => ({
  listAssignments: (...a: unknown[]) => listAssignments(...a),
  deleteAssignment: (...a: unknown[]) => deleteAssignment(...a),
  listSubmissions: (...a: unknown[]) => listSubmissions(...a),
  gradeSubmission: (...a: unknown[]) => gradeSubmission(...a),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listClassGroups: (...a: unknown[]) => listClassGroups(...a),
  listSubjects: (...a: unknown[]) => listSubjects(...a),
  listAcademicYears: (...a: unknown[]) => listAcademicYears(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      roles: ["ADMIN"],
      permissions: [],
      institution_id: 1,
    },
  }),
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const assignment = {
  id: 10,
  institution_id: 1,
  academic_year_id: 1,
  subject_id: 1,
  class_group_id: 2,
  title: "DM Fonctions",
  description: null,
  instructions: null,
  due_at: "2099-01-01T12:00:00Z",
  max_score: 20,
  status: "PUBLISHED",
  created_by: 1,
  submissions_count: 1,
  subject: { id: 1, name: "Maths" },
  class_group: { id: 2, name: "2nde A" },
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("AssignmentsManagementContent", () => {
  beforeEach(() => {
    listAssignments.mockReset();
    deleteAssignment.mockReset();
    listSubmissions.mockReset();
    gradeSubmission.mockReset();
    listClassGroups.mockReset();
    listSubjects.mockReset();
    listAcademicYears.mockReset();
    listAcademicYears.mockResolvedValue([]);
    listClassGroups.mockResolvedValue([{ id: 2, name: "2nde A" }]);
    listSubjects.mockResolvedValue([{ id: 1, name: "Maths", code: "MATH" }]);
  });

  it("lists assignments then grades a submission", async () => {
    const user = userEvent.setup();
    listAssignments.mockResolvedValue([assignment]);
    listSubmissions.mockResolvedValue([
      {
        id: 50,
        institution_id: 1,
        assignment_id: 10,
        student_id: 7,
        comment: null,
        score: null,
        feedback: null,
        status: "SUBMITTED",
        submitted_at: "2026-09-01T10:00:00Z",
        graded_at: null,
        graded_by: null,
        student: {
          id: 7,
          institution_id: 1,
          user_id: null,
          matricule: "EL-7",
          first_name: "Awa",
          last_name: "Koné",
          birth_date: null,
          gender: "F",
          email: null,
          phone: null,
        },
      },
    ]);
    gradeSubmission.mockResolvedValue({
      id: 50,
      institution_id: 1,
      assignment_id: 10,
      student_id: 7,
      comment: null,
      score: 16,
      feedback: "Bien",
      status: "GRADED",
      submitted_at: "2026-09-01T10:00:00Z",
      graded_at: "2026-09-02T10:00:00Z",
      graded_by: 1,
    });

    render(<AssignmentsManagementContent />);

    await waitFor(() => {
      expect(screen.getByTestId("assignments-admin-list")).toHaveTextContent("DM Fonctions");
    });

    await user.click(screen.getByRole("button", { name: /Voir rendus/i }));
    await waitFor(() => {
      expect(screen.getByTestId("submissions-list")).toHaveTextContent("Awa");
    });

    await user.type(screen.getByLabelText(/^Note$/i), "16");
    await user.type(screen.getByLabelText(/Feedback/i), "Bien");
    await user.click(screen.getByRole("button", { name: /^Noter$/i }));

    await waitFor(() => {
      expect(gradeSubmission).toHaveBeenCalledWith(50, {
        score: 16,
        feedback: "Bien",
      });
    });
  });

  it("shows empty state", async () => {
    listAssignments.mockResolvedValue([]);
    render(<AssignmentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("assignments-admin-empty")).toBeInTheDocument();
    });
  });

  it("shows error when list fails", async () => {
    listAssignments.mockRejectedValue(new Error("Devoirs KO"));
    render(<AssignmentsManagementContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Devoirs KO");
    });
  });
});
