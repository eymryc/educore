import {
  ADMIN_NAV_SECTIONS,
  resolveActiveAdminHref,
  type NavItem,
  type NavSection,
} from "@/shared/config/navigation";
import { PAGE_ROUTES } from "@/shared/config/routes";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type AdminPageChrome = {
  title: string;
  breadcrumbs: BreadcrumbItem[];
};

/** Same mapping as navigation CRUD resolver — kept local to avoid circular export churn. */
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

const DETAIL_PAGES: Array<{
  pattern: RegExp;
  title: string;
  parentHref: string;
  crumb: string;
}> = [
  { pattern: /^\/students\/[^/]+$/, title: "Dossier élève", parentHref: "/students", crumb: "Dossier" },
  { pattern: /^\/teachers\/[^/]+$/, title: "Fiche enseignant", parentHref: "/teachers", crumb: "Fiche" },
  { pattern: /^\/parents\/[^/]+$/, title: "Fiche parent", parentHref: "/parents", crumb: "Fiche" },
  { pattern: /^\/classes\/[^/]+$/, title: "Fiche classe", parentHref: "/classes", crumb: "Fiche" },
];

function normalizePath(pathname: string): string {
  const bare = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

function findNavContext(href: string): { section: NavSection; item: NavItem } | null {
  for (const section of ADMIN_NAV_SECTIONS) {
    const item = section.items.find((entry) => entry.href === href);
    if (item) return { section, item };
  }
  return null;
}

function titleForHref(href: string, fallback: string): string {
  const route = PAGE_ROUTES.find((r) => `/${r.route}` === href);
  if (route) return route.title;
  return fallback;
}

function chromeForList(href: string): AdminPageChrome {
  const ctx = findNavContext(href);
  const label = ctx?.item.label ?? titleForHref(href, "EduCore");
  const title = titleForHref(href, label);

  if (href === "/dashboard") {
    return {
      title: "Tableau de bord",
      breadcrumbs: [{ label: "Accueil" }],
    };
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: "Accueil", href: "/dashboard" }];
  if (ctx && ctx.section.title !== "Administration") {
    breadcrumbs.push({ label: ctx.section.title });
  }
  breadcrumbs.push({ label });

  return { title, breadcrumbs };
}

export function resolveAdminPageChrome(pathname: string): AdminPageChrome {
  const path = normalizePath(pathname);

  const crudMatch = path.match(/^\/crud\/([^/]+)(?:\/([^/]+))?(?:\/(nouveau|modifier))?$/);
  if (path.startsWith("/crud/")) {
    const resource = crudMatch?.[1] ?? path.split("/")[2] ?? "";
    const listHref = CRUD_RESOURCE_TO_NAV[resource] ?? `/${resource}`;
    const listCtx = findNavContext(listHref);
    const listLabel = listCtx?.item.label ?? resource;
    const isEdit = path.includes("/modifier");
    const leaf = isEdit ? "Modifier" : "Nouveau";

    return {
      title: isEdit ? `Modifier — ${listLabel}` : `Nouveau — ${listLabel}`,
      breadcrumbs: [
        { label: "Accueil", href: "/dashboard" },
        ...(listCtx && listCtx.section.title !== "Administration"
          ? [{ label: listCtx.section.title }]
          : []),
        { label: listLabel, href: listHref },
        { label: leaf },
      ],
    };
  }

  for (const detail of DETAIL_PAGES) {
    if (detail.pattern.test(path)) {
      const parent = findNavContext(detail.parentHref);
      return {
        title: detail.title,
        breadcrumbs: [
          { label: "Accueil", href: "/dashboard" },
          ...(parent && parent.section.title !== "Administration"
            ? [{ label: parent.section.title }]
            : []),
          { label: parent?.item.label ?? detail.parentHref, href: detail.parentHref },
          { label: detail.crumb },
        ],
      };
    }
  }

  const activeHref = resolveActiveAdminHref(path);
  if (activeHref) return chromeForList(activeHref);

  return {
    title: "EduCore",
    breadcrumbs: [{ label: "Accueil", href: "/dashboard" }],
  };
}
