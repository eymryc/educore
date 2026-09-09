import {
  createAttendance,
  deleteAttendance,
  getAttendance,
  updateAttendance,
} from "@/infrastructure/api/resources/attendance";
import {
  createAssessment,
  deleteAssessment,
  getAssessment,
  listAssessments,
  updateAssessment,
} from "@/infrastructure/api/resources/assessments";
import {
  createAssignment,
  deleteAssignment,
  getAssignment,
  updateAssignment,
} from "@/infrastructure/api/resources/assignments";
import {
  createGrade,
  deleteGrade,
  getGrade,
  updateGrade,
} from "@/infrastructure/api/resources/grades";
import {
  createReportCard,
  deleteReportCard,
  getReportCard,
  updateReportCard,
} from "@/infrastructure/api/resources/report-cards";
import {
  createDisciplineRecord,
  deleteDisciplineRecord,
  getDisciplineRecord,
  updateDisciplineRecord,
} from "@/infrastructure/api/resources/discipline";
import {
  createEnrollment,
  createReEnrollment,
  deleteEnrollment,
  deleteReEnrollment,
  getEnrollment,
  getReEnrollment,
  updateEnrollment,
  updateReEnrollment,
} from "@/infrastructure/api/resources/enrollments";
import {
  createLibraryBook,
  createLibraryCopy,
  createLibraryLoan,
  deleteLibraryBook,
  deleteLibraryCopy,
  getLibraryBook,
  getLibraryCopy,
  listLibraryBooks,
  listLibraryCopies,
  updateLibraryBook,
  updateLibraryCopy,
} from "@/infrastructure/api/resources/library";
import {
  createCashRegister,
  createCashTransaction,
  createExpense,
  createFeeCategory,
  createFeeItem,
  createFeeStructure,
  createInvoice,
  deleteCashRegister,
  deleteExpense,
  deleteFeeCategory,
  deleteFeeItem,
  deleteFeeStructure,
  deleteInvoice,
  getCashRegister,
  getCashTransaction,
  getExpense,
  getFeeCategory,
  getFeeItem,
  getFeeStructure,
  getInvoice,
  listCashRegisters,
  listFeeCategories,
  listFeeStructures,
  listUnpaidInvoices,
  updateCashRegister,
  updateExpense,
  updateFeeCategory,
  updateFeeItem,
  updateFeeStructure,
  updateInvoice,
} from "@/infrastructure/api/resources/finance";
import { initiatePayment } from "@/infrastructure/api/resources/payments";
import {
  createAnnouncement,
  createConversation,
  deleteAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from "@/infrastructure/api/resources/communication";
import { listGuardians } from "@/infrastructure/api/resources/guardians";
import {
  createDocumentCategory,
  deleteDocument,
  deleteDocumentCategory,
  getDocument,
  getDocumentCategory,
  listDocumentCategories,
  updateDocument,
  updateDocumentCategory,
} from "@/infrastructure/api/resources/documents";
import {
  createBuilding,
  createCampus,
  createInstitutionRoom,
  deleteBuilding,
  deleteCampus,
  deleteInstitutionRoom,
  getBuilding,
  getCampus,
  getInstitutionRoom,
  listBuildings,
  listCampuses,
  listInstitutionRooms,
  updateBuilding,
  updateCampus,
  updateInstitutionRoom,
} from "@/infrastructure/api/resources/institution";
import {
  createHrApplication,
  createHrJobPosting,
  createDepartment,
  createStaffAttendance,
  createStaffEvaluation,
  createStaffLeave,
  createStaffMember,
  createStaffPayroll,
  deleteHrApplication,
  deleteHrJobPosting,
  deleteDepartment,
  deleteStaffAttendance,
  deleteStaffEvaluation,
  deleteStaffLeave,
  deleteStaffMember,
  deleteStaffPayroll,
  getHrApplication,
  getHrJobPosting,
  getDepartment,
  getStaffAttendance,
  getStaffEvaluation,
  getStaffLeave,
  getStaffMember,
  getStaffPayroll,
  listDepartments,
  listHrJobPostings,
  listStaffMembers,
  updateHrApplication,
  updateHrJobPosting,
  updateDepartment,
  updateStaffAttendance,
  updateStaffEvaluation,
  updateStaffLeave,
  updateStaffMember,
  updateStaffPayroll,
} from "@/infrastructure/api/resources/hr";
import {
  createCanteenAccount,
  createCanteenMenu,
  createCanteenSpecialDiet,
  deleteCanteenAccount,
  deleteCanteenMenu,
  deleteCanteenSpecialDiet,
  getCanteenAccount,
  getCanteenMenu,
  getCanteenSpecialDiet,
  updateCanteenAccount,
  updateCanteenMenu,
  updateCanteenSpecialDiet,
} from "@/infrastructure/api/resources/canteen";
import {
  createTransportDriver,
  createTransportRoute,
  createTransportSubscription,
  createTransportVehicle,
  deleteTransportDriver,
  deleteTransportRoute,
  deleteTransportSubscription,
  deleteTransportVehicle,
  getTransportDriver,
  getTransportRoute,
  getTransportSubscription,
  getTransportVehicle,
  listTransportDrivers,
  listTransportRoutes,
  listTransportVehicles,
  updateTransportDriver,
  updateTransportRoute,
  updateTransportSubscription,
  updateTransportVehicle,
} from "@/infrastructure/api/resources/transport";
import {
  createInventoryAsset,
  createInventorySupply,
  deleteInventoryAsset,
  deleteInventorySupply,
  getInventoryAsset,
  getInventorySupply,
  updateInventoryAsset,
  updateInventorySupply,
} from "@/infrastructure/api/resources/inventory";
import {
  createAcademicHoliday,
  createAcademicPeriod,
  createAcademicYear,
  createClassGroup,
  createClassSubject,
  createLevel,
  createSeries,
  createSubject,
  createTimetableSlot,
  deleteAcademicHoliday,
  deleteAcademicPeriod,
  deleteAcademicYear,
  deleteClassGroup,
  deleteClassSubject,
  deleteLevel,
  deleteSeries,
  deleteSubject,
  deleteTimetableSlot,
  getAcademicHoliday,
  getAcademicPeriod,
  getAcademicYear,
  getClassGroup,
  getClassSubject,
  getLevel,
  getSeries,
  getSubject,
  getTimetableSlot,
  listAcademicPeriods,
  listAcademicYears,
  listClassGroups,
  listLevels,
  listRooms,
  listSeries,
  listSubjects,
  updateAcademicHoliday,
  updateAcademicPeriod,
  updateAcademicYear,
  updateClassGroup,
  updateClassSubject,
  updateLevel,
  updateSeries,
  updateSubject,
  updateTimetableSlot,
} from "@/infrastructure/api/resources/academic";
import {
  createGuardian,
  deleteGuardian,
  getGuardian,
  updateGuardian,
} from "@/infrastructure/api/resources/guardians";
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
} from "@/infrastructure/api/resources/students";
import {
  createTeacher,
  deleteTeacher,
  getTeacher,
  listTeachers,
  updateTeacher,
} from "@/infrastructure/api/resources/teachers";
import { mapFormToApi } from "@/shared/lib/form-mapper";
import type { ClassGroup, Subject, TimetableSlot } from "@/shared/types/academic.types";
import {
  classGroupsForActiveYear,
  type AcademicYear,
} from "@/shared/types/academic.types";
import type { AttendanceStatus } from "@/shared/types/attendance.types";
import type { Assessment, Grade } from "@/shared/types/grades.types";
import { assignmentToForm } from "@/shared/types/assignments.types";
import type { ReportCard } from "@/shared/types/report-cards.types";
import type { DisciplinaryRecord } from "@/shared/types/discipline.types";
import type { Enrollment } from "@/shared/types/enrollment.types";
import type { LibraryBook, LibraryCopy } from "@/shared/types/library.types";
import type { Expense, Invoice } from "@/shared/types/finance.types";
import { formatMoneyFcfa } from "@/shared/types/finance.types";
import type { Announcement, AnnouncementTargetType } from "@/shared/types/communication.types";
import { targetNeedsId } from "@/shared/types/communication.types";
import type { DocumentCategory, DocumentRecord } from "@/shared/types/documents.types";
import type { Building, Campus, InstitutionRoom } from "@/shared/types/institution.types";
import {
  departmentToForm,
  hrApplicationToForm,
  jobPostingToForm,
  staffAttendanceToForm,
  staffEvaluationToForm,
  staffLeaveToForm,
  staffMemberName,
  staffMemberToForm,
  staffPayrollToForm,
} from "@/shared/types/hr.types";
import {
  canteenAccountToForm,
  canteenMenuToForm,
  canteenSpecialDietToForm,
} from "@/shared/types/canteen.types";
import {
  driverToForm,
  parseStopsText,
  routeToForm,
  subscriptionToForm,
  transportDriverName,
  vehicleToForm,
} from "@/shared/types/transport.types";
import { assetToForm, supplyToForm } from "@/shared/types/inventory.types";
import { guardianFullName } from "@/shared/types/guardian.types";
import { teacherFullName } from "@/shared/types/teacher.types";
import type { Guardian } from "@/shared/types/guardian.types";
import type { Student } from "@/shared/types/student.types";
import type { Teacher } from "@/shared/types/teacher.types";
import { studentFullName } from "@/shared/types/student.types";
import type { CrudFieldOption } from "@/shared/types/crud-form.types";

function classGroupFieldOptions(
  classes: ClassGroup[],
  years: AcademicYear[]
): CrudFieldOption[] {
  return classGroupsForActiveYear(classes, years).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
}

export type CrudAdapter = {
  apiPath: string;
  loadRecord: (id: string) => Promise<Record<string, string | boolean>>;
  create: (values: Record<string, string | boolean>) => Promise<unknown>;
  update: (id: string, values: Record<string, string | boolean>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  loadFieldOptions?: () => Promise<Record<string, CrudFieldOption[]>>;
};

function optionalInt(
  values: Record<string, string | boolean>,
  key: string,
  mode: "create" | "edit",
  payload: Record<string, unknown>
): void {
  const value = values[key];
  if (value === "" || value === undefined) {
    if (mode === "edit") payload[key] = null;
    else delete payload[key];
  } else {
    payload[key] = Number(value);
  }
}

function requiredInt(values: Record<string, string | boolean>, key: string): number {
  return Number(values[key]);
}

function studentToForm(student: Student): Record<string, string | boolean> {
  return {
    first_name: student.first_name ?? "",
    last_name: student.last_name ?? "",
    birth_date: student.birth_date ?? "",
    gender: student.gender ?? "",
    matricule: student.matricule ?? "",
    level_id: student.level_id != null ? String(student.level_id) : "",
    class_group_id: student.class_group_id != null ? String(student.class_group_id) : "",
    status: student.status ?? "active",
    enrolled_at: student.enrolled_at ?? "",
    email: student.email ?? "",
    phone: student.phone ?? "",
    address: student.address ?? "",
  };
}

function studentPayload(
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  for (const key of ["level_id", "class_group_id"] as const) {
    optionalInt(values, key, mode, payload);
  }
  return payload;
}

function guardianToForm(guardian: Guardian): Record<string, string | boolean> {
  return {
    first_name: guardian.first_name ?? "",
    last_name: guardian.last_name ?? "",
    email: guardian.email ?? "",
    phone: guardian.phone ?? "",
    profession: guardian.profession ?? "",
    address: guardian.address ?? "",
    create_portal_account: false,
  };
}

function guardianPayload(
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  if (mode === "create") {
    payload.create_portal_account = Boolean(values.create_portal_account);
  } else {
    delete payload.create_portal_account;
  }
  return payload;
}

function teacherToForm(teacher: Teacher): Record<string, string | boolean> {
  return {
    first_name: teacher.first_name ?? "",
    last_name: teacher.last_name ?? "",
    email: teacher.email ?? "",
    phone: teacher.phone ?? "",
    employee_number: teacher.employee_number ?? "",
    main_subject_id: teacher.main_subject_id != null ? String(teacher.main_subject_id) : "",
    grade_title: teacher.grade_title ?? "",
    hired_at: teacher.hired_at ?? "",
    status: teacher.status ?? "active",
    create_portal_account: false,
  };
}

function teacherPayload(
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  optionalInt(values, "main_subject_id", mode, payload);
  if (mode === "create") {
    payload.create_portal_account = Boolean(values.create_portal_account);
  } else {
    delete payload.create_portal_account;
  }
  return payload;
}

function classGroupToForm(row: ClassGroup): Record<string, string | boolean> {
  return {
    name: row.name ?? "",
    academic_year_id: row.academic_year_id != null ? String(row.academic_year_id) : "",
    level_id: row.level_id != null ? String(row.level_id) : "",
    series_id: row.series_id != null ? String(row.series_id) : "",
    max_capacity: row.max_capacity != null ? String(row.max_capacity) : "",
    head_teacher_id: row.head_teacher_id != null ? String(row.head_teacher_id) : "",
    room_id: row.room_id != null ? String(row.room_id) : "",
  };
}

function classGroupPayload(
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  payload.academic_year_id = requiredInt(values, "academic_year_id");
  payload.level_id = requiredInt(values, "level_id");
  optionalInt(values, "series_id", mode, payload);
  optionalInt(values, "max_capacity", mode, payload);
  optionalInt(values, "head_teacher_id", mode, payload);
  optionalInt(values, "room_id", mode, payload);
  return payload;
}

function subjectToForm(row: Subject): Record<string, string | boolean> {
  return {
    name: row.name ?? "",
    code: row.code ?? "",
    coefficient: row.coefficient != null ? String(row.coefficient) : "",
    level_id: row.level_id != null ? String(row.level_id) : "",
  };
}

function subjectPayload(
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  if (values.coefficient !== "" && values.coefficient !== undefined) {
    payload.coefficient = Number(values.coefficient);
  } else if (mode === "edit") {
    payload.coefficient = null;
  } else {
    delete payload.coefficient;
  }
  optionalInt(values, "level_id", mode, payload);
  return payload;
}

function slotToForm(row: TimetableSlot): Record<string, string | boolean> {
  return {
    academic_year_id: String(row.academic_year_id ?? ""),
    class_group_id: String(row.class_group_id ?? ""),
    subject_id: String(row.subject_id ?? ""),
    day_of_week: row.day_of_week ?? "",
    start_time: (row.start_time ?? "").slice(0, 5),
    end_time: (row.end_time ?? "").slice(0, 5),
    teacher_id: row.teacher_id != null ? String(row.teacher_id) : "",
    room_id: row.room_id != null ? String(row.room_id) : "",
  };
}

function slotPayload(
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  payload.academic_year_id = requiredInt(values, "academic_year_id");
  payload.class_group_id = requiredInt(values, "class_group_id");
  payload.subject_id = requiredInt(values, "subject_id");
  optionalInt(values, "teacher_id", mode, payload);
  optionalInt(values, "room_id", mode, payload);
  return payload;
}

function assessmentToForm(row: Assessment): Record<string, string | boolean> {
  return {
    title: row.title ?? "",
    academic_year_id: String(row.academic_year_id ?? ""),
    academic_period_id: String(row.academic_period_id ?? ""),
    class_group_id: String(row.class_group_id ?? ""),
    subject_id: String(row.subject_id ?? ""),
    type: row.type ?? "",
    date: row.date ?? "",
    coefficient: row.coefficient != null ? String(row.coefficient) : "1",
    max_score: row.max_score != null ? String(row.max_score) : "20",
  };
}

function assessmentPayload(values: Record<string, string | boolean>): Record<string, unknown> {
  const payload = mapFormToApi(values);
  payload.academic_year_id = requiredInt(values, "academic_year_id");
  payload.academic_period_id = requiredInt(values, "academic_period_id");
  payload.class_group_id = requiredInt(values, "class_group_id");
  payload.subject_id = requiredInt(values, "subject_id");
  if (values.coefficient !== "" && values.coefficient !== undefined) {
    payload.coefficient = Number(values.coefficient);
  }
  if (values.max_score !== "" && values.max_score !== undefined) {
    payload.max_score = Number(values.max_score);
  }
  return payload;
}

function assignmentCreatePayload(
  values: Record<string, string | boolean>
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  payload.academic_year_id = requiredInt(values, "academic_year_id");
  payload.class_group_id = requiredInt(values, "class_group_id");
  payload.subject_id = requiredInt(values, "subject_id");
  if (values.max_score !== "" && values.max_score !== undefined) {
    payload.max_score = Number(values.max_score);
  }
  if (values.description === "" || values.description === undefined) {
    payload.description = null;
  }
  if (values.instructions === "" || values.instructions === undefined) {
    payload.instructions = null;
  }
  return payload;
}

function assignmentUpdatePayload(
  values: Record<string, string | boolean>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (typeof values.title === "string" && values.title !== "") {
    payload.title = values.title;
  }
  payload.description =
    values.description === "" || values.description === undefined
      ? null
      : values.description;
  payload.instructions =
    values.instructions === "" || values.instructions === undefined
      ? null
      : values.instructions;
  if (typeof values.due_at === "string" && values.due_at !== "") {
    payload.due_at = values.due_at;
  }
  if (values.max_score !== "" && values.max_score !== undefined) {
    payload.max_score = Number(values.max_score);
  } else {
    payload.max_score = null;
  }
  if (typeof values.status === "string" && values.status !== "") {
    payload.status = values.status;
  }
  return payload;
}

function gradeToForm(row: Grade): Record<string, string | boolean> {
  return {
    assessment_id: String(row.assessment_id ?? ""),
    student_id: String(row.student_id ?? ""),
    score: row.score != null ? String(row.score) : "",
    comment: row.comment ?? "",
    reason: "",
  };
}

function gradeCreatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    assessment_id: requiredInt(values, "assessment_id"),
    student_id: requiredInt(values, "student_id"),
    score: Number(values.score),
    comment: values.comment === "" ? null : String(values.comment ?? ""),
  };
}

function gradeUpdatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    score: Number(values.score),
    comment: values.comment === "" ? null : String(values.comment ?? ""),
  };
  if (values.reason !== "" && values.reason !== undefined) {
    payload.reason = String(values.reason);
  }
  return payload;
}

function disciplineToForm(row: DisciplinaryRecord): Record<string, string | boolean> {
  return {
    student_id: String(row.student_id ?? ""),
    academic_year_id: String(row.academic_year_id ?? ""),
    class_group_id: row.class_group_id != null ? String(row.class_group_id) : "",
    type: row.type ?? "",
    title: row.title ?? "",
    occurred_at: row.occurred_at ?? "",
    location: row.location ?? "",
    description: row.description ?? "",
    sanction_type: row.sanction_type ?? "",
    exclusion_start: row.exclusion_start ?? "",
    exclusion_end: row.exclusion_end ?? "",
    council_date: row.council_date ?? "",
    council_decision: row.council_decision ?? "",
  };
}

function disciplineCreatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  const payload = mapFormToApi(values);
  payload.student_id = requiredInt(values, "student_id");
  payload.academic_year_id = requiredInt(values, "academic_year_id");
  if (values.class_group_id !== "" && values.class_group_id !== undefined) {
    payload.class_group_id = Number(values.class_group_id);
  } else {
    delete payload.class_group_id;
  }
  for (const key of [
    "location",
    "description",
    "sanction_type",
    "exclusion_start",
    "exclusion_end",
    "council_date",
    "council_decision",
  ] as const) {
    if (values[key] === "" || values[key] === undefined) {
      payload[key] = null;
    }
  }
  return payload;
}

function disciplineUpdatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    title: String(values.title ?? ""),
    description: values.description === "" ? null : String(values.description ?? ""),
    occurred_at: String(values.occurred_at ?? ""),
    location: values.location === "" ? null : String(values.location ?? ""),
    sanction_type: values.sanction_type === "" ? null : String(values.sanction_type ?? ""),
    exclusion_start: values.exclusion_start === "" ? null : String(values.exclusion_start ?? ""),
    exclusion_end: values.exclusion_end === "" ? null : String(values.exclusion_end ?? ""),
    council_date: values.council_date === "" ? null : String(values.council_date ?? ""),
    council_decision:
      values.council_decision === "" ? null : String(values.council_decision ?? ""),
  };
}

function enrollmentToForm(row: Enrollment): Record<string, string | boolean> {
  return {
    last_name: row.last_name ?? "",
    first_name: row.first_name ?? "",
    academic_year_id: String(row.academic_year_id ?? ""),
    level_id: String(row.level_id ?? ""),
    class_group_id: row.class_group_id != null ? String(row.class_group_id) : "",
    origin: row.origin ?? "NOUVELLE_INSCRIPTION",
    previous_school: row.previous_school ?? "",
    national_matricule: row.national_matricule ?? "",
    birth_date: row.birth_date ?? "",
    birth_place: row.birth_place ?? "",
    nationality: row.nationality ?? "",
    previous_level: row.previous_level ?? "",
    year_end_decision: row.year_end_decision ?? "",
    mena_receipt_number: row.mena_receipt_number ?? "",
    mena_paid_at: row.mena_paid_at ?? "",
    gender: row.gender ?? "",
    parent_contact: row.parent_contact ?? "",
    parent_full_name: row.parent_full_name ?? "",
    application_date: row.application_date ?? "",
    observations: row.observations ?? "",
  };
}

function enrollmentPayload(
  values: Record<string, string | boolean>,
  mode: "create" | "edit"
): Record<string, unknown> {
  const payload = mapFormToApi(values);
  payload.academic_year_id = requiredInt(values, "academic_year_id");
  payload.level_id = requiredInt(values, "level_id");
  optionalInt(values, "class_group_id", mode, payload);
  if (values.birth_date === "" || values.birth_date === undefined) {
    payload.birth_date = null;
  }
  if (values.gender === "" || values.gender === undefined) {
    payload.gender = null;
  }
  if (values.observations === "" || values.observations === undefined) {
    payload.observations = null;
  }
  for (const key of [
    "origin",
    "previous_school",
    "national_matricule",
    "birth_place",
    "nationality",
    "previous_level",
    "year_end_decision",
    "mena_receipt_number",
    "mena_paid_at",
    "parent_full_name",
  ] as const) {
    if (values[key] === "" || values[key] === undefined) payload[key] = null;
  }
  return payload;
}

function libraryBookToForm(row: LibraryBook): Record<string, string | boolean> {
  return {
    title: row.title ?? "",
    author: row.author ?? "",
    isbn: row.isbn ?? "",
    publisher: row.publisher ?? "",
    publication_year: row.publication_year != null ? String(row.publication_year) : "",
    category: row.category ?? "",
    description: row.description ?? "",
    is_active: row.is_active !== false,
  };
}

function libraryBookPayload(values: Record<string, string | boolean>): Record<string, unknown> {
  const payload = mapFormToApi(values);
  payload.is_active = Boolean(values.is_active);
  if (values.publication_year !== "" && values.publication_year !== undefined) {
    payload.publication_year = Number(values.publication_year);
  } else {
    payload.publication_year = null;
  }
  for (const key of ["author", "isbn", "publisher", "category", "description"] as const) {
    if (values[key] === "" || values[key] === undefined) payload[key] = null;
  }
  return payload;
}

function libraryCopyToForm(row: LibraryCopy): Record<string, string | boolean> {
  return {
    library_book_id: String(row.library_book_id ?? ""),
    copy_code: row.copy_code ?? "",
    status: row.status ?? "AVAILABLE",
    acquired_at: row.acquired_at ?? "",
    notes: row.notes ?? "",
  };
}

function libraryCopyCreatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    library_book_id: requiredInt(values, "library_book_id"),
    copy_code: String(values.copy_code ?? ""),
    status: values.status ? String(values.status) : "AVAILABLE",
    acquired_at: values.acquired_at === "" ? null : String(values.acquired_at ?? ""),
    notes: values.notes === "" ? null : String(values.notes ?? ""),
  };
}

function libraryCopyUpdatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    copy_code: String(values.copy_code ?? ""),
    status: String(values.status ?? "AVAILABLE"),
    acquired_at: values.acquired_at === "" ? null : String(values.acquired_at ?? ""),
    notes: values.notes === "" ? null : String(values.notes ?? ""),
  };
}

function invoiceLineItem(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    description: String(values.item_description ?? ""),
    quantity: values.item_quantity === "" || values.item_quantity === undefined
      ? 1
      : Number(values.item_quantity),
    unit_amount: Number(values.item_unit_amount),
  };
}

function invoiceToForm(row: Invoice): Record<string, string | boolean> {
  const first = row.items?.[0];
  return {
    student_id: String(row.student_id ?? ""),
    academic_year_id: String(row.academic_year_id ?? ""),
    issue_date: row.issue_date ?? "",
    due_date: row.due_date ?? "",
    discount_amount: String(row.discount_amount ?? "0"),
    penalty_amount: String(row.penalty_amount ?? "0"),
    notes: row.notes ?? "",
    item_description: first?.description ?? "",
    item_quantity: first ? String(first.quantity ?? 1) : "1",
    item_unit_amount: first ? String(first.unit_amount ?? "") : "",
  };
}

function invoiceCreatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    student_id: requiredInt(values, "student_id"),
    academic_year_id: requiredInt(values, "academic_year_id"),
    issue_date: String(values.issue_date),
    due_date: String(values.due_date),
    discount_amount:
      values.discount_amount === "" || values.discount_amount === undefined
        ? 0
        : Number(values.discount_amount),
    penalty_amount:
      values.penalty_amount === "" || values.penalty_amount === undefined
        ? 0
        : Number(values.penalty_amount),
    notes: values.notes === "" ? null : String(values.notes ?? ""),
    items: [invoiceLineItem(values)],
  };
}

function invoiceUpdatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    due_date: String(values.due_date),
    discount_amount:
      values.discount_amount === "" || values.discount_amount === undefined
        ? 0
        : Number(values.discount_amount),
    penalty_amount:
      values.penalty_amount === "" || values.penalty_amount === undefined
        ? 0
        : Number(values.penalty_amount),
    notes: values.notes === "" ? null : String(values.notes ?? ""),
    items: [invoiceLineItem(values)],
  };
}

function expenseToForm(row: Expense): Record<string, string | boolean> {
  return {
    category: row.category ?? "",
    description: row.description ?? "",
    amount: String(row.amount ?? ""),
    expense_date: row.expense_date ?? "",
    cash_register_id: row.cash_register_id != null ? String(row.cash_register_id) : "",
    reference: row.reference ?? "",
  };
}

function expenseCreatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    category: String(values.category),
    description: String(values.description),
    amount: Number(values.amount),
    expense_date: String(values.expense_date),
    reference: values.reference === "" ? null : String(values.reference ?? ""),
  };
  optionalInt(values, "cash_register_id", "create", payload);
  return payload;
}

function expenseUpdatePayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    category: String(values.category),
    description: String(values.description),
    reference: values.reference === "" ? null : String(values.reference ?? ""),
  };
}

function announcementToForm(row: Announcement): Record<string, string | boolean> {
  const first = row.targets?.[0];
  return {
    title: row.title ?? "",
    body: row.body ?? "",
    target_type: first?.target_type ?? "INSTITUTION",
    target_id: first?.target_id != null ? String(first.target_id) : "",
    is_pinned: Boolean(row.is_pinned),
    publish: false,
  };
}

function announcementTargets(
  values: Record<string, string | boolean>
): Array<{ target_type: string; target_id?: number }> {
  const targetType = String(values.target_type || "INSTITUTION") as AnnouncementTargetType;
  const target: { target_type: string; target_id?: number } = { target_type: targetType };
  if (targetNeedsId(targetType)) {
    target.target_id = requiredInt(values, "target_id");
  }
  return [target];
}

function announcementCreatePayload(
  values: Record<string, string | boolean>
): Record<string, unknown> {
  return {
    title: String(values.title),
    body: String(values.body),
    is_pinned: Boolean(values.is_pinned),
    publish: Boolean(values.publish),
    targets: announcementTargets(values),
  };
}

function announcementUpdatePayload(
  values: Record<string, string | boolean>
): Record<string, unknown> {
  return {
    title: String(values.title),
    body: String(values.body),
    is_pinned: Boolean(values.is_pinned),
    targets: announcementTargets(values),
  };
}

function parseAccessRoles(raw: string | boolean | undefined): string[] | null {
  if (raw === "" || raw === undefined || raw === false) return null;
  const roles = String(raw)
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return roles.length ? roles : null;
}

function categoryToForm(row: DocumentCategory): Record<string, string | boolean> {
  return {
    name: row.name ?? "",
    code: row.code ?? "",
    description: row.description ?? "",
    access_roles: row.access_roles?.join(", ") ?? "",
    is_sensitive: Boolean(row.is_sensitive),
    is_active: row.is_active !== false,
  };
}

function categoryPayload(values: Record<string, string | boolean>): Record<string, unknown> {
  return {
    name: String(values.name),
    code: values.code === "" ? null : String(values.code ?? ""),
    description: values.description === "" ? null : String(values.description ?? ""),
    access_roles: parseAccessRoles(values.access_roles),
    is_sensitive: Boolean(values.is_sensitive),
    is_active: Boolean(values.is_active),
  };
}

function documentToForm(row: DocumentRecord): Record<string, string | boolean> {
  return {
    document_category_id: String(row.document_category_id ?? ""),
    title: row.title ?? "",
    description: row.description ?? "",
  };
}

function campusToForm(row: Campus): Record<string, string | boolean> {
  return {
    name: row.name ?? "",
    address: row.address ?? "",
  };
}

function buildingToForm(row: Building): Record<string, string | boolean> {
  return {
    campus_id: String(row.campus_id ?? ""),
    name: row.name ?? "",
    code: row.code ?? "",
    floors: row.floors != null ? String(row.floors) : "",
  };
}

function roomToForm(row: InstitutionRoom): Record<string, string | boolean> {
  return {
    building_id: String(row.building_id ?? ""),
    name: row.name ?? "",
    code: row.code ?? "",
    capacity: row.capacity != null ? String(row.capacity) : "",
    type: row.type ?? "",
  };
}

async function teacherUserOptions(): Promise<CrudFieldOption[]> {
  const teachers = await listTeachers();
  return teachers
    .filter((t) => t.user_id)
    .map((t) => ({
      value: String(t.user_id),
      label: `${t.last_name} ${t.first_name}`,
    }));
}

export const CRUD_ADAPTERS: Partial<Record<string, CrudAdapter>> = {
  students: {
    apiPath: "/students",
    loadRecord: async (id) => studentToForm(await getStudent(id)),
    create: async (values) => createStudent(studentPayload(values, "create")),
    update: async (id, values) => updateStudent(id, studentPayload(values, "edit")),
    remove: async (id) => deleteStudent(id),
    loadFieldOptions: async () => {
      const [levels, classGroups, years] = await Promise.all([
        listLevels(),
        listClassGroups(),
        listAcademicYears(),
      ]);
      return {
        level_id: levels.map((l) => ({ value: String(l.id), label: l.name })),
        class_group_id: classGroupFieldOptions(classGroups, years),
      };
    },
  },
  parents: {
    apiPath: "/guardians",
    loadRecord: async (id) => guardianToForm(await getGuardian(id)),
    create: async (values) => createGuardian(guardianPayload(values, "create")),
    update: async (id, values) => updateGuardian(id, guardianPayload(values, "edit")),
    remove: async (id) => deleteGuardian(id),
  },
  teachers: {
    apiPath: "/teachers",
    loadRecord: async (id) => teacherToForm(await getTeacher(id)),
    create: async (values) => createTeacher(teacherPayload(values, "create")),
    update: async (id, values) => updateTeacher(id, teacherPayload(values, "edit")),
    remove: async (id) => deleteTeacher(id),
    loadFieldOptions: async () => {
      const subjects = await listSubjects();
      return {
        main_subject_id: subjects.map((s) => ({
          value: String(s.id),
          label: s.code ? `${s.name} (${s.code})` : s.name,
        })),
      };
    },
  },
  classes: {
    apiPath: "/class-groups",
    loadRecord: async (id) => classGroupToForm(await getClassGroup(id)),
    create: async (values) => createClassGroup(classGroupPayload(values, "create")),
    update: async (id, values) => updateClassGroup(id, classGroupPayload(values, "edit")),
    remove: async (id) => deleteClassGroup(id),
    loadFieldOptions: async () => {
      const [years, levels, series, rooms, teachers] = await Promise.all([
        listAcademicYears(),
        listLevels(),
        listSeries(),
        listRooms(),
        teacherUserOptions(),
      ]);
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        level_id: levels.map((l) => ({ value: String(l.id), label: l.name })),
        series_id: series.map((s) => ({ value: String(s.id), label: s.name })),
        room_id: rooms.map((r) => ({ value: String(r.id), label: r.name })),
        head_teacher_id: teachers,
      };
    },
  },
  subjects: {
    apiPath: "/subjects",
    loadRecord: async (id) => subjectToForm(await getSubject(id)),
    create: async (values) => createSubject(subjectPayload(values, "create")),
    update: async (id, values) => updateSubject(id, subjectPayload(values, "edit")),
    remove: async (id) => deleteSubject(id),
    loadFieldOptions: async () => {
      const levels = await listLevels();
      return {
        level_id: levels.map((l) => ({ value: String(l.id), label: l.name })),
      };
    },
  },
  schedules: {
    apiPath: "/timetable-slots",
    loadRecord: async (id) => slotToForm(await getTimetableSlot(id)),
    create: async (values) => createTimetableSlot(slotPayload(values, "create")),
    update: async (id, values) => updateTimetableSlot(id, slotPayload(values, "edit")),
    remove: async (id) => deleteTimetableSlot(id),
    loadFieldOptions: async () => {
      const [years, classes, subjects, rooms, teachers] = await Promise.all([
        listAcademicYears(),
        listClassGroups(),
        listSubjects(),
        listRooms(),
        teacherUserOptions(),
      ]);
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        class_group_id: classGroupFieldOptions(classes, years),
        subject_id: subjects.map((s) => ({
          value: String(s.id),
          label: s.code ? `${s.name} (${s.code})` : s.name,
        })),
        room_id: rooms.map((r) => ({ value: String(r.id), label: r.name })),
        teacher_id: teachers,
      };
    },
  },
  attendance: {
    apiPath: "/attendance",
    loadRecord: async (id) => {
      const row = await getAttendance(id);
      return {
        academic_year_id: String(row.academic_year_id),
        class_group_id: String(row.class_group_id),
        student_id: String(row.student_id),
        date: row.date ?? "",
        status: row.status,
        notes: row.notes ?? "",
      };
    },
    create: async (values) => {
      const payload = mapFormToApi(values);
      payload.academic_year_id = Number(values.academic_year_id);
      payload.class_group_id = Number(values.class_group_id);
      payload.student_id = Number(values.student_id);
      return createAttendance(payload);
    },
    update: async (id, values) =>
      updateAttendance(id, {
        status: String(values.status) as AttendanceStatus,
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    remove: async (id) => deleteAttendance(id),
    loadFieldOptions: async () => {
      const [years, classes, students] = await Promise.all([
        listAcademicYears(),
        listClassGroups(),
        listStudents(),
      ]);
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        class_group_id: classGroupFieldOptions(classes, years),
        student_id: students.map((s) => ({
          value: String(s.id),
          label: `${studentFullName(s)} (${s.matricule})`,
        })),
      };
    },
  },
  assessments: {
    apiPath: "/assessments",
    loadRecord: async (id) => assessmentToForm(await getAssessment(id)),
    create: async (values) => createAssessment(assessmentPayload(values)),
    update: async (id, values) => updateAssessment(id, assessmentPayload(values)),
    remove: async (id) => deleteAssessment(id),
    loadFieldOptions: async () => {
      const [years, periods, classes, subjects] = await Promise.all([
        listAcademicYears(),
        listAcademicPeriods(),
        listClassGroups(),
        listSubjects(),
      ]);
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        academic_period_id: periods.map((p) => ({ value: String(p.id), label: p.name })),
        class_group_id: classGroupFieldOptions(classes, years),
        subject_id: subjects.map((s) => ({
          value: String(s.id),
          label: s.code ? `${s.name} (${s.code})` : s.name,
        })),
      };
    },
  },
  assignments: {
    apiPath: "/assignments",
    loadRecord: async (id) => assignmentToForm(await getAssignment(id)),
    create: async (values) => createAssignment(assignmentCreatePayload(values)),
    update: async (id, values) => updateAssignment(id, assignmentUpdatePayload(values)),
    remove: async (id) => deleteAssignment(id),
    loadFieldOptions: async () => {
      const [years, classes, subjects] = await Promise.all([
        listAcademicYears(),
        listClassGroups(),
        listSubjects(),
      ]);
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        class_group_id: classGroupFieldOptions(classes, years),
        subject_id: subjects.map((s) => ({
          value: String(s.id),
          label: s.code ? `${s.name} (${s.code})` : s.name,
        })),
      };
    },
  },
  grades: {
    apiPath: "/grades",
    loadRecord: async (id) => gradeToForm(await getGrade(id)),
    create: async (values) => createGrade(gradeCreatePayload(values)),
    update: async (id, values) => updateGrade(id, gradeUpdatePayload(values)),
    remove: async (id) => deleteGrade(id),
    loadFieldOptions: async () => {
      const [assessments, students] = await Promise.all([listAssessments(), listStudents()]);
      return {
        assessment_id: assessments.map((a) => ({
          value: String(a.id),
          label: `${a.title} — ${a.date}`,
        })),
        student_id: students.map((s) => ({
          value: String(s.id),
          label: `${studentFullName(s)} (${s.matricule})`,
        })),
      };
    },
  },
  "report-cards": {
    apiPath: "/report-cards",
    loadRecord: async (id) => {
      const row = await getReportCard(id);
      return {
        student_id: String(row.student_id),
        academic_period_id: String(row.academic_period_id),
        appreciation: row.appreciation ?? "",
      };
    },
    create: async (values) =>
      createReportCard({
        student_id: Number(values.student_id),
        academic_period_id: Number(values.academic_period_id),
        appreciation: values.appreciation === "" ? null : String(values.appreciation ?? ""),
      }),
    update: async (id, values) =>
      updateReportCard(id, {
        appreciation: values.appreciation === "" ? null : String(values.appreciation ?? ""),
      }),
    remove: async (id) => deleteReportCard(id),
    loadFieldOptions: async () => {
      const [students, periods] = await Promise.all([listStudents(), listAcademicPeriods()]);
      return {
        student_id: students.map((s) => ({
          value: String(s.id),
          label: `${studentFullName(s)} (${s.matricule})`,
        })),
        academic_period_id: periods.map((p) => ({ value: String(p.id), label: p.name })),
      };
    },
  },
  discipline: {
    apiPath: "/discipline-records",
    loadRecord: async (id) => disciplineToForm(await getDisciplineRecord(id)),
    create: async (values) => createDisciplineRecord(disciplineCreatePayload(values)),
    update: async (id, values) => updateDisciplineRecord(id, disciplineUpdatePayload(values)),
    remove: async (id) => deleteDisciplineRecord(id),
    loadFieldOptions: async () => {
      const [students, years, classes] = await Promise.all([
        listStudents(),
        listAcademicYears(),
        listClassGroups(),
      ]);
      return {
        student_id: students.map((s) => ({
          value: String(s.id),
          label: `${studentFullName(s)} (${s.matricule})`,
        })),
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        class_group_id: classGroupFieldOptions(classes, years),
      };
    },
  },
  enrollment: {
    apiPath: "/enrollments",
    loadRecord: async (id) => enrollmentToForm(await getEnrollment(id)),
    create: async (values) => createEnrollment(enrollmentPayload(values, "create")),
    update: async (id, values) => updateEnrollment(id, enrollmentPayload(values, "edit")),
    remove: async (id) => deleteEnrollment(id),
    loadFieldOptions: async () => {
      const [years, levels, classes] = await Promise.all([
        listAcademicYears(),
        listLevels(),
        listClassGroups(),
      ]);
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        level_id: levels.map((l) => ({ value: String(l.id), label: l.name })),
        class_group_id: classGroupFieldOptions(classes, years),
      };
    },
  },
  library: {
    apiPath: "/library-books",
    loadRecord: async (id) => libraryBookToForm(await getLibraryBook(id)),
    create: async (values) => createLibraryBook(libraryBookPayload(values)),
    update: async (id, values) => updateLibraryBook(id, libraryBookPayload(values)),
    remove: async (id) => deleteLibraryBook(id),
  },
  "library-copies": {
    apiPath: "/library-copies",
    loadRecord: async (id) => libraryCopyToForm(await getLibraryCopy(id)),
    create: async (values) => createLibraryCopy(libraryCopyCreatePayload(values)),
    update: async (id, values) => updateLibraryCopy(id, libraryCopyUpdatePayload(values)),
    remove: async (id) => deleteLibraryCopy(id),
    loadFieldOptions: async () => {
      const books = await listLibraryBooks();
      return {
        library_book_id: books.map((b) => ({
          value: String(b.id),
          label: b.author ? `${b.title} — ${b.author}` : b.title,
        })),
      };
    },
  },
  "library-loans": {
    apiPath: "/library-loans",
    loadRecord: async () => ({
      library_copy_id: "",
      student_id: "",
      due_date: "",
      notes: "",
    }),
    create: async (values) =>
      createLibraryLoan({
        library_copy_id: Number(values.library_copy_id),
        student_id: Number(values.student_id),
        due_date: String(values.due_date),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    update: async () => {
      throw new Error("Les emprunts ne sont pas modifiables ; utilisez le retour.");
    },
    remove: async () => {
      throw new Error("Les emprunts ne peuvent pas être supprimés.");
    },
    loadFieldOptions: async () => {
      const [copies, students] = await Promise.all([
        listLibraryCopies({ status: "AVAILABLE" }),
        listStudents(),
      ]);
      return {
        library_copy_id: copies.map((c) => ({
          value: String(c.id),
          label: `${c.copy_code}${c.book?.title ? ` — ${c.book.title}` : ""}`,
        })),
        student_id: students.map((s) => ({
          value: String(s.id),
          label: `${studentFullName(s)} (${s.matricule})`,
        })),
      };
    },
  },
  payments: {
    apiPath: "/payments",
    loadRecord: async () => ({
      invoice_id: "",
      amount: "",
      email: "",
    }),
    create: async (values) => {
      const payload: { invoice_id: number; amount?: number; email?: string } = {
        invoice_id: requiredInt(values, "invoice_id"),
      };
      if (values.amount !== "" && values.amount !== undefined) {
        payload.amount = Number(values.amount);
      }
      if (values.email !== "" && values.email !== undefined) {
        payload.email = String(values.email);
      }
      const payment = await initiatePayment(payload);
      if (typeof window !== "undefined" && payment.authorization_url) {
        window.open(payment.authorization_url, "_blank", "noopener,noreferrer");
      }
      return payment;
    },
    update: async () => {
      throw new Error("Les paiements ne sont pas modifiables ; le statut vient du webhook Paystack.");
    },
    remove: async () => {
      throw new Error("Les paiements ne peuvent pas être supprimés.");
    },
    loadFieldOptions: async () => {
      const invoices = await listUnpaidInvoices();
      return {
        invoice_id: invoices.map((inv) => {
          const name = inv.student ? studentFullName(inv.student) : `Élève #${inv.student_id}`;
          return {
            value: String(inv.id),
            label: `${inv.invoice_number ?? `#${inv.id}`} — ${name} — ${formatMoneyFcfa(inv.balance_due)}`,
          };
        }),
      };
    },
  },
  invoices: {
    apiPath: "/invoices",
    loadRecord: async (id) => invoiceToForm(await getInvoice(id)),
    create: async (values) => createInvoice(invoiceCreatePayload(values)),
    update: async (id, values) => updateInvoice(id, invoiceUpdatePayload(values)),
    remove: async (id) => deleteInvoice(id),
    loadFieldOptions: async () => {
      const [students, years] = await Promise.all([listStudents(), listAcademicYears()]);
      return {
        student_id: students.map((s) => ({
          value: String(s.id),
          label: `${studentFullName(s)} (${s.matricule})`,
        })),
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
      };
    },
  },
  expenses: {
    apiPath: "/expenses",
    loadRecord: async (id) => expenseToForm(await getExpense(id)),
    create: async (values) => createExpense(expenseCreatePayload(values)),
    update: async (id, values) => updateExpense(id, expenseUpdatePayload(values)),
    remove: async (id) => deleteExpense(id),
    loadFieldOptions: async () => {
      const registers = await listCashRegisters();
      return {
        cash_register_id: registers.map((r) => ({
          value: String(r.id),
          label: r.code ? `${r.name} (${r.code})` : r.name,
        })),
      };
    },
  },
  communication: {
    apiPath: "/announcements",
    loadRecord: async (id) => announcementToForm(await getAnnouncement(id)),
    create: async (values) => createAnnouncement(announcementCreatePayload(values)),
    update: async (id, values) => updateAnnouncement(id, announcementUpdatePayload(values)),
    remove: async (id) => deleteAnnouncement(id),
    loadFieldOptions: async () => {
      const [classes, levels, students, years] = await Promise.all([
        listClassGroups(),
        listLevels(),
        listStudents(),
        listAcademicYears(),
      ]);
      const scopedClasses = classGroupsForActiveYear(classes, years);
      return {
        target_id: [
          ...scopedClasses.map((c) => ({ value: String(c.id), label: `Classe · ${c.name}` })),
          ...levels.map((l) => ({ value: String(l.id), label: `Niveau · ${l.name}` })),
          ...students.map((s) => ({
            value: String(s.id),
            label: `Élève · ${studentFullName(s)} (${s.matricule})`,
          })),
        ],
      };
    },
  },
  conversations: {
    apiPath: "/conversations",
    loadRecord: async () => ({
      type: "PRIVATE",
      recipient_user_id: "",
      subject: "",
      participant_user_ids: "",
    }),
    create: async (values) => {
      const type = String(values.type || "PRIVATE") as "PRIVATE" | "GROUP";
      if (type === "PRIVATE") {
        return createConversation({
          type: "PRIVATE",
          recipient_user_id: requiredInt(values, "recipient_user_id"),
        });
      }
      const ids = String(values.participant_user_ids ?? "")
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length < 2) {
        throw new Error("Une conversation de groupe nécessite au moins 2 participants.");
      }
      return createConversation({
        type: "GROUP",
        subject: String(values.subject || "").trim() || "Groupe",
        participant_user_ids: ids,
      });
    },
    update: async () => {
      throw new Error("Les conversations ne sont pas modifiables.");
    },
    remove: async () => {
      throw new Error("Les conversations ne peuvent pas être supprimées.");
    },
    loadFieldOptions: async () => {
      const [teachers, guardians, students] = await Promise.all([
        listTeachers(),
        listGuardians(),
        listStudents(),
      ]);
      const options: { value: string; label: string }[] = [];
      for (const t of teachers) {
        if (t.user_id) {
          options.push({
            value: String(t.user_id),
            label: `Enseignant · ${teacherFullName(t)}`,
          });
        }
      }
      for (const g of guardians) {
        if (g.user_id) {
          options.push({
            value: String(g.user_id),
            label: `Parent · ${guardianFullName(g)}`,
          });
        }
      }
      for (const s of students) {
        if (s.user_id) {
          options.push({
            value: String(s.user_id),
            label: `Élève · ${studentFullName(s)}`,
          });
        }
      }
      return { recipient_user_id: options };
    },
  },
  "document-categories": {
    apiPath: "/document-categories",
    loadRecord: async (id) => categoryToForm(await getDocumentCategory(id)),
    create: async (values) => createDocumentCategory(categoryPayload(values)),
    update: async (id, values) => updateDocumentCategory(id, categoryPayload(values)),
    remove: async (id) => deleteDocumentCategory(id),
  },
  documents: {
    apiPath: "/documents",
    loadRecord: async (id) => documentToForm(await getDocument(id)),
    create: async () => {
      throw new Error(
        "Utilisez le formulaire d'upload sur la page Documents pour créer un fichier."
      );
    },
    update: async (id, values) =>
      updateDocument(id, {
        title: String(values.title),
        description: values.description === "" ? null : String(values.description ?? ""),
      }),
    remove: async (id) => deleteDocument(id),
    loadFieldOptions: async () => {
      const categories = await listDocumentCategories();
      return {
        document_category_id: categories.map((c) => ({
          value: String(c.id),
          label: c.code ? `${c.name} (${c.code})` : c.name,
        })),
      };
    },
  },
  campuses: {
    apiPath: "/campuses",
    loadRecord: async (id) => campusToForm(await getCampus(id)),
    create: async (values) =>
      createCampus({
        name: String(values.name),
        address: values.address === "" ? null : String(values.address ?? ""),
      }),
    update: async (id, values) =>
      updateCampus(id, {
        name: String(values.name),
        address: values.address === "" ? null : String(values.address ?? ""),
      }),
    remove: async (id) => deleteCampus(id),
  },
  buildings: {
    apiPath: "/buildings",
    loadRecord: async (id) => buildingToForm(await getBuilding(id)),
    create: async (values) =>
      createBuilding({
        campus_id: requiredInt(values, "campus_id"),
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        floors:
          values.floors === "" || values.floors === undefined
            ? null
            : Number(values.floors),
      }),
    update: async (id, values) =>
      updateBuilding(id, {
        campus_id: requiredInt(values, "campus_id"),
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        floors:
          values.floors === "" || values.floors === undefined
            ? null
            : Number(values.floors),
      }),
    remove: async (id) => deleteBuilding(id),
    loadFieldOptions: async () => {
      const campuses = await listCampuses();
      return {
        campus_id: campuses.map((c) => ({ value: String(c.id), label: c.name })),
      };
    },
  },
  rooms: {
    apiPath: "/rooms",
    loadRecord: async (id) => roomToForm(await getInstitutionRoom(id)),
    create: async (values) =>
      createInstitutionRoom({
        building_id: requiredInt(values, "building_id"),
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        capacity:
          values.capacity === "" || values.capacity === undefined
            ? null
            : Number(values.capacity),
        type: values.type === "" ? null : String(values.type ?? ""),
      }),
    update: async (id, values) =>
      updateInstitutionRoom(id, {
        building_id: requiredInt(values, "building_id"),
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        capacity:
          values.capacity === "" || values.capacity === undefined
            ? null
            : Number(values.capacity),
        type: values.type === "" ? null : String(values.type ?? ""),
      }),
    remove: async (id) => deleteInstitutionRoom(id),
    loadFieldOptions: async () => {
      const buildings = await listBuildings();
      return {
        building_id: buildings.map((b) => ({
          value: String(b.id),
          label: b.code ? `${b.name} (${b.code})` : b.name,
        })),
      };
    },
  },
  recruitment: {
    apiPath: "/hr-job-postings",
    loadRecord: async (id) => jobPostingToForm(await getHrJobPosting(id)),
    create: async (values) =>
      createHrJobPosting({
        title: String(values.title),
        description: String(values.description),
        application_deadline: String(values.application_deadline),
        department_id:
          values.department_id === "" || values.department_id === undefined
            ? null
            : Number(values.department_id),
        status: values.status ? String(values.status) : "ouvert",
      }),
    update: async (id, values) =>
      updateHrJobPosting(id, {
        title: String(values.title),
        description: String(values.description),
        application_deadline: String(values.application_deadline),
        department_id:
          values.department_id === "" || values.department_id === undefined
            ? null
            : Number(values.department_id),
        status: values.status ? String(values.status) : "ouvert",
      }),
    remove: async (id) => deleteHrJobPosting(id),
    loadFieldOptions: async () => {
      const departments = await listDepartments();
      return {
        department_id: departments.map((d) => ({
          value: String(d.id),
          label: d.code ? `${d.name} (${d.code})` : d.name,
        })),
      };
    },
  },
  "hr-applications": {
    apiPath: "/hr-applications",
    loadRecord: async (id) => hrApplicationToForm(await getHrApplication(id)),
    create: async (values) =>
      createHrApplication({
        hr_job_posting_id: requiredInt(values, "hr_job_posting_id"),
        first_name: String(values.first_name),
        last_name: String(values.last_name),
        email: String(values.email),
        phone: values.phone === "" ? null : String(values.phone ?? ""),
        applied_position: String(values.applied_position),
        applied_at:
          values.applied_at === "" || values.applied_at === undefined
            ? undefined
            : String(values.applied_at),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    update: async (id, values) =>
      updateHrApplication(id, {
        first_name: String(values.first_name),
        last_name: String(values.last_name),
        email: String(values.email),
        phone: values.phone === "" ? null : String(values.phone ?? ""),
        applied_position: String(values.applied_position),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    remove: async (id) => deleteHrApplication(id),
    loadFieldOptions: async () => {
      const postings = await listHrJobPostings();
      return {
        hr_job_posting_id: postings.map((p) => ({
          value: String(p.id),
          label: p.title,
        })),
      };
    },
  },
  leave: {
    apiPath: "/staff-leaves",
    loadRecord: async (id) => staffLeaveToForm(await getStaffLeave(id)),
    create: async (values) =>
      createStaffLeave({
        staff_member_id: requiredInt(values, "staff_member_id"),
        leave_type: String(values.leave_type),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
        reason: values.reason === "" ? null : String(values.reason ?? ""),
      }),
    update: async (id, values) =>
      updateStaffLeave(id, {
        leave_type: String(values.leave_type),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
        reason: values.reason === "" ? null : String(values.reason ?? ""),
      }),
    remove: async (id) => deleteStaffLeave(id),
    loadFieldOptions: async () => {
      const members = await listStaffMembers();
      return {
        staff_member_id: members.map((m) => ({
          value: String(m.id),
          label: staffMemberName(m),
        })),
      };
    },
  },
  payroll: {
    apiPath: "/staff-payrolls",
    loadRecord: async (id) => staffPayrollToForm(await getStaffPayroll(id)),
    create: async (values) =>
      createStaffPayroll({
        staff_member_id: requiredInt(values, "staff_member_id"),
        period_month: Number(values.period_month),
        period_year: Number(values.period_year),
        base_salary: Number(values.base_salary),
        allowances:
          values.allowances === "" || values.allowances === undefined
            ? 0
            : Number(values.allowances),
        deductions:
          values.deductions === "" || values.deductions === undefined
            ? 0
            : Number(values.deductions),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    update: async (id, values) =>
      updateStaffPayroll(id, {
        base_salary: Number(values.base_salary),
        allowances:
          values.allowances === "" || values.allowances === undefined
            ? 0
            : Number(values.allowances),
        deductions:
          values.deductions === "" || values.deductions === undefined
            ? 0
            : Number(values.deductions),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    remove: async (id) => deleteStaffPayroll(id),
    loadFieldOptions: async () => {
      const members = await listStaffMembers();
      return {
        staff_member_id: members.map((m) => ({
          value: String(m.id),
          label: staffMemberName(m),
        })),
      };
    },
  },
  "staff-evaluations": {
    apiPath: "/staff-evaluations",
    loadRecord: async (id) => staffEvaluationToForm(await getStaffEvaluation(id)),
    create: async (values) =>
      createStaffEvaluation({
        staff_member_id: requiredInt(values, "staff_member_id"),
        evaluation_date: String(values.evaluation_date),
        period_label: String(values.period_label),
        overall_score: Number(values.overall_score),
        strengths: values.strengths === "" ? null : String(values.strengths ?? ""),
        improvements:
          values.improvements === "" ? null : String(values.improvements ?? ""),
        comments: values.comments === "" ? null : String(values.comments ?? ""),
        status: values.status ? String(values.status) : "draft",
      }),
    update: async (id, values) =>
      updateStaffEvaluation(id, {
        evaluation_date: String(values.evaluation_date),
        period_label: String(values.period_label),
        overall_score: Number(values.overall_score),
        strengths: values.strengths === "" ? null : String(values.strengths ?? ""),
        improvements:
          values.improvements === "" ? null : String(values.improvements ?? ""),
        comments: values.comments === "" ? null : String(values.comments ?? ""),
        status: values.status ? String(values.status) : "draft",
      }),
    remove: async (id) => deleteStaffEvaluation(id),
    loadFieldOptions: async () => {
      const members = await listStaffMembers();
      return {
        staff_member_id: members.map((m) => ({
          value: String(m.id),
          label: staffMemberName(m),
        })),
      };
    },
  },
  "staff-members": {
    apiPath: "/staff-members",
    loadRecord: async (id) => staffMemberToForm(await getStaffMember(id)),
    create: async (values) =>
      createStaffMember({
        first_name: String(values.first_name),
        last_name: String(values.last_name),
        email: String(values.email),
        phone: String(values.phone),
        job_title: String(values.job_title),
        department_id:
          values.department_id === "" || values.department_id === undefined
            ? null
            : Number(values.department_id),
        employee_number:
          values.employee_number === "" ? null : String(values.employee_number ?? ""),
        hired_at:
          values.hired_at === "" || values.hired_at === undefined
            ? null
            : String(values.hired_at),
        status: values.status ? String(values.status) : "active",
        create_portal_account: Boolean(values.create_portal_account),
      }),
    update: async (id, values) =>
      updateStaffMember(id, {
        first_name: String(values.first_name),
        last_name: String(values.last_name),
        email: String(values.email),
        phone: String(values.phone),
        job_title: String(values.job_title),
        department_id:
          values.department_id === "" || values.department_id === undefined
            ? null
            : Number(values.department_id),
        employee_number:
          values.employee_number === "" ? null : String(values.employee_number ?? ""),
        hired_at:
          values.hired_at === "" || values.hired_at === undefined
            ? null
            : String(values.hired_at),
        status: values.status ? String(values.status) : "active",
      }),
    remove: async (id) => deleteStaffMember(id),
    loadFieldOptions: async () => {
      const departments = await listDepartments();
      return {
        department_id: departments.map((d) => ({
          value: String(d.id),
          label: d.code ? `${d.name} (${d.code})` : d.name,
        })),
      };
    },
  },
  departments: {
    apiPath: "/departments",
    loadRecord: async (id) => departmentToForm(await getDepartment(id)),
    create: async (values) =>
      createDepartment({
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        description:
          values.description === "" ? null : String(values.description ?? ""),
      }),
    update: async (id, values) =>
      updateDepartment(id, {
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        description:
          values.description === "" ? null : String(values.description ?? ""),
      }),
    remove: async (id) => deleteDepartment(id),
  },
  "staff-attendance": {
    apiPath: "/staff-attendance",
    loadRecord: async (id) => staffAttendanceToForm(await getStaffAttendance(id)),
    create: async (values) =>
      createStaffAttendance({
        staff_member_id: requiredInt(values, "staff_member_id"),
        attendance_date: String(values.attendance_date),
        status: String(values.status),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    update: async (id, values) =>
      updateStaffAttendance(id, {
        status: String(values.status),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    remove: async (id) => deleteStaffAttendance(id),
    loadFieldOptions: async () => {
      const members = await listStaffMembers();
      return {
        staff_member_id: members.map((m) => ({
          value: String(m.id),
          label: staffMemberName(m),
        })),
      };
    },
  },
  "canteen-menus": {
    apiPath: "/canteen-menus",
    loadRecord: async (id) => canteenMenuToForm(await getCanteenMenu(id)),
    create: async (values) =>
      createCanteenMenu({
        day_of_week: String(values.day_of_week),
        starter: String(values.starter),
        main_course: String(values.main_course),
        dessert: values.dessert === "" ? null : String(values.dessert ?? ""),
        price: Number(values.price),
        is_active: values.is_active === undefined ? true : Boolean(values.is_active),
      }),
    update: async (id, values) =>
      updateCanteenMenu(id, {
        day_of_week: String(values.day_of_week),
        starter: String(values.starter),
        main_course: String(values.main_course),
        dessert: values.dessert === "" ? null : String(values.dessert ?? ""),
        price: Number(values.price),
        is_active: Boolean(values.is_active),
      }),
    remove: async (id) => deleteCanteenMenu(id),
  },
  "canteen-accounts": {
    apiPath: "/canteen-accounts",
    loadRecord: async (id) => canteenAccountToForm(await getCanteenAccount(id)),
    create: async (values) =>
      createCanteenAccount({
        student_id: requiredInt(values, "student_id"),
        status: values.status ? String(values.status) : "ACTIVE",
      }),
    update: async (id, values) =>
      updateCanteenAccount(id, {
        status: String(values.status || "ACTIVE"),
      }),
    remove: async (id) => deleteCanteenAccount(id),
    loadFieldOptions: async () => {
      const students = await listStudents();
      return {
        student_id: students.map((s) => ({
          value: String(s.id),
          label: studentFullName(s),
        })),
      };
    },
  },
  "special-diets": {
    apiPath: "/canteen-special-diets",
    loadRecord: async (id) =>
      canteenSpecialDietToForm(await getCanteenSpecialDiet(id)),
    create: async (values) =>
      createCanteenSpecialDiet({
        student_id: requiredInt(values, "student_id"),
        diet_type: String(values.diet_type),
        allergens: String(values.allergens),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
        is_active: values.is_active === undefined ? true : Boolean(values.is_active),
      }),
    update: async (id, values) =>
      updateCanteenSpecialDiet(id, {
        diet_type: String(values.diet_type),
        allergens: String(values.allergens),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
        is_active: Boolean(values.is_active),
      }),
    remove: async (id) => deleteCanteenSpecialDiet(id),
    loadFieldOptions: async () => {
      const students = await listStudents();
      return {
        student_id: students.map((s) => ({
          value: String(s.id),
          label: studentFullName(s),
        })),
      };
    },
  },
  fleet: {
    apiPath: "/transport-vehicles",
    loadRecord: async (id) => vehicleToForm(await getTransportVehicle(id)),
    create: async (values) =>
      createTransportVehicle({
        plate_number: String(values.plate_number),
        label: String(values.label),
        capacity:
          values.capacity === "" || values.capacity === undefined
            ? null
            : Number(values.capacity),
        status: values.status ? String(values.status) : "ACTIVE",
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    update: async (id, values) =>
      updateTransportVehicle(id, {
        plate_number: String(values.plate_number),
        label: String(values.label),
        capacity:
          values.capacity === "" || values.capacity === undefined
            ? null
            : Number(values.capacity),
        status: values.status ? String(values.status) : "ACTIVE",
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      }),
    remove: async (id) => deleteTransportVehicle(id),
  },
  drivers: {
    apiPath: "/transport-drivers",
    loadRecord: async (id) => driverToForm(await getTransportDriver(id)),
    create: async (values) =>
      createTransportDriver({
        first_name: String(values.first_name),
        last_name: String(values.last_name),
        phone: values.phone === "" ? null : String(values.phone ?? ""),
        email: values.email === "" ? null : String(values.email ?? ""),
        license_number:
          values.license_number === "" ? null : String(values.license_number ?? ""),
        status: values.status ? String(values.status) : "ACTIVE",
        hired_at:
          values.hired_at === "" || values.hired_at === undefined
            ? null
            : String(values.hired_at),
      }),
    update: async (id, values) =>
      updateTransportDriver(id, {
        first_name: String(values.first_name),
        last_name: String(values.last_name),
        phone: values.phone === "" ? null : String(values.phone ?? ""),
        email: values.email === "" ? null : String(values.email ?? ""),
        license_number:
          values.license_number === "" ? null : String(values.license_number ?? ""),
        status: values.status ? String(values.status) : "ACTIVE",
        hired_at:
          values.hired_at === "" || values.hired_at === undefined
            ? null
            : String(values.hired_at),
      }),
    remove: async (id) => deleteTransportDriver(id),
  },
  "transport-routes": {
    apiPath: "/transport-routes",
    loadRecord: async (id) => routeToForm(await getTransportRoute(id)),
    create: async (values) => {
      const stops = parseStopsText(String(values.stops_text ?? ""));
      if (stops.length === 0) throw new Error("Au moins un arrêt est requis.");
      return createTransportRoute({
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        description:
          values.description === "" ? null : String(values.description ?? ""),
        transport_vehicle_id:
          values.transport_vehicle_id === "" ||
          values.transport_vehicle_id === undefined
            ? null
            : Number(values.transport_vehicle_id),
        transport_driver_id:
          values.transport_driver_id === "" ||
          values.transport_driver_id === undefined
            ? null
            : Number(values.transport_driver_id),
        is_active: values.is_active === undefined ? true : Boolean(values.is_active),
        stops,
      });
    },
    update: async (id, values) => {
      const stops = parseStopsText(String(values.stops_text ?? ""));
      const payload: Record<string, unknown> = {
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        description:
          values.description === "" ? null : String(values.description ?? ""),
        transport_vehicle_id:
          values.transport_vehicle_id === "" ||
          values.transport_vehicle_id === undefined
            ? null
            : Number(values.transport_vehicle_id),
        transport_driver_id:
          values.transport_driver_id === "" ||
          values.transport_driver_id === undefined
            ? null
            : Number(values.transport_driver_id),
        is_active: Boolean(values.is_active),
      };
      if (stops.length > 0) payload.stops = stops;
      return updateTransportRoute(id, payload);
    },
    remove: async (id) => deleteTransportRoute(id),
    loadFieldOptions: async () => {
      const [vehicles, drivers] = await Promise.all([
        listTransportVehicles(),
        listTransportDrivers(),
      ]);
      return {
        transport_vehicle_id: vehicles.map((v) => ({
          value: String(v.id),
          label: `${v.label} (${v.plate_number})`,
        })),
        transport_driver_id: drivers.map((d) => ({
          value: String(d.id),
          label: transportDriverName(d),
        })),
      };
    },
  },
  "transport-subscriptions": {
    apiPath: "/transport-subscriptions",
    loadRecord: async (id) =>
      subscriptionToForm(await getTransportSubscription(id)),
    create: async (values) =>
      createTransportSubscription({
        student_id: requiredInt(values, "student_id"),
        transport_route_id: requiredInt(values, "transport_route_id"),
        academic_year_id: requiredInt(values, "academic_year_id"),
        start_date: String(values.start_date),
        end_date:
          values.end_date === "" || values.end_date === undefined
            ? null
            : String(values.end_date),
        monthly_fee:
          values.monthly_fee === "" || values.monthly_fee === undefined
            ? null
            : Number(values.monthly_fee),
        transport_route_stop_id:
          values.transport_route_stop_id === "" ||
          values.transport_route_stop_id === undefined
            ? null
            : Number(values.transport_route_stop_id),
        status: values.status ? String(values.status) : "ACTIVE",
      }),
    update: async (id, values) =>
      updateTransportSubscription(id, {
        transport_route_id: requiredInt(values, "transport_route_id"),
        transport_route_stop_id:
          values.transport_route_stop_id === "" ||
          values.transport_route_stop_id === undefined
            ? null
            : Number(values.transport_route_stop_id),
        start_date: String(values.start_date),
        end_date:
          values.end_date === "" || values.end_date === undefined
            ? null
            : String(values.end_date),
        monthly_fee:
          values.monthly_fee === "" || values.monthly_fee === undefined
            ? null
            : Number(values.monthly_fee),
        status: values.status ? String(values.status) : "ACTIVE",
      }),
    remove: async (id) => deleteTransportSubscription(id),
    loadFieldOptions: async () => {
      const [students, routes, years] = await Promise.all([
        listStudents(),
        listTransportRoutes(),
        listAcademicYears(),
      ]);
      const stopOptions = routes.flatMap((r) =>
        (r.stops ?? []).map((s) => ({
          value: String(s.id),
          label: `${r.name} — ${s.name}`,
        }))
      );
      return {
        student_id: students.map((s) => ({
          value: String(s.id),
          label: studentFullName(s),
        })),
        transport_route_id: routes.map((r) => ({
          value: String(r.id),
          label: r.code ? `${r.name} (${r.code})` : r.name,
        })),
        transport_route_stop_id: stopOptions,
        academic_year_id: years.map((y) => ({
          value: String(y.id),
          label: y.name,
        })),
      };
    },
  },
  supplies: {
    apiPath: "/inventory-supplies",
    loadRecord: async (id) => supplyToForm(await getInventorySupply(id)),
    create: async (values) =>
      createInventorySupply({
        designation: String(values.designation),
        category: String(values.category),
        quantity:
          values.quantity === "" || values.quantity === undefined
            ? 0
            : Number(values.quantity),
        alert_threshold:
          values.alert_threshold === "" || values.alert_threshold === undefined
            ? null
            : Number(values.alert_threshold),
        unit: values.unit === "" ? null : String(values.unit ?? ""),
        supplier: values.supplier === "" ? null : String(values.supplier ?? ""),
        is_active: values.is_active === undefined ? true : Boolean(values.is_active),
      }),
    update: async (id, values) =>
      updateInventorySupply(id, {
        designation: String(values.designation),
        category: String(values.category),
        quantity:
          values.quantity === "" || values.quantity === undefined
            ? 0
            : Number(values.quantity),
        alert_threshold:
          values.alert_threshold === "" || values.alert_threshold === undefined
            ? null
            : Number(values.alert_threshold),
        unit: values.unit === "" ? null : String(values.unit ?? ""),
        supplier: values.supplier === "" ? null : String(values.supplier ?? ""),
        is_active: Boolean(values.is_active),
      }),
    remove: async (id) => deleteInventorySupply(id),
  },
  assets: {
    apiPath: "/inventory-assets",
    loadRecord: async (id) => assetToForm(await getInventoryAsset(id)),
    create: async (values) =>
      createInventoryAsset({
        designation: String(values.designation),
        category: String(values.category),
        serial_number:
          values.serial_number === "" ? null : String(values.serial_number ?? ""),
        acquisition_date:
          values.acquisition_date === "" || values.acquisition_date === undefined
            ? null
            : String(values.acquisition_date),
        value:
          values.value === "" || values.value === undefined
            ? null
            : Number(values.value),
        location: values.location === "" ? null : String(values.location ?? ""),
        status: values.status ? String(values.status) : "en_service",
        assigned_staff_member_id:
          values.assigned_staff_member_id === "" ||
          values.assigned_staff_member_id === undefined
            ? null
            : Number(values.assigned_staff_member_id),
        assigned_room_id:
          values.assigned_room_id === "" || values.assigned_room_id === undefined
            ? null
            : Number(values.assigned_room_id),
      }),
    update: async (id, values) =>
      updateInventoryAsset(id, {
        designation: String(values.designation),
        category: String(values.category),
        serial_number:
          values.serial_number === "" ? null : String(values.serial_number ?? ""),
        acquisition_date:
          values.acquisition_date === "" || values.acquisition_date === undefined
            ? null
            : String(values.acquisition_date),
        value:
          values.value === "" || values.value === undefined
            ? null
            : Number(values.value),
        location: values.location === "" ? null : String(values.location ?? ""),
        status: values.status ? String(values.status) : "en_service",
        assigned_staff_member_id:
          values.assigned_staff_member_id === "" ||
          values.assigned_staff_member_id === undefined
            ? null
            : Number(values.assigned_staff_member_id),
        assigned_room_id:
          values.assigned_room_id === "" || values.assigned_room_id === undefined
            ? null
            : Number(values.assigned_room_id),
      }),
    remove: async (id) => deleteInventoryAsset(id),
    loadFieldOptions: async () => {
      const [members, rooms] = await Promise.all([
        listStaffMembers(),
        listInstitutionRooms(),
      ]);
      return {
        assigned_staff_member_id: members.map((m) => ({
          value: String(m.id),
          label: staffMemberName(m),
        })),
        assigned_room_id: rooms.map((r) => ({
          value: String(r.id),
          label: r.code ? `${r.name} (${r.code})` : r.name,
        })),
      };
    },
  },
  "academic-years": {
    apiPath: "/academic-years",
    loadRecord: async (id) => {
      const row = await getAcademicYear(id);
      return {
        name: row.name ?? "",
        start_date: row.start_date ?? row.starts_on ?? "",
        end_date: row.end_date ?? row.ends_on ?? "",
      };
    },
    create: async (values) =>
      createAcademicYear({
        name: String(values.name),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
      }),
    update: async (id, values) =>
      updateAcademicYear(id, {
        name: String(values.name),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
      }),
    remove: async (id) => deleteAcademicYear(id),
  },
  "academic-periods": {
    apiPath: "/academic-periods",
    loadRecord: async (id) => {
      const row = await getAcademicPeriod(id);
      return {
        academic_year_id: String(row.academic_year_id),
        name: row.name ?? "",
        type: row.type ?? "",
        start_date: row.start_date ?? "",
        end_date: row.end_date ?? "",
        sort_order: row.sort_order != null ? String(row.sort_order) : "",
      };
    },
    create: async (values) => {
      const payload: Record<string, unknown> = {
        academic_year_id: Number(values.academic_year_id),
        name: String(values.name),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
      };
      if (values.type) payload.type = String(values.type);
      if (values.sort_order !== "" && values.sort_order !== undefined) {
        payload.sort_order = Number(values.sort_order);
      }
      return createAcademicPeriod(payload);
    },
    update: async (id, values) => {
      const payload: Record<string, unknown> = {
        academic_year_id: Number(values.academic_year_id),
        name: String(values.name),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
        type: values.type === "" ? null : String(values.type ?? ""),
      };
      if (values.sort_order !== "" && values.sort_order !== undefined) {
        payload.sort_order = Number(values.sort_order);
      }
      return updateAcademicPeriod(id, payload);
    },
    remove: async (id) => deleteAcademicPeriod(id),
    loadFieldOptions: async () => {
      const years = await listAcademicYears();
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
      };
    },
  },
  "academic-holidays": {
    apiPath: "/academic-holidays",
    loadRecord: async (id) => {
      const row = await getAcademicHoliday(id);
      return {
        academic_year_id: String(row.academic_year_id),
        name: row.name ?? "",
        start_date: row.start_date ?? "",
        end_date: row.end_date ?? "",
      };
    },
    create: async (values) =>
      createAcademicHoliday({
        academic_year_id: Number(values.academic_year_id),
        name: String(values.name),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
      }),
    update: async (id, values) =>
      updateAcademicHoliday(id, {
        academic_year_id: Number(values.academic_year_id),
        name: String(values.name),
        start_date: String(values.start_date),
        end_date: String(values.end_date),
      }),
    remove: async (id) => deleteAcademicHoliday(id),
    loadFieldOptions: async () => {
      const years = await listAcademicYears();
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
      };
    },
  },
  levels: {
    apiPath: "/levels",
    loadRecord: async (id) => {
      const row = await getLevel(id);
      return {
        name: row.name ?? "",
        code: row.code ?? "",
        sort_order: row.sort_order != null ? String(row.sort_order) : "",
      };
    },
    create: async (values) => {
      const payload: Record<string, unknown> = { name: String(values.name) };
      if (values.code) payload.code = String(values.code);
      if (values.sort_order !== "" && values.sort_order !== undefined) {
        payload.sort_order = Number(values.sort_order);
      }
      return createLevel(payload);
    },
    update: async (id, values) => {
      const payload: Record<string, unknown> = {
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
      };
      if (values.sort_order !== "" && values.sort_order !== undefined) {
        payload.sort_order = Number(values.sort_order);
      }
      return updateLevel(id, payload);
    },
    remove: async (id) => deleteLevel(id),
  },
  series: {
    apiPath: "/series",
    loadRecord: async (id) => {
      const row = await getSeries(id);
      return {
        level_id: String(row.level_id),
        name: row.name ?? "",
        code: row.code ?? "",
      };
    },
    create: async (values) =>
      createSeries({
        level_id: Number(values.level_id),
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
      }),
    update: async (id, values) =>
      updateSeries(id, {
        level_id: Number(values.level_id),
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
      }),
    remove: async (id) => deleteSeries(id),
    loadFieldOptions: async () => {
      const levels = await listLevels();
      return {
        level_id: levels.map((l) => ({ value: String(l.id), label: l.name })),
      };
    },
  },
  "class-subjects": {
    apiPath: "/class-subjects",
    loadRecord: async (id) => {
      const row = await getClassSubject(id);
      return {
        class_group_id: String(row.class_group_id),
        subject_id: String(row.subject_id),
        coefficient: row.coefficient != null ? String(row.coefficient) : "",
      };
    },
    create: async (values) => {
      const payload: Record<string, unknown> = {
        class_group_id: Number(values.class_group_id),
        subject_id: Number(values.subject_id),
      };
      if (values.coefficient !== "" && values.coefficient !== undefined) {
        payload.coefficient = Number(values.coefficient);
      }
      return createClassSubject(payload);
    },
    update: async (id, values) => {
      const payload: Record<string, unknown> = {
        class_group_id: Number(values.class_group_id),
        subject_id: Number(values.subject_id),
      };
      if (values.coefficient !== "" && values.coefficient !== undefined) {
        payload.coefficient = Number(values.coefficient);
      }
      return updateClassSubject(id, payload);
    },
    remove: async (id) => deleteClassSubject(id),
    loadFieldOptions: async () => {
      const [classes, subjects, years] = await Promise.all([
        listClassGroups(),
        listSubjects(),
        listAcademicYears(),
      ]);
      return {
        class_group_id: classGroupFieldOptions(classes, years),
        subject_id: subjects.map((s) => ({
          value: String(s.id),
          label: s.code ? `${s.name} (${s.code})` : s.name,
        })),
      };
    },
  },
  "fee-categories": {
    apiPath: "/fee-categories",
    loadRecord: async (id) => {
      const row = await getFeeCategory(id);
      return {
        name: row.name ?? "",
        code: row.code ?? "",
        description: row.description ?? "",
        is_active: Boolean(row.is_active),
      };
    },
    create: async (values) =>
      createFeeCategory({
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        description: values.description === "" ? null : String(values.description ?? ""),
        is_active: Boolean(values.is_active),
      }),
    update: async (id, values) =>
      updateFeeCategory(id, {
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        description: values.description === "" ? null : String(values.description ?? ""),
        is_active: Boolean(values.is_active),
      }),
    remove: async (id) => deleteFeeCategory(id),
  },
  "fee-structures": {
    apiPath: "/fee-structures",
    loadRecord: async (id) => {
      const row = await getFeeStructure(id);
      return {
        academic_year_id: String(row.academic_year_id),
        level_id: row.level_id != null ? String(row.level_id) : "",
        name: row.name ?? "",
        description: row.description ?? "",
        is_active: Boolean(row.is_active),
      };
    },
    create: async (values) => {
      const payload: Record<string, unknown> = {
        academic_year_id: Number(values.academic_year_id),
        name: String(values.name),
        description: values.description === "" ? null : String(values.description ?? ""),
        is_active: Boolean(values.is_active),
      };
      optionalInt(values, "level_id", "create", payload);
      return createFeeStructure(payload);
    },
    update: async (id, values) => {
      const payload: Record<string, unknown> = {
        name: String(values.name),
        description: values.description === "" ? null : String(values.description ?? ""),
        is_active: Boolean(values.is_active),
      };
      optionalInt(values, "level_id", "edit", payload);
      return updateFeeStructure(id, payload);
    },
    remove: async (id) => deleteFeeStructure(id),
    loadFieldOptions: async () => {
      const [years, levels] = await Promise.all([listAcademicYears(), listLevels()]);
      return {
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        level_id: levels.map((l) => ({ value: String(l.id), label: l.name })),
      };
    },
  },
  "fee-items": {
    apiPath: "/fee-items",
    loadRecord: async (id) => {
      const row = await getFeeItem(id);
      return {
        fee_structure_id: String(row.fee_structure_id),
        fee_category_id: String(row.fee_category_id),
        label: row.label ?? "",
        amount: String(row.amount ?? ""),
        is_mandatory: Boolean(row.is_mandatory),
        sort_order: row.sort_order != null ? String(row.sort_order) : "",
      };
    },
    create: async (values) => {
      const payload: Record<string, unknown> = {
        fee_structure_id: Number(values.fee_structure_id),
        fee_category_id: Number(values.fee_category_id),
        label: String(values.label),
        amount: Number(values.amount),
        is_mandatory: Boolean(values.is_mandatory),
      };
      if (values.sort_order !== "" && values.sort_order !== undefined) {
        payload.sort_order = Number(values.sort_order);
      }
      return createFeeItem(payload);
    },
    update: async (id, values) => {
      const payload: Record<string, unknown> = {
        fee_category_id: Number(values.fee_category_id),
        label: String(values.label),
        amount: Number(values.amount),
        is_mandatory: Boolean(values.is_mandatory),
      };
      if (values.sort_order !== "" && values.sort_order !== undefined) {
        payload.sort_order = Number(values.sort_order);
      }
      return updateFeeItem(id, payload);
    },
    remove: async (id) => deleteFeeItem(id),
    loadFieldOptions: async () => {
      const [structures, categories] = await Promise.all([
        listFeeStructures(),
        listFeeCategories(),
      ]);
      return {
        fee_structure_id: structures.map((s) => ({ value: String(s.id), label: s.name })),
        fee_category_id: categories.map((c) => ({ value: String(c.id), label: c.name })),
      };
    },
  },
  "cash-registers": {
    apiPath: "/cash-registers",
    loadRecord: async (id) => {
      const row = await getCashRegister(id);
      return {
        name: row.name ?? "",
        code: row.code ?? "",
        opening_balance: String(row.opening_balance ?? ""),
        is_active: Boolean(row.is_active),
      };
    },
    create: async (values) => {
      const payload: Record<string, unknown> = {
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        is_active: Boolean(values.is_active),
      };
      if (values.opening_balance !== "" && values.opening_balance !== undefined) {
        payload.opening_balance = Number(values.opening_balance);
      }
      return createCashRegister(payload);
    },
    update: async (id, values) =>
      updateCashRegister(id, {
        name: String(values.name),
        code: values.code === "" ? null : String(values.code ?? ""),
        is_active: Boolean(values.is_active),
      }),
    remove: async (id) => deleteCashRegister(id),
  },
  "cash-transactions": {
    apiPath: "/cash-transactions",
    loadRecord: async (id) => {
      const row = await getCashTransaction(id);
      return {
        cash_register_id: String(row.cash_register_id),
        type: row.type ?? "INCOME",
        direction: row.direction ?? "IN",
        amount: String(row.amount ?? ""),
        description: row.description ?? "",
        transaction_date: row.transaction_date ?? "",
      };
    },
    create: async (values) =>
      createCashTransaction({
        cash_register_id: Number(values.cash_register_id),
        type: String(values.type),
        direction: String(values.direction),
        amount: Number(values.amount),
        description: String(values.description),
        transaction_date: String(values.transaction_date),
      }),
    update: async () => {
      throw new Error("Les mouvements de caisse ne sont pas modifiables.");
    },
    remove: async () => {
      throw new Error("Les mouvements de caisse ne sont pas supprimables.");
    },
    loadFieldOptions: async () => {
      const registers = await listCashRegisters();
      return {
        cash_register_id: registers.map((r) => ({
          value: String(r.id),
          label: r.code ? `${r.name} (${r.code})` : r.name,
        })),
      };
    },
  },
  "re-enrollments": {
    apiPath: "/re-enrollments",
    loadRecord: async (id) => {
      const row = await getReEnrollment(id);
      return {
        student_id: String(row.student_id),
        academic_year_id: String(row.academic_year_id),
        previous_class_group_id:
          row.previous_class_group_id != null ? String(row.previous_class_group_id) : "",
        new_class_group_id:
          row.new_class_group_id != null ? String(row.new_class_group_id) : "",
        year_end_decision: row.year_end_decision ?? "",
        notes: row.notes ?? "",
      };
    },
    create: async (values) => {
      const payload: Record<string, unknown> = {
        student_id: Number(values.student_id),
        academic_year_id: Number(values.academic_year_id),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      };
      if (values.year_end_decision) {
        payload.year_end_decision = String(values.year_end_decision);
      }
      optionalInt(values, "previous_class_group_id", "create", payload);
      optionalInt(values, "new_class_group_id", "create", payload);
      return createReEnrollment(payload);
    },
    update: async (id, values) => {
      const payload: Record<string, unknown> = {
        academic_year_id: Number(values.academic_year_id),
        notes: values.notes === "" ? null : String(values.notes ?? ""),
      };
      payload.year_end_decision =
        values.year_end_decision === "" || values.year_end_decision === undefined
          ? null
          : String(values.year_end_decision);
      optionalInt(values, "previous_class_group_id", "edit", payload);
      optionalInt(values, "new_class_group_id", "edit", payload);
      return updateReEnrollment(id, payload);
    },
    remove: async (id) => deleteReEnrollment(id),
    loadFieldOptions: async () => {
      const [students, years, classes] = await Promise.all([
        listStudents(),
        listAcademicYears(),
        listClassGroups(),
      ]);
      return {
        student_id: students.map((s) => ({
          value: String(s.id),
          label: `${studentFullName(s)} (${s.matricule})`,
        })),
        academic_year_id: years.map((y) => ({ value: String(y.id), label: y.name })),
        previous_class_group_id: classGroupFieldOptions(classes, years),
        new_class_group_id: classGroupFieldOptions(classes, years),
      };
    },
  },
};

export function getCrudAdapter(resourceKey: string): CrudAdapter | undefined {
  return CRUD_ADAPTERS[resourceKey];
}
