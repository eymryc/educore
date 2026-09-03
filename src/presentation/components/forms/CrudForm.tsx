"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormField } from "@/presentation/components/forms/FormField";
import { getCrudAdapter } from "@/infrastructure/api/crud-adapters";
import { getAuthErrorMessage } from "@/infrastructure/auth/AuthProvider";
import { firstFieldError } from "@/shared/lib/form-mapper";
import { ApiError } from "@/shared/types/api.types";
import type { CrudFieldOption, CrudResourceConfig } from "@/shared/types/crud-form.types";
import { useConfirm } from "@/presentation/components/providers/ConfirmDialogProvider";
import { FormSkeleton } from "@/presentation/components/shared/DataTableSkeleton";

interface CrudFormProps {
  config: CrudResourceConfig;
  mode: "create" | "edit";
  recordId?: string;
  initialValues?: Record<string, string | boolean>;
}

function buildEmptyValues(config: CrudResourceConfig): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const section of config.sections) {
    for (const field of section.fields) {
      values[field.name] = field.type === "checkbox" ? false : "";
    }
  }
  return values;
}

export function CrudForm({ config, mode, recordId, initialValues }: CrudFormProps) {
  const confirmDialog = useConfirm();
  const router = useRouter();
  const adapter = getCrudAdapter(config.key);
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const base = initialValues ?? buildEmptyValues(config);
    if (mode === "create" && base.status === "") {
      base.status = "active";
    }
    if (mode === "create" && (config.key === "parents" || config.key === "teachers")) {
      base.create_portal_account = true;
    }
    return base;
  });
  const [fieldOptions, setFieldOptions] = useState<Record<string, CrudFieldOption[]>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(adapter && mode === "edit"));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const allFields = useMemo(
    () => config.sections.flatMap((s) => s.fields),
    [config.sections]
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!adapter) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const options = adapter.loadFieldOptions ? await adapter.loadFieldOptions() : {};
        if (cancelled) return;
        setFieldOptions(options);

        if (mode === "edit" && recordId) {
          const record = await adapter.loadRecord(recordId);
          if (!cancelled) setValues(record);
        }
      } catch (err) {
        if (!cancelled) setError(getAuthErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [adapter, mode, recordId]);

  const handleChange = (name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      if (adapter) {
        if (mode === "create") {
          await adapter.create(values);
        } else if (recordId) {
          await adapter.update(recordId, values);
        }
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      router.push(config.listPath);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setError(getAuthErrorMessage(err));
      } else {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!recordId || !await confirmDialog("Confirmer la suppression de cet enregistrement ?")) return;
    setSaving(true);
    setError(null);
    try {
      if (adapter) {
        await adapter.remove(recordId);
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }
      router.push(config.listPath);
      router.refresh();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto w-full py-2xl">
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {mode === "edit" && recordId && (
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">
          Référence : {recordId}
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-lg rounded-lg bg-error-container text-on-error-container px-md py-sm font-body-sm"
        >
          {error}
        </div>
      )}

      <form className="space-y-lg" onSubmit={handleSubmit}>
        {config.sections.map((section) => (
          <section
            key={section.title}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm p-lg"
          >
            <div className="mb-md pb-md border-b border-outline-variant/20">
              <h2 className="font-headline-md text-headline-md text-on-surface">{section.title}</h2>
              {section.description && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  {section.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {section.fields
                .filter((field) => !(mode === "edit" && field.name === "create_portal_account"))
                .map((field) => {
                const options = fieldOptions[field.name] ?? field.options;
                return (
                  <FormField
                    key={field.name}
                    error={firstFieldError(fieldErrors, field.name)}
                    field={{ ...field, options }}
                    onChange={handleChange}
                    value={values[field.name] ?? (field.type === "checkbox" ? false : "")}
                  />
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-md pt-md">
          <div className="flex flex-wrap gap-sm">
            <button
              className="inline-flex items-center gap-sm bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps px-lg py-sm rounded-full transition-colors shadow-sm disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {saving ? "Enregistrement..." : mode === "create" ? "Créer" : "Enregistrer"}
            </button>
            <Link
              className="inline-flex items-center gap-sm bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps px-lg py-sm rounded-full transition-colors"
              href={config.listPath}
            >
              Annuler
            </Link>
          </div>

          {mode === "edit" && (
            <button
              className="inline-flex items-center gap-sm text-error hover:bg-error-container/30 font-label-caps text-label-caps px-md py-sm rounded-lg transition-colors disabled:opacity-60"
              disabled={saving}
              onClick={handleDelete}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Supprimer
            </button>
          )}
        </div>
      </form>

      <p className="mt-lg text-[12px] text-on-surface-variant text-center">
        {allFields.filter((f) => f.required).length} champ(s) obligatoire(s)
        {adapter ? " — enregistrement via API." : " — données enregistrées localement (API à connecter)."}
      </p>
    </div>
  );
}
