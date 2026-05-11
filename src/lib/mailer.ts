const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';

import { getLoginCredentialsEmailTemplate } from './emailTemplates';

export async function sendTemporaryPasswordEmail(to: string, tempPassword: string) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured — skipping email send. Temporary password:', tempPassword);
    return false;
  }

  try {
    // dynamically import nodemailer so build doesn't fail if package isn't installed
    const mod = await import('nodemailer').catch((e) => {
      console.warn('nodemailer not available:', e);
      return null;
    });
    if (!mod) {
      console.warn('nodemailer not installed — temporary password:', tempPassword);
      return false;
    }
    const nodemailer = (mod as any).default || mod;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const loginUrl = process.env.LOGIN_URL || 'https://nibaudit.nibbank.com.et';
    const html = getLoginCredentialsEmailTemplate(to, tempPassword, loginUrl);

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: 'Your NIB Audit Platform login credentials',
      text: `Your temporary password: ${tempPassword}\nPlease log in at ${loginUrl} and change your password.`,
      html,
    });

    console.info('Sent temp password email:', info?.messageId ?? info);
    return true;
  } catch (err) {
    console.error('Failed to send temp password email:', err);
    return false;
  }
}
