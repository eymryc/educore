"use client";

import { Checkbox } from "@/presentation/components/shared/Checkbox";
import { DatePicker } from "@/presentation/components/shared/DatePicker";
import { Select } from "@/presentation/components/shared/Select";
import type { CrudField } from "@/shared/types/crud-form.types";

interface FormFieldProps {
  field: CrudField;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
  error?: string;
}

const inputClass =
  "ui-input w-full bg-white border border-outline-variant/25";

function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [datePart = "", timePart = ""] = value.replace(" ", "T").split("T");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : "";
  const time = timePart.slice(0, 5);
  return { date, time };
}

function joinDateTime(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

export function FormField({ field, value, onChange, error }: FormFieldProps) {
  const id = `field-${field.name}`;
  const spanClass = field.colSpan === 2 ? "sm:col-span-2" : "";
  const invalidClass = error ? " border-error focus:border-error focus:ring-error/20" : "";

  if (field.type === "checkbox") {
    return (
      <div className={`flex items-center gap-sm ${spanClass}`}>
        <Checkbox
          checked={Boolean(value)}
          id={id}
          onChange={(checked) => onChange(field.name, checked)}
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
        <Select
          ariaLabel={field.label}
          className={`${inputClass} cursor-pointer${invalidClass}`}
          id={id}
          onChange={(v) => onChange(field.name, v)}
          options={field.options ?? []}
          placeholder="— Sélectionner —"
          searchable
          value={String(value ?? "")}
        />
      ) : field.type === "date" ? (
        <DatePicker
          ariaLabel={field.label}
          error={Boolean(error)}
          id={id}
          onChange={(v) => onChange(field.name, v)}
          required={field.required}
          value={String(value ?? "")}
        />
      ) : field.type === "datetime-local" ? (
        <DateTimeField
          error={Boolean(error)}
          id={id}
          invalidClass={invalidClass}
          label={field.label}
          onChange={(v) => onChange(field.name, v)}
          required={field.required}
          value={String(value ?? "")}
        />
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

function DateTimeField({
  id,
  label,
  value,
  onChange,
  required,
  error,
  invalidClass,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error: boolean;
  invalidClass: string;
}) {
  const { date, time } = splitDateTime(value);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_8.5rem] gap-sm">
      <DatePicker
        ariaLabel={label}
        error={error}
        id={id}
        onChange={(nextDate) => onChange(joinDateTime(nextDate, time))}
        required={required}
        value={date}
      />
      <input
        aria-label={`${label} — heure`}
        className={`${inputClass}${invalidClass}`}
        onChange={(e) => onChange(joinDateTime(date, e.target.value))}
        required={required}
        type="time"
        value={time}
      />
    </div>
  );
}
