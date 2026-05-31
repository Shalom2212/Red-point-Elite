// This page is opened by the "Activate" button on the success page.
// background.js intercepts tabs loading this URL, validates the key,
// saves it to chrome.storage.sync, and closes this tab automatically.
// If the extension isn't installed, we show a manual fallback.
export function activateRoute(c) {
  const key = c.req.query('key') ?? '';

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Activating Red Point Pro…</title>
<style>
  body{background:#0F0F0F;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}
  .icon{font-size:52px;margin-bottom:20px}
  h1{font-size:22px;margin-bottom:10px}
  p{color:#555;font-size:14px;line-height:1.7}
  .key{font-family:monospace;color:#FF3B30;font-size:15px;font-weight:700;letter-spacing:2px}
  .spinner{display:inline-block;animation:spin 1s linear infinite;margin-right:6px}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div>
  <div class="icon" id="icon">⚡</div>
  <h1 id="title"><span class="spinner">⟳</span> Activating…</h1>
  <p id="msg">The Red Point extension is handling this automatically.</p>
  <p id="manual" style="display:none;margin-top:20px">
    Extension not detected. Open the extension, click ⚙ Settings,<br>
    and paste this key in the <strong>License Key</strong> field:<br><br>
    <span class="key">${key}</span>
  </p>
</div>
<script>
  // Extension background.js intercepts this page and closes the tab.
  // If still open after 5s, show manual instructions.
  setTimeout(() => {
    document.getElementById('title').textContent = 'Activation complete!';
    document.getElementById('msg').textContent   = 'You can close this tab and start reading.';
  }, 1800);

  setTimeout(() => {
    document.getElementById('manual').style.display = 'block';
  }, 5000);
</script>
</body>
</html>`);
}
