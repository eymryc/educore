import { describe, expect, it } from "vitest";
import {
  enrollmentFullName,
  filterEnrollments,
  nextEnrollmentActions,
  summarizeEnrollments,
  type Enrollment,
} from "@/shared/types/enrollment.types";

function enrollment(
  partial: Partial<Enrollment> & Pick<Enrollment, "id" | "status">
): Enrollment {
  return {
    institution_id: 1,
    student_id: null,
    academic_year_id: 1,
    level_id: 1,
    class_group_id: null,
    first_name: "Awa",
    last_name: "Koné",
    origin: "NOUVELLE_INSCRIPTION",
    previous_school: null,
    birth_date: null,
    gender: "F",
    parent_contact: "0700000000",
    application_date: "2026-09-01",
    observations: null,
    reviewed_at: null,
    approved_at: null,
    payment_at: null,
    enrolled_at: null,
    class_assigned_at: null,
    rejected_at: null,
    documents: [],
    ...partial,
  };
}

describe("enrollment helpers", () => {
  it("exposes next pipeline actions", () => {
    expect(nextEnrollmentActions("APPLICATION")).toEqual(["review", "reject"]);
    expect(nextEnrollmentActions("PAYMENT")).toEqual(["enroll"]);
    expect(nextEnrollmentActions("ENROLLED")).toEqual(["assign-class"]);
    expect(nextEnrollmentActions("CLASS_ASSIGNED")).toEqual([]);
  });

  it("filters and summarizes", () => {
    const items = [
      enrollment({ id: 1, status: "APPLICATION" }),
      enrollment({ id: 2, status: "REVIEW", first_name: "Jean", last_name: "Traoré" }),
    ];
    expect(enrollmentFullName(items[0]!)).toBe("Koné Awa");
    expect(filterEnrollments(items, { search: "traoré" })).toHaveLength(1);
    expect(summarizeEnrollments(items).APPLICATION).toBe(1);
    expect(summarizeEnrollments(items).total).toBe(2);
  });
});
