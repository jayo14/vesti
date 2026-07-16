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


