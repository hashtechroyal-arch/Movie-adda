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
  const msg = ctx.channelPost || ctx.message;
  const file_id = msg.document?.file_id || msg.video?.file_id || msg.document?.file_id;
  const caption = msg.caption || msg.text || "";
  console.log("FILE MILA:", file_id ? "YES" : "NO", " Caption:", caption);
  if(!file_id) return;
  const title = caption.toLowerCase().trim();
  await Movie.findOneAndUpdate({caption},{title,file_id,caption},{upsert:true,new:true});
  console.log("SAVED OK:", caption);
}

bot.on('channel_post', saveMovie);
bot.on('message', saveMovie);

bot.on('text', async (ctx) => {
  if(ctx.chat.type === 'channel') return;
  if(ctx.message.text.startsWith('/')) return;
  const q = ctx.message.text.toLowerCase();
  console.log("Search:", q);
  const movie = await Movie.findOne({ title: { $regex: q } });
  if(movie){ await ctx.replyWithDocument(movie.file_id, {caption: movie.caption}); console.log("Bhej diya:", q); }
  else { console.log("Nahi mili:", q); }
});

app.get('/', (req,res)=> res.send("Bot Live"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, async ()=>{
  console.log("Server running on", PORT);
  await bot.telegram.deleteWebhook({drop_pending_updates:true});
  await bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
  console.log("Webhook Set OK");
});
