const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.error('❌ GMAIL credentials missing in environment variables!');
    console.log('GMAIL_USER found:', !!process.env.GMAIL_USER);
    console.log('GMAIL_PASS found:', !!process.env.GMAIL_PASS);
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const message = {
    from: `Schedulify <${process.env.GMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  try {
    await transporter.sendMail(message);
    console.log('✅ Email sent successfully to:', options.email);
  } catch (error) {
    console.error('❌ Nodemailer Error:', error);
    throw error;
  }
};

module.exports = sendEmail;
