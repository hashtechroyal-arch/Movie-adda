import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, MessageHandler, ContextTypes, filters

# Apna channel ID yahan daalna jahan files rakhi hain
CHANNEL_ID = -1003711188445 # <-- isko apna channel ID se change karna

async def search_movie(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.message.text
    if len(query) < 2: return

    # Yahi tera wala Royal look hai
    text = f"""🅱️🆄🅽🆃🅸 🆁🅾🆈🅰🅻
{query}

📁 HERE I FOUND
{query.upper()}

👑 Provide By Bunti Royal"""

    # File ke buttons - size ke saath
    keyboard = [
        [InlineKeyboardButton("🔗 3810.7 MB> Jolly LLB 3 (2025) 1080p 10bit", callback_data="file1")],
        [InlineKeyboardButton("🔗 3158.66 MB> Jolly.LLB.3.2025.1080p.10bit...", callback_data="file2")],
        [InlineKeyboardButton("🔗 3810.7 MB> Jolly LLB 3 (2025) 1080p 10bit", callback_data="file3")],
    ]
    
    await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

app = ApplicationBuilder().token(os.environ.get("BOT_TOKEN")).build()
app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, search_movie))
print("Royal Bot ON hai...")
app.run_polling()
