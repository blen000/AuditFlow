import nodemailer from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

// --------------------
// ENV VALIDATION
// --------------------
if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST is required");
if (!process.env.SMTP_PORT) throw new Error("SMTP_PORT is required");
if (!process.env.SMTP_USER) throw new Error("SMTP_USER is required");
if (!process.env.SMTP_PASS) throw new Error("SMTP_PASS is required");
if (!process.env.SMTP_FROM) throw new Error("SMTP_FROM is required");

const port = parseInt(process.env.SMTP_PORT, 10);

if (port !== 587) {
  throw new Error("Only SMTP_PORT=587 is allowed (STARTTLS mode)");
}

// --------------------
// TRANSPORTER
// --------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
  },
});

// --------------------
// VERIFY CONNECTION (RUN ON STARTUP)
// --------------------
export const verifySMTP = async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful");
  } catch (err) {
    console.error("❌ SMTP verification failed:", err);
  }
};

// --------------------
// SEND EMAIL
// --------------------
export const sendEmail = async (data: EmailPayload) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      ...data,
    });

    console.log("📧 Email sent:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};