import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./insight.db")

# OpenAI
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

# Supabase
SUPABASE_PROJECT_URL: str = os.getenv("SUPABASE_PROJECT_URL", "").rstrip("/")
SUPABASE_JWT_ISS: str = os.getenv("SUPABASE_JWT_ISS", "").rstrip("/")
SUPABASE_JWT_AUD: str = os.getenv("SUPABASE_JWT_AUD", "authenticated")

# Debug
DEBUG_AUTH: bool = os.getenv("DEBUG_AUTH", "false").lower() == "true"
