import { transporter } from "./config/mailer.js";

async function testMail() {
  try {
    await transporter.sendMail({
      from: `"TaskPal" <${process.env.EMAIL_USER}>`,
      to: "jcsinoy91@gmail.com",
      subject: "✅ Gmail App Password Test",
      text: "If you see this, your Gmail App Password works!",
    });
    console.log("✅ Test email sent successfully!");
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
}

testMail();
