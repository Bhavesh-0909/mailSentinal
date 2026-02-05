import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { simpleParser, ParsedMail } from "mailparser";
import fetch from "node-fetch";
import { db } from "./index.js";
import { rawEmails } from "./db/schema.js";
import OpenAI from "openai";
const router = express.Router();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// SNS sends text/plain
router.use(bodyParser.text({ type: "*/*" }));

interface SNSMessage {
  Type: "SubscriptionConfirmation" | "Notification";
  SubscribeURL?: string;
  Message?: string;
}


router.post("/ses/inbound", async (req: Request, res: Response) => {
  try {
    // SNS sends JSON as string sometimes
    const snsMessage: SNSMessage =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    /**
     * 1️⃣ SNS subscription confirmation
     */
    if (snsMessage.Type === "SubscriptionConfirmation") {
      if (snsMessage.SubscribeURL) {
        await fetch(snsMessage.SubscribeURL);
        console.log("✅ SNS subscription confirmed");
      }
      return res.status(200).send("Subscription confirmed");
    }

    /**
     * 2️⃣ Incoming email notification
     */
    if (snsMessage.Type === "Notification" && snsMessage.Message) {
      const sesPayload = JSON.parse(snsMessage.Message);

      const mail = sesPayload.mail;
      const receipt = sesPayload.receipt;

      // ⚠️ SNS inbound gives raw email only if configured that way
      const rawEmail: string | undefined = sesPayload.content;

      let parsed: ParsedMail | null = null;

      if (rawEmail) {
        parsed = await simpleParser(rawEmail);
      }
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "you are mail analyizer, just analyize the mail and answer in just one word spam or ham" },
          { role: "user", content: rawEmail!}
        ],
      });


      await db.insert(rawEmails).values({
        sesMessageId: mail.messageId,
        sesReceiptRule: receipt?.ruleName,

        from: parsed?.from?.text || mail.commonHeaders.from?.[0] || "",
        to: parsed?.to ? (Array.isArray(parsed.to) ? parsed.to[0].text : parsed.to.text): "",

        subject: parsed?.subject || mail.commonHeaders.subject || null,

        rawEmail: rawEmail || null,

        spam:response.choices[0].message.content,
        headers: parsed?.headers
          ? Object.fromEntries(parsed.headers)
          : mail.commonHeaders,

        mailMetadata: mail,
        receiptMetadata: receipt,

        processed: true,
      });
      console.log("📩 Email stored:", mail.messageId);
      return res.status(200).send("Email processed");
    }

    return res.status(200).send("Ignored");
  } catch (error) {
    console.error("❌ SES inbound error:", error);
    return res.status(500).send("Internal error");
  }
});

export default router;
