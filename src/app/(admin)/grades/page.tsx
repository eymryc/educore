import { Suspense } from "react";
import { ContentSkeleton } from "@/presentation/components/shared/DataTableSkeleton";
import { GradesEntryContent } from "@/presentation/components/modules/grades_entry/GradesEntryContent";

export const metadata = {
  title: "Notes | EduCore",
};

export default function Page() {
  return (
    <Suspense
      fallback={<ContentSkeleton label="Chargement…" testId="grades-loading" variant="table" />}
    >
      <GradesEntryContent />
    </Suspense>
  );
}
