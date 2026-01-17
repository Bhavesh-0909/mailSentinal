import { pgTable, serial, text, varchar, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Emails Table
export const emails = pgTable('emails', {
  id: serial('id').primaryKey(),
  senderEmail: varchar('sender_email', { length: 255 }).notNull(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  subject: text('subject'),
  body: text('body'),
  isRead: boolean('is_read').default(false).notNull(),
  folder: varchar('folder', { length: 50 }).notNull(), // 'inbox', 'sent', 'drafts'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Attachments Table
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  emailId: integer('email_id').notNull().references(() => emails.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 100 }),
  fileSize: integer('file_size'), // in bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
});