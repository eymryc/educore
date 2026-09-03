import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnrollmentManagementContent } from "@/presentation/components/modules/enrollment_management/EnrollmentManagementContent";

const listEnrollments = vi.fn();
const listReEnrollments = vi.fn();
const completeReEnrollment = vi.fn();
const reviewEnrollment = vi.fn();
const approveEnrollment = vi.fn();
const markEnrollmentPayment = vi.fn();
const enrollEnrollment = vi.fn();
const assignEnrollmentClass = vi.fn();
const rejectEnrollment = vi.fn();
const uploadEnrollmentDocument = vi.fn();
const deleteEnrollment = vi.fn();
const listAcademicYears = vi.fn();
const listLevels = vi.fn();
const listClassGroups = vi.fn();

vi.mock("@/infrastructure/api/resources/enrollments", () => ({
  listEnrollments: (...args: unknown[]) => listEnrollments(...args),
  listReEnrollments: (...args: unknown[]) => listReEnrollments(...args),
  completeReEnrollment: (...args: unknown[]) => completeReEnrollment(...args),
  reviewEnrollment: (...args: unknown[]) => reviewEnrollment(...args),
  approveEnrollment: (...args: unknown[]) => approveEnrollment(...args),
  markEnrollmentPayment: (...args: unknown[]) => markEnrollmentPayment(...args),
  enrollEnrollment: (...args: unknown[]) => enrollEnrollment(...args),
  assignEnrollmentClass: (...args: unknown[]) => assignEnrollmentClass(...args),
  rejectEnrollment: (...args: unknown[]) => rejectEnrollment(...args),
  uploadEnrollmentDocument: (...args: unknown[]) => uploadEnrollmentDocument(...args),
  deleteEnrollment: (...args: unknown[]) => deleteEnrollment(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
  listLevels: (...args: unknown[]) => listLevels(...args),
  listClassGroups: (...args: unknown[]) => listClassGroups(...args),
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

const baseRow = {
  id: 11,
  institution_id: 1,
  student_id: null,
  academic_year_id: 1,
  level_id: 1,
  class_group_id: null,
  first_name: "Awa",
  last_name: "Koné",
  birth_date: null,
  gender: "F" as const,
  parent_contact: "0700000000",
  application_date: "2026-09-01",
  status: "APPLICATION" as const,
  observations: "Dossier complet",
  reviewed_at: null,
  approved_at: null,
  payment_at: null,
  enrolled_at: null,
  class_assigned_at: null,
  rejected_at: null,
  documents: [],
  level: { id: 1, name: "2nde" },
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("EnrollmentManagementContent", () => {
  beforeEach(() => {
    listEnrollments.mockReset();
    listReEnrollments.mockReset();
    completeReEnrollment.mockReset();
    reviewEnrollment.mockReset();
    approveEnrollment.mockReset();
    uploadEnrollmentDocument.mockReset();
    deleteEnrollment.mockReset();
    listAcademicYears.mockReset();
    listLevels.mockReset();
    listClassGroups.mockReset();
    listReEnrollments.mockResolvedValue([]);
    listAcademicYears.mockResolvedValue([{ id: 1, name: "2025-2026" }]);
    listLevels.mockResolvedValue([{ id: 1, name: "2nde" }]);
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
    listEnrollments.mockResolvedValue([]);
  });

  it("shows loading then empty", async () => {
    render(<EnrollmentManagementContent />);
    expect(screen.getByTestId("enrollment-loading")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("enrollment-empty")).toBeInTheDocument());
  });

  it("lists applications and advances to review", async () => {
    const user = userEvent.setup();
    listEnrollments.mockResolvedValue([baseRow]);
    reviewEnrollment.mockResolvedValue({ ...baseRow, status: "REVIEW" });

    render(<EnrollmentManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné Awa")).toBeInTheDocument());
    expect(screen.getByTestId("enrollment-table")).toBeInTheDocument();
    expect(screen.getByTestId("enrollment-pipeline")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actions pour Koné Awa/i }));
    await user.click(screen.getByRole("menuitem", { name: "Mettre en examen" }));
    await waitFor(() => expect(reviewEnrollment).toHaveBeenCalledWith(11));
    expect(screen.getByText("Examen")).toBeInTheDocument();
  });

  it("uploads a document from details panel", async () => {
    const user = userEvent.setup();
    listEnrollments.mockResolvedValue([baseRow]);
    uploadEnrollmentDocument.mockResolvedValue({
      id: 9,
      name: "acte",
      file_name: "acte.pdf",
      mime_type: "application/pdf",
      size: 12,
      url: "/media/9",
    });

    const { container } = render(<EnrollmentManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné Awa")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Actions pour Koné Awa/i }));
    await user.click(screen.getByRole("menuitem", { name: "Détails" }));
    expect(screen.getByText("Dossier complet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Joindre un document" }));
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["pdf"], "acte.pdf", { type: "application/pdf" });
    await user.upload(input, file);

    await waitFor(() => expect(uploadEnrollmentDocument).toHaveBeenCalledWith(11, file));
    expect(screen.getByText("acte.pdf")).toBeInTheDocument();
  });
});
