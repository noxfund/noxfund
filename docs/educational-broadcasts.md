# Educational Telegram Broadcasts

## Overview

NOX FUND can automatically post educational messages to your Telegram group/channel every 45 minutes to help users learn about the project gradually.

## Features

- **20 detailed educational messages** covering all aspects of NOX FUND
- **Automatic rotation** through the message library
- **Rich formatting** with images and inline keyboards
- **45-minute interval** to avoid spam while maintaining engagement
- **Resume-safe** — picks up where it left off after restarts

## Setup

### 1. Enable Educational Broadcasts

Set the environment variable:

```bash
EDUCATIONAL_ENABLED=true
```

### 2. Configure Announcement Channel

Educational messages are posted to the same channel as announcements:

```bash
ANNOUNCE_CHAT_ID=-1001234567890  # Your group/channel ID
```

### 3. Deploy to Vercel

The cron job runs automatically every 45 minutes once deployed:

```bash
vercel --prod
```

## Message Content

The 20 educational messages cover:

1. **Introduction** - What is NOX FUND?
2. **ROI Mechanics** - How 1.5% daily works
3. **Capital Lock** - 45-day lock explained
4. **Referral System** - 7-level rewards
5. **ROI Cap** - 365-epoch ceiling
6. **No Owner** - Immutability features
7. **Security** - Audits and verification
8. **Calculator** - Using the yield calculator
9. **Getting Started** - Step-by-step guide
10. **Transparency** - On-chain data
11. **Multiple Positions** - Strategy tips
12. **Usernames** - Claiming referral names
13. **Risk Warning** - Understanding risks
14. **Liquidity** - How payouts work
15. **Support** - Common troubleshooting
16. **Compounding** - Reinvestment strategies
17. **Gas Fees** - Transaction costs
18. **Verification** - How to audit the contract
19. **Referral Income** - Building passive income
20. **Call to Action** - Final summary

## Schedule

- **Frequency**: Every 45 minutes
- **Execution**: Via Vercel Cron (`*/45 * * * *`)
- **Budget**: 25 seconds per run
- **Rotation**: Cycles through all 20 messages, then restarts

## Example Timeline

| Time | Message |
|------|---------|
| 00:00 | Message 1: Introduction |
| 00:45 | Message 2: ROI Mechanics |
| 01:30 | Message 3: Capital Lock |
| ... | ... |
| 14:15 | Message 20: CTA |
| 15:00 | Message 1: Introduction (cycle repeats) |

## Testing

### Manual Trigger

Test educational broadcasts without waiting:

```bash
curl -X GET "https://your-domain.vercel.app/api/cron-educational?key=YOUR_CRON_SECRET"
```

### Check Status

The endpoint returns:

```json
{
  "ok": true,
  "phase": "educational",
  "educational": {
    "index": 5,
    "nextIndex": 6,
    "sent": true
  },
  "startedAt": "2026-10-18T16:00:00.000Z",
  "finishedAt": "2026-10-18T16:00:02.345Z"
}
```

## Monitoring

### Vercel Dashboard

Check cron execution logs:

1. Go to your Vercel project
2. Navigate to **Crons** tab
3. View `/api/cron-educational` runs

### Disable Broadcasts

Set `EDUCATIONAL_ENABLED=false` or remove the environment variable.

## Message Images

Educational messages include these images from [`assets/img/telegram/`](../assets/img/telegram/):

- `tg-welcome.png` - Welcome/intro messages
- `tg-promo-roi.png` - ROI explanations
- `tg-promo-trust.png` - Security/trust topics
- `tg-promo-referral.png` - Referral system
- `tg-promo-calc.png` - Calculator guides
- `tg-promo-steps.png` - Getting-started guide
- `tg-promo-team.png` - Referral income examples
- `tg-promo-username.png` - Username / referral link
- `tg-promo-lock.png` - 45-day capital lock, rolling locks
- `tg-promo-risk.png` - Risk disclosures
- `tg-promo-join.png` - Support / community

## Customization

### Edit Messages

Messages are stored in [`api/_lib/educational.js`](../api/_lib/educational.js).

Each message contains:

```javascript
{
  text: "Message content in HTML format",
  image: "assets/img/telegram/image.png",  // optional
  keyboard: [                               // optional
    [{ text: "Button", url: "https://..." }]
  ]
}
```

### Change Interval

Edit [`vercel.json`](../vercel.json) cron schedule:

```json
{
  "path": "/api/cron-educational",
  "schedule": "*/30 * * * *"  // Every 30 minutes
}
```

Supported intervals:
- `*/15 * * * *` - Every 15 minutes
- `*/30 * * * *` - Every 30 minutes  
- `*/45 * * * *` - Every 45 minutes (default)
- `0 * * * *` - Every hour

## Best Practices

1. **Don't over-post** - 45 minutes is a good balance
2. **Monitor engagement** - Check if users find it helpful
3. **Update content** - Refresh messages as project evolves
4. **Test first** - Run manually before enabling automatic posts
5. **Pair with support** - Answer questions when users ask

## Troubleshooting

### Messages not posting

Check:
- `EDUCATIONAL_ENABLED=true` is set
- `ANNOUNCE_CHAT_ID` is configured correctly
- Bot has permission to post in the channel
- Vercel Cron is active (check dashboard)
- `CRON_SECRET` matches in environment

### Wrong chat receiving messages

Educational broadcasts use `ANNOUNCE_CHAT_ID`. Update this variable to change the target channel.

### Cursor stuck

Reset the message rotation:

```bash
# Via Redis CLI or Upstash console
DEL nox:cursor:educational
```

Next run will start from message 1.

## Architecture

```
Vercel Cron (every 45 min)
    ↓
/api/cron-educational.js
    ↓
phaseEducational() in worker.js
    ↓
getEducationalMessage() in educational.js
    ↓
Telegram API (sendPhoto or sendMessage)
```

State is stored in Redis/KV:
- `nox:cursor:educational` - Current message index (0-19)

## Security

- Authenticated via `CRON_SECRET` (Bearer token or `?key=` param)
- Uses same security model as main cron job
- Lock prevents concurrent runs
- Fails gracefully if chat is unavailable

## Related Files

- [`api/cron-educational.js`](../api/cron-educational.js) - Cron endpoint
- [`api/_lib/educational.js`](../api/_lib/educational.js) - Message content
- [`api/_lib/worker.js`](../api/_lib/worker.js) - `phaseEducational()` logic
- [`api/_lib/store.js`](../api/_lib/store.js) - Cursor persistence
- [`vercel.json`](../vercel.json) - Cron schedule
- [`content/telegram-messages.md`](../content/telegram-messages.md) - Source content
