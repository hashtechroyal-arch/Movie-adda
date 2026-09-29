import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

dotenv.config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

const CHANNEL_USERNAME = "@WebNetflixprobot";
const CHANNEL_LINK = "https://t.me/WebNetflixprobot";

const movieSchema = new mongoose.Schema({
  file_id: String,
  file_name: String,
  caption: String,
  keyword: String
});
const Movie = mongoose.model('Movie', movieSchema);

bot.on('channel_post', async (ctx) => {
  try {
    const file = ctx.channelPost.document || ctx.channelPost.video;
    if (!file) return;
    const caption = ctx.channelPost.caption || file.file_name || "Movie";
    const keyword = file.file_name.toLowerCase();
    await new Movie({ file_id: file.file_id, file_name: file.file_name, caption: caption, keyword: keyword }).save();
    console.log("Saved:", file.file_name);
  } catch (e) {
    console.log(e.message);
  }
});

bot.on('text', async (ctx) => {
  const searchText = ctx.message.text.toLowerCase();
  if (searchText.startsWith('/')) return;
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
    if (member.status === 'left' || member.status === 'kicked') {
      return ctx.reply(`⚠️ Bhai pehle channel join karo tabhi movie milegi!`, {
        reply_markup: { inline_keyboard: [[{ text: "📢 Web Netflix Join Karo", url: CHANNEL_LINK }], [{ text: "✅ Join Kar Liya", callback_data: `check_${searchText}` }]] }
      });
    }
  } catch (e) { console.log("Join check:", e.message); }
  const movie = await Movie.findOne({ keyword: { $regex: searchText, $options: 'i' } });
  if (!movie) return ctx.reply("😔 Ye movie nahi mili bhai!");
  const finalCaption = `${movie.caption}\n\n🎬 Provide by Bunti Royal\n📢 Join : ${CHANNEL_LINK}\n\n⏰ NOTE: Ye file 10 min me auto-delete ho jayegi!`;
  const sent = await ctx.replyWithDocument(movie.file_id, { caption: finalCaption, reply_markup: { inline_keyboard: [[{ text: "📢 Web Netflix Join Karo", url: CHANNEL_LINK }]] } });
  setTimeout(async () => {
    try { await ctx.telegram.deleteMessage(ctx.chat.id, sent.message_id); } catch (e) {}
  }, 10 * 60 * 1000);
});

bot.action(/check_(.*)/, async (ctx) => {
  const searchText = ctx.match[1];
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
    if (member.status === 'left' || member.status === 'kicked') return ctx.answerCbQuery("Pehle join karo bhai!");
    await ctx.deleteMessage();
    const movie = await Movie.findOne({ keyword: { $regex: searchText, $options: 'i' } });
    if (movie) {
      const finalCaption = `${movie.caption}\n\n🎬 Provide by Bunti Royal\n📢 Join : ${CHANNEL_LINK}\n\n⏰ NOTE: Ye file 10 min me auto-delete ho jayegi!`;
      const sent = await ctx.replyWithDocument(movie.file_id, { caption: finalCaption, reply_markup: { inline_keyboard: [[{ text: "📢 Web Netflix Join Karo", url: CHANNEL_LINK }]] } });
      setTimeout(async () => { try { await ctx.telegram.deleteMessage(ctx.chat.id, sent.message_id); } catch (e) {} }, 10 * 60 * 1000);
    }
  } catch (e) {}
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Mongo Connected");
  bot.launch();
  app.listen(process.env.PORT || 3000, () => console.log("Server running"));
});
