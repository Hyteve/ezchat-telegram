// src/aiClient.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RECIPIENT_GUIDE = {
  boss: "Professional, concise, respectful. No slang. Clear ask, polite tone.",
  coworker: "Friendly-professional. Clear, efficient. Light warmth ok, no excessive emojis.",
  client: "Client-facing: polite, confident, helpful. Clear next steps. No slang.",
  friend: "Casual, natural, relaxed. Light humor ok. Can use slangs. Optional 0-1 emoji if it fits.",
  crush: "Warm, charming, slightly flirty but subtle. Not cringe. Keep it short.",
  family: "Warm, respectful, natural. Clear and caring tone."
};

// Light safety: strip the `to:` tag before sending to model (we do it in bot too, but belt+suspenders)
function stripToTag(text) {
  return text.replace(/\bto:(boss|coworker|client|friend|crush|family)\b/gi, "").trim();
}

export async function rewriteMessage(rawText, recipientType = null) {
  const text = stripToTag(rawText || "");
  if (!text) throw new Error("Empty message");

  const recipientRule = recipientType ? (RECIPIENT_GUIDE[recipientType] || "") : "";

  const system = `
You rewrite short chat messages for a non-native English speaker.

Hard rules:
- Preserve meaning and intent.
- Fix grammar and make it sound like natural, native chat.
- Keep it concise. Avoid overexplaining.
- Do NOT add extra info that the user didn't imply.
- Output ONLY the rewritten message (no quotes, no bullets, no labels).
  `.trim();

  const user = `
Recipient type: ${recipientType ? recipientType : "not specified"}
Recipient guidance (apply if specified): ${recipientRule || "N/A"}

Rewrite this message to be authentic and grammatically correct:
"${text}"
  `.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini", // fast model; can swap later
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
    // temperature: recipientType ? 0.6 : 0.4,
    // max_tokens: 120
  });

  return completion.choices[0].message.content.trim();
}
