const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = '8753947646:AAGA8NNHJeKGOReVLITOAv6mOkxA5Vnxpmw';
const CHANNEL_USERNAME = '@Neoprimemovie';
const CHANNEL_LINK = 'https://t.me/Neoprimemovie';

// ✅ TERA NEOPRIME LOGO - FINAL
const WELCOME_PHOTO = 'https://i.ibb.co/qL5Cftzm/Chat-GPT-Image-Sep-30-2026-01-35-08-AM.png';

const bot = new Telegraf(BOT_TOKEN);

// /start pe logo ke sath welcome
bot.start(async (ctx) => {
  await ctx.replyWithPhoto(
    { url: WELCOME_PHOTO },
    {
      caption: `👑 *Welcome to NeoPrime* 👑\n\n🎬 *Streaming Beyond Limits* 🎬\n\n✅ Latest Movies | Web Series | Netflix | Prime\n✅ Hindi Dubbed | 480p | 720p | 1080p\n\n🔍 *Koi bhi movie ka naam likho, mai turant bhej dunga!*\n\nExample: \`Animal, Jawan, Leo\``,
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url('📢 Join NeoPrime Channel', CHANNEL_LINK)],
        [Markup.button.callback('🔍 Search Movie', 'search')]
      ])
    }
  );
});

bot.on('text', async (ctx) => {
  const query = ctx.message.text;
  if (query.startsWith('/')) return;
  
  await ctx.reply(`🔍 *${query}* search ho raha hai...`, { parse_mode: 'Markdown' });
  
  await ctx.reply(
    `✅ *${query}* ke liye click karo:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.url(`🎬 ${query} - Dekho`, CHANNEL_LINK)],
        [Markup.button.url('📢 All Movies', CHANNEL_LINK)]
      ])
    }
  );
});

bot.launch({ dropPendingUpdates: true });
console.log('NeoPrime Bot Started with Logo 👑✅');
