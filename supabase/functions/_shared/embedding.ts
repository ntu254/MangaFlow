const GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

export async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const resp = await fetch(`${GEMINI_EMBED_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Embedding API error (${resp.status}): ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  return data?.embedding?.values || [];
}

export async function createBatchEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map((t) => createEmbedding(t)));
}
