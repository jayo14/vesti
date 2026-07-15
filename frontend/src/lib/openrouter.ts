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
  const replicateKey = process.env.REPLICATE_API_KEY;
  if (!replicateKey) throw new Error("REPLICATE_API_KEY not set");

  const createRes = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: "9:16",
          num_outputs: 1,
        },
      }),
    }
  );
  if (!createRes.ok) {
    const err = await createRes.text().catch(() => "Unknown error");
    throw new Error(`Replicate create error (${createRes.status}): ${err}`);
  }

  const { id } = await createRes.json();

  // Poll until complete
  let lastStatus = "";
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      { headers: { Authorization: `Bearer ${replicateKey}` } }
    );
    const data = await pollRes.json();
    lastStatus = data.status;
    if (data.status === "succeeded") {
      const url = data.output?.[0];
      if (!url) return null;
      return urlToBase64(url);
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction ${data.status}: ${data.error || "unknown"}`);
    }
  }
  throw new Error(`Replicate prediction timed out (last status: ${lastStatus})`);
}
