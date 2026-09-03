/**
 * One-off refactor: remove page headers/KPI blocks and swap CrudEditLink action cells
 * for DataTableActionsMenu where patterns match.
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
  const firstImport = content.indexOf('import ');
  if (firstImport === -1) return content;
  const lineEnd = content.indexOf("\n", firstImport);
  return content.slice(0, lineEnd + 1) + importLine + "\n" + content.slice(lineEnd + 1);
}

function removeCrudEditFromImports(content) {
  return content
    .replace(
      /import \{ CrudCreateLink, CrudEditLink \} from "@\/presentation\/components\/forms\/CrudLinks";/g,
      'import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";'
    )
    .replace(
      /import \{ CrudEditLink, CrudCreateLink \} from "@\/presentation\/components\/forms\/CrudLinks";/g,
      'import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";'
    );
}

function removePageHeader(content) {
  // flex header with optional CrudCreateLink
  content = content.replace(
    /\s*<div className="flex(?: flex-col md:flex-row| items-center justify-between flex-wrap gap-md)[^"]*">\s*<div>\s*<h1 className="ui-page-title[^"]*">[\s\S]*?<\/p>\s*<\/div>\s*(?:\{canCreate &&[\s\S]*?<CrudCreateLink[\s\S]*?\/>\s*\})?\s*<\/div>\s*/g,
    "\n"
  );
  // simple title block
  content = content.replace(
    /\s*<div>\s*<h1 className="ui-page-title[^"]*">[\s\S]*?<\/p>\s*<\/div>\s*/g,
    "\n"
  );
  // text-display-lg title (subjects)
  content = content.replace(
    /\s*<div className="flex items-center justify-between flex-wrap gap-md">\s*<div>\s*<h1 className="text-display-lg[^"]*">[\s\S]*?<\/p>\s*<\/div>\s*\{canCreate &&[\s\S]*?<CrudCreateLink[\s\S]*?\/>\s*\}\s*<\/div>\s*/g,
    "\n"
  );
  return content;
}

function removeKpiGrid(content) {
  // 4-col KPI grid before table
  content = content.replace(
    /\s*<div className="grid grid-cols-2 md:grid-cols-4 gap-md">[\s\S]*?<\/div>\s*(?=<div className="(?:ui-table-shell|flex flex-wrap gap-sm))/g,
    "\n"
  );
  // 2-col KPI grid (subjects)
  content = content.replace(
    /\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-md">\s*<div className="bg-surface-container p-lg[\s\S]*?kpi-subjects-avg-coeff[\s\S]*?<\/div>\s*<\/div>\s*/g,
    "\n"
  );
  // standalone stat div before table shell
  content = content.replace(
    /\s*<div className="bg-surface-container-lowest rounded-xl p-md shadow-sm">\s*<span className="ui-stat-label">[^<]*<\/span>\s*<div className="ui-page-title mt-sm"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*/g,
    "\n"
  );
  content = content.replace(
    /\s*<div className="ui-card ui-card-pad">\s*<span className="ui-stat-label">[^<]*<\/span>\s*<div className="ui-page-title mt-sm"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*/g,
    "\n"
  );
  return content;
}

function swapSimpleEditDelete(content) {
  // Pattern: CrudEditLink + delete button in flex justify-end
  return content.replace(
    /<td className="([^"]*)">\s*<div className="flex justify-end gap-xs(?: items-center)?">\s*\{canUpdate && <CrudEditLink resource="([^"]+)" recordId=\{String\(([^)]+)\)\} \/>}\s*\{canDelete && \(\s*<button[\s\S]*?onClick=\{\(\) => void handleDelete\(([^)]+)\)\}[\s\S]*?<\/button>\s*\)\}\s*<\/div>\s*<\/td>/g,
    (_m, tdClass, resource, recordExpr, deleteExpr) => `<td className="${tdClass} text-right">
                      <DataTableActionsMenu
                        ariaLabel={\`Actions pour \${${recordExpr}}\`}
                        items={crudRowActions({
                          edit: { resource: "${resource}", recordId: ${recordExpr} },
                          delete: {
                            onClick: () => void handleDelete(${deleteExpr}),
                            disabled: deletingId === ${recordExpr},
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>`
  );
}

function swapStandaloneCrudEdit(content) {
  return content.replace(
    /\{canUpdate && <CrudEditLink resource="([^"]+)" recordId=\{String\(([^)]+)\)\} \/>}/g,
    `<DataTableActionsMenu
                        ariaLabel={\`Actions pour \${${recordExprPlaceholder("$2")}}\`}
                        items={crudRowActions({
                          edit: { resource: "$1", recordId: $2 },
                          canUpdate,
                          canDelete: false,
                        })}
                      />`
  );
}

function recordExprPlaceholder(expr) {
  return expr;
}

let modified = 0;
for (const file of findContentFiles(modulesDir)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  if (!content.includes("CrudEditLink") && !content.includes("ui-page-title")) continue;

  content = removePageHeader(content);
  content = removeKpiGrid(content);
  if (content.includes("CrudEditLink")) {
    content = ensureImport(content);
    content = swapSimpleEditDelete(content);
    // Only remove CrudEditLink from imports if none left
    if (!content.includes("CrudEditLink")) {
      content = removeCrudEditFromImports(content);
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    modified++;
    console.log("modified:", path.relative(modulesDir, file));
  }
}
console.log("Total modified:", modified);
