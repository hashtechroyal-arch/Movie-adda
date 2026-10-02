require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { Telegraf, Markup } = require('telegraf');

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const PORT = process.env.PORT || 10000;

const bot = new Telegraf(BOT_TOKEN);

// Database
const movieSchema = new mongoose.Schema({
  name: String,
  fileId: String,
  caption: String,
  fileName: String
});
const Movie = mongoose.model('Movie', movieSchema);

mongoose.connect(MONGO_URI).then(() => console.log("MongoDB Connected ✅")).catch(e => console.log(e));

bot.start((ctx) => {
  ctx.reply("👑 Royal Bot Live Hai!\n\nKoi bhi movie ka naam likho 👇\n\n⚜️ Provide By Bunti Royal ⚜️");
});

// --- Jab tu movie bhejega channel me ---
bot.on(['document', 'video'], async (ctx) => {
  const file = ctx.message.document || ctx.message.video;
  const fileId = file.file_id;
  const fileName = file.file_name || ctx.message.caption || "movie";
  const caption = ctx.message.caption || fileName;

  await Movie.create({
    name: (fileName + " " + caption).toLowerCase(),
    fileId: fileId,
    caption: caption,
    fileName: fileName
  });
  console.log("Saved:", fileName);
});

// --- Jab koi movie search karega - TERI PHOTO JAISE HI ---
bot.on('text', async (ctx) => {
  const query = ctx.message.text.trim();
  if (query.startsWith('/')) return;
  const search = query.toLowerCase();

  const movies = await Movie.find({ name: { $regex: search, $options: 'i' } }).limit(10);
  if (movies.length === 0) return;

  // Message 1: HERE I FOUND FOR
  const foundMsg = await ctx.reply(
    `📁 HERE I FOUND FOR ${query}\n\n⏰ 10 min me auto delete\n\n⚜️ Provide By Bunti Royal ⚜️`,
    { reply_to_message_id: ctx.message.message_id }
  );

  // Message 2: Send All Button
  const sendAllMsg = await ctx.reply(
    `📩 Send All (${movies.length}) Files 📩`,
    Markup.inlineKeyboard([
      [Markup.button.callback(`📁 Send All (${movies.length}) Files 📁`, `sendall_${search}`)]
    ])
  );

  let sentMessages = [foundMsg.message_id, sendAllMsg.message_id];

  // Message 3: Saari Files
  for (let movie of movies) {
    let sent = await ctx.replyWithDocument(movie.fileId, {
      caption: `${movie.fileName}\n\n${movie.caption}\n\n⏰ 10 min me delete\n\n⚜️ Provide By Bunti Royal ⚜️`
    });
    sentMessages.push(sent.message_id);
  }

  // 10 Minute me Auto Delete
  setTimeout(async () => {
    try {
      for (let msgId of sentMessages) {
        await ctx.deleteMessage(msgId).catch(() => {});
      }
    } catch (e) {}
  }, 10 * 60 * 1000);
});

// Send All Button pe click kare to
bot.action(/sendall_(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const search = ctx.match[1];
  const movies = await Movie.find({ name: { $regex: search, $options: 'i' } }).limit(10);

  for (let movie of movies) {
    await ctx.replyWithDocument(movie.fileId, {
      caption: `${movie.fileName}\n\n${movie.caption}\n\n⏰ 10 min me delete\n\n⚜️ Provide By Bunti Royal ⚜️`
    });
  }
});

bot.launch().then(() => console.log("Royal Bot Started..."));
app.get('/', (req, res) => res.send('Bot is Live 24x7 - Bunti Royal'));
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
