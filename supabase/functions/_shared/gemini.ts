// @ts-nocheck
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required for Gemini API access");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const MODEL = "gemini-2.0-flash";

export async function generateText(prompt: string, systemPrompt?: string, modelName: string = MODEL): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });
  let result;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await model.generateContent(prompt);
      break;
    } catch (err) {
      lastError = err;
      const errMsg = (err as Error).message || "";
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Quota")) {
        console.warn(`Gemini 429 rate limit hit. Waiting 5s before retry (attempt ${attempt}/3)...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw err;
    }
  }
  if (!result) throw lastError;
  return result.response.text();
}

export async function generateJson<T>(prompt: string, systemPrompt: string, modelName: string = MODEL): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt + "\n\nRespond with valid JSON only, no markdown formatting.",
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  });
  let result;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      result = await model.generateContent(prompt);
      break;
    } catch (err) {
      lastError = err;
      const errMsg = (err as Error).message || "";
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("Quota")) {
        console.warn(`Gemini 429 rate limit hit. Waiting 5s before retry (attempt ${attempt}/3)...`);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw err;
    }
  }
  if (!result) throw lastError;
  const text = result.response.text().replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  return JSON.parse(text) as T;
}

export async function analyzeImage(base64Image: string, mimeType: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
  });
  const imagePart = { inlineData: { data: base64Image, mimeType } };
  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text();
}
