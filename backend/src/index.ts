import express from "express";
import dotenv from "dotenv";
import sesWebhook from "./sesWebhook.js";
import { sendMail } from "./sendMail.js";

dotenv.config();

const app = express();
app.use(express.json());

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({client});

// Outgoing email API
app.post("/send-email", async (req, res) => {
  try {
    const { from, to, subject, message } = req.body;

    await sendMail({
      fromEmail: from,
      to,
      subject,
      html: `<p>${message}</p>`,
      text: message,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email failed" });
  }
});

// Incoming SES emails
app.use(sesWebhook);

app.get('/health', (req, res)=>{
  return res.send("server running");
});

app.listen(3000, () => {
  console.log("Email backend running on port 3000");
});
