from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.db import get_db
from core.security import get_current_user
from models.generation import Generation
from models.review_analysis import ReviewAnalysis

router = APIRouter(tags=["ai"])


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    user_id = str(current_user.id)

    total_generations = db.query(func.count(Generation.id)).filter(
        Generation.user_id == user_id
    ).scalar() or 0

    total_analyses = db.query(func.count(ReviewAnalysis.id)).filter(
        ReviewAnalysis.user_id == user_id
    ).scalar() or 0

    recent_generations = (
        db.query(Generation)
        .filter(Generation.user_id == user_id)
        .order_by(Generation.created_at.desc())
        .limit(5)
        .all()
    )

    last_analysis = (
        db.query(ReviewAnalysis)
        .filter(ReviewAnalysis.user_id == user_id)
        .order_by(ReviewAnalysis.created_at.desc())
        .first()
    )

    return {
        "total_generations": total_generations,
        "total_analyses": total_analyses,
        "recent_generations": [
            {
                "id": str(r.id),
                "headline": r.headline,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recent_generations
        ],
        "last_analysis": {
            "filename": last_analysis.filename,
            "total": last_analysis.total,
            "target_suggestion": last_analysis.target_suggestion,
            "created_at": last_analysis.created_at.isoformat() if last_analysis.created_at else None,
        } if last_analysis else None,
    }
