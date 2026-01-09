require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const { v4: uuid } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin123";
const DB_FILE = "./users.json";

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "{}");

const loadUsers = () => JSON.parse(fs.readFileSync(DB_FILE));
const saveUsers = (d) => fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));

async function askAI(message) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Reply in Hindi, English or Hinglish." },
        { role: "user", content: message }
      ]
    },
    { headers: { Authorization: `Bearer ${OPENAI_KEY}` } }
  );
  return res.data.choices[0].message.content;
}

function auth(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key) return res.status(401).json({ error: "API key missing" });

  const users = loadUsers();
  const user = users[key];
  if (!user) return res.status(403).json({ error: "Invalid key" });

  const now = Date.now();
  if (now > user.resetAt) {
    user.used = 0;
    user.resetAt = now + 86400000;
  }
  if (user.used >= user.limit)
    return res.status(429).json({ error: "Limit reached" });

  user.used++;
  users[key] = user;
  saveUsers(users);
  next();
}

app.post("/api/chat", auth, async (req, res) => {
  const reply = await askAI(req.body.message);
  res.json({ reply });
});

app.post("/admin/create-user", (req, res) => {
  if (req.headers["admin-secret"] !== ADMIN_SECRET)
    return res.status(403).json({ error: "Forbidden" });

  const users = loadUsers();
  const apiKey = uuid();
  users[apiKey] = {
    limit: 20,
    used: 0,
    resetAt: Date.now() + 86400000
  };
  saveUsers(users);
  res.json({ apiKey });
});

app.get("/", (req, res) => {
  res.json({ status: "AI CORE LIVE (single file)" });
});

app.listen(PORT, () => console.log("Running on", PORT));
