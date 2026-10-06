const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL_USERNAME = "@ProfessorSigAlpha";
const CHANNEL_LINK = "https://t.me/ProfessorSigAlpha";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
if (!mongoUri) console.log("MONGO URI NOT FOUND!");
else mongoose.connect(mongoUri).then(() => console.log("Mongo Connected")).catch(e => console.log(e));

const movieSchema = new mongoose.Schema({ name: String, fileId: String, caption: String });
const Movie = mongoose.model('Movie', movieSchema);

function editDistance(s1, s2) {
  s1 = s1.toLowerCase(); s2 = s2.toLowerCase(); let costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1)!= s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue; lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
function similarity(s1, s2) {
  let longer = s1, shorter = s2;
  if (s1.length < s2.length) { longer = s2; shorter = s1; }
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

async function saveMovie(ctx) {
  try {
    const msg = ctx.channelPost || ctx.message; if (!msg) return;
    let fileId = msg.document?.file_id || msg.video?.file_id; if (!fileId) return;
    const caption = msg.caption || msg.text || "No Name";
    const movieName = caption.split('\n')[0].trim();
    console.log(`FILE MILA: ${movieName}`);
    await new Movie({ name: movieName, fileId, caption }).save();
    console.log(`SAVED OK: ${movieName}`);
  } catch (e) { console.log("SAVE ERROR: " + e.message); }
}
bot.on('channel_post', saveMovie);
bot.on(['document', 'video'], saveMovie);

// Force Subscribe Function
async function isSubscribed(ctx) {
  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
    return ['creator','administrator','member'].includes(member.status);
  } catch(e) { return false; }
}

bot.start((ctx) => ctx.reply('👑 Welcome to Movie Adda - By Professor Bunti Royal! Movie ka naam bhejo! 🎬'));

bot.hears(/(owner|malik|creator|kisne banaya|tumhe kisne banaya|tumhara malik|banane wala|who is your owner)/i, (ctx) => {
  return ctx.reply('👑 *Mere Malik / Creator* 👑\n\n*Name:* Professor Bunti Royal ✨\n*Profession:* Civil Engineer 👷‍♂️ | Genius Developer 🧠\n\nMujhe Professor Bunti Royal ne banaya hai!\n\n🎯 सफलता का कोई शॉर्टकट नहीं होता। 💯🔥\n\n📢 Channel: @ProfessorSigAlpha', { parse_mode: 'Markdown' });
});

// 7 RULES ADDED
bot.command('rules', (ctx) => {
  return ctx.reply(`📜 *7 RULES OF @ProfessorSigAlpha* 📜\n\n1️⃣ Channel Join Karna Compulsory Hai 🔒\n2️⃣ No Spam - Ek hi movie bar-bar mat mango ⛔\n3️⃣ Spelling Sahi Likho 🔍\n4️⃣ No Hi/Hello, Sirf Movie Naam Bhejo 🤫\n5️⃣ 10 Min Me Auto-Delete ⏳\n6️⃣ No 18+ Demand 🚫\n7️⃣ Respect Professor Bunti Royal 👑\n\n✅ Follow Karo, Enjoy Karo! 🎬`, { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
  try {
    const userQuery = ctx.message?.text?.trim();
    if (!userQuery || userQuery.startsWith('/')) return;
    if (/(owner|malik|creator|kisne banaya|tumhe kisne banaya)/i.test(userQuery)) return;

    // FORCE JOIN CHECK
    const joined = await isSubscribed(ctx);
    if (!joined) {
      return ctx.reply(`🔒 *Pehle Channel Join Karo!* 🔒\n\n📢 ${CHANNEL_LINK} join karo tabhi movie milegi!`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: "📢 JOIN @ProfessorSigAlpha 📢", url: CHANNEL_LINK }], [{ text: "✅ Joined - Check Again", callback_data: `check_join_${userQuery}` }]] }
      });
    }

    const movies = await Movie.find({ name: { $regex: userQuery, $options: 'i' } }).limit(5);
    if (movies && movies.length > 0) {
      for (let movie of movies) {
        if (!movie.fileId) continue;
        const sent = await ctx.replyWithDocument(movie.fileId, { caption: `${movie.caption || movie.name}\n\n⏳ 10 min me delete\n\n⚡ Provide By Bunti R👑yal\n📢 ${CHANNEL_LINK}` });
        setTimeout(() => { ctx.deleteMessage(sent.message_id).catch(() => {}); }, 600000);
      }
      return;
    }

    const allMovies = await Movie.find({}, 'name').limit(200);
    let bestMatch = null, bestScore = 0;
    for (const m of allMovies) {
      if (!m.name) continue;
      const score = similarity(userQuery, m.name);
      if (score > bestScore) { bestScore = score; bestMatch = m.name; }
    }
    if (bestMatch && bestScore > 0.3) {
      return ctx.reply(`⚠️ *Aapne spelling galat likhi hai!* ⚠️\n\nAapne search kiya: \`${userQuery}\`\n\nKya aapka matlab ye tha? 👇`, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: `🎬 ${bestMatch} ✅`, callback_data: `search_${bestMatch}` }]] }
      });
    } else {
      // 🔥 YEHI WO GOOGLE BUTTON - PEHLE SE SET HAI 🔥
      return ctx.reply(`😝 Hello ${userQuery}\n\nI couldn't find any movie or series in that name.. 😐`, {
        reply_markup: {
          inline_keyboard: [[
            { text: `🔍 CHECK SPELLING ON GOOGLE 🔍`, url: `https://www.google.com/search?q=${encodeURIComponent(userQuery + ' movie correct spelling')}` }
          ]]
        }
      });
    }
  } catch (e) { console.log(e); }
});

bot.action(/check_join_(.+)/, async (ctx) => {
  const joined = await isSubscribed(ctx);
  if (!joined) return ctx.answerCbQuery("❌ Join nahi kiya abhi!");
  await ctx.answerCbQuery("✅ Joined! Ab movie bhejta hu");
  ctx.deleteMessage().catch(()=>{});
});

bot.action(/search_(.+)/, async (ctx) => {
  try {
    const correctTitle = ctx.match[1];
    const movies = await Movie.find({ name: { $regex: correctTitle, $options: 'i' } }).limit(5);
    for (let movie of movies) {
      const sent = await ctx.replyWithDocument(movie.fileId, { caption: `${movie.caption || movie.name}\n\n⏳ 10 min me delete\n\n⚡ Provide By Bunti R👑yal\n📢 ${CHANNEL_LINK}` });
      setTimeout(() => { ctx.deleteMessage(sent.message_id).catch(() => {}); }, 600000);
    }
    await ctx.answerCbQuery(`Ye lo ${correctTitle} 👑`);
  } catch (e) { console.log(e); }
});

bot.launch(); console.log("Bot Started");
app.get('/', (req, res) => res.send('Bot Running - Professor Bunti Royal 👑 @ProfessorSigAlpha'));
app.listen(process.env.PORT || 3000, () => console.log('Server running'));
