# ezezchatbot – Telegram Inline EzChat

Inline Telegram bot that rewrites messages from non-native speakers into more
natural English using OpenAI's ChatGPT API.

## Features

- Inline mode: `@ezezchatbot your draft message`
- Three variants:
  - Polished & polite
  - Friendly & natural
  - Playful & cool
- Direct chat: send the bot a message and it replies with all three versions.

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
