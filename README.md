# Spiffier Games

Spiffier Games is a desktop-first Discord companion for private social games. The first game is Guess the Person: every player sees everyone else's identity, asks questions over Discord voice chat, and tries to solve their own identity in the fewest turns.

## What is included

- Reusable game hub and game manifest/module contracts
- Password-protected, unlisted rooms for 3–12 players
- Server-authoritative Cloudflare Durable Object room state and hibernating WebSockets
- Resume tokens, reconnect reservations, host transfer, room expiry, and idempotent revision-checked commands
- Multi-round Guess the Person with All/Any tag filters, two-slot turns, overtime, hidden group voting, caps, late-join penalties, results, standings, and rematches
- A 400-identity starter catalog across games, animation/anime, live action, and real people
- D1 taxonomy/content schema, protected admin editor, sequential CSV import, and R2 image ingestion/cache
- Guest play and optional Discord OAuth using only the `identify` scope
- Black-and-white, square-cornered, keyboard-friendly interface

## Local development

Requirements: Node.js 22.13 or newer and pnpm.

```powershell
pnpm install
pnpm run dev
```

The Windows workspace helper uses Codex's bundled runtime when Node is not installed globally:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\bootstrap.ps1 dev
```

Open `http://localhost:3000`. Local Durable Object, D1, and R2 state is stored under `.wrangler/`.

## Configuration

Copy `.env.example` to `.dev.vars` for local Discord sign-in. Guest games work without these values.

| Variable | Purpose |
| --- | --- |
| `DISCORD_CLIENT_ID` | Discord OAuth application client ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth client secret |
| `APP_SESSION_SECRET` | Long random value used to sign site sessions |
| `ADMIN_EMAILS` | Comma-separated Cloudflare Access email allowlist |

Configure the Discord OAuth redirect as `https://YOUR_HOST/api/auth/discord/callback` (or the local equivalent). The worker requests only Discord's `identify` scope and does not retain the Discord access token.

The admin API accepts local development requests. In production it requires both:

1. Cloudflare Access protecting `/admin*` and `/api/admin*` with email one-time PIN.
2. The authenticated `Cf-Access-Authenticated-User-Email` value to appear in `ADMIN_EMAILS`.

## Database and media

The generated D1 migration is in `drizzle/`. Apply it to the production database before using Discord profiles or admin CRUD. The static launch catalog remains playable even when D1 is empty. Admin image imports validate public HTTPS JPEG, PNG, or WebP media and copy it into R2; remotely sourced rights status defaults to `unknown`.

```powershell
pnpm run db:generate
```

## Verification

```powershell
pnpm run test
pnpm run lint
pnpm exec tsc --noEmit
pnpm run smoke:room # with the local dev server running
```

## Deployment

`pnpm run build` emits a Cloudflare bundle in `dist/`. The generated server configuration includes the `ROOMS` Durable Object, D1 `DB`, R2 `MEDIA`, and static asset binding. Before production deployment:

1. Provision D1 and R2 and replace the generated placeholder IDs/names where required by the deployment surface.
2. apply `drizzle/0000_nasty_grey_gargoyle.sql` to D1;
3. add the four configuration values above as Worker secrets/variables;
4. configure Cloudflare Access for the admin paths;
5. set billing alerts and run a three-browser acceptance match.

Room scores and match history intentionally expire with the Durable Object room. Identity content and Discord display profiles persist in D1/R2.
