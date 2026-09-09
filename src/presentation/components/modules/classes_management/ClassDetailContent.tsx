"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CrudEditLink } from "@/presentation/components/forms/CrudLinks";
import { Select } from "@/presentation/components/shared/Select";
import {
  attachClassGroupStudent,
  detachClassGroupStudent,
  getClassGroup,
  listClassGroupStudents,
} from "@/infrastructure/api/resources/academic";
import { listStudents } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import type { ClassGroup, ClassMemberUser } from "@/shared/types/academic.types";
import { studentFullName, type Student } from "@/shared/types/student.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import { DetailSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

export function ClassDetailContent() {
  const confirmDialog = useConfirm();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const [klass, setKlass] = useState<ClassGroup | null>(null);
  const [members, setMembers] = useState<ClassMemberUser[]>([]);
  const [catalog, setCatalog] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [studentUserId, setStudentUserId] = useState("");

  const canUpdate = can(user, "classes.update");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [c, m, students] = await Promise.all([
        getClassGroup(id),
        listClassGroupStudents(id),
        listStudents(),
      ]);
      setKlass(c);
      setMembers(m);
      setCatalog(students);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setKlass(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const available = useMemo(() => {
    const linked = new Set(members.map((m) => m.id));
    return catalog.filter((s) => s.user_id && !linked.has(s.user_id));
  }, [catalog, members]);

  async function handleAttach(e: React.FormEvent) {
    e.preventDefault();
    if (!canUpdate || !studentUserId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await attachClassGroupStudent(id, Number(studentUserId));
      setNotice("Élève affecté à la classe.");
      setStudentUserId("");
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDetach(member: ClassMemberUser) {
    if (!canUpdate || !await confirmDialog(`Retirer ${member.name} de la classe ?`)) return;
    setSaving(true);
    setError(null);
    try {
      await detachClassGroupStudent(id, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setNotice("Élève retiré.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DetailSkeleton label="Chargement de la classe…" testId="class-detail-loading" />
    );
  }

  if (!klass) {
    return (
      <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
        {error || "Classe introuvable"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg w-full max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div>
          <p className="font-title-sm text-title-sm" data-testid="class-detail-name">
            {klass.name}
          </p>
          <p className="font-body-md text-on-surface-variant mt-xs">
            {klass.level?.name || "—"} · {klass.academic_year?.name || "—"}
          </p>
        </div>
        {canUpdate && (
          <CrudEditLink
            className="ui-btn-secondary inline-flex items-center gap-sm"
            recordId={String(klass.id)}
            resource="classes"
          />
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm">
          {notice}
        </div>
      )}

      <section className="ui-card ui-card-pad">
        <h2 className="font-headline-md mb-md">Élèves de la classe</h2>
        <p className="font-body-sm text-on-surface-variant mb-md">
          Affectation via le compte portail de l&apos;élève. Effectif :{" "}
          <span data-testid="class-members-count">{members.length}</span>
          {klass.max_capacity != null ? ` / ${klass.max_capacity}` : ""}
        </p>
        {members.length === 0 ? (
          <p data-testid="class-members-empty" className="font-body-sm text-on-surface-variant mb-md">
            Aucun élève affecté.
          </p>
        ) : (
          <ul className="space-y-sm mb-lg" data-testid="class-members-list">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-md rounded-lg bg-surface-container-low p-md"
              >
                <div>
                  <p className="font-title-sm">{m.name}</p>
                  <p className="font-body-sm text-on-surface-variant">{m.email}</p>
                </div>
                {canUpdate && (
                  <button
                    className="text-error font-label-caps text-label-caps disabled:opacity-50"
                    disabled={saving}
                    onClick={() => void handleDetach(m)}
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
          <form className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-md" onSubmit={handleAttach}>
            <Select
              ariaLabel="Élève à affecter"
              className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-sm"
              onChange={setStudentUserId}
              options={available.map((s) => ({
                value: String(s.user_id),
                label: `${studentFullName(s)} (${s.matricule})`,
              }))}
              placeholder="— Élève avec compte portail —"
              searchable
              value={studentUserId}
            />
            <button className="ui-btn-primary disabled:opacity-60" disabled={saving || !studentUserId} type="submit">
              Affecter
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
