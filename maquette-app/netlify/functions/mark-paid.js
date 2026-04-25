const { createClient } = require('@supabase/supabase-js');

const SB_URL = 'https://lkuwgggwdtbzjgplwylr.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdXdnZ2d3ZHRiempncGx3eWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDgxMDQsImV4cCI6MjA4OTA4NDEwNH0.YPqCCqhhVvu9iJXqwUP57A-u8mBFf4nARtSyGmCxfgo';
const TOKEN  = process.env.MARK_PAID_TOKEN;

exports.handler = async function(event) {
  const { id, token } = event.queryStringParameters || {};

  // Vérification token
  if (!TOKEN || token !== TOKEN) {
    return html(403, 'Accès refusé', 'Lien invalide ou expiré.', '#c00');
  }

  if (!id) {
    return html(400, 'Erreur', 'Identifiant d\'échéance manquant.', '#c00');
  }

  const sb = createClient(SB_URL, SB_KEY);

  // Vérifier que l'échéance existe et n'est pas déjà payée
  const { data: rep, error: fetchErr } = await sb
    .from('repayments')
    .select('id, is_paid, scheduled_date, credits(client_name)')
    .eq('id', id)
    .single();

  if (fetchErr || !rep) {
    return html(404, 'Introuvable', 'Cette échéance n\'existe pas.', '#c00');
  }

  if (rep.is_paid) {
    const name = rep.credits?.client_name || 'Client';
    return html(200, 'Déjà enregistré', `Le paiement de <strong>${name}</strong> du ${rep.scheduled_date} est déjà marqué comme payé.`, '#057a55');
  }

  // Marquer payé
  const today = new Date().toISOString().split('T')[0];
  const { error: updateErr } = await sb
    .from('repayments')
    .update({ is_paid: true, actual_payment_date: today, status: 'Payé' })
    .eq('id', id);

  if (updateErr) {
    return html(500, 'Erreur', 'Impossible d\'enregistrer le paiement : ' + updateErr.message, '#c00');
  }

  const name = rep.credits?.client_name || 'Client';
  return html(200, 'Paiement enregistré', `Le paiement de <strong>${name}</strong> du ${rep.scheduled_date} a été marqué comme <strong>payé</strong> avec succès.`, '#057a55');
};

function html(status, title, message, color) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PorteFin — ${title}</title>
<style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:white;border-radius:16px;padding:40px 32px;max-width:420px;width:90%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.1)}
  .icon{font-size:48px;margin-bottom:16px}
  h2{color:${color};margin:0 0 12px}
  p{color:#555;line-height:1.6}
  .badge{display:inline-block;background:${color};color:white;padding:6px 16px;border-radius:99px;font-size:13px;font-weight:700;margin-top:20px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">${status === 200 ? '✅' : '❌'}</div>
  <h2>${title}</h2>
  <p>${message}</p>
  <div class="badge">PorteFin</div>
</div>
</body>
</html>`
  };
}
