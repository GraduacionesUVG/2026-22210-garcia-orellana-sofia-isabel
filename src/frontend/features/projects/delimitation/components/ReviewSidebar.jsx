"use client";

import ReviewSidebarFrame from "@/features/projects/workspace/components/ReviewSidebarFrame";
import QualityPanel from "@/features/projects/delimitation/components/QualityPanel";
import DelimitationReviewButton from "@/features/projects/delimitation/components/DelimitationReviewButton";
import { useDelimitationContext } from "@/features/projects/delimitation/components/DelimitationProvider";

export default function ReviewSidebar() {
  const { heuristics, loading, model, review } = useDelimitationContext();

  return (
    <ReviewSidebarFrame>
      <DelimitationReviewButton />

      <QualityPanel
        loading={loading}
        model={model}
        heuristics={heuristics}
        signals={heuristics?.signals ?? []}
        review={review?.reviewResult ?? null}
      />
    </ReviewSidebarFrame>
  );
}
