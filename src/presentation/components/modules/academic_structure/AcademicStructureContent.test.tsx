import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicStructureContent } from "@/presentation/components/modules/academic_structure/AcademicStructureContent";

const listAcademicYears = vi.fn();
const listAcademicPeriods = vi.fn();
const listAcademicHolidays = vi.fn();
const listLevels = vi.fn();
const listSeries = vi.fn();
const listClassSubjects = vi.fn();

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
  listAcademicPeriods: (...args: unknown[]) => listAcademicPeriods(...args),
  listAcademicHolidays: (...args: unknown[]) => listAcademicHolidays(...args),
  listLevels: (...args: unknown[]) => listLevels(...args),
  listSeries: (...args: unknown[]) => listSeries(...args),
  listClassSubjects: (...args: unknown[]) => listClassSubjects(...args),
  activateAcademicYear: vi.fn(),
  closeAcademicYear: vi.fn(),
  deleteAcademicYear: vi.fn(),
  deleteAcademicPeriod: vi.fn(),
  deleteAcademicHoliday: vi.fn(),
  deleteLevel: vi.fn(),
  deleteSeries: vi.fn(),
  deleteClassSubject: vi.fn(),
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
describe("AcademicStructureContent", () => {
  beforeEach(() => {
    listAcademicYears.mockReset();
    listAcademicPeriods.mockReset();
    listAcademicHolidays.mockReset();
    listLevels.mockReset();
    listSeries.mockReset();
    listClassSubjects.mockReset();
  });

  it("shows loading then years from the API", async () => {
    listAcademicYears.mockResolvedValue([
      { id: 1, name: "2025-2026", is_active: true, start_date: "2025-09-01", end_date: "2026-06-30" },
    ]);
    listAcademicPeriods.mockResolvedValue([]);
    listAcademicHolidays.mockResolvedValue([]);
    listLevels.mockResolvedValue([]);
    listSeries.mockResolvedValue([]);
    listClassSubjects.mockResolvedValue([]);

    render(<AcademicStructureContent />);

    expect(screen.getByTestId("academic-structure-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("academic-years-table")).toHaveTextContent("2025-2026");
    });
  });

  it("shows an error when loading fails", async () => {
    listAcademicYears.mockRejectedValue(new Error("API down"));
    listAcademicPeriods.mockResolvedValue([]);
    listAcademicHolidays.mockResolvedValue([]);
    listLevels.mockResolvedValue([]);
    listSeries.mockResolvedValue([]);
    listClassSubjects.mockResolvedValue([]);

    render(<AcademicStructureContent />);

    await waitFor(() => {
      expect(screen.getByTestId("academic-structure-error")).toHaveTextContent("API down");
    });
  });
});
