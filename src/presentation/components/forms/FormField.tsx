"use client";

import type { CrudField } from "@/shared/types/crud-form.types";

interface FormFieldProps {
  field: CrudField;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
  error?: string;
}

const inputClass =
  "w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-md py-sm text-body-sm text-on-surface outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

export function FormField({ field, value, onChange, error }: FormFieldProps) {
  const id = `field-${field.name}`;
  const spanClass = field.colSpan === 2 ? "sm:col-span-2" : "";
  const invalidClass = error ? " border-error focus:border-error focus:ring-error/20" : "";

  if (field.type === "checkbox") {
    return (
      <div className={`flex items-center gap-sm ${spanClass}`}>
        <input
          checked={Boolean(value)}
          className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary/20"
          id={id}
          onChange={(e) => onChange(field.name, e.target.checked)}
          type="checkbox"
        />
        <label className="text-body-sm text-on-surface" htmlFor={id}>
          {field.label}
        </label>
      </div>
    );
  }

  return (
    <div className={spanClass}>
      <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-xs" htmlFor={id}>
        {field.label}
        {field.required && <span className="text-error ml-xs">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          aria-invalid={Boolean(error)}
          className={`${inputClass} min-h-[96px] resize-y${invalidClass}`}
          id={id}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          value={String(value ?? "")}
        />
      ) : field.type === "select" ? (
        <select
          aria-invalid={Boolean(error)}
          className={`${inputClass} cursor-pointer${invalidClass}`}
          id={id}
          onChange={(e) => onChange(field.name, e.target.value)}
          required={field.required}
          value={String(value ?? "")}
        >
          <option value="">— Sélectionner —</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-invalid={Boolean(error)}
          className={`${inputClass}${invalidClass}`}
          id={id}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          type={field.type}
          value={String(value ?? "")}
        />
      )}

      {error ? (
        <p className="mt-xs text-[12px] text-error" role="alert">
          {error}
        </p>
      ) : field.hint ? (
        <p className="mt-xs text-[12px] text-on-surface-variant">{field.hint}</p>
      ) : null}
    </div>
  );
}
