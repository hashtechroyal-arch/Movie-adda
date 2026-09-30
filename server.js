require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');

const app = express();
app.use(express.json());

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo Connected ✅'))
  .catch((err) => console.log('Mongo Error:', err.message));

// Bot Setup
const bot = new Telegraf(process.env.BOT_TOKEN);

// --- Yahan tumhara purana bot ka code aayega ---
// Jaise bot.start, bot.on, bot.command etc
// Agar tumhare paas commands hain toh yahan paste karna

bot.start((ctx) => ctx.reply('NeoPrime Bot Started with Logo 👑 ✅'));

// --- Bot code khatam ---

// Express Server - Render ke liye zaruri
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is Running'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Final Launch - Sirf ek baar, 409 fix ke saath
(async () => {
  try {
    await bot.telegram.deleteWebhook({ dropPendingUpdates: true });
    console.log('Old webhook deleted');
  } catch (e) {
    console.log('No webhook to delete');
  }
  try {
    await bot.launch({ dropPendingUpdates: true });
    console.log('NeoPrime Bot Started with Logo 👑 ✅');
  } catch (err) {
    console.log('Launch failed:', err.message);
  }
})();
