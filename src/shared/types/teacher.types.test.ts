import { describe, expect, it } from "vitest";
import {
  filterTeachers,
  teacherFullName,
  type Teacher,
} from "@/shared/types/teacher.types";

function teacher(
  partial: Partial<Teacher> & Pick<Teacher, "id" | "first_name" | "last_name">
): Teacher {
  return {
    institution_id: 1,
    user_id: 1,
    employee_number: "ENS-001",
    email: "t@ecole.ci",
    phone: "01",
    main_subject_id: 1,
    grade_title: null,
    hired_at: null,
    status: "active",
    assignments_count: 0,
    ...partial,
  };
}

describe("teacher helpers", () => {
  it("formats full name", () => {
    expect(teacherFullName({ first_name: "Fatou", last_name: "Diabaté" })).toBe("Diabaté Fatou");
  });

  it("filters by search, status and subject", () => {
    const rows = [
      teacher({
        id: 1,
        first_name: "Fatou",
        last_name: "Diabaté",
        status: "active",
        main_subject_id: 1,
        main_subject: { id: 1, name: "Maths" },
      }),
      teacher({
        id: 2,
        first_name: "Jean",
        last_name: "Kouassi",
        status: "on_leave",
        main_subject_id: 2,
        employee_number: "ENS-002",
      }),
    ];

    expect(filterTeachers(rows, { search: "maths" })).toHaveLength(1);
    expect(filterTeachers(rows, { status: "on_leave" })[0].id).toBe(2);
    expect(filterTeachers(rows, { subjectId: "1" })).toHaveLength(1);
  });
});
