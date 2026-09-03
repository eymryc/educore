export type CrudFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "datetime-local"
  | "time"
  | "textarea"
  | "select"
  | "checkbox";

export interface CrudFieldOption {
  value: string;
  label: string;
}

export interface CrudField {
  name: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  placeholder?: string;
  options?: CrudFieldOption[];
  colSpan?: 1 | 2;
  hint?: string;
}

export interface CrudSection {
  title: string;
  description?: string;
  fields: CrudField[];
}

export interface CrudResourceConfig {
  key: string;
  label: string;
  labelSingular: string;
  listPath: string;
  sections: CrudSection[];
}
