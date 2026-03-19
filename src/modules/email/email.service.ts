import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (to: string, code: string) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="margin:0 0 0 0;color:#1a3326;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Verify your email address</h1>
        <p>Your verification code is:</p>
        <div style="background-color: #f0ede4; border: 2px dashed #2D6A4F; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="margin:0;color:#2d5c3e;font-size:40px;font-weight:700;letter-spacing:14px;font-family:'Courier New',monospace;">${code}</p>
        </div>
        <div style="margin-top: 0px;background-color:#fff8e7;border-left:3px solid #e8a020;border-radius:0 8px 8px 0;padding:11px 14px;">
          <p style="margin:0;color:#7a5c10;font-size:13px;">⏱ This code expires in <strong>1 hour</strong></p>
        </div>
        <p style="color:#a0a89e;font-size:12px;line-height:1.6;">
          If you didn't create an account, you can safely ignore this email. No action is required.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Email Verification Code',
      html,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
    }

    throw new Error('Failed to send verification email');
  }
};

export const sendPasswordResetCode = async (to: string, code: string) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="margin:0 0 0 0;color:#1a3326;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Password Reset Request</h1>
        <p>We received a request to reset the password for your account. Enter the code below to proceed:</p>
        <div style="background-color: #f0ede4; border: 2px dashed #2D6A4F; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="margin:0;color:#2d5c3e;font-size:40px;font-weight:700;letter-spacing:14px;font-family:'Courier New',monospace;">${code}</p>
        </div>
        <div style="margin-top: 0px;background-color:#fff8e7;border-left:3px solid #e8a020;border-radius:0 8px 8px 0;padding:11px 14px;">
          <p style="margin:0;color:#7a5c10;font-size:13px;">⏱ This code expires in <strong>1 hour</strong></p>
        </div>
        <p style="color:#a0a89e;font-size:12px;line-height:1.6;">
          If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
        </p>
      </div>
    `;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Your Password Reset Code',
      html,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
    }
    throw new Error('Failed to send password reset email');
  }
};
