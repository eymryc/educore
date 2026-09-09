import { Suspense } from "react";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { SystemSettingsContent } from "@/presentation/components/modules/system_settings/SystemSettingsContent";

export const metadata = {
  title: "Paramètres | EduCore",
};

export default function Page() {
  return (
    <Suspense
      fallback={<ContentSkeleton label="Chargement…" testId="settings-loading" variant="table" />}
    >
      <SystemSettingsContent />
    </Suspense>
  );
}
