import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

dotenv.config();
const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const CHANNEL_ID = process.env.CHANNEL_ID;

// MongoDB Schema
const movieSchema = new mongoose.Schema({
  file_id: String,
  file_name: String,
  caption: String
});
const Movie = mongoose.model('Movie', movieSchema);

// Jab channel me movie aaye toh save kare
bot.on('channel_post', async (ctx) => {
  try {
    const post = ctx.channelPost;
    if (!post) return;
    let file = post.document || post.video;
    if (!file) return;
    
    let name = file.file_name || post.caption || "movie";
    await Movie.create({
      file_id: file.file_id,
      file_name: name.toLowerCase(),
      caption: post.caption || ""
    });
    console.log("Saved:", name);
  } catch(e){ console.log(e) }
});

// Jab group me koi movie ka naam likhe
bot.on('text', async (ctx) => {
  const query = ctx.message.text.toLowerCase();
  if(query.startsWith('/')) return;

  const results = await Movie.find({
    file_name: { $regex: query, $options: 'i' }
  }).limit(10);

  if(results.length === 0) return;

  for(let m of results){
    await ctx.replyWithDocument(m.file_id, {caption: m.caption}).catch(()=>{});
  }
});

mongoose.connect(process.env.MONGODB_URI).then(()=>console.log("Mongo Connected"));
bot.launch();
app.get('/', (req,res)=>res.send('Movie Bot Live'));
app.listen(process.env.PORT || 3000);
