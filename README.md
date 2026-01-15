# ezezchatbot – Telegram Inline EzChat (V2)

Inline Telegram bot that rewrites messages from non-native speakers into more natural, authentic English using OpenAI’s ChatGPT API.

## Features

- Inline mode: `@ezezchatbot your draft message`
- Always returns **4 recipient-style options** for the user to choose from:
  - 💼 **Work (formal)**: most professional tone (covers boss/coworker/client)
  - 🏠 **Family (warm, no slang)**: caring and respectful (older generation friendly)
  - 😎 **Friend (cool/slang)**: casual, authentic, slang/abbreviations ok (younger generation)
  - 💛 **Crush (warm + emojis)**: subtly flirty, emojis allowed when appropriate
- Optimized for speed + cost: **one OpenAI call per inline query** with a brief prompt.

## Stack

- Node.js
- Telegraf (Telegram Bot API)
- OpenAI Node SDK (Chat Completions, `gpt-4.1-mini`)
- Express + webhooks
- Deployed on Render

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install

