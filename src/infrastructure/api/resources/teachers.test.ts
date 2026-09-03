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
  createTeacherAssignment,
  deleteTeacherAssignment,
  listTeacherAssignments,
  listTeachers,
} from "@/infrastructure/api/resources/teachers";

describe("teachers API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists teachers and assignments", async () => {
    apiGet.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 9 }]);
    await listTeachers();
    expect(apiGet).toHaveBeenCalledWith("/teachers");
    await listTeacherAssignments(1);
    expect(apiGet).toHaveBeenCalledWith("/teachers/1/assignments");
  });

  it("creates and deletes assignments", async () => {
    apiPost.mockResolvedValue({ id: 3 });
    apiDelete.mockResolvedValue(null);
    await createTeacherAssignment(1, { class_group_id: 2, subject_id: 4 });
    await deleteTeacherAssignment(3);
    expect(apiPost).toHaveBeenCalledWith("/teachers/1/assignments", {
      class_group_id: 2,
      subject_id: 4,
    });
    expect(apiDelete).toHaveBeenCalledWith("/teacher-subjects/3");
  });
});
