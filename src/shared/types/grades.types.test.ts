import { describe, expect, it } from "vitest";
import {
  filterAssessments,
  isGradeValidated,
  summarizeGrades,
  toScoreNumber,
  type Assessment,
  type Grade,
} from "@/shared/types/grades.types";

function assessment(partial: Partial<Assessment> & Pick<Assessment, "id" | "title">): Assessment {
  return {
    institution_id: 1,
    academic_year_id: 1,
    academic_period_id: 1,
    subject_id: 1,
    class_group_id: 2,
    type: "devoir",
    date: "2026-09-02",
    coefficient: 1,
    max_score: 20,
    created_by: 1,
    ...partial,
  };
}

function grade(partial: Partial<Grade> & Pick<Grade, "id" | "score">): Grade {
  return {
    institution_id: 1,
    assessment_id: 1,
    student_id: 1,
    comment: null,
    validated_at: null,
    validated_by: null,
    recorded_by: 1,
    ...partial,
  };
}

describe("grades helpers", () => {
  it("filters assessments by class and search", () => {
    const items = [
      assessment({ id: 1, title: "Devoir algèbre", class_group_id: 2, subject: { id: 1, name: "Maths" } }),
      assessment({ id: 2, title: "TP chimie", class_group_id: 3, subject: { id: 2, name: "Chimie" } }),
    ];
    expect(filterAssessments(items, { classGroupId: "2" })).toHaveLength(1);
    expect(filterAssessments(items, { search: "chimie" })[0]?.id).toBe(2);
  });

  it("summarizes grades and detects validation", () => {
    const grades = [
      grade({ id: 1, score: "15.00" }),
      grade({ id: 2, score: 10, validated_at: "2026-09-02T10:00:00Z" }),
    ];
    expect(toScoreNumber("15.00")).toBe(15);
    expect(summarizeGrades(grades)).toEqual({ entered: 2, validated: 1, average: 12.5 });
    expect(isGradeValidated(grades[1])).toBe(true);
    expect(isGradeValidated(grades[0])).toBe(false);
  });
});
