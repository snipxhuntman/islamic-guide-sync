// Cloud sync layer for admin-managed content.
//
// The user-facing app keeps reading data synchronously via localStorage
// (see src/data/*.ts and src/stores/dataStore.ts). This module mirrors the
// cloud `app_content` table into localStorage on boot and on realtime updates,
// so admin uploads on any device propagate to every visitor without changing
// every consumer.
//
// Admin writes go through the `admin-write` edge function so the table can
// stay write-locked at the RLS level.

import { supabase } from "@/integrations/supabase/client";

// Cloud key -> localStorage key (matches existing keys in dataStore.ts / data/*.ts)
export const CONTENT_KEYS = {
  prayer_times: "admin-prayer-times",
  messages: "admin-messages",
  classes: "admin-classes",
  broadcasts: "admin-broadcasts",
  site_links: "admin-site-links",
  iqama_settings: "admin-iqama-settings",
  privacy_policy: "admin-privacy-policy",
} as const;

export type ContentKey = keyof typeof CONTENT_KEYS;

const ADMIN_SESSION_KEY = "admin-session-token";
const ADMIN_SESSION_EXP_KEY = "admin-session-exp";

// Subscribers notified after any cloud-driven localStorage change.
// Pages can call subscribeContentSync() and re-read via existing getters.
type Listener = (key: ContentKey) => void;
const listeners = new Set<Listener>();

export function subscribeContentSync(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(key: ContentKey) {
  listeners.forEach((l) => {
    try {
      l(key);
    } catch (e) {
      console.error("Content sync listener error:", e);
    }
  });
}

function applyToLocalStorage(key: ContentKey, value: unknown) {
  const lsKey = CONTENT_KEYS[key];
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(lsKey);
    } else {
      localStorage.setItem(lsKey, JSON.stringify(value));
    }
    notify(key);
  } catch (e) {
    console.error("Failed to write content to localStorage:", e);
  }
}

let initialized = false;

export async function initContentSync(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Initial pull
  try {
    const { data, error } = await supabase
      .from("app_content")
      .select("key, value");
    if (error) {
      console.warn("Cloud content fetch failed, falling back to local:", error.message);
    } else if (data) {
      for (const row of data) {
        if (row.key in CONTENT_KEYS) {
          applyToLocalStorage(row.key as ContentKey, row.value);
        }
      }
    }
  } catch (e) {
    console.warn("Cloud content fetch threw, falling back to local:", e);
  }

  // Realtime: any admin save anywhere updates every open client
  supabase
    .channel("app_content_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_content" },
      (payload) => {
        const row = (payload.new ?? payload.old) as { key?: string; value?: unknown } | null;
        if (!row?.key || !(row.key in CONTENT_KEYS)) return;
        if (payload.eventType === "DELETE") {
          applyToLocalStorage(row.key as ContentKey, null);
        } else {
          applyToLocalStorage(row.key as ContentKey, (payload.new as { value: unknown }).value);
        }
      },
    )
    .subscribe();
}

// ----- Admin write path -----

export interface AdminSession {
  token: string;
  exp: number;
}

export function setAdminSession(session: AdminSession) {
  sessionStorage.setItem(ADMIN_SESSION_KEY, session.token);
  sessionStorage.setItem(ADMIN_SESSION_EXP_KEY, String(session.exp));
}

export function clearAdminSession() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_EXP_KEY);
}

/**
 * Returns a non-expired, structurally-valid session token, or null.
 * The signature itself can only be verified by the server; this check just
 * weeds out missing/expired/obviously-fake tokens so the UI doesn't render
 * for users who clearly aren't logged in.
 */
export function getAdminSessionToken(): string | null {
  const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
  const expRaw = sessionStorage.getItem(ADMIN_SESSION_EXP_KEY);
  if (!token || !expRaw) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    clearAdminSession();
    return null;
  }
  // Must look like `payload.signature` base64url.
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  return token;
}

/** Server-side login. Returns the session on success. */
export async function adminLogin(password: string): Promise<
  { ok: true; session: AdminSession } | { ok: false; error: string }
> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-login", {
      body: { password },
    });
    if (error) return { ok: false, error: error.message };
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Invalid server response" };
    }
    const d = data as { token?: unknown; exp?: unknown; error?: unknown };
    if (typeof d.error === "string") return { ok: false, error: d.error };
    if (typeof d.token !== "string" || typeof d.exp !== "number") {
      return { ok: false, error: "Invalid server response" };
    }
    return { ok: true, session: { token: d.token, exp: d.exp } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export interface SaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Save admin content to the cloud using the server-issued session token.
 * The plaintext password is NEVER sent on writes.
 */
export async function saveAdminContent(
  key: ContentKey,
  value: unknown,
): Promise<SaveResult> {
  const token = getAdminSessionToken();
  if (!token) {
    return {
      ok: false,
      error: "Admin session expired — please log in again.",
    };
  }

  // Optimistic local update
  applyToLocalStorage(key, value);

  try {
    const { data, error } = await supabase.functions.invoke("admin-write", {
      body: { token, key, value },
    });
    if (error) return { ok: false, error: error.message };
    if (data && typeof data === "object" && "error" in data) {
      return { ok: false, error: String((data as { error: unknown }).error) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
