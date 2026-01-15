// src/aiClient.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Use env override if you want, default to gpt-5-nano
const MODEL = process.env.OPENAI_MODEL || "gpt-5-nano";

// Tiny helper just in case (Structured Outputs should already give valid JSON)
function cleanJsonString(str) {
  if (!str) return str;
  return str
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

/**
 * Returns 4 rewrites in one call:
 * - work: most formal/professional
 * - family: warm/caring, no slang
 * - friend: slang/abbr, younger-gen, not too polite
 * - crush: warm/charming, subtle flirty, emojis ok if fit
 */
export async function rewriteV2All(text) {
  const input = (text || "").trim();
  if (!input) throw new Error("Empty message");

  // Keep prompt brief to reduce tokens + latency
  const developer = `Rewrite chat msg for non-native speaker. Preserve meaning. Keep concise. No extra info. Output JSON only.`;

  const user = `Msg: "${input}"
Make 4 variants:
work=formal/pro
family=warm+caring,no slang
friend=slang/abbr,cool,not too polite
crush=warm/charming,subtle flirty,emojis ok if fit
Return JSON: {"work":"..","family":"..","friend":"..","crush":".."}.`;

  const responseFormat = {
    type: "json_schema",
    json_schema: {
      name: "rewrite_v2",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          work: { type: "string" },
          family: { type: "string" },
          friend: { type: "string" },
          crush: { type: "string" }
        },
        required: ["work", "family", "friend", "crush"]
      }
    }
  };

  // Prefer low reasoning effort for speed/cost on GPT-5 family
  // If a model/account rejects reasoning_effort, we retry once without it.
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "developer", content: developer },
        { role: "user", content: user }
      ],
      response_format: responseFormat,
      reasoning_effort: "minimal",
      temperature: 0.4,
      max_tokens: 220,
      store: false
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(cleanJsonString(raw));

    return {
      work: (parsed.work || "").trim(),
      family: (parsed.family || "").trim(),
      friend: (parsed.friend || "").trim(),
      crush: (parsed.crush || "").trim()
    };
  } catch (err) {
    // Retry once without reasoning_effort (some configs may reject it)
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "developer", content: developer },
        { role: "user", content: user }
      ],
      response_format: responseFormat,
      max_completion_tokens: 220,
      store: false
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(cleanJsonString(raw));

    return {
      work: (parsed.work || "").trim(),
      family: (parsed.family || "").trim(),
      friend: (parsed.friend || "").trim(),
      crush: (parsed.crush || "").trim()
    };
  }
}
