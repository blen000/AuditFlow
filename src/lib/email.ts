import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

// strict env usage
if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST is required");
if (!process.env.SMTP_PORT) throw new Error("SMTP_PORT is required");
if (!process.env.SMTP_USER) throw new Error("SMTP_USER is required");
if (!process.env.SMTP_PASS) throw new Error("SMTP_PASS is required");
if (!process.env.SMTP_FROM) throw new Error("SMTP_FROM is required");

const port = parseInt(process.env.SMTP_PORT, 10);

// enforce ONLY 587
if (port !== 587) {
  throw new Error("Only SMTP_PORT=587 is allowed (STARTTLS mode)");
}

const smtpOptions = {
  host: process.env.SMTP_HOST,
  port,
  secure: false, // always false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_ALLOW_SELF_SIGNED !== "true",
  },
};

// ✅ create once
const transporter = nodemailer.createTransport(smtpOptions);

export const sendEmail = async (data: EmailPayload) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      ...data,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // ✅ don't swallow errors
  }
};