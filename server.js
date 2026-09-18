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
mongoose.connect(MONGO_URI).then(()=>console.log("Mongo Connected")).catch(e=>console.log("Mongo Fail",e.message));
app.use(express.json());
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

async function saveMovie(ctx){
  try{
    const msg = ctx.channelPost || ctx.message;
    const file_id = msg.document?.file_id || msg.video?.file_id;
    const caption = msg.caption || msg.text || "";
    console.log("FILE MILA:", file_id ? "YES" : "NO", "Caption:", caption);
    if(!file_id || !caption){
      console.log("SKIP: file ya caption missing");
      return;
    }
    const title = caption.toLowerCase().trim().split("\n")[0];
    await Movie.findOneAndUpdate(
      { title: title },
      { title: title, file_id: file_id, caption: caption },
      { upsert: true, new: true }
    );
    console.log("SAVED OK:", title);
  }catch(e){
    console.log("SAVE ERROR:", e.message);
  }
}

bot.on('channel_post', saveMovie);
bot.on('message', saveMovie);

bot.on('text', async (ctx) => {
  if(ctx.channelPost) return;
  const query = ctx.message.text.toLowerCase().trim();
  if(!query) return;
  console.log("SEARCH AAYA:", query);
  const movies = await Movie.find({ title: { $regex: query, $options: 'i' } }).limit(5);
  if(movies.length === 0){
    return ctx.reply("Movie nahi mili: " + query);
  }
  for(let m of movies){
    try{
      await ctx.replyWithDocument(m.file_id, { caption: m.caption });
    }catch(e){
      await ctx.replyWithVideo(m.file_id, { caption: m.caption });
    }
  }
});

app.get('/', (req,res)=> res.send('Bot Live'));
app.listen(10000, async () => {
  console.log("Server running on 10000");
  try{
    await bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
    console.log("Webhook Set OK");
  }catch(e){
    console.log("Webhook Fail", e.message);
  }
});
