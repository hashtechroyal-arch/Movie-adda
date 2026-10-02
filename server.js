const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URL).then(()=> console.log("MongoDB Connected"));

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
  await Movie.create({ name: (fileName + " " + caption).toLowerCase(), fileId, caption, fileName });
  ctx.reply(`Saved: ${fileName}`);
});

bot.on('channel_post', async (ctx) => {
  const file = ctx.channelPost.document || ctx.channelPost.video;
  if(!file) return;
  await Movie.create({ 
    name: (file.file_name + " " + (ctx.channelPost.caption || "")).toLowerCase(), 
    fileId: file.file_id, 
    caption: ctx.channelPost.caption || file.file_name, 
    fileName: file.file_name || "movie" 
  });
});

bot.start((ctx) => ctx.reply('Bot Live Hai!'));

bot.on('text', async (ctx) => {
  if(ctx.message.text.startsWith('/')) return;
  const movies = await Movie.find({ name: { $regex: ctx.message.text.toLowerCase(), $options: 'i' } }).limit(5);
  if(movies.length === 0) return ctx.reply('Movie nahi mili');
  for (let movie of movies) {
    const sent = await ctx.replyWithDocument(movie.fileId, {
      caption: `${movie.caption}\n\n⏳ 10 min me delete\n\n⚡ Provide By Bunti R👑oyal`
    });
    setTimeout(() => { ctx.deleteMessage(sent.message_id).catch(()=>{}); }, 600000);
  }
});

(async () => {
  await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  bot.launch();
})();

app.get('/', (req, res) => res.send('Bot Live'));
app.listen(PORT);