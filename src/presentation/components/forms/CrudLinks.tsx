import Link from "next/link";

interface CrudCreateLinkProps {
  resource: string;
  label: string;
  className?: string;
  icon?: string;
}

const defaultClass =
  "inline-flex items-center gap-sm bg-primary hover:bg-primary/90 text-on-primary font-label-caps text-label-caps px-md py-sm rounded-lg transition-colors shadow-sm";

export function CrudCreateLink({
  resource,
  label,
  className = defaultClass,
  icon = "add",
}: CrudCreateLinkProps) {
  return (
    <Link className={className} href={`/crud/${resource}/nouveau`}>
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </Link>
  );
}

interface CrudEditLinkProps {
  resource: string;
  recordId: string;
  className?: string;
  label?: string;
}

export function CrudEditLink({
  resource,
  recordId,
  className = "p-sm text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-lg transition-colors",
  label = "Modifier",
}: CrudEditLinkProps) {
  return (
    <Link
      aria-label={label}
      className={className}
      href={`/crud/${resource}/${recordId}/modifier`}
      title={label}
    >
      <span className="material-symbols-outlined text-[20px]">edit</span>
    </Link>
  );
}
