import { describe, expect, it } from "vitest";
import {
  isJustifiable,
  summarizeAttendance,
  type AttendanceRecord,
} from "@/shared/types/attendance.types";

function record(status: AttendanceRecord["status"]): AttendanceRecord {
  return {
    id: 1,
    institution_id: 1,
    student_id: 1,
    class_group_id: 1,
    academic_year_id: 1,
    date: "2026-09-02",
    status,
    notes: null,
    justification: null,
    justified_at: null,
    justified_by: null,
    validated_at: null,
    validated_by: null,
    recorded_by: null,
  };
}

describe("attendance helpers", () => {
  it("summarizes statuses", () => {
    expect(
      summarizeAttendance([
        record("PRESENT"),
        record("PRESENT"),
        record("ABSENT"),
        record("LATE"),
        record("JUSTIFIED"),
      ])
    ).toEqual({ total: 5, present: 2, absent: 1, late: 1, justified: 1 });
  });

  it("detects justifiable statuses", () => {
    expect(isJustifiable("ABSENT")).toBe(true);
    expect(isJustifiable("LATE")).toBe(true);
    expect(isJustifiable("PRESENT")).toBe(false);
    expect(isJustifiable("JUSTIFIED")).toBe(false);
  });
});
