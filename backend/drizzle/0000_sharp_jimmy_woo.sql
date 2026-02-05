CREATE TABLE "raw_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ses_message_id" varchar(255) NOT NULL,
	"ses_receipt_rule" varchar(255),
	"from_email" varchar(320) NOT NULL,
	"to_email" text NOT NULL,
	"subject" text,
	"raw_email" text,
	"headers" jsonb,
	"mail_metadata" jsonb,
	"receipt_metadata" jsonb,
	"processed" boolean DEFAULT false,
	"processing_error" text,
	"spam" text,
	"received_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "raw_emails_ses_message_id_unique" UNIQUE("ses_message_id")
);
