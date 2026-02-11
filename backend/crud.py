from sqlalchemy.orm import Session
from model.report import Report
from schemas import ReportCreate

def create_report(db: Session, payload: ReportCreate) -> Report:
    obj = Report(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def list_reports(db: Session, limit: int = 50, offset: int = 0):
    return (
        db.query(Report)
        .order_by(Report.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

def get_report(db: Session, report_id: int):
    return db.query(Report).filter(Report.id == report_id).first()
