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
  createAssessment,
  listAssessments,
  updateAssessment,
} from "@/infrastructure/api/resources/assessments";
import {
  createGrade,
  getClassRankings,
  getGradingSettings,
  getStudentGradeSummary,
  listGrades,
  updateGradingSettings,
  validateGrade,
} from "@/infrastructure/api/resources/grades";

describe("assessments & grades API resources", () => {
  beforeEach(() => {
    apiGet.mockReset();
    apiPost.mockReset();
    apiPut.mockReset();
    apiDelete.mockReset();
  });

  it("lists and creates assessments", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 1 });
    await listAssessments({ class_group_id: 2 });
    expect(apiGet).toHaveBeenCalledWith("/assessments", { class_group_id: 2 });
    await createAssessment({ title: "Devoir 1", type: "devoir" });
    expect(apiPost).toHaveBeenCalledWith("/assessments", expect.objectContaining({ title: "Devoir 1" }));
    await updateAssessment(1, { title: "Devoir 1b" });
    expect(apiPut).toHaveBeenCalledWith("/assessments/1", { title: "Devoir 1b" });
  });

  it("lists grades, validates and updates grading settings", async () => {
    apiGet.mockResolvedValue([]);
    apiPost.mockResolvedValue({ id: 9 });
    apiPut.mockResolvedValue({ id: 1, scale_max: 20 });

    await listGrades({ assessment_id: 3 });
    expect(apiGet).toHaveBeenCalledWith("/grades", { assessment_id: 3 });

    await createGrade({ assessment_id: 3, student_id: 7, score: 15 });
    expect(apiPost).toHaveBeenCalledWith(
      "/grades",
      expect.objectContaining({ assessment_id: 3, score: 15 })
    );

    await validateGrade(9);
    expect(apiPost).toHaveBeenCalledWith("/grades/9/validate");

    await getGradingSettings();
    expect(apiGet).toHaveBeenCalledWith("/grading-settings");
    await updateGradingSettings({ scale_max: 20, passing_score: 10 });
    expect(apiPut).toHaveBeenCalledWith(
      "/grading-settings",
      expect.objectContaining({ scale_max: 20 })
    );
  });

  it("fetches grade summary and class rankings", async () => {
    apiGet.mockResolvedValue({ student_id: 7, rankings: [] });
    await getStudentGradeSummary(7, 2);
    expect(apiGet).toHaveBeenCalledWith("/students/7/grade-summary", {
      academic_period_id: 2,
    });
    await getClassRankings(3, 2);
    expect(apiGet).toHaveBeenCalledWith("/class-groups/3/rankings", {
      academic_period_id: 2,
    });
  });
});
