"use client";

import ReviewSidebarFrame from "@/features/projects/workspace/components/ReviewSidebarFrame";
import ResearchDesignReviewButton from "@/features/projects/research-design/components/ResearchDesignReviewButton";
import ResearchDesignQualityPanel from "@/features/projects/research-design/components/ResearchDesignQualityPanel";
import { useResearchDesignContext } from "@/features/projects/research-design/components/ResearchDesignProvider";

export default function ReviewSidebar() {
  const { review, model } = useResearchDesignContext();

  return (
    <ReviewSidebarFrame>
      <ResearchDesignReviewButton />

      <ResearchDesignQualityPanel
        evaluationLoading={review?.evaluationLoading}
        evaluationError={review?.evaluationError}
        evaluation={review?.evaluationResult}
        review={review?.reviewResult}
        reviewMeta={review?.reviewMeta}
        specificObjectives={model?.specific_objectives}
      />
    </ReviewSidebarFrame>
  );
}