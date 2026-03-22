import nodemailer, { Transporter } from 'nodemailer'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })
  }
  return transporter
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTPEmail(to: string, otp: string, name = 'there'): Promise<void> {
  await getTransporter().sendMail({
    from:    `"CodeReview AI" <${process.env.GMAIL_USER}>`,
    to,
    subject: `${otp} — Your verification code`,
    html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f172a;font-family:sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0"
  style="background:#1e293b;border-radius:16px;overflow:hidden;max-width:100%">
  <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #334155">
    <span style="font-size:22px;font-weight:800;color:#fff">⚡ CodeReview AI</span>
  </td></tr>
  <tr><td style="padding:32px 40px">
    <p style="color:#94a3b8;font-size:16px;margin:0 0 8px">Hi ${name},</p>
    <p style="color:#e2e8f0;font-size:16px;line-height:1.6;margin:0 0 32px">
      Use this code to verify your email. Expires in <strong style="color:#fff">10 minutes</strong>.
    </p>
    <div style="background:#0f172a;border:2px solid #3b82f6;border-radius:12px;
                padding:28px;text-align:center;margin-bottom:32px">
      <span style="font-size:48px;font-weight:900;letter-spacing:14px;
                   color:#60a5fa;font-family:'Courier New',monospace">${otp}</span>
    </div>
    <p style="color:#64748b;font-size:13px;margin:0">
      If you didn't request this, ignore this email.
    </p>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #334155;background:#0f172a">
    <p style="color:#475569;font-size:12px;margin:0;text-align:center">
      © ${new Date().getFullYear()} CodeReview AI
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  })
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await getTransporter().sendMail({
    from:    `"CodeReview AI" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Welcome to CodeReview AI 🎉',
    html: `
<body style="font-family:sans-serif;background:#0f172a;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px">
    <h1 style="color:#fff;font-size:24px;margin:0 0 16px">Welcome, ${name}! 🎉</h1>
    <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px">
      Connect your first GitHub repo to start getting AI code reviews on every PR.
    </p>
    <a href="${process.env.CLIENT_URL}/dashboard"
       style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;
              border-radius:8px;font-weight:700;text-decoration:none">
      Go to Dashboard →
    </a>
    <p style="color:#475569;font-size:12px;margin:32px 0 0">
      You're on the Free plan — 10 PR reviews/month.
    </p>
  </div>
</body>`,
  })
}

export async function sendPaymentConfirmEmail(to: string, name: string, plan: string): Promise<void> {
  await getTransporter().sendMail({
    from:    `"CodeReview AI" <${process.env.GMAIL_USER}>`,
    to,
    subject: `You're now on the ${plan} plan ✅`,
    html: `
<body style="font-family:sans-serif;background:#0f172a;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#1e293b;border-radius:16px;padding:40px">
    <h1 style="color:#fff;font-size:24px;margin:0 0 16px">Payment confirmed ✅</h1>
    <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px">
      Hi ${name}, your <strong style="color:#34d399">${plan}</strong> plan is now active.
      You have unlimited AI code reviews.
    </p>
    <a href="${process.env.CLIENT_URL}/dashboard"
       style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;
              border-radius:8px;font-weight:700;text-decoration:none">
      Go to Dashboard →
    </a>
  </div>
</body>`,
  })
}