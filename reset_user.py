import sqlite3

EMAIL = "jeongmookkim@gmail.com"
DB_PATH = "insight.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 테이블 확인
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cur.fetchall()]
print("Tables:", tables)

if "users" not in tables:
    print("❌ users 테이블 없음 — DB 구조 확인 필요")
    conn.close()
    exit()

# 삭제 전
cur.execute("SELECT id, email FROM users WHERE email=?", (EMAIL,))
print("Before:", cur.fetchone())

# 삭제 실행
cur.execute("DELETE FROM users WHERE email=?", (EMAIL,))
conn.commit()

# 삭제 후
cur.execute("SELECT id, email FROM users WHERE email=?", (EMAIL,))
print("After:", cur.fetchone())

conn.close()
print("✅ 유저 삭제 완료")

