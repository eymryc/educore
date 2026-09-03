import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentDashboardContent } from "@/presentation/components/modules/student_dashboard/StudentDashboardContent";

const fetchStudentDashboard = vi.fn();

vi.mock("@/infrastructure/api/resources/dashboard", () => ({
  fetchStudentDashboard: (...a: unknown[]) => fetchStudentDashboard(...a),
}));

vi.mock("@/infrastructure/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: 1, name: "Awa", roles: ["STUDENT"] } }),
  getAuthErrorMessage: (e: unknown) => (e instanceof Error ? e.message : "Erreur"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("StudentDashboardContent", () => {
  beforeEach(() => {
    fetchStudentDashboard.mockReset();
  });

  it("shows KPIs from the student dashboard API", async () => {
    fetchStudentDashboard.mockResolvedValue({
      linked: true,
      student_id: 7,
      average_grade: 12.5,
      attendance_rate: 95,
      assignments_pending: 2,
      assignments_due_soon: 1,
      unpaid_invoices: 0,
    });

    render(<StudentDashboardContent />);

    await waitFor(() => {
      expect(screen.getByTestId("kpi-average")).toHaveTextContent("12,5");
    });
    expect(screen.getByTestId("kpi-pending")).toHaveTextContent("2");
  });

  it("shows unlinked state", async () => {
    fetchStudentDashboard.mockResolvedValue({
      linked: false,
      average_grade: null,
      attendance_rate: null,
      assignments_pending: 0,
      assignments_due_soon: 0,
    });

    render(<StudentDashboardContent />);

    await waitFor(() => {
      expect(screen.getByTestId("student-dash-unlinked")).toBeInTheDocument();
    });
  });

  it("shows error", async () => {
    fetchStudentDashboard.mockRejectedValue(new Error("KO"));
    render(<StudentDashboardContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("KO");
    });
  });
});
