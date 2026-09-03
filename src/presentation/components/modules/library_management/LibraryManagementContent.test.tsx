import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LibraryManagementContent } from "@/presentation/components/modules/library_management/LibraryManagementContent";

const listLibraryBooks = vi.fn();
const listLibraryCopies = vi.fn();
const listLibraryLoans = vi.fn();
const listOverdueLibraryLoans = vi.fn();
const returnLibraryLoan = vi.fn();
const deleteLibraryBook = vi.fn();
const deleteLibraryCopy = vi.fn();

vi.mock("@/infrastructure/api/resources/library", () => ({
  listLibraryBooks: (...args: unknown[]) => listLibraryBooks(...args),
  listLibraryCopies: (...args: unknown[]) => listLibraryCopies(...args),
  listLibraryLoans: (...args: unknown[]) => listLibraryLoans(...args),
  listOverdueLibraryLoans: (...args: unknown[]) => listOverdueLibraryLoans(...args),
  returnLibraryLoan: (...args: unknown[]) => returnLibraryLoan(...args),
  deleteLibraryBook: (...args: unknown[]) => deleteLibraryBook(...args),
  deleteLibraryCopy: (...args: unknown[]) => deleteLibraryCopy(...args),
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
describe("LibraryManagementContent", () => {
  beforeEach(() => {
    listLibraryBooks.mockReset();
    listLibraryCopies.mockReset();
    listLibraryLoans.mockReset();
    listOverdueLibraryLoans.mockReset();
    returnLibraryLoan.mockReset();
    listLibraryBooks.mockResolvedValue([
      {
        id: 1,
        institution_id: 1,
        title: "L'Aventure ambiguë",
        author: "Cheikh Hamidou Kane",
        isbn: "978",
        publisher: null,
        publication_year: 1961,
        category: "Roman",
        description: null,
        is_active: true,
      },
    ]);
    listLibraryCopies.mockResolvedValue([
      {
        id: 5,
        institution_id: 1,
        library_book_id: 1,
        copy_code: "AMB-01",
        status: "LOANED",
        acquired_at: null,
        notes: null,
        book: { id: 1, title: "L'Aventure ambiguë" },
      },
    ]);
    listLibraryLoans.mockResolvedValue([
      {
        id: 9,
        institution_id: 1,
        library_copy_id: 5,
        student_id: 7,
        loaned_by: 1,
        loaned_at: "2026-08-01T00:00:00Z",
        due_date: "2026-08-20",
        returned_at: null,
        returned_by: null,
        status: "ACTIVE",
        is_overdue: false,
        notes: null,
        copy: { id: 5, copy_code: "AMB-01", library_book_id: 1, status: "LOANED" },
        student: {
          id: 7,
          first_name: "Awa",
          last_name: "Koné",
          matricule: "EL-007",
        },
      },
    ]);
  });

  it("shows books then switches to loans and returns", async () => {
    const user = userEvent.setup();
    returnLibraryLoan.mockResolvedValue({
      id: 9,
      institution_id: 1,
      library_copy_id: 5,
      student_id: 7,
      loaned_by: 1,
      loaned_at: "2026-08-01T00:00:00Z",
      due_date: "2026-08-20",
      returned_at: "2026-09-02T12:00:00Z",
      returned_by: 1,
      status: "RETURNED",
      is_overdue: false,
      notes: null,
    });

    render(<LibraryManagementContent />);
    expect(screen.getByTestId("library-loading")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId("library-books-table")).toBeInTheDocument());
    expect(screen.getByText("L'Aventure ambiguë")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Emprunts" }));
    await waitFor(() => expect(screen.getByTestId("library-loans-table")).toBeInTheDocument());
    expect(screen.getByText("Koné Awa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Actions pour l'emprunt #9/i }));
    await user.click(screen.getByRole("menuitem", { name: "Retour" }));
    await waitFor(() => expect(returnLibraryLoan).toHaveBeenCalledWith(9));
    expect(await screen.findByText("Exemplaire rendu.")).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Retour" })).not.toBeInTheDocument();
  });

  it("loads overdue list when checkbox enabled", async () => {
    const user = userEvent.setup();
    listOverdueLibraryLoans.mockResolvedValue([]);

    render(<LibraryManagementContent />);
    await waitFor(() => expect(screen.getByTestId("library-books-table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Emprunts" }));
    await user.click(screen.getByLabelText(/Retards uniquement/i));
    await waitFor(() => expect(listOverdueLibraryLoans).toHaveBeenCalled());
  });
});
