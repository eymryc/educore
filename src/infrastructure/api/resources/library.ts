import { api } from "@/infrastructure/api/client";
import type { LibraryBook, LibraryCopy, LibraryLoan } from "@/shared/types/library.types";

export type LibraryBookListQuery = {
  search?: string;
  category?: string;
};

export type LibraryCopyListQuery = {
  library_book_id?: number | string;
  status?: string;
};

export type LibraryLoanListQuery = {
  status?: string;
  student_id?: number | string;
};

export function listLibraryBooks(query?: LibraryBookListQuery): Promise<LibraryBook[]> {
  return api.get<LibraryBook[]>("/library-books", query);
}

export function getLibraryBook(id: number | string): Promise<LibraryBook> {
  return api.get<LibraryBook>(`/library-books/${id}`);
}

export function createLibraryBook(payload: Record<string, unknown>): Promise<LibraryBook> {
  return api.post<LibraryBook>("/library-books", payload);
}

export function updateLibraryBook(
  id: number | string,
  payload: Record<string, unknown>
): Promise<LibraryBook> {
  return api.put<LibraryBook>(`/library-books/${id}`, payload);
}

export function deleteLibraryBook(id: number | string): Promise<null> {
  return api.delete<null>(`/library-books/${id}`);
}

export function listLibraryCopies(query?: LibraryCopyListQuery): Promise<LibraryCopy[]> {
  return api.get<LibraryCopy[]>("/library-copies", query);
}

export function getLibraryCopy(id: number | string): Promise<LibraryCopy> {
  return api.get<LibraryCopy>(`/library-copies/${id}`);
}

export function createLibraryCopy(payload: Record<string, unknown>): Promise<LibraryCopy> {
  return api.post<LibraryCopy>("/library-copies", payload);
}

export function updateLibraryCopy(
  id: number | string,
  payload: Record<string, unknown>
): Promise<LibraryCopy> {
  return api.put<LibraryCopy>(`/library-copies/${id}`, payload);
}

export function deleteLibraryCopy(id: number | string): Promise<null> {
  return api.delete<null>(`/library-copies/${id}`);
}

export function listLibraryLoans(query?: LibraryLoanListQuery): Promise<LibraryLoan[]> {
  return api.get<LibraryLoan[]>("/library-loans", query);
}

export function listOverdueLibraryLoans(): Promise<LibraryLoan[]> {
  return api.get<LibraryLoan[]>("/library-loans/overdue");
}

export function getLibraryLoan(id: number | string): Promise<LibraryLoan> {
  return api.get<LibraryLoan>(`/library-loans/${id}`);
}

export function createLibraryLoan(payload: Record<string, unknown>): Promise<LibraryLoan> {
  return api.post<LibraryLoan>("/library-loans", payload);
}

export function returnLibraryLoan(id: number | string): Promise<LibraryLoan> {
  return api.post<LibraryLoan>(`/library-loans/${id}/return`);
}
