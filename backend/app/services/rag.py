import chromadb
from sentence_transformers import SentenceTransformer
from app.config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL

# 延迟初始化，避免导入时就加载模型
_embedding_model = None
_chroma_client = None
_collection = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    return _embedding_model


def get_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        _collection = _chroma_client.get_or_create_collection(
            name="zhouyi",
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


class EmbeddingFunction:
    """Chroma 自定义 embedding 函数"""
    def __call__(self, input: list[str]) -> list[list[float]]:
        model = get_embedding_model()
        embeddings = model.encode(input)
        return embeddings.tolist()


def search(query: str, top_k: int = 5) -> list[dict]:
    """检索与 query 最相关的文档片段"""
    collection = get_collection()
    if collection.count() == 0:
        return []

    model = get_embedding_model()
    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(top_k, collection.count()),
    )

    docs = []
    for i in range(len(results["documents"][0])):
        docs.append({
            "content": results["documents"][0][i],
            "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
            "distance": results["distances"][0][i] if results["distances"] else None,
        })
    return docs


def build_context(docs: list[dict]) -> str:
    """将检索结果拼接为上下文字符串"""
    parts = []
    for doc in docs:
        source = doc["metadata"].get("source", "未知来源")
        parts.append(f"【{source}】\n{doc['content']}")
    return "\n\n---\n\n".join(parts)
