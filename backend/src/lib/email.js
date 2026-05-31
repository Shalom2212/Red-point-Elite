const PLAN_LABELS = { monthly: 'Monthly', annual: 'Annual', lifetime: 'Lifetime' };

export async function sendLicenseEmail(apiKey, { to, licenseKey, plan, activateUrl }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  body{margin:0;padding:40px 20px;background:#f0f0f0;font-family:system-ui,sans-serif}
  .wrap{max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .hdr{background:#0F0F0F;padding:40px;text-align:center}
  .dot{width:56px;height:56px;background:#FF3B30;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:56px}
  .hdr h1{color:#fff;margin:0 0 6px;font-size:22px}
  .hdr p{color:#666;margin:0;font-size:14px}
  .body{padding:36px}
  .key-box{background:#f7f7f7;border:2px dashed #ddd;border-radius:10px;padding:20px;margin:20px 0;text-align:center}
  .key-label{color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
  .key{font-family:monospace;font-size:20px;font-weight:700;letter-spacing:3px;color:#111}
  .btn{display:block;background:#FF3B30;color:#fff;text-decoration:none;padding:15px;border-radius:10px;font-weight:700;font-size:15px;text-align:center;margin:24px 0 12px}
  .note{color:#999;font-size:12px;text-align:center;line-height:1.7}
  .footer{background:#fafafa;padding:20px 36px;text-align:center;border-top:1px solid #eee;color:#bbb;font-size:11px}
</style></head>
<body>
<div class="wrap">
  <div class="hdr">
    <div class="dot">⚡</div>
    <h1>You're Red Point Pro now</h1>
    <p>${PLAN_LABELS[plan] ?? 'Pro'} plan · Thank you for upgrading</p>
  </div>
  <div class="body">
    <p style="color:#444;margin:0 0 4px;font-size:14px">Your license key:</p>
    <div class="key-box">
      <div class="key-label">License Key</div>
      <div class="key">${licenseKey}</div>
    </div>
    <p style="color:#777;font-size:13px;margin:0 0 20px">
      Keep this email — you'll need the key to activate on other devices or after reinstalling.
    </p>
    <a href="${activateUrl}" class="btn">Activate Red Point Pro →</a>
    <p class="note">
      Button not working? Open the extension, click ⚙ Settings,<br>
      and paste the key in the <strong>License Key</strong> field.
    </p>
  </div>
  <div class="footer">
    Red Point Elite · <a href="mailto:support@redpointelite.com" style="color:#FF3B30">support@redpointelite.com</a>
  </div>
</div>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Red Point Elite <noreply@redpointelite.com>',
      to: [to],
      subject: '⚡ Your Red Point Pro license key is ready',
      html,
    }),
  });

  if (!res.ok) throw new Error(`Resend: ${await res.text()}`);
}
