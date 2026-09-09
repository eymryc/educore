import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvoicesManagementContent } from "@/presentation/components/modules/invoices_management/InvoicesManagementContent";

const listInvoices = vi.fn();
const issueInvoice = vi.fn();
const downloadInvoiceReceipt = vi.fn();
const deleteInvoice = vi.fn();
const generateInvoices = vi.fn();
const listStudents = vi.fn();
const listAcademicYears = vi.fn();
const listClassGroups = vi.fn();

vi.mock("@/infrastructure/api/resources/finance", () => ({
  listInvoices: (...args: unknown[]) => listInvoices(...args),
  issueInvoice: (...args: unknown[]) => issueInvoice(...args),
  downloadInvoiceReceipt: (...args: unknown[]) => downloadInvoiceReceipt(...args),
  deleteInvoice: (...args: unknown[]) => deleteInvoice(...args),
  generateInvoices: (...args: unknown[]) => generateInvoices(...args),
}));

vi.mock("@/infrastructure/api/resources/students", () => ({
  listStudents: (...args: unknown[]) => listStudents(...args),
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

const draftInvoice = {
  id: 1,
  institution_id: 1,
  student_id: 7,
  academic_year_id: 1,
  invoice_number: "INV-001",
  issue_date: "2026-09-01",
  due_date: "2026-09-30",
  status: "DRAFT" as const,
  subtotal: 10000,
  discount_amount: 0,
  penalty_amount: 0,
  total_amount: 10000,
  amount_paid: 0,
  balance_due: 10000,
  notes: null,
  created_by: 1,
  student: {
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
  },
};

vi.mock("@/presentation/components/providers/ConfirmDialogProvider", () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

function paginated<T>(data: T[]) {
  return { data, meta: { current_page: 1, per_page: 10, total: data.length, last_page: 1 } };
}

describe("InvoicesManagementContent", () => {
  beforeEach(() => {
    listInvoices.mockReset();
    issueInvoice.mockReset();
    downloadInvoiceReceipt.mockReset();
    deleteInvoice.mockReset();
    generateInvoices.mockReset();
    listStudents.mockReset();
    listAcademicYears.mockReset();
    listClassGroups.mockReset();
    listClassGroups.mockResolvedValue([]);
  });

  it("lists invoices and issues a draft", async () => {
    listInvoices.mockResolvedValue(paginated([draftInvoice]));
    issueInvoice.mockResolvedValue({ ...draftInvoice, status: "ISSUED" });

    render(<InvoicesManagementContent />);
    expect(screen.getByTestId("invoices-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("invoices-table")).toHaveTextContent("INV-001");
    });

    await userEvent.click(screen.getByRole("button", { name: /Actions pour/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /émettre/i }));
    await waitFor(() => {
      expect(issueInvoice).toHaveBeenCalledWith(1);
    });
  });

  it("filters invoices by class", async () => {
    const user = userEvent.setup();
    listInvoices.mockResolvedValue(paginated([draftInvoice]));
    listClassGroups.mockResolvedValue([
      { id: 2, institution_id: 1, academic_year_id: 1, level_id: 1, series_id: null, name: "6ème A", max_capacity: 40, head_teacher_id: null, room_id: null },
    ]);

    render(<InvoicesManagementContent />);
    await waitFor(() => expect(screen.getByTestId("invoices-table")).toBeInTheDocument());
    await waitFor(() => expect(listClassGroups).toHaveBeenCalled());

    await user.click(screen.getByLabelText("Filtrer par classe"));
    await user.click(await screen.findByRole("option", { name: "6ème A" }));

    await waitFor(() => {
      expect(listInvoices).toHaveBeenLastCalledWith({
        class_group_id: "2",
        page: 1,
        per_page: 10,
      });
    });
  });

  it("fetches the next page from the server instead of paginating client-side", async () => {
    const user = userEvent.setup();
    listInvoices.mockResolvedValue({
      data: [draftInvoice],
      meta: { current_page: 1, per_page: 10, total: 15, last_page: 2 },
    });

    render(<InvoicesManagementContent />);
    await waitFor(() => expect(screen.getByTestId("invoices-table")).toHaveTextContent("INV-001"));

    await user.click(screen.getByLabelText("Page suivante"));

    await waitFor(() => {
      expect(listInvoices).toHaveBeenLastCalledWith({ page: 2, per_page: 10 });
    });
  });

  it("resets to page 1 and searches server-side when typing in the search box", async () => {
    const user = userEvent.setup();
    listInvoices.mockResolvedValue(paginated([draftInvoice]));

    render(<InvoicesManagementContent />);
    await waitFor(() => expect(screen.getByTestId("invoices-table")).toHaveTextContent("INV-001"));

    await user.type(screen.getByLabelText("Rechercher"), "INV-001");

    await waitFor(() => {
      expect(listInvoices).toHaveBeenLastCalledWith({
        search: "INV-001",
        page: 1,
        per_page: 10,
      });
    });
  });

  it("shows error state", async () => {
    listInvoices.mockRejectedValue(new Error("Factures KO"));
    render(<InvoicesManagementContent />);
    await waitFor(() => {
      expect(screen.getByTestId("invoices-error")).toHaveTextContent("Factures KO");
    });
  });

  it("generates invoices for a student and academic year", async () => {
    listInvoices.mockResolvedValue(paginated([]));
    listStudents.mockResolvedValue([
      { ...draftInvoice.student, id: 7, first_name: "Awa", last_name: "Koné", matricule: "EL-007" },
    ]);
    listAcademicYears.mockResolvedValue([
      { id: 1, name: "2026-2027", is_active: true },
    ]);
    generateInvoices.mockResolvedValue([draftInvoice, draftInvoice]);

    const user = userEvent.setup();
    render(<InvoicesManagementContent />);
    await waitFor(() => expect(screen.getByTestId("invoices-table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /générer les factures/i }));
    await waitFor(() => {
      expect(screen.getByTestId("generate-invoices-panel")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Élève"));
    await user.click(await screen.findByRole("option", { name: /Koné Awa/i }));
    await user.click(screen.getByLabelText("Année scolaire"));
    await user.click(await screen.findByRole("option", { name: /2026-2027/i }));
    await user.click(screen.getByRole("button", { name: "Générer" }));

    await waitFor(() => {
      expect(generateInvoices).toHaveBeenCalledWith({
        student_id: "7",
        academic_year_id: "1",
      });
    });
  });
});
