import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();
const apiRequest = vi.fn();
const apiGetWithMeta = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
    getWithMeta: (...args: unknown[]) => apiGetWithMeta(...args),
  },
  apiRequest: (...args: unknown[]) => apiRequest(...args),
}));

import {
  createReportCard,
  downloadReportCardPdf,
  generateReportCard,
  listReportCards,
  publishReportCard,
} from "@/infrastructure/api/resources/report-cards";

describe("report-cards API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
    apiRequest.mockReset();
    apiGetWithMeta.mockReset();
  });

  it("lists, creates, generates and publishes", async () => {
    apiGetWithMeta.mockResolvedValue({
      data: [],
      meta: { current_page: 1, per_page: 25, total: 0, last_page: 1 },
    });
    apiPost.mockResolvedValue({ id: 1, status: "draft" });

    await listReportCards({ class_group_id: 2, academic_period_id: 1 });
    expect(apiGetWithMeta).toHaveBeenCalledWith("/report-cards", {
      class_group_id: 2,
      academic_period_id: 1,
    });

    await createReportCard({ student_id: 7, academic_period_id: 1 });
    expect(apiPost).toHaveBeenCalledWith("/report-cards", {
      student_id: 7,
      academic_period_id: 1,
    });

    await generateReportCard(1);
    expect(apiPost).toHaveBeenCalledWith("/report-cards/1/generate");

    await publishReportCard(1);
    expect(apiPost).toHaveBeenCalledWith("/report-cards/1/publish");
  });

  it("downloads PDF via raw response", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    apiRequest.mockResolvedValue({
      blob: async () => blob,
      headers: {
        get: () => 'attachment; filename="bulletin-awa.pdf"',
      },
    });

    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const appendChild = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    const remove = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      click,
      remove,
      set href(_: string) {},
      get href() {
        return "";
      },
      set download(_: string) {},
      get download() {
        return "";
      },
    } as unknown as HTMLAnchorElement);

    await downloadReportCardPdf(3);
    expect(apiRequest).toHaveBeenCalledWith("/report-cards/3/download", {
      method: "GET",
      raw: true,
    });
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();

    appendChild.mockRestore();
  });
});
