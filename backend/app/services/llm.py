from openai import OpenAI, AsyncOpenAI
from app.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
async_client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

SYSTEM_PROMPT = """你是一位精通周易的国学大师，拥有深厚的易学功底。你的回答应该：
1. 引用经典原文时，必须紧跟白话文翻译，格式为：原文 → 白话翻译
2. 语言以通俗易懂的现代白话文为主，让没有古文基础的人也能理解
3. 如果涉及卦象解读，要结合卦辞、爻辞、象传、彖传等多角度分析
4. 对于占卜类问题，给出客观的义理分析，避免封建迷信的表述
5. 解释要具体，多举生活中的例子帮助理解"""


async def chat_completion(question: str, context: str = "", history: list[dict] = []) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if context:
        messages.append({
            "role": "system",
            "content": f"以下是相关的经典文献内容，请基于这些内容回答问题：\n\n{context}"
        })

    for msg in history[-10:]:  # 保留最近10轮对话
        messages.append(msg)

    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=2000,
    )
    return response.choices[0].message.content


def _build_messages(question: str, context: str = "", history: list[dict] = []) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context:
        messages.append({
            "role": "system",
            "content": f"以下是相关的经典文献内容，请基于这些内容回答问题：\n\n{context}"
        })
    for msg in history[-10:]:
        messages.append(msg)
    messages.append({"role": "user", "content": question})
    return messages


async def chat_completion_stream(question: str, context: str = "", history: list[dict] = []):
    """流式生成回答，yield 每个文本片段"""
    messages = _build_messages(question, context, history)

    stream = await async_client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=messages,
        temperature=0.7,
        max_tokens=2000,
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
