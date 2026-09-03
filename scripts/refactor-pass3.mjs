/** Simple pass: replace edit+delete flex blocks using exact template matching per file. */
import fs from "fs";
import path from "path";

const replacements = [
  {
    file: "gestion_de_la_flotte/FleetManagementContent.tsx",
    old: `                        <div className="flex justify-end gap-xs">
                          {canUpdate && (
                            <CrudEditLink recordId={String(row.id)} resource="fleet" />
                          )}
                          {canDelete && (
                            <button
                              className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                              disabled={busy}
                              onClick={() => void handleDelete(row)}
                              type="button"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>`,
    new: `                        <DataTableActionsMenu
                          ariaLabel={\`Actions pour \${row.plate_number}\`}
                          items={crudRowActions({
                            edit: { resource: "fleet", recordId: row.id },
                            delete: {
                              onClick: () => void handleDelete(row),
                              disabled: busy,
                            },
                            canUpdate,
                            canDelete,
                          })}
                        />`,
  },
  {
    file: "expenses_management/ExpensesManagementContent.tsx",
    old: `                        <div className="flex justify-end gap-xs">
                          {canUpdate && (
                            <CrudEditLink recordId={String(e.id)} resource="expenses" />
                          )}
                          {canDelete && (
                            <button
                              className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                              disabled={busy}
                              onClick={() => void handleDelete(e)}
                              type="button"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>`,
    new: `                        <DataTableActionsMenu
                          ariaLabel={\`Actions pour \${e.description}\`}
                          items={crudRowActions({
                            edit: { resource: "expenses", recordId: e.id },
                            delete: {
                              onClick: () => void handleDelete(e),
                              disabled: busy,
                            },
                            canUpdate,
                            canDelete,
                          })}
                        />`,
  },
  {
    file: "abonnements_transport/TransportSubscriptionsContent.tsx",
    old: `                        <div className="flex justify-end gap-xs">
                          {canUpdate && (
                            <CrudEditLink
                              recordId={String(row.id)}
                              resource="transport-subscriptions"
                            />
                          )}
                          {canDelete && (
                            <button
                              className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                              disabled={busy}
                              onClick={() => void handleDelete(row)}
                              type="button"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>`,
    new: `                        <DataTableActionsMenu
                          ariaLabel={\`Actions pour l'abonnement #\${row.id}\`}
                          items={crudRowActions({
                            edit: { resource: "transport-subscriptions", recordId: row.id },
                            delete: {
                              onClick: () => void handleDelete(row),
                              disabled: busy,
                            },
                            canUpdate,
                            canDelete,
                          })}
                        />`,
  },
  {
    file: "gestion_des_menus_cantine/CanteenMenusContent.tsx",
    old: `                        <CrudEditLink recordId={String(row.id)} resource="canteen-menus" />`,
    new: `                        <DataTableActionsMenu
                          ariaLabel={\`Actions pour \${row.menu_date}\`}
                          items={crudRowActions({
                            edit: { resource: "canteen-menus", recordId: row.id },
                            canUpdate,
                            canDelete: false,
                          })}
                        />`,
  },
  {
    file: "assignments_management/AssignmentsManagementContent.tsx",
    old: `                  {canUpdate && <CrudEditLink resource="assignments" recordId={String(row.id)} />}`,
    new: `                  <DataTableActionsMenu
                    ariaLabel={\`Actions pour \${row.title}\`}
                    items={crudRowActions({
                      edit: { resource: "assignments", recordId: row.id },
                      canUpdate,
                      canDelete: false,
                    })}
                  />`,
  },
];

const base = path.join(process.cwd(), "src/presentation/components/modules");
let n = 0;
for (const { file, old, new: neu } of replacements) {
  const fp = path.join(base, file);
  let c = fs.readFileSync(fp, "utf8");
  if (!c.includes(old)) {
    console.log("SKIP (not found):", file);
    continue;
  }
  c = c.replace(old, neu);
  c = c.replace(
    /import \{ CrudCreateLink, CrudEditLink \}/,
    "import { CrudCreateLink }"
  );
  fs.writeFileSync(fp, c);
  n++;
  console.log("OK:", file);
}
console.log("Done:", n);
