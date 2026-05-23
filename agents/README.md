# AEO Snapshot Agent System

This folder keeps the work split into agents that can run independently without losing the main goal:
turn AEO Snapshot into at least $100 of real revenue.

## Current Assets

- Product: https://ilyayden.github.io/aeo-snapshot/
- Intake: https://t.me/AeoSnapshotBot?start=audit
- Paid audit invoice: https://t.me/xrocket?start=inv_IyegiYQNlH9TRrS
- Feedback monitor: `python3 scripts/feedback_monitor.py --reply`

## Operating Loop

1. Market research finds a channel with visible buyer intent and clear posting rules.
2. Sales outreach publishes or replies in that channel without bulk spam.
3. Feedback agent checks replies, bot updates, and objections.
4. Product agent updates positioning, CTA, pricing, or delivery promise from real feedback.
5. Delivery agent turns paid orders into a concrete audit package within 24 hours.

## Coordination Rules

- Do not send mass Telegram cold DMs while the account is flood-limited.
- Prefer public listings, permission-based replies, partner offers, and inbound bot capture.
- Track objections as `price_objection`, `negative`, `interested`, `ignored`, or `replied_unclear`.
- Never commit bot tokens, Telegram sessions, customer private data, or payment admin credentials.
- Every agent must produce either a file change, a channel action, or a specific decision.

Run the board:

```bash
python3 scripts/agent_board.py
```

