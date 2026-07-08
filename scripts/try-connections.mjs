/**
 * Try connecting via IPv6 literal address for the database.
 */
import postgres from 'postgres';

const PASSWORD = 'Toitenlatu123@';
const REF = 'trywdfggzrzbwndwrerg';

const IPv6 = '2406:da18:1f7e:b101:8691:8b3a:c3a0:e0cd';

const urls = [
  // IPv6 literal for db.<ref>.supabase.co
  `postgresql://postgres:${encodeURIComponent(PASSWORD)}@[${IPv6}]:5432/postgres`,
  `postgresql://postgres:${encodeURIComponent(PASSWORD)}@[${IPv6}]:5432/postgres?sslmode=require`,
  // Try pooler one more time with different user format
  `postgresql://postgres:${encodeURIComponent(PASSWORD)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true`,
  `postgresql://${REF}:${encodeURIComponent(PASSWORD)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
];

async function tryConnect(url) {
  const masked = url.replace(/:[^:@]*@/, ':****@');
  if (url.includes('2406')) {
    process.stdout.write(`Trying IPv6 direct ... `);
  } else {
    process.stdout.write(`Trying ${masked} ... `);
  }
  const sql = postgres(url, { ssl: 'require', connect_timeout: 15 });
  try {
    const res = await sql`SELECT 1 as ok`;
    console.log('SUCCESS:', JSON.stringify(res[0]));
    await sql.end();
    return true;
  } catch (e) {
    console.log('FAILED: ' + e.message.slice(0, 120));
    try { await sql.end(); } catch {}
    return false;
  }
}

async function main() {
  for (const url of urls) {
    if (await tryConnect(url)) process.exit(0);
  }
  console.log('\nAll attempts failed. Need alternative approach.');
  process.exit(1);
}
main().catch(e => { console.error(e.message); process.exit(1); });
