"use client";

import { Checkbox as RadixCheckbox } from "radix-ui";

/**
 * Remplace `<input type="checkbox">` natif par la primitive Radix —
 * supporte l'état indéterminé nativement (pas de hack `ref.indeterminate`),
 * stylisation entièrement contrôlée par les tokens `ui-*` existants.
 */
export function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  disabled,
  ariaLabel,
  id,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  className?: string;
}) {
  return (
    <RadixCheckbox.Root
      aria-label={ariaLabel}
      checked={indeterminate ? "indeterminate" : checked}
      className={`size-4 shrink-0 rounded border border-outline-variant bg-surface-container-lowest flex items-center justify-center transition-colors data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${className}`}
      disabled={disabled}
      id={id}
      onCheckedChange={(value) => onChange(value === true)}
    >
      <RadixCheckbox.Indicator className="text-on-primary flex items-center justify-center">
        {indeterminate ? (
          <span aria-hidden className="block w-2 h-[2px] rounded-full bg-current" />
        ) : (
          <svg
            aria-hidden
            className="w-2.5 h-2.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            viewBox="0 0 16 16"
          >
            <path d="M3 8.5L6.5 12L13 4.5" />
          </svg>
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
