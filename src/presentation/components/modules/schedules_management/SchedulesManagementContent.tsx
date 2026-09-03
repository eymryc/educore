"use client";

import { useEffect, useMemo, useState } from "react";
import { CrudCreateLink } from "@/presentation/components/forms/CrudLinks";
import {
  crudRowActions,
  DataTableActionsMenu,
} from "@/presentation/components/shared/DataTableActionsMenu";
import {
  deleteTimetableSlot,
  listAcademicYears,
  listClassGroups,
  listTimetableSlots,
} from "@/infrastructure/api/resources/academic";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { can } from "@/shared/lib/permissions";
import {
  DAY_OF_WEEK_LABELS,
  DAYS_ORDER,
  slotsForClass,
  type ClassGroup,
  type DayOfWeek,
  type TimetableSlot,
} from "@/shared/types/academic.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";

const DAY_ACCENTS: Record<DayOfWeek, { bar: string; soft: string; label: string }> = {
  monday: { bar: "bg-sky-500", soft: "bg-sky-50", label: "text-sky-800" },
  tuesday: { bar: "bg-violet-500", soft: "bg-violet-50", label: "text-violet-800" },
  wednesday: { bar: "bg-amber-500", soft: "bg-amber-50", label: "text-amber-900" },
  thursday: { bar: "bg-emerald-500", soft: "bg-emerald-50", label: "text-emerald-800" },
  friday: { bar: "bg-rose-500", soft: "bg-rose-50", label: "text-rose-800" },
  saturday: { bar: "bg-slate-400", soft: "bg-slate-50", label: "text-slate-700" },
};

const SUBJECT_PALETTES = [
  { border: "border-l-sky-500", bg: "bg-sky-50/80", time: "text-sky-700", badge: "bg-sky-100 text-sky-800" },
  { border: "border-l-violet-500", bg: "bg-violet-50/80", time: "text-violet-700", badge: "bg-violet-100 text-violet-800" },
  { border: "border-l-emerald-500", bg: "bg-emerald-50/80", time: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  { border: "border-l-amber-500", bg: "bg-amber-50/80", time: "text-amber-800", badge: "bg-amber-100 text-amber-900" },
  { border: "border-l-rose-500", bg: "bg-rose-50/80", time: "text-rose-700", badge: "bg-rose-100 text-rose-800" },
  { border: "border-l-cyan-500", bg: "bg-cyan-50/80", time: "text-cyan-700", badge: "bg-cyan-100 text-cyan-800" },
  { border: "border-l-orange-500", bg: "bg-orange-50/80", time: "text-orange-700", badge: "bg-orange-100 text-orange-800" },
  { border: "border-l-indigo-500", bg: "bg-indigo-50/80", time: "text-indigo-700", badge: "bg-indigo-100 text-indigo-800" },
] as const;

function paletteForSubject(key: string | number) {
  const raw = String(key);
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return SUBJECT_PALETTES[hash % SUBJECT_PALETTES.length];
}

export function SchedulesManagementContent() {
  const confirmDialog = useConfirm();
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classId, setClassId] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const canCreate = can(user, "classes.create");
  const canUpdate = can(user, "classes.update");
  const canDelete = can(user, "classes.delete");

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [slotList, classList, yearList] = await Promise.all([
        listTimetableSlots(),
        listClassGroups(),
        listAcademicYears(),
      ]);
      const activeYear = yearList.find((y) => y.is_active) ?? yearList[0];
      const yearClasses = activeYear
        ? classList.filter((c) => c.academic_year_id === activeYear.id)
        : classList;
      setSlots(slotList);
      setClasses(yearClasses);
      if (!classId && yearClasses[0]) setClassId(String(yearClasses[0].id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredClasses = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.name.toLowerCase().includes(q));
  }, [classes, classSearch]);

  const weekSlots = useMemo(() => slotsForClass(slots, classId || null), [slots, classId]);

  const byDay = useMemo(() => {
    const map = Object.fromEntries(DAYS_ORDER.map((d) => [d, [] as TimetableSlot[]])) as Record<
      DayOfWeek,
      TimetableSlot[]
    >;
    for (const slot of weekSlots) {
      map[slot.day_of_week]?.push(slot);
    }
    return map;
  }, [weekSlots]);

  async function handleDelete(slot: TimetableSlot) {
    if (!canDelete || !await confirmDialog("Supprimer ce créneau ?")) return;
    setDeletingId(slot.id);
    try {
      await deleteTimetableSlot(slot.id);
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  const selectedClass = classes.find((c) => String(c.id) === classId);

  return (
    <div className="flex flex-col w-full gap-lg pb-xl">
      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-stretch gap-lg min-h-[480px]">
        <aside className="w-full lg:w-64 shrink-0 flex flex-col">
          <div className="flex-1 flex flex-col bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant/20">
            {canCreate && (
              <div className="mb-md">
                <CrudCreateLink
                  className="inline-flex w-full items-center justify-center gap-sm bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md py-sm rounded-lg transition-colors shadow-sm"
                  label="NOUVEAU CRÉNEAU"
                  resource="schedules"
                />
              </div>
            )}
            <label className="ui-stat-label block mb-xs" htmlFor="class-search">
              Classes
            </label>
            <input
              className="w-full bg-surface-container-low rounded-lg px-md py-sm text-body-sm mb-md border border-transparent focus:border-primary/30 focus:outline-none"
              id="class-search"
              onChange={(e) => setClassSearch(e.target.value)}
              placeholder="Rechercher…"
              value={classSearch}
            />
            <div
              className="flex-1 flex flex-col gap-xs min-h-32 overflow-y-auto"
              data-testid="schedules-class-list"
            >
              {filteredClasses.map((c) => (
                <button
                  key={c.id}
                  className={`text-left px-md py-sm rounded-lg font-body-sm transition-colors ${
                    String(c.id) === classId
                      ? "bg-primary-container text-on-primary-container font-semibold shadow-sm"
                      : "hover:bg-surface-container-low text-on-surface-variant"
                  }`}
                  onClick={() => setClassId(String(c.id))}
                  type="button"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 bg-surface-container-lowest rounded-xl shadow-sm p-lg border border-outline-variant/20">
          {loading ? (
            <ContentSkeleton
              label="Chargement de l'emploi du temps…"
              testId="schedules-loading"
              variant="schedule"
            />
          ) : !classId ? (
            <p data-testid="schedules-empty" className="font-body-sm text-on-surface-variant">
              Sélectionnez une classe.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-sm mb-md">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                </span>
                <h2 className="font-title-sm" data-testid="schedules-selected-class">
                  {selectedClass?.name || `Classe #${classId}`}
                </h2>
              </div>
              {weekSlots.length === 0 ? (
                <p data-testid="schedules-slots-empty" className="font-body-sm text-on-surface-variant mb-md">
                  Aucun créneau pour cette classe.
                </p>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md" data-testid="schedules-grid">
                {DAYS_ORDER.map((day) => {
                  const accent = DAY_ACCENTS[day];
                  return (
                    <div
                      key={day}
                      className={`rounded-xl ${accent.soft} p-md min-h-32 border border-outline-variant/15 overflow-hidden`}
                    >
                      <div className="flex items-center gap-sm mb-sm">
                        <span className={`h-2 w-2 rounded-full ${accent.bar}`} aria-hidden />
                        <h3 className={`ui-stat-label ${accent.label}`}>{DAY_OF_WEEK_LABELS[day]}</h3>
                      </div>
                      <ul className="space-y-sm">
                        {byDay[day].map((slot) => {
                          const subjectKey = slot.subject?.name || slot.subject_id;
                          const palette = paletteForSubject(subjectKey);
                          return (
                            <li
                              key={slot.id}
                              className={`rounded-lg border border-outline-variant/20 border-l-4 ${palette.border} ${palette.bg} p-sm text-body-sm shadow-sm`}
                            >
                              <div className="flex items-start justify-between gap-xs">
                                <span className={`font-mono-data text-[12px] font-medium ${palette.time}`}>
                                  {(slot.start_time || "").slice(0, 5)} – {(slot.end_time || "").slice(0, 5)}
                                </span>
                                <DataTableActionsMenu
                                  ariaLabel="Actions pour le créneau"
                                  items={crudRowActions({
                                    edit: { resource: "schedules", recordId: slot.id },
                                    delete: {
                                      onClick: () => void handleDelete(slot),
                                      disabled: deletingId === slot.id,
                                    },
                                    canUpdate,
                                    canDelete,
                                  })}
                                />
                              </div>
                              <div className="font-title-sm mt-xxs">
                                {slot.subject?.name || `Matière #${slot.subject_id}`}
                              </div>
                              <div className="mt-xs flex flex-wrap items-center gap-xs">
                                <span className={`inline-flex rounded-md px-xs py-xxs text-[11px] font-medium ${palette.badge}`}>
                                  {slot.teacher?.name || "—"}
                                </span>
                                {slot.room?.name ? (
                                  <span className="text-on-surface-variant text-[12px]">{slot.room.name}</span>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
