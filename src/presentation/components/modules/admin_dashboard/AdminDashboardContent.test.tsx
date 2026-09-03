import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboardContent } from "@/presentation/components/modules/admin_dashboard/AdminDashboardContent";

const fetchAdminDashboard = vi.fn();
const fetchTeacherDashboard = vi.fn();
const authState = {
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
};

vi.mock("@/infrastructure/api/resources/dashboard", () => ({
  fetchAdminDashboard: (...args: unknown[]) => fetchAdminDashboard(...args),
  fetchTeacherDashboard: (...args: unknown[]) => fetchTeacherDashboard(...args),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => authState,
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

const adminPayload = {
  students_count: 245,
  students_active: 240,
  teachers_count: 18,
  staff_count: 12,
  guardians_count: 190,
  classes_count: 24,
  subjects_count: 16,
  enrollments_active: 40,
  invoices_unpaid: 7,
  invoices_unpaid_amount: 350000,
  payments_this_month: 1500000,
  attendance_today: { present: 90, absent: 10, late: 0, justified: 0 },
  attendance_rate: 90,
  discipline_open_count: 2,
  library_loans_active: 15,
  library_loans_overdue: 3,
  assignments_due_soon: 8,
  announcements_published_month: 4,
};

describe("AdminDashboardContent", () => {
  beforeEach(() => {
    fetchAdminDashboard.mockReset();
    fetchTeacherDashboard.mockReset();
    authState.user.roles = ["ADMIN"];
  });

  it("shows loading then KPI values from the API", async () => {
    fetchAdminDashboard.mockResolvedValue(adminPayload);

    render(<AdminDashboardContent />);

    expect(screen.getByTestId("admin-dashboard-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("kpi-students")).toHaveTextContent("245");
    });

    expect(screen.getByTestId("kpi-enrollments")).toHaveTextContent("40");
    expect(screen.getByTestId("kpi-attendance")).toHaveTextContent("90");
    expect(screen.getByTestId("kpi-teachers")).toHaveTextContent("18");
    expect(screen.getByTestId("kpi-invoices-unpaid")).toHaveTextContent("7");
    expect(screen.getByTestId("kpi-classes")).toHaveTextContent("24");
    expect(screen.getByTestId("kpi-guardians")).toHaveTextContent("190");
    expect(screen.getByTestId("attendance-breakdown")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-alerts")).toBeInTheDocument();
  });

  it("shows an error state when the API fails", async () => {
    fetchAdminDashboard.mockRejectedValue(new Error("Réseau indisponible"));

    render(<AdminDashboardContent />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Réseau indisponible");
    });
  });

  it("shows empty attendance message when no records today", async () => {
    fetchAdminDashboard.mockResolvedValue({
      ...adminPayload,
      students_count: 0,
      students_active: 0,
      teachers_count: 0,
      staff_count: 0,
      guardians_count: 0,
      classes_count: 0,
      subjects_count: 0,
      enrollments_active: 0,
      invoices_unpaid: 0,
      invoices_unpaid_amount: 0,
      payments_this_month: 0,
      attendance_today: { present: 0, absent: 0, late: 0, justified: 0 },
      attendance_rate: null,
      discipline_open_count: 0,
      library_loans_active: 0,
      library_loans_overdue: 0,
      assignments_due_soon: 0,
      announcements_published_month: 0,
    });

    render(<AdminDashboardContent />);

    await waitFor(() => {
      expect(screen.getByTestId("attendance-empty")).toBeInTheDocument();
    });
  });

  it("loads teacher dashboard KPIs for teacher-only users", async () => {
    authState.user.roles = ["TEACHER"];
    fetchTeacherDashboard.mockResolvedValue({
      classes_count: 3,
      students_count: 90,
      assignments_count: 12,
      assignments_due_soon: 2,
      submissions_pending_grading: 5,
      attendance_to_record_today: 1,
    });

    render(<AdminDashboardContent />);

    await waitFor(() => {
      expect(screen.getByTestId("kpi-teacher-classes")).toHaveTextContent("3");
    });
    expect(fetchTeacherDashboard).toHaveBeenCalled();
    expect(fetchAdminDashboard).not.toHaveBeenCalled();
    expect(screen.getByTestId("kpi-teacher-pending")).toHaveTextContent("5");
    expect(screen.getByTestId("teacher-priorities")).toBeInTheDocument();
  });
});
