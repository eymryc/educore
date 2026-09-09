export type LayoutType = "admin" | "portal";

export interface PageRouteConfig {
  folder: string;
  route: string;
  layout: LayoutType;
  activePath: string;
  componentName: string;
  title: string;
}

export const PAGE_ROUTES: PageRouteConfig[] = [
  { folder: "admin_dashboard", route: "dashboard", layout: "admin", activePath: "dashboard", componentName: "AdminDashboardContent", title: "Tableau de bord" },
  { folder: "students_management", route: "students", layout: "admin", activePath: "students", componentName: "StudentsManagementContent", title: "Élèves" },
  { folder: "students_management", route: "students/[id]", layout: "admin", activePath: "students", componentName: "StudentDossierContent", title: "Dossier élève" },
  { folder: "parents_management", route: "parents", layout: "admin", activePath: "parents", componentName: "ParentsManagementContent", title: "Parents" },
  { folder: "parents_management", route: "parents/[id]", layout: "admin", activePath: "parents", componentName: "ParentDetailContent", title: "Fiche parent" },
  { folder: "teachers_management", route: "teachers", layout: "admin", activePath: "teachers", componentName: "TeachersManagementContent", title: "Enseignants" },
  { folder: "teachers_management", route: "teachers/[id]", layout: "admin", activePath: "teachers", componentName: "TeacherDetailContent", title: "Fiche enseignant" },
  { folder: "classes_management", route: "classes", layout: "admin", activePath: "classes", componentName: "ClassesManagementContent", title: "Classes" },
  { folder: "classes_management", route: "classes/[id]", layout: "admin", activePath: "classes", componentName: "ClassDetailContent", title: "Fiche classe" },
  { folder: "subjects_management", route: "subjects", layout: "admin", activePath: "subjects", componentName: "SubjectsManagementContent", title: "Matières" },
  { folder: "schedules_management", route: "schedules", layout: "admin", activePath: "schedules", componentName: "SchedulesManagementContent", title: "Emplois du temps" },
  { folder: "attendance_management", route: "attendance", layout: "admin", activePath: "attendance", componentName: "AttendanceManagementContent", title: "Présences" },
  { folder: "assessments_management", route: "assessments", layout: "admin", activePath: "assessments", componentName: "AssessmentsManagementContent", title: "Évaluations" },
  { folder: "assignments_management", route: "assignments", layout: "admin", activePath: "assignments", componentName: "AssignmentsManagementContent", title: "Devoirs" },
  { folder: "grades_entry", route: "grades", layout: "admin", activePath: "grades", componentName: "GradesEntryContent", title: "Notes" },
  { folder: "report_cards_management", route: "report-cards", layout: "admin", activePath: "report-cards", componentName: "ReportCardsManagementContent", title: "Bulletins" },
  { folder: "discipline_management", route: "discipline", layout: "admin", activePath: "discipline", componentName: "DisciplineManagementContent", title: "Discipline" },
  { folder: "enrollment_management", route: "enrollment", layout: "admin", activePath: "enrollment", componentName: "EnrollmentManagementContent", title: "Inscriptions" },
  { folder: "library_management", route: "library", layout: "admin", activePath: "library", componentName: "LibraryManagementContent", title: "Bibliothèque" },
  { folder: "payments_management", route: "payments", layout: "admin", activePath: "payments", componentName: "PaymentsManagementContent", title: "Paiements" },
  { folder: "invoices_management", route: "invoices", layout: "admin", activePath: "invoices", componentName: "InvoicesManagementContent", title: "Factures" },
  { folder: "expenses_management", route: "expenses", layout: "admin", activePath: "expenses", componentName: "ExpensesManagementContent", title: "Dépenses" },
  { folder: "financial_overview", route: "finance/overview", layout: "admin", activePath: "finance", componentName: "FinancialOverviewContent", title: "Vue d'ensemble financière" },
  { folder: "fees_catalog", route: "finance/fees", layout: "admin", activePath: "fees", componentName: "FeesCatalogContent", title: "Catalogue des frais" },
  { folder: "cash_management", route: "finance/cash", layout: "admin", activePath: "cash", componentName: "CashManagementContent", title: "Caisse" },
  { folder: "communication_center", route: "communication", layout: "admin", activePath: "communication", componentName: "CommunicationCenterContent", title: "Communication" },
  { folder: "document_management", route: "documents", layout: "admin", activePath: "documents", componentName: "DocumentManagementContent", title: "Documents" },
  { folder: "reports_analytics", route: "reports", layout: "admin", activePath: "reports", componentName: "ReportsAnalyticsContent", title: "Rapports" },
  { folder: "system_settings", route: "settings", layout: "admin", activePath: "settings", componentName: "SystemSettingsContent", title: "Paramètres" },
  { folder: "recruitement_candidatures", route: "hr/recruitment", layout: "admin", activePath: "hr-recruitment", componentName: "RecruitmentContent", title: "Recrutement" },
  { folder: "staff_directory", route: "hr/staff", layout: "admin", activePath: "hr-staff", componentName: "StaffDirectoryContent", title: "Personnel" },
  { folder: "gestion_du_personnel_paie", route: "hr/payroll", layout: "admin", activePath: "hr-payroll", componentName: "PersonnelPayrollContent", title: "Personnel et paie" },
  { folder: "gestion_des_cong_s_absences", route: "hr/leave", layout: "admin", activePath: "hr-leave", componentName: "LeaveAbsencesContent", title: "Congés et absences" },
  { folder: "valuations_du_personnel", route: "hr/evaluations", layout: "admin", activePath: "hr-evaluations", componentName: "PersonnelEvaluationsContent", title: "Évaluations du personnel" },
  { folder: "gestion_des_menus_cantine", route: "canteen/menus", layout: "admin", activePath: "canteen-menus", componentName: "CanteenMenusContent", title: "Menus cantine" },
  { folder: "comptes_rechargements_cantine", route: "canteen/accounts", layout: "admin", activePath: "canteen-accounts", componentName: "CanteenAccountsContent", title: "Comptes cantine" },
  { folder: "r_gimes_sp_ciaux_allergies", route: "canteen/special-diets", layout: "admin", activePath: "canteen-diets", componentName: "SpecialDietsContent", title: "Régimes spéciaux et allergies" },
  { folder: "gestion_de_la_flotte", route: "transport/fleet", layout: "admin", activePath: "transport-fleet", componentName: "FleetManagementContent", title: "Gestion de la flotte" },
  { folder: "gestion_des_chauffeurs", route: "transport/drivers", layout: "admin", activePath: "transport-drivers", componentName: "DriversManagementContent", title: "Chauffeurs" },
  { folder: "itin_raires_arr_ts", route: "transport/routes", layout: "admin", activePath: "transport-routes", componentName: "TransportRoutesContent", title: "Itinéraires et arrêts" },
  { folder: "abonnements_transport", route: "transport/subscriptions", layout: "admin", activePath: "transport-subscriptions", componentName: "TransportSubscriptionsContent", title: "Abonnements transport" },
  { folder: "stocks_approvisionnements", route: "inventory/supplies", layout: "admin", activePath: "inventory-supplies", componentName: "SuppliesStockContent", title: "Stocks et approvisionnements" },
  { folder: "inventory_assets", route: "inventory/assets", layout: "admin", activePath: "inventory-assets", componentName: "InventoryAssetsContent", title: "Patrimoine" },
  { folder: "student_dashboard", route: "portal/student", layout: "portal", activePath: "dashboard", componentName: "StudentDashboardContent", title: "Tableau de bord" },
  { folder: "parent_dashboard", route: "portal/parent", layout: "portal", activePath: "dashboard", componentName: "ParentDashboardContent", title: "Tableau de bord" },
  { folder: "daily_schedule", route: "portal/schedule", layout: "portal", activePath: "schedule", componentName: "DailyScheduleContent", title: "Emploi du temps" },
  { folder: "mes_devoirs", route: "portal/assignments", layout: "portal", activePath: "assignments", componentName: "AssignmentsContent", title: "Devoirs" },
  { folder: "academic_results", route: "portal/grades", layout: "portal", activePath: "grades", componentName: "AcademicResultsContent", title: "Notes" },
  { folder: "paiements_frais", route: "portal/fees", layout: "portal", activePath: "finance", componentName: "FeesPaymentsContent", title: "Frais et paiements" },
  { folder: "notifications", route: "portal/notifications", layout: "portal", activePath: "notifications", componentName: "NotificationsContent", title: "Notifications" },
  { folder: "mon_profil", route: "portal/profile", layout: "portal", activePath: "profile", componentName: "ProfileContent", title: "Mon profil" },
];
