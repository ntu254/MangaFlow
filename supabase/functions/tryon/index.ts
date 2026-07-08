// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { withCreditCheck, CreditError } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

const KLING_BASE_URL = "https://api-singapore.klingai.com";

function cleanBase64(base64: string): string {
  if (base64.startsWith("data:")) {
    const commaIndex = base64.indexOf(",");
    if (commaIndex !== -1) return base64.slice(commaIndex + 1);
  }
  return base64;
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function generateKlingJwt(ak: string, sk: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: ak, exp: now + 1800, nbf: now - 5 };

  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(sk), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput));
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

function isKeyValid(value: string | undefined): boolean {
  return !!value && value !== "YOUR_KLING_KEY" && !value.startsWith("mock_") && value.length > 5;
}

function jsonError(corsHeaders: Record<string, string>, message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return jsonError(corsHeaders, "Method not allowed", 405);
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } },
    );

    const { data: { user } } = authHeader
      ? await supabase.auth.getUser()
      : { data: { user: null } };

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonError(corsHeaders, "Invalid JSON body", 400);
    }

    const { action, human_image, cloth_image, task_id } = body;

    if (!action || !["create", "status"].includes(action)) {
      return jsonError(corsHeaders, "Invalid action — must be 'create' or 'status'", 400);
    }

    const klingAccessKey = Deno.env.get("KLING_ACCESS_KEY");
    const klingSecretKey = Deno.env.get("KLING_SECRET_KEY");
    const keysConfigured = isKeyValid(klingAccessKey) && isKeyValid(klingSecretKey);

    if (!keysConfigured) {
      return jsonError(corsHeaders, "Virtual try-on is not configured. Please contact admin.", 503);
    }

    if (!user) {
      return jsonError(corsHeaders, "Login required for virtual try-on", 401);
    }

    const token = await generateKlingJwt(klingAccessKey!, klingSecretKey!);

    if (action === "create") {
      if (!human_image || !cloth_image) {
        return jsonError(corsHeaders, "Missing human_image or cloth_image", 422);
      }

      const result = await withCreditCheck(supabase, user.id, "tryon", "kolors-virtual-try-on", async () => {
        const resp = await fetch(`${KLING_BASE_URL}/v1/images/kolors-virtual-try-on`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model_name: "kolors-virtual-try-on-v1-5",
            human_image: cleanBase64(human_image),
            cloth_image: cleanBase64(cloth_image),
          }),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Kling API error (${resp.status}): ${errText}`);
        }

        const data = await resp.json();
        if (data.code !== 0) {
          throw new Error(`Kling error ${data.code}: ${data.message}`);
        }

        return data.data;
      }, 2);

      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      if (!task_id || typeof task_id !== "string") {
        return jsonError(corsHeaders, "Missing or invalid task_id", 422);
      }

      const resp = await fetch(`${KLING_BASE_URL}/v1/images/kolors-virtual-try-on/${task_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Kling status error (${resp.status}): ${errText}`);
      }

      const data = await resp.json();
      if (data.code !== 0) {
        throw new Error(`Kling error ${data.code}: ${data.message}`);
      }

      return new Response(JSON.stringify({ success: true, data: data.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("tryon error:", err);
    if (err instanceof CreditError) {
      return jsonError(corsHeaders, err.message, 402);
    }
    return jsonError(corsHeaders, (err as Error).message || "Internal server error", 500);
  }
});
