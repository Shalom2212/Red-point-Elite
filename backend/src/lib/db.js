export const createLicense = (db, { key, email, customerId, subscriptionId, paymentId, plan, validUntil }) =>
  db.prepare(`
    INSERT INTO licenses (key, email, customer_id, subscription_id, payment_id, plan, valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(key, email, customerId, subscriptionId ?? null, paymentId ?? null, plan, validUntil).run();

export const getLicenseByKey = (db, key) =>
  db.prepare('SELECT * FROM licenses WHERE key = ?').bind(key).first();

export const getLicenseByPayment = (db, paymentId) =>
  db.prepare('SELECT * FROM licenses WHERE payment_id = ?').bind(paymentId).first();

export const getLicenseBySubscription = (db, subscriptionId) =>
  db.prepare('SELECT * FROM licenses WHERE subscription_id = ?').bind(subscriptionId).first();

export const revokeLicense = (db, subscriptionId) =>
  db.prepare('UPDATE licenses SET revoked = 1 WHERE subscription_id = ?').bind(subscriptionId).run();

export const extendLicense = (db, subscriptionId, validUntil) =>
  db.prepare('UPDATE licenses SET valid_until = ? WHERE subscription_id = ?').bind(validUntil, subscriptionId).run();

export const touchLicense = (db, key) =>
  db.prepare(`UPDATE licenses SET activations = activations + 1, last_validated = datetime('now') WHERE key = ?`).bind(key).run();
