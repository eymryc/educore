import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
const put = vi.fn();
const del = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    put: (...args: unknown[]) => put(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}));

import {
  advanceHrApplication,
  createHrJobPosting,
  listHrApplications,
  listHrJobPostings,
  rejectHrApplication,
} from "@/infrastructure/api/resources/hr";

describe("hr resource", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    del.mockReset();
  });

  it("lists job postings and applications", async () => {
    get.mockResolvedValueOnce([{ id: 1, title: "Maths" }]);
    get.mockResolvedValueOnce([{ id: 2, first_name: "Awa" }]);

    await expect(listHrJobPostings({ status: "ouvert" })).resolves.toEqual([
      { id: 1, title: "Maths" },
    ]);
    expect(get).toHaveBeenCalledWith("/hr-job-postings", { status: "ouvert" });

    await expect(listHrApplications({ hr_job_posting_id: 1 })).resolves.toEqual([
      { id: 2, first_name: "Awa" },
    ]);
    expect(get).toHaveBeenCalledWith("/hr-applications", { hr_job_posting_id: 1 });
  });

  it("creates posting and advances / rejects application", async () => {
    post.mockResolvedValueOnce({ id: 1, title: "EPS" });
    post.mockResolvedValueOnce({ id: 9, status: "screening" });
    post.mockResolvedValueOnce({ id: 9, status: "rejected" });

    await createHrJobPosting({
      title: "EPS",
      description: "Poste",
      application_deadline: "2026-12-01",
    });
    expect(post).toHaveBeenCalledWith("/hr-job-postings", expect.any(Object));

    await expect(advanceHrApplication(9)).resolves.toEqual({
      id: 9,
      status: "screening",
    });
    expect(post).toHaveBeenCalledWith("/hr-applications/9/advance", {});

    await expect(rejectHrApplication(9)).resolves.toEqual({
      id: 9,
      status: "rejected",
    });
    expect(post).toHaveBeenCalledWith("/hr-applications/9/reject");
  });

  it("processes payroll and approves leave", async () => {
    const {
      processStaffPayroll,
      approveStaffLeave,
      listStaffMembers,
    } = await import("@/infrastructure/api/resources/hr");

    post.mockResolvedValueOnce({ id: 1, status: "processed" });
    post.mockResolvedValueOnce({ id: 2, status: "approved" });
    get.mockResolvedValueOnce([{ id: 3, first_name: "Awa" }]);

    await expect(processStaffPayroll(1)).resolves.toEqual({
      id: 1,
      status: "processed",
    });
    expect(post).toHaveBeenCalledWith("/staff-payrolls/1/process");

    await expect(approveStaffLeave(2)).resolves.toEqual({
      id: 2,
      status: "approved",
    });
    expect(post).toHaveBeenCalledWith("/staff-leaves/2/approve");

    await expect(listStaffMembers()).resolves.toEqual([{ id: 3, first_name: "Awa" }]);
    expect(get).toHaveBeenCalledWith("/staff-members");
  });
});
