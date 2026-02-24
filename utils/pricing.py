from dataclasses import dataclass
from typing import Optional, Dict, Any


@dataclass
class PricingResult:
    credit_used: int
    pricing_version: str
    breakdown: Dict[str, Any]


def calc_credits(
    variant_count: int,
    *,
    base_cost: int = 0,
    per_variant_cost: int = 1,
    multiplier: float = 1.0,
    context: Optional[dict] = None,
) -> PricingResult:
    raw = base_cost + (variant_count * per_variant_cost)
    credit_used = int(round(raw * multiplier))

    breakdown = {
        "base_cost": base_cost,
        "per_variant_cost": per_variant_cost,
        "variant_count": variant_count,
        "multiplier": multiplier,
    }

    if context:
        breakdown["context"] = context

    return PricingResult(
        credit_used=credit_used,
        pricing_version="credits_v1",
        breakdown=breakdown,
    )