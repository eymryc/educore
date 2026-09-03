import { describe, expect, it } from "vitest";
import {
  canAdvanceHrApplication,
  canRejectHrApplication,
  groupApplicationsByStatus,
  hrApplicantName,
  jobPostingToForm,
  type HrApplication,
} from "@/shared/types/hr.types";

describe("hr.types helpers", () => {
  it("formats applicant name and gates actions", () => {
    expect(hrApplicantName({ first_name: "Awa", last_name: "Koné" })).toBe("Awa Koné");
    expect(canAdvanceHrApplication("applied")).toBe(true);
    expect(canAdvanceHrApplication("hired")).toBe(false);
    expect(canRejectHrApplication("interview")).toBe(true);
    expect(canRejectHrApplication("rejected")).toBe(false);
  });

  it("groups applications by status", () => {
    const rows = [
      { id: 1, status: "applied" },
      { id: 2, status: "screening" },
      { id: 3, status: "applied" },
    ] as HrApplication[];
    const groups = groupApplicationsByStatus(rows);
    expect(groups.applied).toHaveLength(2);
    expect(groups.screening).toHaveLength(1);
    expect(groups.hired).toHaveLength(0);
  });

  it("maps job posting to form", () => {
    expect(
      jobPostingToForm({
        id: 1,
        institution_id: 1,
        department_id: 3,
        title: "Maths",
        description: "Desc",
        application_deadline: "2026-10-01T00:00:00.000000Z",
        status: "ouvert",
      })
    ).toEqual({
      title: "Maths",
      department_id: "3",
      description: "Desc",
      application_deadline: "2026-10-01",
      status: "ouvert",
    });
  });
});
