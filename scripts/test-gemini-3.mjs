import fs from 'fs';

let apiKey = "";
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/^(?:VITE_)?GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)/m);
  if (match && match[1]) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.error("Error reading .env:", e.message);
}

if (!apiKey) {
  console.error("No GEMINI_API_KEY found in .env");
  process.exit(1);
}

const models = [
  "gemini-3.1-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
  "gemini-1.5-flash"
];

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  console.log(`Testing model: ${model}...`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello, reply with one word." }] }]
      })
    });

    const status = response.status;
    const text = await response.text();
    console.log(`-> Status: ${status}`);
    if (status === 200) {
      console.log(`-> Success! Response: ${text.trim().slice(0, 100)}`);
      return true;
    } else {
      console.log(`-> Error: ${text.trim().slice(0, 300)}`);
      return false;
    }
  } catch (e) {
    console.log(`-> Connection error: ${e.message}`);
    return false;
  }
}

async function main() {
  for (const model of models) {
    console.log("-----------------------------------------");
    await testModel(model);
  }
}

main().catch(console.error);
