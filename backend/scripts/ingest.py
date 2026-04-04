"""
知识库导入脚本
将 data/books/ 下的文本文件切片后导入 Chroma 向量数据库

用法：
    cd backend
    python -m scripts.ingest

支持的文件格式：.txt, .md
"""
import os
import sys
import hashlib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL
from sentence_transformers import SentenceTransformer
import chromadb

BOOKS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "books")
CHUNK_SIZE = 500  # 每个片段的字符数
CHUNK_OVERLAP = 100  # 片段之间的重叠字符数


def extract_book_name(filename: str) -> str:
    """从文件名中提取简短书名"""
    name_map = {
        "周易正义": "周易正义",
        "周易本义": "周易本义",
        "周易程氏传": "周易程氏传",
        "梅花易数": "梅花易数",
        "增删卜易": "增删卜易",
        "周易折中": "周易折中",
        "周易集解": "周易集解",
        "焦氏易林": "焦氏易林注",
        "高岛易断": "高岛易断",
        "易经杂说": "易经杂说",
        "御纂周易折中": "周易折中",
    }
    for key, name in name_map.items():
        if key in filename:
            return name
    # fallback: 取文件名前面的中文部分
    import re
    match = re.match(r"[\u4e00-\u9fff]+", filename)
    return match.group() if match else filename[:20]


def read_files(directory: str) -> list[dict]:
    """读取目录下所有文本文件"""
    documents = []
    for filename in os.listdir(directory):
        if not filename.endswith((".txt", ".md")):
            continue
        filepath = os.path.join(directory, filename)
        # 尝试多种编码
        content = None
        for encoding in ["utf-8", "gbk", "gb18030", "utf-8-sig"]:
            try:
                with open(filepath, "r", encoding=encoding) as f:
                    content = f.read()
                break
            except (UnicodeDecodeError, UnicodeError):
                continue
        if content is None:
            print(f"  跳过（无法解码）: {filename}")
            continue

        book_name = extract_book_name(filename)
        documents.append({
            "filename": filename,
            "book_name": book_name,
            "content": content,
        })
        print(f"  读取: {book_name} ({len(content)} 字)")
    return documents


def chunk_text(text: str, source: str) -> list[dict]:
    """将文本切片"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]

        # 尝试在句号、换行处断开
        if end < len(text):
            for sep in ["。\n", "。", "\n\n", "\n"]:
                last_sep = chunk.rfind(sep)
                if last_sep > CHUNK_SIZE // 2:
                    chunk = chunk[:last_sep + len(sep)]
                    end = start + len(chunk)
                    break

        chunk = chunk.strip()
        if chunk:
            chunk_id = hashlib.md5(f"{source}:{start}".encode()).hexdigest()
            chunks.append({
                "id": chunk_id,
                "content": chunk,
                "metadata": {"source": source, "start": start},
            })

        start = end - CHUNK_OVERLAP
    return chunks


def main():
    print("=" * 50)
    print("周易知识库导入工具")
    print("=" * 50)

    if not os.path.exists(BOOKS_DIR):
        os.makedirs(BOOKS_DIR)
        print(f"\n已创建目录: {BOOKS_DIR}")
        print("请将书籍文本文件（.txt/.md）放入该目录后重新运行")
        return

    files = [f for f in os.listdir(BOOKS_DIR) if f.endswith((".txt", ".md"))]
    if not files:
        print(f"\n{BOOKS_DIR} 目录为空")
        print("请将书籍文本文件（.txt/.md）放入该目录后重新运行")
        return

    # 读取文件
    print("\n[1/3] 读取文件...")
    documents = read_files(BOOKS_DIR)

    # 切片
    print("\n[2/3] 文本切片...")
    all_chunks = []
    for doc in documents:
        chunks = chunk_text(doc["content"], doc["book_name"])
        all_chunks.extend(chunks)
        print(f"  {doc['book_name']} → {len(chunks)} 个片段")

    print(f"\n  总计: {len(all_chunks)} 个片段")

    # 向量化并存入 Chroma
    print("\n[3/3] 向量化并存入数据库...")
    print(f"  加载 embedding 模型: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    collection = client.get_or_create_collection(
        name="zhouyi",
        metadata={"hnsw:space": "cosine"}
    )

    # 分批导入
    batch_size = 100
    for i in range(0, len(all_chunks), batch_size):
        batch = all_chunks[i:i + batch_size]
        texts = [c["content"] for c in batch]
        ids = [c["id"] for c in batch]
        metadatas = [c["metadata"] for c in batch]

        embeddings = model.encode(texts).tolist()

        collection.upsert(
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        print(f"  已导入 {min(i + batch_size, len(all_chunks))}/{len(all_chunks)}")

    print(f"\n导入完成！数据库中共 {collection.count()} 条记录")
    print(f"数据库路径: {CHROMA_PERSIST_DIR}")


if __name__ == "__main__":
    main()
