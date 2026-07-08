import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GOOGLE_APPS_SCRIPT_URL = Deno.env.get("GOOGLE_APPS_SCRIPT_URL")!;
    const SURVEY_SECRET = Deno.env.get("SURVEY_SECRET")!;

    const body = await req.json();
    const {
      feature,
      context = {},
      responses = {},
      feedback: bodyFeedback = null,
      sessionId,
      surveyVersion = "v1",
    } = body;

    if (!feature || !["quiz", "recommender", "tryon", "survey"].includes(feature)) {
      return jsonResponse({ error: "Invalid feature" }, 400);
    }

    if (!sessionId) {
      return jsonResponse({ error: "sessionId is required" }, 400);
    }

    const rawFeedback = bodyFeedback ?? responses.feedback;
    const feedback =
      typeof rawFeedback === "string" && rawFeedback.trim().length > 0
        ? rawFeedback.trim().slice(0, 1000)
        : null;

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: inserted, error: insertError } = await adminClient
      .from("survey_responses")
      .insert({
        user_id: userId,
        session_id: sessionId,
        feature,
        survey_version: surveyVersion,
        context,
        responses,
        feedback,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return jsonResponse({
          success: true,
          duplicate: true,
          message: "Survey already submitted for this feature/version",
        });
      }
      return jsonResponse(
        { error: "Failed to store survey", details: insertError.message },
        500
      );
    }

    const payload = {
      surveySecret: SURVEY_SECRET,
      userId,
      sessionId,
      feature,
      surveyVersion,
      context,
      submittedAt: new Date().toISOString(),
      ...responses,
      feedback,
    };

    const sheetsResponse = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const sheetsText = await sheetsResponse.text();
    let sheetsResult: { success?: boolean; row?: number; error?: string };
    try {
      sheetsResult = JSON.parse(sheetsText);
    } catch {
      sheetsResult = { success: false, error: sheetsText };
    }

    await adminClient
      .from("survey_responses")
      .update({
        sheets_synced: Boolean(sheetsResult.success),
        sheets_row: sheetsResult.row ?? null,
        sheets_error: sheetsResult.success
          ? null
          : String(sheetsResult.error ?? "Unknown error"),
      })
      .eq("id", inserted.id);

    return jsonResponse({
      success: true,
      surveyId: inserted.id,
      sheetsSynced: Boolean(sheetsResult.success),
      sheetsRow: sheetsResult.row ?? null,
    });
  } catch (error) {
    console.error("submit-survey error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500
    );
  }
});
