import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
}));

import {
  createLibraryBook,
  createLibraryLoan,
  listLibraryBooks,
  listOverdueLibraryLoans,
  returnLibraryLoan,
} from "@/infrastructure/api/resources/library";

describe("library API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists books and creates loan/return", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 1 });

    await listLibraryBooks({ search: "maths" });
    expect(apiGet).toHaveBeenCalledWith("/library-books", { search: "maths" });

    await createLibraryBook({ title: "Algèbre" });
    expect(apiPost).toHaveBeenCalledWith("/library-books", { title: "Algèbre" });

    await createLibraryLoan({
      library_copy_id: 2,
      student_id: 7,
      due_date: "2026-09-20",
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/library-loans",
      expect.objectContaining({ library_copy_id: 2 })
    );

    await returnLibraryLoan(9);
    expect(apiPost).toHaveBeenCalledWith("/library-loans/9/return");

    await listOverdueLibraryLoans();
    expect(apiGet).toHaveBeenCalledWith("/library-loans/overdue");
  });
});
