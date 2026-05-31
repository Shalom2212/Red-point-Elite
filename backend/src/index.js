import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { webhookRoute }  from './routes/webhook.js';
import { validateRoute } from './routes/validate.js';
import { keyRoute }      from './routes/key.js';
import { successRoute }  from './routes/success.js';
import { activateRoute } from './routes/activate.js';

const app = new Hono();

// Allow requests from any Chrome extension origin + web
app.use('/validate', cors({ origin: '*', allowMethods: ['POST', 'OPTIONS'] }));
app.use('/key',      cors({ origin: '*', allowMethods: ['GET',  'OPTIONS'] }));

// Dodo sends raw body via Svix — must NOT parse as JSON before verification
app.post('/webhook',  webhookRoute);

// Extension calls this to validate a key
app.post('/validate', validateRoute);

// Success page polls this until the webhook has processed
app.get('/key',       keyRoute);

// Post-payment redirect from Dodo (?payment_id=pay_xxx)
app.get('/success',   successRoute);

// One-click activation link (intercepted by background.js)
app.get('/activate',  activateRoute);

app.get('/', c => c.text('Red Point Backend'));

export default app;
