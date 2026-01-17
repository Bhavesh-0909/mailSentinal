import dotenv from 'dotenv';

dotenv.config();

export const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT_SEND || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const smtpServerConfig = {
  port: parseInt(process.env.SMTP_PORT || '2525'),
  authOptional: true,
  disabledCommands: ['AUTH'],
  onAuth(auth, session, callback) {
    callback(null, { user: 'anonymous' });
  },
};