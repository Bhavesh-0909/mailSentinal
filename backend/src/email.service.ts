import nodemailer, { Transporter } from "nodemailer";

export const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST as string,
  port: Number(process.env.SES_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SES_SMTP_USER as string,
    pass: process.env.SES_SMTP_PASS as string,
  },
});
