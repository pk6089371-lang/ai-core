import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const TG_TOKEN = process.env.TG_BOT_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const FREE_LIMIT = 5;

// In-memory store (simple start)
const users = {};

function sendMessage(chatId, text) {
  return fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });
}

async function askAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "AI error";
}

app.post("/", async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text || "";

  if (!users[chatId]) {
    users[chatId] = { count: 0, paid: false };
  }

  // /start command
  if (text === "/start") {
    await sendMessage(
      chatId,
      "✅ AI reply enabled\n\n" +
      "🤖 Hello! How can I assist you today?\n\n" +
      "🆓 Free: 5 messages/day\n" +
      "💎 Paid plans available"
    );
    return res.sendStatus(200);
  }

  // Free limit check
  if (!users[chatId].paid && users[chatId].count >= FREE_LIMIT) {
    await sendMessage(
      chatId,
      "❌ Free limit over\n\n" +
      "Unlimited AI use ke liye plan choose karo 👇\n\n" +
      "1️⃣ ₹199 / month\n" +
      "Pay here 👇\n" +
      "upi://pay?pa=pk60893711@ybl&pn=AI%20Core&am=199\n\n" +
      "2️⃣ ₹999 / year\n" +
      "Pay here 👇\n" +
      "upi://pay?pa=pk60893711@ybl&pn=AI%20Core&am=999\n\n" +
      "📸 Payment ke baad screenshot bhejo"
    );
    return res.sendStatus(200);
  }

  // AI reply
  users[chatId].count += 1;
  const reply = await askAI(text);
  await sendMessage(chatId, reply);

  res.sendStatus(200);
});

app.listen(10000, () => {
  console.log("AI CORE LIVE 🚀");
});
