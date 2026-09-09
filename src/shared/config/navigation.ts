export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    title: "Administration",
    items: [
      { id: "dashboard", label: "Tableau de bord", icon: "dashboard", href: "/dashboard" },
      { id: "students", label: "Élèves", icon: "group", href: "/students" },
      { id: "parents", label: "Parents", icon: "family_restroom", href: "/parents" },
      { id: "teachers", label: "Enseignants", icon: "person_4", href: "/teachers" },
      { id: "classes", label: "Classes", icon: "door_open", href: "/classes" },
      { id: "subjects", label: "Matières", icon: "book", href: "/subjects" },
      { id: "schedules", label: "Emplois du temps", icon: "calendar_today", href: "/schedules" },
    ],
  },
  {
    title: "Scolarité",
    items: [
      { id: "attendance", label: "Présences", icon: "how_to_reg", href: "/attendance" },
      { id: "assessments", label: "Évaluations", icon: "quiz", href: "/assessments" },
      { id: "assignments", label: "Devoirs", icon: "assignment", href: "/assignments" },
      { id: "grades", label: "Notes", icon: "grade", href: "/grades" },
      { id: "report-cards", label: "Bulletins", icon: "description", href: "/report-cards" },
      { id: "discipline", label: "Discipline", icon: "gavel", href: "/discipline" },
      { id: "enrollment", label: "Inscriptions", icon: "person_add", href: "/enrollment" },
      { id: "library", label: "Bibliothèque", icon: "local_library", href: "/library" },
    ],
  },
  {
    title: "Finances",
    items: [
      { id: "finance", label: "Vue d'ensemble", icon: "monitoring", href: "/finance/overview" },
      { id: "payments", label: "Paiements", icon: "account_balance_wallet", href: "/payments" },
      { id: "invoices", label: "Factures", icon: "receipt", href: "/invoices" },
      { id: "expenses", label: "Dépenses", icon: "shopping_cart", href: "/expenses" },
      { id: "fees", label: "Grille tarifaire", icon: "sell", href: "/finance/fees" },
      { id: "cash", label: "Caisse", icon: "point_of_sale", href: "/finance/cash" },
    ],
  },
  {
    title: "Ressources humaines",
    items: [
      { id: "hr-staff", label: "Personnel", icon: "badge", href: "/hr/staff" },
      { id: "hr-recruitment", label: "Recrutement", icon: "work", href: "/hr/recruitment" },
      { id: "hr-payroll", label: "Paie", icon: "payments", href: "/hr/payroll" },
      { id: "hr-leave", label: "Congés et absences", icon: "event_busy", href: "/hr/leave" },
      { id: "hr-evaluations", label: "Évaluations du personnel", icon: "star", href: "/hr/evaluations" },
    ],
  },
  {
    title: "Cantine",
    items: [
      { id: "canteen-menus", label: "Menus", icon: "restaurant", href: "/canteen/menus" },
      { id: "canteen-accounts", label: "Comptes cantine", icon: "account_balance", href: "/canteen/accounts" },
      { id: "canteen-diets", label: "Régimes spéciaux", icon: "no_food", href: "/canteen/special-diets" },
    ],
  },
  {
    title: "Transport",
    items: [
      { id: "transport-fleet", label: "Flotte", icon: "directions_bus", href: "/transport/fleet" },
      { id: "transport-drivers", label: "Chauffeurs", icon: "badge", href: "/transport/drivers" },
      { id: "transport-routes", label: "Itinéraires", icon: "route", href: "/transport/routes" },
      { id: "transport-subscriptions", label: "Abonnements", icon: "confirmation_number", href: "/transport/subscriptions" },
    ],
  },
  {
    title: "Inventaire",
    items: [
      { id: "inventory-supplies", label: "Stocks", icon: "inventory_2", href: "/inventory/supplies" },
      { id: "inventory-assets", label: "Patrimoine", icon: "devices", href: "/inventory/assets" },
    ],
  },
  {
    title: "Outils",
    items: [
      { id: "communication", label: "Communication", icon: "chat", href: "/communication" },
      { id: "documents", label: "Documents", icon: "folder", href: "/documents" },
      { id: "reports", label: "Rapports", icon: "bar_chart", href: "/reports" },
      { id: "settings", label: "Paramètres", icon: "settings", href: "/settings" },
    ],
  },
];

export const PORTAL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Accueil", icon: "dashboard", href: "/portal/student" },
  { id: "schedule", label: "Emploi du temps", icon: "calendar_today", href: "/portal/schedule" },
  { id: "assignments", label: "Devoirs", icon: "assignment", href: "/portal/assignments" },
  { id: "grades", label: "Notes", icon: "grade", href: "/portal/grades" },
  { id: "finance", label: "Finances", icon: "payments", href: "/portal/fees" },
  { id: "notifications", label: "Alertes", icon: "notifications", href: "/portal/notifications" },
];

export const PARENT_PORTAL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Accueil", icon: "dashboard", href: "/portal/parent" },
  { id: "schedule", label: "Emploi du temps", icon: "calendar_today", href: "/portal/schedule" },
  { id: "assignments", label: "Devoirs", icon: "assignment", href: "/portal/assignments" },
  { id: "grades", label: "Notes", icon: "grade", href: "/portal/grades" },
  { id: "finance", label: "Finances", icon: "payments", href: "/portal/fees" },
  { id: "notifications", label: "Alertes", icon: "notifications", href: "/portal/notifications" },
];

/** Maps `/crud/{resource}/…` to the corresponding sidebar list href. */
const CRUD_RESOURCE_TO_NAV: Record<string, string> = {
  students: "/students",
  teachers: "/teachers",
  parents: "/parents",
  guardians: "/parents",
  classes: "/classes",
  subjects: "/subjects",
  schedules: "/schedules",
  "academic-years": "/settings",
  "academic-periods": "/settings",
  "academic-holidays": "/settings",
  levels: "/settings",
  series: "/settings",
  "class-subjects": "/settings",
  assessments: "/assessments",
  assignments: "/assignments",
  grades: "/grades",
  "report-cards": "/report-cards",
  discipline: "/discipline",
  enrollment: "/enrollment",
  library: "/library",
  "library-books": "/library",
  "library-copies": "/library",
  "library-loans": "/library",
  payments: "/payments",
  invoices: "/invoices",
  expenses: "/expenses",
  "fee-categories": "/finance/fees",
  "fee-structures": "/finance/fees",
  "fee-items": "/finance/fees",
  fees: "/finance/fees",
  "cash-registers": "/finance/cash",
  "cash-transactions": "/finance/cash",
  staff: "/hr/staff",
  departments: "/hr/staff",
  recruitment: "/hr/recruitment",
  "job-postings": "/hr/recruitment",
  applications: "/hr/recruitment",
  payroll: "/hr/payroll",
  leave: "/hr/leave",
  "staff-leaves": "/hr/leave",
  "staff-attendance": "/hr/leave",
  evaluations: "/hr/evaluations",
  "staff-evaluations": "/hr/evaluations",
  "canteen-menus": "/canteen/menus",
  "canteen-accounts": "/canteen/accounts",
  "canteen-special-diets": "/canteen/special-diets",
  "special-diets": "/canteen/special-diets",
  fleet: "/transport/fleet",
  drivers: "/transport/drivers",
  "transport-routes": "/transport/routes",
  "transport-subscriptions": "/transport/subscriptions",
  "inventory-supplies": "/inventory/supplies",
  "inventory-assets": "/inventory/assets",
  supplies: "/inventory/supplies",
  assets: "/inventory/assets",
  communication: "/communication",
  conversations: "/communication",
  announcements: "/communication",
  documents: "/documents",
  "document-categories": "/documents",
  reports: "/reports",
  campuses: "/settings",
  buildings: "/settings",
  rooms: "/settings",
  settings: "/settings",
};

function normalizePath(pathname: string): string {
  const bare = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

function pathMatchesHref(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/portal/student" || href === "/portal/parent") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveCrudPath(pathname: string): string {
  const match = pathname.match(/^\/crud\/([^/]+)/);
  if (!match) return pathname;
  const resource = match[1] ?? "";
  return CRUD_RESOURCE_TO_NAV[resource] ?? `/${resource}`;
}

/** Best (longest) matching admin nav href for the current path, or null. */
export function resolveActiveAdminHref(pathname: string): string | null {
  const path = resolveCrudPath(normalizePath(pathname));
  const hrefs = ADMIN_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));
  const matches = hrefs.filter((href) => pathMatchesHref(path, href));
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.length - a.length);
  return matches[0] ?? null;
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  return resolveActiveAdminHref(pathname) === href;
}

export function isPortalNavActive(pathname: string, href: string, items: NavItem[]): boolean {
  const path = normalizePath(pathname);
  const matches = items.map((item) => item.href).filter((h) => pathMatchesHref(path, h));
  if (matches.length === 0) return false;
  matches.sort((a, b) => b.length - a.length);
  return matches[0] === href;
}
