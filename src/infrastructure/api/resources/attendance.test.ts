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
  createAttendance,
  justifyAttendance,
  listAttendance,
  updateAttendance,
  validateAttendance,
} from "@/infrastructure/api/resources/attendance";

describe("attendance API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists attendance with filters", async () => {
    apiGet.mockResolvedValue([]);
    await listAttendance({ class_group_id: 2, date: "2026-09-02" });
    expect(apiGet).toHaveBeenCalledWith("/attendance", {
      class_group_id: 2,
      date: "2026-09-02",
    });
  });

  it("creates, updates, justifies and validates", async () => {
    apiPost.mockResolvedValue({ id: 1 });
    apiPut.mockResolvedValue({ id: 1 });

    await createAttendance({
      student_id: 7,
      class_group_id: 2,
      academic_year_id: 1,
      date: "2026-09-02",
      status: "ABSENT",
    });
    expect(apiPost).toHaveBeenCalledWith("/attendance", expect.objectContaining({ status: "ABSENT" }));

    await updateAttendance(1, { status: "LATE" });
    expect(apiPut).toHaveBeenCalledWith("/attendance/1", { status: "LATE" });

    await justifyAttendance(1, "Certificat médical");
    expect(apiPost).toHaveBeenCalledWith("/attendance/1/justify", {
      justification: "Certificat médical",
    });

    await validateAttendance(1);
    expect(apiPost).toHaveBeenCalledWith("/attendance/1/validate");
  });
});
