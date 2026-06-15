// Edge function: validates admin password server-side and issues a
// short-lived HMAC-signed session token. Clients store ONLY the token —
// the plaintext password and any password hash NEVER live in the bundle.
//
// Token format: `${payloadB64Url}.${signatureB64Url}` where payload is
// `{ exp: number }` (ms since epoch) signed with HMAC-SHA256 using the
// ADMIN_PASSWORD secret as the key.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// In-memory rate limiter: 5 failed attempts / IP / 15 min.
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

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aB = enc.encode(a);
  const bB = enc.encode(b);
  const len = Math.max(aB.length, bB.length);
  let diff = aB.length ^ bB.length;
  for (let i = 0; i < len; i++) diff |= (aB[i] ?? 0) ^ (bB[i] ?? 0);
  return diff === 0;
}

function b64urlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function signSession(secret: string, exp: number): Promise<string> {
  const payload = JSON.stringify({ exp });
  const payloadBytes = new TextEncoder().encode(payload);
  const payloadB64 = b64urlEncode(payloadBytes);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

// Token lifetime: 8 hours.
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
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
    if (!adminPassword) {
      return new Response(
        JSON.stringify({ error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => null) as { password?: string } | null;
    if (!body || typeof body.password !== "string") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!timingSafeEqual(body.password, adminPassword)) {
      recordFailure(ip);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Successful auth — clear failure counter and issue a session token.
    failureTracker.delete(ip);

    const exp = Date.now() + SESSION_TTL_MS;
    const token = await signSession(adminPassword, exp);

    return new Response(JSON.stringify({ token, exp }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-login error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
