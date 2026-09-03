export type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-[#E0F2E9] text-[#1D7A46]",
  warning: "bg-[#FFF3CD] text-[#856404]",
  error: "bg-error-container text-on-error-container",
  info: "bg-secondary-container text-on-secondary-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-[#1D7A46]",
  warning: "bg-[#856404]",
  error: "bg-error",
  info: "bg-on-secondary-container",
  neutral: "bg-on-surface-variant",
};

export function StatusBadge({
  label,
  tone,
  withDot = false,
}: {
  label: string;
  tone: StatusTone;
  withDot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-xs px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${TONE_CLASSES[tone]}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_CLASSES[tone]}`} />}
      {label}
    </span>
  );
}
