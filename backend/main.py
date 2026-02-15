import os
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI

app = FastAPI(debug=True)

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("OPENAI_API_KEY is not set")

client = OpenAI(api_key=api_key)

ALLOWED_TASKS = {"copy.generate"}


class GenerateRequest(BaseModel):
    task: str
    input: dict


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/ai/generate")
def generate(req: GenerateRequest):
    if req.task not in ALLOWED_TASKS:
        raise HTTPException(status_code=400, detail="Unsupported task")

    prompt = f"""
You are a marketing copy assistant.
Return JSON only.

Input:
{req.input}

Output:
{{"headline":"...","body":"...","hashtags":["..."]}}
""".strip()

    try:
        start = time.time()

        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
        )

        latency = int((time.time() - start) * 1000)

        return {
            "result_raw": response.output_text,
            "meta": {
                "latency_ms": latency,
                "model": "gpt-4o-mini"
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

