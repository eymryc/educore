export interface Institution {
  id: number;
  name: string;
  slug: string | null;
  registration_code: string | null;
  establishment_year: number | string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Campus {
  id: number;
  institution_id: number;
  name: string;
  address: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Building {
  id: number;
  institution_id: number;
  campus_id: number;
  name: string;
  code: string | null;
  floors: number | null;
  campus?: Campus | NamedCampusRef | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NamedCampusRef {
  id: number;
  name: string;
}

export interface InstitutionRoom {
  id: number;
  institution_id: number;
  building_id: number;
  name: string;
  code: string | null;
  capacity: number | null;
  type: string | null;
  building?: Building | { id: number; name: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type InstitutionUpdatePayload = Partial<{
  name: string;
  registration_code: string | null;
  establishment_year: number | string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
}>;

export function institutionToForm(inst: Institution): {
  name: string;
  registration_code: string;
  establishment_year: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
} {
  return {
    name: inst.name ?? "",
    registration_code: inst.registration_code ?? "",
    establishment_year:
      inst.establishment_year != null ? String(inst.establishment_year) : "",
    address: inst.address ?? "",
    phone: inst.phone ?? "",
    email: inst.email ?? "",
    logo: inst.logo ?? "",
  };
}
