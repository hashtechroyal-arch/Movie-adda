import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { Telegraf } from 'telegraf';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const movieSchema = new mongoose.Schema({
  file_id: String,
  file_name: String,
  caption: String,
});
const Movie = mongoose.model('Movie', movieSchema);

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Bot is running! RoyalQueen007bot'));
bot.on('channel_post', async (ctx) => {
  const msg = ctx.channelPost;
  let fileId = msg.document?.file_id || msg.video?.file_id;
  let fileName = msg.document?.file_name || msg.caption || 'movie';
  let caption = msg.caption || '';
  if(fileId){
    const exists = await Movie.findOne({file_id: fileId});
    if(!exists) await Movie.create({file_id: fileId, file_name: fileName, caption});
  }
});
bot.on('text', async (ctx) => {
  if(ctx.channelPost) return;
  let q = ctx.message.text;
  if(q.startsWith('/')) return;
  const movies = await Movie.find({ $or: [{file_name: {$regex: q, $options: 'i'}}, {caption: {$regex: q, $options: 'i'}}] }).limit(5);
  for(const m of movies){
    await ctx.replyWithDocument(m.file_id, {caption: m.caption});
  }
});
mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('Mongo Connected'));
bot.telegram.deleteWebhook().then(()=>bot.launch());
app.get('/', (req,res)=>res.send('Live'));
app.listen(PORT, ()=>console.log('running'));
