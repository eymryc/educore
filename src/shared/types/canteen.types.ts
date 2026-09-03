import type { Student } from "@/shared/types/student.types";
import { studentFullName } from "@/shared/types/student.types";

export type CanteenDayOfWeek =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi";

export type CanteenAccountStatus = "ACTIVE" | "SUSPENDED";
export type CanteenPaymentMethod = "especes" | "mobile";
export type CanteenDietType = "allergie" | "intolerance" | "religieux" | "medical";

export interface CanteenMenu {
  id: number;
  institution_id: number;
  day_of_week: CanteenDayOfWeek;
  starter: string;
  main_course: string;
  dessert: string | null;
  price: number | string;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CanteenTopup {
  id: number;
  institution_id: number;
  canteen_account_id: number;
  amount: number | string;
  paid_at: string;
  payment_method: CanteenPaymentMethod;
  recorded_by: number | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CanteenAccount {
  id: number;
  institution_id: number;
  student_id: number;
  balance: number | string;
  status: CanteenAccountStatus;
  student?: Student | null;
  topups?: CanteenTopup[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CanteenSpecialDiet {
  id: number;
  institution_id: number;
  student_id: number;
  diet_type: CanteenDietType;
  allergens: string;
  notes: string | null;
  is_active: boolean;
  student?: Student | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const CANTEEN_DAY_LABELS: Record<CanteenDayOfWeek, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
};

export const CANTEEN_ACCOUNT_STATUS_LABELS: Record<CanteenAccountStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
};

export const CANTEEN_PAYMENT_LABELS: Record<CanteenPaymentMethod, string> = {
  especes: "Espèces",
  mobile: "Mobile Money",
};

export const CANTEEN_DIET_TYPE_LABELS: Record<CanteenDietType, string> = {
  allergie: "Allergie",
  intolerance: "Intolérance",
  religieux: "Régime religieux",
  medical: "Régime médical",
};

export const CANTEEN_DAYS_ORDER: CanteenDayOfWeek[] = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
];

export function canteenAccountLabel(row: CanteenAccount): string {
  if (row.student) return studentFullName(row.student);
  return `Élève #${row.student_id}`;
}

export function canteenMenuToForm(row: CanteenMenu): Record<string, string | boolean> {
  return {
    day_of_week: row.day_of_week ?? "lundi",
    starter: row.starter ?? "",
    main_course: row.main_course ?? "",
    dessert: row.dessert ?? "",
    price: String(row.price ?? ""),
    is_active: Boolean(row.is_active),
  };
}

export function canteenAccountToForm(
  row: CanteenAccount
): Record<string, string | boolean> {
  return {
    student_id: String(row.student_id ?? ""),
    status: row.status ?? "ACTIVE",
  };
}

export function canteenSpecialDietToForm(
  row: CanteenSpecialDiet
): Record<string, string | boolean> {
  return {
    student_id: String(row.student_id ?? ""),
    diet_type: row.diet_type ?? "allergie",
    allergens: row.allergens ?? "",
    notes: row.notes ?? "",
    is_active: Boolean(row.is_active),
  };
}
