import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceManagementContent } from "@/presentation/components/modules/attendance_management/AttendanceManagementContent";

const listClassGroups = vi.fn();
const listAcademicYears = vi.fn();
const listStudents = vi.fn();
const listAttendance = vi.fn();
const createAttendance = vi.fn();
const updateAttendance = vi.fn();
const justifyAttendance = vi.fn();
const validateAttendance = vi.fn();

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listClassGroups: (...args: unknown[]) => listClassGroups(...args),
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
}));

vi.mock("@/infrastructure/api/resources/students", () => ({
  listStudents: (...args: unknown[]) => listStudents(...args),
}));

vi.mock("@/infrastructure/api/resources/attendance", () => ({
  listAttendance: (...args: unknown[]) => listAttendance(...args),
  createAttendance: (...args: unknown[]) => createAttendance(...args),
  updateAttendance: (...args: unknown[]) => updateAttendance(...args),
  justifyAttendance: (...args: unknown[]) => justifyAttendance(...args),
  validateAttendance: (...args: unknown[]) => validateAttendance(...args),
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

const classGroup = {
  id: 2,
  institution_id: 1,
  academic_year_id: 1,
  level_id: 1,
  series_id: null,
  name: "2nde A",
  max_capacity: 40,
  head_teacher_id: null,
  room_id: null,
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
describe("AttendanceManagementContent", () => {
  beforeEach(() => {
    listClassGroups.mockReset();
    listAcademicYears.mockReset();
    listAcademicYears.mockResolvedValue([]);
    listStudents.mockReset();
    listAttendance.mockReset();
    createAttendance.mockReset();
    updateAttendance.mockReset();
    justifyAttendance.mockReset();
    validateAttendance.mockReset();

    listClassGroups.mockResolvedValue([classGroup]);
    listStudents.mockResolvedValue([student]);
    listAttendance.mockResolvedValue([]);
  });

  it("shows loading then roster after class bootstrap", async () => {
    render(<AttendanceManagementContent />);
    expect(screen.getByTestId("attendance-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Koné Awa")).toBeInTheDocument();
    });

    expect(screen.getByTestId("attendance-table")).toBeInTheDocument();
    expect(listAttendance).toHaveBeenCalledWith(
      expect.objectContaining({ class_group_id: "2" })
    );
  });

  it("creates a presence when marking status", async () => {
    const user = userEvent.setup();
    createAttendance.mockResolvedValue({
      id: 11,
      institution_id: 1,
      student_id: 7,
      class_group_id: 2,
      academic_year_id: 1,
      date: "2026-09-02",
      status: "PRESENT",
      notes: null,
      justification: null,
      justified_at: null,
      justified_by: null,
      validated_at: null,
      validated_by: null,
      recorded_by: 1,
    });

    render(<AttendanceManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné Awa")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Présent" }));

    await waitFor(() => {
      expect(createAttendance).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 7,
          class_group_id: 2,
          academic_year_id: 1,
          status: "PRESENT",
        })
      );
    });

  });

  it("justifies and validates an existing absence", async () => {
    const user = userEvent.setup();
    const absent = {
      id: 11,
      institution_id: 1,
      student_id: 7,
      class_group_id: 2,
      academic_year_id: 1,
      date: "2026-09-02",
      status: "ABSENT" as const,
      notes: null,
      justification: null,
      justified_at: null,
      justified_by: null,
      validated_at: null,
      validated_by: null,
      recorded_by: 1,
    };
    listAttendance.mockResolvedValue([absent]);
    justifyAttendance.mockResolvedValue({
      ...absent,
      status: "JUSTIFIED",
      justification: "Certificat",
      justified_at: "2026-09-02T10:00:00Z",
    });
    validateAttendance.mockResolvedValue({
      ...absent,
      status: "JUSTIFIED",
      justification: "Certificat",
      validated_at: "2026-09-02T11:00:00Z",
      validated_by: 1,
    });

    vi.spyOn(window, "prompt").mockReturnValue("Certificat");

    render(<AttendanceManagementContent />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Justifier/i })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Justifier/i }));
    await waitFor(() => {
      expect(justifyAttendance).toHaveBeenCalledWith(11, "Certificat");
    });

    await user.click(screen.getByRole("button", { name: /Valider/i }));
    await waitFor(() => {
      expect(validateAttendance).toHaveBeenCalledWith(11);
    });
  });

  it("shows empty roster message when no students in class", async () => {
    listStudents.mockResolvedValue([
      { ...student, id: 99, class_group_id: 99, matricule: "X" },
    ]);

    render(<AttendanceManagementContent />);
    await waitFor(() => expect(screen.getByTestId("attendance-empty")).toBeInTheDocument());
  });
});
