// src/bot.js
import { Telegraf } from "telegraf";
import { rewriteMessage, rewriteDual } from "./aiClient.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = "ezezchatbot"; // your bot username (no @)

if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

export const bot = new Telegraf(BOT_TOKEN);

const RECIPIENT_TYPES = ["boss", "coworker", "client", "friend", "crush", "family"];

function truncate(text, length = 80) {
  if (!text) return "";
  return text.length > length ? text.slice(0, length - 1) + "…" : text;
}

function parseRecipientAndText(query) {
  const match = query.match(/\bto:(boss|coworker|client|friend|crush|family)\b/i);
  const recipient = match ? match[1].toLowerCase() : null;
  const cleanedText = query.replace(/\bto:(boss|coworker|client|friend|crush|family)\b/gi, "").trim();
  return { recipient, cleanedText };
}

bot.start(async (ctx) => {
  await ctx.reply(
    `Hi! I rewrite your message into authentic, natural English.

Inline usage:
- Default: @${BOT_USERNAME} your message
- Recipient-aware: @${BOT_USERNAME} to:boss your message

Recipient types: ${RECIPIENT_TYPES.map((t) => `to:${t}`).join(", ")}`
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `Inline usage:
• Default: @${BOT_USERNAME} your message
• Recipient-aware: @${BOT_USERNAME} to:boss your message

Recipient types:
${RECIPIENT_TYPES.map((t) => `- to:${t}`).join("\n")}`
  );
});

// Inline queries
bot.on("inline_query", async (ctx) => {
  const query = (ctx.inlineQuery.query || "").trim();

  if (!query) {
    return ctx.answerInlineQuery(
      [
        {
          type: "article",
          id: "hint",
          title: "Type a message to rewrite",
          description: `Example: @${BOT_USERNAME} to:friend i am late sorry`,
          input_message_content: {
            message_text: `Example (default): "Sorry—I'm running a bit late."\nExample (recipient): "@${BOT_USERNAME} to:boss I’m running late today."`
          }
        }
      ],
      { cache_time: 0 }
    );
  }

  const { recipient, cleanedText } = parseRecipientAndText(query);

  if (!cleanedText) {
    // user typed only "to:boss" etc.
    return ctx.answerInlineQuery(
      [
        {
          type: "article",
          id: "need-text",
          title: "Add your message after the recipient tag",
          description: `Example: @${BOT_USERNAME} to:boss can we reschedule to tomorrow?`,
          input_message_content: {
            message_text: "Tip: Type your draft message after the recipient tag."
          }
        }
      ],
      { cache_time: 0 }
    );
  }

  try {
    const results = [];
  
    if (!recipient) {
      // ONE call only
      const natural = await rewriteMessage(cleanedText);
  
      results.push({
        type: "article",
        id: "natural",
        title: "A better response: (click here to send)",
        description: truncate(natural),
        input_message_content: { message_text: natural }
      });
  
      results.push({
        type: "article",
        id: "howto",
        title: "Try adding recipient: ",
        description: "Use: to:boss / to:friend / to:client / to:crush / to:coworker / to:family before your message",
        input_message_content: { message_text: natural }
      });
  
    } else {
      // STILL ONE call (returns both)
      const { natural, tailored } = await rewriteDual(cleanedText, recipient);
  
      results.push({
        type: "article",
        id: "natural",
        title: "✅ Natural (authentic + correct)",
        description: truncate(natural),
        input_message_content: { message_text: natural }
      });
  
      results.push({
        type: "article",
        id: `tailored-${recipient}`,
        title: `🎯 Tailored for ${recipient}`,
        description: truncate(tailored),
        input_message_content: { message_text: tailored }
      });
    }
  
    await ctx.answerInlineQuery(results, { cache_time: 0, is_personal: true });
  } catch (err) {
    console.error("Inline query error:", err);
    await ctx.answerInlineQuery([], { cache_time: 0 });
  }

});
