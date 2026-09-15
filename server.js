require('dotenv').config();
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!BOT_TOKEN) console.log("BOT_TOKEN missing!");
if (!MONGO_URI) console.log("MONGO_URI missing!");

mongoose.connect(MONGO_URI).then(()=>console.log("Mongo Connected")).catch(e=>console.log(e));

const movieSchema = new mongoose.Schema({ title: String, file_id: String, caption: String });
const Movie = mongoose.model('Movie', movieSchema);

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx)=>ctx.reply("🎬 Welcome to Movie-Adda!\n\nGroup me movie ka naam bhejo, mai file bhej dunga."));

bot.on('channel_post', async (ctx) => {
  try {
    const post = ctx.channelPost;
    const file = post.document || post.video;
    if (!file) return;
    const text = post.caption || post.text || "";
    const title = text.split('\n')[0].trim().toLowerCase();
    if(!title) return;
    await Movie.findOneAndUpdate({title}, {title, file_id: file.file_id, caption: text}, {upsert: true});
    console.log("Saved:", title);
  } catch(e){ console.log(e) }
});

bot.on('text', async (ctx) => {
  try {
    if(ctx.chat.type!== 'group' && ctx.chat.type!== 'supergroup') return;
    const query = ctx.message.text.toLowerCase().trim();
    if(query.startsWith('/')) return;
    const movie = await Movie.findOne({title: query});
    if(movie){
      await ctx.replyWithDocument(movie.file_id, {caption: movie.caption});
    }
  } catch(e){ console.log(e) }
});

bot.launch();
console.log("Bot started");

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
const app = express();
app.get('/', (req,res)=> res.send('Bot is running!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
