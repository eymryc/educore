import { describe, expect, it } from "vitest";
import {
  formatReportCell,
  rowColumns,
  summaryEntries,
  supportsClassFilter,
  supportsDateFilter,
} from "@/shared/types/reports.types";

describe("reports helpers", () => {
  it("gates filters by report type", () => {
    expect(supportsClassFilter("finance")).toBe(false);
    expect(supportsClassFilter("students")).toBe(true);
    expect(supportsDateFilter("students")).toBe(false);
    expect(supportsDateFilter("attendance")).toBe(true);
  });

  it("formats cells and summary entries", () => {
    expect(formatReportCell(true)).toBe("Oui");
    expect(formatReportCell(null)).toBe("—");
    expect(summaryEntries({ grades_count: 12, average_score: 14.5 })).toEqual([
      { key: "grades_count", label: "Notes", value: "12" },
      { key: "average_score", label: "Moyenne", value: expect.stringContaining("14") },
    ]);
    expect(rowColumns([{ a: 1, b: 2 }, { b: 3, c: 4 }])).toEqual(["a", "b", "c"]);
  });
});
