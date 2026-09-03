"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchStudentDashboard } from "@/infrastructure/api/resources/dashboard";
import { listGrades } from "@/infrastructure/api/resources/grades";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { isParentUser, isStudentUser } from "@/shared/lib/permissions";
import type { Grade } from "@/shared/types/grades.types";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

function scoreLabel(score: number | string | null | undefined): string {
  if (score == null || score === "") return "—";
  return Number(score).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function AcademicResultsContent() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStudent = isStudentUser(user);
  const isParent = isParentUser(user);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let rows: Grade[];
        if (isStudent) {
          const dash = await fetchStudentDashboard();
          if (!dash.linked || !dash.student_id) {
            if (!cancelled) {
              setGrades([]);
              setError(null);
            }
            return;
          }
          rows = await listGrades({ student_id: dash.student_id });
        } else {
          rows = await listGrades();
        }
        if (!cancelled) setGrades(rows);
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
  }, [isStudent]);

  const average = useMemo(() => {
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, g) => acc + Number(g.score || 0), 0);
    return Math.round((sum / grades.length) * 100) / 100;
  }, [grades]);

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-5xl mx-auto px-md">
      <div>
        <h1 className="ui-page-title">Notes & résultats</h1>
        <p className="font-body-md text-on-surface-variant mt-sm">
          {isParent
            ? "Notes de vos enfants (validées et en cours)."
            : "Vos notes enregistrées."}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}

      {loading && <ContentSkeleton variant="list" />}

      {!loading && (
        <>
          <div className="ui-card ui-card-pad" data-testid="grades-average">
            <span className="ui-stat-label">Moyenne affichée</span>
            <div className="ui-page-title mt-sm">
              {average == null ? "—" : average.toLocaleString("fr-FR")}
            </div>
            <p className="font-body-sm text-on-surface-variant mt-xs">
              {grades.length} note(s)
            </p>
          </div>

          {grades.length === 0 ? (
            <p className="font-body-md text-on-surface-variant" data-testid="grades-empty">
              Aucune note disponible.
            </p>
          ) : (
            <ul className="flex flex-col gap-sm" data-testid="grades-list">
              {grades.map((g) => (
                <li key={g.id} className="ui-card ui-card-pad flex justify-between gap-md flex-wrap">
                  <div>
                    <div className="font-title-sm text-on-surface">
                      {g.assessment?.title ?? `Évaluation #${g.assessment_id}`}
                    </div>
                    <div className="font-body-sm text-on-surface-variant mt-xs">
                      {g.assessment?.subject?.name ?? "Matière"}
                      {isParent && g.student
                        ? ` · ${g.student.first_name} ${g.student.last_name}`
                        : ""}
                    </div>
                    {g.comment && (
                      <p className="font-body-sm text-on-surface-variant mt-xs">{g.comment}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono-data text-on-surface font-semibold">
                      {scoreLabel(g.score)}
                      {g.assessment?.max_score != null
                        ? ` / ${scoreLabel(g.assessment.max_score)}`
                        : ""}
                    </div>
                    <div className="font-label-caps text-[10px] text-on-surface-variant mt-xs">
                      {g.validated_at ? "Validée" : "En attente"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
