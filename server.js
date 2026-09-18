require('dotenv').config();
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const bot = new Telegraf(BOT_TOKEN);
const movieSchema = new mongoose.Schema({ title: String, file_id: String, caption: String });
const Movie = mongoose.model('Movie', movieSchema);
mongoose.connect(MONGO_URI).then(()=>console.log("Mongo Connected"));

app.use(express.json());

// Har update log karo taaki pata chale kya aa raha hai
app.use((req,res,next)=>{
  console.log("Update Aaya:", JSON.stringify(req.body).substring(0,200));
  next();
});

app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/bot${BOT_TOKEN}`).then(()=> console.log("Webhook Set OK"));

bot.on('channel_post', async (ctx) => {
  console.log("CHANNEL POST MILA!");
  const msg = ctx.update.channel_post;
  const file = msg.document || msg.video;
  if(!file){ console.log("File nahi mila"); return; }
  console.log("Saving:", msg.caption);
  await Movie.findOneAndUpdate({ caption: msg.caption }, { title: (msg.caption||"").toLowerCase(), file_id: file.file_id, caption: msg.caption }, { upsert: true });
  console.log("SAVED OK:", msg.caption);
});

bot.on('text', async (ctx) => {
  if(ctx.chat.type === 'channel') return;
  const text = ctx.message.text;
  if(text.startsWith('/')) return;
  const movie = await Movie.findOne({ title: { $regex: text.toLowerCase(), $options: 'i' } });
  if(movie){ await ctx.replyWithDocument(movie.file_id, { caption: movie.caption }); }
});

app.get('/', (req,res)=> res.send("Bot running"));
app.listen(10000, () => console.log("Server running"));
