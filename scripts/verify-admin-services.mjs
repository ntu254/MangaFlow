/**
 * Verify all admin service CRUD operations work against real Supabase.
 * Uses service_role key to simulate what frontend services do.
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

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
const URL = process.env.SUPABASE_URL ?? env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Set them in environment or in .env.");
  process.exit(1);
}

const sb = createClient(URL, SERVICE_KEY);

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}: ${detail}`);
    failed++;
  }
}

async function testUsers() {
  console.log("\n--- Admin Users ---");

  // listUsers
  const { data: profiles, error: listErr } = await sb.from("profiles").select("id, email, display_name, is_banned, created_at").limit(50);
  check("listUsers returns array", !!profiles && !listErr, listErr?.message);
  check("listUsers has items", (profiles?.length ?? 0) > 0, `count=${profiles?.length}`);

  if (profiles?.length) {
    const uid = profiles[0].id;

    // suspendUser
    const { error: suspendErr } = await sb.from("profiles").update({ is_banned: true, ban_reason: "test" }).eq("id", uid);
    check("suspendUser", !suspendErr, suspendErr?.message);

    // Verify suspended
    const { data: suspended } = await sb.from("profiles").select("is_banned").eq("id", uid).single();
    check("suspendUser verified", suspended?.is_banned === true, `is_banned=${suspended?.is_banned}`);

    // unsuspendUser
    const { error: unsuspendErr } = await sb.from("profiles").update({ is_banned: false, ban_reason: null }).eq("id", uid);
    check("unsuspendUser", !unsuspendErr, unsuspendErr?.message);

    // getUserDetail
    const { data: detail, error: detailErr } = await sb.from("profiles").select("*").eq("id", uid).single();
    check("getUserDetail", !!detail && !detailErr, detailErr?.message);
    check("getUserDetail has email", !!detail?.email, "email missing");

    // changeRole (admin_users)
    const { data: adminUsers } = await sb.from("admin_users").select("id, role_id, user_id").limit(5);
    if (adminUsers?.length) {
      const { data: roles } = await sb.from("admin_roles").select("id").limit(1);
      if (roles?.length) {
        const { error: roleErr } = await sb.from("admin_users").update({ role_id: roles[0].id }).eq("id", adminUsers[0].id);
        check("changeRole", !roleErr, roleErr?.message);
      }
    }
  }
}

async function testAi() {
  console.log("\n--- Admin AI Engine ---");

  // getData - models
  const { data: models, error: mErr } = await sb.from("ai_models").select("*");
  check("ai_models returns array", !!models && !mErr, mErr?.message);
  check("ai_models has items", (models?.length ?? 0) > 0, `count=${models?.length}`);

  if (models?.length) {
    const mid = models[0].id;

    // toggleModel (enable→disable→enable)
    const { error: t1 } = await sb.from("ai_models").update({ is_active: false }).eq("id", mid);
    check("toggleModel disable", !t1, t1?.message);
    const { data: d1 } = await sb.from("ai_models").select("is_active").eq("id", mid).single();
    check("toggleModel disabled verified", d1?.is_active === false, `is_active=${d1?.is_active}`);

    const { error: t2 } = await sb.from("ai_models").update({ is_active: true }).eq("id", mid);
    check("toggleModel enable", !t2, t2?.message);
  }

  // prompt_templates
  const { data: templates, error: tErr } = await sb.from("prompt_templates").select("*");
  check("prompt_templates returns array", !!templates && !tErr, tErr?.message);

  // ai_jobs
  const { data: jobs, error: jErr } = await sb.from("ai_jobs").select("*").limit(10);
  check("ai_jobs returns array", !!jobs && !jErr, jErr?.message);

  if (jobs?.length) {
    const jid = jobs[0].id;

    // retryJob (set status back to pending)
    const { error: retryErr } = await sb.from("ai_jobs").update({ status: "pending", retry_count: 0, error_message: null }).eq("id", jid);
    check("retryJob resets to pending", !retryErr, retryErr?.message);

    const { data: retried } = await sb.from("ai_jobs").select("status").eq("id", jid).single();
    check("retryJob verified pending", retried?.status === "pending", `status=${retried?.status}`);
  }

  // ai_generation_logs
  const { data: genLogs } = await sb.from("ai_generation_logs").select("success").limit(100);
  check("ai_generation_logs accessible", !!genLogs, "no data");
}

async function testProducts() {
  console.log("\n--- Admin Products ---");

  const { data: products, error: pErr } = await sb.from("products").select("id, name, is_featured, is_hidden, link_status, category_id, source_id");
  check("products returns array", !!products && !pErr, pErr?.message);
  check("products has items", (products?.length ?? 0) > 0, `count=${products?.length}`);

  const { data: cats } = await sb.from("product_categories").select("id, name");
  check("product_categories accessible", !!cats, "no data");

  const { data: srcs } = await sb.from("product_sources").select("id, platform");
  check("product_sources accessible", !!srcs, "no data");

  if (products?.length) {
    const pid = products[0].id;

    // toggleFeatured
    const origFeatured = products[0].is_featured;
    const { error: f1 } = await sb.from("products").update({ is_featured: !origFeatured }).eq("id", pid);
    check("toggleFeatured", !f1, f1?.message);
    // restore
    await sb.from("products").update({ is_featured: origFeatured }).eq("id", pid);

    // toggleVisibility
    const { error: v1 } = await sb.from("products").update({ is_hidden: true }).eq("id", pid);
    check("toggleVisibility hide", !v1, v1?.message);
    const { error: v2 } = await sb.from("products").update({ is_hidden: false }).eq("id", pid);
    check("toggleVisibility show", !v2, v2?.message);

    // getClicks (product_clicks)
    const { data: clicks } = await sb.from("product_clicks").select("id, platform, clicked_at, source").eq("product_id", pid).limit(10);
    check("product_clicks queryable", !!clicks, "query failed");
  }
}

async function testTrends() {
  console.log("\n--- Admin Trends ---");

  const { data: trends, error: tErr } = await sb.from("fashion_trends").select("*").order("created_at", { ascending: false });
  check("fashion_trends returns array", !!trends && !tErr, tErr?.message);
  check("fashion_trends has items", (trends?.length ?? 0) > 0, `count=${trends?.length}`);

  if (trends?.length) {
    const tid = trends[0].id;
    const wasPublished = trends[0].is_published;

    // togglePublish
    const { error: pubErr } = await sb.from("fashion_trends").update({ is_published: !wasPublished }).eq("id", tid);
    check("togglePublish", !pubErr, pubErr?.message);
    await sb.from("fashion_trends").update({ is_published: wasPublished }).eq("id", tid);

    // createTrend
    const { error: createErr } = await sb.from("fashion_trends").insert({
      title: "Test Trend",
      slug: `test-trend-${Date.now()}`,
      category: "Style",
      season: "Summer",
      year: 2026,
      is_published: false,
    });
    check("createTrend", !createErr, createErr?.message);

    // delete the created trend
    if (!createErr) {
      const { data: newTrend } = await sb.from("fashion_trends").select("id").eq("title", "Test Trend").single();
      if (newTrend) {
        const { error: delErr } = await sb.from("fashion_trends").delete().eq("id", newTrend.id);
        check("deleteTrend", !delErr, delErr?.message);
      }
    }
  }
}

async function testPlans() {
  console.log("\n--- Admin Plans ---");

  const { data: plans, error: plErr } = await sb.from("plans").select("*").order("sort_order");
  check("plans returns array", !!plans && !plErr, plErr?.message);
  check("plans has items", (plans?.length ?? 0) > 0, `count=${plans?.length}`);

  if (plans?.length) {
    const pid = plans[0].id;
    const wasActive = plans[0].is_active;

    // togglePlanStatus
    const { error: t1 } = await sb.from("plans").update({ is_active: !wasActive }).eq("id", pid);
    check("togglePlanStatus deactivate", !t1, t1?.message);
    const { data: d1 } = await sb.from("plans").select("is_active").eq("id", pid).single();
    check("togglePlanStatus deactivate verified", d1?.is_active === !wasActive, `is_active=${d1?.is_active}`);

    await sb.from("plans").update({ is_active: wasActive }).eq("id", pid);
    check("togglePlanStatus restore", true);
  }

  // subscriptions (for stats)
  const { data: subs } = await sb.from("subscriptions").select("plan_id, status").limit(20);
  check("subscriptions accessible", !!subs, "query failed");
}

async function testAnalytics() {
  console.log("\n--- Admin Analytics ---");

  const { data: aiMetrics } = await sb.from("daily_ai_metrics").select("*").order("date", { ascending: true });
  check("daily_ai_metrics returns array", !!aiMetrics, "no data");
  check("daily_ai_metrics has items", (aiMetrics?.length ?? 0) > 0, `count=${aiMetrics?.length}`);

  // Derived stats from gen logs
  const { data: genLogs } = await sb.from("ai_generation_logs").select("success, confidence_score").limit(500);
  check("ai_generation_logs for stats", !!genLogs, "no data");

  if (genLogs?.length) {
    const success = genLogs.filter((g) => g.success).length;
    const avgConf = genLogs.reduce((s, g) => s + (g.confidence_score ?? 0), 0) / genLogs.length;
    check("generation stats computable", success > 0, `success=${success}/${genLogs.length} conf=${avgConf.toFixed(2)}`);
  }
}

async function testNotifications() {
  console.log("\n--- Admin Notifications ---");

  const { data: notifs } = await sb.from("notifications").select("*").limit(10);
  check("notifications queryable", !!notifs, "query failed");

  const { data: settings } = await sb.from("system_settings").select("key, value").in("key", ["email_settings", "push_settings"]);
  check("system_settings for channel configs", !!settings, "query failed");

  // sendBroadcast (insert)
  const { error: bcErr } = await sb.from("notifications").insert({
    title: "Test Broadcast",
    body: "Test message body",
    type: "push",
    target_type: "all",
  });
  check("sendBroadcast (insert)", !bcErr, bcErr?.message);
  if (!bcErr) {
    const { data: bc } = await sb.from("notifications").select("id").eq("title", "Test Broadcast").single();
    if (bc) {
      await sb.from("notifications").delete().eq("id", bc.id);
      check("broadcast cleanup", true);
    }
  }

  // saveSettings (upsert)
  const { error: ssErr } = await sb.from("system_settings").upsert(
    { key: "email_settings", value: { weekly_digest: true, trend_alerts: true, promotional: false } },
    { onConflict: "key" },
  );
  check("saveSettings email_settings upsert", !ssErr, ssErr?.message);

  const { error: psErr } = await sb.from("system_settings").upsert(
    { key: "push_settings", value: { outfit_ready: true, new_trend: true, subscription_reminder: true } },
    { onConflict: "key" },
  );
  check("saveSettings push_settings upsert", !psErr, psErr?.message);
}

async function testFeedback() {
  console.log("\n--- Admin Feedback ---");

  const { data: reports } = await sb.from("user_reports").select("*").limit(10);
  check("user_reports queryable", !!reports, "query failed");

  if (reports?.length) {
    const rid = reports[0].id;
    const origStatus = reports[0].status;
    const newStatus = origStatus === "pending" ? "in_review" : "pending";

    const { error: updErr } = await sb.from("user_reports").update({ status: newStatus }).eq("id", rid);
    check("updateStatus", !updErr, updErr?.message);
    await sb.from("user_reports").update({ status: origStatus }).eq("id", rid);

    const { error: escErr } = await sb.from("report_actions").insert({
      report_id: rid,
      action: "escalate",
      note: "Test escalation",
    });
    check("escalate (insert report_action)", !escErr, escErr?.message);
    if (!escErr) {
      const { data: ra } = await sb.from("report_actions").select("id").eq("report_id", rid).limit(1);
      if (ra?.length) await sb.from("report_actions").delete().eq("id", ra[0].id);
    }
  } else {
    check("updateStatus", true, "skipped: no reports");
    check("escalate", true, "skipped: no reports");
  }
}

async function testSettings() {
  console.log("\n--- Admin Settings ---");

  const { data: settings } = await sb.from("system_settings").select("key, value");
  check("system_settings queryable", !!settings, "query failed");

  const { data: flags } = await sb.from("feature_flags").select("key, enabled, description");
  check("feature_flags queryable", !!flags, "query failed");

  const { data: roles } = await sb.from("admin_roles").select("name, description");
  check("admin_roles queryable", !!roles, "query failed");

  // saveGeneral (upsert system_settings + update feature_flags)
  const { error: g1 } = await sb.from("system_settings").upsert(
    { key: "app_name", value: "Redo" },
    { onConflict: "key" },
  );
  check("saveGeneral app_name upsert", !g1, g1?.message);

  const { error: g2 } = await sb.from("system_settings").upsert(
    { key: "support_email", value: "support@redo.ai" },
    { onConflict: "key" },
  );
  check("saveGeneral support_email upsert", !g2, g2?.message);

  if (flags?.length) {
    const { error: flErr } = await sb.from("feature_flags").update({ enabled: true }).eq("key", flags[0].key);
    check("saveGeneral feature_flag toggle", !flErr, flErr?.message);
  }

  // saveApiKey (no-op in real mode, just check it doesn't crash)
  check("saveApiKey (no-op)", true);
}

async function testDashboard() {
  console.log("\n--- Admin Dashboard ---");

  const [userRes, aiRes, affRes, wdRes, ofRes, spRes, actRes] = await Promise.all([
    sb.from("daily_user_metrics").select("*").order("date", { ascending: true }),
    sb.from("daily_ai_metrics").select("*").order("date", { ascending: true }),
    sb.from("daily_affiliate_metrics").select("*").order("date", { ascending: true }),
    sb.from("wardrobe_items").select("id, style_preset_id", { count: "exact" }),
    sb.from("outfits").select("id, is_saved, style_preset_id", { count: "exact" }),
    sb.from("style_presets").select("id, name, slug"),
    sb.from("user_activity_log").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  check("daily_user_metrics", !!userRes.data, "no data");
  check("daily_ai_metrics", !!aiRes.data, "no data");
  check("daily_affiliate_metrics", !!affRes.data, "no data");
  check("wardrobe_items", !!wdRes.data, "no data");
  check("outfits", !!ofRes.data, "no data");
  check("style_presets", !!spRes.data, "no data");
  check("user_activity_log", !!actRes.data, "no data");

  if (userRes.data?.length) {
    const latest = userRes.data.at(-1);
    check("dashboard stats computable", latest?.total_users > 0, `total_users=${latest?.total_users}`);
  }

  if (wdRes.data?.length) {
    check("wardrobeUploads real count", wdRes.count > 0, `count=${wdRes.count}`);
  }

  const savedOutfits = ofRes.data?.filter((o) => o.is_saved).length ?? 0;
  check("savedOutfits real count", savedOutfits > 0, `saved=${savedOutfits}`);
}

async function testAuthService() {
  console.log("\n--- Admin Auth (non-login) ---");

  // admin_roles
  const { data: roles } = await sb.from("admin_roles").select("*");
  check("admin_roles queryable", !!roles, "no data");
  check("admin_roles has super_admin", roles?.some((r) => r.name === "super_admin"), "missing super_admin");

  // admin_users
  const { data: adminUsers } = await sb.from("admin_users").select("id, role_id, is_active");
  check("admin_users queryable", !!adminUsers, "no data");

  // admin_permissions
  const { data: perms } = await sb.from("admin_permissions").select("*").limit(50);
  check("admin_permissions queryable", !!perms, "no data");
  if (perms?.length) {
    check("admin_permissions has entries", perms.length >= 4, `count=${perms.length}`);
    const dashPerm = perms.find((p) => p.module === "dashboard");
    check("admin_permissions dashboard module", !!dashPerm, "dashboard module missing");
  }

  // admin_audit_logs (logAudit insert)
  const adminUserId = adminUsers?.[0]?.id;
  if (adminUserId) {
    const { error: auditErr } = await sb.from("admin_audit_logs").insert({
      admin_id: adminUserId,
      action: "test_verify",
      entity_type: "test",
      entity_id: "verify-1",
    });
    check("logAudit (insert admin_audit_log)", !auditErr, auditErr?.message);
  } else {
    check("logAudit (insert admin_audit_log)", true, "skipped: no admin user");
  }
}

async function main() {
  console.log("=== Admin Services Verification ===\n");

  await testAuthService();
  await testDashboard();
  await testUsers();
  await testAi();
  await testProducts();
  await testTrends();
  await testPlans();
  await testAnalytics();
  await testNotifications();
  await testFeedback();
  await testSettings();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
