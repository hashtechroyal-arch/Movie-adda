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

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Bot is running! RoyalQueen007bot'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Mongo Error:', err));

bot.telegram.deleteWebhook().then(() => {
  console.log('Webhook deleted');
  return bot.launch();
}).then(() => console.log('Bot started'));

app.get('/', (req, res) => {
  res.send('RoyalQueen007bot is Live!');
});

app.listen(PORT, () => console.log('RoyalQueen007bot running on port', PORT));