import os

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from core.db import get_db
from models.user import User

router = APIRouter(tags=["admin"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "insightflow-admin-2026")


@router.patch("/user/{user_id}/plan")
def update_user_plan(
    user_id: str,
    plan: str,
    db: Session = Depends(get_db),
    x_admin_secret: str = Header(default=""),
):
    """사용자의 플랜을 변경합니다. (관리자 전용)"""
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="관리자 인증이 필요합니다.")

    if plan not in ("basic", "pro"):
        raise HTTPException(status_code=400, detail="plan은 'basic' 또는 'pro'만 가능합니다.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    user.plan = plan
    db.commit()

    return {"ok": True, "user_id": user_id, "plan": plan}
