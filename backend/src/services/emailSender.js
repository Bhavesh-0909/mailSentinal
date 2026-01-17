import nodemailer from 'nodemailer';
import { smtpConfig } from '../config/smtp.js';
import { db } from '../config/database.js';
import { emails } from '../db/schema.js';
import { processAttachments } from './attachmentService.js';

// Create reusable transporter
const transporter = nodemailer.createTransport(smtpConfig);

/**
 * Send email via SMTP
 */
export const sendEmail = async ({ from, to, subject, body, attachments: files }) => {
  try {
    // Prepare attachments for nodemailer
    const mailAttachments = files && files.length > 0
      ? files.map(file => ({
          filename: file.originalname || file.filename,
          content: file.buffer,
          contentType: file.mimetype || file.contentType,
        }))
      : [];

    // Send email
    const info = await transporter.sendMail({
      from: from || process.env.SMTP_USER,
      to,
      subject,
      text: body,
      html: `<div style="white-space: pre-wrap;">${body}</div>`,
      attachments: mailAttachments,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Save sent email to database
 */
export const saveSentEmail = async (senderEmail, recipientEmail, subject, body, files) => {
  try {
    // Insert email record
    const [emailRecord] = await db
      .insert(emails)
      .values({
        senderEmail: senderEmail.toLowerCase(),
        recipientEmail: recipientEmail.toLowerCase(),
        subject,
        body,
        folder: 'sent',
        isRead: true, // Sent emails are always "read"
      })
      .returning();

    // Process and save attachments if any
    if (files && files.length > 0) {
      await processAttachments(emailRecord.id, files);
    }

    return emailRecord;
  } catch (error) {
    console.error('Error saving sent email:', error);
    throw error;
  }
};

/**
 * Send and save email
 */
export const sendAndSaveEmail = async (userData) => {
  const { from, to, subject, body, files } = userData;

  // Send email via SMTP
  const sentInfo = await sendEmail({ from, to, subject, body, attachments: files });

  // Save to database
  const savedEmail = await saveSentEmail(from, to, subject, body, files);

  return {
    messageId: sentInfo.messageId,
    emailId: savedEmail.id,
  };
};