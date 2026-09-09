"use client";

import { useEffect, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
  type DataTableMenuItem,
} from "@/presentation/components/shared/DataTableActionsMenu";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
  DataTableSearch,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  activateAcademicYear,
  closeAcademicYear,
  deleteAcademicHoliday,
  deleteAcademicPeriod,
  deleteAcademicYear,
  deleteClassSubject,
  deleteLevel,
  deleteSeries,
  listAcademicHolidays,
  listAcademicPeriods,
  listAcademicYears,
  listClassSubjects,
  listLevels,
  listSeries,
} from "@/infrastructure/api/resources/academic";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import type {
  AcademicHoliday,
  AcademicPeriod,
  AcademicYear,
  ClassSubject,
  NamedRef,
} from "@/shared/types/academic.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type Tab = "years" | "periods" | "holidays" | "levels" | "series" | "class-subjects";

function yearStatusTone(
  status: string | undefined | null,
  isActive: boolean | undefined
): "success" | "neutral" {
  if (isActive || status === "active") return "success";
  return "neutral";
}

function yearStatusLabel(status: string | undefined | null, isActive: boolean | undefined): string {
  if (isActive || status === "active") return "Active";
  if (status === "closed") return "Clôturée";
  return status ?? "—";
}

const TABS: { id: Tab; label: string }[] = [
  { id: "years", label: "Années" },
  { id: "periods", label: "Périodes" },
  { id: "holidays", label: "Vacances" },
  { id: "levels", label: "Niveaux" },
  { id: "series", label: "Séries" },
  { id: "class-subjects", label: "Matières×Classes" },
];

export function AcademicStructureContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("years");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [holidays, setHolidays] = useState<AcademicHoliday[]>([]);
  const [levels, setLevels] = useState<NamedRef[]>([]);
  const [series, setSeries] = useState<NamedRef[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const canCreate = can(user, "academic.create") || can(user, "institution.update");
  const canUpdate = can(user, "academic.update") || can(user, "institution.update");
  const canDelete = can(user, "academic.delete") || can(user, "institution.update");
  // Admins always can via can() SUPER_ADMIN/ADMIN short-circuit

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [y, p, h, l, s, cs] = await Promise.all([
        listAcademicYears(),
        listAcademicPeriods(),
        listAcademicHolidays(),
        listLevels(),
        listSeries(),
        listClassSubjects(),
      ]);
      setYears(y);
      setPeriods(p);
      setHolidays(h);
      setLevels(l);
      setSeries(s);
      setClassSubjects(cs);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    setSearch("");
  }, [tab]);

  async function handleActivate(id: number) {
    setBusy(true);
    setError(null);
    try {
      await activateAcademicYear(id);
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleClose(id: number) {
    if (!await confirmDialog("Clôturer cette année scolaire ?")) return;
    setBusy(true);
    setError(null);
    try {
      await closeAcademicYear(id);
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const createResource: Record<Tab, string> = {
    years: "academic-years",
    periods: "academic-periods",
    holidays: "academic-holidays",
    levels: "levels",
    series: "series",
    "class-subjects": "class-subjects",
  };

  const createLabels: Record<Tab, string> = {
    years: "NOUVELLE ANNÉE",
    periods: "NOUVELLE PÉRIODE",
    holidays: "NOUVELLES VACANCES",
    levels: "NOUVEAU NIVEAU",
    series: "NOUVELLE SÉRIE",
    "class-subjects": "NOUVELLE AFFECTATION",
  };

  const q = search.trim().toLowerCase();
  const filteredYears = q ? years.filter((y) => y.name.toLowerCase().includes(q)) : years;
  const filteredPeriods = q ? periods.filter((p) => p.name.toLowerCase().includes(q)) : periods;
  const filteredHolidays = q ? holidays.filter((h) => h.name.toLowerCase().includes(q)) : holidays;
  const filteredLevels = q ? levels.filter((l) => l.name.toLowerCase().includes(q)) : levels;
  const filteredSeries = q ? series.filter((s) => s.name.toLowerCase().includes(q)) : series;
  const filteredClassSubjects = q
    ? classSubjects.filter((cs) => {
        const className = cs.class_group && "name" in cs.class_group ? cs.class_group.name : "";
        const subjectName = cs.subject && "name" in cs.subject ? cs.subject.name : "";
        return className.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
      })
    : classSubjects;

  const yearsTable = useClientDataTable(filteredYears, [tab, years.length, search]);
  const periodsTable = useClientDataTable(filteredPeriods, [tab, periods.length, search]);
  const holidaysTable = useClientDataTable(filteredHolidays, [tab, holidays.length, search]);
  const levelsTable = useClientDataTable(filteredLevels, [tab, levels.length, search]);
  const seriesTable = useClientDataTable(filteredSeries, [tab, series.length, search]);
  const classSubjectsTable = useClientDataTable(filteredClassSubjects, [
    tab,
    classSubjects.length,
    search,
  ]);

  const searchPlaceholder: Record<Tab, string> = {
    years: "Rechercher une année…",
    periods: "Rechercher une période…",
    holidays: "Rechercher des vacances…",
    levels: "Rechercher un niveau…",
    series: "Rechercher une série…",
    "class-subjects": "Rechercher une classe ou matière…",
  };

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-[1400px] mx-auto">
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
          data-testid="academic-structure-error"
          role="alert"
        >
          {error}
        </div>
      )}
      {loading && <ContentSkeleton testId="academic-structure-loading" variant="table" />}

      {!loading && tab === "years" && (
        <DataTableShell testId="academic-years-table">
          <DataTableToolbar>
            <div className="flex flex-wrap gap-xs" data-testid="academic-structure-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`px-md py-sm rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                  onClick={() => setTab(t.id)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DataTableSearch
            ariaLabel={searchPlaceholder[tab]}
            onChange={setSearch}
            placeholder={searchPlaceholder[tab]}
            value={search}
          />
            <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              {canCreate && (
                <CrudCreateLink
                  className={DATA_TABLE_CREATE_CLASS}
                  label={createLabels[tab]}
                  resource={createResource[tab]}
                />
              )}
            </div>
          </DataTableToolbar>
          <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr className="ui-table-head-row">
                <DataTableSelectHeader
                  checked={yearsTable.allPageSelected}
                  indeterminate={yearsTable.somePageSelected && !yearsTable.allPageSelected}
                  onChange={yearsTable.toggleAllPage}
                />
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Nom</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Début</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Fin</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Statut</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {filteredYears.length === 0 ? (
                <tr>
                  <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                    {search ? "Aucun résultat pour cette recherche." : "Aucune année scolaire."}
                  </td>
                </tr>
              ) : (
                yearsTable.pageRows.map((y, index) => (
                  <tr className={tableRowClass(index)} key={y.id}>
                    <DataTableSelectCell
                      checked={yearsTable.selectedIds.has(y.id)}
                      label={y.name}
                      onChange={() => yearsTable.toggleOne(y.id)}
                    />
                    <td className="py-sm px-lg font-semibold">
                      {y.name}
                      {y.is_active ? " ★" : ""}
                    </td>
                    <td className="py-sm px-lg font-mono-data">
                      {y.start_date ?? y.starts_on ?? "—"}
                    </td>
                    <td className="py-sm px-lg font-mono-data">
                      {y.end_date ?? y.ends_on ?? "—"}
                    </td>
                    <td className="py-sm px-lg">
                      <StatusBadge
                        label={yearStatusLabel(y.status, y.is_active)}
                        tone={yearStatusTone(y.status, y.is_active)}
                        withDot
                      />
                    </td>
                    <td className="py-sm px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${y.name}`}
                        items={[
                          ...(canUpdate && !y.is_active
                            ? [
                                {
                                  kind: "button" as const,
                                  label: "Activer",
                                  icon: "play_circle",
                                  onClick: () => void handleActivate(y.id),
                                  disabled: busy,
                                },
                              ]
                            : []),
                          ...(canUpdate && y.is_active
                            ? [
                                {
                                  kind: "button" as const,
                                  label: "Clôturer",
                                  icon: "lock",
                                  onClick: () => void handleClose(y.id),
                                  disabled: busy,
                                },
                              ]
                            : []),
                          ...crudRowActions({
                            edit: { resource: "academic-years", recordId: y.id },
                            delete: !y.is_active
                              ? {
                                  onClick: () =>
                                    void (async () => {
                                      if (!await confirmDialog(`Supprimer « ${y.name} » ?`))
                                        return;
                                      setBusy(true);
                                      void deleteAcademicYear(y.id)
                                        .then(() => reload())
                                        .catch((err) => setError(getAuthErrorMessage(err)))
                                        .finally(() => setBusy(false));
                                    })(),
                                  disabled: busy,
                                }
                              : undefined,
                            canUpdate,
                            canDelete: canDelete && !y.is_active,
                          }),
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {filteredYears.length > 0 && (
            <DataTablePagination
              canNextPage={yearsTable.canNextPage}
              canPreviousPage={yearsTable.canPreviousPage}
              entityLabel="années scolaires"
              from={yearsTable.from}
              onFirstPage={() => yearsTable.setPageIndex(0)}
              onLastPage={() => yearsTable.setPageIndex(yearsTable.pageCount - 1)}
              onNextPage={() => yearsTable.setPageIndex(yearsTable.pageIndex + 1)}
              onPageChange={yearsTable.setPageIndex}
              onPageSizeChange={yearsTable.setPageSize}
              onPreviousPage={() => yearsTable.setPageIndex(yearsTable.pageIndex - 1)}
              pageCount={yearsTable.pageCount}
              pageIndex={yearsTable.pageIndex}
              pageSize={yearsTable.pageSize}
              testId="academic-years-pagination"
              to={yearsTable.to}
              total={filteredYears.length}
            />
          )}
        </DataTableShell>
      )}

      {!loading && tab === "periods" && (
        <DataTableShell testId="academic-periods-table">
          <DataTableToolbar>
            <div className="flex flex-wrap gap-xs" data-testid="academic-structure-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`px-md py-sm rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                  onClick={() => setTab(t.id)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DataTableSearch
            ariaLabel={searchPlaceholder[tab]}
            onChange={setSearch}
            placeholder={searchPlaceholder[tab]}
            value={search}
          />
            <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              {canCreate && (
                <CrudCreateLink
                  className={DATA_TABLE_CREATE_CLASS}
                  label={createLabels[tab]}
                  resource={createResource[tab]}
                />
              )}
            </div>
          </DataTableToolbar>
          <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr className="ui-table-head-row">
                <DataTableSelectHeader
                  checked={periodsTable.allPageSelected}
                  indeterminate={periodsTable.somePageSelected && !periodsTable.allPageSelected}
                  onChange={periodsTable.toggleAllPage}
                />
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Nom</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Type</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Début</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Fin</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {filteredPeriods.length === 0 ? (
                <tr>
                  <td className="py-lg px-lg text-on-surface-variant" colSpan={6}>
                    {search ? "Aucun résultat pour cette recherche." : "Aucune période."}
                  </td>
                </tr>
              ) : (
                periodsTable.pageRows.map((p, index) => (
                  <tr className={tableRowClass(index)} key={p.id}>
                    <DataTableSelectCell
                      checked={periodsTable.selectedIds.has(p.id)}
                      label={p.name}
                      onChange={() => periodsTable.toggleOne(p.id)}
                    />
                    <td className="py-sm px-lg">{p.name}</td>
                    <td className="py-sm px-lg">{p.type ?? "—"}</td>
                    <td className="py-sm px-lg font-mono-data">{p.start_date ?? "—"}</td>
                    <td className="py-sm px-lg font-mono-data">{p.end_date ?? "—"}</td>
                    <td className="py-sm px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${p.name}`}
                        items={crudRowActions({
                          edit: { resource: "academic-periods", recordId: p.id },
                          delete: {
                            onClick: () =>
                              void (async () => {
                                if (!await confirmDialog(`Supprimer « ${p.name} » ?`)) return;
                                setBusy(true);
                                void deleteAcademicPeriod(p.id)
                                  .then(() => reload())
                                  .catch((err) => setError(getAuthErrorMessage(err)))
                                  .finally(() => setBusy(false));
                              })(),
                            disabled: busy,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {filteredPeriods.length > 0 && (
            <DataTablePagination
              canNextPage={periodsTable.canNextPage}
              canPreviousPage={periodsTable.canPreviousPage}
              entityLabel="périodes"
              from={periodsTable.from}
              onFirstPage={() => periodsTable.setPageIndex(0)}
              onLastPage={() => periodsTable.setPageIndex(periodsTable.pageCount - 1)}
              onNextPage={() => periodsTable.setPageIndex(periodsTable.pageIndex + 1)}
              onPageChange={periodsTable.setPageIndex}
              onPageSizeChange={periodsTable.setPageSize}
              onPreviousPage={() => periodsTable.setPageIndex(periodsTable.pageIndex - 1)}
              pageCount={periodsTable.pageCount}
              pageIndex={periodsTable.pageIndex}
              pageSize={periodsTable.pageSize}
              testId="academic-periods-pagination"
              to={periodsTable.to}
              total={filteredPeriods.length}
            />
          )}
        </DataTableShell>
      )}

      {!loading && tab === "holidays" && (
        <DataTableShell testId="academic-holidays-table">
          <DataTableToolbar>
            <div className="flex flex-wrap gap-xs" data-testid="academic-structure-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`px-md py-sm rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                  onClick={() => setTab(t.id)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DataTableSearch
            ariaLabel={searchPlaceholder[tab]}
            onChange={setSearch}
            placeholder={searchPlaceholder[tab]}
            value={search}
          />
            <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              {canCreate && (
                <CrudCreateLink
                  className={DATA_TABLE_CREATE_CLASS}
                  label={createLabels[tab]}
                  resource={createResource[tab]}
                />
              )}
            </div>
          </DataTableToolbar>
          <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr className="ui-table-head-row">
                <DataTableSelectHeader
                  checked={holidaysTable.allPageSelected}
                  indeterminate={holidaysTable.somePageSelected && !holidaysTable.allPageSelected}
                  onChange={holidaysTable.toggleAllPage}
                />
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Nom</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Début</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Fin</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {filteredHolidays.length === 0 ? (
                <tr>
                  <td className="py-lg px-lg text-on-surface-variant" colSpan={5}>
                    {search ? "Aucun résultat pour cette recherche." : "Aucune période de vacances."}
                  </td>
                </tr>
              ) : (
                holidaysTable.pageRows.map((h, index) => (
                  <tr className={tableRowClass(index)} key={h.id}>
                    <DataTableSelectCell
                      checked={holidaysTable.selectedIds.has(h.id)}
                      label={h.name}
                      onChange={() => holidaysTable.toggleOne(h.id)}
                    />
                    <td className="py-sm px-lg">{h.name}</td>
                    <td className="py-sm px-lg font-mono-data">{h.start_date ?? "—"}</td>
                    <td className="py-sm px-lg font-mono-data">{h.end_date ?? "—"}</td>
                    <td className="py-sm px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${h.name}`}
                        items={crudRowActions({
                          edit: { resource: "academic-holidays", recordId: h.id },
                          delete: {
                            onClick: () =>
                              void (async () => {
                                if (!await confirmDialog(`Supprimer « ${h.name} » ?`)) return;
                                setBusy(true);
                                void deleteAcademicHoliday(h.id)
                                  .then(() => reload())
                                  .catch((err) => setError(getAuthErrorMessage(err)))
                                  .finally(() => setBusy(false));
                              })(),
                            disabled: busy,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {filteredHolidays.length > 0 && (
            <DataTablePagination
              canNextPage={holidaysTable.canNextPage}
              canPreviousPage={holidaysTable.canPreviousPage}
              entityLabel="vacances"
              from={holidaysTable.from}
              onFirstPage={() => holidaysTable.setPageIndex(0)}
              onLastPage={() => holidaysTable.setPageIndex(holidaysTable.pageCount - 1)}
              onNextPage={() => holidaysTable.setPageIndex(holidaysTable.pageIndex + 1)}
              onPageChange={holidaysTable.setPageIndex}
              onPageSizeChange={holidaysTable.setPageSize}
              onPreviousPage={() => holidaysTable.setPageIndex(holidaysTable.pageIndex - 1)}
              pageCount={holidaysTable.pageCount}
              pageIndex={holidaysTable.pageIndex}
              pageSize={holidaysTable.pageSize}
              testId="academic-holidays-pagination"
              to={holidaysTable.to}
              total={filteredHolidays.length}
            />
          )}
        </DataTableShell>
      )}

      {!loading && tab === "levels" && (
        <DataTableShell testId="levels-table">
          <DataTableToolbar>
            <div className="flex flex-wrap gap-xs" data-testid="academic-structure-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`px-md py-sm rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                  onClick={() => setTab(t.id)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DataTableSearch
            ariaLabel={searchPlaceholder[tab]}
            onChange={setSearch}
            placeholder={searchPlaceholder[tab]}
            value={search}
          />
            <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              {canCreate && (
                <CrudCreateLink
                  className={DATA_TABLE_CREATE_CLASS}
                  label={createLabels[tab]}
                  resource={createResource[tab]}
                />
              )}
            </div>
          </DataTableToolbar>
          <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr className="ui-table-head-row">
                <DataTableSelectHeader
                  checked={levelsTable.allPageSelected}
                  indeterminate={levelsTable.somePageSelected && !levelsTable.allPageSelected}
                  onChange={levelsTable.toggleAllPage}
                />
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Nom</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Code</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {filteredLevels.length === 0 ? (
                <tr>
                  <td className="py-lg px-lg text-on-surface-variant" colSpan={4}>
                    {search ? "Aucun résultat pour cette recherche." : "Aucun niveau."}
                  </td>
                </tr>
              ) : (
                levelsTable.pageRows.map((l, index) => (
                  <tr className={tableRowClass(index)} key={l.id}>
                    <DataTableSelectCell
                      checked={levelsTable.selectedIds.has(l.id)}
                      label={l.name}
                      onChange={() => levelsTable.toggleOne(l.id)}
                    />
                    <td className="py-sm px-lg">{l.name}</td>
                    <td className="py-sm px-lg">{l.code ?? "—"}</td>
                    <td className="py-sm px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${l.name}`}
                        items={crudRowActions({
                          edit: { resource: "levels", recordId: l.id },
                          delete: {
                            onClick: () =>
                              void (async () => {
                                if (!await confirmDialog(`Supprimer « ${l.name} » ?`)) return;
                                setBusy(true);
                                void deleteLevel(l.id)
                                  .then(() => reload())
                                  .catch((err) => setError(getAuthErrorMessage(err)))
                                  .finally(() => setBusy(false));
                              })(),
                            disabled: busy,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {filteredLevels.length > 0 && (
            <DataTablePagination
              canNextPage={levelsTable.canNextPage}
              canPreviousPage={levelsTable.canPreviousPage}
              entityLabel="niveaux"
              from={levelsTable.from}
              onFirstPage={() => levelsTable.setPageIndex(0)}
              onLastPage={() => levelsTable.setPageIndex(levelsTable.pageCount - 1)}
              onNextPage={() => levelsTable.setPageIndex(levelsTable.pageIndex + 1)}
              onPageChange={levelsTable.setPageIndex}
              onPageSizeChange={levelsTable.setPageSize}
              onPreviousPage={() => levelsTable.setPageIndex(levelsTable.pageIndex - 1)}
              pageCount={levelsTable.pageCount}
              pageIndex={levelsTable.pageIndex}
              pageSize={levelsTable.pageSize}
              testId="levels-pagination"
              to={levelsTable.to}
              total={filteredLevels.length}
            />
          )}
        </DataTableShell>
      )}

      {!loading && tab === "series" && (
        <DataTableShell testId="series-table">
          <DataTableToolbar>
            <div className="flex flex-wrap gap-xs" data-testid="academic-structure-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`px-md py-sm rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                  onClick={() => setTab(t.id)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DataTableSearch
            ariaLabel={searchPlaceholder[tab]}
            onChange={setSearch}
            placeholder={searchPlaceholder[tab]}
            value={search}
          />
            <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              {canCreate && (
                <CrudCreateLink
                  className={DATA_TABLE_CREATE_CLASS}
                  label={createLabels[tab]}
                  resource={createResource[tab]}
                />
              )}
            </div>
          </DataTableToolbar>
          <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr className="ui-table-head-row">
                <DataTableSelectHeader
                  checked={seriesTable.allPageSelected}
                  indeterminate={seriesTable.somePageSelected && !seriesTable.allPageSelected}
                  onChange={seriesTable.toggleAllPage}
                />
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Nom</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Code</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {filteredSeries.length === 0 ? (
                <tr>
                  <td className="py-lg px-lg text-on-surface-variant" colSpan={4}>
                    {search ? "Aucun résultat pour cette recherche." : "Aucune série."}
                  </td>
                </tr>
              ) : (
                seriesTable.pageRows.map((s, index) => (
                  <tr className={tableRowClass(index)} key={s.id}>
                    <DataTableSelectCell
                      checked={seriesTable.selectedIds.has(s.id)}
                      label={s.name}
                      onChange={() => seriesTable.toggleOne(s.id)}
                    />
                    <td className="py-sm px-lg">{s.name}</td>
                    <td className="py-sm px-lg">{s.code ?? "—"}</td>
                    <td className="py-sm px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${s.name}`}
                        items={crudRowActions({
                          edit: { resource: "series", recordId: s.id },
                          delete: {
                            onClick: () =>
                              void (async () => {
                                if (!await confirmDialog(`Supprimer « ${s.name} » ?`)) return;
                                setBusy(true);
                                void deleteSeries(s.id)
                                  .then(() => reload())
                                  .catch((err) => setError(getAuthErrorMessage(err)))
                                  .finally(() => setBusy(false));
                              })(),
                            disabled: busy,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {filteredSeries.length > 0 && (
            <DataTablePagination
              canNextPage={seriesTable.canNextPage}
              canPreviousPage={seriesTable.canPreviousPage}
              entityLabel="séries"
              from={seriesTable.from}
              onFirstPage={() => seriesTable.setPageIndex(0)}
              onLastPage={() => seriesTable.setPageIndex(seriesTable.pageCount - 1)}
              onNextPage={() => seriesTable.setPageIndex(seriesTable.pageIndex + 1)}
              onPageChange={seriesTable.setPageIndex}
              onPageSizeChange={seriesTable.setPageSize}
              onPreviousPage={() => seriesTable.setPageIndex(seriesTable.pageIndex - 1)}
              pageCount={seriesTable.pageCount}
              pageIndex={seriesTable.pageIndex}
              pageSize={seriesTable.pageSize}
              testId="series-pagination"
              to={seriesTable.to}
              total={filteredSeries.length}
            />
          )}
        </DataTableShell>
      )}

      {!loading && tab === "class-subjects" && (
        <DataTableShell testId="class-subjects-table">
          <DataTableToolbar>
            <div className="flex flex-wrap gap-xs" data-testid="academic-structure-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`px-md py-sm rounded-lg font-label-caps text-label-caps whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                  }`}
                  onClick={() => setTab(t.id)}
                  type="button"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <DataTableSearch
            ariaLabel={searchPlaceholder[tab]}
            onChange={setSearch}
            placeholder={searchPlaceholder[tab]}
            value={search}
          />
            <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
              <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
              {canCreate && (
                <CrudCreateLink
                  className={DATA_TABLE_CREATE_CLASS}
                  label={createLabels[tab]}
                  resource={createResource[tab]}
                />
              )}
            </div>
          </DataTableToolbar>
          <div className="overflow-x-auto min-h-[320px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr className="ui-table-head-row">
                <DataTableSelectHeader
                  checked={classSubjectsTable.allPageSelected}
                  indeterminate={
                    classSubjectsTable.somePageSelected && !classSubjectsTable.allPageSelected
                  }
                  onChange={classSubjectsTable.toggleAllPage}
                />
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Classe</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Matière</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Coef.</th>
                <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {filteredClassSubjects.length === 0 ? (
                <tr>
                  <td className="py-lg px-lg text-on-surface-variant" colSpan={5}>
                    {search ? "Aucun résultat pour cette recherche." : "Aucune affectation."}
                  </td>
                </tr>
              ) : (
                classSubjectsTable.pageRows.map((cs, index) => (
                  <tr className={tableRowClass(index)} key={cs.id}>
                    <DataTableSelectCell
                      checked={classSubjectsTable.selectedIds.has(cs.id)}
                      label={
                        cs.class_group && "name" in cs.class_group
                          ? cs.class_group.name
                          : `#${cs.class_group_id}`
                      }
                      onChange={() => classSubjectsTable.toggleOne(cs.id)}
                    />
                    <td className="py-sm px-lg">
                      {cs.class_group && "name" in cs.class_group
                        ? cs.class_group.name
                        : `#${cs.class_group_id}`}
                    </td>
                    <td className="py-sm px-lg">
                      {cs.subject && "name" in cs.subject
                        ? cs.subject.name
                        : `#${cs.subject_id}`}
                    </td>
                    <td className="py-sm px-lg">{cs.coefficient ?? "—"}</td>
                    <td className="py-sm px-lg text-right">
                      <DataTableActionsMenu
                        ariaLabel={`Actions pour ${
                          cs.class_group && "name" in cs.class_group
                            ? cs.class_group.name
                            : `classe #${cs.class_group_id}`
                        }`}
                        items={crudRowActions({
                          edit: { resource: "class-subjects", recordId: cs.id },
                          delete: {
                            onClick: () =>
                              void (async () => {
                                if (!await confirmDialog("Supprimer cette affectation ?")) return;
                                setBusy(true);
                                void deleteClassSubject(cs.id)
                                  .then(() => reload())
                                  .catch((err) => setError(getAuthErrorMessage(err)))
                                  .finally(() => setBusy(false));
                              })(),
                            disabled: busy,
                          },
                          canUpdate,
                          canDelete,
                        })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          {filteredClassSubjects.length > 0 && (
            <DataTablePagination
              canNextPage={classSubjectsTable.canNextPage}
              canPreviousPage={classSubjectsTable.canPreviousPage}
              entityLabel="affectations"
              from={classSubjectsTable.from}
              onFirstPage={() => classSubjectsTable.setPageIndex(0)}
              onLastPage={() => classSubjectsTable.setPageIndex(classSubjectsTable.pageCount - 1)}
              onNextPage={() => classSubjectsTable.setPageIndex(classSubjectsTable.pageIndex + 1)}
              onPageChange={classSubjectsTable.setPageIndex}
              onPageSizeChange={classSubjectsTable.setPageSize}
              onPreviousPage={() => classSubjectsTable.setPageIndex(classSubjectsTable.pageIndex - 1)}
              pageCount={classSubjectsTable.pageCount}
              pageIndex={classSubjectsTable.pageIndex}
              pageSize={classSubjectsTable.pageSize}
              testId="class-subjects-pagination"
              to={classSubjectsTable.to}
              total={filteredClassSubjects.length}
            />
          )}
        </DataTableShell>
      )}
    </div>
  );
}
