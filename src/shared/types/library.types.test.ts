import { describe, expect, it } from "vitest";
import {
  canReturnLoan,
  filterLibraryBooks,
  filterLibraryLoans,
  summarizeLibrary,
  type LibraryBook,
  type LibraryCopy,
  type LibraryLoan,
} from "@/shared/types/library.types";

function book(partial: Partial<LibraryBook> & Pick<LibraryBook, "id" | "title">): LibraryBook {
  return {
    institution_id: 1,
    author: "Camara",
    isbn: null,
    publisher: null,
    publication_year: null,
    category: "Roman",
    description: null,
    is_active: true,
    ...partial,
  };
}

describe("library helpers", () => {
  it("filters books and loans", () => {
    const books = [
      book({ id: 1, title: "L'Aventure ambiguë" }),
      book({ id: 2, title: "Maths 2nde", category: "Manuel", author: "Dupont" }),
    ];
    expect(filterLibraryBooks(books, { search: "maths" })).toHaveLength(1);
    expect(filterLibraryBooks(books, { category: "Roman" })).toHaveLength(1);

    const loans: LibraryLoan[] = [
      {
        id: 1,
        institution_id: 1,
        library_copy_id: 1,
        student_id: 7,
        loaned_by: 1,
        loaned_at: null,
        due_date: "2026-09-10",
        returned_at: null,
        returned_by: null,
        status: "OVERDUE",
        is_overdue: true,
        notes: null,
        student: {
          id: 7,
          institution_id: 1,
          user_id: null,
          matricule: "EL-007",
          first_name: "Awa",
          last_name: "Koné",
          birth_date: "2010-01-01",
          gender: "F",
          email: null,
          phone: null,
          address: null,
          level_id: 1,
          class_group_id: 2,
          status: "active",
          enrolled_at: null,
          avatar_url: null,
        },
      },
    ];
    expect(filterLibraryLoans(loans, { search: "koné" })).toHaveLength(1);
    expect(canReturnLoan(loans[0]!)).toBe(true);
  });

  it("summarizes inventory", () => {
    const copies: LibraryCopy[] = [
      {
        id: 1,
        institution_id: 1,
        library_book_id: 1,
        copy_code: "A1",
        status: "AVAILABLE",
        acquired_at: null,
        notes: null,
      },
      {
        id: 2,
        institution_id: 1,
        library_book_id: 1,
        copy_code: "A2",
        status: "LOANED",
        acquired_at: null,
        notes: null,
      },
    ];
    expect(
      summarizeLibrary({
        books: [book({ id: 1, title: "X" })],
        copies,
        loans: [],
      })
    ).toEqual({ books: 1, available: 1, loaned: 1, overdue: 0 });
  });
});
