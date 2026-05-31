import { useState, useCallback } from 'react';
import { BACKEND_URL } from '../config.js';

const today = () => new Date().toISOString().split('T')[0];
const REVALIDATE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

// ─── Trial ────────────────────────────────────────────────────────────────────
function getInstallDate() {
  let d = localStorage.getItem('rp_install_date');
  if (!d) {
    d = new Date().toISOString();
    localStorage.setItem('rp_install_date', d);
  }
  return new Date(d);
}

export function getTrialStatus() {
  const daysSince = (Date.now() - getInstallDate().getTime()) / 86400000;
  const daysLeft  = Math.max(0, Math.ceil(3 - daysSince));
  return { isTrialActive: daysLeft > 0, daysLeft };
}

// ─── License storage helpers ──────────────────────────────────────────────────
async function readStoredLicense() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      const r = await chrome.storage.sync.get('rp_license');
      return r.rp_license ?? null;
    }
  } catch { /* fall through */ }
  return loadJson('rp_license', null);
}

async function writeStoredLicense(lic) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.set({ rp_license: lic });
      return;
    }
  } catch { /* fall through */ }
  localStorage.setItem('rp_license', JSON.stringify(lic));
}

async function clearStoredLicense() {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.remove('rp_license');
      return;
    }
  } catch { /* fall through */ }
  localStorage.removeItem('rp_license');
}

// ─── Remote validation ────────────────────────────────────────────────────────
export async function validateKeyRemote(key) {
  const res  = await fetch(`${BACKEND_URL}/validate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ key }),
  });
  return res.json(); // { valid, plan, validUntil } | { valid: false, reason }
}

async function revalidateInBackground(key) {
  try {
    const data = await validateKeyRemote(key);
    if (data.valid) {
      await writeStoredLicense({
        key, plan: data.plan, validUntil: data.validUntil,
        validatedAt: new Date().toISOString(),
      });
    } else {
      await clearStoredLicense();
    }
  } catch { /* network error — keep cached result */ }
}

// ─── Public: check license status ────────────────────────────────────────────
export async function getLicenseStatus() {
  const lic = await readStoredLicense();
  if (!lic) return { isPro: false, plan: null };

  const expired = lic.validUntil !== 'lifetime' && new Date(lic.validUntil) < new Date();
  if (expired) return { isPro: false, plan: null };

  // Re-validate silently every 7 days
  const lastValidated = lic.validatedAt ? new Date(lic.validatedAt).getTime() : 0;
  if (Date.now() - lastValidated > REVALIDATE_MS) {
    revalidateInBackground(lic.key); // fire and forget
  }

  return { isPro: true, plan: lic.plan };
}

// ─── Public: activate a new key (called from SettingsPanel) ──────────────────
export async function activateLicenseKey(key) {
  const data = await validateKeyRemote(key);
  if (!data.valid) return { success: false, reason: data.reason };

  await writeStoredLicense({
    key, plan: data.plan, validUntil: data.validUntil,
    validatedAt: new Date().toISOString(),
  });
  return { success: true, plan: data.plan };
}

// ─── Session helpers ──────────────────────────────────────────────────────────
export function saveSession(text, index, wpm) {
  if (!text || index <= 0) return;
  localStorage.setItem('rp_session', JSON.stringify({ textKey: text.slice(0, 80), index, wpm }));
}

export function clearSession() { localStorage.removeItem('rp_session'); }

export function loadSession(text) {
  const data = loadJson('rp_session', null);
  if (!data || data.textKey !== text.slice(0, 80)) return null;
  return data;
}

// ─── Streak / words today ─────────────────────────────────────────────────────
function getStreak()     { return loadJson('rp_streak', { count: 0, lastDate: null }); }
function getWordsToday() {
  const d = loadJson('rp_words_today', { count: 0, date: null });
  return d.date === today() ? d.count : 0;
}

export function useStats() {
  const [streak, setStreak]         = useState(() => getStreak().count);
  const [wordsToday, setWordsToday] = useState(getWordsToday);

  const addWords = useCallback((count) => {
    const n = getWordsToday() + count;
    localStorage.setItem('rp_words_today', JSON.stringify({ count: n, date: today() }));
    setWordsToday(n);
  }, []);

  const recordComplete = useCallback(() => {
    const t         = today();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const cur       = getStreak();
    const next      = cur.lastDate === t         ? cur
                    : cur.lastDate === yesterday ? { count: cur.count + 1, lastDate: t }
                    :                              { count: 1, lastDate: t };
    localStorage.setItem('rp_streak', JSON.stringify(next));
    setStreak(next.count);
  }, []);

  return { streak, wordsToday, addWords, recordComplete };
}
