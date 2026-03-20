from fastapi import Depends, HTTPException, status
from core.security import get_current_user
from models.user import User


def require_pro(user: User = Depends(get_current_user)) -> User:
    if user.plan != "pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="프로 전용 기능입니다. 플랜을 업그레이드해 주세요.",
        )
    return user
