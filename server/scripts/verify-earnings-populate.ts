/**
 * Focused check for the Admin Earnings populate fix.
 * Verifies (a) GET /payroll/earnings returns populated assistant + task(+type)
 * objects (not raw id strings), and (b) the mark-paid mutation returns the same
 * populated, _id-keyed shape — the path that previously returned an unpopulated
 * `id`-keyed doc and broke the drawer refresh.
 *
 * Run AFTER test-e2e.ts (which leaves a CONFIRMED earning) against the dev DB.
 */
import axios from "axios"

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001/api"

async function login(email: string, password: string) {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password })
  return res.data.data.accessToken
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg)
  console.log("  ok -", msg)
}

async function run() {
  const adminToken = await login("admin@mangaflow.local", "admin123")
  const admin = axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${adminToken}` } })

  console.log("[list] GET /payroll/earnings")
  const list = (await admin.get("/payroll/earnings")).data.data as any[]
  assert(Array.isArray(list) && list.length > 0, "earnings list is non-empty")

  const e = list[0]
  assert(typeof e._id === "string", "row keyed by _id (not id)")
  assert(e.assistantId && typeof e.assistantId === "object", "assistantId is populated object")
  assert(typeof e.assistantId.name === "string" && typeof e.assistantId.email === "string", "assistant has name + email")
  assert(e.taskId && typeof e.taskId === "object", "taskId is populated object")
  assert(typeof e.taskId.title === "string" && typeof e.taskId.status === "string", "task has title + status")
  assert(e.taskId.taskTypeId == null || typeof e.taskId.taskTypeId === "object", "taskTypeId populated (or null)")

  const confirmed = list.find((x) => x.status === "CONFIRMED")
  if (!confirmed) {
    console.log("[mark-paid] skipped: no CONFIRMED earning present (run test-e2e.ts first)")
  } else {
    console.log(`[mark-paid] POST /payroll/earnings/${confirmed._id}/mark-paid`)
    const paid = (await admin.post(`/payroll/earnings/${confirmed._id}/mark-paid`)).data.data
    assert(paid.status === "PAID", "status is PAID")
    assert(typeof paid._id === "string", "mark-paid response keyed by _id (not id)")
    assert(paid.assistantId && typeof paid.assistantId === "object" && paid.assistantId.name, "mark-paid response keeps populated assistant")
    assert(paid.taskId && typeof paid.taskId === "object" && paid.taskId.title, "mark-paid response keeps populated task")
  }

  console.log("\n✅ Earnings populate verification passed.")
}

run().catch((err) => {
  console.error("\n❌ Earnings populate verification FAILED:")
  console.error(err.response ? `${err.response.status} ${JSON.stringify(err.response.data)}` : err.message)
  process.exit(1)
})
