# NOX FUND — Telegram notification bot

Serverless Telegram bot for [`t.me/Nox_Fund_Bot`](https://t.me/Nox_Fund_Bot): pushes deposit, ROI,
referral, unlock and ROI-cap notifications straight from the NoxFund contract on BNB Smart Chain,
and answers portfolio/protocol queries on demand.

> ⚠️ **Rotate the token first.** The BotFather token was pasted into a chat transcript, so treat it
> as burned: open [@BotFather](https://t.me/BotFather) → `/revoke` → `Nox_Fund_Bot`, then store the
> new token as the `TELEGRAM_BOT_TOKEN` environment variable. Never commit it.

---

## 1 · Architecture

```
┌────────────┐   webhook    ┌──────────────────────┐
│  Telegram  │ ───────────► │ /api/telegram        │ command router, inline menus
└────────────┘              └──────────┬───────────┘
                                       │ read/write
┌────────────┐   cron/ping  ┌──────────▼───────────┐   eth_call / getLogs
│  Scheduler │ ───────────► │ /api/cron            │ ──────────────────────► BNB Chain
└────────────┘              │  1 events            │   Etherscan V2 (logs)
                            │  2 unlock/cap sweep  │
┌────────────┐   admin ops  │  3 daily digest      │
│   You      │ ───────────► └──────────┬───────────┘
└────────────┘  /api/admin             │
                                ┌──────▼──────┐
                                │ Upstash KV  │ subscriptions, cursor, dedupe flags
                                └─────────────┘
```

| File | Role |
|---|---|
| [`api/telegram.js`](../api/telegram.js:1) | Webhook — commands, inline keyboards, deep links |
| [`api/cron.js`](../api/cron.js:1) | Worker — event replay, milestone sweep, daily digest |
| [`api/admin.js`](../api/admin.js:1) | Webhook registration, command list, broadcast, cursor control |
| [`api/_lib/chain.js`](../api/_lib/chain.js:1) | RPC failover, contract reads, log decoding |
| [`api/_lib/store.js`](../api/_lib/store.js:1) | Redis REST wrapper + in-memory fallback |
| [`api/_lib/text.js`](../api/_lib/text.js:1) | Copy deck and formatters (house style) |
| [`api/_lib/tg.js`](../api/_lib/tg.js:1) | Bot API transport, 429/5xx retries, dead-chat detection |
| [`api/_lib/config.js`](../api/_lib/config.js:1) | Env parsing, protocol constants, limits |

The bot is **read-only**: it never holds keys, never signs, and never asks users for a seed phrase.

---

## 2 · What it notifies

| Trigger | Source | Message |
|---|---|---|
| `Deposited` | contract log | position #, amount, daily accrual, unlock date, tx |
| `ROIWithdrawn` | contract log | position #, amount, epochs settled |
| `PrincipalWithdrawn` | contract log | principal + final ROI, position closed |
| `ReferralPaid` | contract log | level, amount, downline address |
| `ReferralWithdrawn` | contract log | amount paid out |
| `UsernameClaimed` | contract log | name → wallet, referral link |
| 45-day unlock | `depositInfo()` sweep | principal now withdrawable |
| 365-epoch cap | `depositInfo()` sweep | accrual stopped, claim + withdraw |
| Daily digest | `pendingROIAll()` + `refBalance()` | claimable ROI and referral balance |

Historic positions that matured more than 48h before the bot saw them are flagged silently, so a
fresh deployment never spams a backlog.

---

## 3 · Commands

```
start - Welcome, links and quick actions
watch - Track a wallet for alerts
unwatch - Stop tracking a wallet
wallets - Wallets tracked in this chat
me - Wallet snapshot: ROI, positions
positions - Position-by-position breakdown
stats - Live protocol snapshot
calc - ROI projection for an amount
alerts - Notification settings
faq - Frequently asked questions
audit - Audit and security scans
contract - Verified contract on BscScan
site - Open the NOX FUND dApp
support - Troubleshooting checklist
risk - Risk notice
help - All commands
```

`/api/admin?action=setup` pushes this list to BotFather automatically — no manual `/setcommands`.

Extras: `/roi`, `/mute`, `/unmute`, `/rules`, `/id`, `/faq_roi`-style macros, and a bare `0x…`
address pasted in DM is treated as `/watch`.

Deep link for campaigns: `https://t.me/Nox_Fund_Bot?start=watch_0xYourAddress` subscribes in one tap.

---

## 4 · Deploy on Vercel

### 4.1 Storage (required)

Vercel → **Storage** → **Create** → *Upstash Redis* → connect to the project. That injects
`KV_REST_API_URL` and `KV_REST_API_TOKEN`. Without it the bot still answers commands but forgets
subscriptions on every cold start (it logs a warning in `/alerts`).

### 4.2 Environment variables

Copy [`.env.example`](../.env.example:1) into Vercel → Settings → Environment Variables:

| Variable | Notes |
|---|---|
| `TELEGRAM_BOT_TOKEN` | **required** — the rotated BotFather token |
| `TELEGRAM_BOT_USERNAME` | `Nox_Fund_Bot` |
| `TELEGRAM_WEBHOOK_SECRET` | `openssl rand -hex 24` — verifies every webhook call |
| `ADMIN_SECRET` | guards `/api/admin` |
| `CRON_SECRET` | guards `/api/cron` |
| `ETHERSCAN_API_KEY` | Etherscan V2 multichain key — primary log source |
| `ANNOUNCE_CHAT_ID` | optional public channel for deposit + withdrawal announcements |
| `ANNOUNCE_MIN_USDT` | deposit announcement threshold, default `100` |
| `ANNOUNCE_WITHDRAWALS` | announce ROI / principal / referral withdrawals, default `true` |
| `ANNOUNCE_MIN_WITHDRAW_USDT` | withdrawal announcement threshold, default `0` |
| `DIGEST_HOUR_UTC` | digest hour, default `2` |
| `GREET_NEW_MEMBERS` | `true` to auto-greet in groups the bot administrates |

### 4.3 Ship it

```bash
npm install
vercel --prod
```

### 4.4 Register the webhook

```bash
curl "https://<your-domain>/api/admin?action=setup&secret=$ADMIN_SECRET"
curl "https://<your-domain>/api/admin?action=info&secret=$ADMIN_SECRET"
```

`setup` calls `setWebhook` (with the secret token), `setMyCommands`, `setMyDescription`,
`setMyShortDescription` and the menu button. `info` returns bot identity, webhook state, chain head,
stored cursor and subscriber counts — use it as a health check.

Send yourself a test push:

```bash
curl "https://<your-domain>/api/admin?action=ping&chat=<your-chat-id>&secret=$ADMIN_SECRET"
```

(`/id` in a DM tells you your chat id.)

---

## 5 · Scheduling the worker

[`vercel.json`](../vercel.json:1) ships a **daily** cron (`0 2 * * *`) because the Hobby plan rejects
sub-daily schedules. Notifications are only as fresh as the schedule, so pick one:

**Pro plan** — edit the schedule to run every minute or two:

```json
"crons": [{ "path": "/api/cron", "schedule": "*/2 * * * *" }]
```

**Hobby plan** — keep the daily cron for the digest and add a free external pinger
([cron-job.org](https://cron-job.org), UptimeRobot, GitHub Actions) hitting:

```
https://<your-domain>/api/cron?key=<CRON_SECRET>
```

every 1–5 minutes. The endpoint is idempotent: a Redis lock prevents overlapping runs, a block
cursor prevents gaps, and per-chat flags prevent duplicate messages.

Phase control for manual runs:

```bash
curl "https://<your-domain>/api/cron?key=$CRON_SECRET&phase=events"
curl "https://<your-domain>/api/cron?key=$CRON_SECRET&phase=sweep"
curl "https://<your-domain>/api/cron?key=$CRON_SECRET&phase=digest&force=1"
```

Replay a range after an outage:

```bash
curl "https://<your-domain>/api/admin?action=cursor&block=<fromBlock>&secret=$ADMIN_SECRET"
```

---

## 6 · Local development and tests

```bash
cp .env.example .env.local        # fill in the token + keys
npm run dev                       # vercel dev → http://localhost:3000/api/telegram

# chain layer + every message template, no Telegram needed
ETHERSCAN_API_KEY=… node tools/bot-smoke.mjs 20000

# full webhook + worker path against a mocked Bot API
ETHERSCAN_API_KEY=… node tools/bot-selftest.mjs 0xWalletToTrack

npm run check                     # syntax check all functions
```

To test against Telegram from a laptop, expose the port (`ngrok http 3000`) and run
`?action=setup` with `PUBLIC_BASE_URL` pointing at the tunnel.

---

## 7 · Operations

| Task | Call |
|---|---|
| Health check | `GET /api/telegram` → `{ ok, store }` |
| Full status | `GET /api/admin?action=info&secret=…` |
| Broadcast | `POST /api/admin?action=broadcast&secret=…` body `{ "text": "<b>…</b>" }` |
| Pause pushes | remove the cron / pinger — the cursor resumes where it stopped |
| Detach webhook | `GET /api/admin?action=unset&secret=…` |

Behaviour notes:

- Chats that block the bot are pruned automatically on the next push (`403` → `dropChat`).
- Rate limits are handled with `retry_after` backoff; broadcasts pace at ~16 msg/s.
- RPCs are tried in order and the first healthy endpoint is promoted for the rest of the invocation.
- Message copy follows [`content/telegram-messages.md`](../content/telegram-messages.md:1): HTML parse
  mode, no "guaranteed"/"risk-free"/"APY", risk line on promotional output.
