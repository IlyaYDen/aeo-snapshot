#!/usr/bin/env python3
"""Monitor AEO Snapshot sales feedback without storing bot secrets.

The script reads:
- Telegram DM feedback for the first outreach batch.
- Incoming messages sent to @AeoSnapshotBot.

It derives the bot token from BotFather history at runtime and stores only a
Bot API update offset in .local/aeo_feedback_state.json.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import urllib.parse
import urllib.request
from time import sleep
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from telethon import TelegramClient

SESSION = "/Users/ilyadenisov/Documents/ObsidianVault/3. Resources/Instruments/tg/sessions/busi"
API_ID = 31092404
API_HASH = "c8a6e8133a4ab1384cb320652450b4ef"
BOT_USERNAME = "AeoSnapshotBot"
STATE_PATH = Path(".local/aeo_feedback_state.json")

OUTREACH_TARGETS: list[str | int] = [
    7659614369,  # CashCow.agency
    8352317982,  # Anastasia PA
    7755354126,  # Responsive Factory
    "partners_legenix",
    "White_linkbuilder",
    "RKV_777",
]

PRICE_TERMS = ("дорого", "expensive", "price", "цена", "$149", "149$", "149")
NEGATIVE_TERMS = ("не интересно", "некому", "не актуально", "нет клиентов", "не подходит")
INTEREST_TERMS = (
    "интерес",
    "давай",
    "можно",
    "скинь",
    "покажи",
    "домен",
    "сайт",
    "client",
    "domain",
    "website",
)


@dataclass
class FeedbackItem:
    target: str
    name: str | None
    status: str
    reason: str
    last_incoming: str | None
    last_incoming_at: str | None


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"bot_update_offset": 0}
    return json.loads(STATE_PATH.read_text())


def save_state(state: dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2))


def bot_api(token: str, method: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    data = urllib.parse.urlencode(payload or {}).encode()
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(
                f"https://api.telegram.org/bot{token}/{method}",
                data=data,
                timeout=25,
            ) as response:
                return json.loads(response.read().decode())
        except Exception as exc:
            last_error = exc
            if attempt < 2:
                sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Bot API {method} failed: {last_error}")


def classify_text(text: str | None) -> tuple[str, str]:
    if not text:
        return "ignored", "no incoming reply after outreach"
    lowered = text.lower()
    if any(term in lowered for term in PRICE_TERMS):
        return "price_objection", "mentions price or cost"
    if any(term in lowered for term in NEGATIVE_TERMS):
        return "negative", "not a fit or no resale channel"
    if any(term in lowered for term in INTEREST_TERMS) or re.search(r"https?://|[a-z0-9-]+\.[a-z]{2,}", lowered):
        return "interested", "asks or provides website/client context"
    return "replied_unclear", "reply needs manual review"


async def get_bot_token(client: TelegramClient) -> str:
    botfather = await client.get_entity("BotFather")
    async for msg in client.iter_messages(botfather, limit=80):
        text = msg.message or ""
        if BOT_USERNAME in text or "Use this token" in text or "HTTP API" in text:
            match = re.search(r"\b\d{8,12}:[A-Za-z0-9_-]{30,}\b", text)
            if match:
                return match.group(0)
    raise RuntimeError("Bot token not found in BotFather history.")


async def inspect_outreach(client: TelegramClient) -> list[FeedbackItem]:
    items: list[FeedbackItem] = []
    for target in OUTREACH_TARGETS:
        try:
            entity = await client.get_entity(target)
            name = getattr(entity, "username", None) or " ".join(
                value
                for value in [getattr(entity, "first_name", None), getattr(entity, "last_name", None)]
                if value
            )
            last_out: datetime | None = None
            last_in_text: str | None = None
            last_in_at: datetime | None = None
            async for msg in client.iter_messages(entity, limit=12):
                if msg.out and last_out is None:
                    last_out = msg.date
                if not msg.out and last_in_text is None:
                    last_in_text = (msg.message or "").strip()
                    last_in_at = msg.date
            if last_in_at and datetime.now(timezone.utc) - last_in_at <= timedelta(days=7):
                status, reason = classify_text(last_in_text)
            else:
                status, reason = "ignored", "no incoming reply after latest outreach"
            items.append(
                FeedbackItem(
                    target=str(target),
                    name=name or None,
                    status=status,
                    reason=reason,
                    last_incoming=last_in_text,
                    last_incoming_at=last_in_at.isoformat() if last_in_at else None,
                )
            )
        except Exception as exc:
            items.append(
                FeedbackItem(
                    target=str(target),
                    name=None,
                    status="error",
                    reason=f"{type(exc).__name__}: {str(exc)[:160]}",
                    last_incoming=None,
                    last_incoming_at=None,
                )
            )
    return items


def reply_text_for_bot(message: str) -> str:
    if re.search(r"https?://|[a-z0-9-]+\.[a-z]{2,}", message.lower()):
        return (
            "Got it. I can prepare an AEO Snapshot preview for that site. "
            "The full AI Search Visibility Audit is $149 and includes a PDF report, "
            "llms.txt draft, schema/entity/citation fixes, and the first 10 priority actions. "
            "Please also send the target market and 2-3 competitors if you have them."
        )
    return (
        "AEO Snapshot is a $149 AI Search Visibility Audit. Send a website URL and target market, "
        "and I will prepare a preview with visibility score, citation gap, schema readiness, "
        "llms.txt readiness, and first priority fixes."
    )


def inspect_bot_updates(token: str, state: dict[str, Any], should_reply: bool) -> list[dict[str, Any]]:
    offset = int(state.get("bot_update_offset") or 0)
    data = bot_api(token, "getUpdates", {"offset": offset, "timeout": 0, "allowed_updates": json.dumps(["message"])})
    updates = data.get("result", [])
    rows: list[dict[str, Any]] = []
    max_update_id = offset - 1
    for update in updates:
        max_update_id = max(max_update_id, int(update["update_id"]))
        message = update.get("message") or {}
        chat = message.get("chat") or {}
        text = (message.get("text") or "").strip()
        status, reason = classify_text(text)
        row = {
            "update_id": update["update_id"],
            "chat_id": chat.get("id"),
            "from": chat.get("username") or chat.get("first_name"),
            "text": text[:700],
            "status": status if text else "bot_contact",
            "reason": reason if text else "opened bot without text",
            "replied": False,
        }
        if should_reply and chat.get("id"):
            bot_api(token, "sendMessage", {"chat_id": chat["id"], "text": reply_text_for_bot(text)})
            row["replied"] = True
        rows.append(row)
    if max_update_id >= offset:
        state["bot_update_offset"] = max_update_id + 1
    return rows


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reply", action="store_true", help="Reply to new bot inquiries.")
    args = parser.parse_args()

    state = load_state()
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.connect()
    token = await get_bot_token(client)
    outreach = await inspect_outreach(client)
    await client.disconnect()

    bot_error = None
    try:
        bot_updates = inspect_bot_updates(token, state, should_reply=args.reply)
    except Exception as exc:
        bot_updates = []
        bot_error = f"{type(exc).__name__}: {str(exc)[:240]}"
    save_state(state)

    summary: dict[str, int] = {}
    for item in outreach:
        summary[item.status] = summary.get(item.status, 0) + 1
    for update in bot_updates:
        summary[update["status"]] = summary.get(update["status"], 0) + 1

    print(
        json.dumps(
            {
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "summary": summary,
                "outreach": [item.__dict__ for item in outreach],
                "bot_updates": bot_updates,
                "bot_error": bot_error,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
