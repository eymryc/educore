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
  attachGuardianStudent,
  createGuardian,
  deleteGuardian,
  detachGuardianStudent,
  listGuardianStudents,
  listGuardians,
} from "@/infrastructure/api/resources/guardians";

describe("guardians API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists guardians and linked students", async () => {
    apiGet.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 9 }]);
    await expect(listGuardians()).resolves.toEqual([{ id: 1 }]);
    expect(apiGet).toHaveBeenCalledWith("/guardians");
    await listGuardianStudents(1);
    expect(apiGet).toHaveBeenCalledWith("/guardians/1/students");
  });

  it("creates and deletes a guardian", async () => {
    apiPost.mockResolvedValue({ id: 2 });
    apiDelete.mockResolvedValue(null);
    await createGuardian({ first_name: "A", last_name: "B", email: "a@b.ci", phone: "01" });
    await deleteGuardian(2);
    expect(apiPost).toHaveBeenCalledWith("/guardians", expect.any(Object));
    expect(apiDelete).toHaveBeenCalledWith("/guardians/2");
  });

  it("attaches and detaches students", async () => {
    apiPost.mockResolvedValue({ id: 1, student_id: 5 });
    apiDelete.mockResolvedValue(null);
    await attachGuardianStudent(3, { student_id: 5, relationship: "mere", is_primary: true });
    await detachGuardianStudent(3, 5);
    expect(apiPost).toHaveBeenCalledWith("/guardians/3/students", {
      student_id: 5,
      relationship: "mere",
      is_primary: true,
    });
    expect(apiDelete).toHaveBeenCalledWith("/guardians/3/students/5");
  });
});
