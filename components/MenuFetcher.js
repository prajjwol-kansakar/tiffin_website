"use client";

import { useEffect } from "react";
import { fetchMenuWithRetry } from "@/lib/fetchMenu";

export default function MenuFetcher({
  url,
  enabled = true,
  onSuccess,
  onFailure,
  onFinished,
}) {
  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    let failureNotified = false;

    fetchMenuWithRetry(url, {
      signal: controller.signal,
      onFailure: () => {
        if (failureNotified) return;
        failureNotified = true;
        onFailure();
      },
    })
      .then(onSuccess)
      .catch((error) => {
        if (error.name !== "AbortError") {
          if (!failureNotified) onFailure();
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) onFinished?.();
      });

    return () => controller.abort();
  }, [enabled, onFailure, onFinished, onSuccess, url]);

  return null;
}
