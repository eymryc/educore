import { describe, expect, it } from "vitest";
import {
  averageCoefficient,
  classGroupsForActiveYear,
  filterBySearch,
  slotsForClass,
  type AcademicYear,
  type ClassGroup,
  type Subject,
  type TimetableSlot,
} from "@/shared/types/academic.types";

describe("academic helpers", () => {
  it("filters by search fields", () => {
    const rows = [
      { id: 1, name: "2nde A" },
      { id: 2, name: "1ère C" },
    ];
    expect(filterBySearch(rows, "2nde", (r) => r.name)).toHaveLength(1);
  });

  it("computes average coefficient", () => {
    const subjects: Subject[] = [
      {
        id: 1,
        institution_id: 1,
        name: "Maths",
        code: "M",
        coefficient: 4,
        level_id: null,
      },
      {
        id: 2,
        institution_id: 1,
        name: "SVT",
        code: "S",
        coefficient: 2,
        level_id: null,
      },
    ];
    expect(averageCoefficient(subjects)).toBe(3);
    expect(averageCoefficient([])).toBeNull();
  });

  it("filters and sorts slots for a class", () => {
    const slots: TimetableSlot[] = [
      {
        id: 1,
        institution_id: 1,
        academic_year_id: 1,
        class_group_id: 2,
        subject_id: 1,
        teacher_id: null,
        room_id: null,
        day_of_week: "tuesday",
        start_time: "10:00",
        end_time: "11:00",
      },
      {
        id: 2,
        institution_id: 1,
        academic_year_id: 1,
        class_group_id: 2,
        subject_id: 1,
        teacher_id: null,
        room_id: null,
        day_of_week: "monday",
        start_time: "08:00",
        end_time: "09:00",
      },
      {
        id: 3,
        institution_id: 1,
        academic_year_id: 1,
        class_group_id: 9,
        subject_id: 1,
        teacher_id: null,
        room_id: null,
        day_of_week: "monday",
        start_time: "08:00",
        end_time: "09:00",
      },
    ];
    const result = slotsForClass(slots, 2);
    expect(result).toHaveLength(2);
    expect(result[0].day_of_week).toBe("monday");
  });

  it("scopes class groups to the active academic year", () => {
    const years = [
      { id: 1, name: "2024-2025", is_active: false },
      { id: 2, name: "2025-2026", is_active: true },
    ] as AcademicYear[];
    const groups = [
      { id: 10, name: "6ème A", academic_year_id: 1 },
      { id: 20, name: "6ème A", academic_year_id: 2 },
      { id: 21, name: "6ème B", academic_year_id: 2 },
    ] as ClassGroup[];

    const scoped = classGroupsForActiveYear(groups, years);
    expect(scoped.map((c) => c.id)).toEqual([20, 21]);
  });
});
