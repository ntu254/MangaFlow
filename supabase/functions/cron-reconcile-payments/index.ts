import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, x-supabase-auth-referer",
};

const PAYOS_API = "https://api-merchant.payos.vn/v2/payment-requests";

interface PayosStatus {
  status: "PAID" | "CANCELLED" | "PROCESSING" | "EXPIRED";
  paymentLinkId: number;
  orderCode: number;
  amount: number;
  transactions?: Array<{ amount: number; status: string; transactionDateTime: string }>;
}

async function reconcile(): Promise<{ checked: number; updated: number; errors: string[] }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const payosClientId = Deno.env.get("PAYOS_CLIENT_ID");
  const payosApiKey = Deno.env.get("PAYOS_API_KEY");
  if (!payosClientId || !payosApiKey) throw new Error("PayOS not configured");

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pendingPayments } = await supabase
    .from("payments")
    .select("id, user_id, amount, order_code, status, plan_id, billing_cycle")
    .in("status", ["pending", "processing"])
    .gte("created_at", cutoff)
    .limit(50);

  if (!pendingPayments?.length) return { checked: 0, updated: 0, errors: [] };

  const errors: string[] = [];
  let updated = 0;

  for (const payment of pendingPayments) {
    const orderCode = payment.order_code;
    if (!orderCode) {
      errors.push(`Payment ${payment.id}: missing order_code, skipping`);
      continue;
    }
    try {
      const resp = await fetch(`${PAYOS_API}/${orderCode}`, {
        headers: { "x-client-id": payosClientId, "x-api-key": payosApiKey },
      });
      const result = await resp.json();
      if (!resp.ok) {
        if (resp.status === 404) {
          await supabase.from("payments_log").insert({
            payment_id: payment.id,
            event_type: "cron_check",
            status: payment.status,
            source: "cron",
            raw_payload: result,
            error: "Payment not found on PayOS",
            created_at: new Date().toISOString(),
          });
          await supabase.from("payments").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", payment.id);
        }
        continue;
      }

      const payosData = result.data as PayosStatus;
      const newStatus = mapPayosStatus(payosData.status);
      if (!newStatus || newStatus === payment.status) {
        await supabase.from("payments_log").insert({
          payment_id: payment.id,
          event_type: "cron_check",
          status: payment.status,
          source: "cron",
          raw_payload: result,
          created_at: new Date().toISOString(),
        });
        continue;
      }

      await supabase.from("payments_log").insert({
        payment_id: payment.id,
        event_type: "cron_check",
        status: payment.status,
        new_status: newStatus,
        source: "cron",
        raw_payload: result,
        created_at: new Date().toISOString(),
      });

      if (newStatus === "completed") {
        const now = new Date().toISOString();
        await supabase.from("payments").update({ status: "completed", paid_at: now, updated_at: now }).eq("id", payment.id);

        const { data: plan } = await supabase.from("plans").select("*").eq("id", payment.plan_id).single();
        if (plan) {
          const bc = payment.billing_cycle || "monthly";
          const endDate = new Date();
          if (bc === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
          else endDate.setMonth(endDate.getMonth() + 1);

          const { data: existingSub } = await supabase.from("subscriptions").select("id").eq("user_id", payment.user_id).maybeSingle();
          if (existingSub) {
            await supabase.from("subscriptions").update({ plan_id: payment.plan_id, status: "active", billing_cycle: bc, current_period_end: endDate.toISOString(), updated_at: now }).eq("id", existingSub.id);
          } else {
            await supabase.from("subscriptions").insert({ user_id: payment.user_id, plan_id: payment.plan_id, status: "active", billing_cycle: bc, current_period_start: now, current_period_end: endDate.toISOString() });
          }

          const creditAmount = plan.credits_per_month || 0;
          const { data: credits } = await supabase.from("user_credits").select("id, balance, lifetime_earned").eq("user_id", payment.user_id).maybeSingle();
          if (credits) {
            await supabase.from("user_credits").update({ balance: (credits.balance ?? 0) + creditAmount, lifetime_earned: (credits.lifetime_earned ?? 0) + creditAmount }).eq("id", credits.id);
          } else {
            await supabase.from("user_credits").insert({ user_id: payment.user_id, balance: creditAmount, lifetime_earned: creditAmount, lifetime_spent: 0 });
          }

          await supabase.from("credit_transactions").insert({ user_id: payment.user_id, amount: creditAmount, type: "purchase", reference_type: "subscription", description: `Subscription credits for ${plan.name}` });
          await supabase.from("billing_events").insert({ user_id: payment.user_id, event_type: "payment_success", data: { amount: payment.amount, provider: "payos", plan: plan.name, billing_cycle: bc } });
        }
      } else {
        await supabase.from("payments").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", payment.id);
      }

      updated++;
    } catch (err) {
      errors.push(`Payment ${payment.id}: ${(err as Error).message}`);
    }
  }

  return { checked: pendingPayments.length, updated, errors };
}

function mapPayosStatus(status: string): string | null {
  switch (status) {
    case "PAID": return "completed";
    case "CANCELLED": return "failed";
    case "EXPIRED": return "expired";
    case "PROCESSING": return "processing";
    default: return null;
  }
}

Deno.cron("Reconcile payments", "*/5 * * * *", async () => {
  try {
    const result = await reconcile();
    console.log(`Cron reconcile: checked=${result.checked}, updated=${result.updated}, errors=${result.errors.length}`);
  } catch (err) {
    console.error("Cron reconcile failed:", (err as Error).message);
  }
});

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
    const { data: admin } = await supabase.rpc("is_admin_user");
    if (!admin) throw new Error("Admin only");

    const result = await reconcile();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
