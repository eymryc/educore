import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const put = vi.fn();
const post = vi.fn();
const del = vi.fn();

vi.mock("@/infrastructure/api/client", () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    put: (...args: unknown[]) => put(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}));

import {
  createCampus,
  getInstitution,
  getSettings,
  listCampuses,
  updateInstitution,
  updateSettings,
} from "@/infrastructure/api/resources/institution";
import { institutionToForm } from "@/shared/types/institution.types";

describe("institution resource", () => {
  beforeEach(() => {
    get.mockReset();
    put.mockReset();
    post.mockReset();
    del.mockReset();
  });

  it("gets and updates institution", async () => {
    get.mockResolvedValue({ id: 1, name: "Demo" });
    put.mockResolvedValue({ id: 1, name: "Demo 2" });

    await expect(getInstitution()).resolves.toEqual({ id: 1, name: "Demo" });
    expect(get).toHaveBeenCalledWith("/institution");

    await expect(updateInstitution({ name: "Demo 2" })).resolves.toEqual({
      id: 1,
      name: "Demo 2",
    });
    expect(put).toHaveBeenCalledWith("/institution", { name: "Demo 2" });
  });

  it("mirrors settings endpoints", async () => {
    get.mockResolvedValue({ id: 1, name: "Demo" });
    put.mockResolvedValue({ id: 1, name: "Demo" });

    await getSettings();
    expect(get).toHaveBeenCalledWith("/settings");
    await updateSettings({ phone: "01" });
    expect(put).toHaveBeenCalledWith("/settings", { phone: "01" });
  });

  it("lists and creates campuses", async () => {
    get.mockResolvedValue([{ id: 1, name: "Nord" }]);
    post.mockResolvedValue({ id: 2, name: "Sud" });

    await expect(listCampuses()).resolves.toEqual([{ id: 1, name: "Nord" }]);
    expect(get).toHaveBeenCalledWith("/campuses");
    await createCampus({ name: "Sud" });
    expect(post).toHaveBeenCalledWith("/campuses", { name: "Sud" });
  });
});

describe("institutionToForm", () => {
  it("normalizes nullables to empty strings", () => {
    expect(
      institutionToForm({
        id: 1,
        name: "X",
        slug: null,
        registration_code: null,
        establishment_year: null,
        address: null,
        phone: null,
        email: null,
        logo: null,
      })
    ).toEqual({
      name: "X",
      registration_code: "",
      establishment_year: "",
      address: "",
      phone: "",
      email: "",
      logo: "",
    });
  });
});
