"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  advanceHrApplication,
  deleteHrJobPosting,
  listHrApplications,
  listHrJobPostings,
  rejectHrApplication,
} from "@/infrastructure/api/resources/hr";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  HR_APPLICATION_PIPELINE,
  HR_APPLICATION_STATUS_LABELS,
  HR_JOB_STATUS_LABELS,
  canAdvanceHrApplication,
  canRejectHrApplication,
  groupApplicationsByStatus,
  hrApplicantName,
  type HrApplication,
  type HrApplicationStatus,
  type HrJobPosting,
  type HrJobPostingStatus,
} from "@/shared/types/hr.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type Tab = "postings" | "applications";

const COLUMN_ACCENT: Record<HrApplicationStatus, string> = {
  applied: "bg-secondary",
  screening: "bg-tertiary",
  interview: "bg-primary",
  offer: "bg-inverse-primary",
  hired: "bg-[#10b981]",
  rejected: "bg-error",
};

const BOARD_COLUMNS: HrApplicationStatus[] = [
  ...HR_APPLICATION_PIPELINE,
  "rejected",
];

function jobStatusTone(
  status: HrJobPostingStatus
): "success" | "warning" | "neutral" | "info" {
  if (status === "ouvert") return "success";
  if (status === "cloture") return "neutral";
  return "info";
}

function formatAppliedDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = value.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function initials(row: HrApplication): string {
  return `${(row.first_name?.[0] ?? "?").toUpperCase()}${(row.last_name?.[0] ?? "").toUpperCase()}`;
}

export function RecruitmentContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("postings");
  const [postings, setPostings] = useState<HrJobPosting[]>([]);
  const [applications, setApplications] = useState<HrApplication[]>([]);
  const [postingFilter, setPostingFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canView = can(user, "hr.view");
  const canCreate = can(user, "hr.create");
  const canUpdate = can(user, "hr.update");
  const canDelete = can(user, "hr.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [jobs, apps] = await Promise.all([
        listHrJobPostings(),
        listHrApplications(),
      ]);
      setPostings(jobs);
      setApplications(apps);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canView) void reload();
    else setLoading(false);
  }, [canView]);

  const filteredPostings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return postings;
    return postings.filter((p) => {
      const hay = `${p.title} ${p.department?.name ?? ""} ${p.description}`.toLowerCase();
      return hay.includes(q);
    });
  }, [postings, search]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (postingFilter && String(a.hr_job_posting_id) !== postingFilter) return false;
      if (!q) return true;
      const name = hrApplicantName(a).toLowerCase();
      const job = (
        a.job_posting?.title ??
        a.applied_position ??
        ""
      ).toLowerCase();
      const email = (a.email ?? "").toLowerCase();
      return name.includes(q) || job.includes(q) || email.includes(q);
    });
  }, [applications, search, postingFilter]);

  const postingsTable = useClientDataTable(filteredPostings, [search, tab]);

  const grouped = useMemo(
    () => groupApplicationsByStatus(filteredApplications),
    [filteredApplications]
  );

  function patchApplication(updated: HrApplication) {
    setApplications((prev) =>
      prev.map((row) => (row.id === updated.id ? updated : row))
    );
  }

  async function handleAdvance(row: HrApplication) {
    if (!canUpdate || !canAdvanceHrApplication(row.status)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await advanceHrApplication(row.id);
      patchApplication(updated);
      setNotice(
        `${hrApplicantName(updated)} → ${HR_APPLICATION_STATUS_LABELS[updated.status]}`
      );
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(row: HrApplication) {
    if (!canUpdate || !canRejectHrApplication(row.status)) return;
    if (
      !(await confirmDialog(`Rejeter la candidature de ${hrApplicantName(row)} ?`, {
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await rejectHrApplication(row.id);
      patchApplication(updated);
      setNotice(`${hrApplicantName(updated)} rejetée.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePosting(row: HrJobPosting) {
    if (!canDelete) return;
    if (
      !(await confirmDialog(`Supprimer l'offre « ${row.title} » ?`, {
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await deleteHrJobPosting(row.id);
      setPostings((prev) => prev.filter((p) => p.id !== row.id));
      if (postingFilter === String(row.id)) setPostingFilter("");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!canView) {
    return (
      <p className="p-xl font-body-md text-on-surface-variant">
        Accès réservé (`hr.view`).
      </p>
    );
  }

  const searchPlaceholder =
    tab === "postings" ? "Titre, département…" : "Candidat, offre, e-mail…";
  const searchLabel =
    tab === "postings" ? "Rechercher offres" : "Rechercher candidatures";
  const createLabel =
    tab === "postings" ? "Nouvelle offre" : "Nouvelle candidature";
  const createResource = tab === "postings" ? "recruitment" : "hr-applications";

  return (
    <div
      className={`flex flex-col w-full gap-lg pb-xl mx-auto ${
        tab === "applications" ? "h-[calc(100vh-7.5rem)] max-w-[1600px] pb-md gap-md" : "max-w-7xl"
      }`}
      data-testid="recruitment-panel"
    >
      {error && (
        <div
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm shrink-0"
          data-testid="recruitment-error"
          role="alert"
        >
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm shrink-0">
          {notice}
        </div>
      )}

      <div
        className={`ui-table-shell flex flex-col ${
          tab === "applications" ? "flex-1 min-h-0 overflow-hidden" : ""
        }`}
      >
        <ContentTabs
          items={[
            { id: "postings", label: "Offres", count: postings.length },
            {
              id: "applications",
              label: "Candidatures",
              count: applications.length,
            },
          ]}
          onChange={(id) => {
            setTab(id);
            setSearch("");
            setPostingFilter("");
          }}
          testId="recruitment-tabs"
          value={tab}
        />

        <div className="px-lg pt-lg pb-md flex flex-wrap items-center gap-sm border-b border-outline-variant/15 shrink-0">
          <div className="ui-search-field flex-1 min-w-[200px] h-10 py-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
              search
            </span>
            <input
              aria-label={searchLabel}
              className="ui-search-input ml-sm h-full"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              type="text"
              value={search}
            />
          </div>
          {tab === "applications" && (
            <select
              aria-label="Filtrer par offre"
              className="ui-input cursor-pointer h-10 py-0 min-w-[200px]"
              data-testid="posting-filter"
              onChange={(e) => setPostingFilter(e.target.value)}
              value={postingFilter}
            >
              <option value="">Toutes les offres</option>
              {postings.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
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

        {tab === "postings" && (
          <>
            <div className="overflow-x-auto min-h-[320px]" data-testid="job-postings-list">
              {loading ? (
                <ContentSkeleton testId="recruitment-loading" variant="table" />
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                    <tr className="ui-table-head-row">
                      <DataTableSelectHeader
                        checked={postingsTable.allPageSelected}
                        indeterminate={
                          postingsTable.somePageSelected &&
                          !postingsTable.allPageSelected
                        }
                        onChange={postingsTable.toggleAllPage}
                      />
                      <th className="py-sm px-md">Titre</th>
                      <th className="py-sm px-md">Département</th>
                      <th className="py-sm px-md">Échéance</th>
                      <th className="py-sm px-md">Candidatures</th>
                      <th className="py-sm px-md">Statut</th>
                      <th className="py-sm px-md text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm">
                    {filteredPostings.length === 0 ? (
                      <tr>
                        <td className="py-xl px-lg text-on-surface-variant" colSpan={7}>
                          Aucune offre.
                        </td>
                      </tr>
                    ) : (
                      postingsTable.pageRows.map((row, index) => (
                        <tr className={tableRowClass(index)} key={row.id}>
                          <DataTableSelectCell
                            checked={postingsTable.selectedIds.has(row.id)}
                            label={row.title}
                            onChange={() => postingsTable.toggleOne(row.id)}
                          />
                          <td className="py-sm px-md font-semibold">{row.title}</td>
                          <td className="py-sm px-md">
                            {row.department?.name ?? "—"}
                          </td>
                          <td className="py-sm px-md">
                            {formatAppliedDate(row.application_deadline) || "—"}
                          </td>
                          <td className="py-sm px-md tabular-nums">
                            {row.applications_count ?? 0}
                          </td>
                          <td className="py-sm px-md">
                            <StatusBadge
                              label={HR_JOB_STATUS_LABELS[row.status]}
                              tone={jobStatusTone(row.status)}
                              withDot
                            />
                          </td>
                          <td className="py-sm px-md text-right">
                            <DataTableActionsMenu
                              ariaLabel={`Actions pour ${row.title}`}
                              items={crudRowActions({
                                edit: {
                                  resource: "recruitment",
                                  recordId: row.id,
                                },
                                delete: {
                                  onClick: () => void handleDeletePosting(row),
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
              )}
            </div>

            {!loading && filteredPostings.length > 0 && (
              <DataTablePagination
                canNextPage={postingsTable.canNextPage}
                canPreviousPage={postingsTable.canPreviousPage}
                entityLabel="offres"
                from={postingsTable.from}
                onFirstPage={() => postingsTable.setPageIndex(0)}
                onLastPage={() =>
                  postingsTable.setPageIndex(postingsTable.pageCount - 1)
                }
                onNextPage={() =>
                  postingsTable.setPageIndex(postingsTable.pageIndex + 1)
                }
                onPageChange={postingsTable.setPageIndex}
                onPageSizeChange={postingsTable.setPageSize}
                onPreviousPage={() =>
                  postingsTable.setPageIndex(postingsTable.pageIndex - 1)
                }
                pageCount={postingsTable.pageCount}
                pageIndex={postingsTable.pageIndex}
                pageSize={postingsTable.pageSize}
                testId="postings-pagination"
                to={postingsTable.to}
                total={filteredPostings.length}
              />
            )}
          </>
        )}

        {tab === "applications" && (
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden p-md bg-surface-container-low/30">
            {loading ? (
              <ContentSkeleton testId="recruitment-loading" variant="cards" />
            ) : (
              <div
                className="flex gap-md h-full min-w-max"
                data-testid="recruitment-board"
              >
                {BOARD_COLUMNS.map((status) => {
                  const cards = grouped[status];
                  return (
                    <section
                      key={status}
                      className="flex flex-col w-72 bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden flex-shrink-0 shadow-sm"
                      data-testid={`column-${status}`}
                    >
                      <header className="relative px-md py-sm flex items-center gap-sm border-b border-outline-variant/10 bg-surface-container-lowest">
                        <span
                          aria-hidden
                          className={`absolute left-0 top-0 bottom-0 w-1 ${COLUMN_ACCENT[status]}`}
                        />
                        <h2 className="font-title-sm text-[13px] text-on-surface pl-sm">
                          {HR_APPLICATION_STATUS_LABELS[status]}
                        </h2>
                        <span className="ml-auto inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-md bg-surface-container-high text-[11px] font-medium tabular-nums text-on-surface-variant">
                          {cards.length}
                        </span>
                      </header>
                      <div className="flex-1 overflow-y-auto p-sm space-y-sm">
                        {cards.length === 0 ? (
                          <p className="font-body-sm text-on-surface-variant/70 text-center py-xl px-sm">
                            Aucune candidature
                          </p>
                        ) : (
                          cards.map((row) => {
                            const jobLabel =
                              row.job_posting?.title ??
                              row.applied_position ??
                              `Offre #${row.hr_job_posting_id}`;
                            const dateLabel = formatAppliedDate(row.applied_at);
                            return (
                              <article
                                key={row.id}
                                className="group bg-surface rounded-lg p-sm border border-outline-variant/10 hover:border-outline-variant/30 hover:shadow-sm transition-all"
                                data-testid={`application-card-${row.id}`}
                              >
                                <div className="flex items-start gap-sm">
                                  <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center text-[11px] font-semibold tracking-wide shrink-0">
                                    {initials(row)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-xs">
                                      <h3 className="font-semibold text-[13px] text-on-surface truncate leading-tight flex-1">
                                        {hrApplicantName(row)}
                                      </h3>
                                      <DataTableActionsMenu
                                        ariaLabel={`Actions pour ${hrApplicantName(row)}`}
                                        items={[
                                          ...(canUpdate &&
                                          canAdvanceHrApplication(row.status)
                                            ? [
                                                {
                                                  kind: "button" as const,
                                                  label: "Avancer",
                                                  icon: "arrow_forward",
                                                  onClick: () =>
                                                    void handleAdvance(row),
                                                  disabled: busy,
                                                },
                                              ]
                                            : []),
                                          ...(canUpdate &&
                                          canRejectHrApplication(row.status)
                                            ? [
                                                {
                                                  kind: "button" as const,
                                                  label: "Rejeter",
                                                  icon: "cancel",
                                                  onClick: () =>
                                                    void handleReject(row),
                                                  disabled: busy,
                                                  destructive: true,
                                                },
                                              ]
                                            : []),
                                          ...crudRowActions({
                                            edit: {
                                              resource: "hr-applications",
                                              recordId: row.id,
                                            },
                                            canUpdate,
                                            canDelete: false,
                                          }),
                                        ]}
                                      />
                                    </div>
                                    <p className="text-[12px] text-on-surface-variant truncate mt-0.5">
                                      {jobLabel}
                                    </p>
                                    {dateLabel && (
                                      <p className="inline-flex items-center gap-xs text-[11px] text-on-surface-variant/80 mt-1.5">
                                        <span
                                          aria-hidden
                                          className="material-symbols-outlined text-[14px]"
                                        >
                                          calendar_today
                                        </span>
                                        {dateLabel}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </article>
                            );
                          })
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
