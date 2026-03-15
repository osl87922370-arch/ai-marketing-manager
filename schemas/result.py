from pydantic import BaseModel


class ResultIn(BaseModel):
    user_email: str
    product_desc: str
    target: str
    tone: str
    result_text: str


class ResultOut(BaseModel):
    id: int
