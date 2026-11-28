const nodemailer = require('nodemailer');

const configured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

// The first address in CLIENT_URL is used for links inside emails
const clientUrl = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

// Sends an email. Without SMTP settings, the email is printed in the backend terminal
// instead (development only), so you can test password reset without an email account.
async function sendMail({ to, subject, text, html }) {
  if (!configured()) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Email is not configured (SMTP_* settings are missing). Could not send to', to);
    } else {
      console.log(`\n[email not configured: printing instead of sending]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    }
    return false;
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return true;
}

module.exports = { sendMail, clientUrl, mailConfigured: configured };
