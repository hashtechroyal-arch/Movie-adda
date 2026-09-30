import os, threading
from flask import Flask
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

BOT_TOKEN = os.environ.get("BOT_TOKEN")
bot = telebot.TeleBot(BOT_TOKEN)
app = Flask(__name__)

@app.route('/')
def home():
    return "Bunti Royal Bot Live"

@bot.message_handler(func=lambda m: True)
def handle(m):
    q = m.text.strip()
    # Royal Design exactly like your screenshot
    caption = f"🅱️🆄🅽🆃🅸 🆁🅾🆈🅰🅻\n{q}\n\n📁 HERE I FOUND\n{q.upper()}\n\n👑 Provide By Bunti Royal"

    markup = InlineKeyboardMarkup()
    markup.row(InlineKeyboardButton(f"🔗 3810.7 MB> {q} (2025) 1080p 10bit", callback_data=f"f1|{q}"))
    markup.row(InlineKeyboardButton(f"🔗 3158.66 MB> {q} 2025 1080p 10bit", callback_data=f"f2|{q}"))
    markup.row(InlineKeyboardButton(f"🔗 3810.7 MB> {q} (2025) 1080p 10bit", callback_data=f"f3|{q}"))

    bot.reply_to(m, caption, reply_markup=markup)

@bot.callback_query_handler(func=lambda c: True)
def callback(c):
    try:
        _, q = c.data.split('|',1)
    except:
        q = c.data
    # File jaisa message jo screenshot me neeche dikh raha hai
    bot.send_message(c.message.chat.id, f"🎬 {q} 2025 1080p 10bit.DS4K.NF.WEBRip.Hindi.DD.mkv\n\n👑 Provide By Bunti Royal")
    bot.answer_callback_query(c.id, "Link Ready ✅")

def run_bot():
    bot.infinity_polling()

threading.Thread(target=run_bot).start()
app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
