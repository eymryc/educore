"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import {
  DataTableSkeleton,
} from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  listAcademicYears,
  listClassGroups,
  listLevels,
} from "@/infrastructure/api/resources/academic";
import {
  approveEnrollment,
  assignEnrollmentClass,
  completeReEnrollment,
  deleteEnrollment,
  enrollEnrollment,
  listEnrollments,
  listReEnrollments,
  markEnrollmentPayment,
  rejectEnrollment,
  reviewEnrollment,
  uploadEnrollmentDocument,
} from "@/infrastructure/api/resources/enrollments";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import type { AcademicYear, ClassGroup, NamedRef } from "@/shared/types/academic.types";
import {
  ENROLLMENT_PIPELINE,
  ENROLLMENT_STATUS_LABELS,
  RE_ENROLLMENT_STATUS_LABELS,
  canCompleteReEnrollment,
  canEditEnrollment,
  enrollmentFullName,
  filterEnrollments,
  nextEnrollmentActions,
  summarizeEnrollments,
  type Enrollment,
  type EnrollmentAction,
  type EnrollmentStatus,
  type ReEnrollment,
} from "@/shared/types/enrollment.types";
import { studentFullName } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

const ACTION_LABELS: Record<EnrollmentAction, string> = {
  review: "Mettre en examen",
  approve: "Approuver",
  payment: "Marquer payé",
  enroll: "Inscrire",
  "assign-class": "Affecter classe",
  reject: "Refuser",
};

type MainTab = "enrollments" | "re-enrollments";

function statusTone(
  status: EnrollmentStatus
): "info" | "warning" | "success" | "error" | "neutral" {
  if (status === "REJECTED") return "error";
  if (status === "CLASS_ASSIGNED" || status === "ENROLLED") return "success";
  if (status === "PAYMENT" || status === "APPROVED") return "info";
  if (status === "REVIEW") return "warning";
  return "neutral";
}

export function EnrollmentManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>("enrollments");
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [reEnrollments, setReEnrollments] = useState<ReEnrollment[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [levels, setLevels] = useState<NamedRef[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [yearId, setYearId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number | null>(null);

  const canCreate = can(user, "students.create");
  const canUpdate = can(user, "students.update");
  const canDelete = can(user, "students.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [list, reList, yearList, levelList, classList] = await Promise.all([
        listEnrollments(),
        listReEnrollments(),
        listAcademicYears(),
        listLevels(),
        listClassGroups(),
      ]);
      const activeYear = yearList.find((y) => y.is_active) ?? yearList[0];
      const scopedYearId = yearId ? Number(yearId) : activeYear?.id;
      setRows(list);
      setReEnrollments(reList);
      setYears(yearList);
      setLevels(levelList);
      setClasses(
        scopedYearId ? classList.filter((c) => c.academic_year_id === scopedYearId) : classList
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => filterEnrollments(rows, { search, status, yearId, levelId }),
    [rows, search, status, yearId, levelId]
  );

  const enrollmentTable = useClientDataTable(filtered, [search, status, yearId, levelId, mainTab]);
  const reEnrollmentsTable = useClientDataTable(reEnrollments, [mainTab, reEnrollments.length]);

  const summary = useMemo(
    () =>
      summarizeEnrollments(
        filterEnrollments(rows, { search, status: "", yearId, levelId })
      ),
    [rows, search, yearId, levelId]
  );

  const hasFilters = Boolean(search || status || yearId || levelId);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setYearId("");
    setLevelId("");
  }

  function patch(updated: Enrollment) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  async function runAction(row: Enrollment, action: EnrollmentAction) {
    if (!canUpdate) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let updated: Enrollment;
      switch (action) {
        case "review":
          updated = await reviewEnrollment(row.id);
          break;
        case "approve":
          updated = await approveEnrollment(row.id);
          break;
        case "payment":
          updated = await markEnrollmentPayment(row.id);
          break;
        case "enroll":
          updated = await enrollEnrollment(row.id);
          break;
        case "reject":
          if (
            !(await confirmDialog(`Refuser la candidature de ${enrollmentFullName(row)} ?`, {
              destructive: true,
            }))
          )
            return;
          updated = await rejectEnrollment(row.id);
          break;
        case "assign-class": {
          const options = classes
            .filter((c) => c.level_id === row.level_id || !row.level_id)
            .map((c) => `${c.id}: ${c.name}`)
            .join("\n");
          const raw = window.prompt(
            `ID de la classe à affecter${options ? `\n\n${options}` : ""} :`,
            row.class_group_id ? String(row.class_group_id) : ""
          );
          if (!raw?.trim()) return;
          const classGroupId = Number(raw.trim());
          if (!Number.isFinite(classGroupId)) {
            setError("Identifiant de classe invalide.");
            return;
          }
          updated = await assignEnrollmentClass(row.id, classGroupId);
          break;
        }
        default:
          return;
      }
      patch(updated);
      setNotice(`${ACTION_LABELS[action]} — ${ENROLLMENT_STATUS_LABELS[updated.status]}.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(row: Enrollment) {
    if (!canDelete) return;
    if (
      !(await confirmDialog(`Supprimer la demande de ${enrollmentFullName(row)} ?`, {
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    try {
      await deleteEnrollment(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File | undefined) {
    const targetId = uploadTargetRef.current;
    if (!file || targetId == null || !canUpdate) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const doc = await uploadEnrollmentDocument(targetId, file);
      setRows((prev) =>
        prev.map((r) =>
          r.id === targetId ? { ...r, documents: [...(r.documents ?? []), doc] } : r
        )
      );
      setNotice(`Pièce jointe « ${doc.file_name} » ajoutée.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
      uploadTargetRef.current = null;
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleCompleteReEnrollment(row: ReEnrollment) {
    if (!canUpdate || !canCompleteReEnrollment(row)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await completeReEnrollment(row.id);
      setReEnrollments((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice("Réinscription terminée.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const createLabel =
    mainTab === "enrollments" ? "Nouvelle demande" : "Nouvelle réinscription";
  const createResource = mainTab === "enrollments" ? "enrollment" : "re-enrollments";

  return (
    <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto gap-lg pb-xl">
      <input
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => void handleUpload(e.target.files?.[0])}
        ref={fileRef}
        type="file"
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm"
        >
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm">
          {notice}
        </div>
      )}

      <div className="ui-table-shell flex-1 flex flex-col">
        <ContentTabs
          items={[
            { id: "enrollments", label: "Inscriptions", count: rows.length },
            { id: "re-enrollments", label: "Réinscriptions", count: reEnrollments.length },
          ]}
          onChange={(id) => {
            setMainTab(id);
            setSearch("");
            setStatus("");
            setExpandedId(null);
          }}
          testId="enrollment-main-tabs"
          value={mainTab}
        />

        {mainTab === "enrollments" && (
          <>
            <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
              <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  search
                </span>
                <input
                  aria-label="Rechercher une candidature"
                  className="ui-search-input ml-sm h-full"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom ou contact…"
                  type="text"
                  value={search}
                />
              </div>
              <select
                aria-label="Filtrer par année"
                className="ui-input cursor-pointer h-10 py-0"
                onChange={(e) => setYearId(e.target.value)}
                value={yearId}
              >
                <option value="">Toutes les années</option>
                {years.map((y) => (
                  <option key={y.id} value={String(y.id)}>
                    {y.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filtrer par niveau"
                className="ui-input cursor-pointer h-10 py-0"
                onChange={(e) => setLevelId(e.target.value)}
                value={levelId}
              >
                <option value="">Tous les niveaux</option>
                {levels.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filtrer par statut"
                className="ui-input cursor-pointer h-10 py-0"
                data-testid="enrollment-pipeline"
                onChange={(e) => setStatus(e.target.value)}
                value={status}
              >
                <option value="">Tous les statuts ({summary.total})</option>
                {ENROLLMENT_PIPELINE.map((step) => (
                  <option key={step} value={step}>
                    {ENROLLMENT_STATUS_LABELS[step]} ({summary[step] ?? 0})
                  </option>
                ))}
                <option value="REJECTED">
                  Refusées ({summary.REJECTED ?? 0})
                </option>
              </select>
              {hasFilters && (
                <button
                  className="inline-flex items-center gap-xs h-10 px-md text-[13px] text-on-surface-variant hover:text-primary transition-colors"
                  onClick={clearFilters}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                  Réinitialiser
                </button>
              )}
              <div className="ml-auto shrink-0 flex items-center gap-sm">
                <span
                  className="hidden sm:inline text-[13px] text-on-surface-variant"
                  data-testid="enroll-kpi-total"
                >
                  {filtered.length} demande(s)
                </span>
                <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
                {canCreate && (
                  <CrudCreateLink
                    className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                    label={createLabel}
                    resource={createResource}
                  />
                )}
              </div>
            </div>

            <div className="overflow-auto min-h-[320px]" data-testid="enrollment-table">
              {loading ? (
                <DataTableSkeleton
                  label="Chargement des inscriptions…"
                  labels={["", "Candidat", "Niveau", "Date", "Statut", "Pièces", ""]}
                  rows={10}
                  testId="enrollment-loading"
                />
              ) : filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center px-lg py-2xl text-center"
                  data-testid="enrollment-empty"
                >
                  <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                    person_off
                  </span>
                  <h3 className="font-title-md text-on-surface mb-xs">Aucune demande trouvée</h3>
                  <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                    Aucun résultat pour ces filtres, ou aucune candidature n&apos;est enregistrée.
                  </p>
                  <div className="flex flex-wrap gap-sm justify-center">
                    {hasFilters && (
                      <button className="ui-btn-secondary" onClick={clearFilters} type="button">
                        Effacer les filtres
                      </button>
                    )}
                    {canCreate && (
                      <CrudCreateLink label={createLabel} resource={createResource} />
                    )}
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr>
                      <DataTableSelectHeader
                        checked={enrollmentTable.allPageSelected}
                        indeterminate={
                          enrollmentTable.somePageSelected && !enrollmentTable.allPageSelected
                        }
                        onChange={enrollmentTable.toggleAllPage}
                      />
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Candidat</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Niveau</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Date</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Statut</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Pièces</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right sticky right-0 bg-surface-container-low/95 w-16">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
                    {enrollmentTable.pageRows.map((row, index) => {
                      const actions = nextEnrollmentActions(row.status);
                      const expanded = expandedId === row.id;
                      const zebra = index % 2 === 1;
                      return (
                        <Fragment key={row.id}>
                          <tr className={`group ${tableRowClass(index)}`}>
                            <DataTableSelectCell
                              checked={enrollmentTable.selectedIds.has(row.id)}
                              label={enrollmentFullName(row)}
                              onChange={() => enrollmentTable.toggleOne(row.id)}
                            />
                            <td className="px-lg py-sm align-middle">
                              <div className="font-semibold text-on-surface">
                                {enrollmentFullName(row)}
                              </div>
                              <div className="text-[12px] text-on-surface-variant">
                                {row.parent_contact}
                              </div>
                              {row.student_id && (
                                <Link
                                  className="text-primary text-[12px] hover:underline"
                                  href={`/students/${row.student_id}`}
                                >
                                  Voir élève #{row.student_id}
                                </Link>
                              )}
                            </td>
                            <td className="px-lg py-sm align-middle">
                              {row.level && "name" in row.level ? row.level.name : "—"}
                            </td>
                            <td className="px-lg py-sm align-middle font-mono-data text-[13px] text-on-surface-variant">
                              {row.application_date}
                            </td>
                            <td className="px-lg py-sm align-middle">
                              <StatusBadge
                                label={ENROLLMENT_STATUS_LABELS[row.status]}
                                tone={statusTone(row.status)}
                                withDot
                              />
                            </td>
                            <td className="px-lg py-sm align-middle text-on-surface-variant">
                              {row.documents?.length ?? 0}
                            </td>
                            <td
                              className={`px-lg py-sm align-middle sticky right-0 text-right overflow-visible group-hover:bg-surface-container-low/70 ${
                                zebra
                                  ? "bg-surface-container-low/45"
                                  : "bg-surface-container-lowest"
                              }`}
                            >
                              <DataTableActionsMenu
                                ariaLabel={`Actions pour ${enrollmentFullName(row)}`}
                                items={[
                                  ...actions.map((action) => ({
                                    kind: "button" as const,
                                    label: ACTION_LABELS[action],
                                    icon: action === "reject" ? "cancel" : "arrow_forward",
                                    onClick: () => void runAction(row, action),
                                    disabled: busy || !canUpdate,
                                    destructive: action === "reject",
                                  })),
                                  {
                                    kind: "button",
                                    label: "Détails",
                                    icon: "info",
                                    onClick: () => setExpandedId(expanded ? null : row.id),
                                  },
                                  ...crudRowActions({
                                    edit: canEditEnrollment(row.status)
                                      ? { resource: "enrollment", recordId: row.id }
                                      : undefined,
                                    delete:
                                      row.status === "APPLICATION"
                                        ? {
                                            onClick: () => void handleDelete(row),
                                            disabled: busy,
                                          }
                                        : undefined,
                                    canUpdate: canEditEnrollment(row.status) && canUpdate,
                                    canDelete,
                                  }),
                                ]}
                              />
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="bg-surface-container-low/40">
                              <td className="px-lg py-md" colSpan={7}>
                                <div className="flex flex-col gap-sm max-w-3xl">
                                  <p className="font-body-sm text-on-surface-variant">
                                    {row.observations || "Aucune observation."}
                                  </p>
                                  <div className="flex flex-wrap gap-sm items-center">
                                    {(row.documents ?? []).map((doc) => (
                                      <a
                                        key={doc.id}
                                        className="px-sm py-xs rounded-lg bg-surface-container-high text-[12px] underline"
                                        href={doc.url}
                                        rel="noreferrer"
                                        target="_blank"
                                      >
                                        {doc.file_name}
                                      </a>
                                    ))}
                                    {canUpdate && (
                                      <button
                                        className="inline-flex items-center gap-xs h-8 px-md rounded-lg bg-surface-container-high text-[12px] font-label-caps text-label-caps disabled:opacity-40"
                                        disabled={busy}
                                        onClick={() => {
                                          uploadTargetRef.current = row.id;
                                          fileRef.current?.click();
                                        }}
                                        type="button"
                                      >
                                        <span
                                          aria-hidden
                                          className="material-symbols-outlined text-[16px]"
                                        >
                                          attach_file
                                        </span>
                                        Joindre un document
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && filtered.length > 0 && (
              <DataTablePagination
                canNextPage={enrollmentTable.canNextPage}
                canPreviousPage={enrollmentTable.canPreviousPage}
                entityLabel="demandes"
                filteredHint={
                  filtered.length !== rows.length ? `filtre sur ${rows.length}` : undefined
                }
                from={enrollmentTable.from}
                onFirstPage={() => enrollmentTable.setPageIndex(0)}
                onLastPage={() => enrollmentTable.setPageIndex(enrollmentTable.pageCount - 1)}
                onNextPage={() => enrollmentTable.setPageIndex(enrollmentTable.pageIndex + 1)}
                onPageChange={enrollmentTable.setPageIndex}
                onPageSizeChange={enrollmentTable.setPageSize}
                onPreviousPage={() => enrollmentTable.setPageIndex(enrollmentTable.pageIndex - 1)}
                pageCount={enrollmentTable.pageCount}
                pageIndex={enrollmentTable.pageIndex}
                pageSize={enrollmentTable.pageSize}
                testId="enrollment-pagination"
                to={enrollmentTable.to}
                total={filtered.length}
              />
            )}
          </>
        )}

        {mainTab === "re-enrollments" && (
          <>
            <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15">
              <p className="font-body-sm text-on-surface-variant">
                Demandes de réinscription pour l&apos;année en cours.
              </p>
              <div className="ml-auto shrink-0 flex items-center gap-sm">
                <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
                {canCreate && (
                  <CrudCreateLink
                    className="inline-flex items-center gap-sm h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm"
                    label={createLabel}
                    resource={createResource}
                  />
                )}
              </div>
            </div>

            <div className="overflow-auto min-h-[320px]" data-testid="re-enrollments-table">
              {loading ? (
                <DataTableSkeleton
                  label="Chargement des réinscriptions…"
                  labels={["", "Élève", "Année", "Classe préc.", "Nouvelle classe", "Statut", ""]}
                  rows={8}
                  testId="re-enrollment-loading"
                />
              ) : reEnrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-lg py-2xl text-center">
                  <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                    replay
                  </span>
                  <h3 className="font-title-md text-on-surface mb-xs">Aucune réinscription</h3>
                  <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                    Aucune demande de réinscription n&apos;est enregistrée pour le moment.
                  </p>
                  {canCreate && (
                    <CrudCreateLink label={createLabel} resource={createResource} />
                  )}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr>
                      <DataTableSelectHeader
                        checked={reEnrollmentsTable.allPageSelected}
                        indeterminate={
                          reEnrollmentsTable.somePageSelected &&
                          !reEnrollmentsTable.allPageSelected
                        }
                        onChange={reEnrollmentsTable.toggleAllPage}
                      />
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Élève</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Année</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Classe préc.</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">
                        Nouvelle classe
                      </th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Statut</th>
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right sticky right-0 bg-surface-container-low/95 w-16">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-body-sm font-body-sm divide-y divide-outline-variant/10">
                    {reEnrollmentsTable.pageRows.map((row, index) => {
                      const zebra = index % 2 === 1;
                      const studentLabel = row.student
                        ? studentFullName(row.student)
                        : `#${row.student_id}`;
                      return (
                        <tr className={`group ${tableRowClass(index)}`} key={row.id}>
                          <DataTableSelectCell
                            checked={reEnrollmentsTable.selectedIds.has(row.id)}
                            label={studentLabel}
                            onChange={() => reEnrollmentsTable.toggleOne(row.id)}
                          />
                          <td className="px-lg py-sm align-middle font-semibold">
                            {studentLabel}
                          </td>
                          <td className="px-lg py-sm align-middle">
                            {row.academic_year && "name" in row.academic_year
                              ? row.academic_year.name
                              : `#${row.academic_year_id}`}
                          </td>
                          <td className="px-lg py-sm align-middle">
                            {row.previous_class_group && "name" in row.previous_class_group
                              ? row.previous_class_group.name
                              : row.previous_class_group_id ?? "—"}
                          </td>
                          <td className="px-lg py-sm align-middle">
                            {row.new_class_group && "name" in row.new_class_group
                              ? row.new_class_group.name
                              : row.new_class_group_id ?? "—"}
                          </td>
                          <td className="px-lg py-sm align-middle">
                            <StatusBadge
                              label={
                                RE_ENROLLMENT_STATUS_LABELS[row.status] ?? String(row.status)
                              }
                              tone={
                                String(row.status).toLowerCase() === "completed"
                                  ? "success"
                                  : "warning"
                              }
                              withDot
                            />
                          </td>
                          <td
                            className={`px-lg py-sm align-middle sticky right-0 text-right overflow-visible group-hover:bg-surface-container-low/70 ${
                              zebra
                                ? "bg-surface-container-low/45"
                                : "bg-surface-container-lowest"
                            }`}
                          >
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${studentLabel}`}
                              items={[
                                ...(canUpdate && canCompleteReEnrollment(row)
                                  ? [
                                      {
                                        kind: "button" as const,
                                        label: "Terminer",
                                        icon: "check_circle",
                                        onClick: () => void handleCompleteReEnrollment(row),
                                        disabled: busy,
                                      },
                                    ]
                                  : []),
                                ...crudRowActions({
                                  edit: { resource: "re-enrollments", recordId: row.id },
                                  canUpdate,
                                  canDelete: false,
                                }),
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {!loading && reEnrollments.length > 0 && (
              <DataTablePagination
                canNextPage={reEnrollmentsTable.canNextPage}
                canPreviousPage={reEnrollmentsTable.canPreviousPage}
                entityLabel="réinscriptions"
                from={reEnrollmentsTable.from}
                onFirstPage={() => reEnrollmentsTable.setPageIndex(0)}
                onLastPage={() =>
                  reEnrollmentsTable.setPageIndex(reEnrollmentsTable.pageCount - 1)
                }
                onNextPage={() =>
                  reEnrollmentsTable.setPageIndex(reEnrollmentsTable.pageIndex + 1)
                }
                onPageChange={reEnrollmentsTable.setPageIndex}
                onPageSizeChange={reEnrollmentsTable.setPageSize}
                onPreviousPage={() =>
                  reEnrollmentsTable.setPageIndex(reEnrollmentsTable.pageIndex - 1)
                }
                pageCount={reEnrollmentsTable.pageCount}
                pageIndex={reEnrollmentsTable.pageIndex}
                pageSize={reEnrollmentsTable.pageSize}
                testId="re-enrollments-pagination"
                to={reEnrollmentsTable.to}
                total={reEnrollments.length}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
