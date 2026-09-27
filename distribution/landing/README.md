# Print Farm Agent landing page

A lightweight bilingual landing page for early testers of the 3D Print Farm Agent.

## Stack

- Semantic HTML, CSS, and vanilla JavaScript for the page.
- A small Node.js HTTP server for local serving and tester intake; no framework or database.
- Tester submissions are appended to `data/tester-submissions.jsonl` and forwarded server-side to a Discord webhook when configured.

## Run locally

```sh
npm run dev
```

Open <http://localhost:4173>. The server binds to `127.0.0.1` by default. Set `HOST` and `PORT` to change that. Form submissions are stored with restrictive file permissions under `data/`; use `LANDING_DATA_DIR` to select another private directory.

## Build

```sh
npm run build
```

The build copies the static site into `dist/`. The server serves `dist/` when that directory exists and falls back to `public/` otherwise.

## Configuration

Edit `public/config.js`:

- `ctaMode: "beta"` keeps the early tester CTA.
- `contactLinks.discordUrl`, `email`, and `whatsappUrl` add public direct-contact options. Use a Discord invite/profile HTTPS URL, a plain email address, and a `https://wa.me/...` URL. The current Discord destination opens Discord with `@caiopellegrini` shown as the contact handle because a personal profile URL needs a numeric Discord user ID or an invite link. Empty values hide their links; no credentials belong in this public file.
- `ctaMode: "deploy"` plus `deployUrl` switches the hero primary CTA to deployment and shows the beta CTA as secondary. Only enable this after a real deploy destination is available.

The same page copy is in English and Brazilian Portuguese in `public/app.js`; English is the default. Add or update matching keys in both translation objects when editing localized text. The language switch updates the page copy, metadata, placeholders, and accessibility labels.

## Tester form destination

The browser posts to the same-origin `POST /api/testers` endpoint implemented by `server.mjs`. The endpoint requires a contact method and a printer-count selection; name, printer models, custom-job answer, and biggest pain are optional. Country is not collected. Accepted records are appended as JSONL to `data/tester-submissions.jsonl`. If `DISCORD_WEBHOOK_URL` is set in the server environment or in a private `distribution/landing/.env` file, each accepted submission is forwarded from the server to that Discord webhook. The webhook is never included in browser code. Keep `.env` and the generated `data/` directory private.

## Deployment options

Deploy the Node server to a small Node-capable host (for example, a basic VPS or a Node application service) with persistent private storage for the JSONL file and `DISCORD_WEBHOOK_URL` configured as a server-side secret. A static host alone will serve the page but cannot accept submissions; in that case, point the form to a separately hosted endpoint and update the client accordingly. Configure HTTPS and a persistent data volume before collecting real responses.

## Known limitations

The “Working today” items refer to local exercises with sample jobs, not a hosted production service. Cura print-time accuracy is still being checked. Customer-facing file intake, quote approval, operator handoff, and production workflow are listed as coming next. The phone conversation is illustrative; it does not indicate a live printer connection, scheduler, Bambu integration, or print-queue action. The contact destinations are empty until configured. Analytics are not installed.
