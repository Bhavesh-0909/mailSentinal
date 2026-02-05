import { transporter } from "./email.service.js";

export interface SendMailParams {
  fromEmail: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendMail({
  fromEmail,
  to,
  subject,
  html,
  text,
}: SendMailParams): Promise<void> {
  await transporter.sendMail({
    from: `"My App" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });
}
