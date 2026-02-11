# backend/main.py (추가/수정)
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from db import SessionLocal  # get_db가 없다면 아래 get_db를 쓰세요
import crud
from schemas import ReportCreate, ReportOut, ReportUpdate

app = FastAPI()


# ✅ get_db가 없어서 ImportError 났던 적이 있었죠.
# db.py에 get_db가 없으면 여기 main.py에 이걸 두면 됩니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/api/users/{user_id}/reports", response_model=ReportOut)
def create_user_report(user_id: int, payload: ReportCreate, db: Session = Depends(get_db)):
    # ✅ URL의 user_id와 body.user_id 불일치 방지
    if payload.user_id != user_id:
        raise HTTPException(status_code=400, detail="user_id mismatch (path vs body)")
    return crud.create_report(db, payload)


@app.get("/api/users/{user_id}/reports", response_model=list[ReportOut])
def list_user_reports(user_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    return crud.list_reports_by_user(db, user_id=user_id, limit=limit, offset=offset)


@app.get("/api/users/{user_id}/reports/{report_id}", response_model=ReportOut)
def get_user_report(user_id: int, report_id: int, db: Session = Depends(get_db)):
    obj = crud.get_report_by_user(db, user_id=user_id, report_id=report_id)
    if not obj:
        raise HTTPException(status_code=404, detail="report not found")
    return obj


@app.patch("/api/users/{user_id}/reports/{report_id}", response_model=ReportOut)
def update_user_report(user_id: int, report_id: int, payload: ReportUpdate, db: Session = Depends(get_db)):
    obj = crud.update_report_by_user(db, user_id=user_id, report_id=report_id, data=payload)
    if not obj:
        raise HTTPException(status_code=404, detail="report not found")
    return obj


@app.delete("/api/users/{user_id}/reports/{report_id}")
def delete_user_report(user_id: int, report_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_report_by_user(db, user_id=user_id, report_id=report_id)
    if not ok:
        raise HTTPException(status_code=404, detail="report not found")
    return {"ok": True}
