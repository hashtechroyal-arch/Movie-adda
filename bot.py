import telebot, json, os, threading
from telebot import types
from flask import Flask

TOKEN = os.environ.get("BOT_TOKEN")
bot = telebot.TeleBot(TOKEN)
DB_FILE = "database.json"
app = Flask(__name__)

@app.route('/')
def home():
    return "Royal Bot ON hai!"

if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w") as f:
        json.dump({}, f)

@bot.channel_post_handler(content_types=['document','video'])
def save_movie(m):
    file_name = m.document.file_name if m.document else m.video.file_name
    file_id = m.document.file_id if m.document else m.video.file_id
    file_size = m.document.file_size if m.document else m.video.file_size
    size_mb = round(file_size / (1024*1024), 2)
    with open(DB_FILE, "r") as f:
        db = json.load(f)
    short_id = str(len(db) + 1)
    db[short_id] = {"name": file_name, "size": f"{size_mb} MB", "id": file_id}
    with open(DB_FILE, "w") as f:
        json.dump(db, f)
    print(f"Saved: {file_name}")

@bot.message_handler(func=lambda m: True, content_types=['text'])
def search(m):
    query = m.text.lower().strip()
    if len(query) < 2:
        return
    with open(DB_FILE, "r") as f:
        db = json.load(f)
    found = [(sid, d) for sid, d in db.items() if query in d["name"].lower()]
    if not found:
        return
    markup = types.InlineKeyboardMarkup()
    for sid, file in found[:10]:
        markup.add(types.InlineKeyboardButton(f"🔗 {file['size']}> {file['name'][:35]}", callback_data=f"get_{sid}"))
    bot.reply_to(m, f"📁 HERE I FOUND\n{query.upper()}\n\n👑 Provide By Bunti Royal", reply_markup=markup)

@bot.callback_query_handler(func=lambda c: True)
def cb(c):
    if c.data.startswith("get_"):
        sid = c.data.replace("get_", "")
        with open(DB_FILE, "r") as f:
            db = json.load(f)
        data = db[sid]
        bot.send_document(c.message.chat.id, data["id"], caption=f"🎬 {data['name']}\n\n👑 Provide By Bunti Royal")

def run_bot():
    print("Royal Bot ON hai...")
    bot.infinity_polling()

if __name__ == "__main__":
    threading.Thread(target=run_bot).start()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
