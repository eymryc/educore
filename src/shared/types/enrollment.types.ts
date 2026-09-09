import type { AcademicYear, ClassGroup, NamedRef } from "@/shared/types/academic.types";
import type { PaginationMeta } from "@/shared/types/api.types";
import type { Student } from "@/shared/types/student.types";

export type EnrollmentStatus =
  | "APPLICATION"
  | "REVIEW"
  | "APPROVED"
  | "PAYMENT"
  | "ENROLLED"
  | "CLASS_ASSIGNED"
  | "REJECTED";

export type EnrollmentOrigin =
  | "NOUVELLE_INSCRIPTION"
  | "AFFECTATION_CEPE"
  | "AFFECTATION_BEPC"
  | "TRANSFERT";

export const ENROLLMENT_ORIGIN_LABELS: Record<EnrollmentOrigin, string> = {
  NOUVELLE_INSCRIPTION: "Nouvelle inscription",
  AFFECTATION_CEPE: "Affectation 6ème (CEPE)",
  AFFECTATION_BEPC: "Orientation 2nde (BEPC)",
  TRANSFERT: "Transfert (DELC)",
};

export type YearEndDecision = "A" | "R" | "E";

export const YEAR_END_DECISION_LABELS: Record<YearEndDecision, string> = {
  A: "Admis(e)",
  R: "Redouble",
  E: "Exclu(e)",
};

export type EnrollmentDocumentKind =
  | "birth_certificate"
  | "photos"
  | "report_card"
  | "assignment_sheet"
  | "orientation_sheet"
  | "transfer_document"
  | "mena_receipt"
  | "cmu"
  | "vaccination"
  | "parent_id"
  | "school_certificate"
  | "clearance";

export const ENROLLMENT_DOCUMENT_LABELS: Record<EnrollmentDocumentKind, string> = {
  birth_certificate: "Extrait d'acte de naissance",
  photos: "Photos d'identité",
  report_card: "Bulletin T3 / décision de fin d'année",
  assignment_sheet: "Fiche d'affectation (6ème)",
  orientation_sheet: "Fiche d'orientation (2nde)",
  transfer_document: "Document de transfert (DELC / DEEP)",
  mena_receipt: "Reçu d'inscription en ligne MENA / DESPS",
  cmu: "Carte CMU ou récépissé d'enrôlement",
  vaccination: "Certificat de vaccination",
  parent_id: "Pièce d'identité du parent / tuteur",
  school_certificate: "Certificat de scolarité",
  clearance: "Quitus de non-redevance",
};

export function suggestedEnrollmentDocuments(
  origin: EnrollmentOrigin | string
): EnrollmentDocumentKind[] {
  const base: EnrollmentDocumentKind[] = [
    "birth_certificate",
    "photos",
    "parent_id",
    "mena_receipt",
  ];
  if (origin === "AFFECTATION_CEPE") {
    return [...base, "assignment_sheet", "report_card", "vaccination"];
  }
  if (origin === "AFFECTATION_BEPC") {
    return [...base, "orientation_sheet", "report_card"];
  }
  if (origin === "TRANSFERT") {
    return [...base, "transfer_document", "school_certificate", "clearance", "report_card"];
  }
  return [...base, "vaccination", "report_card"];
}

export interface EnrollmentDocument {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
}

export interface Enrollment {
  id: number;
  institution_id: number;
  student_id: number | null;
  academic_year_id: number;
  level_id: number;
  class_group_id: number | null;
  first_name: string;
  last_name: string;
  origin: EnrollmentOrigin;
  previous_school: string | null;
  national_matricule?: string | null;
  birth_date: string | null;
  birth_place?: string | null;
  nationality?: string | null;
  previous_level?: string | null;
  year_end_decision?: YearEndDecision | string | null;
  mena_receipt_number?: string | null;
  mena_paid_at?: string | null;
  gender: "M" | "F" | null;
  parent_contact: string;
  parent_full_name?: string | null;
  application_date: string;
  status: EnrollmentStatus;
  observations: string | null;
  provided_documents?: EnrollmentDocumentKind[] | string[];
  reviewed_at: string | null;
  approved_at: string | null;
  payment_at: string | null;
  enrolled_at: string | null;
  class_assigned_at: string | null;
  rejected_at: string | null;
  documents?: EnrollmentDocument[];
  student?: Student | null;
  academic_year?: AcademicYear | NamedRef | null;
  level?: NamedRef | null;
  class_group?: ClassGroup | NamedRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EnrollmentListMeta extends PaginationMeta {
  status_counts?: Partial<Record<EnrollmentStatus, number>>;
}

export interface EnrollmentListResult {
  data: Enrollment[];
  meta: EnrollmentListMeta;
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  APPLICATION: "Dossier déposé",
  REVIEW: "Examen des pièces",
  APPROVED: "Validé",
  PAYMENT: "Paiement",
  ENROLLED: "Inscrit",
  CLASS_ASSIGNED: "Classe affectée",
  REJECTED: "Refusée",
};

export const ENROLLMENT_PIPELINE: EnrollmentStatus[] = [
  "APPLICATION",
  "REVIEW",
  "APPROVED",
  "PAYMENT",
  "ENROLLED",
  "CLASS_ASSIGNED",
];

export type EnrollmentAction =
  | "review"
  | "approve"
  | "payment"
  | "enroll"
  | "assign-class"
  | "reject";

export type ReEnrollmentStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export interface ReEnrollment {
  id: number;
  institution_id: number;
  student_id: number;
  academic_year_id: number;
  previous_class_group_id: number | null;
  new_class_group_id: number | null;
  status: ReEnrollmentStatus;
  year_end_decision?: YearEndDecision | string | null;
  notes: string | null;
  /** Déduit côté API de la comparaison des niveaux — pas une case à cocher. */
  is_repeat: boolean;
  completed_at: string | null;
  student?: Student | null;
  academic_year?: AcademicYear | NamedRef | null;
  previous_class_group?: ClassGroup | NamedRef | null;
  new_class_group?: ClassGroup | NamedRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const RE_ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  PENDING: "En attente",
  in_progress: "En cours",
  IN_PROGRESS: "En cours",
  completed: "Terminée",
  COMPLETED: "Terminée",
  cancelled: "Annulée",
  CANCELLED: "Annulée",
};

export function canCompleteReEnrollment(
  row: Pick<ReEnrollment, "status" | "completed_at">
): boolean {
  if (row.completed_at) return false;
  const s = String(row.status).toLowerCase();
  return s !== "completed" && s !== "cancelled";
}

export function enrollmentFullName(
  row: Pick<Enrollment, "first_name" | "last_name">
): string {
  return `${row.last_name} ${row.first_name}`.trim();
}

export function nextEnrollmentActions(status: EnrollmentStatus): EnrollmentAction[] {
  switch (status) {
    case "APPLICATION":
      return ["review", "reject"];
    case "REVIEW":
      return ["approve", "reject"];
    case "APPROVED":
      return ["payment", "reject"];
    case "PAYMENT":
      return ["enroll"];
    case "ENROLLED":
      return ["assign-class"];
    default:
      return [];
  }
}

export function canEditEnrollment(status: EnrollmentStatus): boolean {
  return status !== "CLASS_ASSIGNED" && status !== "REJECTED";
}

export function filterEnrollments(
  items: Enrollment[],
  filters: {
    search?: string;
    status?: string;
    yearId?: string;
    levelId?: string;
  }
): Enrollment[] {
  const q = filters.search?.trim().toLowerCase() ?? "";
  return items.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.yearId && String(row.academic_year_id) !== filters.yearId) return false;
    if (filters.levelId && String(row.level_id) !== filters.levelId) return false;
    if (!q) return true;
    return `${enrollmentFullName(row)} ${row.parent_contact}`.toLowerCase().includes(q);
  });
}

export function summarizeEnrollments(items: Enrollment[]): Record<EnrollmentStatus | "total", number> {
  const summary: Record<string, number> = {
    total: items.length,
    APPLICATION: 0,
    REVIEW: 0,
    APPROVED: 0,
    PAYMENT: 0,
    ENROLLED: 0,
    CLASS_ASSIGNED: 0,
    REJECTED: 0,
  };
  for (const row of items) {
    summary[row.status] = (summary[row.status] ?? 0) + 1;
  }
  return summary as Record<EnrollmentStatus | "total", number>;
}
