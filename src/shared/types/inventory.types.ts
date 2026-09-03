export type InventoryMovementType = "restock" | "consumption" | "adjustment";
export type InventoryAssetStatus = "en_service" | "maintenance" | "reforme";
export type InventoryHistoryEventType =
  | "created"
  | "assigned"
  | "status_changed"
  | "location_changed"
  | "updated";

export interface InventorySupplyMovement {
  id: number;
  inventory_supply_id: number;
  type: InventoryMovementType;
  quantity: number | string;
  movement_date: string;
  supplier: string | null;
  notes: string | null;
  recorded_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InventorySupply {
  id: number;
  institution_id: number;
  designation: string;
  category: string;
  quantity: number | string;
  alert_threshold: number | string | null;
  unit: string | null;
  supplier: string | null;
  is_active: boolean;
  is_low_stock?: boolean;
  movements?: InventorySupplyMovement[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InventoryAssetHistory {
  id: number;
  inventory_asset_id: number;
  event_type: InventoryHistoryEventType;
  description: string | null;
  old_status: string | null;
  new_status: string | null;
  old_location: string | null;
  new_location: string | null;
  assigned_staff_member_id: number | null;
  assigned_room_id: number | null;
  recorded_by: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InventoryAsset {
  id: number;
  institution_id: number;
  designation: string;
  category: string;
  serial_number: string | null;
  acquisition_date: string | null;
  value: number | string | null;
  location: string | null;
  status: InventoryAssetStatus;
  assigned_staff_member_id: number | null;
  assigned_room_id: number | null;
  assigned_staff_member?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  assigned_room?: { id: number; name: string; code?: string | null } | null;
  histories?: InventoryAssetHistory[];
  created_at?: string | null;
  updated_at?: string | null;
}

export const INVENTORY_MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  restock: "Réappro.",
  consumption: "Consommation",
  adjustment: "Ajustement",
};

export const INVENTORY_ASSET_STATUS_LABELS: Record<InventoryAssetStatus, string> = {
  en_service: "En service",
  maintenance: "Maintenance",
  reforme: "Réformé",
};

export const INVENTORY_HISTORY_EVENT_LABELS: Record<InventoryHistoryEventType, string> = {
  created: "Création",
  assigned: "Affectation",
  status_changed: "Changement de statut",
  location_changed: "Changement de lieu",
  updated: "Mise à jour",
};

export function isSupplyLowStock(row: InventorySupply): boolean {
  if (typeof row.is_low_stock === "boolean") return row.is_low_stock;
  if (row.alert_threshold == null || row.alert_threshold === "") return false;
  return Number(row.quantity) <= Number(row.alert_threshold);
}

export function supplyToForm(row: InventorySupply): Record<string, string | boolean> {
  return {
    designation: row.designation ?? "",
    category: row.category ?? "",
    quantity: String(row.quantity ?? "0"),
    alert_threshold:
      row.alert_threshold != null && row.alert_threshold !== ""
        ? String(row.alert_threshold)
        : "",
    unit: row.unit ?? "",
    supplier: row.supplier ?? "",
    is_active: Boolean(row.is_active),
  };
}

export function assetToForm(row: InventoryAsset): Record<string, string | boolean> {
  return {
    designation: row.designation ?? "",
    category: row.category ?? "",
    serial_number: row.serial_number ?? "",
    acquisition_date: row.acquisition_date?.slice(0, 10) ?? "",
    value: row.value != null ? String(row.value) : "",
    location: row.location ?? "",
    status: row.status ?? "en_service",
    assigned_staff_member_id:
      row.assigned_staff_member_id != null
        ? String(row.assigned_staff_member_id)
        : "",
    assigned_room_id:
      row.assigned_room_id != null ? String(row.assigned_room_id) : "",
  };
}
