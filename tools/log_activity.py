#!/usr/bin/env python3
"""Append one entry to the ZhioLearns site activity log (activity-log.json).

Standing rule (ژاله, 2026-11-02): EVERY site change/deploy appends one entry,
so the admin panel's «لاگ فعالیت / Activity Log» always shows who did what, when.

Usage:
  python3 tools/log_activity.py --actor "Muse — برنامه روزانه" \
      --action "افزودن مقاله + انتشار" --target "for-parents-xxx.html" \
      --detail "توضیح کوتاه" [--commit dc8a8ce]

Writes the entry (newest first) to BOTH local copies:
  ~/workspace/zhiolearns-site/activity-log.json        (deployed via git push)
  ~/workspace/zhiolearns-deploy-site/activity-log.json (daily-program staging copy)
Then commit + push the repo copy as part of the same change.
"""
import argparse
import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

COPIES = [
    os.path.expanduser("~/workspace/zhiolearns-site/activity-log.json"),
    os.path.expanduser("~/workspace/zhiolearns-deploy-site/activity-log.json"),
]


def main():
    ap = argparse.ArgumentParser(description="Append a ZhioLearns activity-log entry")
    ap.add_argument("--actor", required=True, help='e.g. "Muse", "Muse — برنامه روزانه", "ژاله"')
    ap.add_argument("--action", required=True, help='e.g. "افزودن مقاله + انتشار", "ویرایش", "حذف"')
    ap.add_argument("--target", default="", help="page / item / file changed")
    ap.add_argument("--detail", default="", help="short detail")
    ap.add_argument("--commit", default="", help="git commit hash, if any")
    args = ap.parse_args()

    detail = args.detail
    if args.commit:
        detail = (detail + " · commit " + args.commit).strip(" ·")
    entry = {
        "created_at": datetime.now(ZoneInfo("America/Toronto")).isoformat(timespec="seconds"),
        "actor": args.actor,
        "action": args.action,
        "target": args.target,
        "detail": detail,
    }
    for path in COPIES:
        data = {"version": 1, "entries": []}
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        data.setdefault("entries", []).insert(0, entry)
        data["entries"].sort(key=lambda e: e.get("created_at", ""), reverse=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("appended ->", path)
    print(json.dumps(entry, ensure_ascii=False))


if __name__ == "__main__":
    main()
