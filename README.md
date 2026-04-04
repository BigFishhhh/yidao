# 易道 - 周易 AI 问答系统

基于 RAG（检索增强生成）的周易垂直领域 AI 问答系统。

## 技术栈

- 后端：Python + FastAPI + Chroma + DeepSeek API
- 前端：Next.js + TypeScript + Tailwind CSS

## 快速开始

### 1. 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key

pip install -r requirements.txt
uvicorn app.main:app --reload
```

API 文档：http://localhost:8000/docs

### 2. 导入知识库

将书籍文本文件（.txt/.md）放入 `backend/data/books/` 目录，然后运行：

```bash
cd backend
python -m scripts.ingest
```

### 3. 前端

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:3000

## 功能

- **周易问答**：基于经典文献的智能问答
- **起卦解卦**：三数起卦，AI 结合经典解读
- **原文学习**：六十四卦浏览与 AI 讲解

## 知识库书籍

### 已导入

| 书名 | 作者 | 格式 | 说明 |
|------|------|------|------|
| 《周易正义》 | 王弼 注，孔颖达 疏 | txt | 最权威注本，义理派根基 |
| 《周易本义》 | 朱熹 | txt | 宋代理学视角，流传最广 |
| 《梅花易数》 | 邵雍 | txt | 起卦解卦方法论，占卜功能核心 |
| 《增删卜易》 | 野鹤老人 | txt | 六爻预测经典，实战案例丰富 |
| 《焦氏易林注》 | 焦延寿 | txt | 4096卦变，扩展解卦维度 |
| 《高岛易断》 | 高岛吞象（日本） | txt | 大量真实占卜案例 |
| 《易经杂说》 | 南怀瑾 | txt | 现代白话讲解，通俗易懂 |
| 《御纂周易折中》 | 李光地 | txt | 清代集大成，汇集历代注解 |

### 待补充

| 书名 | 作者 | 推荐出版社 | 说明 |
|------|------|-----------|------|
| 《周易程氏传》 | 程颐 | 中华书局 | 义理派代表，目前仅有扫描版 PDF，需找文字版 |
| 《周易集解》 | 李鼎祚 | 中华书局 | 保存大量汉代象数派解释 |
