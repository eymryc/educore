import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsAnalyticsContent } from "@/presentation/components/modules/reports_analytics/ReportsAnalyticsContent";

const listClassGroups = vi.fn();
const listAcademicYears = vi.fn();
const getReport = vi.fn();
const exportReport = vi.fn();

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listClassGroups: (...args: unknown[]) => listClassGroups(...args),
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
}));

vi.mock("@/infrastructure/api/resources/reports", () => ({
  getReport: (...args: unknown[]) => getReport(...args),
  exportReport: (...args: unknown[]) => exportReport(...args),
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

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
describe("ReportsAnalyticsContent", () => {
  beforeEach(() => {
    listClassGroups.mockReset();
    listAcademicYears.mockReset();
    listAcademicYears.mockResolvedValue([]);
    getReport.mockReset();
    exportReport.mockReset();
    listClassGroups.mockResolvedValue([{ id: 3, name: "6ème A" }]);
  });

  it("generates a report and shows summary + rows", async () => {
    getReport.mockResolvedValue({
      type: "academic",
      summary: { assessments_count: 4, grades_count: 40, average_score: 12.5 },
      rows: [
        {
          student: "Awa Koné",
          class: "6ème A",
          subject: "Maths",
          score: 14,
          validated: true,
        },
      ],
      by_subject: [{ subject: "Maths", average_score: 14 }],
    });

    const user = userEvent.setup();
    render(<ReportsAnalyticsContent />);

    expect(screen.getByTestId("reports-empty")).toBeInTheDocument();
    expect(screen.getByTestId("reports-filters")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^générer$/i }));

    await waitFor(() => {
      expect(getReport).toHaveBeenCalledWith("academic", {});
      expect(screen.getByTestId("reports-summary")).toBeInTheDocument();
    });
    expect(screen.getByTestId("report-kpi-grades_count")).toHaveTextContent("40");
    expect(screen.getByTestId("reports-rows")).toHaveTextContent("Awa Koné");
    expect(screen.getByTestId("reports-breakdown")).toHaveTextContent("Maths");
  });

  it("exports CSV with current filters", async () => {
    getReport.mockResolvedValue({ type: "students", summary: {}, rows: [] });
    exportReport.mockResolvedValue(undefined);
    listClassGroups.mockResolvedValue([{ id: 3, name: "6ème A" }]);

    const user = userEvent.setup();
    render(<ReportsAnalyticsContent />);

    await user.click(screen.getByLabelText(/type de rapport/i));
    await user.click(await screen.findByRole("option", { name: /^Élèves$/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/filtrer par classe/i)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(/filtrer par classe/i));
    await user.click(await screen.findByRole("option", { name: /6ème A/i }));
    await user.click(screen.getByRole("button", { name: /^csv$/i }));

    await waitFor(() => {
      expect(exportReport).toHaveBeenCalledWith("students", "csv", {
        class_group_id: "3",
      });
    });
  });

  it("shows error state", async () => {
    getReport.mockRejectedValue(new Error("Rapport KO"));
    const user = userEvent.setup();
    render(<ReportsAnalyticsContent />);
    await user.click(screen.getByRole("button", { name: /^générer$/i }));
    await waitFor(() => {
      expect(screen.getByTestId("reports-error")).toHaveTextContent("Rapport KO");
    });
  });
});
