"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchParentDashboard } from "@/infrastructure/api/resources/dashboard";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import type { ParentDashboardData } from "@/shared/types/dashboard.types";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

function pct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function avg(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function ParentDashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dash = await fetchParentDashboard();
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
          Suivi de vos enfants — données en direct.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}

      {loading && <ContentSkeleton testId="parent-dash-loading" variant="dashboard" />}

      {!loading && data && !data.linked && (
        <p className="font-body-md text-on-surface-variant" data-testid="parent-dash-unlinked">
          Aucun profil parent lié à ce compte. Contactez l&apos;administration.
        </p>
      )}

      {!loading && data?.linked && (
        <>
          <p className="font-body-sm text-on-surface-variant" data-testid="parent-children-count">
            {data.children_count} enfant(s) suivi(s)
          </p>

          {data.children.length === 0 ? (
            <p className="font-body-md text-on-surface-variant">Aucun enfant rattaché.</p>
          ) : (
            <ul className="flex flex-col gap-md" data-testid="parent-children-list">
              {data.children.map((child) => (
                <li key={child.id} className="ui-card ui-card-pad flex flex-col gap-sm">
                  <div className="flex justify-between gap-md flex-wrap">
                    <div>
                      <h2 className="font-title-md text-on-surface">{child.full_name}</h2>
                      <p className="font-body-sm text-on-surface-variant">
                        {child.class ?? "Classe non renseignée"}
                      </p>
                    </div>
                    {child.unpaid_invoices > 0 && (
                      <span className="font-label-caps text-error">
                        {child.unpaid_invoices} facture(s)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <div>
                      <span className="ui-stat-label">Moyenne</span>
                      <div className="font-title-sm">{avg(child.average_grade)}</div>
                    </div>
                    <div>
                      <span className="ui-stat-label">Assiduité</span>
                      <div className="font-title-sm">{pct(child.attendance_rate)}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-sm">
            <Link href="/portal/fees" className="ui-btn-primary">
              Frais & paiements
            </Link>
            <Link href="/portal/grades" className="ui-btn-secondary">
              Notes
            </Link>
            <Link href="/portal/assignments" className="ui-btn-secondary">
              Devoirs
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
