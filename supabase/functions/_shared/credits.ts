import { createClient } from "npm:@supabase/supabase-js@2";

export class CreditError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreditError";
  }
}

export async function withCreditCheck<T>(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  jobType: string,
  modelName: string,
  fn: () => Promise<T>,
  cost: number = 1,
): Promise<T> {
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Check subscription plan limits
  const { data: sub } = await adminClient
    .from("subscriptions")
    .select("plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  let limit = 5;
  if (sub?.plan_id) {
    const { data: plan } = await adminClient
      .from("plans")
      .select("name, ai_generations_limit")
      .eq("id", sub.plan_id)
      .single();
    if (plan) {
      limit = plan.ai_generations_limit;
    }
  }

  // Resolve AI model ID for logging
  let modelId: string | null = null;
  if (modelName) {
    const { data: model } = await adminClient
      .from("ai_models")
      .select("id")
      .ilike("name", `%${modelName.replace(/-/g, " ")}%`)
      .limit(1)
      .maybeSingle();
    if (model) modelId = model.id;
  }

  // --- STEP 1: Atomic pre-deduction (before AI call) ---
  // For limited plans, deduct credits FIRST to prevent race conditions.
  // If balance < cost, the RPC returns false and no rows are affected.
  let creditDeducted = false;
  if (limit !== 0) {
    const { data: ok, error: rpcErr } = await adminClient.rpc("deduct_credits", {
      p_user_id: userId,
      p_cost: cost,
    });

    if (rpcErr) {
      // RPC not available — fallback to read-check
      const { data: uc } = await adminClient
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      const balance = uc?.balance ?? 0;
      if (balance < cost) {
        throw new CreditError(
          `Bạn không đủ credit AI (yêu cầu ${cost}, hiện có ${balance}). Nâng cấp gói tại /pricing.`,
        );
      }
      // Fallback deduction (less safe but functional)
      await adminClient
        .from("user_credits")
        .update({
          balance: balance - cost,
          lifetime_spent: (uc as any)?.lifetime_spent
            ? (uc as any).lifetime_spent + cost
            : cost,
        })
        .eq("user_id", userId);
      creditDeducted = true;
    } else if (!ok) {
      const { data: uc } = await adminClient
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      throw new CreditError(
        `Bạn không đủ credit AI (yêu cầu ${cost}, hiện có ${uc?.balance ?? 0}). Nâng cấp gói tại /pricing.`,
      );
    } else {
      creditDeducted = true;
    }

    // Log the deduction transaction
    await adminClient.from("credit_transactions").insert({
      user_id: userId,
      amount: -cost,
      type: "generation",
      reference_type: "ai_job",
      description: `Sử dụng AI (${cost} credit)`,
    });
  }

  // --- STEP 2: Create AI job ---
  const { data: job } = await adminClient
    .from("ai_jobs")
    .insert({
      user_id: userId,
      job_type: jobType,
      model_id: modelId,
      status: "processing",
    })
    .select("id")
    .single();

  const startTime = Date.now();

  // --- STEP 3: Run the AI function ---
  try {
    const result = await fn();
    const latency = Date.now() - startTime;

    await adminClient
      .from("ai_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", job.id);

    await adminClient.from("ai_generation_logs").insert({
      job_id: job.id,
      user_id: userId,
      model_id: modelId,
      latency_ms: latency,
      success: true,
    });

    return result;
  } catch (err) {
    const latency = Date.now() - startTime;

    // REFUND credits if we pre-deducted and the AI call failed
    if (creditDeducted) {
      try {
        await adminClient.rpc("refund_credits", {
          p_user_id: userId,
          p_cost: cost,
        });
      } catch {
        // Fallback refund if RPC unavailable
        const { data: uc } = await adminClient
          .from("user_credits")
          .select("balance, lifetime_spent")
          .eq("user_id", userId)
          .maybeSingle();
        if (uc) {
          await adminClient
            .from("user_credits")
            .update({
              balance: (uc.balance ?? 0) + cost,
              lifetime_spent: Math.max(0, (uc.lifetime_spent ?? 0) - cost),
            })
            .eq("user_id", userId);
        }
      }
      await adminClient.from("credit_transactions").insert({
        user_id: userId,
        amount: cost,
        type: "refund",
        reference_type: "ai_job",
        description: `Hoàn credit do AI thất bại`,
      });
    }

    await adminClient
      .from("ai_jobs")
      .update({
        status: "failed",
        error_message: (err as Error).message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    await adminClient.from("ai_generation_logs").insert({
      job_id: job.id,
      user_id: userId,
      model_id: modelId,
      latency_ms: latency,
      success: false,
      error_message: (err as Error).message,
    });

    if (err instanceof CreditError) throw err;
    throw new Error((err as Error).message);
  }
}
