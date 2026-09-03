import { describe, expect, it } from "vitest";
import {
  attendanceRate,
  attendanceTotal,
  formatCompactNumber,
  formatFcfa,
  pctLabel,
} from "@/shared/types/dashboard.types";

describe("dashboard helpers", () => {
  it("computes attendance rate and ignores empty days", () => {
    expect(
      attendanceRate({ present: 8, absent: 2, late: 0, justified: 0 })
    ).toBe(80);
    expect(
      attendanceRate({ present: 0, absent: 0, late: 0, justified: 0 })
    ).toBeNull();
    expect(attendanceTotal({ present: 8, absent: 2, late: 1, justified: 1 })).toBe(12);
  });

  it("formats amounts in FCFA", () => {
    expect(formatFcfa(15000)).toMatch(/15[\u202f\s]?000/);
    expect(formatFcfa(15000)).toMatch(/F/);
  });

  it("formats compact numbers and percent labels", () => {
    expect(formatCompactNumber(1152)).toMatch(/1[\u202f\s]?152/);
    expect(pctLabel(90)).toContain("90");
    expect(pctLabel(null)).toBe("—");
  });
});
