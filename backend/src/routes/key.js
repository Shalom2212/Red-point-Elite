import { getLicenseByPayment } from '../lib/db.js';

// Called by the success page JS — polls every 2 s until the webhook has processed.
// Dodo redirects to /success?payment_id=pay_xxx after checkout.
export async function keyRoute(c) {
  const paymentId = c.req.query('payment_id');
  if (!paymentId) return c.json({ error: 'Missing payment_id' }, 400);

  const license = await getLicenseByPayment(c.env.DB, paymentId);
  if (!license) return c.json({ pending: true }); // webhook not yet processed

  return c.json({
    key:        license.key,
    plan:       license.plan,
    validUntil: license.valid_until,
  });
}
