"use client";

import { useEffect, useMemo, useState } from "react";
import { listTimetableSlots } from "@/infrastructure/api/resources/academic";
import { getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import {
  DAY_OF_WEEK_LABELS,
  DAYS_ORDER,
  type DayOfWeek,
  type TimetableSlot,
} from "@/shared/types/academic.types";
import { ApiError } from "@/shared/types/api.types";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

function formatTime(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export function DailyScheduleContent() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [day, setDay] = useState<DayOfWeek>(() => {
    const map: Record<number, DayOfWeek> = {
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };
    return map[new Date().getDay()] ?? "monday";
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const rows = await listTimetableSlots();
        if (!cancelled) setSlots(rows);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
          setSlots([]);
        } else {
          setError(getAuthErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const daySlots = useMemo(
    () =>
      slots
        .filter((s) => s.day_of_week === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots, day]
  );

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-5xl mx-auto px-md">
      <div>
        <h1 className="ui-page-title">Emploi du temps</h1>
        <p className="font-body-md text-on-surface-variant mt-sm">
          Créneaux de la semaine (si l&apos;API autorise l&apos;accès).
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm">
          {error}
        </div>
      )}

      {forbidden && (
        <p className="font-body-md text-on-surface-variant" data-testid="schedule-forbidden">
          L&apos;emploi du temps n&apos;est pas encore accessible depuis votre compte.
          Contactez l&apos;établissement.
        </p>
      )}

      {loading && <ContentSkeleton variant="schedule" />}

      {!loading && !forbidden && (
        <>
          <div className="flex flex-wrap gap-xs" role="tablist" aria-label="Jours">
            {DAYS_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={day === d}
                className={
                  day === d
                    ? "ui-btn-primary text-sm py-sm px-md"
                    : "ui-btn-secondary text-sm py-sm px-md"
                }
                onClick={() => setDay(d)}
              >
                {DAY_OF_WEEK_LABELS[d]}
              </button>
            ))}
          </div>

          {daySlots.length === 0 ? (
            <p className="font-body-md text-on-surface-variant" data-testid="schedule-empty">
              Aucun cours pour {DAY_OF_WEEK_LABELS[day].toLowerCase()}.
            </p>
          ) : (
            <ul className="flex flex-col gap-sm" data-testid="schedule-list">
              {daySlots.map((slot) => (
                <li key={slot.id} className="ui-card ui-card-pad flex justify-between gap-md flex-wrap">
                  <div>
                    <div className="font-title-sm text-on-surface">
                      {slot.subject?.name ?? `Matière #${slot.subject_id}`}
                    </div>
                    <div className="font-body-sm text-on-surface-variant mt-xs">
                      {slot.teacher?.name ?? "Enseignant —"} · {slot.room?.name ?? "Salle —"}
                    </div>
                    {slot.class_group?.name && (
                      <div className="font-body-sm text-on-surface-variant">
                        {slot.class_group.name}
                      </div>
                    )}
                  </div>
                  <div className="font-mono-data text-on-surface whitespace-nowrap">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
