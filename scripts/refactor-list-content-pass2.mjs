/**
 * Pass 2: swap remaining CrudEditLink action cells and remove leftover KPI blocks.
 */
import fs from "fs";
import path from "path";

const modulesDir = path.join(
  process.cwd(),
  "src/presentation/components/modules"
);

const SKIP = new Set([
  "StudentDossierContent.tsx",
  "ParentDetailContent.tsx",
  "TeacherDetailContent.tsx",
  "ClassDetailContent.tsx",
  "AdminDashboardContent.tsx",
  "StudentDashboardContent.tsx",
  "ParentDashboardContent.tsx",
  "ProfileContent.tsx",
  "SystemSettingsContent.tsx",
  "AcademicResultsContent.tsx",
  "AssignmentsContent.tsx",
  "FeesPaymentsContent.tsx",
  "NotificationsContent.tsx",
  "DailyScheduleContent.tsx",
  "FinancialOverviewContent.tsx",
  "ReportsAnalyticsContent.tsx",
]);

function findContentFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findContentFiles(full));
    else if (entry.name.endsWith("Content.tsx") && !SKIP.has(entry.name))
      out.push(full);
  }
  return out;
}

function ensureImport(content) {
  const importLine = `import {
  crudRowActions,
  DataTableActionsMenu,
  type DataTableMenuItem,
} from "@/presentation/components/shared/DataTableActionsMenu";`;
  if (content.includes("DataTableActionsMenu")) return content;
  const crudImport = content.match(
    /import \{ CrudCreateLink(?:, CrudEditLink)? \} from "@\/presentation\/components\/forms\/CrudLinks";/
  );
  if (crudImport) {
    return content.replace(crudImport[0], `${crudImport[0]}\n${importLine}`);
  }
  return content;
}

function removeCrudEditFromImports(content) {
  if (content.includes("<CrudEditLink") || content.includes("CrudEditLink ")) return content;
  return content
    .replace(
      /import \{ CrudCreateLink, CrudEditLink \} from "@\/presentation\/components\/forms\/CrudLinks";/g,
      'import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";'
    )
    .replace(
      /, CrudEditLink/g,
      ""
    );
}

function removeLeftoverKpis(content) {
  // expenses-total style block
  content = content.replace(
    /\s*<div\s+className="bg-surface-container-high rounded-xl p-lg"\s+data-testid="expenses-total"[\s\S]*?<\/div>\s*/g,
    "\n"
  );
  // payments/canteen/payroll/supplies standalone stat
  content = content.replace(
    /\s*<div className="(?:ui-card ui-card-pad|bg-surface-container-lowest rounded-xl p-md shadow-sm)">\s*<span className="(?:ui-stat-label|font-label-caps[^"]*)">[\s\S]*?<\/div>\s*(?=\{error|<div className="ui-table-shell")/g,
    "\n"
  );
  content = content.replace(
    /\s*<div className="bg-surface-container-high rounded-xl p-lg">\s*<span className="font-label-caps[\s\S]*?<\/div>\s*(?=\{error|<div className="ui-table-shell")/g,
    "\n"
  );
  // enroll-kpi
  content = content.replace(
    /\s*<span className="font-body-sm text-on-surface-variant" data-testid="enroll-kpi-total">[\s\S]*?<\/span>\s*/g,
    "\n"
  );
  // attendance KPI grid (4 cards with att-kpi)
  content = content.replace(
    /\s*<div className="grid grid-cols-2 md:grid-cols-4 gap-md">\s*<div className="bg-surface-container-lowest[\s\S]*?att-kpi-other[\s\S]*?<\/div>\s*<\/div>\s*/g,
    "\n"
  );
  // grades kpi row inside form area - only the 4 stat cards not labels
  content = content.replace(
    /\s*<div className="grid grid-cols-2 md:grid-cols-4 gap-md mt-md">\s*<div className="bg-surface[\s\S]*?grades-kpi-avg[\s\S]*?<\/div>\s*<\/div>\s*/g,
    "\n"
  );
  // security audit forbidden h1 only - keep error
  content = content.replace(
    /(<div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">)\s*<h1 className="ui-page-title">Journal d&apos;audit<\/h1>\s*(<div[\s\S]*?audit-forbidden)/g,
    "$1\n      $2"
  );
  return content;
}

function swapEditDeleteBlock(content) {
  // Multiline: canUpdate CrudEditLink + canDelete button with handleDelete
  const re =
    /<div className="flex justify-end gap-xs(?: flex-wrap)?(?: items-center)?">\s*(?:[\s\S]*?<Link[\s\S]*?<\/Link>\s*)?(?:[\s\S]*?<button[\s\S]*?<\/button>\s*)*\{canUpdate && \(\s*<CrudEditLink recordId=\{String\(([^)]+)\)\} resource="([^"]+)" \/?>\s*\)\}\s*\{canDelete && \(\s*<button[\s\S]*?onClick=\{\(\) => void handleDelete\(([^)]+)\)\}[\s\S]*?disabled=\{([^}]+)\}[\s\S]*?<\/button>\s*\)\}\s*<\/div>/g;

  content = content.replace(re, (_m, recordExpr, resource, deleteExpr, disabledExpr) => {
    return `<DataTableActionsMenu
                        ariaLabel={\`Actions\`}
                        items={crudRowActions({
                          edit: { resource: "${resource}", recordId: ${recordExpr} },
                          delete: {
                            onClick: () => void handleDelete(${deleteExpr}),
                            disabled: ${disabledExpr.trim()},
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />`;
  });

  // Reversed attribute order: resource before recordId
  const re2 =
    /<div className="flex justify-end gap-xs(?: flex-wrap)?(?: items-center)?">\s*(?:[\s\S]*?<Link[\s\S]*?<\/Link>\s*)?(?:[\s\S]*?<button[\s\S]*?<\/button>\s*)*\{canUpdate && <CrudEditLink resource="([^"]+)" recordId=\{String\(([^)]+)\)\} \/>}\s*\{canDelete && \(\s*<button[\s\S]*?onClick=\{\(\) => void handleDelete\(([^)]+)\)\}[\s\S]*?disabled=\{([^}]+)\}[\s\S]*?<\/button>\s*\)\}\s*<\/div>/g;

  content = content.replace(re2, (_m, resource, recordExpr, deleteExpr, disabledExpr) => {
    return `<DataTableActionsMenu
                        ariaLabel={\`Actions\`}
                        items={crudRowActions({
                          edit: { resource: "${resource}", recordId: ${recordExpr} },
                          delete: {
                            onClick: () => void handleDelete(${deleteExpr}),
                            disabled: ${disabledExpr.trim()},
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />`;
  });

  // Edit only standalone in table cell
  content = content.replace(
    /\{canUpdate && <CrudEditLink resource="([^"]+)" recordId=\{String\(([^)]+)\)\} \/>}/g,
    `<DataTableActionsMenu
                        ariaLabel="Actions"
                        items={crudRowActions({
                          edit: { resource: "$1", recordId: $2 },
                          canUpdate,
                          canDelete: false,
                        })}
                      />`
  );

  content = content.replace(
    /\{canUpdate && \(\s*<CrudEditLink recordId=\{String\(([^)]+)\)\} resource="([^"]+)" \/?>\s*\)\}/g,
    `<DataTableActionsMenu
                        ariaLabel="Actions"
                        items={crudRowActions({
                          edit: { resource: "$2", recordId: $1 },
                          canUpdate,
                          canDelete: false,
                        })}
                      />`
  );

  return content;
}

let modified = 0;
for (const file of findContentFiles(modulesDir)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  if (!content.includes("CrudEditLink") && !content.includes("ui-page-title") && !content.includes("expenses-total"))
    continue;

  content = removeLeftoverKpis(content);
  if (content.includes("CrudEditLink")) {
    content = ensureImport(content);
    content = swapEditDeleteBlock(content);
    content = removeCrudEditFromImports(content);
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    modified++;
    console.log("modified:", path.relative(modulesDir, file));
  }
}
console.log("Total modified:", modified);
