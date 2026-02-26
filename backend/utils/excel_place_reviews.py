from openpyxl import load_workbook
from datetime import datetime

import re
from datetime import date

KOREAN_WEEKDAY_PATTERN = re.compile(r"\.(월|화|수|목|금|토|일)$")  # 2.11.화 -> 2.11

def parse_review_date(raw: str, default_year: int) -> date:
    s = (raw or "").strip()
    if not s:
        return date(DEFAULT_YEAR, 1, 1)

    # 1) 요일 제거
    s = KOREAN_WEEKDAY_PATTERN.sub("", s).strip()

    # 2) YYYY.MM.DD / YYYY-MM-DD / YYYY/MM/DD
    m = re.search(r"^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$", s)
    if m:
        y, mo, d = map(int, m.groups())
        return date(y, mo, d)

    # 3) MM.DD / M/D / M-D (공백 허용)
    m = re.search(r"^(\d{1,2})\s*[.\-/]\s*(\d{1,2})$", s)
    if m:
        mo, d = map(int, m.groups())
        return date(DEFAULT_YEAR, mo, d)

    # 4) 2월 11일
    m = re.search(r"^(\d{1,2})\s*월\s*(\d{1,2})\s*일$", s)
    if m:
        mo, d = map(int, m.groups())
        return date(DEFAULT_YEAR, mo, d)

    return date(DEFAULT_YEAR, 1, 1)
def load_reviews_from_excel(file_obj, default_year: int):
    file_obj.seek(0)

    wb = load_workbook(
        file_obj,
        data_only=True,
        read_only=True
    )

    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    print("HEADERS:", rows[0])
    print("FIRST ROW:", rows[1])

    if not rows or len(rows) < 2:
        return []

    headers = [str(h).strip() if h else "" for h in rows[0]]

    results = []

    for row in rows[1:]:
        if not any(row):
            continue

        record = dict(zip(headers, row))

        text = (
            record.get("리뷰")
            or record.get("내용")
            or record.get("review")
            or record.get("text")
        )

        date_val = (
            record.get("날짜")
            or record.get("작성일")
            or record.get("date")
        )

        if not text:
            continue

        raw_str = "" if date_val is None else str(date_val)
        review_date = parse_review_date(raw_str, DEFAULT_YEAR)
        

        results.append({
            "text": str(text).strip(),
            "review_date": review_date
        })

    return results

if __name__ == "__main__":
    from pathlib import Path
    from datetime import datetime
    import json
    from openpyxl import load_workbook

    # =========================
    # 설정 (여기만 바꾸면 됨)
    # =========================
    EXCEL_PATH = Path("../data/가마골리뷰_normalized.xlsx") # ✅ 너 엑셀 경로로 바꾸기
    SHEET_NAME = None  # 예: "Sheet1" / 없으면 첫 시트
    HEADER_ROW = 1     # 헤더가 1행이면 1
    DATE_COL = 3       # 날짜가 C열이면 3 (A=1, B=2, C=3...)
    DEFAULT_YEAR = 2025

    # 실패율 임계치
    FAIL_THRESHOLD = 0.5  # (%)

    # 로그 파일 (JSONL)
    LOG_DIR = Path("logs")
    FAIL_LOG_PATH = LOG_DIR / "excel_place_reviews_failures.jsonl"

    # =========================
    # 실행
    # =========================
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    wb = load_workbook(EXCEL_PATH, data_only=True)
    ws = wb[SHEET_NAME] if SHEET_NAME else wb.active

    total = 0
    ok = 0
    fail = 0
    fail_samples = []  # (row_idx, raw_date, error)

    for row_idx, row in enumerate(
        ws.iter_rows(min_row=HEADER_ROW + 1, values_only=True),
        start=HEADER_ROW + 1
    ):
        total += 1
        raw_date = row[DATE_COL - 1] if len(row) >= DATE_COL else None

        try:
            raw_str = "" if raw_date is None else str(raw_date)
            _ = parse_review_date(raw_str, DEFAULT_YEAR)
            
            ok += 1

        except Exception as e:
            fail += 1

            record = {
                "timestamp": datetime.now().isoformat(timespec="seconds"),
                "file": str(EXCEL_PATH),
                "sheet": ws.title,
                "row_idx": row_idx,
                "raw_date": raw_date,
                "error": repr(e),
            }
            with FAIL_LOG_PATH.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

            if len(fail_samples) < 20:
                fail_samples.append((row_idx, raw_date, repr(e)))

    failure_rate = (fail / total * 100) if total else 0.0

    print("=== Excel Load Smoke Test ===")
    print(f"file: {EXCEL_PATH}")
    print(f"sheet: {ws.title}")
    print(f"total: {total}, ok: {ok}, fail: {fail}, failure_rate: {failure_rate:.3f}%")
    print(f"fail_log: {FAIL_LOG_PATH.resolve()}")

    if fail_samples:
        print("\n--- Fail samples (top 20) ---")
        for r in fail_samples:
            print(r)

    # 품질 게이트
    if failure_rate > FAIL_THRESHOLD:
        raise SystemExit(
            f"FAIL: failure_rate {failure_rate:.3f}% > threshold {FAIL_THRESHOLD}%"
        )

    print("PASS: failure rate within threshold ✅")