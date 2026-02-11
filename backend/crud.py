# backend/crud.py
from sqlalchemy.orm import Session
from model.report import Report
from schemas import ReportCreate, ReportUpdate


def create_report(db: Session, data: ReportCreate) -> Report:
    obj = Report(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_reports_by_user(db: Session, user_id: int, limit: int = 50, offset: int = 0) -> list[Report]:
    return (
        db.query(Report)
        .filter(Report.user_id == user_id)
        .order_by(Report.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_report_by_user(db: Session, user_id: int, report_id: int) -> Report | None:
    return (
        db.query(Report)
        .filter(Report.id == report_id, Report.user_id == user_id)
        .first()
    )


def update_report_by_user(db: Session, user_id: int, report_id: int, data: ReportUpdate) -> Report | None:
    obj = get_report_by_user(db, user_id, report_id)
    if not obj:
        return None

    patch = data.model_dump(exclude_unset=True)
    for k, v in patch.items():
        setattr(obj, k, v)

    db.commit()
    db.refresh(obj)
    return obj


def delete_report_by_user(db: Session, user_id: int, report_id: int) -> bool:
    obj = get_report_by_user(db, user_id, report_id)
    if not obj:
        return False

    db.delete(obj)
    db.commit()
    return True
