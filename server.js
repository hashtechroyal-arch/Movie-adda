const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);

// MongoDB Connect
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
if (!mongoUri) {
  console.log("MONGO URI NOT FOUND!");
} else {
  mongoose.connect(mongoUri).then(() => console.log("Mongo Connected")).catch(e => console.log(e));
}

// Movie Schema
const movieSchema = new mongoose.Schema({
  name: String,
  fileId: String,
  caption: String
});
const Movie = mongoose.model('Movie', movieSchema);

// --- Smart Spelling Check Functions ---
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  let costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1)!= s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function similarity(s1, s2) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

// --- START ---
bot.start((ctx) => {
  return ctx.reply('👑 Welcome to Movie Adda - By Professor Bunti Royal! Movie ka naam bhejo!');
});

// --- R👑yal Owner Reply ---
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

// --- MAIN SEARCH + SPELLING FIX ---
bot.on('text', async (ctx) => {
  try {
    const userQuery = ctx.message?.text?.trim();
    if (!userQuery) return;
    if (userQuery.startsWith('/')) return;
    if (/(owner|malik|creator|kisne banaya|tumhe kisne banaya)/i.test(userQuery)) return;

    const movies = await Movie.find({ name: { $regex: userQuery, $options: 'i' } }).limit(5);

    if (movies && movies.length > 0) {
      for (let movie of movies) {
        if (!movie.fileId) continue;
        const sent = await ctx.replyWithDocument(movie.fileId, {
          caption: `${movie.caption || movie.name}\n\n⏳ 10 min me delete\n\n⚡ Provide By Bunti R👑yal`
        });
        setTimeout(() => {
          ctx.deleteMessage(sent.message_id).catch(() => {});
        }, 600000);
      }
      return;
    }

    // Spelling suggestion
    const allMovies = await Movie.find({}, 'name').limit(200);
    let bestMatch = null;
    let bestScore = 0;
    for (const m of allMovies) {
      if (!m.name) continue;
      const score = similarity(userQuery, m.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = m.name;
      }
    }

    if (bestMatch && bestScore > 0.3) {
      return ctx.reply(
        `⚠️ *Aapne spelling galat likhi hai!* ⚠️\n\nAapne search kiya: \`${userQuery}\`\n\nKya aapka matlab ye tha? 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: `🎬 ${bestMatch} ✅`, callback_data: `search_${bestMatch}` }]]
          }
        }
      );
    } else {
      return ctx.reply(
        `🙏 *Sorry / Maaf Kijiye!* 🙏\n\n"${userQuery}" ye movie mere paas abhi available nahi hai 😔\n\nKyonki mere Professor Bunti Royal 👑 ne abhi ye movie mujhe provide nahi ki hai.\n\nJaise hi mere Professor mujhe ye movie provide karenge, mai aapko turant provide kar dunga! 🎬✨`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (e) {
    console.log(e);
    return ctx.reply(`Error: ${e.message}`);
  }
});

// --- BLUE BUTTON CLICK ---
bot.action(/search_(.+)/, async (ctx) => {
  try {
    const correctTitle = ctx.match[1];
    const movies = await Movie.find({ name: { $regex: correctTitle, $options: 'i' } }).limit(5);
    for (let movie of movies) {
      if (!movie.fileId) continue;
      const sent = await ctx.replyWithDocument(movie.fileId, {
        caption: `${movie.caption || movie.name}\n\n⏳ 10 min me delete\n\n⚡ Provide By Bunti R👑yal`
      });
      setTimeout(() => {
        ctx.deleteMessage(sent.message_id).catch(() => {});
      }, 600000);
    }
    await ctx.answerCbQuery(`Ye lo ${correctTitle} 👑`);
  } catch (e) {
    console.log(e);
  }
});

bot.launch();
console.log("Bot Started");

app.get('/', (req, res) => res.send('Bot Running - Professor Bunti Royal 👑'));
app.listen(process.env.PORT || 3000, () => console.log('Server running'));
