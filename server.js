require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');

const app = express();
app.use(express.json());

// MongoDB Connect
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Mongo Connected ✅'))
    .catch((err) => console.log('Mongo Error:', err.message));
} else {
  console.log('MONGO_URI not set, skipping mongo connect');
}

// Bot Setup
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.log('BOT_TOKEN not set! Set it in Render Environment');
}
const bot = new Telegraf(BOT_TOKEN);

// ---- TERA BOT KA CODE YAHAN DAAL SAKTA HAI ----
// Example:
bot.start((ctx) => ctx.reply('NeoPrime Bot Started with Logo 👑 ✅'));
// Yahan apne saare bot.command / bot.on wale code daal de
// -----------------------------------------------

// Express route - Render health check ke liye
app.get('/', (req, res) => {
  res.send('NeoPrime Bot is Running 👑');
});

// Server start - Render ke liye sabse zaruri
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

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
