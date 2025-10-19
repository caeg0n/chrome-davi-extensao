import express from 'express';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

// Load environment variables from .env when present (development convenience)
dotenv.config();

const app = express();
app.use(express.json());

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const configuredSerialKey = process.env.SERIAL_KEY ?? '123456';
const ttlSeconds = Number.parseInt(process.env.TOKEN_TTL_SECONDS ?? '60', 10);
const tokenSecret = process.env.TOKEN_SECRET ?? crypto.randomBytes(32).toString('hex');

function timingSafeMatch(given, expected) {
  const givenHash = crypto.createHash('sha256').update(given ?? '').digest();
  const expectedHash = crypto.createHash('sha256').update(expected ?? '').digest();
  return crypto.timingSafeEqual(givenHash, expectedHash);
}

function createToken(serialKey) {
  const issuedAt = Date.now();
  const payload = `${serialKey}:${issuedAt}:${crypto.randomUUID()}`;
  const digest = crypto
    .createHmac('sha256', tokenSecret)
    .update(payload)
    .digest('hex');
  return { token: `${digest}.${issuedAt}`, issuedAt };
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/api/verify', (req, res) => {
  const { serialKey } = req.body ?? {};

  if (typeof serialKey !== 'string') {
    res.status(400).json({ error: 'serialKey must be provided in request body.' });
    return;
  }

  if (!timingSafeMatch(serialKey, configuredSerialKey)) {
    res.status(401).json({ error: 'Invalid serial key.' });
    return;
  }

  const effectiveTtl = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 60;
  const { token, issuedAt } = createToken(serialKey);

  res.status(200).json({
    token,
    expiresInSeconds: effectiveTtl,
    issuedAt,
  });
});

app.use((err, _req, res, _next) => {
  // Unexpected errors fall back here.
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Auth server listening on port ${port}`);
});
