import { api } from "@/infrastructure/api/client";
import type {
  TransportDriver,
  TransportRoute,
  TransportSubscription,
  TransportSubscriptionStatus,
  TransportVehicle,
} from "@/shared/types/transport.types";

export type TransportSubscriptionListQuery = {
  student_id?: number | string;
  transport_route_id?: number | string;
  status?: TransportSubscriptionStatus | string;
};

export function listTransportVehicles(): Promise<TransportVehicle[]> {
  return api.get<TransportVehicle[]>("/transport-vehicles");
}

export function getTransportVehicle(id: number | string): Promise<TransportVehicle> {
  return api.get<TransportVehicle>(`/transport-vehicles/${id}`);
}

export function createTransportVehicle(
  payload: Record<string, unknown>
): Promise<TransportVehicle> {
  return api.post<TransportVehicle>("/transport-vehicles", payload);
}

export function updateTransportVehicle(
  id: number | string,
  payload: Record<string, unknown>
): Promise<TransportVehicle> {
  return api.put<TransportVehicle>(`/transport-vehicles/${id}`, payload);
}

export function deleteTransportVehicle(id: number | string): Promise<null> {
  return api.delete<null>(`/transport-vehicles/${id}`);
}

export function listTransportDrivers(): Promise<TransportDriver[]> {
  return api.get<TransportDriver[]>("/transport-drivers");
}

export function getTransportDriver(id: number | string): Promise<TransportDriver> {
  return api.get<TransportDriver>(`/transport-drivers/${id}`);
}

export function createTransportDriver(
  payload: Record<string, unknown>
): Promise<TransportDriver> {
  return api.post<TransportDriver>("/transport-drivers", payload);
}

export function updateTransportDriver(
  id: number | string,
  payload: Record<string, unknown>
): Promise<TransportDriver> {
  return api.put<TransportDriver>(`/transport-drivers/${id}`, payload);
}

export function deleteTransportDriver(id: number | string): Promise<null> {
  return api.delete<null>(`/transport-drivers/${id}`);
}

export function listTransportRoutes(): Promise<TransportRoute[]> {
  return api.get<TransportRoute[]>("/transport-routes");
}

export function getTransportRoute(id: number | string): Promise<TransportRoute> {
  return api.get<TransportRoute>(`/transport-routes/${id}`);
}

export function createTransportRoute(
  payload: Record<string, unknown>
): Promise<TransportRoute> {
  return api.post<TransportRoute>("/transport-routes", payload);
}

export function updateTransportRoute(
  id: number | string,
  payload: Record<string, unknown>
): Promise<TransportRoute> {
  return api.put<TransportRoute>(`/transport-routes/${id}`, payload);
}

export function deleteTransportRoute(id: number | string): Promise<null> {
  return api.delete<null>(`/transport-routes/${id}`);
}

export function listTransportSubscriptions(
  query?: TransportSubscriptionListQuery
): Promise<TransportSubscription[]> {
  return api.get<TransportSubscription[]>("/transport-subscriptions", query);
}

export function getTransportSubscription(
  id: number | string
): Promise<TransportSubscription> {
  return api.get<TransportSubscription>(`/transport-subscriptions/${id}`);
}

export function createTransportSubscription(
  payload: Record<string, unknown>
): Promise<TransportSubscription> {
  return api.post<TransportSubscription>("/transport-subscriptions", payload);
}

export function updateTransportSubscription(
  id: number | string,
  payload: Record<string, unknown>
): Promise<TransportSubscription> {
  return api.put<TransportSubscription>(`/transport-subscriptions/${id}`, payload);
}

export function deleteTransportSubscription(id: number | string): Promise<null> {
  return api.delete<null>(`/transport-subscriptions/${id}`);
}
