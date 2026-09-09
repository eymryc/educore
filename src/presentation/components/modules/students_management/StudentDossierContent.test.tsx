import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentDossierContent } from "@/presentation/components/modules/students_management/StudentDossierContent";

const getStudentFull = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "5" }),
}));

vi.mock("@/infrastructure/api/resources/students", () => ({
  getStudentFull: (...args: unknown[]) => getStudentFull(...args),
  uploadStudentPhoto: vi.fn(),
  uploadStudentDocument: vi.fn(),
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
  id: 5,
  institution_id: 1,
  user_id: null,
  matricule: "ELV-5",
  first_name: "Aminata",
  last_name: "Koné",
  birth_date: "2008-03-15",
  gender: "F" as const,
  email: "a@ecole.ci",
  phone: null,
  address: null,
  level_id: 1,
  class_group_id: 2,
  status: "active" as const,
  enrolled_at: "2024-09-01",
  avatar_url: null,
};

const emptyDossier = {
  student,
  class: { id: 2, name: "2nde A" },
  level: { id: 1, name: "2nde" },
  histories: [],
  grades: [],
  averages: null,
  attendance: [],
  attendance_summary: {},
  report_cards: [],
  invoices: [],
  payments: [],
  discipline: [],
  guardians: [],
  documents: [],
  enrollments: [],
  re_enrollments: [],
  assignments: [],
  library_loans: [],
  canteen_account: null,
  canteen_special_diets: [],
  transport_subscriptions: [],
};

describe("StudentDossierContent", () => {
  beforeEach(() => {
    getStudentFull.mockReset();
  });

  it("renders dossier data from GET /students/{id}/full", async () => {
    getStudentFull.mockResolvedValue(emptyDossier);

    render(<StudentDossierContent />);
    expect(screen.getByTestId("dossier-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("dossier-name")).toHaveTextContent("Koné Aminata");
    });

    expect(screen.getByTestId("dossier-level")).toHaveTextContent("2nde");
    expect(screen.getByTestId("dossier-class")).toHaveTextContent("2nde A");
    expect(getStudentFull).toHaveBeenCalledWith("5");
  });

  it("shows error when dossier fails to load", async () => {
    getStudentFull.mockRejectedValue(new Error("Introuvable"));
    render(<StudentDossierContent />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Introuvable");
    });
  });

  it("shows averages, grades, attendance, invoices and payments", async () => {
    getStudentFull.mockResolvedValue({
      ...emptyDossier,
      grades: [
        {
          id: 1,
          institution_id: 1,
          assessment_id: 10,
          student_id: 5,
          score: 16,
          comment: null,
          validated_at: "2026-09-01T00:00:00Z",
          validated_by: 1,
          recorded_by: 1,
          assessment: {
            id: 10,
            title: "Devoir 1",
            type: "devoir",
            max_score: 20,
            subject: { id: 1, name: "Mathématiques" },
          },
        },
      ],
      averages: {
        academic_year: { id: 1, name: "2026-2027" },
        scale_max: 20,
        by_period: [{ period: { id: 1, name: "Trimestre 1" }, average: 15.5 }],
        annual_average: 15.5,
        mention: "bien",
        mention_label: "Bien",
      },
      attendance: [
        {
          id: 1,
          institution_id: 1,
          student_id: 5,
          class_group_id: 2,
          academic_year_id: 1,
          date: "2026-09-01",
          status: "ABSENT" as const,
          notes: null,
          justification: null,
          justified_at: null,
          justified_by: null,
          validated_at: null,
          validated_by: null,
          recorded_by: 1,
        },
      ],
      attendance_summary: { PRESENT: 9, ABSENT: 1 },
      invoices: [
        {
          id: 1,
          institution_id: 1,
          student_id: 5,
          academic_year_id: 1,
          invoice_number: "INV-2026-0001",
          issue_date: "2026-09-01",
          due_date: "2026-09-30",
          status: "PARTIALLY_PAID" as const,
          subtotal: 50000,
          discount_amount: 0,
          penalty_amount: 0,
          total_amount: 50000,
          amount_paid: 20000,
          balance_due: 30000,
          notes: null,
          created_by: 1,
        },
      ],
      payments: [
        {
          id: 1,
          institution_id: 1,
          invoice_id: 1,
          student_id: 5,
          amount: 20000,
          currency: "XOF",
          status: "SUCCESS" as const,
          provider: "manual",
          provider_reference: "ref-1",
          provider_transaction_id: null,
          receipt_number: "REC-2026-0001",
          method: "CASH" as const,
          refund_amount: null,
          paid_at: "2026-09-05T10:00:00Z",
          failed_at: null,
          refunded_at: null,
          initiated_by: 1,
        },
      ],
      report_cards: [
        {
          id: 1,
          institution_id: 1,
          student_id: 5,
          academic_period_id: 1,
          appreciation: null,
          mention: "bien" as const,
          status: "published" as const,
          generated_at: "2026-09-10T00:00:00Z",
          published_at: "2026-09-11T00:00:00Z",
          published_by: 1,
          created_by: 1,
          academic_period: { id: 1, name: "Trimestre 1" },
        },
      ],
    });

    render(<StudentDossierContent />);

    await waitFor(() => expect(screen.getByTestId("dossier-annual-average")).toHaveTextContent("15,5"));

    expect(screen.getByTestId("dossier-grades")).toHaveTextContent("Mathématiques");
    expect(screen.getByTestId("dossier-report-cards")).toHaveTextContent("Trimestre 1");
    expect(screen.getByTestId("dossier-balance")).toHaveTextContent("30 000");

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Finances/i }));
    expect(screen.getByTestId("dossier-invoices")).toHaveTextContent("INV-2026-0001");
    expect(screen.getByTestId("dossier-payments")).toHaveTextContent("REC-2026-0001");

    await user.click(screen.getByRole("tab", { name: /Vie scolaire/i }));
    expect(screen.getByTestId("dossier-attendance")).toHaveTextContent("01/09/2026");
  });

  it("shows guardians, documents, enrollment origin, homework, library loans, canteen and transport", async () => {
    getStudentFull.mockResolvedValue({
      ...emptyDossier,
      guardians: [
        {
          id: 900,
          institution_id: 1,
          student_id: 5,
          guardian_id: 40,
          relationship: "mere" as const,
          is_primary: true,
          guardian: {
            id: 40,
            institution_id: 1,
            user_id: null,
            first_name: "Fatou",
            last_name: "Koné",
            email: "fatou.kone@example.ci",
            phone: "+225 07 00 00 00 00",
            profession: "Commerçante",
            address: null,
          },
        },
      ],
      documents: [
        {
          id: 10,
          name: "Acte de naissance",
          file_name: "acte-naissance.pdf",
          mime_type: "application/pdf",
          size: 204800,
          url: "https://example.test/documents/10",
        },
      ],
      enrollments: [
        {
          id: 5,
          institution_id: 1,
          student_id: 5,
          academic_year_id: 1,
          level_id: 1,
          class_group_id: 2,
          first_name: "Aminata",
          last_name: "Koné",
          origin: "TRANSFERT" as const,
          previous_school: "Collège Notre-Dame",
          birth_date: "2008-03-15",
          gender: "F" as const,
          parent_contact: "+225 07 00 00 00 00",
          application_date: "2024-06-01",
          status: "CLASS_ASSIGNED" as const,
          observations: null,
          reviewed_at: null,
          approved_at: null,
          payment_at: null,
          enrolled_at: null,
          class_assigned_at: null,
          rejected_at: null,
        },
      ],
      assignments: [
        {
          id: 30,
          institution_id: 1,
          assignment_id: 3,
          student_id: 5,
          comment: null,
          score: 14,
          feedback: null,
          status: "GRADED" as const,
          submitted_at: "2026-09-02T18:00:00Z",
          graded_at: "2026-09-03T10:00:00Z",
          graded_by: 1,
          assignment: {
            id: 3,
            institution_id: 1,
            academic_year_id: 1,
            subject_id: 1,
            class_group_id: 2,
            title: "Devoir maison n°1",
            description: null,
            instructions: null,
            due_at: "2026-09-02T23:59:00Z",
            max_score: 20,
            status: "PUBLISHED" as const,
            created_by: 1,
            subject: { id: 1, name: "Mathématiques" },
          },
        },
      ],
      library_loans: [
        {
          id: 12,
          institution_id: 1,
          library_copy_id: 7,
          student_id: 5,
          loaned_by: 1,
          loaned_at: "2026-08-01T09:00:00Z",
          due_date: "2026-08-15",
          returned_at: null,
          returned_by: null,
          status: "ACTIVE" as const,
          is_overdue: false,
          notes: null,
          copy: {
            id: 7,
            institution_id: 1,
            library_book_id: 3,
            copy_code: "EX-3-1",
            status: "LOANED" as const,
            acquired_at: null,
            notes: null,
            book: {
              id: 3,
              institution_id: 1,
              title: "Une si longue lettre",
              author: "Mariama Bâ",
              isbn: null,
              publisher: null,
              publication_year: null,
              category: null,
              description: null,
              is_active: true,
            },
          },
        },
      ],
      canteen_account: {
        id: 8,
        institution_id: 1,
        student_id: 5,
        balance: 12000,
        status: "ACTIVE" as const,
        topups: [
          {
            id: 55,
            institution_id: 1,
            canteen_account_id: 8,
            amount: 10000,
            paid_at: "2026-08-20",
            payment_method: "especes" as const,
            recorded_by: 1,
            notes: null,
          },
        ],
      },
      transport_subscriptions: [
        {
          id: 3,
          institution_id: 1,
          student_id: 5,
          transport_route_id: 2,
          transport_route_stop_id: null,
          academic_year_id: 1,
          status: "ACTIVE" as const,
          start_date: "2026-09-01",
          end_date: null,
          monthly_fee: 15000,
          route: { id: 2, name: "Ligne Cocody" },
        },
      ],
    });

    render(<StudentDossierContent />);
    await waitFor(() => expect(screen.getByTestId("dossier-name")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Identité/i }));
    expect(screen.getByTestId("dossier-guardians")).toHaveTextContent("Koné Fatou");
    expect(screen.getByTestId("dossier-guardians")).toHaveTextContent("Principal");
    expect(screen.getByTestId("dossier-documents")).toHaveTextContent("Acte de naissance");
    expect(screen.getByText("Transfert")).toBeInTheDocument();
    expect(screen.getByText("Collège Notre-Dame")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Scolarité/i }));
    expect(screen.getByTestId("dossier-assignments")).toHaveTextContent("Devoir maison n°1");

    await user.click(screen.getByRole("tab", { name: /Vie scolaire/i }));
    expect(screen.getByTestId("dossier-library-loans")).toHaveTextContent("Une si longue lettre");
    expect(screen.getByTestId("dossier-canteen-balance")).toHaveTextContent("12 000");
    expect(screen.getByTestId("dossier-transport")).toHaveTextContent("Ligne Cocody");
  });
});
