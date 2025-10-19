# Auth Backend

Minimal Express server that issues short-lived tokens for the Chrome extension.

## Setup

1. Copy `.env.example` to `.env` and adjust values:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

The server listens on `PORT` (defaults to `3000`).

## API

### `POST /api/verify`

Request body:
```json
{
  "serialKey": "123456"
}
```

Responses:
- `200 OK` with `{ "token": "…", "expiresInSeconds": 60, "issuedAt": 1710000000000 }` for a valid key
- `401 Unauthorized` when the key does not match
- `400 Bad Request` when `serialKey` is missing

### `GET /healthz`

Returns `200 OK` if the service is healthy.

## Connecting the Extension

Update the extension's `background.js` to set:
- `DEMO_MODE = false`
- `AUTH_ENDPOINT` to the deployed URL of this server, for example `https://your-domain.example/api/verify`

Add the corresponding origin to `host_permissions` in the extension `manifest.json`.

With the server running, reload the Chrome extension. Serial keys must match `SERIAL_KEY` in the backend environment to receive a token.

## Deploying to Render (zip upload)

1. From the `server/` directory, create a deployment archive (PowerShell):
   ```powershell
   pwsh ./deploy.ps1
   ```
   This produces `auth-backend.zip` in the `server/` directory, excluding local `.env` and `node_modules`.
2. In the Render dashboard, choose **New → Web Service** and upload the zip when prompted.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Add the environment variables `PORT`, `SERIAL_KEY`, `TOKEN_TTL_SECONDS`, and `TOKEN_SECRET` in Render’s settings.
5. Deploy and use the generated `https://…onrender.com/api/verify` URL in the Chrome extension manifest and `AUTH_ENDPOINT`.
