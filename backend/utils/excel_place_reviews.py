from openpyxl import load_workbook
from datetime import datetime

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

        if isinstance(date_val, datetime):
            review_date = date_val
        elif isinstance(date_val, str) and date_val.strip():
            try:
                review_date = datetime.fromisoformat(date_val)
            except:
                review_date = datetime(default_year, 1, 1)
        else:
            review_date = datetime(default_year, 1, 1)

        results.append({
            "text": str(text).strip(),
            "review_date": review_date
        })

    return results