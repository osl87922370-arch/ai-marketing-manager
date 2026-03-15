import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from core.db import get_db
from core.security import get_current_user
from repositories.generation_repository import save_generation
from schemas.generate import (
    Generation,
    GenerateRequest,
    GenerateResponse,
    GenerationOutput,
)
from services.generation_service import build_generation_record, call_llm

router = APIRouter(tags=["ai"])


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    payload: GenerateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t0 = time.time()

    variants, total_tokens, model_used = call_llm(payload)

    latency_ms = int((time.time() - t0) * 1000)

    db_gen, gen_id, usage = build_generation_record(
        payload=payload,
        user_id=str(current_user.id),
        variants=variants,
        model_used=model_used,
        latency_ms=latency_ms,
    )
    usage.total_tokens = total_tokens

    save_generation(db, db_gen)

    generation = Generation(
        id=gen_id,
        status="succeeded",
        created_at=datetime.now(timezone.utc).isoformat(),
        output=GenerationOutput(variants=variants),
        usage=usage,
    )

    return GenerateResponse(
        ok=True,
        request_id=getattr(request.state, "request_id", "req_test"),
        api_version="v1",
        generation=generation,
        error=None,
    )
