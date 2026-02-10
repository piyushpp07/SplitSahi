import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testSMTP() {
    console.log('🧪 Testing SMTP Configuration...\n');

    console.log('Configuration:');
    console.log(`  Host: ${process.env.SMTP_HOST}`);
    console.log(`  Port: ${process.env.SMTP_PORT}`);
    console.log(`  Secure: ${process.env.SMTP_SECURE}`);
    console.log(`  User: ${process.env.SMTP_USER}`);
    console.log(`  Pass: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}\n`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: "fwwdukjekbkeltmv",
        },
    });

    try {
        console.log('📧 Verifying transporter...');
        await transporter.verify();
        console.log('✅ Transporter verified successfully!\n');

        console.log('📨 Sending test email...');
        const testCode = '123456';
        const info = await transporter.sendMail({
            from: `"SplitSahiSe Test" <${process.env.SMTP_USER}>`,
            to: "piyushpar7@gmail.com", // Send to self for testing
            subject: 'SMTP Test - SplitSahiSe',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #059669; text-align: center;">✅ SMTP Test Successful!</h2>
          <p>Your SMTP configuration is working correctly.</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${testCode}</span>
          </div>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Host: ${process.env.SMTP_HOST}</li>
            <li>Port: ${process.env.SMTP_PORT}</li>
            <li>User: ${process.env.SMTP_USER}</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">SplitSahiSe - Test Email</p>
        </div>
      `,
        });

        console.log('✅ Test email sent successfully!');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info) || 'N/A'}\n`);

        console.log('🎉 SMTP is configured correctly and working!');
    } catch (error) {
        console.error('❌ SMTP Test Failed:\n', error);

        if (error instanceof Error) {
            console.log('\n💡 Common Issues:');
            if (error.message.includes('authentication')) {
                console.log('   - Check your SMTP_USER and SMTP_PASS credentials');
                console.log('   - For Gmail: Enable "App Passwords" in your Google Account');
                console.log('   - Visit: https://myaccount.google.com/apppasswords');
            } else if (error.message.includes('connect')) {
                console.log('   - Check your SMTP_HOST and SMTP_PORT settings');
                console.log('   - Ensure your network allows SMTP connections');
            }
        }
    }
}

testSMTP();
