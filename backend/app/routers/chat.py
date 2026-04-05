from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.services import rag, llm
from app.services.divination import cast_hexagram
import json

router = APIRouter()


def _build_divine_prompt(result: dict) -> str:
    return f"""请解读以下卦象：
卦名：{result['hexagram_description']}（{result['hexagram_name']}）
上卦：{result['upper_trigram']}（{result['upper_nature']}）
下卦：{result['lower_trigram']}（{result['lower_nature']}）
动爻：第{result['changing_line']}爻

请严格按照以下结构输出：

## 总论
用通俗易懂的语言，先给出此卦对问卦者最核心的启示和建议（3-5句话），让读者一眼看到结论。

## 卦辞解读
引用卦辞原文，再用白话文逐句翻译解释。

## 动爻解读
引用第{result['changing_line']}爻爻辞原文，再用白话文逐句翻译解释。

## 象传·彖传
先用一两句话简要说明什么是象传（解释卦象寓意）和彖传（解释卦辞含义），然后结合本卦的象传、彖传进行分析。

注意：所有古文原文都必须附带白话文翻译，确保没有古文基础的读者也能完全理解。"""


def _build_divine_meta(result: dict) -> dict:
    return {
        "type": "divination",
        "hexagram_name": result["hexagram_name"],
        "hexagram_symbol": result["hexagram_symbol"],
        "hexagram_description": result["hexagram_description"],
        "upper_trigram": result["upper_trigram"],
        "lower_trigram": result["lower_trigram"],
        "upper_nature": result["upper_nature"],
        "lower_nature": result["lower_nature"],
        "changing_line": result["changing_line"],
        "numbers": result["numbers"],
    }


async def _divine_stream_generator(result: dict):
    """起卦流式生成器，chat/divine 和 chat/stream 关键词触发共用"""
    query = f"{result['hexagram_description']} {result['hexagram_name']}卦 第{result['changing_line']}爻"
    docs = rag.search(query)
    context = rag.build_context(docs)
    prompt = _build_divine_prompt(result)
    meta = json.dumps(_build_divine_meta(result), ensure_ascii=False)

    yield f"data: {meta}\n\n"
    async for chunk in llm.chat_completion_stream(question=prompt, context=context):
        yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
    yield "data: [DONE]\n\n"


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
    sources = list(set(d["metadata"].get("source", "") for d in docs if d["metadata"].get("source")))

    async def generate():
        # 先发送引用来源元数据
        meta = json.dumps({"sources": sources}, ensure_ascii=False)
        yield f"data: {meta}\n\n"
        async for chunk in llm.chat_completion_stream(
            question=req.question,
            context=context,
            history=req.history,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.post("/chat/divine")
async def chat_divine(req: ChatRequest):
    """问答中的起卦端点，支持指定数字或随机起卦"""
    result = cast_hexagram(req.numbers)
    return StreamingResponse(_divine_stream_generator(result), media_type="text/event-stream")
