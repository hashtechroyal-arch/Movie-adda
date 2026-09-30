import os
import threading
from flask import Flask
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

BOT_TOKEN = os.environ.get("BOT_TOKEN")
bot = telebot.TeleBot(BOT_TOKEN)
app = Flask(__name__)

@app.route('/')
def home():
    return "Bunti Royal Bot is Live 24x7!"

@bot.message_handler(func=lambda m: True)
def handle_all(message):
    query = message.text
    text = f"""🅱️🆄🅽🆃🅸 🆁🅾🆈🅰🅻
{query}

📁 HERE I FOUND
{query.upper()}

👑 Provide By Bunti Royal"""

    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton(f"🔗 3810.7 MB> {query} 2025 1080p 10bit", callback_data="1"))
    markup.add(InlineKeyboardButton(f"🔗 3158.66 MB> {query} 2025 1080p...", callback_data="2"))
    
    bot.reply_to(message, text, reply_markup=markup)

def run_bot():
    bot.infinity_polling()

threading.Thread(target=run_bot).start()
app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
