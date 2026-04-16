const nodemailer = require('nodemailer');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GMAIL_USER = process.env.GMAIL_USER || 'mesappsheet@gmail.com';
  const GMAIL_PASS = process.env.GMAIL_PASS;

  if (!GMAIL_PASS) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GMAIL_PASS non configuré dans les variables d\'environnement Netlify' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  const { to, subject, html } = payload;
  if (!to || !subject || !html) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Champs manquants: to, subject, html' }) };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  try {
    await transporter.sendMail({
      from: `PorteFin Rapport <${GMAIL_USER}>`,
      to,
      subject,
      html
    });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
