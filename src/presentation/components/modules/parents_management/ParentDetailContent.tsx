"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CrudEditLink } from "@/presentation/components/forms/CrudLinks";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { DetailSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  attachGuardianStudent,
  detachGuardianStudent,
  getGuardian,
  listGuardianStudents,
} from "@/infrastructure/api/resources/guardians";
import { listStudents } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  GUARDIAN_RELATIONSHIP_LABELS,
  guardianFullName,
  type Guardian,
  type GuardianRelationship,
} from "@/shared/types/guardian.types";
import { studentFullName, type Student } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

export function ParentDetailContent() {
  const confirmDialog = useConfirm();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();

  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [linked, setLinked] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [relationship, setRelationship] = useState<GuardianRelationship>("pere");
  const [isPrimary, setIsPrimary] = useState(false);

  const canUpdate = can(user, "guardians.update");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [g, students, catalog] = await Promise.all([
        getGuardian(id),
        listGuardianStudents(id),
        listStudents(),
      ]);
      setGuardian(g);
      setLinked(students);
      setAllStudents(catalog);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setGuardian(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const availableStudents = useMemo(() => {
    const linkedIds = new Set(linked.map((s) => s.id));
    return allStudents.filter((s) => !linkedIds.has(s.id));
  }, [allStudents, linked]);

  async function handleAttach(e: React.FormEvent) {
    e.preventDefault();
    if (!canUpdate || !studentId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await attachGuardianStudent(id, {
        student_id: Number(studentId),
        relationship,
        is_primary: isPrimary,
      });
      setNotice("Élève lié au parent.");
      setStudentId("");
      setIsPrimary(false);
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDetach(student: Student) {
    if (!canUpdate) return;
    if (!await confirmDialog(`Dissocier ${studentFullName(student)} ?`)) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await detachGuardianStudent(id, student.id);
      setNotice("Élève dissocié.");
      setLinked((prev) => prev.filter((s) => s.id !== student.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DetailSkeleton
        label="Chargement de la fiche parent…"
        testId="parent-detail-loading"
      />
    );
  }

  if (error && !guardian) {
    return (
      <div className="space-y-md">
        <Link className="text-body-sm text-primary" href="/parents">
          Retour aux parents
        </Link>
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!guardian) return null;

  return (
    <div className="flex flex-col gap-lg w-full max-w-5xl">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div>
          <p className="font-title-sm text-title-sm" data-testid="parent-detail-name">
            {guardianFullName(guardian)}
          </p>
          <p className="font-body-md text-on-surface-variant mt-xs">{guardian.email}</p>
        </div>
        <div className="flex items-center gap-sm">
          <StatusBadge
            label={guardian.user_id ? "Portail actif" : "Sans portail"}
            tone={guardian.user_id ? "success" : "neutral"}
            withDot
          />
          {canUpdate && (
            <CrudEditLink
              className="inline-flex items-center gap-sm ui-btn-secondary"
              recordId={String(guardian.id)}
              resource="parents"
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
        <section className="ui-card ui-card-pad lg:col-span-1 space-y-sm font-body-sm">
          <h2 className="font-headline-md text-headline-md mb-md">Coordonnées</h2>
          <div>
            <p className="ui-stat-label">Téléphone</p>
            <p>{guardian.phone}</p>
          </div>
          <div>
            <p className="ui-stat-label">Profession</p>
            <p>{guardian.profession || "—"}</p>
          </div>
          <div>
            <p className="ui-stat-label">Adresse</p>
            <p>{guardian.address || "—"}</p>
          </div>
          <div>
            <p className="ui-stat-label">Élèves liés</p>
            <p data-testid="parent-linked-count">{linked.length}</p>
          </div>
        </section>

        <div className="lg:col-span-2 flex flex-col gap-lg">
          <section className="ui-card ui-card-pad">
            <h2 className="font-headline-md text-headline-md mb-md">Élèves liés</h2>
            {linked.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant" data-testid="parent-linked-empty">
                Aucun élève lié pour le moment.
              </p>
            ) : (
              <ul className="space-y-sm" data-testid="parent-linked-list">
                {linked.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between gap-md rounded-lg bg-surface-container-low p-md"
                  >
                    <div>
                      <Link
                        className="font-title-sm text-title-sm hover:text-primary"
                        href={`/students/${student.id}`}
                      >
                        {studentFullName(student)}
                      </Link>
                      <p className="font-body-sm text-on-surface-variant">
                        {student.matricule}
                        {student.class_group?.name ? ` · ${student.class_group.name}` : ""}
                      </p>
                    </div>
                    {canUpdate && (
                      <button
                        className="text-error hover:bg-error-container/30 font-label-caps text-label-caps px-sm py-xs rounded disabled:opacity-50"
                        disabled={saving}
                        onClick={() => void handleDetach(student)}
                        type="button"
                      >
                        Dissocier
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canUpdate && (
            <section className="ui-card ui-card-pad">
              <h2 className="font-headline-md text-headline-md mb-md">Lier un élève</h2>
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-md" onSubmit={handleAttach}>
                <div className="sm:col-span-2">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs" htmlFor="attach-student">
                    Élève
                  </label>
                  <select
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-sm"
                    id="attach-student"
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    value={studentId}
                  >
                    <option value="">— Sélectionner —</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {studentFullName(s)} ({s.matricule})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs" htmlFor="attach-rel">
                    Lien de parenté
                  </label>
                  <select
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-sm"
                    id="attach-rel"
                    onChange={(e) => setRelationship(e.target.value as GuardianRelationship)}
                    value={relationship}
                  >
                    {(Object.keys(GUARDIAN_RELATIONSHIP_LABELS) as GuardianRelationship[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {GUARDIAN_RELATIONSHIP_LABELS[key]}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-sm text-body-sm">
                    <input
                      checked={isPrimary}
                      className="w-4 h-4 rounded text-primary"
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      type="checkbox"
                    />
                    Contact principal
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <button
                    className="ui-btn-primary disabled:opacity-60"
                    disabled={saving || !studentId || availableStudents.length === 0}
                    type="submit"
                  >
                    {saving ? "Liaison…" : "Lier l'élève"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
