import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicResultsContent } from "@/presentation/components/modules/academic_results/AcademicResultsContent";

const fetchStudentDashboard = vi.fn();
const fetchParentDashboard = vi.fn();
const listGrades = vi.fn();

vi.mock("@/infrastructure/api/resources/dashboard", () => ({
  fetchStudentDashboard: (...args: unknown[]) => fetchStudentDashboard(...args),
  fetchParentDashboard: (...args: unknown[]) => fetchParentDashboard(...args),
}));

vi.mock("@/infrastructure/api/resources/grades", () => ({
  listGrades: (...args: unknown[]) => listGrades(...args),
}));

let currentUser: { id: number; roles: string[] } = { id: 1, roles: ["STUDENT"] };

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({ user: currentUser }),
  getAuthErrorMessage: (err: unknown) => (err instanceof Error ? err.message : "Erreur"),
}));

const grade = (id: number, studentId: number) => ({
  id,
  institution_id: 1,
  assessment_id: 1,
  student_id: studentId,
  score: 15,
  comment: null,
  validated_at: "2026-09-01T00:00:00Z",
  validated_by: 1,
  recorded_by: 1,
  assessment: {
    id: 1,
    title: "Devoir 1",
    max_score: 20,
    subject: { id: 1, name: "Mathématiques" },
  },
  student: { id: studentId, first_name: "Awa", last_name: "Koné" },
});

describe("AcademicResultsContent", () => {
  beforeEach(() => {
    fetchStudentDashboard.mockReset();
    fetchParentDashboard.mockReset();
    listGrades.mockReset();
    currentUser = { id: 1, roles: ["STUDENT"] };
  });

  it("shows the student's own grades", async () => {
    fetchStudentDashboard.mockResolvedValue({ linked: true, student_id: 7 });
    listGrades.mockResolvedValue([grade(1, 7)]);

    render(<AcademicResultsContent />);

    await waitFor(() => expect(screen.getByTestId("grades-list")).toBeInTheDocument());
    expect(listGrades).toHaveBeenCalledWith({ student_id: 7 });
  });

  it("auto-selects the only child for a parent with a single child", async () => {
    currentUser = { id: 2, roles: ["PARENT"] };
    fetchParentDashboard.mockResolvedValue({
      linked: true,
      children_count: 1,
      children: [{ id: 9, full_name: "Fatou Bamba", class: "6ème A", average_grade: 14, attendance_rate: 98, unpaid_invoices: 0 }],
    });
    listGrades.mockResolvedValue([grade(1, 9)]);

    render(<AcademicResultsContent />);

    await waitFor(() => expect(listGrades).toHaveBeenCalledWith({ student_id: "9" }));
    expect(await screen.findByTestId("grades-list")).toBeInTheDocument();
  });

  it("lets a parent with several children switch between them", async () => {
    const user = userEvent.setup();
    currentUser = { id: 2, roles: ["PARENT"] };
    fetchParentDashboard.mockResolvedValue({
      linked: true,
      children_count: 2,
      children: [
        { id: 9, full_name: "Fatou Bamba", class: "6ème A", average_grade: 14, attendance_rate: 98, unpaid_invoices: 0 },
        { id: 10, full_name: "Aya Bamba", class: "5ème B", average_grade: 12, attendance_rate: 95, unpaid_invoices: 1 },
      ],
    });
    listGrades.mockResolvedValueOnce([grade(1, 9)]).mockResolvedValueOnce([grade(2, 10)]);

    render(<AcademicResultsContent />);

    await waitFor(() => expect(listGrades).toHaveBeenCalledWith({ student_id: "9" }));

    await user.click(screen.getByLabelText("Enfant"));
    await user.click(await screen.findByRole("option", { name: "Aya Bamba" }));

    await waitFor(() => expect(listGrades).toHaveBeenCalledWith({ student_id: "10" }));
  });

  it("never fetches the whole school's grades for a non-student, non-parent role", async () => {
    currentUser = { id: 3, roles: ["ADMIN"] };

    render(<AcademicResultsContent />);

    await waitFor(() => expect(screen.getByTestId("grades-empty")).toBeInTheDocument());
    expect(listGrades).not.toHaveBeenCalled();
  });

  it("shows error state", async () => {
    fetchStudentDashboard.mockRejectedValue(new Error("Notes indisponibles"));

    render(<AcademicResultsContent />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Notes indisponibles");
    });
  });
});
