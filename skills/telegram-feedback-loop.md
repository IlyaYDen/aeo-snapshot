# Telegram Feedback Loop Skill

Use this when checking demand, objections, and bot inquiries.

Run:

```bash
python3 scripts/feedback_monitor.py --reply
```

Then decide:

- If `interested`, ask for site, market, and competitors or send payment link if already qualified.
- If `price_objection`, offer a smaller $49 preview only after the user explicitly asks for cheaper.
- If `negative`, do not continue the thread.
- If `ignored`, do not chase more than once without a strong reason.
- If `replied_unclear`, inspect the exact text before responding.

Never commit bot tokens or Telegram sessions.

