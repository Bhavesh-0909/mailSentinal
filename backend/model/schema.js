import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 100 }).notNull().unique(),

    passwordHash: text("password_hash").notNull(),

    isVerified: boolean("is_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
  })
);

export const mailboxes = pgTable(
  "mailboxes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 50 }).notNull(), // Inbox, Sent, Drafts, Trash

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userMailboxUnique: index("user_mailbox_unique_idx").on(
      table.userId,
      table.name
    ),
  })
);

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    senderId: uuid("sender_id")
      .references(() => users.id, { onDelete: "set null" }),

    subject: varchar("subject", { length: 255 }),
    body: text("body").notNull(),

    isRead: boolean("is_read").default(false).notNull(),
    isStarred: boolean("is_starred").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    senderIdx: index("emails_sender_idx").on(table.senderId),
  })
);

export const emailRecipients = pgTable(
  "email_recipients",
  {
    emailId: uuid("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" }),

    emailAddress: varchar("email_address", { length: 255 }).notNull(),

    type: varchar("type", { length: 3 }).notNull(), // TO, CC, BCC

    mailboxId: uuid("mailbox_id")
      .references(() => mailboxes.id, { onDelete: "cascade" }),

    isRead: boolean("is_read").default(false).notNull(),
  },
  (table) => ({
    pk: primaryKey(table.emailId, table.emailAddress, table.type),
  })
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    emailId: uuid("email_id")
      .notNull()
      .references(() => emails.id, { onDelete: "cascade" }),

    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileType: varchar("file_type", { length: 100 }),
    fileSize: integer("file_size").notNull(),
    fileUrl: text("file_url").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    token: text("token").notNull().unique(),
    type: varchar("type", { length: 20 }).notNull(), // VERIFY_EMAIL, RESET_PASSWORD

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);
