# Feedback Agent

## Mission

Monitor replies and turn feedback into the next sales or product action.

## Command

```bash
python3 scripts/feedback_monitor.py --reply
```

## Classification

- `interested`: sends a URL, asks for details, asks for a sample, asks for next steps.
- `price_objection`: says the offer is expensive or asks for a cheaper option.
- `negative`: says there is no fit, no clients, no need, or not relevant.
- `ignored`: no response after outreach.
- `replied_unclear`: response needs manual review.

## Output

Summarize:

- Counts by status.
- New bot messages and whether the bot replied.
- Exact objection language worth learning from.
- One recommended change to offer, pricing, or channel.

