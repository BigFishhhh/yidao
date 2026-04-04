"use client";

import { useState, useEffect } from "react";
import Markdown from "@/components/Markdown";
import { API_BASE, fetchSSE } from "@/lib/api";

interface Hexagram {
  id: number;
  name: string;
  symbol: string;
  description: string;
}

export default function StudyPage() {
  const [hexagrams, setHexagrams] = useState<Hexagram[]>([]);
  const [selected, setSelected] = useState<Hexagram | null>(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/hexagrams`)
      .then((res) => res.json())
      .then(setHexagrams)
      .catch(() => {});
  }, []);

  async function handleSelect(h: Hexagram) {
    setSelected(h);
    setExplanation("");
    setLoading(true);

    try {
      await fetchSSE(
        `${API_BASE}/api/hexagrams/${h.id}/explain/stream`,
        {},
        (chunk) => {
          setExplanation((prev) => prev + chunk);
        },
        "GET",
      );
    } catch {
      setExplanation("加载失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink tracking-wider">经典学习</h1>
        <div className="w-12 h-px bg-primary/30 mt-2 mb-3" />
        <p className="text-sm text-muted">点击任意卦象，查看详细讲解</p>
      </div>

      <div className="grid grid-cols-8 gap-2 mb-8">
        {hexagrams.map((h) => (
          <button
            key={h.id}
            onClick={() => handleSelect(h)}
            className={`p-2.5 rounded-lg border text-center transition-all duration-200 cursor-pointer hover:bg-card-bg/80 ${
              selected?.id === h.id
                ? "border-primary/40 bg-card-bg/80"
                : "border-border/40 bg-transparent"
            }`}
          >
            <div className="text-2xl leading-none">{h.symbol}</div>
            <div className="text-[10px] mt-1.5 text-muted">{h.name}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="p-8 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm animate-ink-in">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-5xl">{selected.symbol}</span>
            <div>
              <h2 className="text-xl font-serif font-bold text-ink tracking-wider">{selected.name}</h2>
              <p className="text-sm text-muted mt-1">{selected.description}</p>
            </div>
          </div>
          <div className="divider-ink mb-5" />
          <div>
            {loading && !explanation ? (
              <p className="text-muted font-serif">正在生成讲解<span className="animate-pulse">...</span></p>
            ) : (
              <div className="text-sm leading-relaxed">
                <Markdown content={explanation} />
              </div>
            )}
          </div>
        </div>
      )}

      {!selected && hexagrams.length === 0 && (
        <div className="text-center py-20 text-muted animate-ink-in">
          <div className="text-4xl font-serif text-primary/20 mb-4">☰</div>
          <p className="text-lg font-serif tracking-wider">正在加载卦象数据...</p>
          <p className="text-sm mt-2">请确保后端服务已启动</p>
        </div>
      )}
    </div>
  );
}
