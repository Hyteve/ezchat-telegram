// src/bot.js
import { Telegraf } from "telegraf";
import { rewriteV2All } from "./aiClient.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_USERNAME = "ezezchatbot";

if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not set");

export const bot = new Telegraf(BOT_TOKEN);

function truncate(text, length = 80) {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > length ? t.slice(0, length - 1) + "…" : t;
}

bot.start(async (ctx) => {
  await ctx.reply(
    `Hi! I rewrite your message in 4 styles (work/family/friend/crush).

Inline usage (any chat):
@${BOT_USERNAME} your message

Then choose one:
💼 Work  | 👨‍👩‍👧‍👦 Family | 😎 Friend | 💖 Crush`
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    `Use inline mode:
@${BOT_USERNAME} your message

You'll get 4 options:
💼 Work (most formal)
👨‍👩‍👧‍👦 Family (warm, no slang)
😎 Friend (slang/abbr)
💖 Crush (charming, emojis ok)`
  );
});

// Optional: direct chat with bot returns all 4 too
bot.on("text", async (ctx) => {
  const text = ctx.message.text?.trim();
  if (!text) return;

  // If message was inserted via inline bot, ignore
  if (ctx.message.via_bot && ctx.message.via_bot.username === BOT_USERNAME) return;

  try {
    await ctx.reply("✨ Rewriting (work / family / friend / crush)...");
    const v = await rewriteV2All(text);

    const msg =
      `💼 *Work*\n${v.work}\n\n` +
      `👨‍👩‍👧‍👦 *Family*\n${v.family}\n\n` +
      `😎 *Friend*\n${v.friend}\n\n` +
      `💖 *Crush*\n${v.crush}`;

    await ctx.reply(msg, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(err);
    await ctx.reply("Oops—something went wrong. Try again in a moment 😢");
  }
});

// Inline queries: always show all 4 variants
bot.on("inline_query", async (ctx) => {
  const query = (ctx.inlineQuery.query || "").trim();

  if (!query) {
    return ctx.answerInlineQuery(
      [
        {
          type: "article",
          id: "hint",
          title: "Type a message to rewrite",
          description: `Example: @${BOT_USERNAME} sorry i reply late, i was busy`,
          input_message_content: {
            message_text: "Tip: type your draft after @ezezchatbot"
          }
        }
      ],
      { cache_time: 0 }
    );
  }

  try {
    const v = await rewriteV2All(query);

    const results = [
      {
        type: "article",
        id: "work",
        title: "💼 Work (formal)",
        description: truncate(v.work),
        input_message_content: { message_text: v.work }
      },
      {
        type: "article",
        id: "family",
        title: "👨‍👩‍👧‍👦 Family (warm)",
        description: truncate(v.family),
        input_message_content: { message_text: v.family }
      },
      {
        type: "article",
        id: "friend",
        title: "😎 Friend (slang/abbr)",
        description: truncate(v.friend),
        input_message_content: { message_text: v.friend }
      },
      {
        type: "article",
        id: "crush",
        title: "💖 Crush (charming)",
        description: truncate(v.crush),
        input_message_content: { message_text: v.crush }
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
