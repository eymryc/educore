"use client";

import { useEffect, useState } from "react";
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

type SettingsTab = "profile" | "sites" | "grading";

export function SystemSettingsContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("profile");

  const [name, setName] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [establishmentYear, setEstablishmentYear] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [logo, setLogo] = useState("");
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

  const navBtn = (id: SettingsTab, icon: string, label: string) => (
    <button
      className={`flex items-center gap-md p-md rounded-lg font-body-md text-body-md text-left transition-all ${
        tab === id
          ? "bg-primary-container text-on-primary-container shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
      }`}
      onClick={() => setTab(id)}
      type="button"
    >
      <span
        className="material-symbols-outlined"
        style={tab === id ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      {label}
    </button>
  );

  return (
    <div className="flex flex-col w-full h-full gap-xl">
      <div className="flex flex-col md:flex-row w-full gap-xl min-h-[calc(100vh-128px)]">
        <aside className="w-full md:w-64 shrink-0 flex flex-col gap-sm sticky top-[80px] self-start h-[calc(100vh-128px)] overflow-y-auto pr-md pb-xl">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-md">Paramètres</h2>
          {navBtn("profile", "business", "Profil établissement")}
          {navBtn("sites", "apartment", "Campus & salles")}
          {navBtn("grading", "grading", "Règles de notation")}
        </aside>

        <div className="flex-1 flex flex-col gap-xl pb-xl max-w-4xl">
          {tab === "profile" && (
            <section
              className="flex flex-col gap-lg bg-surface-container-lowest p-xl rounded-2xl shadow-sm"
              data-testid="institution-profile-panel"
            >
              <div className="flex flex-col gap-sm">
                <h3 className="font-title-sm text-title-sm text-on-surface">Profil établissement</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  `GET/PUT /institution` (également exposé via `/settings`).
                </p>
              </div>

              {profileError && (
                <div
                  className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
                  data-testid="institution-profile-error"
                  role="alert"
                >
                  {profileError}
                </div>
              )}
              {profileNotice && (
                <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm">
                  {profileNotice}
                </div>
              )}

              {profileLoading ? (
                <FormSkeleton testId="institution-profile-loading" />
              ) : (
                <div className="flex flex-col gap-lg w-full">
                  <div className="flex flex-col gap-xs">
                    <label className="ui-stat-label" htmlFor="inst-name">
                      Nom de l&apos;établissement
                    </label>
                    <input
                      className="bg-surface-container-low text-on-surface font-body-md p-md rounded-lg outline-none focus:ring-2 focus:ring-primary w-full"
                      id="inst-name"
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      value={name}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div className="flex flex-col gap-xs">
                      <label className="ui-stat-label" htmlFor="inst-code">
                        Code d&apos;enregistrement
                      </label>
                      <input
                        className="bg-surface-container-low font-mono-data p-md rounded-lg w-full"
                        id="inst-code"
                        onChange={(e) => setRegistrationCode(e.target.value)}
                        type="text"
                        value={registrationCode}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="ui-stat-label" htmlFor="inst-year">
                        Année de création
                      </label>
                      <input
                        className="bg-surface-container-low font-body-md p-md rounded-lg w-full"
                        id="inst-year"
                        onChange={(e) => setEstablishmentYear(e.target.value)}
                        type="number"
                        value={establishmentYear}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="ui-stat-label" htmlFor="inst-address">
                      Adresse principale
                    </label>
                    <textarea
                      className="bg-surface-container-low font-body-md p-md rounded-lg resize-none w-full"
                      id="inst-address"
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      value={address}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div className="flex flex-col gap-xs">
                      <label className="ui-stat-label" htmlFor="inst-phone">
                        Téléphone
                      </label>
                      <input
                        className="bg-surface-container-low font-body-md p-md rounded-lg w-full"
                        id="inst-phone"
                        onChange={(e) => setPhone(e.target.value)}
                        type="tel"
                        value={phone}
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <label className="ui-stat-label" htmlFor="inst-email">
                        E-mail
                      </label>
                      <input
                        className="bg-surface-container-low font-body-md p-md rounded-lg w-full"
                        id="inst-email"
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        value={email}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="ui-stat-label" htmlFor="inst-logo">
                      URL du logo
                    </label>
                    <input
                      className="bg-surface-container-low font-body-md p-md rounded-lg w-full"
                      id="inst-logo"
                      onChange={(e) => setLogo(e.target.value)}
                      type="url"
                      value={logo}
                    />
                  </div>
                </div>
              )}

              {canUpdateSettings && !profileLoading && (
                <div className="flex justify-end">
                  <button
                    className="bg-primary text-on-primary font-title-sm px-xl py-sm rounded-lg disabled:opacity-50"
                    disabled={profileSaving}
                    onClick={() => void saveProfile()}
                    type="button"
                  >
                    Enregistrer
                  </button>
                </div>
              )}
            </section>
          )}

          {tab === "sites" && (
            <section className="flex flex-col gap-lg" data-testid="sites-panel">
              {sitesError && (
                <div
                  className="rounded-lg bg-error-container text-on-error-container px-md py-sm"
                  data-testid="sites-error"
                  role="alert"
                >
                  {sitesError}
                </div>
              )}
              {sitesLoading ? (
                <PanelSkeleton lines={6} testId="sites-loading" />
              ) : (
                <>
                  <div className="ui-card p-lg flex flex-col gap-md">
                    <div className="flex items-center justify-between gap-md flex-wrap">
                      <h3 className="font-title-sm">Campus</h3>
                      {canCreateSettings && (
                        <CrudCreateLink label="NOUVEAU CAMPUS" resource="campuses" />
                      )}
                    </div>
                    <div data-testid="campuses-list">
                      {campuses.length === 0 ? (
                        <p className="font-body-sm text-on-surface-variant">Aucun campus.</p>
                      ) : (
                        <ul className="flex flex-col gap-sm">
                          {campuses.map((c) => (
                            <li
                              key={c.id}
                              className="flex items-center justify-between gap-sm bg-surface-container-low rounded-lg px-md py-sm"
                            >
                              <div>
                                <div className="font-semibold text-sm">{c.name}</div>
                                <div className="font-body-sm text-on-surface-variant text-[12px]">
                                  {c.address ?? "—"}
                                </div>
                              </div>
                              <div className="flex gap-xs">
                                {canUpdateSettings && (
                                  <CrudEditLink recordId={String(c.id)} resource="campuses" />
                                )}
                                {canDeleteSettings && (
                                  <button
                                    className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                                    disabled={sitesBusy}
                                    onClick={() => void handleDeleteCampus(c)}
                                    type="button"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="ui-card p-lg flex flex-col gap-md">
                    <div className="flex items-center justify-between gap-md flex-wrap">
                      <h3 className="font-title-sm">Bâtiments</h3>
                      {canCreateSettings && (
                        <CrudCreateLink label="NOUVEAU BÂTIMENT" resource="buildings" />
                      )}
                    </div>
                    <div data-testid="buildings-list">
                      {buildings.length === 0 ? (
                        <p className="font-body-sm text-on-surface-variant">Aucun bâtiment.</p>
                      ) : (
                        <ul className="flex flex-col gap-sm">
                          {buildings.map((b) => (
                            <li
                              key={b.id}
                              className="flex items-center justify-between gap-sm bg-surface-container-low rounded-lg px-md py-sm"
                            >
                              <div>
                                <div className="font-semibold text-sm">
                                  {b.name}
                                  {b.code ? ` (${b.code})` : ""}
                                </div>
                                <div className="font-body-sm text-on-surface-variant text-[12px]">
                                  Campus #{b.campus_id}
                                  {b.floors != null ? ` · ${b.floors} étage(s)` : ""}
                                </div>
                              </div>
                              <div className="flex gap-xs">
                                {canUpdateSettings && (
                                  <CrudEditLink recordId={String(b.id)} resource="buildings" />
                                )}
                                {canDeleteSettings && (
                                  <button
                                    className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                                    disabled={sitesBusy}
                                    onClick={() => void handleDeleteBuilding(b)}
                                    type="button"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="ui-card p-lg flex flex-col gap-md">
                    <div className="flex items-center justify-between gap-md flex-wrap">
                      <h3 className="font-title-sm">Salles</h3>
                      {canCreateSettings && (
                        <CrudCreateLink label="NOUVELLE SALLE" resource="rooms" />
                      )}
                    </div>
                    <div data-testid="rooms-list">
                      {rooms.length === 0 ? (
                        <p className="font-body-sm text-on-surface-variant">Aucune salle.</p>
                      ) : (
                        <ul className="flex flex-col gap-sm">
                          {rooms.map((r) => (
                            <li
                              key={r.id}
                              className="flex items-center justify-between gap-sm bg-surface-container-low rounded-lg px-md py-sm"
                            >
                              <div>
                                <div className="font-semibold text-sm">
                                  {r.name}
                                  {r.code ? ` (${r.code})` : ""}
                                </div>
                                <div className="font-body-sm text-on-surface-variant text-[12px]">
                                  Bâtiment #{r.building_id}
                                  {r.capacity != null ? ` · cap. ${r.capacity}` : ""}
                                  {r.type ? ` · ${r.type}` : ""}
                                </div>
                              </div>
                              <div className="flex gap-xs">
                                {canUpdateSettings && (
                                  <CrudEditLink recordId={String(r.id)} resource="rooms" />
                                )}
                                {canDeleteSettings && (
                                  <button
                                    className="px-sm py-xs rounded bg-surface-container-high text-[11px] font-label-caps disabled:opacity-40"
                                    disabled={sitesBusy}
                                    onClick={() => void handleDeleteRoom(r)}
                                    type="button"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {tab === "grading" && (
            <section
              className="flex flex-col gap-lg bg-surface-container-lowest p-xl rounded-2xl shadow-sm"
              data-testid="grading-settings-panel"
            >
              <div className="flex flex-col gap-sm">
                <h3 className="font-title-sm text-title-sm text-on-surface">Règles de notation</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Barème, seuil de réussite et calcul des moyennes (`GET/PUT /grading-settings`).
                </p>
              </div>

              {gradingError && (
                <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
                  {gradingError}
                </div>
              )}
              {gradingNotice && (
                <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm">
                  {gradingNotice}
                </div>
              )}

              {gradingLoading ? (
                <FormSkeleton
                  fields={4}
                  label="Chargement des paramètres…"
                  testId="grading-settings-loading"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <div className="flex flex-col gap-xs">
                    <label className="ui-stat-label" htmlFor="scale-max">
                      Barème max
                    </label>
                    <input
                      className="bg-surface-container-low p-md rounded-lg font-body-md"
                      id="scale-max"
                      onChange={(e) => setScaleMax(e.target.value)}
                      step="0.01"
                      type="number"
                      value={scaleMax}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="ui-stat-label" htmlFor="passing-score">
                      Seuil de réussite
                    </label>
                    <input
                      className="bg-surface-container-low p-md rounded-lg font-body-md"
                      id="passing-score"
                      onChange={(e) => setPassingScore(e.target.value)}
                      step="0.01"
                      type="number"
                      value={passingScore}
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="ui-stat-label" htmlFor="decimal-places">
                      Décimales
                    </label>
                    <input
                      className="bg-surface-container-low p-md rounded-lg font-body-md"
                      id="decimal-places"
                      max={4}
                      min={0}
                      onChange={(e) => setDecimalPlaces(e.target.value)}
                      type="number"
                      value={decimalPlaces}
                    />
                  </div>
                  <div className="flex items-center gap-md pt-lg">
                    <input
                      checked={weightedAverage}
                      className="w-4 h-4"
                      id="weighted-average"
                      onChange={(e) => setWeightedAverage(e.target.checked)}
                      type="checkbox"
                    />
                    <label className="font-body-md" htmlFor="weighted-average">
                      Moyenne pondérée (coefficients)
                    </label>
                  </div>
                </div>
              )}

              {canUpdateGrading && !gradingLoading && (
                <div className="flex justify-end">
                  <button
                    className="bg-primary text-on-primary font-title-sm px-xl py-sm rounded-lg disabled:opacity-50"
                    disabled={gradingSaving}
                    onClick={() => void saveGrading()}
                    type="button"
                  >
                    Enregistrer
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
