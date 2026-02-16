from dotenv import load_dotenv
load_dotenv()

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

# ======================
# App
# ======================

app = FastAPI(debug=True)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================
# OpenAI
# ======================

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not set")

client = OpenAI(api_key=api_key)

# ======================
# Models
# ======================

class GenerateRequest(BaseModel):
    task: str
    input: dict

# ======================
# Health check
# ======================

@app.get("/")
def health():
    return {"status": "ok"}

# ======================
# AI Generate
# ======================

@app.post("/ai/generate")
def generate(req: GenerateRequest):

    if req.task != "copy.generate":
        raise HTTPException(status_code=400, detail="Unsupported task")

    topic = req.input.get("topic", "")
    product = req.input.get("product", "")
    target = req.input.get("target", "")
    tone = req.input.get("tone", "")

    if not topic:
        raise HTTPException(status_code=400, detail="input.topic is required")

    prompt = f"""
You are a marketing copy assistant.

Topic: {topic}
Target: {target}
Product: {product}
Tone: {tone}

Write short promotional copy with CTA.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    text = response.choices[0].message.content or ""

    return {
        "headline": text,
        "body": text,
        "cta": "자세히 보기",
        "hashtags": ["#카페", "#할인", "#이벤트"],
    }




# ======================
# History (임시 더미)
# ======================

@app.get("/api/results")
def results():
    return []

