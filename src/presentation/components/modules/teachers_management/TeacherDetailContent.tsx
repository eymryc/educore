"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CrudEditLink } from "@/presentation/components/forms/CrudLinks";
import { Select } from "@/presentation/components/shared/Select";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { DetailSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  listAcademicYears,
  listClassGroups,
  listSubjects,
} from "@/infrastructure/api/resources/academic";
import {
  createTeacherAssignment,
  deleteTeacherAssignment,
  getTeacher,
  listTeacherAssignments,
  listTeacherHistories,
} from "@/infrastructure/api/resources/teachers";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { classGroupsForActiveYear } from "@/shared/types/academic.types";
import type { AcademicRef } from "@/shared/types/student.types";
import {
  TEACHER_STATUS_LABELS,
  teacherFullName,
  type SubjectRef,
  type Teacher,
  type TeacherAssignment,
  type TeacherHistory,
  type TeacherStatus,
} from "@/shared/types/teacher.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

function statusTone(status: TeacherStatus): "success" | "error" | "warning" | "neutral" | "info" {
  if (status === "active") return "success";
  if (status === "on_leave") return "info";
  if (status === "suspended") return "warning";
  return "error";
}

export function TeacherDetailContent() {
  const confirmDialog = useConfirm();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [histories, setHistories] = useState<TeacherHistory[]>([]);
  const [subjects, setSubjects] = useState<SubjectRef[]>([]);
  const [classGroups, setClassGroups] = useState<AcademicRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [classGroupId, setClassGroupId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const canUpdate = can(user, "teachers.update");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [t, assigns, hist, subjectList, classList, yearList] = await Promise.all([
        getTeacher(id),
        listTeacherAssignments(id),
        listTeacherHistories(id).catch(() => [] as TeacherHistory[]),
        listSubjects(),
        listClassGroups(),
        listAcademicYears(),
      ]);
      setTeacher(t);
      setAssignments(assigns);
      setHistories(hist);
      setSubjects(subjectList);
      setClassGroups(classGroupsForActiveYear(classList, yearList));
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setTeacher(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!canUpdate || !classGroupId || !subjectId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await createTeacherAssignment(id, {
        class_group_id: Number(classGroupId),
        subject_id: Number(subjectId),
      });
      setNotice("Affectation créée.");
      setClassGroupId("");
      setSubjectId("");
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveAssignment(assignment: TeacherAssignment) {
    if (!canUpdate) return;
    if (!await confirmDialog("Supprimer cette affectation ?")) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await deleteTeacherAssignment(assignment.id);
      setNotice("Affectation supprimée.");
      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DetailSkeleton
        label="Chargement de la fiche enseignant…"
        testId="teacher-detail-loading"
      />
    );
  }

  if (error && !teacher) {
    return (
      <div className="space-y-md">
        <Link className="text-body-sm text-primary" href="/teachers">
          Retour aux enseignants
        </Link>
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!teacher) return null;

  return (
    <div className="flex flex-col gap-lg w-full max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div>
          <p className="font-title-sm text-title-sm" data-testid="teacher-detail-name">
            {teacherFullName(teacher)}
          </p>
          <p className="font-body-md text-on-surface-variant mt-xs">
            {teacher.employee_number} · {teacher.email}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <StatusBadge
            label={TEACHER_STATUS_LABELS[teacher.status]}
            tone={statusTone(teacher.status)}
            withDot
          />
          {canUpdate && (
            <CrudEditLink
              className="inline-flex items-center gap-sm ui-btn-secondary"
              recordId={String(teacher.id)}
              resource="teachers"
            />
          )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <section className="ui-card ui-card-pad space-y-sm font-body-sm">
          <h2 className="font-headline-md text-headline-md mb-md">Profil</h2>
          <div>
            <p className="ui-stat-label">Téléphone</p>
            <p>{teacher.phone}</p>
          </div>
          <div>
            <p className="ui-stat-label">Matière principale</p>
            <p data-testid="teacher-main-subject">{teacher.main_subject?.name || "—"}</p>
          </div>
          <div>
            <p className="ui-stat-label">Grade</p>
            <p>{teacher.grade_title || "—"}</p>
          </div>
          <div>
            <p className="ui-stat-label">Embauche</p>
            <p>{teacher.hired_at || "—"}</p>
          </div>
          <div>
            <p className="ui-stat-label">Compte utilisateur</p>
            <p>{teacher.user_id ? "Oui (portail)" : "Non — requis pour affectations"}</p>
          </div>
        </section>

        <div className="lg:col-span-2 flex flex-col gap-lg">
          <section className="ui-card ui-card-pad">
            <h2 className="font-headline-md text-headline-md mb-md">Affectations classe / matière</h2>
            {assignments.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant" data-testid="teacher-assignments-empty">
                Aucune affectation.
              </p>
            ) : (
              <ul className="space-y-sm mb-lg" data-testid="teacher-assignments-list">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-md rounded-lg bg-surface-container-low p-md"
                  >
                    <div className="font-body-sm">
                      <span className="font-title-sm">{a.subject?.name || `Matière #${a.subject_id}`}</span>
                      <span className="text-on-surface-variant">
                        {" "}
                        · {a.class_group?.name || `Classe #${a.class_group_id}`}
                      </span>
                    </div>
                    {canUpdate && (
                      <button
                        className="text-error font-label-caps text-label-caps px-sm py-xs rounded hover:bg-error-container/30 disabled:opacity-50"
                        disabled={saving}
                        onClick={() => void handleRemoveAssignment(a)}
                        type="button"
                      >
                        Retirer
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canUpdate && (
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-md border-t border-outline-variant/20 pt-md" onSubmit={handleAssign}>
                {!teacher.user_id && (
                  <p className="sm:col-span-2 font-body-sm text-error">
                    Cet enseignant n&apos;a pas de compte utilisateur : créez-en un ou recréez avec
                    l&apos;option portail pour pouvoir affecter.
                  </p>
                )}
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs" htmlFor="assign-class">
                    Classe
                  </label>
                  <Select
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-sm"
                    disabled={!teacher.user_id}
                    id="assign-class"
                    onChange={setClassGroupId}
                    options={classGroups.map((c) => ({ value: String(c.id), label: c.name }))}
                    placeholder="— Sélectionner —"
                    searchable
                    value={classGroupId}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs" htmlFor="assign-subject">
                    Matière
                  </label>
                  <Select
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-sm"
                    disabled={!teacher.user_id}
                    id="assign-subject"
                    onChange={setSubjectId}
                    options={subjects.map((s) => ({ value: String(s.id), label: s.name }))}
                    placeholder="— Sélectionner —"
                    searchable
                    value={subjectId}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    className="ui-btn-primary disabled:opacity-60"
                    disabled={saving || !teacher.user_id || !classGroupId || !subjectId}
                    type="submit"
                  >
                    {saving ? "Enregistrement…" : "Ajouter l'affectation"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="ui-card ui-card-pad">
            <h2 className="font-headline-md text-headline-md mb-md">Historique</h2>
            {histories.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant">Aucun événement.</p>
            ) : (
              <ul className="space-y-sm font-body-sm" data-testid="teacher-histories">
                {histories.map((h) => (
                  <li key={h.id} className="rounded-lg bg-surface-container-low p-md">
                    <span className="font-title-sm">{h.event_type}</span>
                    {h.notes ? ` — ${h.notes}` : ""}
                    {h.recorded_at ? (
                      <span className="block text-on-surface-variant text-[12px] mt-xs">
                        {new Date(h.recorded_at).toLocaleString("fr-FR")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
