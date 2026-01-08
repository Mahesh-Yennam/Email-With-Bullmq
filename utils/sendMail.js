import { Resend } from "resend";
import html from './messagebody.js'

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (to, subject, message) => {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html: html(message),
    });
    console.log("Email sent");
  } catch (err) {
    console.error("Error sending email:", err.message);
    throw err;
  }
};

export default sendMail;
