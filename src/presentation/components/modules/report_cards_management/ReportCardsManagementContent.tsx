"use client";

import { useEffect, useMemo, useState } from "react";
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
import { DataTableSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableShell,
  DataTableToolbar,
} from "@/presentation/components/shared/DataTable";

import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import {
  listAcademicPeriods,
  listAcademicYears,
  listClassGroups,
} from "@/infrastructure/api/resources/academic";
import {
  createReportCard,
  deleteReportCard,
  downloadReportCardPdf,
  generateReportCard,
  listReportCards,
  publishReportCard,
} from "@/infrastructure/api/resources/report-cards";
import { listStudents } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  classGroupsForActiveYear,
  type AcademicPeriod,
  type ClassGroup,
} from "@/shared/types/academic.types";
import {
  REPORT_CARD_STATUS_LABELS,
  canDownloadReportCard,
  canGenerateReportCard,
  canPublishReportCard,
  filterReportCards,
  type ReportCard,
  type ReportCardStatus,
} from "@/shared/types/report-cards.types";
import { studentFullName, type Student } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

const REPORT_CARDS_FETCH_LIMIT = 1000;

function statusTone(status: ReportCardStatus): "neutral" | "info" | "success" | "warning" {
  if (status === "published") return "success";
  if (status === "generated") return "info";
  return "warning";
}

export function ReportCardsManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [cards, setCards] = useState<ReportCard[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [status, setStatus] = useState("");

  const canCreate = can(user, "reports.create");
  const canUpdate = can(user, "reports.update");
  const canDelete = can(user, "reports.delete");
  const canDownload = can(user, "reports.view") || can(user, "reports.export");

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const [classList, periodList, studentList, yearList] = await Promise.all([
          listClassGroups(),
          listAcademicPeriods(),
          listStudents(),
          listAcademicYears(),
        ]);
        if (cancelled) return;
        setClasses(classGroupsForActiveYear(classList, yearList));
        setPeriods(periodList);
        setStudents(studentList);
        if (periodList[0]) setPeriodId(String(periodList[0].id));
        else setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(getAuthErrorMessage(err));
          setLoading(false);
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadCards(classGroupId = classId, academicPeriodId = periodId) {
    setLoading(true);
    setError(null);
    try {
      const result = await listReportCards({
        ...(classGroupId ? { class_group_id: classGroupId } : {}),
        ...(academicPeriodId ? { academic_period_id: academicPeriodId } : {}),
        // Un bulletin par élève par période : filtrer par classe/période
        // borne déjà le résultat à une taille humaine (un effectif de
        // classe), donc un per_page généreux couvre le cas réel sans
        // re-paginer l'UI — les actions groupées (créer les manquants,
        // générer/publier tout) ont besoin de l'ensemble correspondant aux
        // filtres, pas d'une page arbitraire.
        per_page: REPORT_CARDS_FETCH_LIMIT,
      });
      setCards(result.data);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCards(classId, periodId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- classId/periodId drive the API filters
  }, [classId, periodId]);

  const filtered = useMemo(
    () => filterReportCards(cards, { search, status, classGroupId: classId, periodId }),
    [cards, search, status, classId, periodId]
  );

  const reportCardsTable = useClientDataTable(filtered, [search, status, classId, periodId]);

  function patchCard(updated: ReportCard) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  async function handleGenerate(card: ReportCard) {
    if (!canCreate || !canGenerateReportCard(card.status)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await generateReportCard(card.id);
      patchCard(updated);
      setNotice(`PDF généré pour ${card.student ? studentFullName(card.student) : "l'élève"}.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(card: ReportCard) {
    if (!canUpdate || !canPublishReportCard(card.status)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await publishReportCard(card.id);
      patchCard(updated);
      setNotice("Bulletin publié sur le portail.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(card: ReportCard) {
    if (!canDownload || !canDownloadReportCard(card)) return;
    setBusy(true);
    setError(null);
    try {
      await downloadReportCardPdf(card.id);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(card: ReportCard) {
    if (!canDelete || card.status === "published") return;
    if (!await confirmDialog("Supprimer ce bulletin ?")) return;
    setBusy(true);
    try {
      await deleteReportCard(card.id);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function createMissingForClass() {
    if (!canCreate || !classId || !periodId) {
      setError("Sélectionnez une classe et une période.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const roster = students.filter((s) => String(s.class_group_id ?? "") === classId);
      const existing = new Set(
        cards
          .filter((c) => String(c.academic_period_id) === periodId)
          .map((c) => c.student_id)
      );
      const missing = roster.filter((s) => !existing.has(s.id));
      const created = await Promise.all(
        missing.map((s) =>
          createReportCard({
            student_id: s.id,
            academic_period_id: Number(periodId),
          })
        )
      );
      setCards((prev) => [...created, ...prev]);
      setNotice(`${created.length} bulletin(s) brouillon créé(s).`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function generateAllDrafts() {
    if (!canCreate) return;
    const drafts = filtered.filter((c) => canGenerateReportCard(c.status));
    if (drafts.length === 0) {
      setNotice("Aucun brouillon à générer dans la sélection.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updatedList: ReportCard[] = [];
      for (const card of drafts) {
        updatedList.push(await generateReportCard(card.id));
      }
      setCards((prev) =>
        prev.map((c) => updatedList.find((u) => u.id === c.id) ?? c)
      );
      setNotice(`${updatedList.length} PDF généré(s).`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function publishAllGenerated() {
    if (!canUpdate) return;
    const ready = filtered.filter((c) => canPublishReportCard(c.status));
    if (ready.length === 0) {
      setNotice("Aucun bulletin généré à publier dans la sélection.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updatedList: ReportCard[] = [];
      for (const card of ready) {
        updatedList.push(await publishReportCard(card.id));
      }
      setCards((prev) =>
        prev.map((c) => updatedList.find((u) => u.id === c.id) ?? c)
      );
      setNotice(`${updatedList.length} bulletin(s) publié(s).`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
<DataTableShell testId="report-cards-table">
        <DataTableToolbar className="justify-end">
          <DataTableRefreshButton
            loading={loading}
            onRefresh={() => {
              if (periodId) void loadCards();
            }}
          />
        </DataTableToolbar>
        <div className="overflow-x-auto min-h-[320px]">
        {loading ? (
          <DataTableSkeleton label="Chargement des bulletins…" testId="report-cards-loading" />
        ) : filtered.length === 0 ? (
          <p className="p-lg font-body-sm text-on-surface-variant" data-testid="report-cards-empty">
            Aucun bulletin. Créez-en un ou utilisez « Créer pour la classe ».
          </p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low/80 sticky top-0 z-10">
              <tr className="ui-table-head-row">
                <DataTableSelectHeader
                  checked={reportCardsTable.allPageSelected}
                  indeterminate={
                    reportCardsTable.somePageSelected && !reportCardsTable.allPageSelected
                  }
                  onChange={reportCardsTable.toggleAllPage}
                />
                <th className="py-sm px-md">Élève</th>
                <th className="py-sm px-md">Période</th>
                <th className="py-sm px-md">Statut</th>
                <th className="py-sm px-md">PDF</th>
                <th className="py-sm px-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm">
              {reportCardsTable.pageRows.map((card, index) => (
                <tr className={tableRowClass(index)} key={card.id}>
                  <DataTableSelectCell
                    checked={reportCardsTable.selectedIds.has(card.id)}
                    label={card.student ? studentFullName(card.student) : `Élève #${card.student_id}`}
                    onChange={() => reportCardsTable.toggleOne(card.id)}
                  />
                  <td className="py-sm px-md">
                    <div className="font-title-sm">
                      {card.student ? studentFullName(card.student) : `Élève #${card.student_id}`}
                    </div>
                    <div className="text-on-surface-variant text-[12px] font-mono-data">
                      {card.student?.matricule ?? "—"}
                    </div>
                  </td>
                  <td className="py-sm px-md">{card.academic_period?.name ?? "—"}</td>
                  <td className="py-sm px-md">
                    <StatusBadge
                      label={REPORT_CARD_STATUS_LABELS[card.status]}
                      tone={statusTone(card.status)}
                    />
                  </td>
                  <td className="py-sm px-md text-on-surface-variant">
                    {card.bulletin?.file_name ?? "—"}
                  </td>
                  <td className="py-sm px-md text-right">
                    <DataTableActionsMenu
                      ariaLabel={`Actions pour ${studentFullName(card.student ?? { first_name: "", last_name: `#${card.student_id}` })}`}
                      items={[
                        ...(canGenerateReportCard(card.status) && canCreate
                          ? [
                              {
                                kind: "button" as const,
                                label: "Générer",
                                icon: "auto_awesome",
                                onClick: () => void handleGenerate(card),
                                disabled: busy,
                              },
                            ]
                          : []),
                        ...(canPublishReportCard(card.status) && canUpdate
                          ? [
                              {
                                kind: "button" as const,
                                label: "Publier",
                                icon: "publish",
                                onClick: () => void handlePublish(card),
                                disabled: busy,
                              },
                            ]
                          : []),
                        ...(canDownloadReportCard(card) && canDownload
                          ? [
                              {
                                kind: "button" as const,
                                label: "PDF",
                                icon: "picture_as_pdf",
                                onClick: () => void handleDownload(card),
                                disabled: busy,
                              },
                            ]
                          : []),
                        ...crudRowActions({
                          edit:
                            card.status !== "published"
                              ? { resource: "report-cards", recordId: card.id }
                              : undefined,
                          delete:
                            card.status !== "published"
                              ? {
                                  onClick: () => void handleDelete(card),
                                  disabled: busy,
                                }
                              : undefined,
                          canUpdate: canUpdate && card.status !== "published",
                          canDelete: canDelete && card.status !== "published",
                        }),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
        {!loading && filtered.length > 0 && (
          <DataTablePagination
            canNextPage={reportCardsTable.canNextPage}
            canPreviousPage={reportCardsTable.canPreviousPage}
            entityLabel="bulletins"
            from={reportCardsTable.from}
            onFirstPage={() => reportCardsTable.setPageIndex(0)}
            onLastPage={() => reportCardsTable.setPageIndex(reportCardsTable.pageCount - 1)}
            onNextPage={() => reportCardsTable.setPageIndex(reportCardsTable.pageIndex + 1)}
            onPageChange={reportCardsTable.setPageIndex}
            onPageSizeChange={reportCardsTable.setPageSize}
            onPreviousPage={() => reportCardsTable.setPageIndex(reportCardsTable.pageIndex - 1)}
            pageCount={reportCardsTable.pageCount}
            pageIndex={reportCardsTable.pageIndex}
            pageSize={reportCardsTable.pageSize}
            testId="report-cards-pagination"
            to={reportCardsTable.to}
            total={filtered.length}
          />
        )}
      </DataTableShell>
    </div>
  );
}
