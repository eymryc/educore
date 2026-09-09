"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataTableRefreshButton,
  DataTableSelectCell,
  DataTableSelectHeader,
} from "@/presentation/components/shared/DataTableControls";
import { DataTableSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { DataTablePagination } from "@/presentation/components/shared/DataTablePagination";
import {
  DataTableToolbar,
  DataTableShell,
  DataTableFilterSelect,
  DataTableFilterDate,
} from "@/presentation/components/shared/DataTable";

import { StatusBadge } from "@/presentation/components/shared/StatusBadge";
import {
  tableRowClass,
  useClientDataTable,
} from "@/presentation/components/shared/data-table-utils";
import { listAcademicYears, listClassGroups } from "@/infrastructure/api/resources/academic";
import {
  createAttendance,
  justifyAttendance,
  listAttendance,
  updateAttendance,
  validateAttendance,
} from "@/infrastructure/api/resources/attendance";
import { listStudents } from "@/infrastructure/api/resources/students";
import { useAuth, getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { can } from "@/shared/lib/permissions";
import { classGroupsForActiveYear, type ClassGroup } from "@/shared/types/academic.types";
import {
  ATTENDANCE_STATUS_LABELS,
  isJustifiable,
  summarizeAttendance,
  todayIsoDate,
  type AttendanceRecord,
  type AttendanceStatus,
} from "@/shared/types/attendance.types";
import { studentFullName, type Student } from "@/shared/types/student.types";

function statusTone(
  status: AttendanceStatus
): "success" | "error" | "warning" | "info" | "neutral" {
  if (status === "PRESENT") return "success";
  if (status === "ABSENT") return "error";
  if (status === "LATE") return "warning";
  return "info";
}

type Row = {
  id: number;
  student: Student;
  record: AttendanceRecord | null;
};

const STAT_TONES = {
  neutral: {
    value: "text-on-surface",
    iconWrap: "bg-slate-100 text-slate-600",
    active: "border-slate-400 bg-slate-50 ring-1 ring-slate-300/60",
    idle: "border-outline-variant/30 bg-surface-container-lowest hover:bg-slate-50",
  },
  success: {
    value: "text-emerald-700",
    iconWrap: "bg-emerald-100 text-emerald-700",
    active: "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300/50",
    idle: "border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50",
  },
  error: {
    value: "text-rose-700",
    iconWrap: "bg-rose-100 text-rose-700",
    active: "border-rose-400 bg-rose-50 ring-1 ring-rose-300/50",
    idle: "border-rose-100 bg-rose-50/40 hover:bg-rose-50",
  },
  warning: {
    value: "text-amber-800",
    iconWrap: "bg-amber-100 text-amber-700",
    active: "border-amber-400 bg-amber-50 ring-1 ring-amber-300/50",
    idle: "border-amber-100 bg-amber-50/40 hover:bg-amber-50",
  },
  info: {
    value: "text-sky-700",
    iconWrap: "bg-sky-100 text-sky-700",
    active: "border-sky-400 bg-sky-50 ring-1 ring-sky-300/50",
    idle: "border-sky-100 bg-sky-50/40 hover:bg-sky-50",
  },
} as const;

function StatFilterTile({
  active,
  icon,
  label,
  onClick,
  testId,
  tone = "neutral",
  value,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
  testId?: string;
  tone?: keyof typeof STAT_TONES;
  value: number;
}) {
  const t = STAT_TONES[tone];
  return (
    <button
      className={`flex items-center gap-md px-md py-md min-h-[4.5rem] rounded-xl border transition-all text-left ${
        active ? t.active : t.idle
      }`}
      onClick={onClick}
      type="button"
    >
      <span className={`w-10 h-10 shrink-0 rounded-lg inline-flex items-center justify-center ${t.iconWrap}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="min-w-0 flex flex-col gap-xs">
        <span className="ui-stat-label truncate">{label}</span>
        <span
          className={`text-[1.35rem] font-semibold leading-none tabular-nums ${t.value}`}
          data-testid={testId}
        >
          {value}
        </span>
      </div>
    </button>
  );
}

const STATUS_ACTION: Record<
  "PRESENT" | "ABSENT" | "LATE",
  { active: string; idle: string }
> = {
  PRESENT: {
    active: "bg-emerald-600 text-white shadow-sm",
    idle: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  ABSENT: {
    active: "bg-rose-600 text-white shadow-sm",
    idle: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  },
  LATE: {
    active: "bg-amber-500 text-white shadow-sm",
    idle: "bg-amber-50 text-amber-800 hover:bg-amber-100",
  },
};

function rowAccentClass(status: AttendanceStatus | null): string {
  if (status === "PRESENT") return "border-l-[3px] border-l-emerald-500";
  if (status === "ABSENT") return "border-l-[3px] border-l-rose-500";
  if (status === "LATE") return "border-l-[3px] border-l-amber-500";
  if (status === "JUSTIFIED") return "border-l-[3px] border-l-sky-500";
  return "border-l-[3px] border-l-transparent";
}

export function AttendanceManagementContent() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "UNMARKED" | "">("");

  const canCreate = can(user, "attendance.create");
  const canUpdate = can(user, "attendance.update");
  const canValidate = can(user, "attendance.validate") || can(user, "attendance.update");
  const canJustify = can(user, "attendance.justify") || can(user, "attendance.update");

  const selectedClass = classes.find((c) => String(c.id) === classId);

  const reload = useCallback(async () => {
    if (!classId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const [classList, studentList, attendanceList, yearList] = await Promise.all([
        listClassGroups(),
        listStudents(),
        listAttendance({ class_group_id: classId, date }),
        listAcademicYears(),
      ]);
      setClasses(classGroupsForActiveYear(classList, yearList));
      setStudents(studentList);
      setRecords(attendanceList);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [classId, date]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const [classList, yearList] = await Promise.all([listClassGroups(), listAcademicYears()]);
        if (cancelled) return;
        const yearClasses = classGroupsForActiveYear(classList, yearList);
        setClasses(yearClasses);
        const first = yearClasses[0];
        if (first) setClassId(String(first.id));
        else setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(getAuthErrorMessage(err));
          setLoading(false);
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!classId) return;
    void reload();
  }, [classId, date, reload]);

  const classStudents = useMemo(
    () => students.filter((s) => String(s.class_group_id ?? "") === classId),
    [students, classId]
  );

  const recordByStudent = useMemo(() => {
    const map = new Map<number, AttendanceRecord>();
    for (const r of records) map.set(r.student_id, r);
    return map;
  }, [records]);

  const rows: Row[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classStudents
      .filter((s) => {
        if (!q) return true;
        return `${studentFullName(s)} ${s.matricule}`.toLowerCase().includes(q);
      })
      .map((student) => ({
        id: student.id,
        student,
        record: recordByStudent.get(student.id) ?? null,
      }))
      .filter((row) => {
        if (!statusFilter) return true;
        if (statusFilter === "UNMARKED") return !row.record;
        return row.record?.status === statusFilter;
      });
  }, [classStudents, recordByStudent, search, statusFilter]);

  const attendanceTable = useClientDataTable(rows, [search, classId, date, statusFilter]);

  const summary = useMemo(() => summarizeAttendance(records), [records]);
  const unmarkedCount = classStudents.length - records.length;

  async function setStatus(student: Student, status: AttendanceStatus) {
    if (!selectedClass) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const existing = recordByStudent.get(student.id);
      if (existing) {
        if (existing.validated_at) {
          setError("Cette présence est déjà validée et ne peut plus être modifiée.");
          return;
        }
        const updated = await updateAttendance(existing.id, { status });
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      } else {
        const created = await createAttendance({
          student_id: student.id,
          class_group_id: selectedClass.id,
          academic_year_id: selectedClass.academic_year_id,
          date,
          status,
        });
        setRecords((prev) => [...prev, created]);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function markAllPresent() {
    if (!canCreate || !selectedClass) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const missing = classStudents.filter((s) => !recordByStudent.has(s.id));
      const created = await Promise.all(
        missing.map((s) =>
          createAttendance({
            student_id: s.id,
            class_group_id: selectedClass.id,
            academic_year_id: selectedClass.academic_year_id,
            date,
            status: "PRESENT",
          })
        )
      );
      setRecords((prev) => [...prev, ...created]);
      setNotice(`${created.length} élève(s) marqué(s) présent(s).`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleJustify(record: AttendanceRecord) {
    if (!canJustify || !isJustifiable(record.status)) return;
    const justification = window.prompt("Motif de justification :");
    if (!justification?.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await justifyAttendance(record.id, justification.trim());
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice("Absence / retard justifié.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleValidate(record: AttendanceRecord) {
    if (!canValidate || record.validated_at) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await validateAttendance(record.id);
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setNotice("Présence validée.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full gap-lg pb-xl max-w-7xl mx-auto">
      {error && (
        <div role="alert" className="rounded-lg bg-error-container text-on-error-container px-md py-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm" role="status">
          {notice}
        </div>
      )}

      <div className="flex flex-col xl:flex-row-reverse xl:items-start gap-lg">
      {!loading && classId && (
        <div className="ui-card ui-card-pad xl:w-64 xl:shrink-0">
        <div
          className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-1 gap-sm"
          data-testid="attendance-summary"
        >
          <StatFilterTile
            active={statusFilter === ""}
            icon="groups"
            label="Total"
            onClick={() => setStatusFilter("")}
            testId="attendance-stat-total"
            value={summary.total}
          />
          <StatFilterTile
            active={statusFilter === "PRESENT"}
            icon="how_to_reg"
            label="Présents"
            onClick={() => setStatusFilter((s) => (s === "PRESENT" ? "" : "PRESENT"))}
            testId="attendance-stat-present"
            tone="success"
            value={summary.present}
          />
          <StatFilterTile
            active={statusFilter === "ABSENT"}
            icon="event_busy"
            label="Absents"
            onClick={() => setStatusFilter((s) => (s === "ABSENT" ? "" : "ABSENT"))}
            testId="attendance-stat-absent"
            tone="error"
            value={summary.absent}
          />
          <StatFilterTile
            active={statusFilter === "LATE"}
            icon="schedule"
            label="Retards"
            onClick={() => setStatusFilter((s) => (s === "LATE" ? "" : "LATE"))}
            testId="attendance-stat-late"
            tone="warning"
            value={summary.late}
          />
          <StatFilterTile
            active={statusFilter === "UNMARKED"}
            icon="help"
            label="Non pointés"
            onClick={() => setStatusFilter((s) => (s === "UNMARKED" ? "" : "UNMARKED"))}
            testId="attendance-stat-unmarked"
            tone="info"
            value={Math.max(0, unmarkedCount)}
          />
        </div>
        </div>
      )}

      <DataTableShell className="min-w-0" testId="attendance-table">
        <DataTableToolbar>
          <DataTableFilterSelect
            ariaLabel="Filtrer par classe"
            onChange={setClassId}
            options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
            value={classId}
          />
          <DataTableFilterDate
            ariaLabel="Date de présence"
            onChange={setDate}
            value={date}
          />
          <input
            aria-label="Rechercher un élève"
            className="ui-input w-full sm:flex-1 min-w-0 sm:min-w-[180px] h-9 py-0 bg-white border border-outline-variant/25"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un élève…"
            value={search}
          />
          <div className="flex flex-wrap items-center justify-end gap-sm w-full sm:w-auto sm:ml-auto">
            <DataTableRefreshButton loading={loading} onRefresh={() => void reload()} />
            {canCreate && (
              <button
                className="inline-flex items-center gap-sm h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-label-caps text-label-caps px-md rounded-lg transition-colors shadow-sm disabled:opacity-50"
                disabled={busy || !classId || classStudents.length === 0}
                onClick={() => void markAllPresent()}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Tout marquer présent
              </button>
            )}
          </div>
        </DataTableToolbar>

        <div className="overflow-x-auto min-h-[320px]">
          {loading ? (
            <DataTableSkeleton label="Chargement des présences…" testId="attendance-loading" />
          ) : !classId ? (
            <p className="p-lg font-body-sm text-on-surface-variant" data-testid="attendance-empty">
              Sélectionnez une classe.
            </p>
          ) : rows.length === 0 ? (
            <p className="p-lg font-body-sm text-on-surface-variant" data-testid="attendance-empty">
              {classStudents.length === 0
                ? "Aucun élève affecté à cette classe. Affectez des élèves depuis leur fiche."
                : "Aucun élève ne correspond à ce filtre."}
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low/80 sticky top-0 z-10">
                <tr className="ui-table-head-row">
                  <DataTableSelectHeader
                    checked={attendanceTable.allPageSelected}
                    indeterminate={
                      attendanceTable.somePageSelected && !attendanceTable.allPageSelected
                    }
                    onChange={attendanceTable.toggleAllPage}
                  />
                  <th className="py-sm px-md">Élève</th>
                  <th className="py-sm px-md">Statut</th>
                  <th className="py-sm px-md">Validation</th>
                  <th className="py-sm px-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm">
                {attendanceTable.pageRows.map(({ student, record }, index) => (
                  <tr
                    className={`${tableRowClass(index)} ${rowAccentClass(record?.status ?? null)}`}
                    key={student.id}
                  >
                    <DataTableSelectCell
                      checked={attendanceTable.selectedIds.has(student.id)}
                      label={studentFullName(student)}
                      onChange={() => attendanceTable.toggleOne(student.id)}
                    />
                    <td className="py-sm px-md">
                      <div className="flex items-center gap-sm min-w-0">
                        <span className="w-8 h-8 shrink-0 rounded-full bg-primary-container text-on-primary-container inline-flex items-center justify-center text-[11px] font-semibold">
                          {(student.last_name?.[0] ?? "?").toUpperCase()}
                          {(student.first_name?.[0] ?? "").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="font-title-sm truncate">{studentFullName(student)}</div>
                          <div className="text-on-surface-variant text-[12px] font-mono-data">
                            {student.matricule}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-sm px-md">
                      {record ? (
                        <StatusBadge
                          label={ATTENDANCE_STATUS_LABELS[record.status]}
                          tone={statusTone(record.status)}
                          withDot
                        />
                      ) : (
                        <StatusBadge label="Non pointé" tone="neutral" withDot />
                      )}
                    </td>
                    <td className="py-sm px-md">
                      {record?.validated_at ? (
                        <StatusBadge label="Validé" tone="success" withDot />
                      ) : (
                        <span className="text-on-surface-variant text-[12px]">En attente</span>
                      )}
                    </td>
                    <td className="py-sm px-md">
                      <div className="flex flex-wrap justify-end items-center gap-sm">
                        <div
                          className="inline-flex rounded-lg overflow-hidden gap-px bg-outline-variant/20 p-px"
                          role="group"
                          aria-label={`Statut de ${studentFullName(student)}`}
                        >
                          {(["PRESENT", "ABSENT", "LATE"] as const).map((st) => {
                            const isActive = record?.status === st;
                            const styles = STATUS_ACTION[st];
                            return (
                              <button
                                key={st}
                                className={`px-sm py-1.5 text-[11px] font-label-caps rounded-md transition-colors disabled:opacity-40 ${
                                  isActive ? styles.active : styles.idle
                                }`}
                                disabled={busy || Boolean(record?.validated_at) || !(canCreate || canUpdate)}
                                onClick={() => void setStatus(student, st)}
                                type="button"
                              >
                                {ATTENDANCE_STATUS_LABELS[st]}
                              </button>
                            );
                          })}
                        </div>
                        {record && isJustifiable(record.status) && canJustify && !record.validated_at && (
                          <button
                            aria-label={`Justifier l'absence de ${studentFullName(student)}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors disabled:opacity-40"
                            disabled={busy}
                            onClick={() => void handleJustify(record)}
                            title="Justifier"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">fact_check</span>
                          </button>
                        )}
                        {record && !record.validated_at && canValidate && (
                          <button
                            aria-label={`Valider la présence de ${studentFullName(student)}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40"
                            disabled={busy}
                            onClick={() => void handleValidate(record)}
                            title="Valider"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <DataTablePagination
            canNextPage={attendanceTable.canNextPage}
            canPreviousPage={attendanceTable.canPreviousPage}
            entityLabel="élèves"
            from={attendanceTable.from}
            onFirstPage={() => attendanceTable.setPageIndex(0)}
            onLastPage={() => attendanceTable.setPageIndex(attendanceTable.pageCount - 1)}
            onNextPage={() => attendanceTable.setPageIndex(attendanceTable.pageIndex + 1)}
            onPageChange={attendanceTable.setPageIndex}
            onPageSizeChange={attendanceTable.setPageSize}
            onPreviousPage={() => attendanceTable.setPageIndex(attendanceTable.pageIndex - 1)}
            pageCount={attendanceTable.pageCount}
            pageIndex={attendanceTable.pageIndex}
            pageSize={attendanceTable.pageSize}
            testId="attendance-pagination"
            to={attendanceTable.to}
            total={rows.length}
          />
        )}
      </DataTableShell>
      </div>
    </div>
  );
}
