import type { Student } from "@/shared/types/student.types";

export type GuardianRelationship = "pere" | "mere" | "tuteur" | "autre";

export interface Guardian {
  id: number;
  institution_id: number;
  user_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profession: string | null;
  address: string | null;
  students_count?: number;
  students?: Student[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StudentGuardianLink {
  id: number;
  institution_id: number;
  student_id: number;
  guardian_id: number;
  relationship: GuardianRelationship;
  is_primary: boolean;
  student?: Student | null;
}

export const GUARDIAN_RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  pere: "Père",
  mere: "Mère",
  tuteur: "Tuteur légal",
  autre: "Autre",
};

export function guardianFullName(
  guardian: Pick<Guardian, "first_name" | "last_name">
): string {
  return `${guardian.last_name} ${guardian.first_name}`.trim();
}

export function filterGuardians(
  guardians: Guardian[],
  filters: { search?: string; portal?: "all" | "with" | "without" }
): Guardian[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return guardians.filter((g) => {
    if (filters.portal === "with" && !g.user_id) return false;
    if (filters.portal === "without" && g.user_id) return false;
    if (!q) return true;
    const haystack = `${g.first_name} ${g.last_name} ${g.email} ${g.phone}`.toLowerCase();
    return haystack.includes(q);
  });
}
