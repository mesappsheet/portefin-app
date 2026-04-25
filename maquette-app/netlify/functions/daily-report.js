const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const SB_URL = 'https://lkuwgggwdtbzjgplwylr.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdXdnZ2d3ZHRiempncGx3eWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDgxMDQsImV4cCI6MjA4OTA4NDEwNH0.YPqCCqhhVvu9iJXqwUP57A-u8mBFf4nARtSyGmCxfgo';
const TOKEN = 'A_0fNf0fC9NLelmybDwCPvMKhz-P1A5N';
const BASE_URL = 'https://portefin-app-mobile.netlify.app';
const TO = 'mesappsheet@gmail.com';

function fmtAmount(v) {
  if (v == null) return '—';
  const n = parseInt(parseFloat(v));
  return isNaN(n) ? String(v) : n.toLocaleString('fr-FR') + ' FCFA';
}

function fmtDate(d) {
  if (!d) return '—';
  try {
    const [y, m, day] = String(d).split('-');
    return `${day}/${m}/${y}`;
  } catch { return String(d); }
}

function cleanPhone(p) {
  if (!p) return null;
  const s = String(p).replace(/\s+/g, '').replace(/[^\d+]/g, '');
  const r = s.startsWith('+') ? s.slice(1) : s;
  return r.length >= 8 ? r : null;
}

function waBtn(phone, name, date) {
  const p = cleanPhone(phone);
  if (!p) return '—';
  const msg = encodeURIComponent(
    `Bonjour ${name}, comment vous allez ?\nJe voudrais juste vous rappeler que le paiement de votre échéance est prévu pour le ${fmtDate(date)}.\nBonne journée !\n\nChargé de Prêt : DJOSSOU Codjo`
  );
  return `<a href="https://wa.me/${p}?text=${msg}" style="display:inline-block;padding:6px 14px;background:#25D366;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700">WhatsApp</a>`;
}

function payBtn(id) {
  return `<a href="${BASE_URL}/.netlify/functions/mark-paid?id=${id}&token=${TOKEN}" style="display:inline-block;padding:6px 14px;background:#057a55;color:white;border-radius:8px;text-decoration:none;font-size:12px;font-weight:700">✓ Marquer payé</a>`;
}

function tableA(rows) {
  if (!rows.length) return '<p style="color:#666">Aucun remboursement prévu aujourd\'hui.</p>';
  let h = `<table style="border-collapse:collapse;width:100%;font-size:14px">
    <tr style="background:#e8f0fe">
      <th style="padding:10px;border:1px solid #ddd;text-align:left">Client</th>
      <th style="padding:10px;border:1px solid #ddd">Date échéance</th>
      <th style="padding:10px;border:1px solid #ddd">Téléphone</th>
      <th style="padding:10px;border:1px solid #ddd">WhatsApp</th>
      <th style="padding:10px;border:1px solid #ddd">Action</th>
    </tr>`;
  for (const r of rows) {
    h += `<tr>
      <td style="padding:10px;border:1px solid #ddd">${r.client_name}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center">${fmtDate(r.scheduled_date)}</td>
      <td style="padding:10px;border:1px solid #ddd">${r.phone || '—'}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center">${waBtn(r.phone, r.client_name, r.scheduled_date)}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center">${payBtn(r.id)}</td>
    </tr>`;
  }
  return h + '</table>';
}

function tableB(rows) {
  if (!rows.length) return '<p style="color:#666">Aucun crédit en fin de contrat cette semaine.</p>';
  let h = `<table style="border-collapse:collapse;width:100%;font-size:14px">
    <tr style="background:#e6f4ea">
      <th style="padding:10px;border:1px solid #ddd;text-align:left">Client</th>
      <th style="padding:10px;border:1px solid #ddd">Montant crédit</th>
      <th style="padding:10px;border:1px solid #ddd">Fin contrat</th>
      <th style="padding:10px;border:1px solid #ddd">Téléphone</th>
    </tr>`;
  for (const r of rows) {
    h += `<tr>
      <td style="padding:10px;border:1px solid #ddd">${r.client_name}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:right">${fmtAmount(r.amount)}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center">${fmtDate(r.end_date)}</td>
      <td style="padding:10px;border:1px solid #ddd">${r.phone || '—'}</td>
    </tr>`;
  }
  return h + '</table>';
}

function tableC(rows) {
  if (!rows.length) return '<p style="color:#666">Aucun impayé.</p>';
  let h = `<table style="border-collapse:collapse;width:100%;font-size:14px">
    <tr style="background:#fce8e8">
      <th style="padding:10px;border:1px solid #ddd;text-align:left">Client</th>
      <th style="padding:10px;border:1px solid #ddd">Téléphone</th>
      <th style="padding:10px;border:1px solid #ddd">Date échéance</th>
      <th style="padding:10px;border:1px solid #ddd">Montant dû</th>
    </tr>`;
  for (const r of rows) {
    h += `<tr>
      <td style="padding:10px;border:1px solid #ddd">${r.client_name}</td>
      <td style="padding:10px;border:1px solid #ddd">${r.phone || '—'}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:center">${fmtDate(r.scheduled_date)}</td>
      <td style="padding:10px;border:1px solid #ddd;text-align:right;color:#c00;font-weight:bold">${fmtAmount(r.amount)}</td>
    </tr>`;
  }
  return h + '</table>';
}

exports.handler = async function(event) {
  // Sécurité : token requis
  const params = event.queryStringParameters || {};
  if (params.token !== TOKEN) {
    return { statusCode: 403, body: 'Accès refusé' };
  }

  const sb = createClient(SB_URL, SB_KEY);
  const today = new Date().toISOString().split('T')[0];
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [resA, resB, resC] = await Promise.all([
    sb.from('repayments').select('id, scheduled_date, credits!inner(client_name, phone, health)')
      .eq('scheduled_date', today).eq('is_paid', false).neq('credits.health', 'Souffrance'),
    sb.from('credits').select('client_name, phone, amount, end_date')
      .gte('end_date', today).lte('end_date', in7days).not('status', 'in', '("Soldé","Annulé")'),
    sb.from('repayments').select('scheduled_date, amount, credits!inner(client_name, phone, health)')
      .lt('scheduled_date', today).eq('is_paid', false).neq('credits.health', 'Souffrance')
  ]);

  const rowsA = (resA.data || []).map(r => ({
    id: r.id,
    scheduled_date: r.scheduled_date,
    client_name: r.credits?.client_name || '—',
    phone: r.credits?.phone || ''
  })).sort((a, b) => a.client_name.localeCompare(b.client_name));

  const rowsB = resB.data || [];

  const rowsC = (resC.data || []).map(r => ({
    scheduled_date: r.scheduled_date,
    amount: r.amount,
    client_name: r.credits?.client_name || '—',
    phone: r.credits?.phone || ''
  })).sort((a, b) => a.client_name.localeCompare(b.client_name) || a.scheduled_date.localeCompare(b.scheduled_date));

  const d = new Date();
  const todayFr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  const heure = `${String(d.getUTCHours()+1).padStart(2,'0')}h${String(d.getUTCMinutes()).padStart(2,'0')}`;

  const html = `
<div style="font-family:Arial,sans-serif;max-width:750px;margin:auto;color:#222">
  <div style="background:linear-gradient(135deg,#f27f0d,#c96a00);padding:20px 24px;border-radius:12px 12px 0 0">
    <h2 style="color:white;margin:0;font-size:20px">PorteFin — Rapport du ${todayFr}</h2>
    <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:13px">Généré à ${heure} (Porto-Novo)</p>
  </div>
  <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px">
    <h3 style="color:#1a56db;margin-top:0">📅 Remboursements du jour — ${rowsA.length} client(s)</h3>
    ${tableA(rowsA)}
    <h3 style="color:#057a55;margin-top:28px">⏳ Fins de contrat cette semaine — ${rowsB.length} dossier(s)</h3>
    ${tableB(rowsB)}
    <h3 style="color:#c00;margin-top:28px">🔴 Impayés en cours — ${rowsC.length} échéance(s)</h3>
    ${tableC(rowsC)}
  </div>
</div>`;

  const GMAIL_USER = process.env.GMAIL_USER || 'mesappsheet@gmail.com';
  const GMAIL_PASS = process.env.GMAIL_PASS;

  if (!GMAIL_PASS) {
    return { statusCode: 500, body: 'GMAIL_PASS manquant' };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS }
  });

  await transporter.sendMail({
    from: `PorteFin Rapport <${GMAIL_USER}>`,
    to: TO,
    subject: `PorteFin - Rapport du ${todayFr} à ${heure}`,
    html
  });

  return { statusCode: 200, body: JSON.stringify({ success: true, rowsA: rowsA.length, rowsB: rowsB.length, rowsC: rowsC.length }) };
};
