import fs from "fs";
import { createClient } from '@supabase/supabase-js';

function loadDotEnv() {
  const env = {};
  try {
    const content = fs.readFileSync(".env", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
      if (!match) continue;
      let [, key, value] = match;
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key.trim()] = value;
    }
  } catch {
    // file may not exist in all environments
  }
  return env;
}

const env = loadDotEnv();
const SUPABASE_URL = process.env.SUPABASE_URL ?? env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in environment or in .env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log("=== Inspecting User details for test@redo.ai ===");
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) {
    console.error("Error listing users:", userErr.message);
    return;
  }
  const testUser = users.users.find(u => u.email === "test@redo.ai");
  if (!testUser) {
    console.error("Test user test@redo.ai not found!");
    return;
  }
  const userId = testUser.id;
  console.log(`Found user: ${userId} (${testUser.email})`);

  console.log("\n=== Checking user_credits ===");
  const { data: credits, error: credErr } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", userId);
  
  if (credErr) {
    console.error("user_credits query error:", credErr.message, credErr.code);
  } else {
    console.log("user_credits:", credits);
  }

  console.log("\n=== Checking subscriptions ===");
  const { data: sub, error: subErr } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId);
  
  if (subErr) {
    console.error("subscriptions query error:", subErr.message, subErr.code);
  } else {
    console.log("subscriptions:", sub);
  }

  console.log("\n=== Checking plans ===");
  const { data: plans, error: planErr } = await supabase
    .from("plans")
    .select("*");
  
  if (planErr) {
    console.error("plans query error:", planErr.message, planErr.code);
  } else {
    console.log("plans:", plans);
  }

  console.log("\n=== Testing insert into ai_jobs ===");
  const { data: job, error: jobErr } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: userId,
      job_type: "converse",
      model_name: "gemini-2.0-flash",
      status: "processing",
    })
    .select("id")
    .maybeSingle();

  if (jobErr) {
    console.error("ai_jobs insert error:", jobErr.message, jobErr.code);
  } else {
    console.log("ai_jobs insert success, job:", job);
    // clean up
    if (job?.id) {
      await supabase.from("ai_jobs").delete().eq("id", job.id);
      console.log("Cleaned up test job.");
    }
  }
}

main().catch(console.error);
