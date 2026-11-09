import { useEffect, useState } from "react";

/**
 * The sample match report (/match-analysis/example) is highlighted in the navbar
 * until the user has opened it once. Stored per browser; failing storage just
 * keeps the highlight.
 */
export const MATCH_EXAMPLE_ID = "example";
const SEEN_KEY = "opensport:match-example-seen";
const EVENT = "opensport:match-example-seen";

function readSeen(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}

export function markMatchExampleSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useMatchExampleSeen(): boolean {
  const [seen, setSeen] = useState(readSeen);
  useEffect(() => {
    const update = () => setSeen(readSeen());
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return seen;
}
