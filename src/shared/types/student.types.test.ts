import { describe, expect, it } from "vitest";
import {
  filterStudents,
  studentFullName,
  type Student,
} from "@/shared/types/student.types";

function student(partial: Partial<Student> & Pick<Student, "id" | "first_name" | "last_name">): Student {
  return {
    institution_id: 1,
    user_id: null,
    matricule: "ELV-2024-001",
    birth_date: "2008-01-01",
    gender: "F",
    email: null,
    phone: null,
    address: null,
    level_id: 1,
    class_group_id: 2,
    status: "active",
    enrolled_at: null,
    avatar_url: null,
    ...partial,
  };
}

describe("student helpers", () => {
  it("formats full name as last then first", () => {
    expect(studentFullName({ first_name: "Aminata", last_name: "Koné" })).toBe("Koné Aminata");
  });

  it("filters by search, level, class and status", () => {
    const rows = [
      student({ id: 1, first_name: "Aminata", last_name: "Koné", matricule: "A-1", status: "active" }),
      student({
        id: 2,
        first_name: "Jean",
        last_name: "Traoré",
        matricule: "B-2",
        status: "inactive",
        level_id: 3,
        class_group_id: 9,
      }),
    ];

    expect(filterStudents(rows, { search: "koné" })).toHaveLength(1);
    expect(filterStudents(rows, { status: "inactive" })[0].id).toBe(2);
    expect(filterStudents(rows, { levelId: "3", classGroupId: "9" })).toHaveLength(1);
    expect(filterStudents(rows, { search: "zzz" })).toHaveLength(0);
  });
});
