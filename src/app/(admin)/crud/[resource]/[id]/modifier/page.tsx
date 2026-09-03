import { notFound } from "next/navigation";
import { CrudForm } from "@/presentation/components/forms/CrudForm";
import { getCrudResource } from "@/shared/config/crud-forms";

interface PageProps {
  params: Promise<{ resource: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { resource } = await params;
  const config = getCrudResource(resource);
  if (!config) return { title: "Modifier | EduCore" };
  return { title: `Modifier ${config.labelSingular} | EduCore` };
}

export default async function CrudEditPage({ params }: PageProps) {
  const { resource, id } = await params;
  const config = getCrudResource(resource);
  if (!config) notFound();

  return <CrudForm config={config} mode="edit" recordId={decodeURIComponent(id)} />;
}
