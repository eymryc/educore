"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
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
import {
  DataTableShell,
  DataTableToolbar,
  DataTableSearch,
  DataTableFilterSelect,
  DATA_TABLE_CREATE_CLASS,
} from "@/presentation/components/shared/DataTable";

import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import { Select } from "@/presentation/components/shared/Select";
import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  DEFAULT_TABLE_PAGE_SIZE,
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
  updateEnrollment,
  uploadEnrollmentDocument,
} from "@/infrastructure/api/resources/enrollments";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { emptyPaginationMeta } from "@/shared/types/api.types";
import type { AcademicYear, ClassGroup, NamedRef } from "@/shared/types/academic.types";
import {
  ENROLLMENT_DOCUMENT_LABELS,
  ENROLLMENT_ORIGIN_LABELS,
  ENROLLMENT_PIPELINE,
  ENROLLMENT_STATUS_LABELS,
  RE_ENROLLMENT_STATUS_LABELS,
  YEAR_END_DECISION_LABELS,
  canCompleteReEnrollment,
  canEditEnrollment,
  enrollmentFullName,
  nextEnrollmentActions,
  suggestedEnrollmentDocuments,
  type Enrollment,
  type EnrollmentAction,
  type EnrollmentDocumentKind,
  type EnrollmentListMeta,
  type EnrollmentStatus,
  type ReEnrollment,
} from "@/shared/types/enrollment.types";
import { studentFullName } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

const ACTION_LABELS: Record<EnrollmentAction, string> = {
  review: "Examiner le dossier",
  approve: "Valider / actualiser",
  payment: "Enregistrer le paiement",
  enroll: "Inscrire l'élève",
  "assign-class": "Affecter en classe",
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
  const [meta, setMeta] = useState<EnrollmentListMeta>(emptyPaginationMeta());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
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
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [assignClassId, setAssignClassId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number | null>(null);

  const canCreate = can(user, "students.create");
  const canUpdate = can(user, "students.update");
  const canDelete = can(user, "students.delete");

  async function reloadCatalogs() {
    const [reList, yearList, levelList, classList] = await Promise.all([
      listReEnrollments(),
      listAcademicYears(),
      listLevels(),
      listClassGroups(),
    ]);
    const activeYear = yearList.find((y) => y.is_active) ?? yearList[0];
    const scopedYearId = yearId ? Number(yearId) : activeYear?.id;
    setReEnrollments(reList);
    setYears(yearList);
    setLevels(levelList);
    setClasses(
      scopedYearId ? classList.filter((c) => c.academic_year_id === scopedYearId) : classList
    );
  }

  async function reloadEnrollments() {
    const result = await listEnrollments({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(yearId ? { academic_year_id: yearId } : {}),
      ...(levelId ? { level_id: levelId } : {}),
      page,
      per_page: perPage,
    });
    setRows(result.data);
    setMeta(result.meta);
  }

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([reloadCatalogs(), reloadEnrollments()]);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        await reloadCatalogs();
      } catch (err) {
        setError(getAuthErrorMessage(err));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await reloadEnrollments();
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search/filters/page/perPage drive API filters
  }, [search, status, yearId, levelId, page, perPage]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [search, status, yearId, levelId, page, perPage]);

  const allPageSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const somePageSelected = rows.some((row) => selectedIds.has(row.id));

  function toggleAllPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        rows.forEach((row) => next.delete(row.id));
      } else {
        rows.forEach((row) => next.add(row.id));
      }
      return next;
    });
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const reEnrollmentsTable = useClientDataTable(reEnrollments, [mainTab, reEnrollments.length]);

  const statusCounts = meta.status_counts ?? {};
  const pipelineTotal = ENROLLMENT_PIPELINE.reduce(
    (sum, step) => sum + (statusCounts[step] ?? 0),
    statusCounts.REJECTED ?? 0
  );

  const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const to = Math.min(meta.current_page * meta.per_page, meta.total);

  const hasFilters = Boolean(search || status || yearId || levelId);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setYearId("");
    setLevelId("");
    setPage(1);
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
          setExpandedId(row.id);
          setAssigningId(row.id);
          setAssignClassId(row.class_group_id ? String(row.class_group_id) : "");
          return;
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

  async function confirmAssignClass(row: Enrollment) {
    const classGroupId = Number(assignClassId);
    if (!Number.isFinite(classGroupId) || classGroupId <= 0) {
      setError("Choisissez une classe à affecter.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await assignEnrollmentClass(row.id, classGroupId);
      patch(updated);
      setAssigningId(null);
      setNotice(`Affecté en classe — ${ENROLLMENT_STATUS_LABELS[updated.status]}.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleProvidedDocument(row: Enrollment, kind: EnrollmentDocumentKind) {
    if (!canUpdate) return;
    const current = new Set(row.provided_documents ?? []);
    if (current.has(kind)) current.delete(kind);
    else current.add(kind);
    const next = [...current];
    setBusy(true);
    setError(null);
    try {
      const updated = await updateEnrollment(row.id, { provided_documents: next });
      patch(updated);
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
      if (rows.length <= 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        await reloadEnrollments();
      }
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

      <DataTableShell>
        <ContentTabs
          items={[
            { id: "enrollments", label: "Inscriptions", count: meta.total },
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
            <DataTableToolbar>
              <DataTableSearch
            ariaLabel={"Rechercher une candidature"}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder={"Rechercher par nom ou contact…"}
            value={search}
          />
              <DataTableFilterSelect
                ariaLabel="Filtrer par année"
                onChange={(v) => {
                  setYearId(v);
                  setPage(1);
                }}
                options={years.map((y) => ({ value: String(y.id), label: y.name }))}
                placeholder="Toutes les années"
                value={yearId}
              />
              <DataTableFilterSelect
                ariaLabel="Filtrer par niveau"
                onChange={(v) => {
                  setLevelId(v);
                  setPage(1);
                }}
                options={levels.map((l) => ({ value: String(l.id), label: l.name }))}
                placeholder="Tous les niveaux"
                value={levelId}
              />
              <DataTableFilterSelect
                ariaLabel="Filtrer par statut"
                onChange={(v) => {
                  setStatus(v);
                  setPage(1);
                }}
                options={[
                  ...ENROLLMENT_PIPELINE.map((step) => ({
                    value: step,
                    label: `${ENROLLMENT_STATUS_LABELS[step]} (${statusCounts[step] ?? 0})`,
                  })),
                  { value: "REJECTED", label: `Refusées (${statusCounts.REJECTED ?? 0})` },
                ]}
                placeholder={`Tous les statuts (${pipelineTotal})`}
                testId="enrollment-pipeline"
                value={status}
              />
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
              <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
                <span
                  className="hidden sm:inline text-[13px] text-on-surface-variant"
                  data-testid="enroll-kpi-total"
                >
                  {meta.total} demande(s)
                </span>
                <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
                {canCreate && (
                  <CrudCreateLink
                    className={DATA_TABLE_CREATE_CLASS}
                    label={createLabel}
                    resource={createResource}
                  />
                )}
              </div>
            </DataTableToolbar>

            <div className="overflow-auto min-h-[320px]" data-testid="enrollment-table">
              {loading ? (
                <DataTableSkeleton
                  label="Chargement des inscriptions…"
                  labels={["", "Candidat", "Niveau", "Date", "Statut", "Pièces", ""]}
                  rows={10}
                  testId="enrollment-loading"
                />
              ) : meta.total === 0 ? (
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
                        checked={allPageSelected}
                        indeterminate={somePageSelected && !allPageSelected}
                        onChange={toggleAllPage}
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
                    {rows.map((row, index) => {
                      const actions = nextEnrollmentActions(row.status);
                      const expanded = expandedId === row.id;
                      const zebra = index % 2 === 1;
                      return (
                        <Fragment key={row.id}>
                          <tr className={`group ${tableRowClass(index)}`}>
                            <DataTableSelectCell
                              checked={selectedIds.has(row.id)}
                              label={enrollmentFullName(row)}
                              onChange={() => toggleOne(row.id)}
                            />
                            <td className="px-lg py-sm align-middle">
                              <div className="font-semibold text-on-surface">
                                {enrollmentFullName(row)}
                              </div>
                              <div className="text-[12px] text-on-surface-variant">
                                {row.parent_contact}
                              </div>
                              <div className="text-[12px] text-on-surface-variant">
                                {ENROLLMENT_ORIGIN_LABELS[row.origin] ?? row.origin}
                                {row.previous_school ? ` · ${row.previous_school}` : ""}
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
                              {(() => {
                                const suggested = suggestedEnrollmentDocuments(row.origin).length;
                                const checked = (row.provided_documents ?? []).length;
                                const scanned = row.documents?.length ?? 0;
                                return (
                                  <span className="tabular-nums">
                                    {checked}/{suggested}
                                    {scanned > 0 ? ` · ${scanned} fichier${scanned > 1 ? "s" : ""}` : ""}
                                  </span>
                                );
                              })()}
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
                                <div className="flex flex-col gap-md max-w-4xl">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm text-[13px]">
                                    {row.national_matricule && (
                                      <p>
                                        <span className="text-on-surface-variant">Matricule DESPS : </span>
                                        <span className="font-mono-data">{row.national_matricule}</span>
                                      </p>
                                    )}
                                    {row.mena_receipt_number && (
                                      <p>
                                        <span className="text-on-surface-variant">Reçu MENA : </span>
                                        {row.mena_receipt_number}
                                      </p>
                                    )}
                                    {row.year_end_decision && (
                                      <p>
                                        <span className="text-on-surface-variant">Décision fin d&apos;année : </span>
                                        {YEAR_END_DECISION_LABELS[
                                          row.year_end_decision as keyof typeof YEAR_END_DECISION_LABELS
                                        ] ?? row.year_end_decision}
                                      </p>
                                    )}
                                    {row.parent_full_name && (
                                      <p>
                                        <span className="text-on-surface-variant">Parent / tuteur : </span>
                                        {row.parent_full_name}
                                      </p>
                                    )}
                                  </div>
                                  <p className="font-body-sm text-on-surface-variant">
                                    {row.observations || "Aucune observation."}
                                  </p>
                                  <div>
                                    <p className="ui-stat-label mb-sm">Pièces du dossier</p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
                                      {suggestedEnrollmentDocuments(row.origin).map((kind) => {
                                        const checked = (row.provided_documents ?? []).includes(kind);
                                        return (
                                          <li className="flex items-start gap-sm" key={kind}>
                                            <Checkbox
                                              ariaLabel={ENROLLMENT_DOCUMENT_LABELS[kind]}
                                              checked={checked}
                                              disabled={busy || !canUpdate}
                                              onChange={() => void toggleProvidedDocument(row, kind)}
                                            />
                                            <span className="text-[13px] leading-5">
                                              {ENROLLMENT_DOCUMENT_LABELS[kind]}
                                            </span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                  {assigningId === row.id && (
                                    <div
                                      className="flex flex-wrap items-end gap-sm p-md rounded-xl bg-white border border-outline-variant/20"
                                      data-testid="assign-class-panel"
                                    >
                                      <div className="min-w-[220px] flex-1">
                                        <p className="ui-stat-label mb-xs">Classe d&apos;affectation</p>
                                        <Select
                                          ariaLabel="Classe à affecter"
                                          onChange={setAssignClassId}
                                          options={classes
                                            .filter((c) => c.level_id === row.level_id || !row.level_id)
                                            .map((c) => ({ value: String(c.id), label: c.name }))}
                                          placeholder="Choisir une classe"
                                          value={assignClassId}
                                        />
                                      </div>
                                      <button
                                        className="ui-btn-primary h-10 px-md"
                                        disabled={busy || !assignClassId}
                                        onClick={() => void confirmAssignClass(row)}
                                        type="button"
                                      >
                                        Confirmer l&apos;affectation
                                      </button>
                                    </div>
                                  )}
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

            {!loading && meta.total > 0 && (
              <DataTablePagination
                canNextPage={meta.current_page < meta.last_page}
                canPreviousPage={meta.current_page > 1}
                entityLabel="demandes"
                from={from}
                onFirstPage={() => setPage(1)}
                onLastPage={() => setPage(meta.last_page)}
                onNextPage={() => setPage((p) => p + 1)}
                onPageChange={(index) => setPage(index + 1)}
                onPageSizeChange={(size) => {
                  setPerPage(size);
                  setPage(1);
                }}
                onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
                pageCount={meta.last_page}
                pageIndex={meta.current_page - 1}
                pageSize={perPage}
                testId="enrollment-pagination"
                to={to}
                total={meta.total}
              />
            )}
          </>
        )}

        {mainTab === "re-enrollments" && (
          <>
            <DataTableToolbar>
              <p className="font-body-sm text-on-surface-variant">
                Demandes de réinscription pour l&apos;année en cours.
              </p>
              <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
                <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
                {canCreate && (
                  <CrudCreateLink
                    className={DATA_TABLE_CREATE_CLASS}
                    label={createLabel}
                    resource={createResource}
                  />
                )}
              </div>
            </DataTableToolbar>

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
                      <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Type</th>
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
                              label={row.is_repeat ? "Redoublement" : "Passage"}
                              tone={row.is_repeat ? "warning" : "neutral"}
                            />
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
      </DataTableShell>
    </div>
  );
}
