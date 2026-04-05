# 易道 - 周易 AI 问答系统

基于 RAG（检索增强生成）的周易垂直领域 AI 问答系统。

## 技术栈

- 后端：Python + FastAPI + Chroma + DeepSeek API
- 前端：Next.js + TypeScript + Tailwind CSS

## 快速开始

### 本地开发

#### 1. 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY 和 APP_API_KEY

pip install -r requirements.txt
uvicorn app.main:app --reload
```

API 文档：http://localhost:8000/docs

> 所有 `/api` 开头的接口请求需要在请求头中携带 `X-API-Key: your-app-api-key`

#### 2. 导入知识库

将书籍文本文件（.txt/.md）放入 `backend/data/books/` 目录，然后运行：

```bash
cd backend
python -m scripts.ingest
```

#### 3. 前端

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_KEY 必须与后端 APP_API_KEY 一致

npm install
npm run dev
```

访问：http://localhost:3000

### Docker 一键部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY、APP_API_KEY 和 CORS_ORIGINS（你的域名）

# 2. 编辑 nginx 配置，将 your-domain.com 替换为你的域名
vim nginx/nginx.conf

# 3. 一键启动（首次启动会自动导入知识库）
docker compose up -d --build
```

#### 更新知识库

书籍有更新时，重新导入：

```bash
# 方式一：重启时触发
docker compose run --rm -e REINGEST=1 backend

# 方式二：在运行中的容器内执行
docker compose exec backend python -m scripts.ingest
```

#### HTTPS

编辑 `nginx/nginx.conf`，取消 SSL 相关注释，将证书放入 `nginx/ssl/` 目录，然后在 `docker-compose.yml` 中取消 443 端口和 ssl 卷的注释。

## 功能

- **周易问答**：基于经典文献的智能问答，回复附带参考典籍来源
  - 支持在对话中直接起卦（点击起卦按钮或输入"算一卦"等关键词自动触发）
  - 起卦结果以卦象卡片形式嵌入对话流，包含卦象、起卦过程和流式解读
- **起卦解卦**：梅花易数三数起卦法，支持手动输入或随机起卦，AI 结合经典解读（含卦辞、爻辞、象传·彖传）
- **经典学习**：六十四卦浏览与 AI 讲解，含八卦基础知识介绍
- **全端流式输出**：所有 AI 回复均通过 SSE 实时流式展示
- **移动端适配**：全页面响应式布局

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
