const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured — emails will be logged to console');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    family: 4,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  // Verify SMTP connection on first creation (non-blocking)
  transporter.verify().then(() => {
    console.log('[Email] SMTP connection verified — ready to send emails');
  }).catch(err => {
    console.error('[Email] SMTP verification FAILED:', err.message);
    console.error('[Email] Code:', err.code, '| Host:', process.env.SMTP_HOST, '| Port:', process.env.SMTP_PORT, '| User:', process.env.SMTP_USER);
  });
  return transporter;
}

async function sendMail(to, subject, html) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] SMTP not configured — skipping email`);
    console.log(`[Email] TO: ${to} | SUBJECT: ${subject}`);
    console.log(`[Email] BODY: ${html.replace(/<[^>]*>/g, ' ').substring(0, 300)}`);
    return;
  }
  try {
    console.log(`[Email] Sending to: ${to} | Subject: ${subject}`);
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || 'SecondChance <noreply@secondchance.app>',
      to,
      subject,
      html,
    });
    console.log(`[Email] SUCCESS — messageId: ${info.messageId} | to: ${to}`);
  } catch (err) {
    console.error(`[Email] FAILED — to: ${to} | error: ${err.message}`);
    console.error(`[Email] Code: ${err.code} | Command: ${err.command || 'N/A'}`);
    throw err;
  }
}

exports.sendAcquaintanceCredentials = async (toEmail, { password, addictName, role }) => {
  const subject = `SecondChance — You've been added as a recovery support contact`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f8fcf4;border-radius:16px;">
      <h2 style="color:#7D9C6D;margin-bottom:8px;">SecondChance Recovery Support</h2>
      <p>Hi there,</p>
      <p><strong>${addictName}</strong> has added you as their <strong>${role}</strong> in their recovery journey on SecondChance.</p>
      <p>An account has been created for you so you can monitor their progress and be there when they need support.</p>
      <div style="background:#fff;border:2px solid #D9ECA2;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#666;">Your login credentials:</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${toEmail}</p>
        <p style="margin:4px 0;"><strong>Password:</strong> ${password}</p>
        <p style="margin:12px 0 0;font-size:12px;color:#999;">Please change your password after first login.</p>
      </div>
      <p>Login at: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'http://localhost:5173'}</a></p>
      <p style="color:#999;font-size:12px;margin-top:24px;">This is an automated message from SecondChance.</p>
    </div>
  `;
  await sendMail(toEmail, subject, html);
};

exports.sendCopingNotification = async (toEmail, { addictName }) => {
  const subject = `SecondChance Alert — ${addictName} needs support`;
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff5f5;border-radius:16px;">
      <h2 style="color:#B25349;margin-bottom:8px;">Coping Alert</h2>
      <p><strong>${addictName}</strong> has just activated the <strong>Coping Now</strong> feature, which means they may be experiencing a craving or difficult moment.</p>
      <p>As their ${addictName}'s support contact, consider reaching out to check in on them.</p>
      <p style="margin-top:16px;">You can also log in to your dashboard to see their current status:</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;background:#7D9C6D;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:8px;">Open Dashboard</a>
      <p style="color:#999;font-size:12px;margin-top:24px;">This is an automated alert from SecondChance.</p>
    </div>
  `;
  await sendMail(toEmail, subject, html);
};
