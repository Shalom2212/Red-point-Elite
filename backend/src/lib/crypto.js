const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateLicenseKey() {
  const seg = () => {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => CHARS[b % CHARS.length]).join('');
  };
  return `RPRO-${seg()}-${seg()}-${seg()}-${seg()}`;
}

// Verifies that a Dodo Payments webhook payload is genuine.
// Dodo uses Svix for delivery — signature format: "v1,<base64-hmac-sha256>"
// Header: svix-id, svix-timestamp, svix-signature
// Signed content: "{svix-id}.{svix-timestamp}.{raw-body}"
// Secret: base64-encoded string from the Dodo dashboard (may be prefixed "whsec_")
export async function verifyDodoSignature(rawBody, headers, secret) {
  const msgId  = headers['svix-id'];
  const msgTs  = headers['svix-timestamp'];
  const msgSig = headers['svix-signature'];

  if (!msgId || !msgTs || !msgSig || !secret) return false;

  // Reject webhooks older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(msgTs)) > 300) return false;

  const signedContent = `${msgId}.${msgTs}.${rawBody}`;

  // Secrets may be prefixed with 'whsec_'
  const secretStr   = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const secretBytes = Uint8Array.from(atob(secretStr), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'raw', secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  // Header may contain multiple space-separated sigs: "v1,sig1 v1,sig2"
  const sigs = msgSig.split(' ').map(s => s.startsWith('v1,') ? s.slice(3) : s);
  return sigs.some(s => s === computed);
}
