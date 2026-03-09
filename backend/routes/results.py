from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..auth import get_current_user
from ..model.generation import Generation
router = APIRouter()

@router.post("/results")
async def save_result(
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
     target = payload.get("target", "")
     tone = payload.get("tone", "")
     product_desc = payload.get("product_desc", "")
     result_text = payload.get("result_text", "")

     if not target or not tone or not product_desc or not result_text:
         raise HTTPException(status_code=400, detail="필수 값이 비어 있습니다.")
     gen = Generation(
         user_id=current_user.id,
         task="instagram_caption",
         input_json={
             "product_desc": product_desc,
             "target": target,
             "tone": tone,
         },
         output_json={
             "result_text": result_text
         },
         headline=result_text[:80],
         status="completed",
     )

     db.add(gen)
     db.commit()
     db.refresh(gen)

     return {
         "ok": True,
         "id": gen.id,
         "saved": {
             "target": target,
             "tone": tone,
             "product_desc": product_desc,
             "result_text": result_text,
         },
     }