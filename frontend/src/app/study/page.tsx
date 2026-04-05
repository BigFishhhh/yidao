"use client";

import { useState, useEffect } from "react";
import Markdown from "@/components/Markdown";
import { API_BASE, API_KEY, fetchSSE } from "@/lib/api";

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
    fetch(`${API_BASE}/api/hexagrams`, {
      headers: API_KEY ? { "X-API-Key": API_KEY } : {},
    })
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
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-wider">经典学习</h1>
        <div className="w-12 h-px bg-primary/30 mt-2 mb-3" />
        <p className="text-sm text-muted">点击任意卦象，查看详细讲解</p>
      </div>

      {/* 基础知识 */}
      <div className="p-4 md:p-6 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm mb-6 md:mb-8 text-sm leading-[1.9] text-foreground/80">
        <h3 className="font-serif font-semibold text-ink mb-3 tracking-wide">什么是卦？</h3>
        <p className="mb-3">
          周易的基本符号是<strong className="text-ink">阳爻（⚊）</strong>和<strong className="text-ink">阴爻（⚋）</strong>，分别代表刚与柔、动与静。
          每三根爻叠在一起，组成一个<strong className="text-ink">三爻卦（八卦）</strong>：
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mb-3 font-serif text-foreground/70">
          <span>☰ 乾（天）</span><span>☷ 坤（地）</span>
          <span>☵ 坎（水）</span><span>☲ 离（火）</span>
          <span>☳ 震（雷）</span><span>☶ 艮（山）</span>
          <span>☴ 巽（风）</span><span>☱ 兑（泽）</span>
        </div>
        <p className="mb-3">
          将两个八卦上下相叠，就得到一个<strong className="text-ink">六爻卦</strong>。上面的叫<strong className="text-ink">上卦（外卦）</strong>，代表外在环境；下面的叫<strong className="text-ink">下卦（内卦）</strong>，代表自身状态。8 × 8 = 64，这就是周易的<strong className="text-ink">六十四卦</strong>。
        </p>
        <p className="text-foreground/60 text-xs">
          下方是全部六十四卦，点击任意一卦即可查看卦辞、爻辞及白话讲解。
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6 md:mb-8">
        {hexagrams.map((h) => (
          <button
            key={h.id}
            onClick={() => handleSelect(h)}
            className={`p-2 md:p-2.5 rounded-lg border text-center transition-all duration-200 cursor-pointer hover:bg-card-bg/80 ${
              selected?.id === h.id
                ? "border-primary/40 bg-card-bg/80"
                : "border-border/40 bg-transparent"
            }`}
          >
            <div className="text-xl md:text-2xl leading-none">{h.symbol}</div>
            <div className="text-[10px] mt-1 md:mt-1.5 text-muted">{h.name}</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="p-5 md:p-8 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm animate-ink-in">
          <div className="flex items-center gap-3 md:gap-4 mb-5">
            <span className="text-4xl md:text-5xl">{selected.symbol}</span>
            <div>
              <h2 className="text-lg md:text-xl font-serif font-bold text-ink tracking-wider">{selected.name}</h2>
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
