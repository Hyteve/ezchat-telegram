// src/server.js
import "dotenv/config.js";
import express from "express";
import { bot } from "./bot.js";

const PORT = process.env.PORT || 10000;
const PUBLIC_URL = process.env.PUBLIC_URL;

async function launch() {
  if (process.env.NODE_ENV === "development") {
    // Local dev: use polling
    console.log("Starting bot in polling mode (development)...");
    await bot.launch();
    console.log("Bot started with long polling");
    return;
  }

  if (!PUBLIC_URL) {
    throw new Error("PUBLIC_URL is not set (needed for webhooks in production)");
  }

  const app = express();

  // Needed for Telegram to parse JSON updates
  app.use(express.json());

  // Telegraf webhook handler at /webhook
  app.use(bot.webhookCallback("/webhook"));

  // Simple health check endpoint
  app.get("/", (req, res) => {
    res.send("ezezchatbot is running ✅");
  });

  app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);

    const webhookUrl = `${PUBLIC_URL.replace(/\/$/, "")}/webhook`;
    try {
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`Webhook set to: ${webhookUrl}`);
    } catch (err) {
      console.error("Failed to set webhook:", err);
    }
  });
}

// Start everything
launch().catch((err) => {
  console.error("Fatal error during launch:", err);
  process.exit(1);
});

// Graceful stop (for Render restarts)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
