import { describe, expect, it } from "vitest";
import {
  canCancelDiscipline,
  canDeleteDiscipline,
  canEditDiscipline,
  canValidateDiscipline,
  filterDisciplineRecords,
  summarizeDiscipline,
  type DisciplinaryRecord,
} from "@/shared/types/discipline.types";

function record(
  partial: Partial<DisciplinaryRecord> & Pick<DisciplinaryRecord, "id" | "status" | "type">
): DisciplinaryRecord {
  return {
    institution_id: 1,
    student_id: 7,
    academic_year_id: 1,
    class_group_id: 2,
    title: "Retard",
    description: null,
    occurred_at: "2026-09-02",
    location: null,
    sanction_type: null,
    exclusion_start: null,
    exclusion_end: null,
    council_date: null,
    council_decision: null,
    validated_at: null,
    validated_by: null,
    recorded_by: 1,
    student: {
      id: 7,
      institution_id: 1,
      user_id: null,
      matricule: "EL-007",
      first_name: "Awa",
      last_name: "Koné",
      birth_date: "2010-01-01",
      gender: "F",
      email: null,
      phone: null,
      address: null,
      level_id: 1,
      class_group_id: 2,
      status: "active",
      enrolled_at: null,
      avatar_url: null,
    },
    ...partial,
  };
}

describe("discipline helpers", () => {
  it("gates actions by status", () => {
    expect(canEditDiscipline("RECORDED")).toBe(true);
    expect(canEditDiscipline("VALIDATED")).toBe(false);
    expect(canValidateDiscipline("RECORDED")).toBe(true);
    expect(canCancelDiscipline("VALIDATED")).toBe(true);
    expect(canDeleteDiscipline("VALIDATED")).toBe(false);
    expect(canDeleteDiscipline("CANCELLED")).toBe(true);
  });

  it("filters and summarizes", () => {
    const items = [
      record({ id: 1, status: "RECORDED", type: "INCIDENT", title: "Bagarre" }),
      record({ id: 2, status: "VALIDATED", type: "WARNING", title: "Retard" }),
    ];
    expect(filterDisciplineRecords(items, { type: "WARNING" })).toHaveLength(1);
    expect(filterDisciplineRecords(items, { search: "koné" })).toHaveLength(2);
    expect(summarizeDiscipline(items)).toEqual({
      total: 2,
      recorded: 1,
      validated: 1,
      cancelled: 0,
    });
  });
});
