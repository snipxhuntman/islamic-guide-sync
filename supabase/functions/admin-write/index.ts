// Edge function: validates a server-issued admin session token (HMAC) and
// upserts a row in app_content. The client never sends the plaintext password
// to this endpoint anymore — only the short-lived token returned by
// `admin-login` is accepted.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_KEYS = new Set([
  "prayer_times",
  "messages",
  "classes",
  "broadcasts",
  "site_links",
  "iqama_settings",
  "privacy_policy",
]);

// In-memory rate limiter: max 5 failed auth attempts per IP per 15 minutes.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_FAILURES = 5;
const failureTracker = new Map<string, { count: number; firstAt: number }>();

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const entry = failureTracker.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
    failureTracker.delete(ip);
    return false;
  }
  return entry.count >= RATE_LIMIT_MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const entry = failureTracker.get(ip);
  const now = Date.now();
  if (!entry || now - entry.firstAt > RATE_LIMIT_WINDOW_MS) {
    failureTracker.set(ip, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Constant-time byte comparison.
function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

async function verifySession(secret: string, token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expectedSig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  let providedSig: Uint8Array;
  try {
    providedSig = b64urlDecode(sigB64);
  } catch {
    return false;
  }
  if (!timingSafeEqualBytes(expectedSig, providedSig)) return false;

  try {
    const payloadJson = new TextDecoder().decode(b64urlDecode(payloadB64));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    if (Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);

  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many failed attempts. Try again later." }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": "900",
        },
      },
    );
  }

  try {
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!adminPassword || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token, key, value } = body as {
      token?: string;
      key?: string;
      value?: unknown;
    };

    if (typeof token !== "string" || !(await verifySession(adminPassword, token))) {
      recordFailure(clientIp);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof key !== "string" || !ALLOWED_KEYS.has(key)) {
      return new Response(JSON.stringify({ error: "Invalid key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (value === undefined || value === null) {
      return new Response(JSON.stringify({ error: "Missing value" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serialized = JSON.stringify(value);
    if (serialized.length > 5_000_000) {
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await admin
      .from("app_content")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) {
      console.error("Upsert error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
