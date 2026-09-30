require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Telegraf, Markup } = require('telegraf');

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const PORT = process.env.PORT || 10000;

// ✅ TERA FINAL LOGO LINK
const WELCOME_PHOTO = 'https://i.ibb.co/qL5Cftzm/Chat-GPT-Image-Sep-30-2026-01-35-08-AM.png';
const CHANNEL_LINK = 'https://t.me/Neoprimemovie';
const CHANNEL_USERNAME = '@Neoprimemovie';

if (!BOT_TOKEN) {
  console.log('BOT_TOKEN missing in env!');
}

const bot = new Telegraf(BOT_TOKEN);

// MongoDB Connect
if (MONGO_URI) {
  mongoose.connect(MONGO_URI).then(() => console.log('Mongo Connected ✅')).catch(e => console.log('Mongo Error:', e.message));
}

// /start with LOGO
bot.start(async (ctx) => {
  try {
    await ctx.replyWithPhoto(
      { url: WELCOME_PHOTO },
      {
        caption: `👑 *Welcome to NeoPrime* 👑\n\n🎬 *Streaming Beyond Limits* 🎬\n\n✅ Latest Movies | Web Series | Netflix | Prime\n✅ Hindi Dubbed | 480p | 720p | 1080p\n\n🔍 *Koi bhi movie ka naam likho, mai turant bhej dunga!*\n\nExample: \`Animal, Jawan, Leo\``,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('📢 Join NeoPrime Channel', CHANNEL_LINK)],
          [Markup.button.callback('🔍 Search Movie', 'search_movie')]
        ])
      }
    );
  } catch (err) {
    console.log('Photo error:', err.message);
    await ctx.reply('👑 Welcome to NeoPrime 👑\n\n🔍 Koi bhi movie ka naam likho!');
  }
});

bot.action('search_movie', (ctx) => {
  ctx.reply('🔍 Movie ka naam likho, jaise: Animal');
});

// Movie Search Logic
bot.on('text', async (ctx) => {
  const query = ctx.message.text;
  if (query.startsWith('/')) return;

  await ctx.reply(`🔍 *${query}* search ho raha hai...`, { parse_mode: 'Markdown' });

  await ctx.reply(
    `✅ *${query}* ke liye click karo:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url(`🎬 ${query} - Dekho`, CHANNEL_LINK)],
        [Markup.button.url('📢 All Movies Channel', CHANNEL_LINK)]
      ])
    }
  );
});

// Express Server for Render
app.get('/', (req, res) => res.send('NeoPrime Bot Live 👑'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Bot launch - 409 fix final
const launchBot = async (retries = 3) => {
  try {
    await bot.telegram.deleteWebhook({ dropPendingUpdates: true });
    console.log('Old webhook deleted');
    await new Promise(r => setTimeout(r, 3000));
    await bot.launch({ dropPendingUpdates: true });
    console.log('NeoPrime Bot Started with Logo 👑 ✅');
  } catch (err) {
    if (err.message.includes('409') && retries > 0) {
      console.log(`409 Conflict, retrying... ${retries} left`);
      await new Promise(r => setTimeout(r, 5000));
      return launchBot(retries - 1);
    }
    console.log('Launch failed:', err.message);
  }
};
launchBot();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
