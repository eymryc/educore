"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CrudCreateLink, CrudEditLink } from "@/presentation/components/forms/CrudLinks";
import {
  getGradingSettings,
  updateGradingSettings,
} from "@/infrastructure/api/resources/grades";
import {
  deleteBuilding,
  deleteCampus,
  deleteInstitutionRoom,
  getInstitution,
  listBuildings,
  listCampuses,
  listInstitutionRooms,
  updateInstitution,
} from "@/infrastructure/api/resources/institution";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { AcademicStructureContent } from "@/presentation/components/modules/academic_structure/AcademicStructureContent";
import { SecurityAuditLogsContent } from "@/presentation/components/modules/security_audit_logs/SecurityAuditLogsContent";
import { SettingsRolesContent } from "@/presentation/components/modules/system_settings/SettingsRolesContent";
import { SettingsUsersContent } from "@/presentation/components/modules/system_settings/SettingsUsersContent";
import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { DATA_TABLE_CREATE_CLASS } from "@/presentation/components/shared/DataTable";
import {
  FormSkeleton,
  PanelSkeleton,
} from "@/presentation/components/shared/DataTableSkeleton";
import { can } from "@/shared/lib/permissions";
import type { GradingSetting } from "@/shared/types/grades.types";
import {
  institutionToForm,
  type Building,
  type Campus,
  type InstitutionRoom,
} from "@/shared/types/institution.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

type SettingsTab = "profile" | "sites" | "grading" | "academic" | "users" | "roles" | "security";

const SETTINGS_TABS: SettingsTab[] = [
  "profile",
  "sites",
  "grading",
  "academic",
  "users",
  "roles",
  "security",
];
const WIDE_TABS: SettingsTab[] = ["academic", "users", "roles", "security"];

const SETTINGS_NAV: { id: SettingsTab; icon: string; label: string; hint: string }[] = [
  { id: "profile", icon: "apartment", label: "Profil établissement", hint: "Identité et coordonnées" },
  { id: "sites", icon: "domain", label: "Campus & salles", hint: "Sites, bâtiments, salles" },
  { id: "grading", icon: "grade", label: "Règles de notation", hint: "Barème et moyennes" },
  { id: "academic", icon: "calendar_month", label: "Année académique", hint: "Années, périodes, niveaux" },
  { id: "users", icon: "group", label: "Utilisateurs", hint: "Comptes et accès" },
  { id: "roles", icon: "admin_panel_settings", label: "Rôles & permissions", hint: "Droits Spatie" },
  { id: "security", icon: "shield", label: "Journal d'audit", hint: "Historique des actions" },
];

const ROOM_TYPE_LABELS: Record<string, string> = {
  classroom: "Salle de classe",
  lab: "Laboratoire",
  laboratory: "Laboratoire",
  office: "Bureau",
  library: "Bibliothèque",
  gym: "Gymnase",
  amphitheater: "Amphithéâtre",
  other: "Autre",
};

const CARD_CLASS =
  "rounded-xl border border-outline-variant/30 bg-white overflow-hidden shadow-[0_2px_4px_rgb(15_23_42/0.06),0_8px_24px_rgb(15_23_42/0.1),0_20px_48px_rgb(15_23_42/0.12)]";

const INPUT_CLASS = "ui-input w-full";

const SAVE_CLASS =
  "inline-flex items-center justify-center gap-sm h-10 px-lg rounded-lg bg-primary text-on-primary font-label-caps text-label-caps shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors";

function initialTabFrom(raw: string | null): SettingsTab {
  return SETTINGS_TABS.includes(raw as SettingsTab) ? (raw as SettingsTab) : "profile";
}

function institutionInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "E"
  );
}

function roomTypeLabel(type: string | null | undefined): string | null {
  if (!type) return null;
  return ROOM_TYPE_LABELS[type.toLowerCase()] ?? type;
}

function SettingsField({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-xs min-w-0">
      <label className="ui-stat-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-on-surface-variant/80">{hint}</p> : null}
    </div>
  );
}

function AlertBanner({
  tone,
  children,
  testId,
}: {
  tone: "error" | "success";
  children: ReactNode;
  testId?: string;
}) {
  const cls =
    tone === "error"
      ? "bg-error-container text-on-error-container"
      : "bg-secondary-container text-on-secondary-container";
  return (
    <div
      className={`flex items-start gap-sm rounded-lg px-md py-sm font-body-sm ${cls}`}
      data-testid={testId}
      role={tone === "error" ? "alert" : undefined}
    >
      <span className="material-symbols-outlined text-[18px] shrink-0 mt-px">
        {tone === "error" ? "error" : "check_circle"}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function EmptySites({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center text-center px-md py-xl">
      <span className="w-12 h-12 rounded-xl bg-surface-container-low inline-flex items-center justify-center mb-sm">
        <span className="material-symbols-outlined text-[22px] text-on-surface-variant/55">{icon}</span>
      </span>
      <p className="font-body-sm text-on-surface">{title}</p>
      <p className="text-[12px] text-on-surface-variant mt-xs max-w-xs">{hint}</p>
    </div>
  );
}

function SiteRow({
  icon,
  title,
  meta,
  editResource,
  editId,
  canEdit,
  canDelete,
  deleting,
  onDelete,
}: {
  icon: string;
  title: string;
  meta: string;
  editResource: string;
  editId: number;
  canEdit: boolean;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-md px-md py-md rounded-xl bg-surface-container-low/70 hover:bg-surface-container-high/60 transition-colors">
      <span className="w-10 h-10 rounded-lg bg-white shadow-sm inline-flex items-center justify-center shrink-0 text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[14px] text-on-surface leading-snug break-words">{title}</p>
        <p className="text-[12px] text-on-surface-variant mt-0.5 break-words">{meta}</p>
      </div>
      <div className="flex items-center gap-xs shrink-0">
        {canEdit && <CrudEditLink recordId={String(editId)} resource={editResource} />}
        {canDelete && (
          <button
            aria-label="Supprimer"
            className="p-sm rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors disabled:opacity-40"
            disabled={deleting}
            onClick={onDelete}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        )}
      </div>
    </li>
  );
}

export function SystemSettingsContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => initialTabFrom(searchParams.get("tab")));

  const [name, setName] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [establishmentYear, setEstablishmentYear] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logo, setLogo] = useState("");
  const [logoBroken, setLogoBroken] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<InstitutionRoom[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesBusy, setSitesBusy] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);

  const [grading, setGrading] = useState<GradingSetting | null>(null);
  const [scaleMax, setScaleMax] = useState("20");
  const [passingScore, setPassingScore] = useState("10");
  const [decimalPlaces, setDecimalPlaces] = useState("2");
  const [weightedAverage, setWeightedAverage] = useState(true);
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingSaving, setGradingSaving] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [gradingNotice, setGradingNotice] = useState<string | null>(null);

  const canViewSettings = can(user, "settings.view");
  const canUpdateSettings = can(user, "settings.update");
  const canCreateSettings = can(user, "settings.create");
  const canDeleteSettings = can(user, "settings.delete");
  const canUpdateGrading = can(user, "grades.update");

  const campusById = useMemo(() => new Map(campuses.map((c) => [c.id, c])), [campuses]);
  const buildingById = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);

  const scaleMaxNum = Number(scaleMax);
  const passingNum = Number(passingScore);
  const passingPct =
    Number.isFinite(scaleMaxNum) && scaleMaxNum > 0 && Number.isFinite(passingNum)
      ? Math.min(100, Math.max(0, (passingNum / scaleMaxNum) * 100))
      : 50;

  useEffect(() => {
    setLogoBroken(false);
  }, [logo]);

  useEffect(() => {
    if (tab !== "profile" || !canViewSettings) return;
    let cancelled = false;
    async function load() {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const inst = await getInstitution();
        if (cancelled) return;
        const form = institutionToForm(inst);
        setName(form.name);
        setRegistrationCode(form.registration_code);
        setEstablishmentYear(form.establishment_year);
        setAddress(form.address);
        setPhone(form.phone);
        setEmail(form.email);
        setLogo(form.logo);
      } catch (err) {
        if (!cancelled) setProfileError(getAuthErrorMessage(err));
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, canViewSettings]);

  useEffect(() => {
    if (tab !== "sites" || !canViewSettings) return;
    let cancelled = false;
    async function load() {
      setSitesLoading(true);
      setSitesError(null);
      try {
        const [c, b, r] = await Promise.all([
          listCampuses(),
          listBuildings(),
          listInstitutionRooms(),
        ]);
        if (cancelled) return;
        setCampuses(c);
        setBuildings(b);
        setRooms(r);
      } catch (err) {
        if (!cancelled) setSitesError(getAuthErrorMessage(err));
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab, canViewSettings]);

  useEffect(() => {
    if (tab !== "grading") return;
    let cancelled = false;
    async function load() {
      setGradingLoading(true);
      setGradingError(null);
      try {
        const settings = await getGradingSettings();
        if (cancelled) return;
        setGrading(settings);
        setScaleMax(String(settings.scale_max ?? "20"));
        setPassingScore(String(settings.passing_score ?? "10"));
        setDecimalPlaces(String(settings.decimal_places ?? 2));
        setWeightedAverage(Boolean(settings.weighted_average));
      } catch (err) {
        if (!cancelled) setGradingError(getAuthErrorMessage(err));
      } finally {
        if (!cancelled) setGradingLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  async function saveProfile() {
    if (!canUpdateSettings) return;
    setProfileSaving(true);
    setProfileError(null);
    setProfileNotice(null);
    try {
      const updated = await updateInstitution({
        name,
        registration_code: registrationCode || null,
        establishment_year: establishmentYear === "" ? null : Number(establishmentYear),
        address: address || null,
        phone: phone || null,
        email: email || null,
        logo: logo || null,
      });
      const form = institutionToForm(updated);
      setName(form.name);
      setRegistrationCode(form.registration_code);
      setEstablishmentYear(form.establishment_year);
      setAddress(form.address);
      setPhone(form.phone);
      setEmail(form.email);
      setLogo(form.logo);
      setProfileNotice("Profil établissement enregistré.");
    } catch (err) {
      setProfileError(getAuthErrorMessage(err));
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveGrading() {
    if (!canUpdateGrading) return;
    setGradingSaving(true);
    setGradingError(null);
    setGradingNotice(null);
    try {
      const updated = await updateGradingSettings({
        scale_max: Number(scaleMax),
        passing_score: Number(passingScore),
        decimal_places: Number(decimalPlaces),
        weighted_average: weightedAverage,
        ranking_method: grading?.ranking_method ?? "weighted_average_desc",
      });
      setGrading(updated);
      setGradingNotice("Paramètres de notation enregistrés.");
    } catch (err) {
      setGradingError(getAuthErrorMessage(err));
    } finally {
      setGradingSaving(false);
    }
  }

  async function handleDeleteCampus(row: Campus) {
    if (!canDeleteSettings) return;
    if (!await confirmDialog(`Supprimer le campus « ${row.name} » ?`)) return;
    setSitesBusy(true);
    try {
      await deleteCampus(row.id);
      setCampuses((prev) => prev.filter((c) => c.id !== row.id));
    } catch (err) {
      setSitesError(getAuthErrorMessage(err));
    } finally {
      setSitesBusy(false);
    }
  }

  async function handleDeleteBuilding(row: Building) {
    if (!canDeleteSettings) return;
    if (!await confirmDialog(`Supprimer le bâtiment « ${row.name} » ?`)) return;
    setSitesBusy(true);
    try {
      await deleteBuilding(row.id);
      setBuildings((prev) => prev.filter((b) => b.id !== row.id));
    } catch (err) {
      setSitesError(getAuthErrorMessage(err));
    } finally {
      setSitesBusy(false);
    }
  }

  async function handleDeleteRoom(row: InstitutionRoom) {
    if (!canDeleteSettings) return;
    if (!await confirmDialog(`Supprimer la salle « ${row.name} » ?`)) return;
    setSitesBusy(true);
    try {
      await deleteInstitutionRoom(row.id);
      setRooms((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setSitesError(getAuthErrorMessage(err));
    } finally {
      setSitesBusy(false);
    }
  }

  const showLogo = Boolean(logo) && !logoBroken;

  return (
    <div className="flex flex-col lg:flex-row w-full gap-md lg:gap-lg min-w-0 pb-xl">
      <aside className="lg:w-60 xl:w-64 shrink-0 min-w-0">
        <nav
          aria-label="Sections des paramètres"
          className="flex lg:flex-col gap-xs overflow-x-auto lg:overflow-visible -mx-sm px-sm py-xs lg:py-0 lg:mx-0 lg:px-0 lg:sticky lg:top-24 rounded-xl bg-surface-container-low/60 lg:bg-transparent"
        >
          {SETTINGS_NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-sm lg:gap-md shrink-0 lg:w-full text-left rounded-xl px-md py-sm lg:py-md transition-colors ${
                  active
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
                key={item.id}
                onClick={() => setTab(item.id)}
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-[22px] shrink-0 ${
                    active ? "text-on-primary-container" : "text-on-surface-variant"
                  }`}
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-[13px] lg:text-[14px] leading-tight whitespace-nowrap lg:whitespace-normal">
                    {item.label}
                  </span>
                  <span
                    className={`hidden lg:block text-[11px] leading-snug mt-0.5 ${
                      active ? "text-on-primary-container/75" : "text-on-surface-variant/80"
                    }`}
                  >
                    {item.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div
        className={`flex-1 min-w-0 ${WIDE_TABS.includes(tab) ? "" : "max-w-3xl xl:max-w-4xl"}`}
      >
        {tab === "profile" && (
          <section className={CARD_CLASS} data-testid="institution-profile-panel">
            <div className="flex items-start gap-md px-md sm:px-lg py-md sm:py-lg border-b border-outline-variant/15">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center">
                {showLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setLogoBroken(true)}
                    src={logo}
                  />
                ) : (
                  <span className="font-title-sm text-[18px] text-on-surface-variant">
                    {institutionInitials(name)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-title-sm text-[16px] sm:text-[18px] text-on-surface leading-tight">
                  Profil établissement
                </h2>
                <p className="font-body-sm text-[13px] text-on-surface-variant mt-xs">
                  Coordonnées et informations générales. Elles apparaissent sur les documents officiels.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-lg p-md sm:p-lg">
              {profileError && (
                <AlertBanner testId="institution-profile-error" tone="error">
                  {profileError}
                </AlertBanner>
              )}
              {profileNotice && <AlertBanner tone="success">{profileNotice}</AlertBanner>}

              {profileLoading ? (
                <FormSkeleton testId="institution-profile-loading" />
              ) : (
                <div className="flex flex-col gap-lg">
                  <SettingsField id="inst-name" label="Nom de l'établissement">
                    <input
                      className={INPUT_CLASS}
                      id="inst-name"
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      value={name}
                    />
                  </SettingsField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <SettingsField id="inst-code" label="Code d'enregistrement">
                      <input
                        className={`${INPUT_CLASS} font-mono-data`}
                        id="inst-code"
                        onChange={(e) => setRegistrationCode(e.target.value)}
                        type="text"
                        value={registrationCode}
                      />
                    </SettingsField>
                    <SettingsField id="inst-year" label="Année de création">
                      <input
                        className={INPUT_CLASS}
                        id="inst-year"
                        onChange={(e) => setEstablishmentYear(e.target.value)}
                        type="number"
                        value={establishmentYear}
                      />
                    </SettingsField>
                  </div>
                  <SettingsField id="inst-address" label="Adresse principale">
                    <textarea
                      className={`${INPUT_CLASS} resize-none min-h-[5.5rem]`}
                      id="inst-address"
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      value={address}
                    />
                  </SettingsField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                    <SettingsField id="inst-phone" label="Téléphone">
                      <input
                        className={INPUT_CLASS}
                        id="inst-phone"
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        value={phone}
                      />
                    </SettingsField>
                    <SettingsField id="inst-email" label="E-mail">
                      <input
                        className={INPUT_CLASS}
                        id="inst-email"
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        value={email}
                      />
                    </SettingsField>
                  </div>
                  <SettingsField
                    hint="Lien public vers le logo (PNG ou SVG recommandé)."
                    id="inst-logo"
                    label="URL du logo"
                  >
                    <input
                      className={INPUT_CLASS}
                      id="inst-logo"
                      onChange={(e) => setLogo(e.target.value)}
                      placeholder="https://"
                      type="url"
                      value={logo}
                    />
                  </SettingsField>
                </div>
              )}
            </div>

            {canUpdateSettings && !profileLoading && (
              <div className="flex justify-end px-md sm:px-lg py-md border-t border-outline-variant/15 bg-[#f7f9fb]">
                <button
                  className={SAVE_CLASS}
                  disabled={profileSaving}
                  onClick={() => void saveProfile()}
                  type="button"
                >
                  {profileSaving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "sites" && (
          <section className="flex flex-col gap-md" data-testid="sites-panel">
            {sitesError && (
              <AlertBanner testId="sites-error" tone="error">
                {sitesError}
              </AlertBanner>
            )}
            {sitesLoading ? (
              <div className={CARD_CLASS}>
                <PanelSkeleton lines={6} testId="sites-loading" />
              </div>
            ) : (
              <>
                <div className={CARD_CLASS}>
                  <div className="flex items-center justify-between gap-sm flex-wrap px-md sm:px-lg py-md border-b border-outline-variant/15">
                    <div className="min-w-0">
                      <h3 className="font-title-sm text-[15px]">Campus</h3>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        Sites physiques de l&apos;établissement.
                      </p>
                    </div>
                    {canCreateSettings && (
                      <CrudCreateLink
                        className={DATA_TABLE_CREATE_CLASS}
                        label="NOUVEAU CAMPUS"
                        resource="campuses"
                      />
                    )}
                  </div>
                  <div className="p-md" data-testid="campuses-list">
                    {campuses.length === 0 ? (
                      <EmptySites
                        hint="Ajoutez le premier campus pour rattacher bâtiments et salles."
                        icon="domain"
                        title="Aucun campus."
                      />
                    ) : (
                      <ul className="flex flex-col gap-sm">
                        {campuses.map((c) => (
                          <SiteRow
                            canDelete={canDeleteSettings}
                            canEdit={canUpdateSettings}
                            deleting={sitesBusy}
                            editId={c.id}
                            editResource="campuses"
                            icon="location_on"
                            key={c.id}
                            meta={c.address || "Adresse non renseignée"}
                            onDelete={() => void handleDeleteCampus(c)}
                            title={c.name}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={CARD_CLASS}>
                  <div className="flex items-center justify-between gap-sm flex-wrap px-md sm:px-lg py-md border-b border-outline-variant/15">
                    <div className="min-w-0">
                      <h3 className="font-title-sm text-[15px]">Bâtiments</h3>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        Blocs rattachés à un campus.
                      </p>
                    </div>
                    {canCreateSettings && (
                      <CrudCreateLink
                        className={DATA_TABLE_CREATE_CLASS}
                        label="NOUVEAU BÂTIMENT"
                        resource="buildings"
                      />
                    )}
                  </div>
                  <div className="p-md" data-testid="buildings-list">
                    {buildings.length === 0 ? (
                      <EmptySites
                        hint="Créez un bâtiment pour y placer des salles."
                        icon="apartment"
                        title="Aucun bâtiment."
                      />
                    ) : (
                      <ul className="flex flex-col gap-sm">
                        {buildings.map((b) => {
                          const campusName =
                            b.campus && "name" in b.campus
                              ? b.campus.name
                              : campusById.get(b.campus_id)?.name ?? `Campus #${b.campus_id}`;
                          const meta = [
                            campusName,
                            b.floors != null ? `${b.floors} étage(s)` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          return (
                            <SiteRow
                              canDelete={canDeleteSettings}
                              canEdit={canUpdateSettings}
                              deleting={sitesBusy}
                              editId={b.id}
                              editResource="buildings"
                              icon="apartment"
                              key={b.id}
                              meta={meta}
                              onDelete={() => void handleDeleteBuilding(b)}
                              title={b.code ? `${b.name} (${b.code})` : b.name}
                            />
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={CARD_CLASS}>
                  <div className="flex items-center justify-between gap-sm flex-wrap px-md sm:px-lg py-md border-b border-outline-variant/15">
                    <div className="min-w-0">
                      <h3 className="font-title-sm text-[15px]">Salles</h3>
                      <p className="text-[12px] text-on-surface-variant mt-0.5">
                        Salles de cours, labs et espaces communs.
                      </p>
                    </div>
                    {canCreateSettings && (
                      <CrudCreateLink
                        className={DATA_TABLE_CREATE_CLASS}
                        label="NOUVELLE SALLE"
                        resource="rooms"
                      />
                    )}
                  </div>
                  <div className="p-md" data-testid="rooms-list">
                    {rooms.length === 0 ? (
                      <EmptySites
                        hint="Ajoutez une salle pour l'emploi du temps et les affectations."
                        icon="meeting_room"
                        title="Aucune salle."
                      />
                    ) : (
                      <ul className="flex flex-col gap-sm">
                        {rooms.map((r) => {
                          const buildingName =
                            r.building && "name" in r.building
                              ? r.building.name
                              : buildingById.get(r.building_id)?.name ?? `Bâtiment #${r.building_id}`;
                          const type = roomTypeLabel(r.type);
                          const meta = [
                            `Bâtiment ${buildingName}`,
                            r.capacity != null ? `cap. ${r.capacity}` : null,
                            type,
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          return (
                            <SiteRow
                              canDelete={canDeleteSettings}
                              canEdit={canUpdateSettings}
                              deleting={sitesBusy}
                              editId={r.id}
                              editResource="rooms"
                              icon="meeting_room"
                              key={r.id}
                              meta={meta}
                              onDelete={() => void handleDeleteRoom(r)}
                              title={r.code ? `${r.name} (${r.code})` : r.name}
                            />
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {tab === "grading" && (
          <section className={CARD_CLASS} data-testid="grading-settings-panel">
            <div className="px-md sm:px-lg py-md sm:py-lg border-b border-outline-variant/15">
              <h2 className="font-title-sm text-[16px] sm:text-[18px] text-on-surface">
                Règles de notation
              </h2>
              <p className="font-body-sm text-[13px] text-on-surface-variant mt-xs">
                Barème, seuil de réussite et calcul des moyennes pour les bulletins.
              </p>
            </div>

            <div className="flex flex-col gap-lg p-md sm:p-lg">
              {gradingError && <AlertBanner tone="error">{gradingError}</AlertBanner>}
              {gradingNotice && <AlertBanner tone="success">{gradingNotice}</AlertBanner>}

              {gradingLoading ? (
                <FormSkeleton
                  fields={4}
                  label="Chargement des paramètres…"
                  testId="grading-settings-loading"
                />
              ) : (
                <>
                  <div className="rounded-xl bg-surface-container-low/70 p-md sm:p-lg">
                    <div className="flex items-center justify-between gap-sm mb-sm">
                      <p className="ui-stat-label">Aperçu du barème</p>
                      <p className="text-[12px] text-on-surface-variant tabular-nums">
                        Seuil {passingScore || "—"} / {scaleMax || "—"}
                      </p>
                    </div>
                    <div className="relative pt-0.5 pb-0.5">
                      <div className="h-3 rounded-full bg-error-container/80 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500/85"
                          style={{
                            marginLeft: `${passingPct}%`,
                            width: `${100 - passingPct}%`,
                          }}
                        />
                      </div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary shadow-sm"
                        style={{ left: `${passingPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-on-surface-variant mt-sm">
                      <span>0</span>
                      <span>Échec</span>
                      <span>Réussite</span>
                      <span className="tabular-nums">{scaleMax || "—"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
                    <SettingsField hint="Note maximale d’une évaluation." id="scale-max" label="Barème max">
                      <input
                        className={INPUT_CLASS}
                        id="scale-max"
                        onChange={(e) => setScaleMax(e.target.value)}
                        step="0.01"
                        type="number"
                        value={scaleMax}
                      />
                    </SettingsField>
                    <SettingsField hint="Moyenne minimale pour valider." id="passing-score" label="Seuil de réussite">
                      <input
                        className={INPUT_CLASS}
                        id="passing-score"
                        onChange={(e) => setPassingScore(e.target.value)}
                        step="0.01"
                        type="number"
                        value={passingScore}
                      />
                    </SettingsField>
                    <SettingsField hint="Précision affichée (0 à 4)." id="decimal-places" label="Décimales">
                      <input
                        className={INPUT_CLASS}
                        id="decimal-places"
                        max={4}
                        min={0}
                        onChange={(e) => setDecimalPlaces(e.target.value)}
                        type="number"
                        value={decimalPlaces}
                      />
                    </SettingsField>
                  </div>

                  <div className="flex items-start gap-md p-md rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
                    <Checkbox
                      checked={weightedAverage}
                      id="weighted-average"
                      onChange={setWeightedAverage}
                    />
                    <label className="min-w-0 cursor-pointer" htmlFor="weighted-average">
                      <span className="block font-body-md text-[14px] text-on-surface">
                        Moyenne pondérée (coefficients)
                      </span>
                      <span className="block text-[12px] text-on-surface-variant mt-xs">
                        Les coefficients des matières sont pris en compte dans le calcul des moyennes.
                      </span>
                    </label>
                  </div>
                </>
              )}
            </div>

            {canUpdateGrading && !gradingLoading && (
              <div className="flex justify-end px-md sm:px-lg py-md border-t border-outline-variant/15 bg-[#f7f9fb]">
                <button
                  className={SAVE_CLASS}
                  disabled={gradingSaving}
                  onClick={() => void saveGrading()}
                  type="button"
                >
                  {gradingSaving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "academic" && (
          <div className="min-w-0 [&_.ui-table-shell]:mt-0 [&>div]:max-w-none [&>div]:mx-0 [&>div]:pb-0">
            <AcademicStructureContent />
          </div>
        )}

        {tab === "users" && (
          <div className="min-w-0 [&_.ui-table-shell]:mt-0 [&>div]:max-w-none [&>div]:mx-0 [&>div]:pb-0">
            <SettingsUsersContent />
          </div>
        )}

        {tab === "roles" && (
          <div className="min-w-0">
            <SettingsRolesContent />
          </div>
        )}

        {tab === "security" && (
          <div className="min-w-0 [&_.ui-table-shell]:mt-0 [&>div]:max-w-none [&>div]:mx-0 [&>div]:pb-0">
            <SecurityAuditLogsContent />
          </div>
        )}
      </div>
    </div>
  );
}
