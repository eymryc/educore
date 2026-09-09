import type { AuthUser } from "@/shared/types/api.types";

const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "SECRETARY",
  "ACCOUNTANT",
  "TEACHER",
  "HEAD_TEACHER",
  "SUPERVISOR",
  "CENSEUR",
  "INTENDANT",
  "LIBRARIAN",
  "NURSE",
  "HR_MANAGER",
] as const;

export function hasRole(user: AuthUser | null | undefined, role: string): boolean {
  return Boolean(user?.roles?.includes(role));
}

export function hasAnyRole(user: AuthUser | null | undefined, roles: string[]): boolean {
  return roles.some((role) => hasRole(user, role));
}

export function can(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (hasAnyRole(user, ["SUPER_ADMIN", "ADMIN"])) return true;
  return user.permissions?.includes(permission) ?? false;
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return hasAnyRole(user, [...ADMIN_ROLES]);
}

export function isStudentUser(user: AuthUser | null | undefined): boolean {
  return hasRole(user, "STUDENT") && !isAdminUser(user);
}

export function isTeacherOnly(user: AuthUser | null | undefined): boolean {
  return (
    hasAnyRole(user, ["TEACHER", "HEAD_TEACHER"]) &&
    !hasAnyRole(user, ["SUPER_ADMIN", "ADMIN", "DIRECTOR"])
  );
}

export function isParentUser(user: AuthUser | null | undefined): boolean {
  return hasRole(user, "PARENT") && !isAdminUser(user);
}

export function homePathForUser(user: AuthUser): string {
  if (isStudentUser(user)) return "/portal/student";
  if (isParentUser(user)) return "/portal/parent";
  return "/dashboard";
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Administrateur",
  DIRECTOR: "Proviseur",
  SECRETARY: "Secrétaire",
  ACCOUNTANT: "Comptable",
  TEACHER: "Enseignant",
  HEAD_TEACHER: "Professeur principal",
  SUPERVISOR: "Surveillant général",
  CENSEUR: "Censeur",
  INTENDANT: "Intendant",
  STUDENT: "Élève",
  PARENT: "Parent",
  LIBRARIAN: "Bibliothécaire",
  NURSE: "Infirmier",
  HR_MANAGER: "RH",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function primaryRoleLabel(user: AuthUser | null | undefined): string {
  if (!user?.roles?.length) return "Utilisateur";
  return roleLabel(user.roles[0] ?? "");
}
