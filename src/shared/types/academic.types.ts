export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface NamedRef {
  id: number;
  name: string;
  code?: string | null;
}

export interface AcademicYear extends NamedRef {
  start_date?: string | null;
  end_date?: string | null;
  /** @deprecated prefer start_date */
  starts_on?: string | null;
  /** @deprecated prefer end_date */
  ends_on?: string | null;
  is_active?: boolean;
  status?: string | null;
  closed_at?: string | null;
}

export interface AcademicHoliday {
  id: number;
  institution_id: number;
  academic_year_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  academic_year?: AcademicYear | NamedRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Level extends NamedRef {
  institution_id?: number;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Series extends NamedRef {
  institution_id?: number;
  level_id: number;
  level?: NamedRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ClassSubject {
  id: number;
  institution_id: number;
  class_group_id: number;
  subject_id: number;
  coefficient: number | string | null;
  class_group?: NamedRef | ClassGroup | null;
  subject?: NamedRef | Subject | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AcademicPeriod {
  id: number;
  institution_id: number;
  academic_year_id: number;
  name: string;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Room extends NamedRef {
  capacity?: number | null;
}

export interface ClassGroup {
  id: number;
  institution_id: number;
  academic_year_id: number;
  level_id: number;
  series_id: number | null;
  name: string;
  max_capacity: number | null;
  head_teacher_id: number | null;
  room_id: number | null;
  academic_year?: AcademicYear | null;
  level?: NamedRef | null;
  series?: NamedRef | null;
  head_teacher?: { id: number; name: string; email?: string } | null;
  room?: Room | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Subject {
  id: number;
  institution_id: number;
  name: string;
  code: string;
  coefficient: number | null;
  level_id: number | null;
  level?: NamedRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TimetableSlot {
  id: number;
  institution_id: number;
  academic_year_id: number;
  class_group_id: number;
  subject_id: number;
  teacher_id: number | null;
  room_id: number | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  academic_year?: AcademicYear | null;
  class_group?: NamedRef | null;
  subject?: NamedRef | null;
  teacher?: { id: number; name: string } | null;
  room?: Room | null;
}

export interface ClassMemberUser {
  id: number;
  name: string;
  email: string;
}

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
};

export const DAYS_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function filterBySearch<T>(
  items: T[],
  search: string,
  fields: (item: T) => string
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => fields(item).toLowerCase().includes(q));
}

/**
 * Class groups exist per academic year, so a raw /class-groups list contains
 * one row per year for every class name (e.g. 7 "6ème A" rows across 7 years).
 * Scope the list to the active year (or the first year if none is marked
 * active) before showing it in any picker/table — otherwise every class name
 * appears duplicated once per historical year.
 */
export function classGroupsForActiveYear(
  classGroups: ClassGroup[],
  academicYears: AcademicYear[]
): ClassGroup[] {
  const activeYear = academicYears.find((y) => y.is_active) ?? academicYears[0];
  if (!activeYear) return classGroups;
  return classGroups.filter((c) => c.academic_year_id === activeYear.id);
}

export function slotsForClass(
  slots: TimetableSlot[],
  classGroupId: string | number | null
): TimetableSlot[] {
  if (!classGroupId) return [];
  return slots
    .filter((s) => String(s.class_group_id) === String(classGroupId))
    .slice()
    .sort((a, b) => {
      const dayDiff = DAYS_ORDER.indexOf(a.day_of_week) - DAYS_ORDER.indexOf(b.day_of_week);
      if (dayDiff !== 0) return dayDiff;
      return a.start_time.localeCompare(b.start_time);
    });
}

export function averageCoefficient(subjects: Subject[]): number | null {
  const values = subjects
    .map((s) => (s.coefficient == null ? null : Number(s.coefficient)))
    .filter((n): n is number => n != null && !Number.isNaN(n));
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}
