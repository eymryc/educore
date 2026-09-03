import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DisciplineManagementContent } from "@/presentation/components/modules/discipline_management/DisciplineManagementContent";

const listDisciplineRecords = vi.fn();
const validateDisciplineRecord = vi.fn();
const cancelDisciplineRecord = vi.fn();
const deleteDisciplineRecord = vi.fn();
const listAcademicYears = vi.fn();
const listClassGroups = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/infrastructure/api/resources/discipline", () => ({
  listDisciplineRecords: (...args: unknown[]) => listDisciplineRecords(...args),
  validateDisciplineRecord: (...args: unknown[]) => validateDisciplineRecord(...args),
  cancelDisciplineRecord: (...args: unknown[]) => cancelDisciplineRecord(...args),
  deleteDisciplineRecord: (...args: unknown[]) => deleteDisciplineRecord(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
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
describe("DisciplineManagementContent", () => {
  beforeEach(() => {
    listDisciplineRecords.mockReset();
    validateDisciplineRecord.mockReset();
    cancelDisciplineRecord.mockReset();
    deleteDisciplineRecord.mockReset();
    listAcademicYears.mockReset();
    listClassGroups.mockReset();
    listAcademicYears.mockResolvedValue([{ id: 1, name: "2025-2026" }]);
    listClassGroups.mockResolvedValue([{ id: 2, name: "2nde A" }]);
    listDisciplineRecords.mockResolvedValue([]);
  });

  it("shows loading then empty", async () => {
    render(<DisciplineManagementContent />);
    expect(screen.getByTestId("discipline-loading")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("discipline-empty")).toBeInTheDocument());
  });

  it("lists records, links to student dossier, and validates", async () => {
    const user = userEvent.setup();
    const row = {
      id: 11,
      institution_id: 1,
      student_id: 7,
      academic_year_id: 1,
      class_group_id: 2,
      type: "WARNING" as const,
      title: "Avertissement oral",
      description: null,
      occurred_at: "2026-09-02",
      location: null,
      sanction_type: null,
      exclusion_start: null,
      exclusion_end: null,
      council_date: null,
      council_decision: null,
      status: "RECORDED" as const,
      validated_at: null,
      validated_by: null,
      recorded_by: 1,
      student,
    };
    listDisciplineRecords.mockResolvedValue([row]);
    validateDisciplineRecord.mockResolvedValue({
      ...row,
      status: "VALIDATED",
      validated_at: "2026-09-02T12:00:00Z",
      validated_by: 1,
    });

    render(<DisciplineManagementContent />);
    await waitFor(() => expect(screen.getByText("Avertissement oral")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Koné Awa" })).toHaveAttribute("href", "/students/7");

    await user.click(screen.getByRole("button", { name: /Actions pour Avertissement oral/i }));
    await user.click(screen.getByRole("menuitem", { name: "Valider" }));
    await waitFor(() => expect(validateDisciplineRecord).toHaveBeenCalledWith(11));
  });
});
