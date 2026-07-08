import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendInvoiceEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

async function verifySignature(data: Record<string, unknown>, signature: string, checksumKey: string): Promise<boolean> {
  const keys = Object.keys(data).sort();
  const signStr = keys.map((k) => `${k}=${data[k]}`).join("&");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(checksumKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signStr));
  const computed = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

function stateTransition(current: string, event: string): string | null {
  const transitions: Record<string, Record<string, string>> = {
    "pending":  { "PAID": "processing", "CANCELLED": "failed", "EXPIRED": "expired", "PROCESSING": "processing" },
    "processing": { "PAID": "completed", "REFUNDED": "refunded", "CANCELLED": "failed", "EXPIRED": "expired" },
    "completed": { "REFUNDED": "refunded" },
  };
  return transitions[current]?.[event] ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const webhookBody = await req.json();
    const payosChecksumKey = Deno.env.get("PAYOS_CHECKSUM_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!payosChecksumKey) throw new Error("PayOS not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { code, desc, data, signature } = webhookBody;
    
    // Bypass for PayOS webhook verification/test pings
    if (
      desc === "Tiêu đề webhook test" ||
      (desc && desc.toLowerCase().includes("test")) ||
      data?.orderCode === 123
    ) {
      console.log("PayOS webhook test/verification received:", desc);
      return new Response(JSON.stringify({ success: true, message: "Webhook verified successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (code !== "00") {
      console.error("PayOS webhook error:", desc);
      return new Response(JSON.stringify({ error: desc }), { status: 400, headers: corsHeaders });
    }

    if (signature && data) {
      const valid = await verifySignature(data, signature, payosChecksumKey);
      if (!valid) {
        console.error("Signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: corsHeaders });
      }
    }

    const paymentLinkId = data?.paymentLinkId;
    const orderCode = data?.orderCode;
    const eventStatus = data?.status;
    if (!paymentLinkId && !orderCode) throw new Error("Missing paymentLinkId or orderCode");

    const idempotencyKey = String(data?.reference || `${paymentLinkId || orderCode}_${eventStatus}_${Date.now()}`);

    const { data: existingLog } = await supabase
      .from("payments_log")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingLog) {
      return new Response(JSON.stringify({ success: true, note: "duplicate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let paymentQuery;
    if (orderCode) {
      paymentQuery = supabase.from("payments").select("id, user_id, plan_id, billing_cycle, status, amount").eq("order_code", String(orderCode)).limit(1);
    } else {
      paymentQuery = supabase.from("payments").select("id, user_id, plan_id, billing_cycle, status, amount").eq("provider_payment_id", String(paymentLinkId)).limit(1);
    }
    const { data: payments } = await paymentQuery;

    const payment = payments?.[0];
    if (!payment) throw new Error("Payment not found");

    const newStatus = stateTransition(payment.status, eventStatus);
    if (!newStatus) {
      await supabase.from("payments_log").insert({
        payment_id: payment.id,
        event_type: "webhook_received",
        status: payment.status,
        source: "webhook",
        raw_payload: webhookBody,
        idempotency_key: idempotencyKey,
        error: `Invalid transition: ${payment.status} -> ${eventStatus}`,
      });
      return new Response(JSON.stringify({ success: true, note: "noop" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newStatus === "completed") {
      if (payment.status === "processing" || payment.status === "pending") {
        await supabase.from("payments").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", payment.id);
      }
      const planId = payment.plan_id;
      let plan = null;
      if (planId) {
        const { data: p } = await supabase.from("plans").select("*").eq("id", planId).single();
        plan = p;
      }
      if (!plan) throw new Error("Plan not found");

      const now = new Date();
      await supabase.from("payments").update({ status: "completed", paid_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", payment.id);

      const endDate = new Date(now);
      const bc = payment.billing_cycle || "monthly";
      if (bc === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
      else endDate.setMonth(endDate.getMonth() + 1);

      const { data: existingSub } = await supabase.from("subscriptions").select("id").eq("user_id", payment.user_id).maybeSingle();
      if (existingSub) {
        await supabase.from("subscriptions").update({ plan_id: plan.id, status: "active", billing_cycle: bc, current_period_end: endDate.toISOString(), updated_at: now.toISOString() }).eq("id", existingSub.id);
      } else {
        await supabase.from("subscriptions").insert({ user_id: payment.user_id, plan_id: plan.id, status: "active", billing_cycle: bc, current_period_start: now.toISOString(), current_period_end: endDate.toISOString() });
      }

      const creditAmount = plan.credits_per_month || 0;
      const { data: credits } = await supabase.from("user_credits").select("id, balance, lifetime_earned").eq("user_id", payment.user_id).maybeSingle();
      if (credits) {
        await supabase.from("user_credits").update({ balance: (credits.balance ?? 0) + creditAmount, lifetime_earned: (credits.lifetime_earned ?? 0) + creditAmount }).eq("id", credits.id);
      } else {
        await supabase.from("user_credits").insert({ user_id: payment.user_id, balance: creditAmount, lifetime_earned: creditAmount, lifetime_spent: 0 });
      }

      await supabase.from("credit_transactions").insert({ user_id: payment.user_id, amount: creditAmount, type: "purchase", reference_type: "subscription", description: `Subscription credits for ${plan.name}` });
      await supabase.from("billing_events").insert({ user_id: payment.user_id, event_type: "payment_success", data: { amount: data?.amount, provider: "payos", payment_link_id: paymentLinkId, plan: plan.name, billing_cycle: bc } });

      const countStr = now.toISOString().slice(0, 10).replace(/-/g, "").slice(0, 6);
      const { count: invoiceCount } = await supabase.from("invoices").select("id", { count: "exact", head: true });
      const invoiceNum = `INV-${countStr}-${String((invoiceCount ?? 0) + 1).padStart(5, "0")}`;
      const { data: profile } = await supabase.from("profiles").select("display_name, email").eq("id", payment.user_id).single();

      await supabase.from("invoices").insert({ user_id: payment.user_id, subscription_id: existingSub?.id || null, invoice_number: invoiceNum, amount: payment.amount ?? Number(data?.amount ?? 0), currency: "VND", status: "paid", paid_at: now.toISOString() });

      if (resendApiKey && profile) {
        try {
          await sendInvoiceEmail(resendApiKey, {
            number: invoiceNum,
            customerName: profile.display_name || profile.email || "Khach hang",
            customerEmail: profile.email || "",
            planName: plan.name,
            amount: Number(payment.amount ?? data?.amount ?? 0),
            paidAt: now.toISOString().slice(0, 10),
            billingCycle: bc,
            paymentMethod: "PayOS",
          });
        } catch (e) {
          console.error("Send invoice failed:", (e as Error).message);
        }
      }
    } else if (newStatus === "refunded") {
      await supabase.from("payments").update({ status: "refunded", refund_amount: data?.amount || 0, updated_at: new Date().toISOString() }).eq("id", payment.id);

      const { data: plan } = await supabase.from("plans").select("credits_per_month").eq("id", payment.plan_id).single();
      if (plan) {
        const { data: credits } = await supabase.from("user_credits").select("id, balance").eq("user_id", payment.user_id).maybeSingle();
        if (credits) {
          const deduct = plan.credits_per_month || 0;
          await supabase.from("user_credits").update({ balance: Math.max(0, (credits.balance ?? 0) - deduct) }).eq("id", credits.id);
          await supabase.from("credit_transactions").insert({ user_id: payment.user_id, amount: -deduct, type: "refund", description: "Refund - hoan tien" });
        }
      }
      await supabase.from("subscriptions").update({ status: "cancelled" }).eq("user_id", payment.user_id);
      await supabase.from("billing_events").insert({ user_id: payment.user_id, event_type: "refund", data: { amount: data?.amount, provider: "payos", payment_link_id: paymentLinkId } });
    } else {
      await supabase.from("payments").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", payment.id);
    }

    await supabase.from("payments_log").insert({
      payment_id: payment.id,
      event_type: "webhook_received",
      status: payment.status,
      new_status: newStatus,
      raw_payload: webhookBody,
      source: "webhook",
      idempotency_key: idempotencyKey,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
