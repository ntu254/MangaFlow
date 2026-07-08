import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { planId, billingCycle = "monthly", returnUrl } = await req.json();
    if (!planId) throw new Error("Missing planId");

    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();
    if (!plan) throw new Error("Plan not found");

    const amount = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    if (amount <= 0) throw new Error("Free plan cannot be purchased");

    const payosClientId = Deno.env.get("PAYOS_CLIENT_ID");
    const payosApiKey = Deno.env.get("PAYOS_API_KEY");
    const payosChecksumKey = Deno.env.get("PAYOS_CHECKSUM_KEY");

    if (!payosClientId || !payosApiKey || !payosChecksumKey) {
      throw new Error("PayOS not configured");
    }

    const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 100)}`).toString().slice(-12);
    const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "http://localhost:8080";

    const body = JSON.stringify({
      orderCode: Number(orderCode),
      amount,
      description: `${plan.name} (${billingCycle === "yearly" ? "Năm" : "Tháng"})`,
      cancelUrl: `${returnUrl || baseUrl}/payment/result?status=cancelled&orderCode=${orderCode}`,
      returnUrl: `${baseUrl}/payment/result?status=success&orderCode=${orderCode}&planId=${planId}&billingCycle=${billingCycle}`,
      signature: "",
    });

    const signature = await createSignature(
      body,
      payosChecksumKey,
      payosClientId,
      payosApiKey,
    );

    const response = await fetch("https://api-merchant.payos.vn/v2/payment-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": payosClientId,
        "x-api-key": payosApiKey,
      },
      body: JSON.stringify({
        ...JSON.parse(body),
        signature,
      }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.desc || "PayOS error");

    const paymentLinkId = String(result.data?.paymentLinkId || orderCode);
    await supabase.from("payments").insert({
      user_id: user.id,
      amount,
      currency: "VND",
      status: "pending",
      payment_method: "payos",
      provider: "payos",
      provider_payment_id: paymentLinkId,
      order_code: orderCode,
      plan_id: planId,
      billing_cycle: billingCycle,
    });

    return new Response(JSON.stringify({
      checkoutUrl: result.data?.checkoutUrl,
      qrCode: result.data?.qrCode,
      paymentLinkId: result.data?.paymentLinkId,
      orderCode,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function createSignature(
  body: string,
  checksumKey: string,
  _clientId: string,
  _apiKey: string,
): Promise<string> {
  const data = JSON.parse(body);
  const signData = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(checksumKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signData));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
