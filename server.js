import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

dotenv.config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

const CHANNEL_USERNAME = "@WebNetflixprobot";
const CHANNEL_LINK = "https://t.me/WebNetflixprobot";

// MongoDB Schema
const movieSchema = new mongoose.Schema({
  file_id: String,
  file_name: String,
  caption: String,
  keyword: String
});
const Movie = mongoose.model('Movie', movieSchema);

// Jab channel me movie aaye toh save kare
bot.on('channel_post', async (ctx) => {
  try {
    const file = ctx.channelPost.document || ctx.channelPost.video;
    if (!file) return;
    const caption = ctx.channelPost.caption || file.file_name || "Movie";
    const keyword = file.file_name.toLowerCase().replace(/[^a-z0-9]/g, ' ');

    const newMovie = new Movie({
      file_id: file.file_id,
      file_name: file.file_name,
      caption: caption,
      keyword: keyword
    });
    await newMovie.save();
    console.log("Movie Saved:", file.file_name);
  } catch (e) {
    console.log(e.message);
  }
});

// User movie maange toh
bot.on('text', async (ctx) => {
  const searchText = ctx.message.text.toLowerCase();
  if (searchText.startsWith('/')) return;

  // 1. FORCE JOIN CHECK
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
    if (member.status === 'left' || member.status === 'kicked') {
      return ctx.reply(
        `⚠️ Bhai movie ke liye pehle channel join karo!`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "📢 Web Netflix Join Karo", url: CHANNEL_LINK }],
              [{ text: "✅ Join Kar Liya", callback_data: `check_${searchText}` }]
            ]
          }
        }
      );
    }
  } catch (e) {
    console.log("Join check error", e.message);
  }

  // 2. MOVIE SEARCH
  const movie = await Movie.findOne({ keyword: { $regex: searchText, $options: 'i' } });
  if (!movie) return ctx.reply("😔 Ye movie nahi mili, channel pe request karo!");

  // 3. SEND WITH YOUR NAME
  const finalCaption = `${movie.caption}\n\n🎬 Provide by Bunti Royal\n📢 Join: ${CHANNEL_LINK}\n\n⏰ Note: Ye file 10 minute me auto-delete ho jayegi!`;

  const sent = await ctx.replyWithDocument(movie.file_id, {
    caption: finalCaption,
    reply_markup: {
      inline_keyboard: [[{ text: "📢 Web Netflix Join Karo", url: CHANNEL_LINK }]]
    }
  });

  // 4. AUTO DELETE AFTER 10 MIN
  setTimeout(async () => {
    try {
      await ctx.telegram.deleteMessage(ctx.chat.id, sent.message_id);
      await ctx.reply(`🗑️ ${movie.file_name} auto-delete ho gayi! Dubara chahiye toh naam bhejo.`);
    } catch (err) {}
  }, 10 * 60 * 1000);
});

bot.action(/check_(.*)/, async (ctx) => {
  const searchText = ctx.match[1];
  const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
  if (member.status === 'left' || member.status === 'kicked') {
    return ctx.answerCbQuery("Pehle join to karo bhai!");
  }
  await ctx.deleteMessage();
  const movie = await Movie.findOne({ keyword: { $regex: searchText, $options: 'i' } });
  if (movie) {
    const finalCaption = `${movie.caption}\n\n🎬 Provide by Bunti Royal\n📢 Join: ${CHANNEL_LINK}\n\n⏰ Note: Ye file 10 minute me auto-delete ho jayegi!`;
    const sent = await ctx.replyWithDocument(movie.file_id, {
      caption: finalCaption,
      reply_markup: { inline_keyboard: [[{ text: "📢 Web Netflix Join Karo", url: CHANNEL_LINK }]] }
    });
    setTimeout(async () => {
      try { await ctx.telegram.deleteMessage(ctx.chat.id, sent.message_id); } catch (e) {}
    }, 10 * 60 * 1000);
  }
});

// Server Start
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB Connected");
  bot.launch();
  app.listen(process.env.PORT || 3000, () => console.log("Server running"));
});
