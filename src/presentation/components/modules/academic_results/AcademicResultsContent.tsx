"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchParentDashboard, fetchStudentDashboard } from "@/infrastructure/api/resources/dashboard";
import { listGrades } from "@/infrastructure/api/resources/grades";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { isParentUser, isStudentUser } from "@/shared/lib/permissions";
import type { ParentChildSummary } from "@/shared/types/dashboard.types";
import type { Grade } from "@/shared/types/grades.types";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { Select } from "@/presentation/components/shared/Select";

function scoreLabel(score: number | string | null | undefined): string {
  if (score == null || score === "") return "—";
  return Number(score).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function AcademicResultsContent() {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ParentChildSummary[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  const isStudent = isStudentUser(user);
  const isParent = isParentUser(user);

  useEffect(() => {
    if (!isParent) return;
    let cancelled = false;
    async function loadChildren() {
      try {
        const dash = await fetchParentDashboard();
        if (cancelled) return;
        setChildren(dash.children);
        if (dash.children.length > 0) {
          setSelectedChildId((prev) => prev || String(dash.children[0]!.id));
        }
      } catch (err) {
        if (!cancelled) setError(getAuthErrorMessage(err));
      }
    }
    void loadChildren();
    return () => {
      cancelled = true;
    };
  }, [isParent]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (isParent && !selectedChildId) {
        setGrades([]);
        setLoading(false);
        return;
      }
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
        } else if (isParent) {
          rows = await listGrades({ student_id: selectedChildId });
        } else {
          // Portail élève/parent uniquement : un autre rôle (ex. admin en
          // prévisualisation) n'a pas de "mes notes" à afficher — ne surtout
          // pas appeler /grades sans filtre (des dizaines de milliers de
          // lignes toutes années confondues, déjà observé en épuisement
          // mémoire côté API).
          if (!cancelled) setGrades([]);
          return;
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
  }, [isStudent, isParent, selectedChildId]);

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
            ? "Notes de l'enfant sélectionné (validées et en cours)."
            : "Vos notes enregistrées."}
        </p>
      </div>

      {isParent && children.length > 0 && (
        <Select
          ariaLabel="Enfant"
          className="ui-input h-11 w-full sm:w-auto"
          onChange={setSelectedChildId}
          options={children.map((c) => ({ value: String(c.id), label: c.full_name }))}
          value={selectedChildId}
        />
      )}

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
