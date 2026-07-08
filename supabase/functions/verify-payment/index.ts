import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendInvoiceEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

/**
 * Map PayOS status to internal payment status.
 * verify-payment is a one-shot fallback — it can skip intermediate states
 * (pending → completed) unlike the webhook which uses a 2-step state machine.
 */
function resolveNewStatus(currentStatus: string, payosStatus: string): string | null {
  if (currentStatus === "completed") return null; // already final
  if (currentStatus === "refunded") return null;  // already final

  switch (payosStatus) {
    case "PAID":
      return "completed";
    case "CANCELLED":
      return "failed";
    case "EXPIRED":
      return "expired";
    case "PROCESSING":
      return currentStatus === "pending" ? "processing" : null;
    default:
      return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("is_admin_user").catch(() => ({ data: false }));

    const { orderCode } = await req.json();
    if (!orderCode) throw new Error("Missing orderCode");

    const payosClientId = Deno.env.get("PAYOS_CLIENT_ID");
    const payosApiKey = Deno.env.get("PAYOS_API_KEY");
    if (!payosClientId || !payosApiKey) throw new Error("PayOS not configured");

    // Query PayOS API for the real payment status
    const response = await fetch(
      `https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`,
      { headers: { "x-client-id": payosClientId, "x-api-key": payosApiKey } },
    );
    const payosResult = await response.json();
    if (!response.ok) throw new Error(payosResult.desc || "PayOS API error");

    const payosData = payosResult.data;
    const payStatus = payosData?.status;

    // Query payment from DB — order_code is stored as string
    const { data: payments } = await supabase
      .from("payments")
      .select("id, user_id, plan_id, billing_cycle, status, amount")
      .eq("order_code", String(orderCode))
      .limit(1);
    const payment = payments?.[0];
    if (!payment) throw new Error("Payment not found");

    if (payment.user_id !== user.id && !isAdmin) {
      throw new Error("Unauthorized");
    }

    // Already completed — return immediately
    if (payment.status === "completed") {
      return new Response(JSON.stringify({ status: "completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = resolveNewStatus(payment.status, payStatus);

    if (newStatus && newStatus !== payment.status) {
      if (newStatus === "completed") {
        const now = new Date().toISOString();

        // First transition to processing (for consistency with webhook state machine)
        if (payment.status === "pending") {
          await supabase.from("payments").update({ status: "processing", updated_at: now }).eq("id", payment.id);
        }

        // Then mark as completed
        await supabase.from("payments").update({ status: "completed", paid_at: now, updated_at: now }).eq("id", payment.id);

        const { data: plan } = await supabase.from("plans").select("*").eq("id", payment.plan_id).single();
        if (!plan) throw new Error("Plan not found");

        const endDate = new Date();
        const bc = payment.billing_cycle || "monthly";
        if (bc === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
        else endDate.setMonth(endDate.getMonth() + 1);

        // Upsert subscription
        const { data: existingSub } = await supabase.from("subscriptions").select("id").eq("user_id", payment.user_id).maybeSingle();
        if (existingSub) {
          await supabase.from("subscriptions").update({ plan_id: plan.id, status: "active", billing_cycle: bc, current_period_end: endDate.toISOString(), updated_at: now }).eq("id", existingSub.id);
        } else {
          await supabase.from("subscriptions").insert({ user_id: payment.user_id, plan_id: plan.id, status: "active", billing_cycle: bc, current_period_start: now, current_period_end: endDate.toISOString() });
        }

        // Add credits
        const creditAmount = plan.credits_per_month || 0;
        const { data: credits } = await supabase.from("user_credits").select("id, balance, lifetime_earned").eq("user_id", payment.user_id).maybeSingle();
        if (credits) {
          await supabase.from("user_credits").update({ balance: (credits.balance ?? 0) + creditAmount, lifetime_earned: (credits.lifetime_earned ?? 0) + creditAmount }).eq("id", credits.id);
        } else {
          await supabase.from("user_credits").insert({ user_id: payment.user_id, balance: creditAmount, lifetime_earned: creditAmount, lifetime_spent: 0 });
        }

        await supabase.from("credit_transactions").insert({ user_id: payment.user_id, amount: creditAmount, type: "purchase", reference_type: "subscription", description: `Subscription credits for ${plan.name}` });
        await supabase.from("billing_events").insert({ user_id: payment.user_id, event_type: "payment_success", data: { amount: payosData?.amount, provider: "payos", plan: plan.name, billing_cycle: bc } });

        // Create invoice
        const invoiceCount = (await supabase.from("invoices").select("id", { count: "exact", head: true })).count ?? 0;
        const invoiceNum = `INV-${now.slice(0, 10).replace(/-/g, "").slice(0, 6)}-${String(invoiceCount + 1).padStart(5, "0")}`;
        const { data: profile } = await supabase.from("profiles").select("display_name, email").eq("id", payment.user_id).single();
        await supabase.from("invoices").insert({ user_id: payment.user_id, subscription_id: existingSub?.id || null, invoice_number: invoiceNum, amount: payment.amount ?? Number(payosData?.amount ?? 0), currency: "VND", status: "paid", paid_at: now });

        // Send invoice email
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey && profile) {
          try {
            await sendInvoiceEmail(resendKey, {
              number: invoiceNum,
              customerName: profile.display_name || profile.email || "Khach hang",
              customerEmail: profile.email || "",
              planName: plan.name,
              amount: Number(payment.amount ?? payosData?.amount ?? 0),
              paidAt: now.slice(0, 10),
              billingCycle: bc,
              paymentMethod: "PayOS",
            });
          } catch (e) {
            console.error("Send invoice failed:", (e as Error).message);
          }
        }
      } else {
        await supabase.from("payments").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", payment.id);
      }

      // Log the verification event
      await supabase.from("payments_log").insert({
        payment_id: payment.id,
        event_type: "api_verify",
        status: payment.status,
        new_status: newStatus,
        raw_payload: payosResult,
        source: "verify_api",
      });
    }

    return new Response(JSON.stringify({ status: newStatus || payment.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
