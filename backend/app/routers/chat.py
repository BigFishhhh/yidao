from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.services import rag, llm
import json

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    docs = rag.search(req.question)
    context = rag.build_context(docs)
    sources = [d["metadata"].get("source", "") for d in docs if d["metadata"].get("source")]
    answer = await llm.chat_completion(
        question=req.question,
        context=context,
        history=req.history,
    )
    return ChatResponse(answer=answer, sources=list(set(sources)))


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    docs = rag.search(req.question)
    context = rag.build_context(docs)

    async def generate():
        async for chunk in llm.chat_completion_stream(
            question=req.question,
            context=context,
            history=req.history,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
