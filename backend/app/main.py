from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, divination, study

app = FastAPI(title="周易 AI 问答系统", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api", tags=["问答"])
app.include_router(divination.router, prefix="/api", tags=["起卦"])
app.include_router(study.router, prefix="/api", tags=["学习"])


@app.get("/")
async def root():
    return {"message": "周易 AI 问答系统 API", "docs": "/docs"}
