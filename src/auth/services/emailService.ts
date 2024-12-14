import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <a href="${resetUrl}" style="
      display: inline-block;
      padding: 10px 20px;
      background-color: #1976d2;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    ">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p style="color: #666; font-size: 12px; margin-top: 20px;">
      This is an automated email, please do not reply.
    </p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Password Reset Request',
    html
  });
}; 