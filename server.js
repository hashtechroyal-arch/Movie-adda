const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const URL = process.env.RENDER_EXTERNAL_URL;

const bot = new Telegraf(BOT_TOKEN);

// DB
const movieSchema = new mongoose.Schema({ title: String, file_id: String, caption: String });
const Movie = mongoose.model('Movie', movieSchema);
mongoose.connect(MONGO_URI).then(()=>console.log("Mongo Connected OK")).catch(e=>console.log("Mongo Fail",e.message));

app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

// CHANNEL SE SAVE KARNA
bot.on('channel_post', async (ctx) => {
  try{
    const msg = ctx.channelPost;
    console.log("CHANNEL POST MILA! ID:", msg.message_id);
    let file_id = null;
    if(msg.document) file_id = msg.document.file_id;
    if(msg.video) file_id = msg.video.file_id;
    if(!file_id){ console.log("File nahi mila"); return; }
    
    const caption = msg.caption || "No Title";
    const title = caption.toLowerCase().trim();
    
    await Movie.findOneAndUpdate(
      { caption: caption },
      { title: title, file_id: file_id, caption: caption },
      { upsert: true, new: true }
    );
    console.log("SAVED OK:", caption);
  }catch(e){ console.log("SAVE ERROR:", e.message); }
});

// GROUP ME SEARCH
bot.on('text', async (ctx) => {
  try{
    if(ctx.chat.type === 'channel') return;
    if(ctx.message.text.startsWith('/')) return;
    const q = ctx.message.text.toLowerCase();
    console.log("Search:", q);
    const movie = await Movie.findOne({ title: { $regex: q } });
    if(movie){
      await ctx.replyWithDocument(movie.file_id, {caption: movie.caption});
      console.log("Bhej diya");
    }
  }catch(e){ console.log("Search error", e.message); }
});

app.get('/', (req,res)=> res.send("Bot Live"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, async ()=>{
  console.log("Server running on", PORT);
  try{
    await bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
    console.log("Webhook Set OK");
  }catch(e){ console.log("Webhook Fail:", e.message); }
});
