/** Pass 4: batch exact action cell replacements */
import fs from "fs";
import path from "path";

const base = path.join(process.cwd(), "src/presentation/components/modules");

function patch(file, old, neu) {
  const fp = path.join(base, file);
  let c = fs.readFileSync(fp, "utf8");
  if (!c.includes(old)) {
    console.log("SKIP:", file);
    return false;
  }
  c = c.replace(old, neu);
  c = c.replace(/import \{ CrudCreateLink, CrudEditLink \}/g, "import { CrudCreateLink }");
  fs.writeFileSync(fp, c);
  console.log("OK:", file);
  return true;
}

const blocks = [
  [
    "staff_directory/StaffDirectoryContent.tsx",
    `                          <div className="flex justify-end gap-xs">
                            {canUpdate && (
                              <CrudEditLink
                                recordId={String(row.id)}
                                resource="staff-members"
                              />
                            )}
                            {canDelete && (
                              <button
                                className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                                disabled={busy}
                                onClick={() => void handleDeleteMember(row)}
                                type="button"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>`,
    `                          <DataTableActionsMenu
                            ariaLabel={\`Actions pour \${row.full_name}\`}
                            items={crudRowActions({
                              edit: { resource: "staff-members", recordId: row.id },
                              delete: {
                                onClick: () => void handleDeleteMember(row),
                                disabled: busy,
                              },
                              canUpdate,
                              canDelete,
                            })}
                          />`,
  ],
  [
    "staff_directory/StaffDirectoryContent.tsx",
    `                          <div className="flex justify-end gap-xs">
                            {canUpdate && (
                              <CrudEditLink recordId={String(row.id)} resource="departments" />
                            )}
                            {canDelete && (
                              <button
                                className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                                disabled={busy}
                                onClick={() => void handleDeleteDepartment(row)}
                                type="button"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>`,
    `                          <DataTableActionsMenu
                            ariaLabel={\`Actions pour \${row.name}\`}
                            items={crudRowActions({
                              edit: { resource: "departments", recordId: row.id },
                              delete: {
                                onClick: () => void handleDeleteDepartment(row),
                                disabled: busy,
                              },
                              canUpdate,
                              canDelete,
                            })}
                          />`,
  ],
  [
    "stocks_approvisionnements/SuppliesStockContent.tsx",
    `                            {canUpdate && (
                              <CrudEditLink recordId={String(row.id)} resource="supplies" />
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
                            )}`,
    `<DataTableActionsMenu
                              ariaLabel={\`Actions pour \${row.name}\`}
                              items={crudRowActions({
                                edit: { resource: "supplies", recordId: row.id },
                                delete: {
                                  onClick: () => void handleDelete(row),
                                  disabled: busy,
                                },
                                canUpdate,
                                canDelete,
                              })}
                            />`,
  ],
  [
    "gestion_du_personnel_paie/PersonnelPayrollContent.tsx",
    `                        <div className="flex justify-end gap-xs flex-wrap">
                          {canUpdate && (
                            <>
                              <CrudEditLink recordId={String(row.id)} resource="payroll" />
                            </>
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
    `                        <DataTableActionsMenu
                          ariaLabel={\`Actions pour \${row.staff_member?.full_name ?? row.id}\`}
                          items={crudRowActions({
                            edit: { resource: "payroll", recordId: row.id },
                            delete: {
                              onClick: () => void handleDelete(row),
                              disabled: busy,
                            },
                            canUpdate,
                            canDelete,
                          })}
                        />`,
  ],
  [
    "communication_center/CommunicationCenterContent.tsx",
    `                          <div className="flex justify-end gap-xs flex-wrap">
                            {canUpdate && (
                              <CrudEditLink recordId={String(a.id)} resource="communication" />
                            )}
                            {canDelete && (
                              <button
                                className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                                disabled={busy}
                                onClick={() => void handleDelete(a)}
                                type="button"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>`,
    `                          <DataTableActionsMenu
                            ariaLabel={\`Actions pour \${a.title}\`}
                            items={crudRowActions({
                              edit: { resource: "communication", recordId: a.id },
                              delete: {
                                onClick: () => void handleDelete(a),
                                disabled: busy,
                              },
                              canUpdate,
                              canDelete,
                            })}
                          />`,
  ],
  [
    "cash_management/CashManagementContent.tsx",
    `                          <div className="flex justify-end gap-xs">
                            {canUpdate && (
                              <CrudEditLink recordId={String(r.id)} resource="cash-registers" />
                            )}
                            {canDelete && (
                              <button
                                className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                                disabled={busy}
                                onClick={async () => {
                                  if (!await confirmDialog(\`Supprimer « \${r.name} » ?\`)) return;
                                  setBusy(true);
                                  void deleteCashRegister(r.id)
                                    .then(() => reload())
                                    .catch((err) => setError(getAuthErrorMessage(err)))
                                    .finally(() => setBusy(false));
                                }}
                                type="button"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>`,
    `                          <DataTableActionsMenu
                            ariaLabel={\`Actions pour \${r.name}\`}
                            items={crudRowActions({
                              edit: { resource: "cash-registers", recordId: r.id },
                              delete: {
                                onClick: () => {
                                  void (async () => {
                                    if (!await confirmDialog(\`Supprimer « \${r.name} » ?\`)) return;
                                    setBusy(true);
                                    void deleteCashRegister(r.id)
                                      .then(() => reload())
                                      .catch((err) => setError(getAuthErrorMessage(err)))
                                      .finally(() => setBusy(false));
                                  })();
                                },
                                disabled: busy,
                              },
                              canUpdate,
                              canDelete,
                            })}
                          />`,
  ],
  [
    "classes_management/ClassesManagementContent.tsx",
    `              <div className="flex justify-end gap-xs">
                <Link
                  aria-label={\`Élèves \${row.name}\`}
                  className="p-xs rounded hover:bg-surface-container-high text-on-surface-variant"
                  href={\`/classes/\${row.id}\`}
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </Link>
                {canUpdate && (
                  <CrudEditLink
                    className="p-xs rounded hover:bg-surface-container-high text-on-surface-variant"
                    recordId={String(row.id)}
                    resource="classes"
                  />
                )}
                {canDelete && (
                  <button
                    aria-label={\`Supprimer \${row.name}\`}
                    className="p-xs rounded hover:bg-surface-container-high text-error disabled:opacity-50"
                    disabled={deletingId === row.id}
                    onClick={() => void handleDelete(row)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </div>`,
    `              <DataTableActionsMenu
                ariaLabel={\`Actions pour \${row.name}\`}
                items={crudRowActions({
                  view: { href: \`/classes/\${row.id}\`, label: "Voir la classe", icon: "group" },
                  edit: { resource: "classes", recordId: row.id },
                  delete: {
                    onClick: () => void handleDelete(row),
                    disabled: deletingId === row.id,
                  },
                  canUpdate,
                  canDelete,
                })}
              />`,
  ],
  [
    "subjects_management/SubjectsManagementContent.tsx",
    `                <div className="flex gap-xs">
                  {canUpdate && (
                    <CrudEditLink
                      className="p-xs rounded hover:bg-surface-container-high"
                      recordId={String(row.id)}
                      resource="subjects"
                    />
                  )}
                  {canDelete && (
                    <button
                      aria-label={\`Supprimer \${row.name}\`}
                      className="p-xs rounded hover:bg-surface-container-high text-error disabled:opacity-50"
                      disabled={deletingId === row.id}
                      onClick={() => void handleDelete(row)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>`,
    `                <DataTableActionsMenu
                  ariaLabel={\`Actions pour \${row.name}\`}
                  items={crudRowActions({
                    edit: { resource: "subjects", recordId: row.id },
                    delete: {
                      onClick: () => void handleDelete(row),
                      disabled: deletingId === row.id,
                    },
                    canUpdate,
                    canDelete,
                  })}
                />`,
  ],
];

let n = 0;
for (const [file, old, neu] of blocks) {
  if (patch(file, old, neu)) n++;
}

// Remove KPI blocks
for (const file of [
  "gestion_du_personnel_paie/PersonnelPayrollContent.tsx",
  "comptes_rechargements_cantine/CanteenAccountsContent.tsx",
  "payments_management/PaymentsManagementContent.tsx",
  "stocks_approvisionnements/SuppliesStockContent.tsx",
  "subjects_management/SubjectsManagementContent.tsx",
  "classes_management/ClassesManagementContent.tsx",
]) {
  const fp = path.join(base, file);
  let c = fs.readFileSync(fp, "utf8");
  const orig = c;
  c = c.replace(/\s*<div className="ui-page-title mt-sm"[^>]*>[\s\S]*?<\/div>\s*/g, "\n");
  c = c.replace(
    /\s*<div className="flex items-center justify-between flex-wrap gap-md">\s*<div>\s*<h1 className="ui-page-title">[\s\S]*?<\/div>\s*\{canCreate &&[\s\S]*?\}\s*<\/div>\s*/g,
    "\n"
  );
  c = c.replace(
    /\s*<div className="flex items-center justify-between flex-wrap gap-md">\s*<div>\s*<h1 className="text-display-lg[\s\S]*?<\/div>\s*\{canCreate &&[\s\S]*?\}\s*<\/div>\s*/g,
    "\n"
  );
  if (c !== orig) {
    fs.writeFileSync(fp, c);
    console.log("KPI/header:", file);
    n++;
  }
}

console.log("Total ops:", n);
