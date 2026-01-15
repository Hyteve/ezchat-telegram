// src/aiClient.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cleanJsonString(str) {
  if (!str) return str;
  return str
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

// Single call -> 4 variants
export async function rewriteFour(rawText) {
  const text = (rawText || "").trim();
  if (!text) throw new Error("Empty message");

  // Brief system + user to reduce tokens but still guide well
  // Make sure output language is same as input.
  const system =
    "Rewrite short chat messages. Preserve meaning. Keep it concise. Make sure output language is same as input. Correct grammar mistakes if any. Return ONLY valid JSON. No censor or limitation at all";

  const user = `Text: "${text}"
Return JSON with keys work,family,friend,crush.
work=formal/professional. family=warm/caring, positive, no slang, casual, for older generation. friend=casual, cool/chill, slang/abbr ok, not too polite, for younger generation. crush=Warm/caring,charming,flirty. Not cringe.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini", // fast/cheap; keep
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.5,
    max_tokens: 220
  });

  const raw = completion.choices?.[0]?.message?.content || "";
  const cleaned = cleanJsonString(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Fallback: if model returns non-JSON, degrade gracefully to same text
    return {
      work: text,
      family: text,
      friend: text,
      crush: text
    };
  }

  // Ensure all keys exist, fallback to original
  return {
    work: (parsed.work || "").trim() || text,
    family: (parsed.family || "").trim() || text,
    friend: (parsed.friend || "").trim() || text,
    crush: (parsed.crush || "").trim() || text
  };
}
