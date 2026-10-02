const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URL).then(()=> console.log("MongoDB Connected ✅"));

const movieSchema = new mongoose.Schema({
  name: String,
  fileId: String,
  caption: String,
  fileName: String
});
const Movie = mongoose.model('Movie', movieSchema);

bot.on(['document', 'video'], async (ctx) => {
  const file = ctx.message.document || ctx.message.video;
  const fileId = file.file_id;
  const fileName = file.file_name || "movie";
  const caption = ctx.message.caption || fileName;
  await Movie.create({
    name: (fileName + " " + caption).toLowerCase(),
    fileId, caption, fileName
  });
  console.log("Saved:", fileName);
  ctx.reply(`✅ Saved: ${fileName}`);
});

bot.on('channel_post', async (ctx) => {
  const file = ctx.channelPost.document || ctx.channelPost.video;
  if(!file) return;
  const fileId = file.file_id;
  const fileName = file.file_name || "movie";
  const caption = ctx.channelPost.caption || fileName;
  await Movie.create({
    name: (fileName + " " + caption).toLowerCase(),
    fileId, caption, fileName
  });
  console.log("Saved from channel:", fileName);
});

bot.start((ctx) => ctx.reply('R👑oyal Bot Live Hai! Koi bhi movie ka naam likho'));

bot.on('text', async (ctx) => {
  if(ctx.message.text.startsWith('/')) return;
  const search = ctx.message.text.toLowerCase();
  const movies = await Movie.find({ name: { $regex: search, $options: 'i' } }).limit(10);
  
  if (movies.length === 0) {
    return ctx.reply('❌ Movie nahi mili');
  }

  for (let movie of movies) {
    const sent = await ctx.replyWithDocument(movie.fileId, {
      caption: `${movie.fileName}\n\n${movie.caption}\n\n⏳ 10 min me delete ho jayegi\n\n⚡ Provide By Bunti\n      👑\n      R oyal`
    });
    setTimeout(async () => {
      try { await ctx.deleteMessage(sent.message_id); } catch (e) {}
    }, 10 * 60 * 1000);
  }
});

(async () => {
  await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  bot.launch().then(() => console.log("Royal Bot Started..."));
})();

app.get('/', (req, res) => res.send('Bot is Live 24x7 - Bunti R Royal'));
app.listen(PORT, () => console.log(`Server running on ${PORT}`));