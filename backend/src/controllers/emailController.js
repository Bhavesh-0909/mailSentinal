import { db } from '../config/database.js';
import { emails, attachments } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { sendAndSaveEmail } from '../services/emailSender.js';

/**
 * Send email endpoint
 */
export const sendEmailHandler = async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const from = req.user.email;

    // Validation
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and body are required',
      });
    }

    // Process files from multer
    const files = req.files || [];

    // Send and save email
    const result = await sendAndSaveEmail({
      from,
      to,
      subject,
      body,
      files: files.map(f => ({
        buffer: f.buffer,
        originalname: f.originalname,
        mimetype: f.mimetype,
      })),
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        messageId: result.messageId,
        emailId: result.emailId,
      },
    });
  } catch (error) {
    console.error('Error in sendEmailHandler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
};

/**
 * Get inbox emails
 */
export const getInbox = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const inboxEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          eq(emails.recipientEmail, userEmail.toLowerCase()),
          eq(emails.folder, 'inbox')
        )
      )
      .orderBy(desc(emails.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        emails: inboxEmails,
        page,
        limit,
        total: inboxEmails.length,
      },
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inbox',
    });
  }
};

/**
 * Get sent emails
 */
export const getSent = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const sentEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          eq(emails.senderEmail, userEmail.toLowerCase()),
          eq(emails.folder, 'sent')
        )
      )
      .orderBy(desc(emails.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: {
        emails: sentEmails,
        page,
        limit,
        total: sentEmails.length,
      },
    });
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent emails',
    });
  }
};

/**
 * Get email by ID
 */
export const getEmailById = async (req, res) => {
  try {
    const emailId = parseInt(req.params.id);
    const userEmail = req.user.email.toLowerCase();

    // Get email
    const [email] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, emailId))
      .limit(1);

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    // Check if user has access to this email
    if (
      email.senderEmail !== userEmail &&
      email.recipientEmail !== userEmail
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this email',
      });
    }

    // Get attachments
    const emailAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.emailId, emailId));

    // Mark as read if in inbox
    if (email.recipientEmail === userEmail && !email.isRead) {
      await db
        .update(emails)
        .set({ isRead: true })
        .where(eq(emails.id, emailId));
    }

    res.json({
      success: true,
      data: {
        email: {
          ...email,
          isRead: email.recipientEmail === userEmail ? true : email.isRead,
        },
        attachments: emailAttachments,
      },
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email',
    });
  }
};