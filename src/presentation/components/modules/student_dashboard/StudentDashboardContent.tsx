"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchStudentDashboard } from "@/infrastructure/api/resources/dashboard";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import type { StudentDashboardData } from "@/shared/types/dashboard.types";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

function pct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function avg(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function StudentDashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dash = await fetchStudentDashboard();
        if (!cancelled) setData(dash);
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
  }, []);

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-5xl mx-auto px-md">
      <div>
        <h1 className="ui-page-title">Bonjour{user?.name ? `, ${user.name}` : ""}</h1>
        <p className="font-body-md text-on-surface-variant mt-sm">
          Votre espace élève — données en direct.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}

      {loading && <ContentSkeleton testId="student-dash-loading" variant="dashboard" />}

      {!loading && data && !data.linked && (
        <p className="font-body-md text-on-surface-variant" data-testid="student-dash-unlinked">
          Aucun profil élève lié à ce compte. Contactez l&apos;administration.
        </p>
      )}

      {!loading && data?.linked && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="ui-card ui-card-pad" data-testid="kpi-average">
              <span className="ui-stat-label">Moyenne</span>
              <div className="ui-page-title mt-sm">{avg(data.average_grade)}</div>
            </div>
            <div className="ui-card ui-card-pad" data-testid="kpi-attendance">
              <span className="ui-stat-label">Assiduité</span>
              <div className="ui-page-title mt-sm">{pct(data.attendance_rate)}</div>
            </div>
            <div className="ui-card ui-card-pad" data-testid="kpi-pending">
              <span className="ui-stat-label">Devoirs à rendre</span>
              <div className="ui-page-title mt-sm">{data.assignments_pending}</div>
            </div>
            <div className="ui-card ui-card-pad" data-testid="kpi-due-soon">
              <span className="ui-stat-label">Échéances (7 j.)</span>
              <div className="ui-page-title mt-sm">{data.assignments_due_soon}</div>
            </div>
          </div>

          {(data.unpaid_invoices ?? 0) > 0 && (
            <p className="font-body-sm text-on-surface-variant" data-testid="kpi-unpaid">
              {data.unpaid_invoices} facture(s) en attente — consultez un parent pour le paiement.
            </p>
          )}

          <div className="flex flex-wrap gap-sm">
            <Link href="/portal/assignments" className="ui-btn-primary">
              Mes devoirs
            </Link>
            <Link href="/portal/grades" className="ui-btn-secondary">
              Mes notes
            </Link>
            <Link href="/portal/schedule" className="ui-btn-secondary">
              Emploi du temps
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
