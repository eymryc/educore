import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, apiRequestWithMeta } from "@/infrastructure/api/client";
import { ApiError } from "@/shared/types/api.types";

vi.mock("@/infrastructure/auth/token-storage", () => ({
  getToken: vi.fn(() => "test-token"),
  clearToken: vi.fn(),
  setToken: vi.fn(),
}));

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1");
    vi.restoreAllMocks();
  });

  it("returns data from a successful envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          success: true,
          message: "OK",
          data: { id: 1 },
        }),
      })
    );

    const data = await apiRequest<{ id: number }>("/students");
    expect(data).toEqual({ id: 1 });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/students",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("returns data and meta via apiRequestWithMeta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          success: true,
          message: "OK",
          data: [{ id: 1 }],
          meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 },
        }),
      })
    );

    const result = await apiRequestWithMeta<{ id: number }[]>("/audit-logs");
    expect(result.data).toEqual([{ id: 1 }]);
    expect(result.meta).toEqual({
      current_page: 1,
      per_page: 10,
      total: 1,
      last_page: 1,
    });
  });

  it("throws ApiError with validation details on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 422,
        ok: false,
        json: async () => ({
          success: false,
          message: "Validation échouée",
          errors: { email: ["Obligatoire"] },
        }),
      })
    );

    await expect(apiRequest("/auth/login", { method: "POST", auth: false })).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      errors: { email: ["Obligatoire"] },
    } satisfies Partial<ApiError>);
  });

  it("surfaces the backend's error message on a failed raw (file) request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        json: async () => ({
          success: false,
          message: "PDF du bulletin introuvable.",
        }),
      })
    );

    await expect(
      apiRequest("/report-cards/1/download", { raw: true })
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "PDF du bulletin introuvable.",
    } satisfies Partial<ApiError>);
  });

  it("falls back to a generic message when a failed raw request has no JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    await expect(
      apiRequest("/report-cards/1/download", { raw: true })
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      message: "Échec du téléchargement.",
    } satisfies Partial<ApiError>);
  });
});
