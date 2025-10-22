import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

//  sendContactMessage — sends email to TaskPal support
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
    const SUPPORT_PASS = process.env.SUPPORT_PASS;
    const SUPPORT_USER = process.env.SUPPORT_USER;
    

    //  Configure mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // can change to Outlook/SMTP later
      auth: {
        user: SUPPORT_USER,
        pass: SUPPORT_PASS,
      },
    });

    //  Compose the email
    const mailOptions = {
      from: `"TaskPal Contact" <${email}>`,
      to: SUPPORT_EMAIL,
      subject: `New message from ${name}`,
      text: message,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📩 Message received from ${name} <${email}>`);
    res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("❌ Error sending contact message:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to send message. Please try again." });
  }
};
