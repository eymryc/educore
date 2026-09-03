import type { AcademicPeriod, ClassGroup, NamedRef, Subject } from "@/shared/types/academic.types";
import type { Student } from "@/shared/types/student.types";

export type AssessmentType = "devoir" | "composition" | "interrogation" | "tp";

export interface Assessment {
  id: number;
  institution_id: number;
  academic_year_id: number;
  academic_period_id: number;
  subject_id: number;
  class_group_id: number;
  title: string;
  type: AssessmentType;
  date: string;
  coefficient: number | string;
  max_score: number | string;
  created_by: number | null;
  subject?: Subject | NamedRef | null;
  class_group?: ClassGroup | NamedRef | null;
  academic_period?: AcademicPeriod | NamedRef | null;
  grades?: Grade[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Grade {
  id: number;
  institution_id: number;
  assessment_id: number;
  student_id: number;
  score: number | string;
  comment: string | null;
  validated_at: string | null;
  validated_by: number | null;
  recorded_by: number | null;
  student?: Student | null;
  assessment?: Assessment | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GradingSetting {
  id: number;
  institution_id: number;
  scale_max: number | string;
  passing_score: number | string;
  decimal_places: number;
  weighted_average: boolean;
  ranking_method: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StudentGradeSubjectSummary {
  subject_id: number;
  subject_name: string | null;
  average: number | null;
}

export interface StudentGradeSummary {
  student_id: number;
  academic_period_id: number;
  general_average: number | null;
  passing_score: number | string;
  subjects: StudentGradeSubjectSummary[];
}

export interface ClassRankingRow {
  student_id: number;
  student_name: string;
  average: number;
  rank?: number;
}

export interface ClassRankings {
  class_group_id: number;
  academic_period_id: number;
  rankings: ClassRankingRow[];
}

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  devoir: "Devoir",
  composition: "Composition",
  interrogation: "Interrogation",
  tp: "Travaux pratiques",
};

export function toScoreNumber(value: number | string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function isGradeValidated(grade: Pick<Grade, "validated_at"> | null | undefined): boolean {
  return Boolean(grade?.validated_at);
}

export function filterAssessments(
  items: Assessment[],
  filters: {
    search?: string;
    classGroupId?: string;
    subjectId?: string;
    periodId?: string;
    type?: string;
  }
): Assessment[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((a) => {
    if (filters.classGroupId && String(a.class_group_id) !== filters.classGroupId) return false;
    if (filters.subjectId && String(a.subject_id) !== filters.subjectId) return false;
    if (filters.periodId && String(a.academic_period_id) !== filters.periodId) return false;
    if (filters.type && a.type !== filters.type) return false;
    if (!q) return true;
    const subjectName =
      a.subject && "name" in a.subject ? String(a.subject.name ?? "") : "";
    const className =
      a.class_group && "name" in a.class_group ? String(a.class_group.name ?? "") : "";
    return `${a.title} ${subjectName} ${className}`.toLowerCase().includes(q);
  });
}

export function summarizeGrades(grades: Grade[]): {
  entered: number;
  validated: number;
  average: number | null;
} {
  if (grades.length === 0) return { entered: 0, validated: 0, average: null };
  const scores = grades.map((g) => toScoreNumber(g.score));
  const average = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
  return {
    entered: grades.length,
    validated: grades.filter((g) => isGradeValidated(g)).length,
    average,
  };
}
