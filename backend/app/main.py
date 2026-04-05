from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import chat, divination, study
from app.config import APP_API_KEY
import os

app = FastAPI(title="周易 AI 问答系统", version="0.1.0")

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    # 跳过非 /api 路径、OPTIONS 预检、文档页
    if (
        not request.url.path.startswith("/api")
        or request.method == "OPTIONS"
    ):
        return await call_next(request)

    if APP_API_KEY and request.headers.get("X-API-Key") != APP_API_KEY:
        return JSONResponse(status_code=401, content={"detail": "无效的 API Key"})

    return await call_next(request)

app.include_router(chat.router, prefix="/api", tags=["问答"])
app.include_router(divination.router, prefix="/api", tags=["起卦"])
app.include_router(study.router, prefix="/api", tags=["学习"])


@app.get("/")
async def root():
    return {"message": "周易 AI 问答系统 API", "docs": "/docs"}
