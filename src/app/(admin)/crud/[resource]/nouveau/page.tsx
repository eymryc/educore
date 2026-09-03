import { notFound } from "next/navigation";
import { CrudForm } from "@/presentation/components/forms/CrudForm";
import { getCrudResource } from "@/shared/config/crud-forms";

interface PageProps {
  params: Promise<{ resource: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { resource } = await params;
  const config = getCrudResource(resource);
  if (!config) return { title: "Formulaire | EduCore" };
  return { title: `Nouveau ${config.labelSingular} | EduCore` };
}

export default async function CrudCreatePage({ params }: PageProps) {
  const { resource } = await params;
  const config = getCrudResource(resource);
  if (!config) notFound();

  return <CrudForm config={config} mode="create" />;
}
