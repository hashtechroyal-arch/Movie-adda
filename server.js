const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const URL = process.env.RENDER_EXTERNAL_URL;
const bot = new Telegraf(BOT_TOKEN);
const movieSchema = new mongoose.Schema({ title: String, file_id: String, caption: String });
const Movie = mongoose.model('Movie', movieSchema);
mongoose.connect(MONGO_URI).then(()=>console.log("Mongo Connected OK")).catch(e=>console.log("Mongo Fail",e.message));
app.use(express.json());
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
bot.on('channel_post', async (ctx) => {
  console.log("CHANNEL POST MILA RAW:", JSON.stringify(ctx.channelPost).substring(0,800));
  try{
    const msg = ctx.channelPost;
    let file_id = msg.document?.file_id || msg.video?.file_id || null;
    if(!file_id){ console.log("File ID nahi mila"); return; }
    const caption = msg.caption || msg.text || "No Title";
    const title = caption.toLowerCase().trim();
    await Movie.findOneAndUpdate({caption:caption},{title,file_id,caption},{upsert:true,new:true});
    console.log("SAVED OK:", caption);
  }catch(e){ console.log("SAVE ERROR:", e.message); }
});
bot.on('text', async (ctx) => {
  if(ctx.chat.type === 'channel') return;
  if(ctx.message.text.startsWith('/')) return;
  const q = ctx.message.text.toLowerCase();
  const movie = await Movie.findOne({ title: { $regex: q } });
  if(movie){ await ctx.replyWithDocument(movie.file_id, {caption: movie.caption}); }
});
app.get('/', (req,res)=> res.send("Bot Live"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, async ()=>{
  console.log("Server running on", PORT);
  try{ await bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`); console.log("Webhook Set OK");
  }catch(e){ console.log("Webhook Fail:", e.message); }
});
