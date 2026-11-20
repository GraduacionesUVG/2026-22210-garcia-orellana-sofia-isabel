"use client";

import { useEffect, useRef } from "react";

export function useSampleConfigAutosave({
  enabled,
  isDirty,
  changeKey,
  savingState,
  delay = 1400,
  onAutosave,
}) {
  const timeoutRef = useRef(null);
  const latestSaveRef = useRef(onAutosave);
  const lastQueuedKeyRef = useRef(null);

  useEffect(() => {
    latestSaveRef.current = onAutosave;
  }, [onAutosave]);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!enabled) return;
    if (!isDirty) return;
    if (!changeKey) return;
    if (savingState === "saving") return;
    if (lastQueuedKeyRef.current === changeKey) return;

    timeoutRef.current = window.setTimeout(() => {
      lastQueuedKeyRef.current = changeKey;
      latestSaveRef.current?.();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, isDirty, changeKey, savingState, delay]);

  useEffect(() => {
    if (!isDirty) {
      lastQueuedKeyRef.current = null;
    }
  }, [isDirty]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}