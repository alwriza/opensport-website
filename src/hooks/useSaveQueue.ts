import { useCallback, useEffect, useRef, useState } from "react";
import { researchErrorText } from "@/hooks/useResearch";

/**
 * Writes run one at a time, in the order they were made. A failed write stops the
 * queue and sets `error`; nothing after it is sent until `retry()`. Leaving the page
 * with unsent writes asks the browser to confirm.
 */
export function useSaveQueue<Op>(run: (op: Op) => Promise<void>) {
  const queue = useRef<Op[]>([]);
  const pumping = useRef<Promise<void> | null>(null);
  const runRef = useRef(run);
  runRef.current = run;
  const [unsaved, setUnsaved] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const failed = useRef(false);

  const pump = useCallback(() => {
    if (pumping.current) return pumping.current;
    pumping.current = (async () => {
      while (queue.current.length > 0) {
        try {
          await runRef.current(queue.current[0]);
        } catch (e) {
          failed.current = true;
          setError(researchErrorText(e));
          break;
        }
        queue.current.shift();
        setUnsaved(queue.current.length);
      }
      pumping.current = null;
    })();
    return pumping.current;
  }, []);

  const save = useCallback(
    (op: Op) => {
      queue.current.push(op);
      setUnsaved(queue.current.length);
      if (!failed.current) void pump();
    },
    [pump],
  );

  const retry = useCallback(() => {
    failed.current = false;
    setError(null);
    void pump();
  }, [pump]);

  /** Resolves when everything is saved (true) or a write failed (false). */
  const flush = useCallback(async () => {
    if (!failed.current) await pump();
    return queue.current.length === 0;
  }, [pump]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (queue.current.length > 0) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return { save, retry, flush, unsaved, error };
}
