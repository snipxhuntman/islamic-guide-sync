import { useEffect, useState } from "react";
import { subscribeContentSync, type ContentKey } from "@/stores/contentSync";

/**
 * Returns a number that bumps whenever the given cloud-synced content key
 * is updated locally (from the initial cloud pull or from a realtime push).
 *
 * Pages use this as a dependency in their existing useEffects so they
 * re-read from the (sync) localStorage-backed getters whenever cloud data
 * changes — no need to refactor every consumer to async.
 *
 * Pass no key to be notified about ANY content change.
 */
export function useContentVersion(key?: ContentKey): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    return subscribeContentSync((changedKey) => {
      if (!key || changedKey === key) {
        setVersion((v) => v + 1);
      }
    });
  }, [key]);

  return version;
}
