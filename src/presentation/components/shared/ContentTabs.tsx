"use client";

export type ContentTabItem<T extends string = string> = {
  id: T;
  label: string;
  count?: number;
};

type ContentTabsProps<T extends string> = {
  items: ContentTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  testId?: string;
  /** "underline" = onglets classiques ; "segmented" = groupe compact */
  variant?: "underline" | "segmented";
};

export function ContentTabs<T extends string>({
  items,
  value,
  onChange,
  testId,
  variant = "underline",
}: ContentTabsProps<T>) {
  if (variant === "segmented") {
    return (
      <div
        className="inline-flex flex-wrap p-xs rounded-xl bg-surface-container-high gap-xs"
        data-testid={testId}
        role="tablist"
      >
        {items.map((item) => {
          const active = value === item.id;
          return (
            <button
              aria-selected={active}
              className={`inline-flex items-center gap-xs h-9 px-md rounded-lg font-title-sm text-[13px] transition-colors ${
                active
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              key={item.id}
              onClick={() => onChange(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
              {item.count != null && (
                <span
                  className={`min-w-[1.25rem] text-center text-[11px] font-medium tabular-nums ${
                    active ? "text-on-surface-variant" : "text-on-surface-variant/70"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-xs px-lg border-b border-outline-variant/20"
      data-testid={testId}
      role="tablist"
    >
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            aria-selected={active}
            className={`relative inline-flex items-center gap-sm py-md px-md font-title-sm transition-colors ${
              active
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
            key={item.id}
            onClick={() => onChange(item.id)}
            role="tab"
            type="button"
          >
            <span>{item.label}</span>
            {item.count != null && (
              <span
                className={`inline-flex items-center justify-center min-w-[1.35rem] h-5 px-1.5 rounded-md text-[11px] font-medium tabular-nums ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {item.count}
              </span>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute bottom-0 inset-x-md h-[2px] rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
