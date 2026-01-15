// src/aiClient.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RECIPIENT_GUIDE = {
  boss: "Professional, concise, respectful. No slang. Clear ask, polite tone.",
  coworker: "Friendly-professional. Clear, efficient. Light warmth ok, no excessive emojis.",
  client: "Client-facing: polite, confident, helpful. Clear next steps. No slang.",
  friend: "Use slangs. Casual, natural, relaxed. Light humor ok. Optional 0-1 emoji if it fits.",
  crush: "Warm, charming, slightly flirty but subtle. Not cringe. Keep it short.",
  family: "Warm, respectful, natural. Clear and caring tone."
};

function stripToTag(text) {
  return (text || "").replace(/\bto:(boss|coworker|client|friend|crush|family)\b/gi, "").trim();
}

function cleanJsonString(str) {
  if (!str) return str;
  return str
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

// Single rewrite: default “authentic + correct”
export async function rewriteMessage(rawText) {
  const text = stripToTag(rawText);
  if (!text) throw new Error("Empty message");

  const system = `
You rewrite short chat messages for a non-native English speaker.

Hard rules:
- Preserve meaning and intent.
- Fix grammar and make it sound natural, authentic chat English.
- Keep it concise. Avoid overexplaining.
- Do NOT add new info not implied.
- Output ONLY the rewritten message. No quotes, no labels.
  `.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Rewrite this message:\n"${text}"` }
    ],
    temperature: 0.2,
    max_tokens: 80
  });

  return completion.choices[0].message.content.trim();
}

// Dual rewrite in ONE call: returns { natural, tailored }
export async function rewriteDual(rawText, recipientType) {
  const text = stripToTag(rawText);
  if (!text) throw new Error("Empty message");
  if (!recipientType) throw new Error("Missing recipientType");

  const guide = RECIPIENT_GUIDE[recipientType] || "";

  const system = `
You rewrite short chat messages for a non-native English speaker.

Hard rules:
- Preserve meaning and intent.
- Keep it concise and natural.
- Do NOT add new info not implied.
- Return ONLY valid JSON. No markdown. No explanations.
  `.trim();

  const user = `
Original message:
"${text}"

Create two rewrites:
1) "natural": authentic + grammatically correct (general)
2) "tailored": adapted for recipient type "${recipientType}" using this guidance:
${guide || "N/A"}

Return EXACTLY this JSON shape:
{"natural":"...","tailored":"..."}
  `.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.3,
    max_tokens: 140
  });

  const raw = completion.choices[0].message.content;
  const cleaned = cleanJsonString(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // fallback: if JSON parse fails, degrade gracefully
    return {
      natural: await rewriteMessage(text),
      tailored: await rewriteMessage(text) // worst case: duplicate
    };
  }

  return {
    natural: (parsed.natural || "").trim() || text,
    tailored: (parsed.tailored || "").trim() || text
  };
}
