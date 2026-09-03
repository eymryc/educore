import type { Student } from "@/shared/types/student.types";
import { studentFullName } from "@/shared/types/student.types";

export type LibraryCopyStatus =
  | "AVAILABLE"
  | "LOANED"
  | "LOST"
  | "DAMAGED"
  | "RETIRED";

export type LibraryLoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

export interface LibraryBook {
  id: number;
  institution_id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  category: string | null;
  description: string | null;
  is_active: boolean;
  copies_count?: number;
  available_copies_count?: number;
  copies?: LibraryCopy[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LibraryCopy {
  id: number;
  institution_id: number;
  library_book_id: number;
  copy_code: string;
  status: LibraryCopyStatus;
  acquired_at: string | null;
  notes: string | null;
  book?: LibraryBook | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LibraryLoan {
  id: number;
  institution_id: number;
  library_copy_id: number;
  student_id: number;
  loaned_by: number | null;
  loaned_at: string | null;
  due_date: string;
  returned_at: string | null;
  returned_by: number | null;
  status: LibraryLoanStatus;
  is_overdue: boolean;
  notes: string | null;
  copy?: LibraryCopy | null;
  student?: Student | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const LIBRARY_COPY_STATUS_LABELS: Record<LibraryCopyStatus, string> = {
  AVAILABLE: "Disponible",
  LOANED: "Emprunté",
  LOST: "Perdu",
  DAMAGED: "Endommagé",
  RETIRED: "Retiré",
};

export const LIBRARY_LOAN_STATUS_LABELS: Record<LibraryLoanStatus, string> = {
  ACTIVE: "Actif",
  RETURNED: "Rendu",
  OVERDUE: "En retard",
};

export function canReturnLoan(loan: Pick<LibraryLoan, "status">): boolean {
  return loan.status === "ACTIVE" || loan.status === "OVERDUE";
}

export function filterLibraryBooks(
  items: LibraryBook[],
  filters: { search?: string; category?: string }
): LibraryBook[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((b) => {
    if (filters.category && (b.category ?? "") !== filters.category) return false;
    if (!q) return true;
    return `${b.title} ${b.author ?? ""} ${b.isbn ?? ""}`.toLowerCase().includes(q);
  });
}

export function filterLibraryLoans(
  items: LibraryLoan[],
  filters: { search?: string; status?: string }
): LibraryLoan[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((loan) => {
    if (filters.status && loan.status !== filters.status) return false;
    if (!q) return true;
    const student = loan.student ? studentFullName(loan.student) : "";
    const code = loan.copy?.copy_code ?? "";
    const title = loan.copy?.book?.title ?? "";
    return `${student} ${code} ${title}`.toLowerCase().includes(q);
  });
}

export function summarizeLibrary(params: {
  books: LibraryBook[];
  copies: LibraryCopy[];
  loans: LibraryLoan[];
}): { books: number; available: number; loaned: number; overdue: number } {
  return {
    books: params.books.length,
    available: params.copies.filter((c) => c.status === "AVAILABLE").length,
    loaned: params.copies.filter((c) => c.status === "LOANED").length,
    overdue: params.loans.filter((l) => l.status === "OVERDUE" || l.is_overdue).length,
  };
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
