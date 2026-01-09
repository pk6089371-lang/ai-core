import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Health check
app.get("/", (req, res) => {
  res.json({ status: "AI CORE LIVE (single file)" });
});

// Telegram Webhook
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text;

    // ✅ STEP 1: /start command
    if (text === "/start") {
      await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            "✅ AI reply enabled\n\nHello! Ab aap jo bhi likhenge, main AI ke through reply karunga 🙂"
        })
      });
      return res.sendStatus(200);
    }

    // ✅ STEP 2: OPENAI CALL (REAL AI)
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful Hindi-English AI." },
            { role: "user", content: text }
          ]
        })
      }
    );

    const aiData = await aiResponse.json();
    const reply =
      aiData?.choices?.[0]?.message?.content ||
      "AI se reply nahi aa pa raha, thodi der baad try karo.";

    // ✅ STEP 3: SEND AI REPLY TO TELEGRAM
    await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply
      })
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
