import { toast } from "sonner";
import { clearToken, getToken } from "@/infrastructure/auth/token-storage";
import {
  ApiError,
  type ApiEnvelope,
  type ApiFailure,
  type PaginationMeta,
} from "@/shared/types/api.types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;
  headers?: Record<string, string>;
  /** When true, return raw Response (exports PDF/CSV/XLSX). */
  raw?: boolean;
};

type ApiSuccessPayload<T> = {
  data: T;
  meta?: PaginationMeta;
  message?: string;
};

function getBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL n'est pas défini. Créez un fichier .env.local.",
      500
    );
  }
  return base.replace(/\/$/, "");
}

function buildUrl(path: string, query?: ApiRequestOptions["query"]): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${getBaseUrl()}${normalized}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function parseEnvelope<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiSuccessPayload<T>> {
  const { method = "GET", body, query, auth = true, headers = {}, raw = false } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (response.status === 401 && auth) {
    clearToken();
    onUnauthorized?.();
    throw new ApiError("Session expirée. Veuillez vous reconnecter.", 401);
  }

  if (raw) {
    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as ApiFailure | null;
      const message = errorPayload?.message || "Échec du téléchargement.";
      toast.error(message);
      throw new ApiError(message, response.status, errorPayload?.errors ?? {});
    }
    return { data: response as unknown as T };
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!payload || typeof payload !== "object" || !("success" in payload)) {
    const message = "Réponse API invalide.";
    toast.error(message);
    throw new ApiError(message, response.status || 500);
  }

  if (!payload.success) {
    const message = payload.message || "Une erreur est survenue.";
    toast.error(message);
    throw new ApiError(message, response.status, payload.errors ?? {});
  }

  if (
    method !== "GET" &&
    payload.message &&
    !path.startsWith("/auth/refresh") &&
    !path.startsWith("/auth/logout")
  ) {
    toast.success(payload.message);
  }

  return {
    data: payload.data,
    meta: payload.meta as PaginationMeta | undefined,
    message: payload.message,
  };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const result = await parseEnvelope<T>(path, options);
  return result.data;
}

/** Like apiRequest but keeps pagination `meta` when present. */
export async function apiRequestWithMeta<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<{ data: T; meta?: PaginationMeta; message?: string }> {
  return parseEnvelope<T>(path, options);
}

export const api = {
  get: <T>(path: string, query?: ApiRequestOptions["query"]) =>
    apiRequest<T>(path, { method: "GET", query }),
  getWithMeta: <T>(path: string, query?: ApiRequestOptions["query"]) =>
    apiRequestWithMeta<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};
