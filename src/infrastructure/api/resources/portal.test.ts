import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  fetchAdminDashboard,
  fetchParentDashboard,
  fetchStudentDashboard,
} from "@/infrastructure/api/resources/dashboard";
import {
  listAssignments,
  listSubmissions,
  submitAssignment,
} from "@/infrastructure/api/resources/assignments";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/infrastructure/api/resources/notifications";

describe("portal resources", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("fetches student and parent dashboards", async () => {
    get.mockResolvedValueOnce({ linked: true, student_id: 1 });
    get.mockResolvedValueOnce({ linked: true, children: [] });

    await expect(fetchStudentDashboard()).resolves.toEqual({
      linked: true,
      student_id: 1,
    });
    expect(get).toHaveBeenCalledWith("/dashboard/student");

    await expect(fetchParentDashboard()).resolves.toEqual({
      linked: true,
      children: [],
    });
    expect(get).toHaveBeenCalledWith("/dashboard/parent");
  });

  it("keeps admin dashboard fetch", async () => {
    get.mockResolvedValue({ students_count: 1 });
    await fetchAdminDashboard();
    expect(get).toHaveBeenCalledWith("/dashboard/admin");
  });

  it("lists assignments and submits multipart", async () => {
    get.mockResolvedValueOnce([{ id: 1, title: "DM" }]);
    get.mockResolvedValueOnce([{ id: 9, assignment_id: 1 }]);
    post.mockResolvedValue({ id: 9, status: "SUBMITTED" });

    await listAssignments();
    expect(get).toHaveBeenCalledWith("/assignments", undefined);

    await listSubmissions({ student_id: 3 });
    expect(get).toHaveBeenCalledWith("/submissions", { student_id: 3 });

    const file = new File(["x"], "devoir.pdf", { type: "application/pdf" });
    await submitAssignment(1, { comment: "Voici", files: [file] });
    expect(post).toHaveBeenCalledWith(
      "/assignments/1/submit",
      expect.any(FormData)
    );
    const fd = post.mock.calls[0][1] as FormData;
    expect(fd.get("comment")).toBe("Voici");
    expect(fd.getAll("files[]")).toHaveLength(1);
  });

  it("lists and marks notifications", async () => {
    get.mockResolvedValue([{ id: "n1", title: "Hi" }]);
    post.mockResolvedValueOnce({ id: "n1", read_at: "2026-01-01" });
    post.mockResolvedValueOnce(null);

    await listNotifications({ per_page: 10 });
    expect(get).toHaveBeenCalledWith("/notifications", { per_page: 10 });

    await markNotificationRead("n1");
    expect(post).toHaveBeenCalledWith("/notifications/n1/read");

    await markAllNotificationsRead();
    expect(post).toHaveBeenCalledWith("/notifications/read-all");
  });

  it("grades a submission", async () => {
    const { gradeSubmission } = await import(
      "@/infrastructure/api/resources/assignments"
    );
    post.mockResolvedValue({ id: 50, status: "GRADED", score: 14 });
    await gradeSubmission(50, { score: 14, feedback: "OK" });
    expect(post).toHaveBeenCalledWith("/submissions/50/grade", {
      score: 14,
      feedback: "OK",
    });
  });
});
