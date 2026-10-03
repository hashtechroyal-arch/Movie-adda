const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URL).then(()=> console.log("MongoDB Connected"));

const movieSchema = new mongoose.Schema({
  name: String,
  fileId: String,
  caption: String,
  fileName: String
});
const Movie = mongoose.model('Movie', movieSchema);

bot.on(['document', 'video'], async (ctx) => {
  const file = ctx.message.document || ctx.message.video;
  const fileId = file.file_id;
  const fileName = file.file_name || "movie";
  const caption = ctx.message.caption || fileName;
  await Movie.create({ name: (fileName + " " + caption).toLowerCase(), fileId, caption, fileName });
  ctx.reply(`Saved: ${fileName}`);
});

bot.on('channel_post', async (ctx) => {
  const file = ctx.channelPost.document || ctx.channelPost.video;
  if(!file) return;
  await Movie.create({ 
    name: (file.file_name + " " + (ctx.channelPost.caption || "")).toLowerCase(), 
    fileId: file.file_id, 
    caption: ctx.channelPost.caption || file.file_name, 
    fileName: file.file_name || "movie" 
  });
});

bot.start((ctx) => ctx.reply('Bot Live Hai!'));

// --- Smart Spelling Check ---
function similarity(s1, s2) {
  let longer = s1; let shorter = s2;
  if (s1.length < s2.length) { longer = s2; shorter = s1; }
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}
function editDistance(s1, s2) {
  s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
  let costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i-1)!= s2.charAt(j-1))
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j-1] = lastValue; lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

bot.on('text', async (ctx) => {
  const userQuery = ctx.message.text;
  if (userQuery.startsWith('/')) return;
  if (/(owner|malik|creator|kisne banaya)/i.test(userQuery)) return;
  try {
    const movies = await Movie.find({ name: { $regex: ctx.message.text.toLowerCase(), $options: 'i' } }).limit(5);
    if (movies.length > 0) {
      for (let movie of movies) {
        const sent = await ctx.replyWithDocument(movie.fileId, {
          caption: `${movie.caption}\n\n⏳ 10 min me delete\n\n⚡ Provide By Bunti R👑oyal`
        });
        setTimeout(() => { ctx.deleteMessage(sent.message_id).catch(()=>{}); }, 600000);
      }
    } else {
      const allMovies = await Movie.find({}, 'name').limit(100);
      let bestMatch = null; let bestScore = 0;
      for (const m of allMovies) {
        const score = similarity(userQuery, m.name);
        if (score > bestScore) { bestScore = score; bestMatch = m.name; }
      }
      if (bestScore > 0.4 && bestMatch) {
        return ctx.reply(
          `⚠️ *Aapne spelling galat likhi hai!*\n\nAapne search kiya: \`${userQuery}\`\nKya aapka matlab ye tha? 👇\nNeeche blue button pe click karo, movie turant mil jayegi!`,
          { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: `🎬 ${bestMatch}`, callback_data: `search_${bestMatch}` }]] } }
        );
      } else {
        return ctx.reply(
          `🙏 *Sorry / Maaf Kijiye!* 🙏\n\n"${userQuery}" ye movie mere paas abhi available nahi hai 😔\n\nKyonki mere Professor Bunti Royal 👑 ne abhi ye movie mujhe provide nahi ki hai.\n\nJaise hi mere Professor mujhe ye movie provide karenge, mai aapko turant provide kar dunga! 🎬✨`,
          { parse_mode: 'Markdown' }
        );
      }
    }
  } catch (e) { console.log(e); }
});

bot.action(/search_(.+)/, async (ctx) => {
  const correctTitle = ctx.match[1];
  const movies = await Movie.find({ name: { $regex: correctTitle, $options: 'i' } }).limit(5);
  for (let movie of movies) {
    const sent = await ctx.replyWithDocument(movie.fileId, {
      caption: `${movie.caption}\n\n⏳ 10 min me delete\n\n⚡ Provide By Bunti R👑oyal`
    });
    setTimeout(() => { ctx.deleteMessage(sent.message_id).catch(()=>{}); }, 600000);
  }
  await ctx.answerCbQuery(`Ye lo ${correctTitle} 👑`);
});
// R👑yal Owner Reply - Professor Bunti Royal
bot.hears(/(owner|malik|creator|kisne banaya|tumhe kisne banaya|tumhara malik|banane wala|who is your owner)/i, (ctx) => {
  return ctx.reply(
    '👑 *Mere Malik / Creator* 👑\n\n' +
    '*Name:* Professor Bunti Royal ✨\n' +
    '*Profession:* Civil Engineer 👷‍♂️ | Genius Developer 🧠\n\n' +
    '*Mere Malik ke baare me:*\n' +
    'Ye ladka dil ka bahut hi acha aur sabka chaheta hai ❤️\n' +
    'Ek sachcha Genius hai, jiske dimaag me har problem ka solution hai 💡\n' +
    'Mehnati itna ki jo soch le, karke dikhata hai 🔥\n' +
    'Mujhe (Is Bot ko) Professor Bunti Royal ne banaya hai!\n\n' +
    '💬 *Unki Soch:*\n' +
    '🎯 सफलता का कोई शॉर्टकट नहीं होता। 💯🔥\n\n' +
    '🙏 Proud to be made by Professor Bunti Royal!',
    { parse_mode: 'Markdown' }
  );
});
(async () => {
  await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  bot.launch();
})();

app.get('/', (req, res) => res.send('Bot Live'));
app.listen(PORT);
