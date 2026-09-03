import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/api/resources/students", () => ({
  getStudent: vi.fn(),
  createStudent: vi.fn(),
  updateStudent: vi.fn(),
  deleteStudent: vi.fn(),
  listStudents: vi.fn(async () => [
    {
      id: 7,
      institution_id: 1,
      user_id: null,
      matricule: "EL-007",
      first_name: "Awa",
      last_name: "Koné",
      birth_date: "2010-01-01",
      gender: "F",
      email: null,
      phone: null,
      address: null,
      level_id: 1,
      class_group_id: 2,
      status: "active",
      enrolled_at: null,
      avatar_url: null,
    },
  ]),
}));

vi.mock("@/infrastructure/api/resources/attendance", () => ({
  getAttendance: vi.fn(),
  createAttendance: vi.fn(),
  updateAttendance: vi.fn(),
  deleteAttendance: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/guardians", () => ({
  getGuardian: vi.fn(),
  createGuardian: vi.fn(),
  updateGuardian: vi.fn(),
  deleteGuardian: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/teachers", () => ({
  getTeacher: vi.fn(),
  createTeacher: vi.fn(),
  updateTeacher: vi.fn(),
  deleteTeacher: vi.fn(),
  listTeachers: vi.fn(async () => [
    {
      id: 1,
      user_id: 10,
      first_name: "Fatou",
      last_name: "Diabaté",
      institution_id: 1,
      employee_number: "E1",
      email: "f@ci",
      phone: "01",
      main_subject_id: null,
      grade_title: null,
      hired_at: null,
      status: "active",
    },
  ]),
}));

vi.mock("@/infrastructure/api/resources/academic", () => ({
  listLevels: vi.fn(async () => [{ id: 1, name: "2nde" }]),
  listClassGroups: vi.fn(async () => [
    { id: 2, name: "2nde A", level_id: 1, academic_year_id: 1 },
  ]),
  listSubjects: vi.fn(async () => [{ id: 5, name: "Mathématiques", code: "MATH" }]),
  listAcademicYears: vi.fn(async () => [{ id: 1, name: "2025-2026", is_active: true }]),
  listAcademicPeriods: vi.fn(async () => [{ id: 1, name: "Trimestre 1" }]),
  listSeries: vi.fn(async () => [{ id: 1, name: "A" }]),
  listRooms: vi.fn(async () => [{ id: 1, name: "Salle 1" }]),
  getClassGroup: vi.fn(),
  createClassGroup: vi.fn(),
  updateClassGroup: vi.fn(),
  deleteClassGroup: vi.fn(),
  getSubject: vi.fn(),
  createSubject: vi.fn(),
  updateSubject: vi.fn(),
  deleteSubject: vi.fn(),
  getTimetableSlot: vi.fn(),
  createTimetableSlot: vi.fn(),
  updateTimetableSlot: vi.fn(),
  deleteTimetableSlot: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/assessments", () => ({
  getAssessment: vi.fn(),
  createAssessment: vi.fn(),
  updateAssessment: vi.fn(),
  deleteAssessment: vi.fn(),
  listAssessments: vi.fn(async () => [
    { id: 5, title: "Devoir 1", date: "2026-09-02" },
  ]),
}));

vi.mock("@/infrastructure/api/resources/assignments", () => ({
  getAssignment: vi.fn(),
  createAssignment: vi.fn(),
  updateAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/grades", () => ({
  getGrade: vi.fn(),
  createGrade: vi.fn(),
  updateGrade: vi.fn(),
  deleteGrade: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/report-cards", () => ({
  getReportCard: vi.fn(),
  createReportCard: vi.fn(),
  updateReportCard: vi.fn(),
  deleteReportCard: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/discipline", () => ({
  getDisciplineRecord: vi.fn(),
  createDisciplineRecord: vi.fn(),
  updateDisciplineRecord: vi.fn(),
  deleteDisciplineRecord: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/enrollments", () => ({
  getEnrollment: vi.fn(),
  createEnrollment: vi.fn(),
  updateEnrollment: vi.fn(),
  deleteEnrollment: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/library", () => ({
  getLibraryBook: vi.fn(),
  createLibraryBook: vi.fn(),
  updateLibraryBook: vi.fn(),
  deleteLibraryBook: vi.fn(),
  listLibraryBooks: vi.fn(async () => [{ id: 1, title: "Algèbre", author: "X" }]),
  getLibraryCopy: vi.fn(),
  createLibraryCopy: vi.fn(),
  updateLibraryCopy: vi.fn(),
  deleteLibraryCopy: vi.fn(),
  listLibraryCopies: vi.fn(async () => [
    { id: 2, copy_code: "A-01", library_book_id: 1, status: "AVAILABLE" },
  ]),
  createLibraryLoan: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/finance", () => ({
  getInvoice: vi.fn(),
  createInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  deleteInvoice: vi.fn(),
  listUnpaidInvoices: vi.fn(async () => [
    {
      id: 3,
      invoice_number: "INV-3",
      student_id: 7,
      balance_due: 8000,
      student: { first_name: "Awa", last_name: "Koné", matricule: "EL-007" },
    },
  ]),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  listCashRegisters: vi.fn(async () => [{ id: 1, name: "Caisse principale", code: "CP" }]),
}));

vi.mock("@/infrastructure/api/resources/payments", () => ({
  initiatePayment: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/communication", () => ({
  getAnnouncement: vi.fn(),
  createAnnouncement: vi.fn(),
  updateAnnouncement: vi.fn(),
  deleteAnnouncement: vi.fn(),
  createConversation: vi.fn(),
}));

vi.mock("@/infrastructure/api/resources/documents", () => ({
  getDocumentCategory: vi.fn(),
  createDocumentCategory: vi.fn(),
  updateDocumentCategory: vi.fn(),
  deleteDocumentCategory: vi.fn(),
  listDocumentCategories: vi.fn(async () => [{ id: 1, name: "RH", code: "RH" }]),
  getDocument: vi.fn(),
  updateDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

import { createClassGroup, createSubject, createTimetableSlot } from "@/infrastructure/api/resources/academic";
import { createAssessment } from "@/infrastructure/api/resources/assessments";
import {
  createAssignment,
  updateAssignment,
} from "@/infrastructure/api/resources/assignments";
import { createAttendance, updateAttendance } from "@/infrastructure/api/resources/attendance";
import { createGrade, updateGrade } from "@/infrastructure/api/resources/grades";
import { createReportCard, updateReportCard } from "@/infrastructure/api/resources/report-cards";
import {
  createDisciplineRecord,
  updateDisciplineRecord,
} from "@/infrastructure/api/resources/discipline";
import { createEnrollment } from "@/infrastructure/api/resources/enrollments";
import { createLibraryBook, createLibraryLoan } from "@/infrastructure/api/resources/library";
import { createExpense, createInvoice } from "@/infrastructure/api/resources/finance";
import { initiatePayment } from "@/infrastructure/api/resources/payments";
import {
  createAnnouncement,
  createConversation,
} from "@/infrastructure/api/resources/communication";
import { createDocumentCategory, updateDocument } from "@/infrastructure/api/resources/documents";
import { createGuardian, getGuardian } from "@/infrastructure/api/resources/guardians";
import { createStudent, getStudent } from "@/infrastructure/api/resources/students";
import { createTeacher, getTeacher } from "@/infrastructure/api/resources/teachers";
import { getCrudAdapter } from "@/infrastructure/api/crud-adapters";

describe("students crud adapter", () => {
  beforeEach(() => {
    vi.mocked(getStudent).mockReset();
    vi.mocked(createStudent).mockReset();
  });

  it("maps API student to form values and posts create payload", async () => {
    const adapter = getCrudAdapter("students");
    expect(adapter).toBeDefined();

    vi.mocked(getStudent).mockResolvedValue({
      id: 1,
      institution_id: 1,
      user_id: null,
      matricule: "ELV-1",
      first_name: "Aminata",
      last_name: "Koné",
      birth_date: "2008-01-01",
      gender: "F",
      email: "a@ecole.ci",
      phone: null,
      address: null,
      level_id: 1,
      class_group_id: 2,
      status: "active",
      enrolled_at: null,
      avatar_url: null,
    });

    const form = await adapter!.loadRecord("1");
    expect(form.first_name).toBe("Aminata");
    expect(form.level_id).toBe("1");

    vi.mocked(createStudent).mockResolvedValue({ id: 2 } as never);
    await adapter!.create({
      first_name: "Jean",
      last_name: "Traoré",
      birth_date: "2009-01-01",
      gender: "M",
      status: "active",
      level_id: "1",
      class_group_id: "",
      matricule: "",
      email: "",
      phone: "",
      address: "",
      enrolled_at: "",
    });

    expect(createStudent).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Jean",
        last_name: "Traoré",
        level_id: 1,
      })
    );
    expect(vi.mocked(createStudent).mock.calls[0][0]).not.toHaveProperty("class_group_id");
  });

  it("loads select options for levels and classes", async () => {
    const options = await getCrudAdapter("students")!.loadFieldOptions!();
    expect(options.level_id?.[0]).toEqual({ value: "1", label: "2nde" });
    expect(options.class_group_id?.[0]).toEqual({ value: "2", label: "2nde A" });
  });
});

describe("parents crud adapter", () => {
  beforeEach(() => {
    vi.mocked(getGuardian).mockReset();
    vi.mocked(createGuardian).mockReset();
  });

  it("maps guardian and creates with portal flag", async () => {
    const adapter = getCrudAdapter("parents");
    expect(adapter).toBeDefined();

    vi.mocked(getGuardian).mockResolvedValue({
      id: 1,
      institution_id: 1,
      user_id: 2,
      first_name: "Moussa",
      last_name: "Koné",
      email: "m@ci",
      phone: "01",
      profession: "Commerçant",
      address: "Abidjan",
    });

    const form = await adapter!.loadRecord("1");
    expect(form.last_name).toBe("Koné");
    expect(form.create_portal_account).toBe(false);

    vi.mocked(createGuardian).mockResolvedValue({ id: 3 } as never);
    await adapter!.create({
      first_name: "Awa",
      last_name: "Diallo",
      email: "awa@ci",
      phone: "02",
      profession: "",
      address: "",
      create_portal_account: true,
    });

    expect(createGuardian).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Awa",
        email: "awa@ci",
        create_portal_account: true,
      })
    );
  });
});

describe("teachers crud adapter", () => {
  beforeEach(() => {
    vi.mocked(getTeacher).mockReset();
    vi.mocked(createTeacher).mockReset();
  });

  it("maps teacher and creates with main_subject_id number", async () => {
    const adapter = getCrudAdapter("teachers");
    expect(adapter).toBeDefined();

    vi.mocked(getTeacher).mockResolvedValue({
      id: 1,
      institution_id: 1,
      user_id: 2,
      employee_number: "ENS-1",
      first_name: "Fatou",
      last_name: "Diabaté",
      email: "f@ci",
      phone: "01",
      main_subject_id: 5,
      grade_title: "Certifié",
      hired_at: "2020-01-01",
      status: "active",
    });

    const form = await adapter!.loadRecord("1");
    expect(form.main_subject_id).toBe("5");

    vi.mocked(createTeacher).mockResolvedValue({ id: 2 } as never);
    await adapter!.create({
      first_name: "Jean",
      last_name: "Kouassi",
      email: "j@ci",
      phone: "02",
      employee_number: "",
      main_subject_id: "5",
      grade_title: "",
      hired_at: "",
      status: "active",
      create_portal_account: true,
    });

    expect(createTeacher).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Jean",
        main_subject_id: 5,
        create_portal_account: true,
      })
    );

    const options = await adapter!.loadFieldOptions!();
    expect(options.main_subject_id?.[0]).toEqual({
      value: "5",
      label: "Mathématiques (MATH)",
    });
  });
});

describe("academic crud adapters", () => {
  it("creates class, subject and timetable payloads", async () => {
    vi.mocked(createClassGroup).mockResolvedValue({ id: 1 } as never);
    vi.mocked(createSubject).mockResolvedValue({ id: 1 } as never);
    vi.mocked(createTimetableSlot).mockResolvedValue({ id: 1 } as never);

    await getCrudAdapter("classes")!.create({
      name: "2nde A",
      academic_year_id: "1",
      level_id: "1",
      series_id: "",
      max_capacity: "40",
      head_teacher_id: "10",
      room_id: "",
    });
    expect(createClassGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "2nde A",
        academic_year_id: 1,
        level_id: 1,
        max_capacity: 40,
        head_teacher_id: 10,
      })
    );

    await getCrudAdapter("subjects")!.create({
      name: "Physique",
      code: "PHY",
      coefficient: "3",
      level_id: "1",
    });
    expect(createSubject).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Physique", code: "PHY", coefficient: 3, level_id: 1 })
    );

    await getCrudAdapter("schedules")!.create({
      academic_year_id: "1",
      class_group_id: "2",
      subject_id: "5",
      day_of_week: "monday",
      start_time: "08:00",
      end_time: "09:00",
      teacher_id: "",
      room_id: "",
    });
    expect(createTimetableSlot).toHaveBeenCalledWith(
      expect.objectContaining({
        day_of_week: "monday",
        class_group_id: 2,
        subject_id: 5,
      })
    );
  });
});

describe("attendance crud adapter", () => {
  it("creates attendance with numeric ids and updates status/notes", async () => {
    vi.mocked(createAttendance).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateAttendance).mockResolvedValue({ id: 1 } as never);

    await getCrudAdapter("attendance")!.create({
      academic_year_id: "1",
      class_group_id: "2",
      student_id: "7",
      date: "2026-09-02",
      status: "PRESENT",
      notes: "",
    });
    expect(createAttendance).toHaveBeenCalledWith(
      expect.objectContaining({
        academic_year_id: 1,
        class_group_id: 2,
        student_id: 7,
        date: "2026-09-02",
        status: "PRESENT",
      })
    );

    await getCrudAdapter("attendance")!.update("1", {
      academic_year_id: "1",
      class_group_id: "2",
      student_id: "7",
      date: "2026-09-02",
      status: "ABSENT",
      notes: "Malade",
    });
    expect(updateAttendance).toHaveBeenCalledWith("1", {
      status: "ABSENT",
      notes: "Malade",
    });

    const options = await getCrudAdapter("attendance")!.loadFieldOptions!();
    expect(options.student_id?.[0]).toEqual({
      value: "7",
      label: "Koné Awa (EL-007)",
    });
  });
});

describe("assessments & grades crud adapters", () => {
  it("creates assessment and grade payloads", async () => {
    vi.mocked(createAssessment).mockResolvedValue({ id: 1 } as never);
    vi.mocked(createGrade).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateGrade).mockResolvedValue({ id: 1 } as never);

    await getCrudAdapter("assessments")!.create({
      title: "Devoir 1",
      academic_year_id: "1",
      academic_period_id: "1",
      class_group_id: "2",
      subject_id: "5",
      type: "devoir",
      date: "2026-09-02",
      coefficient: "1",
      max_score: "20",
    });
    expect(createAssessment).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Devoir 1",
        academic_year_id: 1,
        academic_period_id: 1,
        class_group_id: 2,
        subject_id: 5,
        coefficient: 1,
        max_score: 20,
      })
    );

    await getCrudAdapter("grades")!.create({
      assessment_id: "5",
      student_id: "7",
      score: "15.5",
      comment: "Bien",
      reason: "",
    });
    expect(createGrade).toHaveBeenCalledWith({
      assessment_id: 5,
      student_id: 7,
      score: 15.5,
      comment: "Bien",
    });

    await getCrudAdapter("grades")!.update("9", {
      assessment_id: "5",
      student_id: "7",
      score: "16",
      comment: "",
      reason: "Erreur de saisie",
    });
    expect(updateGrade).toHaveBeenCalledWith("9", {
      score: 16,
      comment: null,
      reason: "Erreur de saisie",
    });
  });

  it("creates and updates homework assignments", async () => {
    vi.mocked(createAssignment).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateAssignment).mockResolvedValue({ id: 1 } as never);

    await getCrudAdapter("assignments")!.create({
      title: "DM 2",
      academic_year_id: "1",
      class_group_id: "2",
      subject_id: "5",
      due_at: "2026-09-10T18:00",
      max_score: "20",
      status: "PUBLISHED",
      description: "",
      instructions: "Rendre PDF",
    });
    expect(createAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "DM 2",
        academic_year_id: 1,
        class_group_id: 2,
        subject_id: 5,
        due_at: "2026-09-10T18:00",
        max_score: 20,
        status: "PUBLISHED",
        description: null,
        instructions: "Rendre PDF",
      })
    );

    await getCrudAdapter("assignments")!.update("3", {
      title: "DM 2b",
      academic_year_id: "1",
      class_group_id: "2",
      subject_id: "5",
      due_at: "2026-09-11T18:00",
      max_score: "15",
      status: "CLOSED",
      description: "Maj",
      instructions: "",
    });
    expect(updateAssignment).toHaveBeenCalledWith("3", {
      title: "DM 2b",
      due_at: "2026-09-11T18:00",
      max_score: 15,
      status: "CLOSED",
      description: "Maj",
      instructions: null,
    });
  });

  it("creates and updates report cards", async () => {
    vi.mocked(createReportCard).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateReportCard).mockResolvedValue({ id: 1 } as never);

    await getCrudAdapter("report-cards")!.create({
      student_id: "7",
      academic_period_id: "1",
      appreciation: "Bon trimestre",
    });
    expect(createReportCard).toHaveBeenCalledWith({
      student_id: 7,
      academic_period_id: 1,
      appreciation: "Bon trimestre",
    });

    await getCrudAdapter("report-cards")!.update("1", {
      student_id: "7",
      academic_period_id: "1",
      appreciation: "",
    });
    expect(updateReportCard).toHaveBeenCalledWith("1", { appreciation: null });
  });

  it("creates and updates discipline records", async () => {
    vi.mocked(createDisciplineRecord).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateDisciplineRecord).mockResolvedValue({ id: 1 } as never);

    await getCrudAdapter("discipline")!.create({
      student_id: "7",
      academic_year_id: "1",
      class_group_id: "2",
      type: "SANCTION",
      title: "Retenue",
      occurred_at: "2026-09-02",
      location: "",
      description: "Retard",
      sanction_type: "DETENTION",
      exclusion_start: "",
      exclusion_end: "",
      council_date: "",
      council_decision: "",
    });
    expect(createDisciplineRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: 7,
        academic_year_id: 1,
        class_group_id: 2,
        type: "SANCTION",
        sanction_type: "DETENTION",
        location: null,
      })
    );

    await getCrudAdapter("discipline")!.update("1", {
      student_id: "7",
      academic_year_id: "1",
      class_group_id: "2",
      type: "SANCTION",
      title: "Retenue 2h",
      occurred_at: "2026-09-02",
      location: "",
      description: "",
      sanction_type: "DETENTION",
      exclusion_start: "",
      exclusion_end: "",
      council_date: "",
      council_decision: "",
    });
    expect(updateDisciplineRecord).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ title: "Retenue 2h", description: null })
    );
  });

  it("creates enrollment payloads", async () => {
    vi.mocked(createEnrollment).mockResolvedValue({ id: 1 } as never);
    await getCrudAdapter("enrollment")!.create({
      last_name: "Koné",
      first_name: "Awa",
      academic_year_id: "1",
      level_id: "1",
      class_group_id: "",
      birth_date: "",
      gender: "F",
      parent_contact: "0700000000",
      application_date: "2026-09-01",
      observations: "",
    });
    expect(createEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({
        last_name: "Koné",
        first_name: "Awa",
        academic_year_id: 1,
        level_id: 1,
        gender: "F",
        birth_date: null,
        observations: null,
      })
    );
  });

  it("creates library book and loan payloads", async () => {
    vi.mocked(createLibraryBook).mockResolvedValue({ id: 1 } as never);
    vi.mocked(createLibraryLoan).mockResolvedValue({ id: 1 } as never);

    await getCrudAdapter("library")!.create({
      title: "Algèbre",
      author: "Dupont",
      isbn: "",
      publisher: "",
      publication_year: "2020",
      category: "Manuel",
      description: "",
      is_active: true,
    });
    expect(createLibraryBook).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Algèbre",
        publication_year: 2020,
        is_active: true,
        isbn: null,
      })
    );

    await getCrudAdapter("library-loans")!.create({
      library_copy_id: "2",
      student_id: "7",
      due_date: "2026-09-20",
      notes: "",
    });
    expect(createLibraryLoan).toHaveBeenCalledWith({
      library_copy_id: 2,
      student_id: 7,
      due_date: "2026-09-20",
      notes: null,
    });
  });

  it("creates finance payment, invoice and expense payloads", async () => {
    vi.mocked(initiatePayment).mockResolvedValue({
      id: 9,
      status: "PROCESSING",
      authorization_url: null,
    } as never);
    vi.mocked(createInvoice).mockResolvedValue({ id: 1 } as never);
    vi.mocked(createExpense).mockResolvedValue({ id: 4 } as never);

    const open = vi.fn();
    vi.stubGlobal("open", open);

    await getCrudAdapter("payments")!.create({
      invoice_id: "3",
      amount: "5000",
      email: "",
    });
    expect(initiatePayment).toHaveBeenCalledWith({
      invoice_id: 3,
      amount: 5000,
    });

    await getCrudAdapter("invoices")!.create({
      student_id: "7",
      academic_year_id: "1",
      issue_date: "2026-09-01",
      due_date: "2026-09-30",
      discount_amount: "",
      penalty_amount: "",
      notes: "",
      item_description: "Scolarité T1",
      item_quantity: "1",
      item_unit_amount: "10000",
    });
    expect(createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: 7,
        academic_year_id: 1,
        items: [{ description: "Scolarité T1", quantity: 1, unit_amount: 10000 }],
      })
    );

    await getCrudAdapter("expenses")!.create({
      category: "Maintenance",
      description: "Clim",
      amount: "3000",
      expense_date: "2026-09-02",
      cash_register_id: "",
      reference: "",
    });
    expect(createExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Maintenance",
        description: "Clim",
        amount: 3000,
        reference: null,
      })
    );

    vi.unstubAllGlobals();
  });

  it("creates announcement and conversation payloads", async () => {
    vi.mocked(createAnnouncement).mockResolvedValue({ id: 1 } as never);
    vi.mocked(createConversation).mockResolvedValue({ id: 9 } as never);

    await getCrudAdapter("communication")!.create({
      title: "Réunion",
      body: "Vendredi",
      target_type: "PARENTS",
      target_id: "",
      is_pinned: false,
      publish: true,
    });
    expect(createAnnouncement).toHaveBeenCalledWith({
      title: "Réunion",
      body: "Vendredi",
      is_pinned: false,
      publish: true,
      targets: [{ target_type: "PARENTS" }],
    });

    await getCrudAdapter("conversations")!.create({
      type: "PRIVATE",
      recipient_user_id: "42",
      subject: "",
      participant_user_ids: "",
    });
    expect(createConversation).toHaveBeenCalledWith({
      type: "PRIVATE",
      recipient_user_id: 42,
    });

    await getCrudAdapter("conversations")!.create({
      type: "GROUP",
      recipient_user_id: "",
      subject: "Conseil",
      participant_user_ids: "10, 15, 22",
    });
    expect(createConversation).toHaveBeenCalledWith({
      type: "GROUP",
      subject: "Conseil",
      participant_user_ids: [10, 15, 22],
    });
  });

  it("creates document category and updates document metadata", async () => {
    vi.mocked(createDocumentCategory).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateDocument).mockResolvedValue({ id: 10 } as never);

    await getCrudAdapter("document-categories")!.create({
      name: "RH",
      code: "RH",
      description: "",
      access_roles: "HR_MANAGER, DIRECTOR",
      is_sensitive: true,
      is_active: true,
    });
    expect(createDocumentCategory).toHaveBeenCalledWith({
      name: "RH",
      code: "RH",
      description: null,
      access_roles: ["HR_MANAGER", "DIRECTOR"],
      is_sensitive: true,
      is_active: true,
    });

    await getCrudAdapter("documents")!.update("10", {
      document_category_id: "1",
      title: "Nouveau titre",
      description: "",
    });
    expect(updateDocument).toHaveBeenCalledWith("10", {
      title: "Nouveau titre",
      description: null,
    });
  });
});
