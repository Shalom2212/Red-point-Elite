export function successRoute(c) {
  // Dodo redirects here after checkout: /success?payment_id=pay_xxx
  const paymentId = c.req.query('payment_id') ?? '';
  const workerUrl = c.env.WORKER_URL ?? '';

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Red Point Pro — Activated</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0F0F0F;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .card{background:#151515;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:48px 40px;max-width:480px;width:100%;text-align:center}
  .icon{width:64px;height:64px;background:#FF3B30;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 24px}
  h1{font-size:22px;margin-bottom:8px}
  .sub{color:#888;font-size:14px;margin-bottom:32px}
  .key-box{background:#1a1a1a;border:2px dashed #2a2a2a;border-radius:12px;padding:20px;margin-bottom:20px;display:none}
  .key-label{color:#555;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
  .key-val{font-family:monospace;font-size:18px;font-weight:700;letter-spacing:3px;word-break:break-all}
  .copy{color:#FF3B30;font-size:12px;cursor:pointer;margin-top:10px;display:inline-block;background:none;border:none}
  .btn{display:block;width:100%;background:#FF3B30;color:#fff;border:none;padding:15px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;margin-bottom:10px;transition:opacity .15s}
  .btn:hover{opacity:.88}
  .btn-ghost{background:transparent;border:1px solid #2a2a2a;color:#666;font-size:13px;padding:12px;cursor:pointer}
  .spinner{display:inline-block;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .loader{color:#555;font-size:13px;margin-bottom:24px}
  .note{color:#444;font-size:12px;margin-top:16px;line-height:1.7}
</style>
</head>
<body>
<div class="card">
  <div class="icon" id="icon">⚡</div>
  <h1 id="title">Processing your order…</h1>
  <p class="sub" id="sub">Generating your license key</p>

  <div class="loader" id="loader"><span class="spinner">⟳</span> Please wait, this takes a moment…</div>

  <div class="key-box" id="keyBox">
    <div class="key-label">Your License Key</div>
    <div class="key-val" id="keyVal"></div>
    <button class="copy" onclick="copyKey()">Click to copy</button>
  </div>

  <button class="btn" id="activateBtn" style="display:none" onclick="activateExtension()">Activate Red Point Pro →</button>
  <button class="btn btn-ghost" id="manualBtn" style="display:none" onclick="this.style.display='none'">I'll enter it manually in settings</button>

  <p class="note" id="emailNote" style="display:none">
    A copy of your key has been sent to your email inbox.<br>
    Keep it safe — you'll need it if you reinstall Chrome.
  </p>
</div>

<script>
  const PAYMENT_ID = '${paymentId}';
  const BASE_URL   = '${workerUrl}';
  let licenseKey   = null;

  async function poll() {
    for (let i = 0; i < 15; i++) {
      try {
        const r = await fetch(BASE_URL + '/key?payment_id=' + encodeURIComponent(PAYMENT_ID));
        const d = await r.json();
        if (d.key) { showKey(d.key); return; }
      } catch (_) {}
      await new Promise(r => setTimeout(r, 2000));
    }
    // Timeout — webhook is slow, email is on the way
    document.getElementById('loader').style.display = 'none';
    document.getElementById('title').textContent    = 'Payment received!';
    document.getElementById('sub').textContent      = 'Your key is on its way — check your email inbox.';
  }

  function showKey(key) {
    licenseKey = key;
    document.getElementById('loader').style.display      = 'none';
    document.getElementById('title').textContent         = "You're Pro now! ⚡";
    document.getElementById('sub').textContent           = 'Your license key is ready';
    document.getElementById('keyBox').style.display      = 'block';
    document.getElementById('keyVal').textContent        = key;
    document.getElementById('activateBtn').style.display = 'block';
    document.getElementById('manualBtn').style.display   = 'block';
    document.getElementById('emailNote').style.display   = 'block';
  }

  function copyKey() {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey).then(() => {
      document.querySelector('.copy').textContent = 'Copied! ✓';
    });
  }

  function activateExtension() {
    if (!licenseKey) return;
    window.location.href = BASE_URL + '/activate?key=' + encodeURIComponent(licenseKey);
  }

  if (PAYMENT_ID) poll();
  else {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('title').textContent    = 'Invalid session';
  }
</script>
</body>
</html>`);
}
