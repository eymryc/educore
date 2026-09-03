import { api } from "@/infrastructure/api/client";
import type {
  InventoryAsset,
  InventoryAssetStatus,
  InventorySupply,
  InventorySupplyMovement,
} from "@/shared/types/inventory.types";

export type InventorySupplyListQuery = {
  search?: string;
  category?: string;
  is_active?: boolean | number | string;
  low_stock_only?: boolean | number | string;
};

export type InventoryAssetListQuery = {
  search?: string;
  category?: string;
  status?: InventoryAssetStatus | string;
};

export function listInventorySupplies(
  query?: InventorySupplyListQuery
): Promise<InventorySupply[]> {
  return api.get<InventorySupply[]>("/inventory-supplies", query);
}

export function listLowStockSupplies(): Promise<InventorySupply[]> {
  return api.get<InventorySupply[]>("/inventory-supplies/low-stock");
}

export function getInventorySupply(id: number | string): Promise<InventorySupply> {
  return api.get<InventorySupply>(`/inventory-supplies/${id}`);
}

export function createInventorySupply(
  payload: Record<string, unknown>
): Promise<InventorySupply> {
  return api.post<InventorySupply>("/inventory-supplies", payload);
}

export function updateInventorySupply(
  id: number | string,
  payload: Record<string, unknown>
): Promise<InventorySupply> {
  return api.put<InventorySupply>(`/inventory-supplies/${id}`, payload);
}

export function deleteInventorySupply(id: number | string): Promise<null> {
  return api.delete<null>(`/inventory-supplies/${id}`);
}

export function restockInventorySupply(
  id: number | string,
  payload: Record<string, unknown>
): Promise<InventorySupplyMovement> {
  return api.post<InventorySupplyMovement>(
    `/inventory-supplies/${id}/restocks`,
    payload
  );
}

export function listInventoryAssets(
  query?: InventoryAssetListQuery
): Promise<InventoryAsset[]> {
  return api.get<InventoryAsset[]>("/inventory-assets", query);
}

export function getInventoryAsset(id: number | string): Promise<InventoryAsset> {
  return api.get<InventoryAsset>(`/inventory-assets/${id}`);
}

export function createInventoryAsset(
  payload: Record<string, unknown>
): Promise<InventoryAsset> {
  return api.post<InventoryAsset>("/inventory-assets", payload);
}

export function updateInventoryAsset(
  id: number | string,
  payload: Record<string, unknown>
): Promise<InventoryAsset> {
  return api.put<InventoryAsset>(`/inventory-assets/${id}`, payload);
}

export function deleteInventoryAsset(id: number | string): Promise<null> {
  return api.delete<null>(`/inventory-assets/${id}`);
}

export function assignInventoryAsset(
  id: number | string,
  payload: Record<string, unknown>
): Promise<InventoryAsset> {
  return api.post<InventoryAsset>(`/inventory-assets/${id}/assign`, payload);
}
