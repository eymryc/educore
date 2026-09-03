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
  cancelDisciplineRecord,
  createDisciplineRecord,
  listDisciplineRecords,
  listStudentDisciplineRecords,
  validateDisciplineRecord,
} from "@/infrastructure/api/resources/discipline";

describe("discipline API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists with filters and student history", async () => {
    apiGet.mockResolvedValue([]);
    await listDisciplineRecords({ student_id: 7, type: "INCIDENT" });
    expect(apiGet).toHaveBeenCalledWith("/discipline-records", {
      student_id: 7,
      type: "INCIDENT",
    });
    await listStudentDisciplineRecords(7);
    expect(apiGet).toHaveBeenCalledWith("/students/7/discipline-records");
  });

  it("creates, validates and cancels", async () => {
    apiPost.mockResolvedValue({ id: 1, status: "RECORDED" });
    await createDisciplineRecord({
      student_id: 7,
      academic_year_id: 1,
      type: "WARNING",
      title: "Avertissement",
      occurred_at: "2026-09-02",
    });
    expect(apiPost).toHaveBeenCalledWith(
      "/discipline-records",
      expect.objectContaining({ type: "WARNING" })
    );
    await validateDisciplineRecord(1);
    expect(apiPost).toHaveBeenCalledWith("/discipline-records/1/validate");
    await cancelDisciplineRecord(1);
    expect(apiPost).toHaveBeenCalledWith("/discipline-records/1/cancel");
  });
});
