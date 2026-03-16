@echo off
echo ========================================
echo Railway 환경변수 자동 설정 스크립트
echo ========================================
echo.

REM Login
echo [1/2] Railway 로그인 중...
railway login

REM Link to project
echo.
echo [2/2] 환경변수 설정 중...
railway variables set SUPABASE_PROJECT_URL="https://aaylcsmtulrxozatygcd.supabase.co"
railway variables set SUPABASE_JWT_ISS="https://aaylcsmtulrxozatygcd.supabase.co/auth/v1"
railway variables set SUPABASE_JWT_AUD="authenticated"
railway variables set SUPABASE_ANON_KEY="(SUPABASE_ANON_KEY를 .env 파일에서 복사하세요)"
railway variables set OPENAI_API_KEY="(OPENAI_API_KEY를 .env 파일에서 복사하세요)"
railway variables set DATABASE_URL="sqlite:///./insight.db"

echo.
echo ========================================
echo 완료! Railway가 자동으로 재배포됩니다.
echo ========================================
pause
