// src/bot.js
import { Telegraf } from "telegraf";
import { rewriteFour } from "./aiClient.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = "ezezchatbot"; // no @

if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

export const bot = new Telegraf(BOT_TOKEN);

function truncate(text, length = 80) {
  if (!text) return "";
  return text.length > length ? text.slice(0, length - 1) + "…" : text;
}

bot.start(async (ctx) => {
  await ctx.reply(
    `Hi! I rewrite your message into 4 styles:\n\n` +
      `• Work (formal)\n• Family (warm, no slang)\n• Friend (cool/slang)\n• Crush (warm + emojis)\n\n` +
      `Use inline mode in any chat:\n@${BOT_USERNAME} your message`
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `Inline usage:\n@${BOT_USERNAME} your message\n\n` +
      `You’ll get 4 options: Work / Family / Friend / Crush.`
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
          description: `Example: @${BOT_USERNAME} sorry I can't make it today`,
          input_message_content: {
            message_text: `Example:\n"Sorry, I can’t make it today."`
          }
        }
      ],
      { cache_time: 0 }
    );
  }

  try {
    // ONE OpenAI call -> 4 outputs
    const { work, family, friend, crush } = await rewriteFour(query);

    const results = [
      {
        type: "article",
        id: "work",
        title: "💼 Work (formal, professional)",
        description: truncate(work),
        input_message_content: { message_text: work }
      },
      {
        type: "article",
        id: "family",
        title: "🏠 Family (warm, positive)",
        description: truncate(family),
        input_message_content: { message_text: family }
      },
      {
        type: "article",
        id: "friend",
        title: "😎 Friend (cool, young)",
        description: truncate(friend),
        input_message_content: { message_text: friend }
      },
      {
        type: "article",
        id: "crush",
        title: "💛 Crush (charming, flirty)",
        description: truncate(crush),
        input_message_content: { message_text: crush }
      }
    ];

    await ctx.answerInlineQuery(results, {
      cache_time: 0,
      is_personal: true
    });
  } catch (err) {
    console.error("Inline query error:", err);
    await ctx.answerInlineQuery([], { cache_time: 0 });
  }
});
