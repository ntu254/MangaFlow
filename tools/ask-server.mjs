#!/usr/bin/env node
// Local "Ask the codebase" web app.
//
// A tiny zero-dependency server: it serves a chat page, and for each question
// runs `codegraph explore` (local knowledge graph) then asks Gemini to answer
// grounded on that context. The API key stays on the server — it is read from
// the environment and never sent to the browser.
//
// Setup:
//   1. Get a Gemini API key (starts with AIza): https://aistudio.google.com/apikey
//   2. PowerShell:  $env:GEMINI_API_KEY="AIza..."   |  bash: export GEMINI_API_KEY=AIza...
//   3. node tools/ask-server.mjs        (then open the printed URL)
//
// Optional env: ASK_PORT (default 5178), GEMINI_MODEL (default gemini-2.5-flash).

import { createServer } from "node:http";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execP = promisify(exec);
const PORT = Number(process.env.ASK_PORT || 5178);
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM = [
  "You are a senior engineer answering questions about the MangaFlow codebase.",
  "Answer ONLY from the CodeGraph context provided; never invent files, symbols, or behavior.",
  "Structure the answer as: 1) WHERE the code lives, 2) WHAT it does, 3) HOW it works (the flow / who calls whom).",
  "Cite concrete locations as `path/to/file.ext:line`.",
  "If the context lacks the answer, say so and suggest what to explore next.",
  "Reply in the same language as the question. Be concise and concrete; use short markdown.",
].join(" ");

async function ask(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw { code: 400, msg: "GEMINI_API_KEY is not set on the server. Set it and restart." };
  }
  const q = question.replace(/["`$%]/g, " ");
  let context;
  try {
    const { stdout } = await execP(`codegraph explore "${q}"`, { maxBuffer: 8 * 1024 * 1024, windowsHide: true });
    context = stdout;
  } catch (e) {
    throw { code: 500, msg: "codegraph explore failed — is CodeGraph installed and indexed (codegraph init)?" };
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: `Question:\n${question}\n\n--- CodeGraph context ---\n${context}` }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    const hint = res.status === 400 || res.status === 401 || res.status === 403
      ? " (check the API key is a valid Gemini key starting with AIza)"
      : "";
    throw { code: 502, msg: `Gemini API error ${res.status}${hint}: ${detail.slice(0, 400)}` };
  }
  const data = await res.json();
  const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  const files = [...new Set((context.match(/[\w./-]+\.(?:tsx?|jsx?|py)(?::\d+)?/g) || []).map((s) => s.split(":")[0]))].slice(0, 12);
  return { answer: answer.trim() || "No answer returned.", files };
}

const PAGE = /* html */ `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>MangaFlow · Ask the codebase</title>
<style>
  :root{--bg:#f7f5fb;--surface:#fff;--surface2:#f1edf7;--text:#1d1a21;--muted:#5b5566;--outline:#e3ddec;
    --accent:#5d38f5;--accent2:#7c5cff;--soft:#efeaff;--code:#f4f1fb;--user:#efeaff;--shadow:rgba(80,50,160,.12);
    --mono:ui-monospace,"Cascadia Mono","Segoe UI Mono",Menlo,Consolas,monospace;
    --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
  @media(prefers-color-scheme:dark){:root{--bg:#14121a;--surface:#1e1b26;--surface2:#262231;--text:#eae7f2;--muted:#9b93a8;
    --outline:#322d3d;--accent:#8f74ff;--accent2:#a98cff;--soft:#241f38;--code:#221d31;--user:#2a2440;--shadow:rgba(0,0,0,.5)}}
  *{box-sizing:border-box}
  body{margin:0;font-family:var(--font);background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column}
  header{padding:16px 22px;border-bottom:1px solid var(--outline);display:flex;align-items:center;gap:11px;background:var(--surface)}
  header .dot{width:11px;height:11px;border-radius:3px;background:var(--accent);box-shadow:0 0 0 4px var(--soft)}
  header h1{margin:0;font-size:15px;font-weight:800;letter-spacing:.2px}
  header .sub{font-size:11.5px;color:var(--muted);margin-left:auto;font-family:var(--mono)}
  main{flex:1;overflow-y:auto;padding:24px 0}
  .wrap{max-width:760px;margin:0 auto;padding:0 22px;display:flex;flex-direction:column;gap:18px}
  .intro{color:var(--muted);font-size:13.5px;line-height:1.6}
  .examples{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
  .ex{border:1px solid var(--outline);background:var(--surface);border-radius:999px;padding:7px 13px;font-size:12.5px;
    cursor:pointer;color:var(--text)}
  .ex:hover{border-color:var(--accent)}
  .msg{display:flex;flex-direction:column;gap:6px}
  .msg .who{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
  .bubble{border-radius:14px;padding:13px 16px;line-height:1.6;font-size:14px}
  .user .bubble{background:var(--user);align-self:flex-start;max-width:100%;white-space:pre-wrap}
  .bot .bubble{background:var(--surface);border:1px solid var(--outline);box-shadow:0 2px 14px var(--shadow)}
  .bot .bubble h3{margin:14px 0 6px;font-size:14px}
  .bot .bubble h3:first-child{margin-top:0}
  .bot .bubble p{margin:8px 0}
  .bot .bubble ul{margin:8px 0;padding-left:20px}
  .bot .bubble li{margin:3px 0}
  .bot .bubble code{font-family:var(--mono);font-size:12.5px;background:var(--code);padding:1px 5px;border-radius:5px}
  .bot .bubble pre{background:var(--code);border:1px solid var(--outline);border-radius:10px;padding:12px;overflow-x:auto}
  .bot .bubble pre code{background:none;padding:0}
  .loc{font-family:var(--mono);font-size:12px;color:var(--accent);background:var(--soft);padding:1px 6px;border-radius:5px}
  .sources{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
  .src{font-family:var(--mono);font-size:11px;color:var(--muted);background:var(--surface2);border:1px solid var(--outline);
    border-radius:6px;padding:3px 8px}
  .err{color:#c0392b}
  @media(prefers-color-scheme:dark){.err{color:#ff8b7a}}
  .typing{display:inline-flex;gap:4px}.typing i{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:b 1s infinite}
  .typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
  @keyframes b{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
  @media(prefers-reduced-motion:reduce){.typing i{animation:none}}
  footer{border-top:1px solid var(--outline);background:var(--surface);padding:14px 22px}
  .composer{max-width:760px;margin:0 auto;display:flex;gap:10px}
  textarea{flex:1;resize:none;min-height:48px;max-height:160px;padding:13px 15px;border:1px solid var(--outline);
    border-radius:12px;background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px;line-height:1.4}
  textarea:focus{outline:2px solid var(--accent);outline-offset:1px;border-color:transparent}
  button.send{border:none;background:var(--accent);color:#fff;font-weight:700;font-size:14px;border-radius:12px;padding:0 20px;cursor:pointer}
  button.send:disabled{opacity:.5;cursor:default}
  .hintbar{max-width:760px;margin:8px auto 0;font-size:11px;color:var(--muted)}
</style></head><body>
<header><span class="dot"></span><h1>MangaFlow · Ask the codebase</h1><span class="sub" id="model"></span></header>
<main><div class="wrap" id="thread">
  <div class="intro">Hỏi bằng ngôn ngữ tự nhiên về code. CodeGraph tìm đúng hàm/màn hình liên quan, Gemini giải thích <b>nằm ở đâu · làm gì · hoạt động thế nào</b> kèm trích dẫn <span class="loc">file:line</span>.
    <div class="examples" id="examples">
      <button class="ex">ở màn hình Board session, nút Approve/Reject hoạt động thế nào?</button>
      <button class="ex">Editor duyệt chương (EDITOR_APPROVE) diễn ra thế nào từ mobile tới backend?</button>
      <button class="ex">khi hoà phiếu thì re-vote được tạo ở đâu?</button>
      <button class="ex">at-risk decision được validate và lưu ở đâu?</button>
    </div>
  </div>
</div></main>
<footer>
  <div class="composer">
    <textarea id="q" placeholder="Nhập câu hỏi về code… (Enter để gửi, Shift+Enter xuống dòng)"></textarea>
    <button class="send" id="send">Hỏi</button>
  </div>
  <div class="hintbar">Chạy cục bộ · API key nằm ở server, không lộ ra trình duyệt · trả lời chỉ dựa trên context CodeGraph.</div>
</footer>
<script>
const thread=document.getElementById('thread'),q=document.getElementById('q'),send=document.getElementById('send');
document.getElementById('model').textContent='';
function esc(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
function md(t){
  t=esc(t);
  const blocks=[];
  t=t.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g,(m,l,c)=>{blocks.push('<pre><code>'+c.replace(/\\n$/,'')+'</code></pre>');return '\\u0000'+(blocks.length-1)+'\\u0000'});
  t=t.replace(/\`([^\`]+)\`/g,(m,c)=>{ return /[\\w./-]+\\.(?:tsx?|jsx?|py)(?::\\d+)?/.test(c) ? '<span class="loc">'+c+'</span>' : '<code>'+c+'</code>'; });
  t=t.replace(/^\\s*###?\\s+(.+)$/gm,'<h3>$1</h3>');
  t=t.replace(/\\*\\*([^*]+)\\*\\*/g,'<b>$1</b>');
  const lines=t.split(/\\n/);let out='',inul=false;
  for(let ln of lines){
    if(/^\\s*[-*]\\s+/.test(ln)){ if(!inul){out+='<ul>';inul=true} out+='<li>'+ln.replace(/^\\s*[-*]\\s+/,'')+'</li>'; }
    else { if(inul){out+='</ul>';inul=false} if(ln.trim()==='')out+=''; else if(/^<h3>|^\\u0000/.test(ln))out+=ln; else out+='<p>'+ln+'</p>'; }
  }
  if(inul)out+='</ul>';
  out=out.replace(/\\u0000(\\d+)\\u0000/g,(m,i)=>blocks[i]);
  return out;
}
function add(who,cls){const m=document.createElement('div');m.className='msg '+cls;
  m.innerHTML='<div class="who">'+who+'</div><div class="bubble"></div>';thread.appendChild(m);
  m.scrollIntoView({behavior:'smooth',block:'end'});return m.querySelector('.bubble')}
async function askQ(text){
  if(!text.trim())return; q.value=''; autosize();
  const intro=document.querySelector('.intro'); if(intro)intro.remove();
  add('Bạn','user').textContent=text;
  const b=add('MangaFlow','bot'); b.innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
  send.disabled=true;
  try{
    const r=await fetch('/ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question:text})});
    const d=await r.json();
    if(!r.ok||d.error){ b.innerHTML='<span class="err">'+esc(d.error||('Lỗi '+r.status))+'</span>'; }
    else{
      b.innerHTML=md(d.answer);
      if(d.files&&d.files.length){const s=document.createElement('div');s.className='sources';
        s.innerHTML=d.files.map(f=>'<span class="src">'+esc(f)+'</span>').join('');b.appendChild(s);}
    }
  }catch(e){ b.innerHTML='<span class="err">Không gọi được server: '+esc(String(e))+'</span>'; }
  send.disabled=false; b.scrollIntoView({behavior:'smooth',block:'end'});
}
function autosize(){q.style.height='auto';q.style.height=Math.min(q.scrollHeight,160)+'px'}
q.addEventListener('input',autosize);
q.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();askQ(q.value)}});
send.addEventListener('click',()=>askQ(q.value));
document.getElementById('examples').addEventListener('click',e=>{if(e.target.classList.contains('ex'))askQ(e.target.textContent)});
</script></body></html>`;

createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }
  if (req.method === "POST" && req.url === "/ask") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on("end", async () => {
      try {
        const { question } = JSON.parse(body || "{}");
        if (!question || !String(question).trim()) {
          res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "Câu hỏi trống." }));
          return;
        }
        const out = await ask(String(question).trim());
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(out));
      } catch (e) {
        const code = e && e.code && Number.isInteger(e.code) ? e.code : 500;
        res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: (e && e.msg) || String((e && e.message) || e) }));
      }
    });
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
}).listen(PORT, () => {
  console.log(`\n  Ask the codebase → http://localhost:${PORT}\n  Model: ${MODEL}  ·  Key: ${process.env.GEMINI_API_KEY ? "set" : "MISSING (set GEMINI_API_KEY)"}\n`);
});
