"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listAssignments,
  listSubmissions,
  submitAssignment,
} from "@/infrastructure/api/resources/assignments";
import { getAuthErrorMessage, useAuth } from "@/infrastructure/auth/AuthProvider";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { isStudentUser } from "@/shared/lib/permissions";
import {
  formatDueAt,
  isAssignmentPastDue,
  SUBMISSION_STATUS_LABELS,
  type Assignment,
  type AssignmentSubmission,
} from "@/shared/types/assignments.types";

export function AssignmentsContent() {
  const { user } = useAuth();
  const canSubmit = isStudentUser(user);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [rows, subs] = await Promise.all([
        listAssignments(),
        listSubmissions().catch(() => [] as AssignmentSubmission[]),
      ]);
      setAssignments(rows);
      setSubmissions(subs);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const submissionByAssignment = useMemo(() => {
    const map = new Map<number, AssignmentSubmission>();
    for (const s of submissions) {
      const prev = map.get(s.assignment_id);
      if (!prev || (s.submitted_at ?? "") > (prev.submitted_at ?? "")) {
        map.set(s.assignment_id, s);
      }
    }
    return map;
  }, [submissions]);

  async function handleSubmit(assignment: Assignment) {
    if (!canSubmit) return;
    const selected = files ? Array.from(files) : [];
    if (selected.length === 0) {
      setError("Ajoutez au moins un fichier pour rendre le devoir.");
      return;
    }
    setBusyId(assignment.id);
    setError(null);
    setNotice(null);
    try {
      const submission = await submitAssignment(assignment.id, {
        comment,
        files: selected,
      });
      setSubmissions((prev) => [
        submission,
        ...prev.filter((s) => s.assignment_id !== assignment.id),
      ]);
      setNotice(`Devoir « ${assignment.title} » rendu.`);
      setOpenId(null);
      setComment("");
      setFiles(null);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-5xl mx-auto px-md">
      <div>
        <h1 className="ui-page-title">Devoirs</h1>
        <p className="font-body-md text-on-surface-variant mt-sm">
          {canSubmit
            ? "Consultez et rendez vos devoirs (fichiers requis)."
            : "Devoirs publiés pour vos enfants (consultation)."}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm font-body-sm">
          {notice}
        </div>
      )}

      {loading && <ContentSkeleton variant="list" />}

      {!loading && assignments.length === 0 && !error && (
        <p className="font-body-md text-on-surface-variant" data-testid="assignments-empty">
          Aucun devoir publié.
        </p>
      )}

      {!loading && assignments.length > 0 && (
        <ul className="flex flex-col gap-md" data-testid="assignments-list">
          {assignments.map((a) => {
            const sub = submissionByAssignment.get(a.id);
            const graded = sub?.status === "GRADED";
            return (
              <li key={a.id} className="ui-card ui-card-pad flex flex-col gap-sm">
                <div className="flex justify-between gap-md flex-wrap">
                  <div>
                    <h2 className="font-title-sm text-on-surface">{a.title}</h2>
                    <p className="font-body-sm text-on-surface-variant mt-xs">
                      {a.subject?.name ?? "Matière"} · {a.class_group?.name ?? "Classe"}
                    </p>
                    <p className="font-body-sm text-on-surface-variant">
                      Échéance : {formatDueAt(a.due_at)}
                      {isAssignmentPastDue(a) ? " (passée)" : ""}
                    </p>
                  </div>
                  <div className="font-label-caps text-[11px] text-on-surface-variant">
                    {sub
                      ? SUBMISSION_STATUS_LABELS[sub.status] ?? sub.status
                      : "À rendre"}
                    {sub?.score != null ? ` · ${sub.score}/${a.max_score ?? "—"}` : ""}
                  </div>
                </div>

                {a.description && (
                  <p className="font-body-sm text-on-surface-variant">{a.description}</p>
                )}

                {canSubmit && !graded && (
                  <>
                    {openId === a.id ? (
                      <div className="flex flex-col gap-sm border-t border-outline-variant/30 pt-sm">
                        <label className="font-body-sm text-on-surface-variant">
                          Commentaire (optionnel)
                          <textarea
                            className="ui-input mt-xs w-full"
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                        </label>
                        <label className="font-body-sm text-on-surface-variant">
                          Fichiers
                          <input
                            type="file"
                            multiple
                            className="mt-xs block w-full text-sm"
                            onChange={(e) => setFiles(e.target.files)}
                          />
                        </label>
                        <div className="flex gap-sm flex-wrap">
                          <button
                            type="button"
                            className="ui-btn-primary"
                            disabled={busyId === a.id}
                            onClick={() => void handleSubmit(a)}
                          >
                            {busyId === a.id ? "Envoi…" : "Envoyer"}
                          </button>
                          <button
                            type="button"
                            className="ui-btn-secondary"
                            onClick={() => {
                              setOpenId(null);
                              setComment("");
                              setFiles(null);
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="ui-btn-primary self-start"
                        onClick={() => {
                          setOpenId(a.id);
                          setComment("");
                          setFiles(null);
                        }}
                      >
                        {sub ? "Mettre à jour le rendu" : "Rendre le devoir"}
                      </button>
                    )}
                  </>
                )}

                {sub?.feedback && (
                  <p className="font-body-sm text-on-surface-variant">
                    Feedback : {sub.feedback}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
