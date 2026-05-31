import { getLicenseByKey, touchLicense } from '../lib/db.js';

export async function validateRoute(c) {
  let key;
  try {
    ({ key } = await c.req.json());
  } catch {
    return c.json({ valid: false, reason: 'Bad request' }, 400);
  }

  if (!key || typeof key !== 'string' || !key.trim().startsWith('RPRO-')) {
    return c.json({ valid: false, reason: 'Invalid key format' });
  }

  const license = await getLicenseByKey(c.env.DB, key.trim().toUpperCase());

  if (!license)          return c.json({ valid: false, reason: 'Key not found' });
  if (license.revoked)   return c.json({ valid: false, reason: 'Key revoked' });
  if (license.valid_until !== 'lifetime' && new Date(license.valid_until) < new Date()) {
    return c.json({ valid: false, reason: 'Key expired' });
  }

  // Update activation count asynchronously — don't delay the response
  c.executionCtx.waitUntil(touchLicense(c.env.DB, key.trim().toUpperCase()));

  return c.json({
    valid:      true,
    plan:       license.plan,
    validUntil: license.valid_until,
    email:      license.email,
  });
}
