import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportCardsManagementContent } from "@/presentation/components/modules/report_cards_management/ReportCardsManagementContent";

const listReportCards = vi.fn();
const generateReportCard = vi.fn();
const publishReportCard = vi.fn();
const downloadReportCardPdf = vi.fn();
const deleteReportCard = vi.fn();
const createReportCard = vi.fn();
const listClassGroups = vi.fn();
const listAcademicPeriods = vi.fn();
const listAcademicYears = vi.fn();
const listStudents = vi.fn();

vi.mock("@/infrastructure/api/resources/report-cards", () => ({
  listReportCards: (...args: unknown[]) => listReportCards(...args),
  generateReportCard: (...args: unknown[]) => generateReportCard(...args),
  publishReportCard: (...args: unknown[]) => publishReportCard(...args),
  downloadReportCardPdf: (...args: unknown[]) => downloadReportCardPdf(...args),
  deleteReportCard: (...args: unknown[]) => deleteReportCard(...args),
  createReportCard: (...args: unknown[]) => createReportCard(...args),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listClassGroups: (...args: unknown[]) => listClassGroups(...args),
  listAcademicPeriods: (...args: unknown[]) => listAcademicPeriods(...args),
  listAcademicYears: (...args: unknown[]) => listAcademicYears(...args),
}));

vi.mock("@/infrastructure/api/resources/students", () => ({
  listStudents: (...args: unknown[]) => listStudents(...args),
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

function paginated<T>(data: T[]) {
  return { data, meta: { current_page: 1, per_page: 1000, total: data.length, last_page: 1 } };
}

describe("ReportCardsManagementContent", () => {
  beforeEach(() => {
    listReportCards.mockReset();
    generateReportCard.mockReset();
    publishReportCard.mockReset();
    downloadReportCardPdf.mockReset();
    deleteReportCard.mockReset();
    createReportCard.mockReset();
    listClassGroups.mockReset();
    listAcademicPeriods.mockReset();
    listAcademicYears.mockReset();
    listAcademicYears.mockResolvedValue([]);
    listStudents.mockReset();

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
    listAcademicPeriods.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        academic_year_id: 1,
        name: "Trimestre 1",
        type: null,
        start_date: null,
        end_date: null,
        sort_order: 1,
        status: "open",
      },
    ]);
    listStudents.mockResolvedValue([student]);
    listReportCards.mockResolvedValue(paginated([]));
  });

  it("shows loading then empty state", async () => {
    render(<ReportCardsManagementContent />);
    expect(screen.getByTestId("report-cards-loading")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("report-cards-empty")).toBeInTheDocument());
  });

  it("lists cards and generates then publishes", async () => {
    const user = userEvent.setup();
    const draft = {
      id: 11,
      institution_id: 1,
      student_id: 7,
      academic_period_id: 1,
      appreciation: null,
      status: "draft" as const,
      generated_at: null,
      published_at: null,
      published_by: null,
      created_by: 1,
      student,
      academic_period: {
        id: 1,
        institution_id: 1,
        academic_year_id: 1,
        name: "Trimestre 1",
        type: null,
        start_date: null,
        end_date: null,
        sort_order: 1,
        status: "open",
      },
      bulletin: null,
    };
    listReportCards.mockResolvedValue(paginated([draft]));
    generateReportCard.mockResolvedValue({
      ...draft,
      status: "generated",
      generated_at: "2026-09-02T10:00:00Z",
      bulletin: { id: 1, file_name: "bulletin.pdf", url: "/media/1" },
    });
    publishReportCard.mockResolvedValue({
      ...draft,
      status: "published",
      generated_at: "2026-09-02T10:00:00Z",
      published_at: "2026-09-02T11:00:00Z",
      bulletin: { id: 1, file_name: "bulletin.pdf", url: "/media/1" },
    });

    render(<ReportCardsManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné Awa")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Actions pour Koné Awa/i }));
    await user.click(screen.getByRole("menuitem", { name: "Générer" }));
    await waitFor(() => expect(generateReportCard).toHaveBeenCalledWith(11));

    await user.click(screen.getByRole("button", { name: /Actions pour Koné Awa/i }));
    await user.click(screen.getByRole("menuitem", { name: "Publier" }));
    await waitFor(() => expect(publishReportCard).toHaveBeenCalledWith(11));
  });

  it("downloads PDF when available", async () => {
    const user = userEvent.setup();
    listReportCards.mockResolvedValue(
      paginated([
        {
          id: 11,
          institution_id: 1,
          student_id: 7,
          academic_period_id: 1,
          appreciation: null,
          status: "generated",
          generated_at: "2026-09-02T10:00:00Z",
          published_at: null,
          published_by: null,
          created_by: 1,
          student,
          academic_period: {
            id: 1,
            institution_id: 1,
            academic_year_id: 1,
            name: "Trimestre 1",
            type: null,
            start_date: null,
            end_date: null,
            sort_order: 1,
            status: "open",
          },
          bulletin: { id: 1, file_name: "bulletin.pdf", url: "/media/1" },
        },
      ])
    );
    downloadReportCardPdf.mockResolvedValue(undefined);

    render(<ReportCardsManagementContent />);
    await waitFor(() => expect(screen.getByText("Koné Awa")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /Actions pour Koné Awa/i }));
    await user.click(screen.getByRole("menuitem", { name: "PDF" }));
    await waitFor(() => expect(downloadReportCardPdf).toHaveBeenCalledWith(11));
  });
});
