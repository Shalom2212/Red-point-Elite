import { verifyDodoSignature, generateLicenseKey } from '../lib/crypto.js';
import { createLicense, getLicenseBySubscription, revokeLicense, extendLicense } from '../lib/db.js';
import { sendLicenseEmail } from '../lib/email.js';

// Map your Dodo product IDs → plan names.
// Set these as Worker secrets: DODO_PRODUCT_MONTHLY, DODO_PRODUCT_ANNUAL, DODO_PRODUCT_LIFETIME
function resolvePlan(productId, env) {
  if (productId === env.DODO_PRODUCT_MONTHLY)  return 'monthly';
  if (productId === env.DODO_PRODUCT_ANNUAL)   return 'annual';
  if (productId === env.DODO_PRODUCT_LIFETIME) return 'lifetime';
  return 'monthly';
}

function computeValidUntil(plan) {
  if (plan === 'lifetime') return 'lifetime';
  const d = new Date();
  plan === 'annual' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export async function webhookRoute(c) {
  const rawBody = await c.req.text();

  const valid = await verifyDodoSignature(rawBody, {
    'svix-id':        c.req.header('svix-id')        ?? '',
    'svix-timestamp': c.req.header('svix-timestamp') ?? '',
    'svix-signature': c.req.header('svix-signature') ?? '',
  }, c.env.DODO_WEBHOOK_SECRET);

  if (!valid) return c.json({ error: 'Invalid signature' }, 401);

  const { type, data } = JSON.parse(rawBody);

  try {
    switch (type) {

      // ── One-time purchase (Lifetime plan) ──────────────────────────────────
      // Also fires for the initial payment of a subscription — use data.subscription_id
      // to distinguish: if present → subscription; if null → one-time.
      case 'payment.succeeded': {
        const email        = data.customer?.email;
        const customerId   = data.customer?.customer_id ?? data.payment_id;
        const paymentId    = data.payment_id;
        const productId    = data.product_cart?.[0]?.product_id ?? data.product_id;
        const plan         = resolvePlan(productId, c.env);
        const validUntil   = computeValidUntil(plan);
        const key          = generateLicenseKey();
        const activateUrl  = `${c.env.WORKER_URL}/activate?key=${key}`;

        await createLicense(c.env.DB, {
          key, email, customerId,
          subscriptionId: data.subscription_id ?? null,
          paymentId, plan, validUntil,
        });

        c.executionCtx.waitUntil(
          sendLicenseEmail(c.env.RESEND_API_KEY, { to: email, licenseKey: key, plan, activateUrl })
            .catch(err => console.error('Email error:', err)),
        );
        break;
      }

      // ── Subscription activated (Monthly / Annual) ───────────────────────────
      // Fired when a new subscription becomes active. Use this as the authoritative
      // event if Dodo fires it *instead of* payment.succeeded for subscriptions.
      case 'subscription.active': {
        const email        = data.customer?.email;
        const customerId   = data.customer?.customer_id ?? data.subscription_id;
        const productId    = data.product_id;
        const plan         = resolvePlan(productId, c.env);
        const paymentId    = data.payment_id ?? data.subscription_id;
        const validUntil   = data.next_billing_date
          ? new Date(data.next_billing_date).toISOString()
          : computeValidUntil(plan);
        const key          = generateLicenseKey();
        const activateUrl  = `${c.env.WORKER_URL}/activate?key=${key}`;

        await createLicense(c.env.DB, {
          key, email, customerId,
          subscriptionId: data.subscription_id,
          paymentId, plan, validUntil,
        });

        c.executionCtx.waitUntil(
          sendLicenseEmail(c.env.RESEND_API_KEY, { to: email, licenseKey: key, plan, activateUrl })
            .catch(err => console.error('Email error:', err)),
        );
        break;
      }

      // ── Subscription renewed ────────────────────────────────────────────────
      case 'subscription.renewed': {
        const subId    = data.subscription_id;
        const nextDate = data.next_billing_date;
        if (subId && nextDate) {
          await extendLicense(c.env.DB, subId, new Date(nextDate).toISOString());
        }
        break;
      }

      // ── Subscription cancelled ──────────────────────────────────────────────
      case 'subscription.cancelled': {
        const subId = data.subscription_id;
        if (subId) await revokeLicense(c.env.DB, subId);
        break;
      }
    }
  } catch (err) {
    // Log but always return 200 — Dodo/Svix retries on non-2xx, causing duplicate keys
    console.error('Webhook handler error:', err);
  }

  return c.json({ received: true });
}
