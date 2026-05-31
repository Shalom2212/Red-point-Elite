-- Run once: npm run db:init  (local)  |  npm run db:init:prod  (production)

CREATE TABLE IF NOT EXISTS licenses (
  id              INTEGER  PRIMARY KEY AUTOINCREMENT,
  key             TEXT     UNIQUE NOT NULL,          -- RPRO-XXXX-XXXX-XXXX-XXXX
  email           TEXT     NOT NULL,
  customer_id     TEXT     NOT NULL,                 -- Dodo customer ID
  subscription_id TEXT,                              -- Dodo subscription ID (NULL for lifetime)
  payment_id      TEXT,                              -- Dodo payment_id — used to poll on success page
  plan            TEXT     NOT NULL,                 -- 'monthly' | 'annual' | 'lifetime'
  valid_until     TEXT     NOT NULL,                 -- ISO datetime OR 'lifetime'
  revoked         INTEGER  NOT NULL DEFAULT 0,       -- 1 = revoked
  activations     INTEGER  NOT NULL DEFAULT 0,
  last_validated  TEXT,
  created_at      TEXT     NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_licenses_key          ON licenses(key);
CREATE INDEX IF NOT EXISTS idx_licenses_subscription ON licenses(subscription_id);
CREATE INDEX IF NOT EXISTS idx_licenses_payment      ON licenses(payment_id);
CREATE INDEX IF NOT EXISTS idx_licenses_customer     ON licenses(customer_id);
