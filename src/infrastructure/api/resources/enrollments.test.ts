import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.fn();
const apiPost = vi.fn();
const apiPut = vi.fn();
const apiDelete = vi.fn();
const apiGetWithMeta = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => apiGet(...args),
    post: (...args: unknown[]) => apiPost(...args),
    put: (...args: unknown[]) => apiPut(...args),
    delete: (...args: unknown[]) => apiDelete(...args),
    getWithMeta: (...args: unknown[]) => apiGetWithMeta(...args),
  },
}));

import {
  approveEnrollment,
  assignEnrollmentClass,
  completeReEnrollment,
  createEnrollment,
  listEnrollments,
  listReEnrollments,
  reviewEnrollment,
  uploadEnrollmentDocument,
} from "@/infrastructure/api/resources/enrollments";

describe("enrollments API resource", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists, creates and transitions", async () => {
    apiGet.mockResolvedValue([]);
    apiGetWithMeta.mockResolvedValue({
      data: [],
      meta: { current_page: 1, per_page: 25, total: 0, last_page: 1 },
    });
    apiPost.mockResolvedValue({ id: 1, status: "APPLICATION" });

    await listEnrollments();
    expect(apiGetWithMeta).toHaveBeenCalledWith("/enrollments", undefined);

    await createEnrollment({ first_name: "Awa", last_name: "Koné" });
    expect(apiPost).toHaveBeenCalledWith(
      "/enrollments",
      expect.objectContaining({ first_name: "Awa" })
    );

    await reviewEnrollment(1);
    expect(apiPost).toHaveBeenCalledWith("/enrollments/1/review");

    await approveEnrollment(1);
    expect(apiPost).toHaveBeenCalledWith("/enrollments/1/approve");

    await assignEnrollmentClass(1, 2);
    expect(apiPost).toHaveBeenCalledWith("/enrollments/1/assign-class", {
      class_group_id: 2,
    });
  });

  it("uploads a document as FormData", async () => {
    apiPost.mockResolvedValue({ id: 9, file_name: "acte.pdf" });
    const file = new File(["x"], "acte.pdf", { type: "application/pdf" });
    await uploadEnrollmentDocument(3, file);
    expect(apiPost).toHaveBeenCalledWith("/enrollments/3/documents", expect.any(FormData));
    const body = apiPost.mock.calls[0][1] as FormData;
    expect(body.get("document")).toBeInstanceOf(File);
  });

  it("lists and completes re-enrollments", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 5, status: "completed" });
    await listReEnrollments();
    expect(apiGet).toHaveBeenCalledWith("/re-enrollments");
    await completeReEnrollment(5);
    expect(apiPost).toHaveBeenCalledWith("/re-enrollments/5/complete");
  });
});
