"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, Fragment, type ReactNode } from "react";
import { ContentTabs } from "@/presentation/components/shared/ContentTabs";
import {
  DATA_TABLE_TD_CLASS,
  DATA_TABLE_TH_CLASS,
} from "@/presentation/components/shared/DataTable";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { DetailSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { tableRowClass } from "@/presentation/components/shared/data-table-utils";
import {
  getStudentFull,
  uploadStudentDocument,
  uploadStudentPhoto,
} from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { ATTENDANCE_STATUS_LABELS } from "@/shared/types/attendance.types";
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatMoneyFcfa,
  type InvoiceStatus,
  type PaymentStatus,
} from "@/shared/types/finance.types";
import { ASSESSMENT_TYPE_LABELS, toScoreNumber, type Grade } from "@/shared/types/grades.types";
import {
  REPORT_CARD_MENTION_LABELS,
  REPORT_CARD_STATUS_LABELS,
  type ReportCard,
  type ReportCardStatus,
} from "@/shared/types/report-cards.types";
import {
  STUDENT_STATUS_LABELS,
  studentFullName,
  type Student,
  type StudentAverages,
  type StudentFullDossier,
  type StudentPeriodAverage,
  type StudentStatus,
} from "@/shared/types/student.types";
import { GUARDIAN_RELATIONSHIP_LABELS, guardianFullName } from "@/shared/types/guardian.types";
import { SUBMISSION_STATUS_LABELS } from "@/shared/types/assignments.types";
import { LIBRARY_LOAN_STATUS_LABELS, type LibraryLoanStatus } from "@/shared/types/library.types";
import {
  CANTEEN_ACCOUNT_STATUS_LABELS,
  CANTEEN_DIET_TYPE_LABELS,
  CANTEEN_PAYMENT_LABELS,
  type CanteenAccountStatus,
} from "@/shared/types/canteen.types";
import {
  TRANSPORT_SUBSCRIPTION_STATUS_LABELS,
  type TransportSubscriptionStatus,
} from "@/shared/types/transport.types";
import { ENROLLMENT_ORIGIN_LABELS } from "@/shared/types/enrollment.types";

type DossierTab = "identite" | "scolarite" | "finances" | "vie-scolaire";

const CARD_CLASS =
  "rounded-xl border border-outline-variant/30 bg-white overflow-hidden shadow-[0_2px_4px_rgb(15_23_42/0.06),0_8px_24px_rgb(15_23_42/0.1),0_20px_48px_rgb(15_23_42/0.12)]";

function statusTone(status: StudentStatus): "success" | "error" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "suspended") return "warning";
  return "error";
}

function reportCardTone(status: ReportCardStatus): "success" | "info" | "neutral" {
  if (status === "published") return "success";
  if (status === "generated") return "info";
  return "neutral";
}

function invoiceTone(status: InvoiceStatus): "success" | "warning" | "error" | "info" | "neutral" {
  if (status === "PAID") return "success";
  if (status === "PARTIALLY_PAID" || status === "ISSUED") return "info";
  if (status === "OVERDUE") return "error";
  if (status === "CANCELLED") return "neutral";
  return "warning";
}

function submissionTone(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  if (status === "GRADED") return "success";
  if (status === "SUBMITTED") return "info";
  if (status === "LATE") return "warning";
  if (status === "MISSING") return "error";
  return "neutral";
}

function libraryLoanTone(status: LibraryLoanStatus): "success" | "warning" | "error" {
  if (status === "RETURNED") return "success";
  if (status === "OVERDUE") return "error";
  return "warning";
}

function canteenAccountTone(status: CanteenAccountStatus): "success" | "warning" {
  return status === "ACTIVE" ? "success" : "warning";
}

function transportSubscriptionTone(status: TransportSubscriptionStatus): "success" | "warning" | "neutral" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED") return "warning";
  return "neutral";
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function paymentTone(status: PaymentStatus): "success" | "warning" | "error" | "neutral" {
  if (status === "SUCCESS") return "success";
  if (status === "PROCESSING" || status === "PENDING") return "warning";
  if (status === "FAILED" || status === "CANCELLED") return "error";
  return "neutral";
}

function formatAverage(value: number | string | null | undefined): string {
  if (value == null || value === "") return "—";
  return toScoreNumber(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = value.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function ageFromBirth(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value.slice(0, 10));
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function scoreClass(score: number | string | null | undefined, max?: number | string | null): string {
  if (score == null || score === "") return "text-on-surface";
  const s = toScoreNumber(score);
  const m = max == null || max === "" ? 20 : toScoreNumber(max);
  if (m <= 0) return "text-on-surface";
  const ratio = s / m;
  if (ratio < 0.5) return "text-[#b42318]";
  if (ratio < 0.6) return "text-[#b54708]";
  return "text-[#027a48]";
}

function studentInitials(student: Pick<Student, "first_name" | "last_name">): string {
  const last = student.last_name.trim().charAt(0);
  const first = student.first_name.trim().charAt(0);
  return `${last}${first}`.toUpperCase() || "?";
}

function TabBar({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-sm flex-wrap px-md min-h-11 py-xs border-b border-outline-variant/15 bg-[#f7f9fb]">
      <h2 className="font-title-sm text-[14px] text-on-surface">{title}</h2>
      {action}
    </div>
  );
}

function FieldRow({
  label,
  value,
  testId,
}: {
  label: string;
  value: ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-md py-[7px] border-b border-outline-variant/10 last:border-b-0">
      <dt className="text-[12px] text-on-surface-variant shrink-0 w-[5.25rem] sm:w-[6.5rem]">{label}</dt>
      <dd className="text-[13px] text-on-surface text-right min-w-0 break-words" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="font-body-sm text-on-surface-variant px-md py-md">{children}</p>;
}

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="text-[12px] text-primary hover:underline shrink-0" href={href}>
      {children}
    </Link>
  );
}

function gradePeriodId(grade: Grade): number | null {
  return grade.assessment?.academic_period_id ?? grade.assessment?.academic_period?.id ?? null;
}

function gradeSubjectName(grade: Grade): string {
  const subject = grade.assessment?.subject;
  return subject && "name" in subject ? subject.name : "Matière";
}

function groupGradesByPeriod(
  grades: Grade[],
  periods: StudentPeriodAverage[]
): Array<{ key: string; label: string; periodId: number | null; grades: Grade[] }> {
  const buckets = new Map<number, Grade[]>();
  const unlabeled: Grade[] = [];

  for (const grade of grades) {
    const periodId = gradePeriodId(grade);
    if (periodId == null) {
      unlabeled.push(grade);
      continue;
    }
    const list = buckets.get(periodId) ?? [];
    list.push(grade);
    buckets.set(periodId, list);
  }

  const groups: Array<{ key: string; label: string; periodId: number | null; grades: Grade[] }> = [];

  for (const period of periods) {
    const list = buckets.get(period.period.id) ?? [];
    buckets.delete(period.period.id);
    if (list.length === 0) continue;
    groups.push({
      key: String(period.period.id),
      label: period.period.name,
      periodId: period.period.id,
      grades: list,
    });
  }

  for (const [periodId, list] of buckets) {
    groups.push({
      key: String(periodId),
      label: list[0]?.assessment?.academic_period?.name ?? `Période #${periodId}`,
      periodId,
      grades: list,
    });
  }

  if (unlabeled.length > 0) {
    groups.push({ key: "none", label: "Autres", periodId: null, grades: unlabeled });
  }

  return groups;
}

function reportCardYearLabel(card: ReportCard): string {
  return (
    card.academic_year?.name ||
    card.academic_period?.academic_year?.name ||
    (card.academic_year_id ? `Année #${card.academic_year_id}` : "Sans année")
  );
}

function isActiveYearReportCard(
  card: ReportCard,
  averages: StudentAverages | null,
  activePeriodIds: Set<number>
): boolean {
  if (!averages) return false;
  if (card.academic_year_id === averages.academic_year.id) return true;
  if (card.academic_period_id != null && activePeriodIds.has(card.academic_period_id)) return true;
  return false;
}

export function StudentDossierContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [dossier, setDossier] = useState<StudentFullDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"photo" | "document" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<DossierTab>("scolarite");
  const [scolaritePeriod, setScolaritePeriod] = useState("all");

  const canUpdate = can(user, "students.update");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setDossier(await getStudentFull(id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setDossier(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onPhotoChange(file: File | undefined) {
    if (!file || !canUpdate) return;
    setUploading("photo");
    setNotice(null);
    setError(null);
    try {
      await uploadStudentPhoto(id, file);
      setNotice("Photo mise à jour.");
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setUploading(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function onDocumentChange(file: File | undefined) {
    if (!file || !canUpdate) return;
    setUploading("document");
    setNotice(null);
    setError(null);
    try {
      const meta = await uploadStudentDocument(id, file);
      setNotice(`Document « ${meta.file_name} » ajouté.`);
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setUploading(null);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  }

  const attendanceTotal = useMemo(() => {
    if (!dossier) return 0;
    return Object.values(dossier.attendance_summary).reduce((sum, n) => sum + (n ?? 0), 0);
  }, [dossier]);

  const attendanceRate = useMemo(() => {
    if (!dossier || attendanceTotal === 0) return null;
    const present = dossier.attendance_summary.PRESENT ?? 0;
    return Math.round((present / attendanceTotal) * 1000) / 10;
  }, [dossier, attendanceTotal]);

  const financeSummary = useMemo(() => {
    if (!dossier) return null;
    return dossier.invoices.reduce(
      (acc, inv) => {
        acc.total += toScoreNumber(inv.total_amount);
        acc.paid += toScoreNumber(inv.amount_paid);
        acc.balance += toScoreNumber(inv.balance_due);
        return acc;
      },
      { total: 0, paid: 0, balance: 0 }
    );
  }, [dossier]);

  if (loading) {
    return <DetailSkeleton label="Chargement du dossier…" testId="dossier-loading" />;
  }

  if (error && !dossier) {
    return (
      <div className="space-y-md">
        <Link className="text-body-sm text-primary" href="/students">
          Retour aux élèves
        </Link>
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  const { student, averages } = dossier;
  const className = dossier.class?.name || student.class_group?.name || "—";
  const levelName = dossier.level?.name || student.level?.name || "—";
  const age = ageFromBirth(student.birth_date);
  const absentCount = dossier.attendance_summary.ABSENT ?? 0;
  const balance = financeSummary?.balance ?? 0;
  const scaleMax = averages ? formatAverage(averages.scale_max) : "20";

  const kpis = [
    { label: "Classe", value: className, hint: levelName, testId: "dossier-class", valueClass: "text-on-surface" },
    {
      label: "Moyenne",
      value:
        averages?.annual_average != null
          ? `${formatAverage(averages.annual_average)} / ${scaleMax}`
          : "—",
      hint: averages?.mention_label ?? "Annuelle",
      testId: "dossier-annual-average",
      valueClass: scoreClass(averages?.annual_average, averages?.scale_max),
    },
    {
      label: "Présence",
      value: attendanceRate == null ? "—" : `${attendanceRate}%`,
      hint: `${absentCount} absence(s)`,
      valueClass:
        attendanceRate == null ? "text-on-surface" : attendanceRate < 80 ? "text-[#b42318]" : "text-[#027a48]",
    },
    {
      label: "Solde",
      value: financeSummary ? formatMoneyFcfa(financeSummary.balance) : "—",
      hint: balance > 0 ? "Reste à régler" : "À jour",
      testId: "dossier-balance",
      valueClass: balance > 0 ? "text-[#b42318]" : "text-[#027a48]",
    },
  ];

  const activePeriodIds = new Set(averages?.by_period.map((p) => p.period.id) ?? []);
  const gradesForFilter =
    scolaritePeriod === "all"
      ? dossier.grades
      : dossier.grades.filter((g) => String(gradePeriodId(g)) === scolaritePeriod);
  const gradeGroups = groupGradesByPeriod(gradesForFilter, averages?.by_period ?? []);
  const activeReportCards = dossier.report_cards.filter((rc) =>
    isActiveYearReportCard(rc, averages, activePeriodIds)
  );
  const visibleReportCards =
    scolaritePeriod === "all"
      ? activeReportCards
      : activeReportCards.filter((rc) => String(rc.academic_period_id) === scolaritePeriod);
  const pastReportCards =
    scolaritePeriod === "all"
      ? dossier.report_cards.filter((rc) => !isActiveYearReportCard(rc, averages, activePeriodIds))
      : [];

  return (
    <div className="flex flex-col gap-lg w-full max-w-6xl mx-auto">
      <Link
        className="font-body-sm text-primary hover:underline inline-flex items-center gap-xs self-start"
        href="/students"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Élèves
      </Link>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm">
          {notice}
        </div>
      )}

      <div className={CARD_CLASS}>
        <div className="flex items-start gap-md px-md py-md">
        <div className="shrink-0">
          {student.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="w-16 h-16 rounded-lg object-cover bg-surface-container-high"
              height={64}
              src={student.avatar_url}
              width={64}
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center font-title-sm text-[18px]">
              {studentInitials(student)}
            </div>
          )}
          {canUpdate && (
            <>
              <input
                accept="image/*"
                className="sr-only"
                onChange={(e) => void onPhotoChange(e.target.files?.[0])}
                ref={photoInputRef}
                type="file"
              />
              <button
                className="mt-xs block w-16 text-[11px] text-primary hover:underline text-center"
                disabled={uploading === "photo"}
                onClick={() => photoInputRef.current?.click()}
                type="button"
              >
                {uploading === "photo" ? "Envoi…" : "Photo"}
              </button>
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-md flex-wrap">
            <div className="min-w-0">
              <h1 className="font-headline-md text-[18px] sm:text-[22px] leading-tight break-words" data-testid="dossier-name">
                {studentFullName(student)}
              </h1>
              <p className="text-[13px] text-on-surface-variant mt-0.5">
                {student.matricule}
                <span className="mx-xs">·</span>
                {className}
                <span className="mx-xs">·</span>
                <span data-testid="dossier-level">{levelName}</span>
              </p>
            </div>
            <div className="flex items-center gap-sm shrink-0">
              <StatusBadge
                label={STUDENT_STATUS_LABELS[student.status]}
                tone={statusTone(student.status)}
                withDot
              />
              {canUpdate && (
                <Link
                  className="inline-flex items-center gap-xs h-9 px-md rounded-lg border border-outline-variant/25 text-[13px] text-on-surface hover:bg-surface-container-low"
                  href={`/crud/students/${student.id}/modifier`}
                >
                  Modifier
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-2 lg:grid-cols-4 border-t border-outline-variant/20 divide-x-0 lg:divide-x divide-y lg:divide-y-0 divide-outline-variant/20 bg-[#f7f9fb]"
        data-testid="dossier-kpis"
      >
        {kpis.map((kpi) => (
          <div className="px-md py-sm" key={kpi.label}>
            <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">{kpi.label}</p>
            <p className={`text-[16px] sm:text-[18px] font-semibold leading-tight mt-0.5 break-words ${kpi.valueClass}`} data-testid={kpi.testId}>
              {kpi.value}
            </p>
            <p className="text-[12px] text-on-surface-variant mt-0.5">{kpi.hint}</p>
          </div>
        ))}
      </div>
      </div>

      <div className={CARD_CLASS}>
        <ContentTabs
          items={[
            { id: "identite", label: "Identité", count: dossier.guardians.length || undefined },
            { id: "scolarite", label: "Scolarité", count: dossier.grades.length || undefined },
            { id: "finances", label: "Finances", count: dossier.invoices.length || undefined },
            {
              id: "vie-scolaire",
              label: "Vie scolaire",
              count:
                absentCount +
                  dossier.discipline.length +
                  dossier.library_loans.length +
                  dossier.transport_subscriptions.length || undefined,
            },
          ]}
          onChange={setTab}
          testId="dossier-tabs"
          value={tab}
        />

        {tab === "identite" && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="md:border-r border-outline-variant/15">
              <TabBar title="Coordonnées" />
              <dl className="px-md py-sm">
              <FieldRow label="E-mail" value={student.email || "—"} />
              <FieldRow label="Téléphone" value={student.phone || "—"} />
              <FieldRow label="Adresse" value={student.address || "—"} />
              <FieldRow
                label="Naissance"
                value={
                  age != null
                    ? `${formatDate(student.birth_date)} (${age} ans)`
                    : formatDate(student.birth_date)
                }
              />
              <FieldRow label="Sexe" value={student.gender === "F" ? "Féminin" : "Masculin"} />
              <FieldRow label="Inscription" value={formatDate(student.enrolled_at)} />
              </dl>
            </div>
            <div>
              <TabBar
                action={
                  canUpdate ? (
                    <>
                      <input
                        accept=".pdf,image/*"
                        className="sr-only"
                        onChange={(e) => void onDocumentChange(e.target.files?.[0])}
                        ref={docInputRef}
                        type="file"
                      />
                      <button
                        className="text-[12px] text-primary hover:underline"
                        disabled={uploading === "document"}
                        onClick={() => docInputRef.current?.click()}
                        type="button"
                      >
                        {uploading === "document" ? "Envoi…" : "Ajouter"}
                      </button>
                    </>
                  ) : undefined
                }
                title="Documents"
              />
              {dossier.documents.length === 0 ? (
                <EmptyLine>Aucun document joint.</EmptyLine>
              ) : (
                <ul className="text-[13px]" data-testid="dossier-documents">
                  {dossier.documents.map((doc, index) => (
                    <li
                      className={`flex items-center justify-between gap-sm px-md py-[8px] ${tableRowClass(index)}`}
                      key={doc.id}
                    >
                      <span className="min-w-0 truncate">{doc.name || doc.file_name}</span>
                      <span className="shrink-0 flex items-center gap-sm">
                        <span className="text-on-surface-variant text-[12px]">{formatFileSize(doc.size)}</span>
                        <a
                          className="text-primary hover:underline"
                          href={doc.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Ouvrir
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <TabBar title="Parcours" />
              {dossier.histories.length === 0 ? (
                <EmptyLine>Aucun historique.</EmptyLine>
              ) : (
                <ul className="text-[13px]" data-testid="dossier-histories">
                  {dossier.histories.map((h, index) => (
                    <li className={`px-md py-[8px] ${tableRowClass(index)}`} key={h.id}>
                      {h.academic_year?.name || "Année"}
                      <span className="text-on-surface-variant">
                        {" "}
                        · {h.class_group?.name || "Classe"} / {h.level?.name || "Niveau"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "identite" && (
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-outline-variant/20">
            <div className="md:border-r border-outline-variant/15">
              <TabBar
                action={<TextLink href={`/guardians?student_id=${student.id}`}>Voir tout</TextLink>}
                title="Parents / Tuteurs"
              />
              {dossier.guardians.length === 0 ? (
                <EmptyLine>Aucun parent ou tuteur rattaché.</EmptyLine>
              ) : (
                <ul className="text-[13px]" data-testid="dossier-guardians">
                  {dossier.guardians.map((link, index) => (
                    <li className={`px-md py-sm ${tableRowClass(index)}`} key={link.id}>
                      <div className="flex items-center justify-between gap-sm flex-wrap">
                        <p className="font-medium">
                          {link.guardian ? guardianFullName(link.guardian) : `Tuteur #${link.guardian_id}`}
                        </p>
                        <span className="inline-flex items-center gap-xs">
                          {link.is_primary && <StatusBadge label="Principal" tone="info" />}
                          <span className="text-[12px] text-on-surface-variant">
                            {GUARDIAN_RELATIONSHIP_LABELS[link.relationship] ?? link.relationship}
                          </span>
                        </span>
                      </div>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        {link.guardian?.phone || "—"}
                        {link.guardian?.email ? ` · ${link.guardian.email}` : ""}
                        {link.guardian?.profession ? ` · ${link.guardian.profession}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <TabBar title="Inscription" />
              {dossier.enrollments.length === 0 ? (
                <EmptyLine>Aucun dossier d&apos;inscription.</EmptyLine>
              ) : (
                <dl className="px-md py-sm">
                  <FieldRow
                    label="Origine"
                    value={ENROLLMENT_ORIGIN_LABELS[dossier.enrollments[0].origin] ?? dossier.enrollments[0].origin}
                  />
                  {dossier.enrollments[0].previous_school && (
                    <FieldRow label="Établ. précédent" value={dossier.enrollments[0].previous_school} />
                  )}
                  <FieldRow label="Date de dossier" value={formatDate(dossier.enrollments[0].application_date)} />
                </dl>
              )}
              {dossier.re_enrollments.some((r) => r.is_repeat) && (
                <p className="text-[12px] text-on-surface-variant px-md pb-sm">
                  Redoublement signalé sur au moins une année scolaire.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "scolarite" && (
          <>
            <TabBar
              action={<TextLink href={`/grades?student_id=${student.id}`}>Toutes les notes</TextLink>}
              title={averages ? `Scolarité — ${averages.academic_year.name}` : "Scolarité"}
            />
            {averages && averages.by_period.length > 0 && (
              <div className="px-md py-sm border-b border-outline-variant/15">
                <ContentTabs
                  items={[
                    { id: "all", label: "Tous les trimestres" },
                    ...averages.by_period.map((p) => ({
                      id: String(p.period.id),
                      label: p.period.name,
                    })),
                  ]}
                  onChange={setScolaritePeriod}
                  testId="dossier-period-tabs"
                  value={scolaritePeriod}
                  variant="segmented"
                />
              </div>
            )}
            {averages ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-outline-variant/20">
                {(scolaritePeriod === "all"
                  ? averages.by_period
                  : averages.by_period.filter((p) => String(p.period.id) === scolaritePeriod)
                ).map((p) => (
                  <div className="px-md py-sm border-r border-outline-variant/15 last:border-r-0" key={p.period.id}>
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">{p.period.name}</p>
                    <p className={`text-[18px] font-semibold mt-0.5 ${scoreClass(p.average, averages.scale_max)}`}>
                      {formatAverage(p.average)}
                    </p>
                  </div>
                ))}
                {scolaritePeriod === "all" && (
                  <div className="px-md py-sm bg-surface-container-low">
                    <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Annuelle</p>
                    <p className={`text-[18px] font-semibold mt-0.5 ${scoreClass(averages.annual_average, averages.scale_max)}`}>
                      {formatAverage(averages.annual_average)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyLine>Aucune moyenne pour l&apos;année en cours.</EmptyLine>
            )}

            {visibleReportCards.length > 0 && (
              <table className="w-full text-left border-b border-outline-variant/20" data-testid="dossier-report-cards">
                <thead>
                  <tr className="ui-table-head-row">
                    <th className={DATA_TABLE_TH_CLASS}>Bulletin</th>
                    <th className={DATA_TABLE_TH_CLASS}>Mention</th>
                    <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReportCards.map((rc, index) => (
                    <tr className={tableRowClass(index)} key={rc.id}>
                      <td className={`${DATA_TABLE_TD_CLASS} font-medium`}>
                        {rc.academic_period?.name ??
                          (rc.academic_year_id ? "Synthèse annuelle" : `Bulletin #${rc.id}`)}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant text-[13px]`}>
                        {rc.mention ? REPORT_CARD_MENTION_LABELS[rc.mention] : "—"}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} text-right`}>
                        <div className="inline-flex items-center gap-sm">
                          <StatusBadge
                            label={REPORT_CARD_STATUS_LABELS[rc.status]}
                            tone={reportCardTone(rc.status)}
                          />
                          {rc.bulletin?.url && (
                            <a
                              className="text-[12px] text-primary hover:underline"
                              href={rc.bulletin.url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              PDF
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {dossier.grades.length === 0 ? (
              <EmptyLine>
                <span data-testid="dossier-grades-empty">Aucune note enregistrée.</span>
              </EmptyLine>
            ) : gradesForFilter.length === 0 ? (
              <EmptyLine>Aucune note pour cette période.</EmptyLine>
            ) : (
              <table className="w-full text-left" data-testid="dossier-grades">
                <thead>
                  <tr className="ui-table-head-row">
                    <th className={DATA_TABLE_TH_CLASS}>Matière</th>
                    <th className={DATA_TABLE_TH_CLASS}>Évaluation</th>
                    <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Note</th>
                    <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeGroups.map((group) => (
                    <Fragment key={group.key}>
                      {scolaritePeriod === "all" && gradeGroups.length > 1 && (
                        <tr className="bg-[#f7f9fb]">
                          <td
                            className={`${DATA_TABLE_TD_CLASS} font-title-sm text-[12px] uppercase tracking-wide text-on-surface-variant`}
                            colSpan={4}
                          >
                            {group.label}
                          </td>
                        </tr>
                      )}
                      {group.grades.map((g, index) => (
                        <tr className={tableRowClass(index)} key={g.id}>
                          <td className={`${DATA_TABLE_TD_CLASS} font-medium`}>{gradeSubjectName(g)}</td>
                          <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant text-[13px]`}>
                            {g.assessment?.title ?? "Évaluation"}
                            {g.assessment?.type ? ` · ${ASSESSMENT_TYPE_LABELS[g.assessment.type]}` : ""}
                          </td>
                          <td
                            className={`${DATA_TABLE_TD_CLASS} text-right font-mono-data font-semibold ${scoreClass(g.score, g.assessment?.max_score)}`}
                          >
                            {formatAverage(g.score)}
                            {g.assessment?.max_score != null ? ` / ${formatAverage(g.assessment.max_score)}` : ""}
                          </td>
                          <td className={`${DATA_TABLE_TD_CLASS} text-right text-[12px] text-on-surface-variant`}>
                            {g.validated_at ? "Validée" : "En attente"}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}

            {pastReportCards.length > 0 && (
              <div className="border-t border-outline-variant/20">
                <TabBar title="Années précédentes" />
                <table className="w-full text-left">
                  <thead>
                    <tr className="ui-table-head-row">
                      <th className={DATA_TABLE_TH_CLASS}>Année</th>
                      <th className={DATA_TABLE_TH_CLASS}>Période</th>
                      <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastReportCards.map((rc, index) => (
                      <tr className={tableRowClass(index)} key={rc.id}>
                        <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant text-[13px]`}>
                          {reportCardYearLabel(rc)}
                        </td>
                        <td className={`${DATA_TABLE_TD_CLASS} font-medium`}>
                          {rc.academic_period?.name ??
                            (rc.academic_year_id ? "Synthèse annuelle" : `Bulletin #${rc.id}`)}
                        </td>
                        <td className={`${DATA_TABLE_TD_CLASS} text-right`}>
                          <StatusBadge
                            label={REPORT_CARD_STATUS_LABELS[rc.status]}
                            tone={reportCardTone(rc.status)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-outline-variant/20">
              <TabBar title="Devoirs" />
              {dossier.assignments.length === 0 ? (
                <EmptyLine>Aucun devoir rendu.</EmptyLine>
              ) : (
                <table className="w-full text-left" data-testid="dossier-assignments">
                  <thead>
                    <tr className="ui-table-head-row">
                      <th className={DATA_TABLE_TH_CLASS}>Devoir</th>
                      <th className={DATA_TABLE_TH_CLASS}>Matière</th>
                      <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Note</th>
                      <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.assignments.map((a, index) => (
                      <tr className={tableRowClass(index)} key={a.id}>
                        <td className={`${DATA_TABLE_TD_CLASS} font-medium`}>
                          {a.assignment?.title ?? `Devoir #${a.assignment_id}`}
                        </td>
                        <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant text-[13px]`}>
                          {a.assignment?.subject?.name ?? "—"}
                        </td>
                        <td
                          className={`${DATA_TABLE_TD_CLASS} text-right font-mono-data font-semibold ${scoreClass(a.score, a.assignment?.max_score)}`}
                        >
                          {a.score != null
                            ? `${formatAverage(a.score)}${a.assignment?.max_score != null ? ` / ${formatAverage(a.assignment.max_score)}` : ""}`
                            : "—"}
                        </td>
                        <td className={`${DATA_TABLE_TD_CLASS} text-right`}>
                          <StatusBadge
                            label={SUBMISSION_STATUS_LABELS[a.status] ?? a.status}
                            tone={submissionTone(a.status)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {tab === "finances" && (
          <>
            <TabBar
              action={<TextLink href={`/invoices?student_id=${student.id}`}>Toutes les factures</TextLink>}
              title="Finances"
            />
            {financeSummary && (
              <div className="grid grid-cols-3 border-b border-outline-variant/20">
                <div className="px-md py-sm">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Facturé</p>
                  <p className="text-[15px] font-semibold mt-0.5">{formatMoneyFcfa(financeSummary.total)}</p>
                </div>
                <div className="px-md py-sm border-x border-outline-variant/20">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Payé</p>
                  <p className="text-[15px] font-semibold mt-0.5 text-[#027a48]">{formatMoneyFcfa(financeSummary.paid)}</p>
                </div>
                <div className="px-md py-sm">
                  <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Solde</p>
                  <p className={`text-[15px] font-semibold mt-0.5 ${balance > 0 ? "text-[#b42318]" : "text-[#027a48]"}`}>
                    {formatMoneyFcfa(financeSummary.balance)}
                  </p>
                </div>
              </div>
            )}

            {dossier.invoices.length === 0 ? (
              <EmptyLine>Aucune facture.</EmptyLine>
            ) : (
              <table className="w-full text-left" data-testid="dossier-invoices">
                <thead>
                  <tr className="ui-table-head-row">
                    <th className={DATA_TABLE_TH_CLASS}>Facture</th>
                    <th className={DATA_TABLE_TH_CLASS}>Période</th>
                    <th className={DATA_TABLE_TH_CLASS}>Montant</th>
                    <th className={DATA_TABLE_TH_CLASS}>Échéance</th>
                    <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.invoices.map((inv, index) => (
                    <tr className={tableRowClass(index)} key={inv.id}>
                      <td className={`${DATA_TABLE_TD_CLASS} font-medium`}>
                        {inv.invoice_number ?? `Facture #${inv.id}`}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant text-[13px]`}>
                        {inv.academic_period?.name || inv.academic_year?.name || "—"}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} font-mono-data text-[13px]`}>
                        {formatMoneyFcfa(inv.amount_paid)} / {formatMoneyFcfa(inv.total_amount)}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant text-[13px]`}>
                        {formatDate(inv.due_date)}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} text-right`}>
                        <StatusBadge label={INVOICE_STATUS_LABELS[inv.status]} tone={invoiceTone(inv.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {dossier.payments.length === 0 ? (
              dossier.invoices.length > 0 ? (
                <p className="font-body-sm text-on-surface-variant px-md py-sm border-t border-outline-variant/20">
                  Aucun paiement enregistré.
                </p>
              ) : null
            ) : (
              <table className="w-full text-left border-t border-outline-variant/20" data-testid="dossier-payments">
                <thead>
                  <tr className="ui-table-head-row">
                    <th className={DATA_TABLE_TH_CLASS}>Paiement</th>
                    <th className={DATA_TABLE_TH_CLASS}>Date</th>
                    <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.payments.map((p, index) => (
                    <tr className={tableRowClass(index)} key={p.id}>
                      <td className={`${DATA_TABLE_TD_CLASS} font-medium`}>
                        {formatMoneyFcfa(p.amount)}
                        {p.receipt_number ? (
                          <span className="text-on-surface-variant font-normal"> · {p.receipt_number}</span>
                        ) : null}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} text-on-surface-variant text-[13px]`}>
                        {p.paid_at ? formatDate(p.paid_at) : "—"}
                      </td>
                      <td className={`${DATA_TABLE_TD_CLASS} text-right`}>
                        <StatusBadge label={PAYMENT_STATUS_LABELS[p.status]} tone={paymentTone(p.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === "vie-scolaire" && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="md:border-r border-outline-variant/15">
              <TabBar
                action={<TextLink href={`/attendance?student_id=${student.id}`}>Voir tout</TextLink>}
                title="Présences"
              />
              {attendanceTotal > 0 && (
                <div className="grid grid-cols-4 border-b border-outline-variant/20 text-center">
                  {(
                    [
                      ["PRESENT", "Prés."],
                      ["ABSENT", "Abs."],
                      ["LATE", "Ret."],
                      ["JUSTIFIED", "Just."],
                    ] as const
                  ).map(([key, label]) => (
                    <div className="py-sm px-xs" key={key}>
                      <p className="text-[11px] text-on-surface-variant">{label}</p>
                      <p className="text-[15px] font-semibold">{dossier.attendance_summary[key] ?? 0}</p>
                    </div>
                  ))}
                </div>
              )}
              {dossier.attendance.length === 0 ? (
                <EmptyLine>Aucune présence enregistrée.</EmptyLine>
              ) : (
                <table className="w-full text-left" data-testid="dossier-attendance">
                  <thead>
                    <tr className="ui-table-head-row">
                      <th className={DATA_TABLE_TH_CLASS}>Date</th>
                      <th className={`${DATA_TABLE_TH_CLASS} text-right`}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossier.attendance.map((a, index) => (
                      <tr className={tableRowClass(index)} key={a.id}>
                        <td className={DATA_TABLE_TD_CLASS}>{formatDate(a.date)}</td>
                        <td className={`${DATA_TABLE_TD_CLASS} text-right`}>
                          <StatusBadge
                            label={ATTENDANCE_STATUS_LABELS[a.status]}
                            tone={
                              a.status === "PRESENT"
                                ? "success"
                                : a.status === "ABSENT"
                                  ? "error"
                                  : a.status === "LATE"
                                    ? "warning"
                                    : "info"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div>
              <TabBar
                action={<TextLink href={`/discipline?student_id=${student.id}`}>Voir tout</TextLink>}
                title="Discipline"
              />
              {dossier.discipline.length === 0 ? (
                <EmptyLine>Aucun incident.</EmptyLine>
              ) : (
                <ul data-testid="dossier-discipline">
                  {dossier.discipline.map((d, index) => (
                    <li className={`px-md py-sm ${tableRowClass(index)}`} key={d.id}>
                      <p className="text-[13px] font-medium">{d.title || `Incident #${d.id}`}</p>
                      <p className="text-[12px] text-on-surface-variant">
                        {d.occurred_at ? formatDate(d.occurred_at) : "—"}
                        {d.type ? ` · ${d.type}` : ""}
                        {d.status ? ` · ${d.status}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "vie-scolaire" && (
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-outline-variant/20">
            <div className="md:border-r border-outline-variant/15">
              <TabBar title="Bibliothèque" />
              {dossier.library_loans.length === 0 ? (
                <EmptyLine>Aucun emprunt.</EmptyLine>
              ) : (
                <ul data-testid="dossier-library-loans">
                  {dossier.library_loans.map((loan, index) => (
                    <li
                      className={`flex items-center justify-between gap-sm px-md py-sm ${tableRowClass(index)}`}
                      key={loan.id}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{loan.copy?.book?.title ?? "Livre"}</p>
                        <p className="text-[12px] text-on-surface-variant">
                          Emprunté le {formatDate(loan.loaned_at)} · à rendre le {formatDate(loan.due_date)}
                        </p>
                      </div>
                      <StatusBadge label={LIBRARY_LOAN_STATUS_LABELS[loan.status]} tone={libraryLoanTone(loan.status)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <TabBar title="Cantine" />
              {dossier.canteen_account ? (
                <>
                  <div className="flex items-center justify-between gap-sm px-md py-sm border-b border-outline-variant/15">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">Solde</p>
                      <p className="text-[15px] font-semibold" data-testid="dossier-canteen-balance">
                        {formatMoneyFcfa(dossier.canteen_account.balance)}
                      </p>
                    </div>
                    <StatusBadge
                      label={CANTEEN_ACCOUNT_STATUS_LABELS[dossier.canteen_account.status]}
                      tone={canteenAccountTone(dossier.canteen_account.status)}
                    />
                  </div>
                  {dossier.canteen_account.topups && dossier.canteen_account.topups.length > 0 && (
                    <ul className="text-[13px]">
                      {dossier.canteen_account.topups.map((topup, index) => (
                        <li className={`px-md py-[7px] ${tableRowClass(index)}`} key={topup.id}>
                          {formatMoneyFcfa(topup.amount)}
                          <span className="text-on-surface-variant">
                            {" "}
                            · {formatDate(topup.paid_at)} · {CANTEEN_PAYMENT_LABELS[topup.payment_method]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <EmptyLine>Aucun compte cantine.</EmptyLine>
              )}
              {dossier.canteen_special_diets.length > 0 && (
                <ul className="text-[12px] text-on-surface-variant px-md py-sm border-t border-outline-variant/15">
                  {dossier.canteen_special_diets.map((diet) => (
                    <li key={diet.id}>
                      {CANTEEN_DIET_TYPE_LABELS[diet.diet_type]} — {diet.allergens}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "vie-scolaire" && (
          <div className="border-t border-outline-variant/20">
            <TabBar title="Transport scolaire" />
            {dossier.transport_subscriptions.length === 0 ? (
              <EmptyLine>Aucun abonnement transport.</EmptyLine>
            ) : (
              <ul data-testid="dossier-transport">
                {dossier.transport_subscriptions.map((sub, index) => (
                  <li
                    className={`flex items-center justify-between gap-sm px-md py-sm ${tableRowClass(index)}`}
                    key={sub.id}
                  >
                    <div>
                      <p className="text-[13px] font-medium">{sub.route?.name ?? `Itinéraire #${sub.transport_route_id}`}</p>
                      <p className="text-[12px] text-on-surface-variant">
                        {sub.stop?.name ? `Arrêt : ${sub.stop.name} · ` : ""}
                        Depuis le {formatDate(sub.start_date)}
                      </p>
                    </div>
                    <StatusBadge
                      label={TRANSPORT_SUBSCRIPTION_STATUS_LABELS[sub.status]}
                      tone={transportSubscriptionTone(sub.status)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
