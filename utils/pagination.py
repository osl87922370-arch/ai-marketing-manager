import base64
import json
from datetime import datetime
from typing import Tuple

def encode_cursor(created_at: datetime, id_: str) -> str:
    payload = {"created_at": created_at.isoformat(), "id": id_}
    raw = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")

def decode_cursor(cursor: str) -> Tuple[datetime, str]:
    raw = base64.urlsafe_b64decode(cursor.encode("utf-8"))
    payload = json.loads(raw.decode("utf-8"))
    return datetime.fromisoformat(payload["created_at"]), payload["id"]
