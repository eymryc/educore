import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeaveAbsencesContent } from "@/presentation/components/modules/gestion_des_cong_s_absences/LeaveAbsencesContent";

const listStaffLeaves = vi.fn();
const listStaffAttendance = vi.fn();
const approveStaffLeave = vi.fn();
const rejectStaffLeave = vi.fn();
const deleteStaffLeave = vi.fn();
const deleteStaffAttendance = vi.fn();

vi.mock("@/infrastructure/api/resources/hr", () => ({
  listStaffLeaves: (...a: unknown[]) => listStaffLeaves(...a),
  listStaffAttendance: (...a: unknown[]) => listStaffAttendance(...a),
  approveStaffLeave: (...a: unknown[]) => approveStaffLeave(...a),
  rejectStaffLeave: (...a: unknown[]) => rejectStaffLeave(...a),
  deleteStaffLeave: (...a: unknown[]) => deleteStaffLeave(...a),
  deleteStaffAttendance: (...a: unknown[]) => deleteStaffAttendance(...a),
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
    },
  }),
  getAuthErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Erreur",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("LeaveAbsencesContent", () => {
  beforeEach(() => {
    listStaffLeaves.mockReset();
    listStaffAttendance.mockReset();
    approveStaffLeave.mockReset();
    rejectStaffLeave.mockReset();
    listStaffLeaves.mockResolvedValue([
      {
        id: 7,
        institution_id: 1,
        staff_member_id: 2,
        leave_type: "annuel",
        start_date: "2026-09-10",
        end_date: "2026-09-12",
        reason: null,
        status: "pending",
        approved_by: null,
        approved_at: null,
        duration_days: 3,
        staff_member: { id: 2, first_name: "Awa", last_name: "Koné" },
      },
    ]);
    listStaffAttendance.mockResolvedValue([
      {
        id: 3,
        institution_id: 1,
        staff_member_id: 2,
        attendance_date: "2026-09-01",
        status: "present",
        notes: null,
        recorded_by: 1,
        staff_member: { id: 2, first_name: "Awa", last_name: "Koné" },
      },
    ]);
    approveStaffLeave.mockResolvedValue({
      id: 7,
      institution_id: 1,
      staff_member_id: 2,
      leave_type: "annuel",
      start_date: "2026-09-10",
      end_date: "2026-09-12",
      reason: null,
      status: "approved",
      approved_by: 1,
      approved_at: "2026-09-02",
      staff_member: { id: 2, first_name: "Awa", last_name: "Koné" },
    });
  });

  it("approves a pending leave", async () => {
    const user = userEvent.setup();
    render(<LeaveAbsencesContent />);
    await screen.findByText("Awa Koné");
    await user.click(screen.getByRole("button", { name: /Actions pour Awa Koné/i }));
    await user.click(screen.getByRole("menuitem", { name: "Approuver" }));
    await waitFor(() => expect(approveStaffLeave).toHaveBeenCalledWith(7));
    expect(await screen.findByText(/Congé de Awa Koné approuvé/i)).toBeInTheDocument();
  });

  it("lists leaves and attendance", async () => {
    const user = userEvent.setup();
    render(<LeaveAbsencesContent />);
    await waitFor(() => expect(screen.getByText("Awa Koné")).toBeInTheDocument());
    expect(listStaffAttendance).toHaveBeenCalled();
    await user.click(screen.getByRole("tab", { name: /Présences/i }));
    expect(await screen.findByTestId("attendance-table")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Nouvelle présence/i })).toHaveAttribute(
      "href",
      "/crud/staff-attendance/nouveau"
    );
  });
});
