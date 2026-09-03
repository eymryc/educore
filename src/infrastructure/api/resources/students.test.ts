import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();
const apiRequest = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

import {
  createStudent,
  deleteStudent,
  getStudentFull,
  listStudents,
  updateStudent,
  uploadStudentPhoto,
} from "@/infrastructure/api/resources/students";

describe("students API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
    apiRequest.mockReset();
  });

  it("lists students", async () => {
    apiGet.mockResolvedValue([{ id: 1 }]);
    await expect(listStudents()).resolves.toEqual([{ id: 1 }]);
    expect(apiGet).toHaveBeenCalledWith("/students");
  });

  it("loads full dossier", async () => {
    apiGet.mockResolvedValue({ student: { id: 1 }, histories: [] });
    await getStudentFull(1);
    expect(apiGet).toHaveBeenCalledWith("/students/1/full");
  });

  it("creates, updates and deletes", async () => {
    apiPost.mockResolvedValue({ id: 2 });
    apiPut.mockResolvedValue({ id: 2 });
    apiDelete.mockResolvedValue(null);

    await createStudent({ first_name: "A", last_name: "B" });
    await updateStudent(2, { phone: "01" });
    await deleteStudent(2);

    expect(apiPost).toHaveBeenCalledWith("/students", { first_name: "A", last_name: "B" });
    expect(apiPut).toHaveBeenCalledWith("/students/2", { phone: "01" });
    expect(apiDelete).toHaveBeenCalledWith("/students/2");
  });

  it("uploads photo as FormData", async () => {
    apiRequest.mockResolvedValue({ id: 1 });
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    await uploadStudentPhoto(1, file);
    expect(apiRequest).toHaveBeenCalledWith(
      "/students/1/photo",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) })
    );
  });
});
