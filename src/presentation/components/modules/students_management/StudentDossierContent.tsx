"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CrudEditLink } from "@/presentation/components/forms/CrudLinks";
import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import { DetailSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import {
  getStudentFull,
  uploadStudentDocument,
  uploadStudentPhoto,
} from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import {
  STUDENT_STATUS_LABELS,
  studentFullName,
  type StudentFullDossier,
  type StudentStatus,
} from "@/shared/types/student.types";

function statusTone(status: StudentStatus): "success" | "error" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "suspended") return "warning";
  return "error";
}

export function StudentDossierContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [dossier, setDossier] = useState<StudentFullDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"photo" | "document" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canUpdate = can(user, "students.update");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setDossier(await getStudentFull(id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setDossier(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onPhotoChange(file: File | undefined) {
    if (!file || !canUpdate) return;
    setUploading("photo");
    setNotice(null);
    setError(null);
    try {
      await uploadStudentPhoto(id, file);
      setNotice("Photo mise à jour.");
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setUploading(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function onDocumentChange(file: File | undefined) {
    if (!file || !canUpdate) return;
    setUploading("document");
    setNotice(null);
    setError(null);
    try {
      const meta = await uploadStudentDocument(id, file);
      setNotice(`Document « ${meta.file_name} » ajouté.`);
      await reload();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setUploading(null);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  }

  if (loading) {
    return <DetailSkeleton label="Chargement du dossier…" testId="dossier-loading" />;
  }

  if (error && !dossier) {
    return (
      <div className="space-y-md">
        <Link className="text-body-sm text-primary" href="/students">
          Retour aux élèves
        </Link>
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!dossier) return null;

  const { student } = dossier;

  return (
    <div className="flex flex-col gap-lg w-full max-w-5xl">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <p className="font-body-md text-on-surface-variant">
          Matricule {student.matricule}
        </p>
        <div className="flex items-center gap-sm">
          <StatusBadge
            label={STUDENT_STATUS_LABELS[student.status]}
            tone={statusTone(student.status)}
            withDot
          />
          {canUpdate && (
            <CrudEditLink
              className="inline-flex items-center gap-sm ui-btn-secondary"
              label="Modifier"
              recordId={String(student.id)}
              resource="students"
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
        <section className="ui-card ui-card-pad lg:col-span-1 flex flex-col gap-md">
          <div className="flex flex-col items-center gap-md">
            {student.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="w-32 h-32 rounded-full object-cover bg-surface-container-high"
                height={128}
                src={student.avatar_url}
                width={128}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px]">person</span>
              </div>
            )}
            <p className="font-title-sm text-title-sm text-center" data-testid="dossier-name">
              {studentFullName(student)}
            </p>
            {canUpdate && (
              <>
                <input
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => void onPhotoChange(e.target.files?.[0])}
                  ref={photoInputRef}
                  type="file"
                />
                <button
                  className="ui-btn-secondary"
                  disabled={uploading === "photo"}
                  onClick={() => photoInputRef.current?.click()}
                  type="button"
                >
                  {uploading === "photo" ? "Envoi…" : "Changer la photo"}
                </button>
              </>
            )}
          </div>
          <dl className="space-y-sm font-body-sm">
            <div>
              <dt className="ui-stat-label">E-mail</dt>
              <dd>{student.email || "—"}</dd>
            </div>
            <div>
              <dt className="ui-stat-label">Téléphone</dt>
              <dd>{student.phone || "—"}</dd>
            </div>
            <div>
              <dt className="ui-stat-label">Adresse</dt>
              <dd>{student.address || "—"}</dd>
            </div>
            <div>
              <dt className="ui-stat-label">Naissance</dt>
              <dd>{student.birth_date || "—"}</dd>
            </div>
          </dl>
        </section>

        <div className="lg:col-span-2 flex flex-col gap-lg">
          <section className="ui-card ui-card-pad">
            <h2 className="font-headline-md text-headline-md mb-md">Scolarité</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md font-body-sm">
              <div>
                <p className="ui-stat-label">Niveau</p>
                <p data-testid="dossier-level">{dossier.level?.name || student.level?.name || "—"}</p>
              </div>
              <div>
                <p className="ui-stat-label">Classe</p>
                <p data-testid="dossier-class">
                  {dossier.class?.name || student.class_group?.name || "—"}
                </p>
              </div>
              <div>
                <p className="ui-stat-label">Inscription</p>
                <p>{student.enrolled_at || "—"}</p>
              </div>
              <div>
                <p className="ui-stat-label">Sexe</p>
                <p>{student.gender === "F" ? "Féminin" : "Masculin"}</p>
              </div>
            </div>
          </section>

          <section className="ui-card ui-card-pad">
            <div className="flex items-center justify-between mb-md gap-md flex-wrap">
              <h2 className="font-headline-md text-headline-md">Documents</h2>
              {canUpdate && (
                <>
                  <input
                    accept=".pdf,image/*"
                    className="sr-only"
                    onChange={(e) => void onDocumentChange(e.target.files?.[0])}
                    ref={docInputRef}
                    type="file"
                  />
                  <button
                    className="ui-btn-secondary"
                    disabled={uploading === "document"}
                    onClick={() => docInputRef.current?.click()}
                    type="button"
                  >
                    {uploading === "document" ? "Envoi…" : "Ajouter un document"}
                  </button>
                </>
              )}
            </div>
            <p className="font-body-sm text-on-surface-variant">
              Ajoutez un PDF ou une image au dossier élève (collection média API).
            </p>
          </section>

          <section className="ui-card ui-card-pad">
            <h2 className="font-headline-md text-headline-md mb-md">Historique scolaire</h2>
            {dossier.histories.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant">Aucun historique.</p>
            ) : (
              <ul className="space-y-sm font-body-sm" data-testid="dossier-histories">
                {dossier.histories.map((h) => (
                  <li key={h.id} className="rounded-lg bg-surface-container-low p-md">
                    {h.academic_year?.name || "Année"} — {h.class_group?.name || "Classe"} /{" "}
                    {h.level?.name || "Niveau"}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ui-card ui-card-pad">
            <h2 className="font-headline-md text-headline-md mb-md">Bulletins</h2>
            {dossier.report_cards.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant">Aucun bulletin.</p>
            ) : (
              <ul className="space-y-sm font-body-sm">
                {dossier.report_cards.map((rc) => (
                  <li key={rc.id} className="rounded-lg bg-surface-container-low p-md">
                    Bulletin #{rc.id} — {rc.status || "—"}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ui-card ui-card-pad">
            <div className="flex items-center justify-between gap-md mb-md">
              <h2 className="font-headline-md text-headline-md">Discipline</h2>
              <Link
                className="font-label-caps text-label-caps text-primary hover:underline"
                href={`/discipline?student_id=${dossier.student.id}`}
              >
                Voir tout
              </Link>
            </div>
            {dossier.discipline.length === 0 ? (
              <p className="font-body-sm text-on-surface-variant">Aucun incident.</p>
            ) : (
              <ul className="space-y-sm font-body-sm" data-testid="dossier-discipline">
                {dossier.discipline.map((d) => (
                  <li key={d.id} className="rounded-lg bg-surface-container-low p-md">
                    <div className="font-title-sm">{d.title || `Incident #${d.id}`}</div>
                    <div className="text-on-surface-variant text-[12px]">
                      {d.occurred_at || "—"} — {d.type || "—"}
                      {d.status ? ` · ${d.status}` : ""}
                    </div>
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
