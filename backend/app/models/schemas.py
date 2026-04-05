from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    history: list[dict] = []
    numbers: list[int] | None = None  # 起卦用，三个数字


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []


class DivinationRequest(BaseModel):
    numbers: list[int] | None = None  # 三个数字，None 则随机生成


class DivinationResponse(BaseModel):
    hexagram_name: str
    hexagram_symbol: str
    upper_trigram: str
    lower_trigram: str
    changing_line: int
    interpretation: str


class HexagramBrief(BaseModel):
    id: int
    name: str
    symbol: str
    description: str


class HexagramExplainRequest(BaseModel):
    text: str  # 要讲解的原文片段


class HexagramExplainResponse(BaseModel):
    explanation: str
