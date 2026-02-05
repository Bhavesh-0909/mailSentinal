import {
  pgTable,
  uuid,
  text,
  varchar,
  jsonb,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const rawEmails = pgTable("raw_emails", {
  id: uuid("id").defaultRandom().primaryKey(),

  // SES metadata
  sesMessageId: varchar("ses_message_id", { length: 255 }).notNull().unique(),
  sesReceiptRule: varchar("ses_receipt_rule", { length: 255 }),

  // Email headers
  from: varchar("from_email", { length: 320 }).notNull(),
  to: text("to_email").notNull(), // comma-separated or JSON string
  subject: text("subject"),

  // Raw email content (MIME)
  rawEmail: text("raw_email"), // nullable if using S3

  // Parsed headers & metadata
  headers: jsonb("headers"), // commonHeaders, spam verdict, etc
  mailMetadata: jsonb("mail_metadata"), // SES mail object
  receiptMetadata: jsonb("receipt_metadata"), // SES receipt object

  // Processing flags
  processed: boolean("processed").default(false),
  processingError: text("processing_error"),
  spam: text("spam"),
  // Timestamps
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
