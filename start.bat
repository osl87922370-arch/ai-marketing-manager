@echo off
chcp 65001 > nul
title AI 마케팅 팀장 - 서버 시작

echo ============================
echo  AI 마케팅 팀장 서버 시작
echo ============================

set ROOT=%~dp0
set FRONTEND=%~dp0frontend

:: 기존 포트 점유 프로세스 종료
echo [1/4] 기존 프로세스 정리 중...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8003 "') do (
    taskkill /PID %%a /F > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%a /F > nul 2>&1
)

:: pycache 삭제
echo [2/4] 백엔드 캐시 정리 중...
for /d /r "%ROOT%" %%d in (__pycache__) do (
    if exist "%%d" rd /s /q "%%d" 2>nul
)

:: 백엔드 시작
echo [3/4] 백엔드 시작 (http://localhost:8003)...
start "Backend - FastAPI :8003" cmd /k "cd /d "%ROOT%" && uvicorn main:app --port 8003"

:: 잠시 대기
timeout /t 2 /nobreak > nul

:: 프론트엔드 시작
echo [4/4] 프론트엔드 시작 (http://localhost:3000)...
start "Frontend - Next.js :3000" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo.
echo ============================
echo  서버 시작 완료!
echo  백엔드:   http://localhost:8003
echo  프론트:   http://localhost:3000
echo ============================
echo.
pause
