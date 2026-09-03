import { describe, expect, it } from "vitest";
import {
  can,
  hasAnyRole,
  homePathForUser,
  isAdminUser,
  isParentUser,
  isStudentUser,
  isTeacherOnly,
  primaryRoleLabel,
} from "@/shared/lib/permissions";
import type { AuthUser } from "@/shared/types/api.types";

function user(partial: Partial<AuthUser> & Pick<AuthUser, "roles" | "permissions">): AuthUser {
  return {
    id: 1,
    name: "Test",
    email: "test@educore.ci",
    institution_id: 1,
    email_verified_at: null,
    created_at: null,
    ...partial,
  };
}

describe("permissions", () => {
  it("grants all permissions to ADMIN", () => {
    const admin = user({ roles: ["ADMIN"], permissions: [] });
    expect(can(admin, "students.view")).toBe(true);
  });

  it("checks explicit permissions for teachers", () => {
    const teacher = user({ roles: ["TEACHER"], permissions: ["grades.view"] });
    expect(can(teacher, "grades.view")).toBe(true);
    expect(can(teacher, "payments.refund")).toBe(false);
  });

  it("resolves home paths by role", () => {
    expect(homePathForUser(user({ roles: ["STUDENT"], permissions: [] }))).toBe("/portal/student");
    expect(homePathForUser(user({ roles: ["PARENT"], permissions: [] }))).toBe("/portal/parent");
    expect(homePathForUser(user({ roles: ["ADMIN"], permissions: [] }))).toBe("/dashboard");
  });

  it("detects admin / student / parent personas", () => {
    expect(isAdminUser(user({ roles: ["SECRETARY"], permissions: [] }))).toBe(true);
    expect(isStudentUser(user({ roles: ["STUDENT"], permissions: [] }))).toBe(true);
    expect(isParentUser(user({ roles: ["PARENT"], permissions: [] }))).toBe(true);
    expect(isStudentUser(user({ roles: ["ADMIN", "STUDENT"], permissions: [] }))).toBe(false);
  });

  it("detects teacher-only users", () => {
    expect(isTeacherOnly(user({ roles: ["TEACHER"], permissions: [] }))).toBe(true);
    expect(isTeacherOnly(user({ roles: ["HEAD_TEACHER"], permissions: [] }))).toBe(true);
    expect(isTeacherOnly(user({ roles: ["ADMIN", "TEACHER"], permissions: [] }))).toBe(false);
    expect(isTeacherOnly(user({ roles: ["DIRECTOR", "TEACHER"], permissions: [] }))).toBe(false);
  });

  it("formats primary role label in French", () => {
    expect(primaryRoleLabel(user({ roles: ["DIRECTOR"], permissions: [] }))).toBe("Proviseur");
    expect(hasAnyRole(user({ roles: ["TEACHER"], permissions: [] }), ["TEACHER", "ADMIN"])).toBe(true);
  });
});
