const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ status: "AI CORE LIVE (single file)" });
});

// ✅ Telegram Webhook (IMPORTANT)
app.post("/", async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) return res.send("ok");

    const chatId = message.chat.id;
    const userText = message.text;

    const ai = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userText }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = ai.data.choices[0].message.content;

    await axios.post(
      `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
      {
        chat_id: chatId,
        text: reply,
      }
    );

    res.send("ok");
  } catch (err) {
    console.error(err);
    res.send("ok");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
