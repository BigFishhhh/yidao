#!/bin/sh
set -e

# 首次启动 或 REINGEST=1 时导入知识库
if [ ! -f "/app/chroma_db/chroma.sqlite3" ] || [ "$REINGEST" = "1" ]; then
    if [ -d "/app/data/books" ]; then
        echo "正在导入知识库..."
        python -m scripts.ingest
        echo "知识库导入完成"
    fi
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
