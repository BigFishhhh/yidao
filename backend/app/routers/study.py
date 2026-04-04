from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import HexagramBrief, HexagramExplainRequest, HexagramExplainResponse
from app.services.divination import get_all_hexagrams, HEXAGRAMS
from app.services import rag, llm
import json

router = APIRouter()


@router.get("/hexagrams", response_model=list[HexagramBrief])
async def list_hexagrams():
    hexagrams = get_all_hexagrams()
    return [
        HexagramBrief(
            id=i + 1,
            name=h["name"],
            symbol=h["symbol"],
            description=h["description"],
        )
        for i, h in enumerate(hexagrams)
    ]


@router.get("/hexagrams/{hexagram_id}/explain")
async def explain_hexagram(hexagram_id: int):
    hexagrams = get_all_hexagrams()
    if hexagram_id < 1 or hexagram_id > len(hexagrams):
        return {"error": "卦序号不存在"}
    h = hexagrams[hexagram_id - 1]
    docs = rag.search(f"{h['description']} {h['name']}卦 卦辞 爻辞")
    context = rag.build_context(docs)
    prompt = f"""请详细讲解{h['description']}（{h['name']}卦），要求：
1. 先列出卦辞原文，再逐句用白话文翻译
2. 逐一列出六爻爻辞原文，每条都附白话文翻译
3. 引用象传、彖传原文并翻译
4. 用通俗语言总结此卦的核心思想和在现代生活中的应用

注意：所有古文原文都必须附带白话文翻译，确保没有古文基础的读者也能完全理解。"""
    explanation = await llm.chat_completion(question=prompt, context=context)
    return HexagramExplainResponse(explanation=explanation)


@router.get("/hexagrams/{hexagram_id}/explain/stream")
async def explain_hexagram_stream(hexagram_id: int):
    hexagrams = get_all_hexagrams()
    if hexagram_id < 1 or hexagram_id > len(hexagrams):
        return {"error": "卦序号不存在"}
    h = hexagrams[hexagram_id - 1]
    docs = rag.search(f"{h['description']} {h['name']}卦 卦辞 爻辞")
    context = rag.build_context(docs)
    prompt = f"""请详细讲解{h['description']}（{h['name']}卦），要求：
1. 先列出卦辞原文，再逐句用白话文翻译
2. 逐一列出六爻爻辞原文，每条都附白话文翻译
3. 引用象传、彖传原文并翻译
4. 用通俗语言总结此卦的核心思想和在现代生活中的应用

注意：所有古文原文都必须附带白话文翻译，确保没有古文基础的读者也能完全理解。"""

    async def generate():
        async for chunk in llm.chat_completion_stream(question=prompt, context=context):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/hexagrams/explain-text", response_model=HexagramExplainResponse)
async def explain_text(req: HexagramExplainRequest):
    docs = rag.search(req.text)
    context = rag.build_context(docs)
    prompt = f"请用通俗易懂的语言讲解以下周易原文的含义：\n\n{req.text}"
    explanation = await llm.chat_completion(question=prompt, context=context)
    return HexagramExplainResponse(explanation=explanation)
