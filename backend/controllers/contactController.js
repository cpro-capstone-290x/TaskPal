import nodemailer from "nodemailer";

//  sendContactMessage — sends email to TaskPal support
export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

    // Placeholder support email — replace later
    const SUPPORT_EMAIL = "support_placeholder@taskpal.ca";

    //  Configure mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // can change to Outlook/SMTP later
      auth: {
        user: "placeholder.taskpal@gmail.com", // your support email
        pass: "placeholder-password", // app password (not your real password)
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
