"use client";

import { useCallback, useEffect, useState } from "react";
import { getAnalysisSegments } from "@/features/projects/analysis/api/analysis.api";

export function useAnalysisDocumentSegmentCodes(projectId, documentId) {
  const [codesBySegmentId, setCodesBySegmentId] = useState({});

  const load = useCallback(async () => {
    if (!projectId || !documentId) return;

    try {
      const payload = await getAnalysisSegments(projectId, {
        document_id: documentId,
        status: "all",
        limit: 200,
        offset: 0,
      });

      const next = {};
      (Array.isArray(payload?.segments) ? payload.segments : []).forEach(
        (segment) => {
          next[segment.id] = Array.isArray(segment.codes) ? segment.codes : [];
        }
      );
      setCodesBySegmentId(next);
    } catch {
                                                                              
      setCodesBySegmentId({});
    }
  }, [documentId, projectId]);

  useEffect(() => {
                                                                                     
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { codesBySegmentId, reload: load };
}
