import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GradesEntryContent } from "@/presentation/components/modules/grades_entry/GradesEntryContent";

const listClassGroups = vi.fn();
const listAcademicYears = vi.fn();
const listAssessments = vi.fn();
const listStudents = vi.fn();
const listGrades = vi.fn();
const createGrade = vi.fn();
const updateGrade = vi.fn();
const validateGrade = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listClassGroups: (...args: unknown[]) => listClassGroups(...args),
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
}));

vi.mock("@/infrastructure/api/resources/assessments", () => ({
  listAssessments: (...args: unknown[]) => listAssessments(...args),
}));

vi.mock("@/infrastructure/api/resources/students", () => ({
  listStudents: (...args: unknown[]) => listStudents(...args),
}));

vi.mock("@/infrastructure/api/resources/grades", () => ({
  listGrades: (...args: unknown[]) => listGrades(...args),
  createGrade: (...args: unknown[]) => createGrade(...args),
  updateGrade: (...args: unknown[]) => updateGrade(...args),
  validateGrade: (...args: unknown[]) => validateGrade(...args),
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

const assessment = {
  id: 5,
  institution_id: 1,
  academic_year_id: 1,
  academic_period_id: 1,
  subject_id: 1,
  class_group_id: 2,
  title: "Devoir algèbre",
  type: "devoir" as const,
  date: "2026-09-02",
  coefficient: 1,
  max_score: 20,
  created_by: 1,
};

const student = {
  id: 7,
  institution_id: 1,
  user_id: null,
  matricule: "EL-007",
  first_name: "Awa",
  last_name: "Koné",
  birth_date: "2010-01-01",
  gender: "F" as const,
  email: null,
  phone: null,
  address: null,
  level_id: 1,
  class_group_id: 2,
  status: "active" as const,
  enrolled_at: null,
  avatar_url: null,
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("GradesEntryContent", () => {
  beforeEach(() => {
    listClassGroups.mockReset();
    listAcademicYears.mockReset();
    listAcademicYears.mockResolvedValue([]);
    listAssessments.mockReset();
    listStudents.mockReset();
    listGrades.mockReset();
    createGrade.mockReset();
    updateGrade.mockReset();
    validateGrade.mockReset();

    listClassGroups.mockResolvedValue([
      {
        id: 2,
        institution_id: 1,
        academic_year_id: 1,
        level_id: 1,
        series_id: null,
        name: "2nde A",
        max_capacity: 40,
        head_teacher_id: null,
        room_id: null,
      },
    ]);
    listAssessments.mockResolvedValue([assessment]);
    listStudents.mockResolvedValue([student]);
    listGrades.mockResolvedValue([]);
  });

  it("shows empty until assessment selected then roster", async () => {
    const user = userEvent.setup();
    render(<GradesEntryContent />);

    await waitFor(() => expect(screen.getByTestId("grades-empty")).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText("Évaluation"), "5");
    await waitFor(() => expect(screen.getByTestId("grades-table")).toBeInTheDocument());
    expect(screen.getByText("Koné Awa")).toBeInTheDocument();
  });

  it("creates a grade and validates it", async () => {
    const user = userEvent.setup();
    createGrade.mockResolvedValue({
      id: 11,
      institution_id: 1,
      assessment_id: 5,
      student_id: 7,
      score: 15,
      comment: null,
      validated_at: null,
      validated_by: null,
      recorded_by: 1,
    });
    validateGrade.mockResolvedValue({
      id: 11,
      institution_id: 1,
      assessment_id: 5,
      student_id: 7,
      score: 15,
      comment: null,
      validated_at: "2026-09-02T12:00:00Z",
      validated_by: 1,
      recorded_by: 1,
    });

    render(<GradesEntryContent />);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Devoir algèbre/i })).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByLabelText("Évaluation"), "5");
    await waitFor(() => expect(screen.getByText("Koné Awa")).toBeInTheDocument());

    await user.clear(screen.getByLabelText("Note de Koné Awa"));
    await user.type(screen.getByLabelText("Note de Koné Awa"), "15");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(createGrade).toHaveBeenCalledWith(
        expect.objectContaining({
          assessment_id: 5,
          student_id: 7,
          score: 15,
        })
      );
    });

    await user.click(screen.getByRole("button", { name: "Valider" }));
    await waitFor(() => expect(validateGrade).toHaveBeenCalledWith(11));
    expect(screen.getByText("Validée")).toBeInTheDocument();
  });
});
