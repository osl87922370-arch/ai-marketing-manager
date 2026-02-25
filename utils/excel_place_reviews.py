from typing import List
from datetime import date
import re

from openpyxl import load_workbook

from schemas.place_insights import ReviewRowIn


KOREAN_WEEKDAY_PATTERN = re.compile(r"\.\w+$")  # 2.11.화 → 2.11


from datetime import date
import re

KOREeAN_WEEKDAY_PATTERN = re.compile(r"\.\w+$")  # 2.11.화 -> 2.11


def parse_review_date(raw: str, default_year: int) -> date:
    s = (raw or "").strip()
    if not s:
        return date(default_year, 1, 1)

    # 1) 요일 제거
    s = KOREAN_WEEKDAY_PATTERN.sub("", s).strip()

    # 2) YYYY.MM.DD / YYYY-MM-DD / YYYY/MM/DD
    m = re.search(r"(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})", s)
    if m:
        y, mo, d = map(int, m.groups())
        return date(y, mo, d)

    # 3) M.D / M/D
    m = re.search(r"(\d{1,2})\s*[.\-\/]\s*(\d{1,2})", s)
    if m:
        mo, d = map(int, m.groups())
        return date(default_year, mo, d)

    # 4) 2월 11일
    m = re.search(r"(\d{1,2})\s*월\s*(\d{1,2})\s*일", s)
    if m:
        mo, d = map(int, m.groups())
        return date(default_year, mo, d)

    return date(default_year, 1, 1)
    
   
   