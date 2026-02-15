import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    console.log("SMTP_USER:", user);
    console.log("SMTP_PASS:", pass ? "******" : "MISSING");

    if (!user || !pass) {
        console.error("Missing SMTP credentials");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });

    try {
        const info = await transporter.sendMail({
            from: `SplitItUp <${user}>`,
            to: "piyushpar7@gmail.com",
            subject: "Test Email from SplitItUp",
            text: "This is a test email to verify Nodemailer configuration.",
        });
        console.log("Email sent:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

testEmail();
