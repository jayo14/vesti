const BASE = "https://openrouter.ai/api/v1";

function getKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");
  return key;
}

async function fetchJSON(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

type TextContent = { type: "text"; text: string };
type ImageContent = { type: "image_url"; image_url: { url: string } };

type Message =
  | { role: "assistant" | "user"; content: string }
  | { role: "user"; content: Array<TextContent | ImageContent> };

export async function chat(
  messages: Message[],
  model = "openai/gpt-4o"
): Promise<string> {
  const res = await fetchJSON("/chat/completions", { model, messages });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter chat error (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const buf8 = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < buf8.length; i++) bin += String.fromCharCode(buf8[i]);
  const b64 = btoa(bin);
  const mime = res.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${b64}`;
}

export async function generateImage(
  prompt: string,
  _size = "1024x1792"
): Promise<string | null> {
  const res = await fetch(`${BASE}/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "x-ai/grok-imagine-image-quality",
      prompt,
      aspect_ratio: "9:16",
      resolution: "1K",
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`OpenRouter image error (${res.status}): ${err}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return null;
  return `data:image/png;base64,${b64}`;
}
