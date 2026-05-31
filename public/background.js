// ─── Config ───────────────────────────────────────────────────────────────────
// Keep in sync with src/config.js
const BACKEND_URL    = 'https://red-point-backend.YOUR_SUBDOMAIN.workers.dev';
const ACTIVATE_HOST  = 'red-point-backend.YOUR_SUBDOMAIN.workers.dev';
const ACTIVATE_PATH  = '/activate';

// ─── License activation ───────────────────────────────────────────────────────
async function validateAndActivate(key, tabId) {
  try {
    const res  = await fetch(`${BACKEND_URL}/validate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ key }),
    });
    const data = await res.json();

    if (data.valid) {
      await chrome.storage.sync.set({
        rp_license: {
          key,
          plan:        data.plan,
          validUntil:  data.validUntil,
          validatedAt: new Date().toISOString(),
        },
      });

      chrome.notifications.create('rp-pro-activated', {
        type:    'basic',
        iconUrl: 'icons/icon48.png',
        title:   'Red Point Pro Activated ⚡',
        message: `${capitalise(data.plan)} plan is now active. Enjoy full speed!`,
      });

      // Close the activate tab after a short delay so the page can show its message
      if (tabId) setTimeout(() => chrome.tabs.remove(tabId).catch(() => {}), 2000);
    }
  } catch (err) {
    console.error('[RedPoint] Activation error:', err);
  }
}

// Watch for the /activate URL opened from the success page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  try {
    const url = new URL(tab.url);
    if (url.hostname === ACTIVATE_HOST && url.pathname === ACTIVATE_PATH) {
      const key = url.searchParams.get('key');
      if (key && key.startsWith('RPRO-')) {
        validateAndActivate(key, tabId);
      }
    }
  } catch (_) {}
});

// ─── Context menu ─────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id:       'read-with-red-point',
    title:    'Read with Red Point Elite',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'read-with-red-point' && info.selectionText) {
    safeSend(tab.id, { action: 'START_RSVP', text: info.selectionText });
  }
});

chrome.action.onClicked.addListener(tab => {
  safeSend(tab.id, { action: 'EXTRACT_AND_START' });
});

// ─── Safe message passing with dynamic injection fallback ─────────────────────
function safeSend(tabId, message) {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] }).catch(() => {});
    chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }, () => {
      setTimeout(() => chrome.tabs.sendMessage(tabId, message).catch(console.error), 100);
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const capitalise = s => s.charAt(0).toUpperCase() + s.slice(1);
