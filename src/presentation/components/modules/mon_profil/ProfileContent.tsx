"use client";

import { useAuth } from "@/infrastructure/auth/AuthProvider";
import { DetailSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

export function ProfileContent() {
  const { user, status, logout } = useAuth();

  if (status === "loading") {
    return (
      <div className="px-md py-lg">
        <DetailSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-md py-lg">
        <p className="font-body-md text-on-surface-variant">Session introuvable.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-xl mx-auto px-md">
      <div>
        <h1 className="ui-page-title">Mon profil</h1>
        <p className="font-body-md text-on-surface-variant mt-sm">
          Informations du compte (lecture seule — pas de mise à jour côté API).
        </p>
      </div>

      <div className="ui-card ui-card-pad flex flex-col gap-md" data-testid="profile-card">
        <div>
          <span className="ui-stat-label">Nom</span>
          <div className="font-title-md text-on-surface mt-xs">{user.name}</div>
        </div>
        <div>
          <span className="ui-stat-label">E-mail</span>
          <div className="font-body-md text-on-surface mt-xs">{user.email}</div>
        </div>
        <div>
          <span className="ui-stat-label">Rôles</span>
          <div className="font-body-md text-on-surface mt-xs">
            {user.roles?.length ? user.roles.join(", ") : "—"}
          </div>
        </div>
        <div>
          <span className="ui-stat-label">Établissement</span>
          <div className="font-body-md text-on-surface mt-xs">
            {user.institution?.name ?? (user.institution_id ? `#${user.institution_id}` : "—")}
          </div>
        </div>
        <div>
          <span className="ui-stat-label">Compte créé</span>
          <div className="font-body-md text-on-surface mt-xs">
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString("fr-FR")
              : "—"}
          </div>
        </div>
      </div>

      <button type="button" className="ui-btn-secondary self-start" onClick={() => void logout()}>
        Se déconnecter
      </button>
    </div>
  );
}
