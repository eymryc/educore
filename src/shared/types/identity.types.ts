import type { AuthUser, PaginatedList, PaginationMeta } from "@/shared/types/api.types";

export type AccessUser = AuthUser;

export type AccessRole = {
  id: number;
  name: string;
  guard_name?: string;
  permissions: string[];
};

export type PermissionCatalogItem = {
  name: string;
  domain: string;
  action: string;
};

export type UserListQuery = {
  search?: string;
  role?: string;
  page?: number | string;
  per_page?: number | string;
};

export type UserListResult = PaginatedList<AccessUser>;

export const PERMISSION_DOMAIN_LABELS: Record<string, string> = {
  students: "Élèves",
  guardians: "Parents / tuteurs",
  grades: "Notes",
  attendance: "Présences",
  payments: "Paiements",
  reports: "Rapports",
  teachers: "Enseignants",
  classes: "Classes",
  subjects: "Matières",
  finance: "Finances",
  discipline: "Discipline",
  assignments: "Devoirs",
  library: "Bibliothèque",
  transport: "Transport",
  canteen: "Cantine",
  inventory: "Inventaire",
  hr: "Ressources humaines",
  communication: "Communication",
  documents: "Documents",
  settings: "Paramètres",
};

export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  view: "Voir",
  create: "Créer",
  update: "Modifier",
  delete: "Supprimer",
  validate: "Valider",
  grade: "Noter",
  refund: "Rembourser",
  export: "Exporter",
};

export const CRUD_ACTIONS = ["view", "create", "update", "delete"] as const;

export function domainLabel(domain: string): string {
  return PERMISSION_DOMAIN_LABELS[domain] ?? domain;
}

export function actionLabel(action: string): string {
  return PERMISSION_ACTION_LABELS[action] ?? action;
}

export type PermissionDomainGroup = {
  domain: string;
  items: PermissionCatalogItem[];
};

export type PermissionCategoryGroup = {
  id: string;
  label: string;
  domains: PermissionDomainGroup[];
};

export const PERMISSION_CATEGORIES: { id: string; label: string; domains: string[] }[] = [
  {
    id: "school",
    label: "Scolarité",
    domains: [
      "students",
      "guardians",
      "classes",
      "subjects",
      "grades",
      "attendance",
      "assignments",
      "discipline",
    ],
  },
  {
    id: "admin",
    label: "Administration",
    domains: ["teachers", "hr", "documents", "communication", "settings"],
  },
  {
    id: "finance",
    label: "Finances",
    domains: ["finance", "payments", "reports"],
  },
  {
    id: "services",
    label: "Vie scolaire",
    domains: ["library", "canteen", "transport", "inventory"],
  },
];

export const ROLE_GROUPS: { id: string; label: string; roles: string[] }[] = [
  { id: "direction", label: "Direction", roles: ["SUPER_ADMIN", "ADMIN", "DIRECTOR", "CENSEUR"] },
  {
    id: "staff",
    label: "Personnel",
    roles: [
      "SECRETARY",
      "ACCOUNTANT",
      "INTENDANT",
      "HR_MANAGER",
      "TEACHER",
      "HEAD_TEACHER",
      "SUPERVISOR",
      "LIBRARIAN",
      "NURSE",
    ],
  },
  { id: "portal", label: "Portail", roles: ["STUDENT", "PARENT"] },
];

export function groupPermissionsByDomain(
  permissions: PermissionCatalogItem[]
): PermissionDomainGroup[] {
  const map = new Map<string, PermissionCatalogItem[]>();
  for (const item of permissions) {
    const list = map.get(item.domain) ?? [];
    list.push(item);
    map.set(item.domain, list);
  }
  return Array.from(map.entries()).map(([domain, items]) => ({
    domain,
    items: items.sort((a, b) => a.action.localeCompare(b.action)),
  }));
}

export function groupPermissionsByCategory(
  permissions: PermissionCatalogItem[]
): PermissionCategoryGroup[] {
  const byDomain = groupPermissionsByDomain(permissions);
  const domainMap = new Map(byDomain.map((group) => [group.domain, group]));
  const used = new Set<string>();
  const result: PermissionCategoryGroup[] = [];

  for (const category of PERMISSION_CATEGORIES) {
    const domains = category.domains
      .map((domain) => domainMap.get(domain))
      .filter((group): group is PermissionDomainGroup => Boolean(group));
    if (domains.length === 0) continue;
    result.push({ id: category.id, label: category.label, domains });
    for (const group of domains) used.add(group.domain);
  }

  const rest = byDomain.filter((group) => !used.has(group.domain));
  if (rest.length > 0) {
    result.push({ id: "other", label: "Autres", domains: rest });
  }

  return result;
}

export function emptyUserListMeta(): PaginationMeta {
  return { current_page: 1, per_page: 10, total: 0, last_page: 1 };
}
