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
require('dotenv').config();
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!BOT_TOKEN) console.log("BOT_TOKEN missing!");
if (!MONGO_URI) console.log("MONGO_URI missing!");

const bot = new Telegraf(BOT_TOKEN);

// MongoDB
const movieSchema = new mongoose.Schema({ 
  title: String, 
  file_id: String, 
  caption: String 
});
const Movie = mongoose.model('Movie', movieSchema);
mongoose.connect(MONGO_URI).then(()=>console.log("Mongo Connected")).catch(e=>console.log(e));

// Webhook for Render
app.use(express.json());
app.post(`/bot${BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
});
bot.telegram.setWebhook(`${process.env.RENDER_EXTERNAL_URL}/bot${BOT_TOKEN}`);

// 1. Jab tu apne private Movie Storage channel me movie dalega
bot.on('channel_post', async (ctx) => {
  const msg = ctx.channelPost;
  if (!msg.document && !msg.video) return;
  const file_id = msg.document ? msg.document.file_id : msg.video.file_id;
  const caption = msg.caption || msg.text || "";
  if(!caption) return;

  await Movie.create({ title: caption.toLowerCase(), file_id: file_id, caption: caption });
  console.log("Saved Movie: " + caption);
});

// 2. Jab group me koi movie ka naam likhega
bot.on('text', async (ctx) => {
  if(ctx.chat.type === 'channel') return;
  const text = ctx.message.text;
  
  if(text.startsWith('/start')){
    return ctx.reply("Welcome to Movie-Adda! Group me movie ka naam bhejo, mai file bhej dunga.");
  }
  if(text.startsWith('/')) return;

  const movie = await Movie.findOne({ title: { $regex: text.toLowerCase(), $options: 'i' } });
  if(movie){
    await ctx.reply(`${movie.caption} mil gayi, bhej raha hu...`);
    await ctx.replyWithDocument(movie.file_id, { caption: movie.caption });
  }
});

app.get('/', (req,res)=> res.send("Bot is running"));
app.listen(10000, () => console.log("Server running on 10000"));
