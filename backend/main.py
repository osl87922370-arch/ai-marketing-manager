# backend/main.py
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import crud
from auth import create_access_token, get_current_user
from db import get_db
from schemas import Token, UserCreate, UserOut, ReportCreate, ReportOut, ReportUpdate

app = FastAPI()


# ---------- AUTH ----------
@app.post("/api/auth/register", response_model=UserOut)
def register(data: UserCreate, db: Session = Depends(get_db)):
    exists = crud.get_user_by_email(db, email=data.email)
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, data)


@app.post("/api/auth/token", response_model=Token)
def login_token(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # OAuth2PasswordRequestForm: username 필드를 email로 사용
    user = crud.authenticate_user(db, email=form.username, password=form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token(subject=user.email)
    return Token(access_token=token)


@app.get("/api/auth/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user


# ---------- REPORTS (USER-SCOPED) ----------
def _assert_owner(path_user_id: int, current_user):
    if current_user.id != path_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")


@app.post("/api/users/{user_id}/reports", response_model=ReportOut)
def create_report(user_id: int, data: ReportCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _assert_owner(user_id, current_user)
    return crud.create_report_for_user(db, user_id=user_id, data=data)


@app.get("/api/users/{user_id}/reports", response_model=list[ReportOut])
def list_reports(user_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _assert_owner(user_id, current_user)
    return crud.list_reports_by_user(db, user_id=user_id, limit=limit, offset=offset)


@app.get("/api/users/{user_id}/reports/{report_id}", response_model=ReportOut)
def get_report(user_id: int, report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _assert_owner(user_id, current_user)
    obj = crud.get_report_by_user(db, user_id=user_id, report_id=report_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Report not found")
    return obj


@app.put("/api/users/{user_id}/reports/{report_id}", response_model=ReportOut)
def update_report(user_id: int, report_id: int, data: ReportUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _assert_owner(user_id, current_user)
    obj = crud.update_report_by_user(db, user_id=user_id, report_id=report_id, data=data)
    if not obj:
        raise HTTPException(status_code=404, detail="Report not found")
    return obj


@app.delete("/api/users/{user_id}/reports/{report_id}")
def delete_report(user_id: int, report_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _assert_owner(user_id, current_user)
    ok = crud.delete_report_by_user(db, user_id=user_id, report_id=report_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"ok": True}
