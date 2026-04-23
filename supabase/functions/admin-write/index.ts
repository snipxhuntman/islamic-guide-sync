// Edge function: validates admin password and upserts a row in app_content.
// All admin writes go through here so the table can stay write-locked publicly.
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
// Successful auths reset the counter.
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

function clearFailures(ip: string): void {
  failureTracker.delete(ip);
}

// Constant-time string comparison to avoid timing-based password discovery.
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  // Compare against the longer length so timing doesn't leak length info.
  const len = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
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

    const { password, key, value } = body as {
      password?: string;
      key?: string;
      value?: unknown;
    };

    if (typeof password !== "string" || !timingSafeEqual(password, adminPassword)) {
      recordFailure(clientIp);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Successful auth — reset failure counter for this IP.
    clearFailures(clientIp);

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

    // Reject obviously oversized payloads (~5MB)
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
