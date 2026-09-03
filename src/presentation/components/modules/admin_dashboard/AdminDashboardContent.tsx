"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminDashboard,
  fetchTeacherDashboard,
} from "@/infrastructure/api/resources/dashboard";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { isTeacherOnly } from "@/shared/lib/permissions";
import {
  attendanceRate,
  attendanceTotal,
  formatCompactNumber,
  formatFcfa,
  pctLabel,
  type AdminDashboardData,
  type TeacherDashboardData,
} from "@/shared/types/dashboard.types";
import {
  DashboardSkeleton,
  KpiSkeleton,
  PanelSkeleton,
} from "@/presentation/components/shared/DataTableSkeleton";

function share(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function todayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatTile({
  href,
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  testId,
}: {
  href?: string;
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: "neutral" | "accent" | "warning" | "success";
  testId?: string;
}) {
  const shell =
    tone === "accent"
      ? "bg-primary text-on-primary shadow-md"
      : tone === "warning"
        ? "bg-surface-container-lowest border border-error/25 shadow-sm"
        : "bg-surface-container-lowest shadow-sm";

  const labelClass =
    tone === "accent"
      ? "text-[11px] font-semibold uppercase tracking-[0.08em] text-on-primary/65"
      : "ui-stat-label";

  const valueClass =
    tone === "accent"
      ? "text-[1.85rem] font-semibold leading-none text-on-primary"
      : "text-[1.85rem] font-semibold leading-none text-on-surface";

  const iconWrap =
    tone === "accent"
      ? "bg-on-primary/15 text-on-primary"
      : tone === "warning"
        ? "bg-error-container text-on-error-container"
        : "bg-surface-container-high text-on-surface-variant";

  const body = (
    <div className={`${shell} rounded-xl p-lg flex flex-col gap-md h-full min-h-[8rem]`}>
      <div className="flex justify-between items-start gap-sm">
        <span className={labelClass}>{label}</span>
        <span
          className={`${iconWrap} w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0`}
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
      </div>
      <div className="flex flex-col gap-xs mt-auto">
        <span className={valueClass} data-testid={testId}>
          {value}
        </span>
        {hint ? (
          <span
            className={
              tone === "accent" ? "text-[12px] text-on-primary/70" : "text-[12px] text-on-surface-variant"
            }
          >
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (!href) return body;
  return (
    <Link className="block h-full ui-card-hover" href={href}>
      {body}
    </Link>
  );
}

function MiniMetric({
  href,
  label,
  value,
  icon,
  testId,
}: {
  href: string;
  label: string;
  value: string;
  icon: string;
  testId?: string;
}) {
  return (
    <Link
      className="rounded-xl bg-surface-container-low/70 hover:bg-surface-container-high transition-colors px-md py-md flex items-center gap-md min-h-[4.5rem]"
      href={href}
    >
      <span className="w-10 h-10 rounded-xl bg-surface-container-lowest shadow-sm inline-flex items-center justify-center text-on-surface-variant shrink-0">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="min-w-0 flex flex-col gap-xs">
        <span className="ui-stat-label truncate">{label}</span>
        <span
          className="text-[1.25rem] font-semibold leading-none text-on-surface tabular-nums"
          data-testid={testId}
        >
          {value}
        </span>
      </div>
    </Link>
  );
}

function AlertRow({
  href,
  icon,
  label,
  value,
  tone = "neutral",
}: {
  href: string;
  icon: string;
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger" ? "text-error" : tone === "warning" ? "text-amber-700" : "text-on-surface";
  const rowBg =
    tone === "danger"
      ? "bg-error-container/35 hover:bg-error-container/50"
      : tone === "warning"
        ? "bg-amber-50 hover:bg-amber-100/80"
        : "hover:bg-surface-container-low";

  return (
    <Link
      className={`flex items-center gap-md px-md py-sm rounded-xl transition-colors ${rowBg}`}
      href={href}
    >
      <span className={`material-symbols-outlined text-[20px] ${toneClass}`}>{icon}</span>
      <span className="flex-1 text-[13px] text-on-surface">{label}</span>
      <span className={`text-[14px] font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </Link>
  );
}

const ADMIN_QUICK_ACTIONS = [
  { href: "/enrollment", icon: "person_add", label: "Inscrire un élève" },
  { href: "/payments", icon: "payments", label: "Enregistrer un paiement" },
  { href: "/attendance", icon: "how_to_reg", label: "Saisir les présences" },
  { href: "/grades", icon: "grade", label: "Saisir des notes" },
  { href: "/report-cards", icon: "description", label: "Bulletins" },
  { href: "/communication", icon: "campaign", label: "Envoyer une annonce" },
] as const;

export function AdminDashboardContent() {
  const { user } = useAuth();
  const teacherView = isTeacherOnly(user);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (teacherView) {
          const dashboard = await fetchTeacherDashboard();
          if (!cancelled) {
            setTeacherData(dashboard);
            setData(null);
          }
        } else {
          const dashboard = await fetchAdminDashboard();
          if (!cancelled) {
            setData(dashboard);
            setTeacherData(null);
          }
        }
      } catch (err) {
        if (!cancelled) setError(getAuthErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [teacherView]);

  const rate = useMemo(() => {
    if (!data) return null;
    return data.attendance_rate ?? attendanceRate(data.attendance_today);
  }, [data]);

  const dayTotal = data ? attendanceTotal(data.attendance_today) : 0;

  if (teacherView) {
    return (
      <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto gap-lg pb-xl">
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm"
          >
            {error}
          </div>
        )}

        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-md"
          data-testid="teacher-dashboard-kpis"
        >
          {loading ? (
            <>
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
            </>
          ) : (
            <>
              <StatTile
                href="/classes"
                icon="door_open"
                label="Classes"
                testId="kpi-teacher-classes"
                value={formatCompactNumber(teacherData?.classes_count ?? 0)}
              />
              <StatTile
                href="/students"
                icon="group"
                label="Élèves"
                testId="kpi-teacher-students"
                value={formatCompactNumber(teacherData?.students_count ?? 0)}
              />
              <StatTile
                href="/assignments"
                icon="assignment"
                label="Devoirs"
                testId="kpi-teacher-assignments"
                value={formatCompactNumber(teacherData?.assignments_count ?? 0)}
              />
              <StatTile
                href="/assignments"
                hint="Prochains 7 jours"
                icon="event"
                label="Échéances"
                testId="kpi-teacher-due-soon"
                tone="warning"
                value={formatCompactNumber(teacherData?.assignments_due_soon ?? 0)}
              />
              <StatTile
                href="/grades"
                hint="Soumissions non notées"
                icon="grade"
                label="À noter"
                testId="kpi-teacher-pending"
                tone="accent"
                value={formatCompactNumber(teacherData?.submissions_pending_grading ?? 0)}
              />
              <StatTile
                href="/attendance"
                hint="Pointages saisis aujourd'hui"
                icon="how_to_reg"
                label="Présences"
                testId="kpi-teacher-attendance"
                value={formatCompactNumber(teacherData?.attendance_to_record_today ?? 0)}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
          <div className="ui-card ui-card-pad">
            <h2 className="font-title-sm text-title-sm mb-md">Priorités du jour</h2>
            {loading ? (
              <PanelSkeleton lines={4} />
            ) : (
              <div className="flex flex-col gap-xs" data-testid="teacher-priorities">
                <AlertRow
                  href="/grades"
                  icon="grade"
                  label="Soumissions à noter"
                  tone={(teacherData?.submissions_pending_grading ?? 0) > 0 ? "warning" : "neutral"}
                  value={formatCompactNumber(teacherData?.submissions_pending_grading ?? 0)}
                />
                <AlertRow
                  href="/assignments"
                  icon="schedule"
                  label="Devoirs à échéance (7 j)"
                  tone={(teacherData?.assignments_due_soon ?? 0) > 0 ? "warning" : "neutral"}
                  value={formatCompactNumber(teacherData?.assignments_due_soon ?? 0)}
                />
                <AlertRow
                  href="/attendance"
                  icon="how_to_reg"
                  label="Présences saisies aujourd'hui"
                  value={formatCompactNumber(teacherData?.attendance_to_record_today ?? 0)}
                />
              </div>
            )}
          </div>

          <div className="ui-card ui-card-pad">
            <h3 className="font-title-sm text-title-sm mb-md">Actions rapides</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-sm">
              {[
                { href: "/attendance", icon: "how_to_reg", label: "Saisir les présences" },
                { href: "/assignments", icon: "assignment", label: "Gérer les devoirs" },
                { href: "/grades", icon: "grade", label: "Saisir les notes" },
              ].map((action) => (
                <Link
                  key={action.href}
                  className="flex items-center gap-md px-md py-sm rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors"
                  href={action.href}
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">{action.icon}</span>
                  <span className="text-[13px] font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const attendanceRows = data
    ? [
        { key: "present", label: "Présents", value: data.attendance_today.present, color: "bg-emerald-500" },
        { key: "late", label: "Retards", value: data.attendance_today.late, color: "bg-amber-500" },
        { key: "justified", label: "Justifiés", value: data.attendance_today.justified, color: "bg-sky-500" },
        { key: "absent", label: "Absents", value: data.attendance_today.absent, color: "bg-rose-500" },
      ]
    : [];

  return (
    <div className="flex flex-col w-full h-full max-w-[1400px] mx-auto gap-lg pb-xl" data-testid="admin-dashboard">
      <div className="ui-table-shell mt-0">
        <div className="px-lg py-md flex flex-wrap items-center gap-sm">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-on-surface-variant capitalize">{todayLabel()}</p>
          </div>
          <div className="ml-auto shrink-0 flex items-center gap-sm">
            <Link href="/reports" className="ui-btn-secondary gap-sm inline-flex items-center h-10">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Exporter
            </Link>
            <Link href="/enrollment" className="ui-btn-primary gap-sm inline-flex items-center h-10">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Nouvelle inscription
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm"
        >
          {error}
        </div>
      )}

      {loading && !data ? (
        <DashboardSkeleton kpis={4} testId="admin-dashboard-loading" />
      ) : (
        <>
          {/* KPI hero */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
            <StatTile
              href="/students"
              hint={`${formatCompactNumber(data?.students_active ?? 0)} actifs`}
              icon="group"
              label="Élèves"
              testId="kpi-students"
              value={formatCompactNumber(data?.students_count ?? 0)}
            />
            <StatTile
              href="/attendance"
              hint={
                dayTotal === 0
                  ? "Aucun pointage aujourd'hui"
                  : `${formatCompactNumber(dayTotal)} pointages`
              }
              icon="event_available"
              label="Présence du jour"
              testId="kpi-attendance"
              tone={rate != null && rate < 85 ? "warning" : "neutral"}
              value={pctLabel(rate)}
            />
            <StatTile
              href="/payments"
              hint="Confirmés ce mois"
              icon="payments"
              label="Encaissements (mois)"
              testId="kpi-payments"
              tone="accent"
              value={formatFcfa(data?.payments_this_month ?? 0)}
            />
            <StatTile
              href="/invoices"
              hint={`${formatCompactNumber(data?.invoices_unpaid ?? 0)} facture(s)`}
              icon="receipt_long"
              label="Impayés"
              testId="kpi-invoices-unpaid-amount"
              tone={(data?.invoices_unpaid ?? 0) > 0 ? "warning" : "neutral"}
              value={formatFcfa(data?.invoices_unpaid_amount ?? 0)}
            />
          </section>

          {/* Présences + Alertes */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-md items-stretch">
            <div className="ui-card ui-card-pad flex flex-col">
              <div className="flex items-center justify-between gap-md mb-md">
                <h2 className="font-title-sm text-title-sm">Présences du jour</h2>
                <Link className="text-[12px] font-medium text-primary hover:underline" href="/attendance">
                  Ouvrir
                </Link>
              </div>

              {!data || dayTotal === 0 ? (
                <div
                  className="flex-1 flex flex-col items-center justify-center text-center gap-sm py-xl rounded-xl bg-surface-container-low/50"
                  data-testid="attendance-empty"
                >
                  <span className="material-symbols-outlined text-[40px] text-on-surface-variant/45">
                    how_to_reg
                  </span>
                  <p className="font-body-sm text-on-surface-variant max-w-xs">
                    Aucun pointage enregistré aujourd&apos;hui.
                  </p>
                  <Link
                    className="inline-flex items-center gap-xs text-[13px] font-medium text-primary mt-xs"
                    href="/attendance"
                  >
                    Saisir les présences
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-md" data-testid="attendance-breakdown">
                  <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                    {attendanceRows.map((row) => {
                      const width = share(row.value, dayTotal);
                      if (width <= 0) return null;
                      return (
                        <div
                          className={`${row.color} h-full`}
                          key={row.key}
                          style={{ width: `${width}%` }}
                          title={`${row.label}: ${row.value}`}
                        />
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                    {attendanceRows.map((row) => (
                      <div className="rounded-xl bg-surface-container-low/70 p-md" key={row.key}>
                        <div className="flex items-center gap-sm mb-xs">
                          <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                          <span className="ui-stat-label">{row.label}</span>
                        </div>
                        <p className="text-[1.25rem] font-semibold tabular-nums">{row.value}</p>
                        <p className="text-[11px] text-on-surface-variant mt-xs">
                          {share(row.value, dayTotal)} %
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div
              className="ui-card ui-card-pad flex flex-col"
              data-testid="dashboard-alerts"
            >
              <h2 className="font-title-sm text-title-sm mb-md">Alertes prioritaires</h2>
              <div className="flex flex-col gap-xs flex-1">
                <AlertRow
                  href="/invoices"
                  icon="receipt_long"
                  label="Factures impayées"
                  tone={(data?.invoices_unpaid ?? 0) > 0 ? "danger" : "neutral"}
                  value={formatCompactNumber(data?.invoices_unpaid ?? 0)}
                />
                <span className="sr-only" data-testid="kpi-invoices-unpaid">
                  {data?.invoices_unpaid ?? 0}
                </span>
                <AlertRow
                  href="/discipline"
                  icon="gavel"
                  label="Discipline à traiter"
                  tone={(data?.discipline_open_count ?? 0) > 0 ? "warning" : "neutral"}
                  value={formatCompactNumber(data?.discipline_open_count ?? 0)}
                />
                <AlertRow
                  href="/library"
                  icon="menu_book"
                  label="Prêts en retard"
                  tone={(data?.library_loans_overdue ?? 0) > 0 ? "danger" : "neutral"}
                  value={formatCompactNumber(data?.library_loans_overdue ?? 0)}
                />
                <AlertRow
                  href="/library"
                  icon="local_library"
                  label="Prêts actifs"
                  value={formatCompactNumber(data?.library_loans_active ?? 0)}
                />
                <AlertRow
                  href="/assignments"
                  icon="assignment"
                  label="Devoirs à échéance (7 j)"
                  tone={(data?.assignments_due_soon ?? 0) > 0 ? "warning" : "neutral"}
                  value={formatCompactNumber(data?.assignments_due_soon ?? 0)}
                />
                <AlertRow
                  href="/communication"
                  icon="campaign"
                  label="Annonces publiées (mois)"
                  value={formatCompactNumber(data?.announcements_published_month ?? 0)}
                />
              </div>
            </div>
          </section>

          {/* Effectifs full width */}
          <section className="ui-card ui-card-pad">
            <h2 className="font-title-sm text-title-sm mb-md">Effectifs & organisation</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-sm">
              <MiniMetric
                href="/teachers"
                icon="person_4"
                label="Enseignants"
                testId="kpi-teachers"
                value={formatCompactNumber(data?.teachers_count ?? 0)}
              />
              <MiniMetric
                href="/hr/staff"
                icon="badge"
                label="Personnel"
                testId="kpi-staff"
                value={formatCompactNumber(data?.staff_count ?? 0)}
              />
              <MiniMetric
                href="/parents"
                icon="family_restroom"
                label="Parents"
                testId="kpi-guardians"
                value={formatCompactNumber(data?.guardians_count ?? 0)}
              />
              <MiniMetric
                href="/classes"
                icon="door_open"
                label="Classes"
                testId="kpi-classes"
                value={formatCompactNumber(data?.classes_count ?? 0)}
              />
              <MiniMetric
                href="/subjects"
                icon="book"
                label="Matières"
                testId="kpi-subjects"
                value={formatCompactNumber(data?.subjects_count ?? 0)}
              />
              <MiniMetric
                href="/enrollment"
                icon="person_add"
                label="Inscriptions actives"
                testId="kpi-enrollments"
                value={formatCompactNumber(data?.enrollments_active ?? 0)}
              />
            </div>
          </section>

          {/* Actions horizontales */}
          <section className="ui-card ui-card-pad">
            <h2 className="font-title-sm text-title-sm mb-md">Actions rapides</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-sm">
              {ADMIN_QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href + action.label}
                  className="group flex flex-col items-start gap-sm rounded-xl border border-outline-variant/20 bg-surface px-md py-md hover:border-primary/30 hover:bg-primary/5 transition-colors min-h-[5.25rem]"
                  href={action.href}
                >
                  <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                  </span>
                  <span className="text-[12px] font-medium leading-snug text-on-surface">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
