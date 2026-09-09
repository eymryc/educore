"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
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
  DataTableSearch,
  DataTableFilterSelect,
} from "@/presentation/components/shared/DataTable";

import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import { listAcademicYears, listClassGroups } from "@/infrastructure/api/resources/academic";
import { listAssessments } from "@/infrastructure/api/resources/assessments";
import {
  createGrade,
  listGrades,
  updateGrade,
  validateGrade,
} from "@/infrastructure/api/resources/grades";
import { listStudents } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { classGroupsForActiveYear, type ClassGroup } from "@/shared/types/academic.types";
import {
  isGradeValidated,
  summarizeGrades,
  toScoreNumber,
  type Assessment,
  type Grade,
} from "@/shared/types/grades.types";
import { studentFullName, type Student } from "@/shared/types/student.types";

type Draft = { score: string; comment: string };

export function GradesEntryContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialAssessmentId = searchParams.get("assessment_id") ?? "";

  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [classId, setClassId] = useState("");
  const [assessmentId, setAssessmentId] = useState(initialAssessmentId);
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canCreate = can(user, "grades.create");
  const canUpdate = can(user, "grades.update");
  const canValidate = can(user, "grades.update");

  const selectedAssessment = assessments.find((a) => String(a.id) === assessmentId);

  const classAssessments = useMemo(() => {
    if (!classId) return assessments;
    return assessments.filter((a) => String(a.class_group_id) === classId);
  }, [assessments, classId]);

  const gradeByStudent = useMemo(() => {
    const map = new Map<number, Grade>();
    for (const g of grades) map.set(g.student_id, g);
    return map;
  }, [grades]);

  const classStudents = useMemo(() => {
    const cid = selectedAssessment ? String(selectedAssessment.class_group_id) : classId;
    if (!cid) return [];
    return students.filter((s) => String(s.class_group_id ?? "") === cid);
  }, [students, selectedAssessment, classId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classStudents
      .filter((s) => {
        if (!q) return true;
        return `${studentFullName(s)} ${s.matricule}`.toLowerCase().includes(q);
      })
      .map((student) => ({
        id: student.id,
        student,
        grade: gradeByStudent.get(student.id) ?? null,
      }));
  }, [classStudents, gradeByStudent, search]);

  const gradesTable = useClientDataTable(rows, [search, assessmentId, classId]);

  const summary = useMemo(() => summarizeGrades(grades), [grades]);
  const maxScore = selectedAssessment ? toScoreNumber(selectedAssessment.max_score) : 20;

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classList, assessmentList, studentList, yearList] = await Promise.all([
        listClassGroups(),
        listAssessments(),
        listStudents(),
        listAcademicYears(),
      ]);
      setClasses(classGroupsForActiveYear(classList, yearList));
      setAssessments(assessmentList);
      setStudents(studentList);

      if (initialAssessmentId) {
        const found = assessmentList.find((a) => String(a.id) === initialAssessmentId);
        if (found) {
          setAssessmentId(String(found.id));
          setClassId(String(found.class_group_id));
        }
      } else if (classList[0]) {
        setClassId(String(classList[0].id));
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [initialAssessmentId]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!assessmentId) {
      setGrades([]);
      setDrafts({});
      return;
    }
    let cancelled = false;
    async function loadGrades() {
      setLoading(true);
      setError(null);
      try {
        const list = await listGrades({ assessment_id: assessmentId });
        if (cancelled) return;
        setGrades(list);
        const next: Record<number, Draft> = {};
        for (const g of list) {
          next[g.student_id] = {
            score: String(g.score ?? ""),
            comment: g.comment ?? "",
          };
        }
        setDrafts(next);
      } catch (err) {
        if (!cancelled) setError(getAuthErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadGrades();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  function setDraft(studentId: number, patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        score: prev[studentId]?.score ?? "",
        comment: prev[studentId]?.comment ?? "",
        ...patch,
      },
    }));
  }

  async function saveRow(student: Student) {
    if (!selectedAssessment) return;
    const draft = drafts[student.id];
    if (!draft?.score.trim()) {
      setError("Saisissez une note avant d'enregistrer.");
      return;
    }
    const score = Number(draft.score);
    if (Number.isNaN(score) || score < 0 || score > maxScore) {
      setError(`La note doit être entre 0 et ${maxScore}.`);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const existing = gradeByStudent.get(student.id);
      if (existing) {
        if (isGradeValidated(existing) && !can(user, "grades.validate")) {
          setError("Cette note est déjà validée : vous n'avez pas la permission de la modifier.");
          return;
        }
        const payload: Record<string, unknown> = {
          score,
          comment: draft.comment.trim() || null,
        };
        if (isGradeValidated(existing)) {
          const reason = window.prompt("Motif de la modification (note validée) :");
          if (!reason?.trim()) return;
          payload.reason = reason.trim();
        }
        const updated = await updateGrade(existing.id, payload);
        setGrades((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      } else {
        const created = await createGrade({
          assessment_id: selectedAssessment.id,
          student_id: student.id,
          score,
          comment: draft.comment.trim() || null,
        });
        setGrades((prev) => [...prev, created]);
      }
      setNotice(`Note enregistrée pour ${studentFullName(student)}.`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function saveAll() {
    if (!selectedAssessment || !(canCreate || canUpdate)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    let saved = 0;
    try {
      for (const student of classStudents) {
        const draft = drafts[student.id];
        if (!draft?.score.trim()) continue;
        const score = Number(draft.score);
        if (Number.isNaN(score) || score < 0 || score > maxScore) continue;
        const existing = gradeByStudent.get(student.id);
        if (existing) {
          if (isGradeValidated(existing)) continue;
          const same =
            toScoreNumber(existing.score) === score &&
            (existing.comment ?? "") === (draft.comment.trim() || "");
          if (same) continue;
          const updated = await updateGrade(existing.id, {
            score,
            comment: draft.comment.trim() || null,
          });
          setGrades((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        } else {
          const created = await createGrade({
            assessment_id: selectedAssessment.id,
            student_id: student.id,
            score,
            comment: draft.comment.trim() || null,
          });
          setGrades((prev) => [...prev, created]);
        }
        saved += 1;
      }
      setNotice(`${saved} note(s) enregistrée(s).`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleValidate(grade: Grade) {
    if (!canValidate || isGradeValidated(grade)) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await validateGrade(grade.id);
      setGrades((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setNotice("Note validée.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const hasFilters = Boolean(search);

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-[1400px] mx-auto">
      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm" role="status">
          {notice}
        </div>
      )}

      <DataTableShell testId="grades-table">
        {selectedAssessment && (
          <div className="px-lg pt-lg">
            <h2 className="font-title-sm">{selectedAssessment.title}</h2>
          </div>
        )}
        <DataTableToolbar>
          <DataTableFilterSelect
            ariaLabel="Classe"
            onChange={(v) => {
              setClassId(v);
              setAssessmentId("");
            }}
            options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Toutes les classes"
            value={classId}
          />
          <DataTableFilterSelect
            ariaLabel="Évaluation"
            className="sm:min-w-[200px]"
            onChange={setAssessmentId}
            options={classAssessments.map((a) => ({ value: String(a.id), label: a.title }))}
            placeholder="Sélectionner une évaluation…"
            value={assessmentId}
          />
          <DataTableSearch
            ariaLabel="Rechercher un élève"
            onChange={setSearch}
            placeholder="Rechercher un élève…"
            value={search}
          />
          {hasFilters && (
            <button
              className="inline-flex items-center gap-xs h-10 px-md text-[13px] text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => setSearch("")}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              Réinitialiser
            </button>
          )}
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton
              loading={loading}
              onRefresh={() => {
                if (assessmentId) void listGrades({ assessment_id: assessmentId }).then(setGrades);
              }}
            />
            {(canCreate || canUpdate) && assessmentId && (
              <button
                className="inline-flex items-center gap-sm h-9 bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm disabled:opacity-50"
                disabled={busy}
                onClick={() => void saveAll()}
                type="button"
              >
                Enregistrer tout
              </button>
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <DataTableSkeleton testId="grades-loading" />
          ) : !assessmentId ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="grades-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                grade
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">Aucune évaluation sélectionnée</h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm">
                Choisissez une classe puis une évaluation pour saisir les notes.
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center px-lg py-2xl text-center"
              data-testid="grades-empty"
            >
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/50 mb-md">
                group_off
              </span>
              <h3 className="font-title-md text-on-surface mb-xs">
                {search ? "Aucun résultat" : "Aucun élève dans cette classe"}
              </h3>
              <p className="font-body-sm text-on-surface-variant max-w-sm mb-lg">
                {search
                  ? "Aucun élève ne correspond à cette recherche."
                  : "Cette classe ne compte aucun élève affecté."}
              </p>
              {hasFilters && (
                <button className="ui-btn-secondary" onClick={() => setSearch("")} type="button">
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={gradesTable.allPageSelected}
                    indeterminate={
                      gradesTable.somePageSelected && !gradesTable.allPageSelected
                    }
                    onChange={gradesTable.toggleAllPage}
                  />
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Élève</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap w-28">Note</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Commentaire</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap">Statut</th>
                  <th className="px-lg py-sm ui-stat-label whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {gradesTable.pageRows.map(({ student, grade }, index) => {
                  const draft = drafts[student.id] ?? { score: "", comment: "" };
                  const validated = isGradeValidated(grade);
                  return (
                    <tr className={tableRowClass(index)} key={student.id}>
                      <DataTableSelectCell
                        checked={gradesTable.selectedIds.has(student.id)}
                        label={studentFullName(student)}
                        onChange={() => gradesTable.toggleOne(student.id)}
                      />
                      <td className="py-sm px-lg">
                        <div className="font-title-sm">{studentFullName(student)}</div>
                        <div className="text-on-surface-variant text-[12px] font-mono-data">
                          {student.matricule}
                        </div>
                      </td>
                      <td className="py-sm px-lg">
                        <input
                          aria-label={`Note de ${studentFullName(student)}`}
                          className="w-20 text-center bg-surface border border-outline-variant rounded py-1 disabled:opacity-50"
                          disabled={busy || (validated && !can(user, "grades.validate"))}
                          max={maxScore}
                          min={0}
                          onChange={(e) => setDraft(student.id, { score: e.target.value })}
                          step="0.01"
                          type="number"
                          value={draft.score}
                        />
                      </td>
                      <td className="py-sm px-lg">
                        <input
                          aria-label={`Commentaire ${studentFullName(student)}`}
                          className="w-full bg-surface border border-outline-variant rounded py-1 px-sm disabled:opacity-50"
                          disabled={busy || (validated && !can(user, "grades.validate"))}
                          onChange={(e) => setDraft(student.id, { comment: e.target.value })}
                          type="text"
                          value={draft.comment}
                        />
                      </td>
                      <td className="py-sm px-lg">
                        {grade ? (
                          validated ? (
                            <StatusBadge label="Validée" tone="success" />
                          ) : (
                            <StatusBadge label="Brouillon" tone="warning" />
                          )
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="py-sm px-lg">
                        <div className="flex justify-end gap-xs flex-wrap">
                          {(canCreate || canUpdate) && (
                            <button
                              className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                              disabled={busy}
                              onClick={() => void saveRow(student)}
                              type="button"
                            >
                              Enregistrer
                            </button>
                          )}
                          {grade && !validated && canValidate && (
                            <button
                              className="px-sm py-xs rounded bg-primary text-on-primary text-[11px] font-label-caps disabled:opacity-40"
                              disabled={busy}
                              onClick={() => void handleValidate(grade)}
                              type="button"
                            >
                              Valider
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <DataTablePagination
            canNextPage={gradesTable.canNextPage}
            canPreviousPage={gradesTable.canPreviousPage}
            entityLabel="élèves"
            from={gradesTable.from}
            onFirstPage={() => gradesTable.setPageIndex(0)}
            onLastPage={() => gradesTable.setPageIndex(gradesTable.pageCount - 1)}
            onNextPage={() => gradesTable.setPageIndex(gradesTable.pageIndex + 1)}
            onPageChange={gradesTable.setPageIndex}
            onPageSizeChange={gradesTable.setPageSize}
            onPreviousPage={() => gradesTable.setPageIndex(gradesTable.pageIndex - 1)}
            pageCount={gradesTable.pageCount}
            pageIndex={gradesTable.pageIndex}
            pageSize={gradesTable.pageSize}
            testId="grades-pagination"
            to={gradesTable.to}
            total={rows.length}
          />
        )}
      </DataTableShell>
    </div>
  );
}
