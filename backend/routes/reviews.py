from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from ..utils.excel_place_reviews import load_reviews_from_excel

router = APIRouter(prefix="/reviews", tags=["reviews"])

FAIL_RATIO_THRESHOLD = 0.30
ERROR_SAMPLE_LIMIT = 20


@router.post("/upload")
async def upload_reviews(file: UploadFile = File(...)):

    filename = file.filename or ""
    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files allowed")

    file_bytes = await file.read()

    print("UPLOAD filename =", filename)
    print("UPLOAD bytes =", len(file_bytes), "first10 =", file_bytes[:10])

    result = load_reviews_from_excel(file_bytes, filename=filename)

    meta = result.get("meta", {})
    total = int(meta.get("total", 0))
    ok = int(meta.get("ok", 0))
    fail = int(meta.get("fail", 0))

    failures = result.get("failures", [])

    response_body = {
        "total": total,
        "ok": ok,
        "fail": fail,
        "errors": failures[:ERROR_SAMPLE_LIMIT],
    }

    fail_ratio = (fail / total) if total > 0 else 0.0

    if fail_ratio >= FAIL_RATIO_THRESHOLD:
        return JSONResponse(status_code=422, content=response_body)

    return response_body