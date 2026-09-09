import { beforeEach, describe, expect, it, vi } from "vitest";

const getWithMeta = vi.fn();
const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    getWithMeta: (...args: unknown[]) => getWithMeta(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
  },
}));

import {
  createUser,
  deleteUser,
  listPermissions,
  listRoles,
  listUsers,
  updateRolePermissions,
  updateUser,
} from "@/infrastructure/api/resources/identity";

describe("identity API resource", () => {
  beforeEach(() => {
    getWithMeta.mockReset();
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists users with pagination meta", async () => {
    getWithMeta.mockResolvedValue({
      data: [{ id: 1, name: "Admin", email: "admin@educore.ci" }],
      meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
    });
    const result = await listUsers({ search: "admin", role: "ADMIN", page: 1, per_page: 10 });
    expect(getWithMeta).toHaveBeenCalledWith("/users", {
      search: "admin",
      role: "ADMIN",
      page: 1,
      per_page: 10,
    });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it("creates, updates and deletes a user", async () => {
    apiPost.mockResolvedValue({ id: 2, email: "sec@educore.ci" });
    await createUser({
      name: "Secrétaire",
      email: "sec@educore.ci",
      password: "password1",
      roles: ["SECRETARY"],
    });
    expect(apiPost).toHaveBeenCalledWith("/users", {
      name: "Secrétaire",
      email: "sec@educore.ci",
      password: "password1",
      roles: ["SECRETARY"],
    });

    apiPut.mockResolvedValue({ id: 2, name: "Secrétaire 2" });
    await updateUser(2, { name: "Secrétaire 2" });
    expect(apiPut).toHaveBeenCalledWith("/users/2", { name: "Secrétaire 2" });

    apiDelete.mockResolvedValue(null);
    await deleteUser(2);
    expect(apiDelete).toHaveBeenCalledWith("/users/2");
  });

  it("lists roles and updates permissions", async () => {
    apiGet.mockResolvedValueOnce([{ id: 3, name: "TEACHER", permissions: ["grades.view"] }]);
    apiGet.mockResolvedValueOnce([{ name: "grades.view", domain: "grades", action: "view" }]);
    await listRoles();
    await listPermissions();
    expect(apiGet).toHaveBeenCalledWith("/roles");
    expect(apiGet).toHaveBeenCalledWith("/permissions");

    apiPut.mockResolvedValue({ id: 3, name: "TEACHER", permissions: ["grades.view"] });
    await updateRolePermissions(3, ["grades.view"]);
    expect(apiPut).toHaveBeenCalledWith("/roles/3", { permissions: ["grades.view"] });
  });
});
