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
  console.log("=== Fetching latest AI Job ===");
  const { data: jobs, error: jobErr } = await supabase
    .from("ai_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (jobErr) {
    console.error("Error fetching jobs:", jobErr.message);
    return;
  }

  console.log(JSON.stringify(jobs[0], null, 2));
}

main().catch(console.error);
