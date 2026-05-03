import nodemailer from "nodemailer";
import "dotenv/config";

export const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to,
    subject,
    html,
  });
};
