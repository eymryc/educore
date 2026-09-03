import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiRequest = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
  },
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

import { exportReport, getReport } from "@/infrastructure/api/resources/reports";

describe("reports API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiRequest.mockReset();
  });

  it("loads JSON report with filters", async () => {
    apiGet.mockResolvedValue({
      type: "attendance",
      summary: { records_count: 10 },
      rows: [],
    });
    await getReport("attendance", {
      class_group_id: 3,
      date_from: "2026-01-01",
      date_to: "2026-01-31",
    });
    expect(apiGet).toHaveBeenCalledWith("/reports/attendance", {
      class_group_id: 3,
      date_from: "2026-01-01",
      date_to: "2026-01-31",
    });
  });

  it("exports via raw download with format query", async () => {
    const blob = new Blob(["csv"], { type: "text/csv" });
    apiRequest.mockResolvedValue({
      blob: async () => blob,
      headers: {
        get: () => 'attachment; filename="report-students-20260902.csv"',
      },
    });
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document, "createElement").mockReturnValue({
      click,
      remove: vi.fn(),
      set href(_: string) {},
      get href() {
        return "";
      },
      set download(_: string) {},
      get download() {
        return "";
      },
    } as unknown as HTMLAnchorElement);

    await exportReport("students", "csv", { class_group_id: 2 });
    expect(apiRequest).toHaveBeenCalledWith("/reports/students", {
      method: "GET",
      query: { class_group_id: 2, format: "csv" },
      raw: true,
    });
    expect(click).toHaveBeenCalled();
    appendChild.mockRestore();
    vi.unstubAllGlobals();
  });
});
