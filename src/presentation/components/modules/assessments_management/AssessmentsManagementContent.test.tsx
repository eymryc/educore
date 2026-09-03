import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentsManagementContent } from "@/presentation/components/modules/assessments_management/AssessmentsManagementContent";

const listAssessments = vi.fn();
const deleteAssessment = vi.fn();
const listClassGroups = vi.fn();
const listSubjects = vi.fn();
const listAcademicPeriods = vi.fn();
const listAcademicYears = vi.fn();

vi.mock("@/infrastructure/api/resources/assessments", () => ({
  listAssessments: (...args: unknown[]) => listAssessments(...args),
  deleteAssessment: (...args: unknown[]) => deleteAssessment(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listClassGroups: (...args: unknown[]) => listClassGroups(...args),
  listSubjects: (...args: unknown[]) => listSubjects(...args),
  listAcademicPeriods: (...args: unknown[]) => listAcademicPeriods(...args),
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
describe("AssessmentsManagementContent", () => {
  beforeEach(() => {
    listAssessments.mockReset();
    deleteAssessment.mockReset();
    listClassGroups.mockReset();
    listSubjects.mockReset();
    listAcademicPeriods.mockReset();
    listAcademicYears.mockReset();
    listClassGroups.mockResolvedValue([{ id: 2, name: "2nde A" }]);
    listSubjects.mockResolvedValue([{ id: 1, name: "Mathématiques", code: "MATH" }]);
    listAcademicPeriods.mockResolvedValue([{ id: 1, name: "Trimestre 1" }]);
    listAcademicYears.mockResolvedValue([]);
  });

  it("shows loading then assessments", async () => {
    listAssessments.mockResolvedValue([
      {
        id: 5,
        institution_id: 1,
        academic_year_id: 1,
        academic_period_id: 1,
        subject_id: 1,
        class_group_id: 2,
        title: "Devoir algèbre",
        type: "devoir",
        date: "2026-09-02",
        coefficient: 1,
        max_score: 20,
        created_by: 1,
        subject: { id: 1, name: "Mathématiques" },
        class_group: { id: 2, name: "2nde A" },
      },
    ]);

    render(<AssessmentsManagementContent />);
    expect(screen.getByTestId("assessments-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("assessments-table")).toBeInTheDocument();
    });
    await waitFor(() => expect(screen.getByText("Devoir algèbre")).toBeInTheDocument());
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Actions pour Devoir algèbre/i }));
    expect(screen.getByRole("menuitem", { name: "Notes" })).toHaveAttribute(
      "href",
      "/grades?assessment_id=5"
    );
  });

  it("filters by search", async () => {
    const user = userEvent.setup();
    listAssessments.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        academic_year_id: 1,
        academic_period_id: 1,
        subject_id: 1,
        class_group_id: 2,
        title: "Devoir algèbre",
        type: "devoir",
        date: "2026-09-01",
        coefficient: 1,
        max_score: 20,
        created_by: 1,
        subject: { id: 1, name: "Mathématiques" },
        class_group: { id: 2, name: "2nde A" },
      },
      {
        id: 2,
        institution_id: 1,
        academic_year_id: 1,
        academic_period_id: 1,
        subject_id: 2,
        class_group_id: 2,
        title: "TP optique",
        type: "tp",
        date: "2026-09-02",
        coefficient: 1,
        max_score: 20,
        created_by: 1,
        subject: { id: 2, name: "Physique" },
        class_group: { id: 2, name: "2nde A" },
      },
    ]);

    render(<AssessmentsManagementContent />);
    await waitFor(() => expect(screen.getByText("Devoir algèbre")).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/Rechercher/i), "optique");
    expect(screen.queryByText("Devoir algèbre")).not.toBeInTheDocument();
    expect(screen.getByText("TP optique")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    listAssessments.mockResolvedValue([]);
    render(<AssessmentsManagementContent />);
    await waitFor(() => expect(screen.getByTestId("assessments-empty")).toBeInTheDocument());
  });
});
