import type { AcademicYear } from "@/shared/types/academic.types";
import type { Student } from "@/shared/types/student.types";
import { studentFullName } from "@/shared/types/student.types";

export type TransportVehicleStatus = "ACTIVE" | "MAINTENANCE" | "RETIRED";
export type TransportDriverStatus = "ACTIVE" | "INACTIVE";
export type TransportSubscriptionStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED";

export interface TransportVehicle {
  id: number;
  institution_id: number;
  plate_number: string;
  label: string;
  capacity: number | null;
  status: TransportVehicleStatus;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TransportDriver {
  id: number;
  institution_id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  status: TransportDriverStatus;
  hired_at: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TransportRouteStop {
  id: number;
  transport_route_id: number;
  name: string;
  address: string | null;
  stop_order: number;
  pickup_time: string | null;
}

export interface TransportRoute {
  id: number;
  institution_id: number;
  name: string;
  code: string | null;
  description: string | null;
  transport_vehicle_id: number | null;
  transport_driver_id: number | null;
  is_active: boolean;
  vehicle?: TransportVehicle | null;
  driver?: TransportDriver | null;
  stops?: TransportRouteStop[];
  subscriptions_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TransportSubscription {
  id: number;
  institution_id: number;
  student_id: number;
  transport_route_id: number;
  transport_route_stop_id: number | null;
  academic_year_id: number;
  status: TransportSubscriptionStatus;
  start_date: string;
  end_date: string | null;
  monthly_fee: number | string | null;
  student?: Student | null;
  route?: TransportRoute | null;
  stop?: TransportRouteStop | null;
  academic_year?: AcademicYear | { id: number; name: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export const TRANSPORT_VEHICLE_STATUS_LABELS: Record<TransportVehicleStatus, string> = {
  ACTIVE: "Actif",
  MAINTENANCE: "Maintenance",
  RETIRED: "Retiré",
};

export const TRANSPORT_DRIVER_STATUS_LABELS: Record<TransportDriverStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
};

export const TRANSPORT_SUBSCRIPTION_STATUS_LABELS: Record<
  TransportSubscriptionStatus,
  string
> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  CANCELLED: "Annulé",
};

export function transportDriverName(
  row: Pick<TransportDriver, "first_name" | "last_name"> | null | undefined
): string {
  if (!row) return "—";
  return `${row.first_name} ${row.last_name}`.trim();
}

export function transportSubscriptionLabel(row: TransportSubscription): string {
  if (row.student) return studentFullName(row.student);
  return `Élève #${row.student_id}`;
}

/** Encode stops for textarea: name | address | order | HH:MM */
export function encodeStopsText(stops: TransportRouteStop[] | undefined): string {
  if (!stops?.length) return "";
  return [...stops]
    .sort((a, b) => a.stop_order - b.stop_order)
    .map((s) =>
      [s.name, s.address ?? "", String(s.stop_order), s.pickup_time ?? ""]
        .join(" | ")
        .replace(/\s+\|\s+$/, "")
    )
    .join("\n");
}

export function parseStopsText(
  text: string
): Array<{
  name: string;
  address: string | null;
  stop_order?: number;
  pickup_time: string | null;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line, index) => {
    const parts = line.split("|").map((p) => p.trim());
    const name = parts[0] || `Arrêt ${index + 1}`;
    const address = parts[1] || null;
    const orderRaw = parts[2];
    const pickup = parts[3] || null;
    const stop_order =
      orderRaw && !Number.isNaN(Number(orderRaw)) ? Number(orderRaw) : index + 1;
    return {
      name,
      address: address === "" ? null : address,
      stop_order,
      pickup_time: pickup === "" ? null : pickup,
    };
  });
}

export function vehicleToForm(row: TransportVehicle): Record<string, string | boolean> {
  return {
    plate_number: row.plate_number ?? "",
    label: row.label ?? "",
    capacity: row.capacity != null ? String(row.capacity) : "",
    status: row.status ?? "ACTIVE",
    notes: row.notes ?? "",
  };
}

export function driverToForm(row: TransportDriver): Record<string, string | boolean> {
  return {
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    license_number: row.license_number ?? "",
    status: row.status ?? "ACTIVE",
    hired_at: row.hired_at?.slice(0, 10) ?? "",
  };
}

export function routeToForm(row: TransportRoute): Record<string, string | boolean> {
  return {
    name: row.name ?? "",
    code: row.code ?? "",
    description: row.description ?? "",
    transport_vehicle_id:
      row.transport_vehicle_id != null ? String(row.transport_vehicle_id) : "",
    transport_driver_id:
      row.transport_driver_id != null ? String(row.transport_driver_id) : "",
    is_active: Boolean(row.is_active),
    stops_text: encodeStopsText(row.stops),
  };
}

export function subscriptionToForm(
  row: TransportSubscription
): Record<string, string | boolean> {
  return {
    student_id: String(row.student_id ?? ""),
    transport_route_id: String(row.transport_route_id ?? ""),
    transport_route_stop_id:
      row.transport_route_stop_id != null ? String(row.transport_route_stop_id) : "",
    academic_year_id: String(row.academic_year_id ?? ""),
    start_date: row.start_date?.slice(0, 10) ?? "",
    end_date: row.end_date?.slice(0, 10) ?? "",
    monthly_fee: row.monthly_fee != null ? String(row.monthly_fee) : "",
    status: row.status ?? "ACTIVE",
  };
}
