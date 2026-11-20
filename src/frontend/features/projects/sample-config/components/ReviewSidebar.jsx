"use client";

import ReviewSidebarFrame from "@/features/projects/workspace/components/ReviewSidebarFrame";
import SampleConfigReviewButton from "@/features/projects/sample-config/components/SampleConfigReviewButton";
import SampleConfigQualityPanel from "@/features/projects/sample-config/components/SampleConfigQualityPanel";
import { useSampleConfigContext } from "@/features/projects/sample-config/components/SampleConfigProvider";

export default function ReviewSidebar() {
  const { bootstrapping, review } = useSampleConfigContext();

  return (
    <ReviewSidebarFrame>
      <SampleConfigReviewButton />

      <SampleConfigQualityPanel
        loading={bootstrapping}
        evaluation={review?.evaluationResult}
        review={review?.reviewResult}
      />
    </ReviewSidebarFrame>
  );
}
