#!/usr/bin/env node
// Ask a natural-language question about this codebase.
//
// Flow: your question -> `codegraph explore` (reads the local knowledge graph
// and returns the relevant verbatim source + call paths) -> Gemini synthesises
// a grounded answer that cites file:line.
//
// Setup:
//   1. Get a Gemini API key: https://aistudio.google.com/apikey
//   2. export GEMINI_API_KEY=...        (PowerShell: $env:GEMINI_API_KEY="...")
//   3. node tools/ask.mjs "how do the vote buttons on the Board session screen work?"
//
// Optional env: GEMINI_MODEL (default gemini-2.5-flash).

import { exec } from "node:child_process";
import { promisify } from "node:util";

// Run through the shell so Windows resolves the `codegraph.cmd` shim on PATH.
const execP = promisify(exec);

const question = process.argv.slice(2).join(" ").trim();
if (!question) {
  console.error('Usage: node tools/ask.mjs "your question about the code"');
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Set GEMINI_API_KEY first (https://aistudio.google.com/apikey).");
  process.exit(1);
}
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// 1) Ask CodeGraph for the structural context (source + call paths + blast radius).
let context = "";
try {
  // Strip characters that would break the quoted shell arg (NL questions won't need them).
  const q = question.replace(/["`$%]/g, " ");
  const { stdout } = await execP(`codegraph explore "${q}"`, {
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  context = stdout;
} catch (err) {
  console.error("codegraph explore failed. Is CodeGraph installed and the project indexed (codegraph init)?");
  console.error(String(err.message || err));
  process.exit(1);
}

// 2) Ground Gemini strictly on that context.
const system = [
  "You are a senior engineer answering questions about the MangaFlow codebase.",
  "Answer ONLY from the CodeGraph context provided by the user; do not invent files, symbols, or behavior.",
  "Always cite concrete locations as `path/to/file.ts:line`.",
  "Explain, in order: WHERE the relevant code is, WHAT it does, and HOW it works (the flow / who calls it).",
  "If the context does not contain the answer, say so and suggest what to explore next.",
  "Reply in the same language the question is written in. Be concise and concrete.",
].join(" ");

const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
const body = {
  systemInstruction: { parts: [{ text: system }] },
  contents: [
    {
      role: "user",
      parts: [{ text: `Question:\n${question}\n\n--- CodeGraph context ---\n${context}` }],
    },
  ],
  generationConfig: { temperature: 0.2 },
};

let res;
try {
  res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
} catch (err) {
  console.error("Network error calling Gemini:", String(err.message || err));
  process.exit(1);
}

if (!res.ok) {
  console.error(`Gemini API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
const answer = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
if (!answer) {
  console.error("No answer returned. Raw response:\n" + JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("\n" + answer.trim() + "\n");
