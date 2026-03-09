from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/results")
async def save_result(payload: dict):
    target = payload.get("target", "")
    tone = payload.get("tone", "")
    product_desc = payload.get("product_desc", "")
    result_text = payload.get("result_text", "")

    if not target or not tone or not product_desc or not result_text:
        raise HTTPException(status_code=400, detail="필수 값이 비어 있습니다.")

    return {
        "ok": True,
        "id": 1,
        "saved": {
            "target": target,
            "tone": tone,
            "product_desc": product_desc,
            "result_text": result_text,
        },
    }