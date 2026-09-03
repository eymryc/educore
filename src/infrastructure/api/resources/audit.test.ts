import { beforeEach, describe, expect, it, vi } from "vitest";

const getWithMeta = vi.fn();
const apiGet = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    getWithMeta: (...args: unknown[]) => getWithMeta(...args),
  },
}));

import { getAuditLog, listAuditLogs } from "@/infrastructure/api/resources/audit";

describe("audit API resource", () => {
  beforeEach(() => {
    getWithMeta.mockReset();
    apiGet.mockReset();
  });

  it("lists with filters and pagination meta", async () => {
    getWithMeta.mockResolvedValue({
      data: [{ id: 1, action: "login" }],
      meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
    });
    const result = await listAuditLogs({
      action: "login",
      resource: "users",
      page: 1,
      per_page: 10,
    });
    expect(getWithMeta).toHaveBeenCalledWith("/audit-logs", {
      action: "login",
      resource: "users",
      page: 1,
      per_page: 10,
    });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it("loads detail", async () => {
    apiGet.mockResolvedValue({ id: 9, action: "update" });
    await getAuditLog(9);
    expect(apiGet).toHaveBeenCalledWith("/audit-logs/9");
  });
});
