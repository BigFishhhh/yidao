from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import DivinationRequest, DivinationResponse
from app.services.divination import cast_hexagram
from app.services import rag, llm
import json

router = APIRouter()


@router.post("/divination", response_model=DivinationResponse)
async def divine(req: DivinationRequest):
    result = cast_hexagram(req.numbers)
    query = f"{result['hexagram_description']} {result['hexagram_name']}卦 第{result['changing_line']}爻"
    docs = rag.search(query)
    context = rag.build_context(docs)
    prompt = f"""请解读以下卦象：
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
结合象传、彖传进行分析。

注意：所有古文原文都必须附带白话文翻译，确保没有古文基础的读者也能完全理解。"""
    interpretation = await llm.chat_completion(question=prompt, context=context)
    return DivinationResponse(
        hexagram_name=result["hexagram_name"],
        hexagram_symbol=result["hexagram_symbol"],
        upper_trigram=result["upper_trigram"],
        lower_trigram=result["lower_trigram"],
        changing_line=result["changing_line"],
        interpretation=interpretation,
    )


@router.post("/divination/stream")
async def divine_stream(req: DivinationRequest):
    result = cast_hexagram(req.numbers)
    query = f"{result['hexagram_description']} {result['hexagram_name']}卦 第{result['changing_line']}爻"
    docs = rag.search(query)
    context = rag.build_context(docs)
    prompt = f"""请解读以下卦象：
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
结合象传、彖传进行分析。

注意：所有古文原文都必须附带白话文翻译，确保没有古文基础的读者也能完全理解。"""

    # 先发送卦象元数据
    meta = json.dumps({
        "hexagram_name": result["hexagram_name"],
        "hexagram_symbol": result["hexagram_symbol"],
        "hexagram_description": result["hexagram_description"],
        "upper_trigram": result["upper_trigram"],
        "lower_trigram": result["lower_trigram"],
        "upper_nature": result["upper_nature"],
        "lower_nature": result["lower_nature"],
        "changing_line": result["changing_line"],
        "numbers": result["numbers"],
    }, ensure_ascii=False)

    async def generate():
        yield f"data: {meta}\n\n"
        async for chunk in llm.chat_completion_stream(question=prompt, context=context):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
