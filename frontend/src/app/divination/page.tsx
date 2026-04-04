"use client";

import { useState, useEffect, useRef } from "react";
import { Shuffle, Hash } from "lucide-react";
import Markdown from "@/components/Markdown";
import { API_BASE, fetchSSE } from "@/lib/api";

const HEXAGRAM_SYMBOLS = [
  "䷀","䷁","䷂","䷃","䷄","䷅","䷆","䷇",
  "䷈","䷉","䷊","䷋","䷌","䷍","䷎","䷏",
  "䷐","䷑","䷒","䷓","䷔","䷕","䷖","䷗",
  "䷘","䷙","䷚","䷛","䷜","䷝","䷞","䷟",
  "䷠","䷡","䷢","䷣","䷤","䷥","䷦","䷧",
  "䷨","䷩","䷪","䷫","䷬","䷭","䷮","䷯",
  "䷰","䷱","䷲","䷳","䷴","䷵","䷶","䷷",
  "䷸","䷹","䷺","䷻","䷼","䷽","䷾","䷿",
];

interface DivinationMeta {
  hexagram_name: string;
  hexagram_symbol: string;
  hexagram_description: string;
  upper_trigram: string;
  lower_trigram: string;
  upper_nature: string;
  lower_nature: string;
  changing_line: number;
  numbers: number[];
}

const MIN_ANIMATION_MS = 5000;

function CastingAnimation() {
  const [symbol, setSymbol] = useState("䷀");
  const [opacity, setOpacity] = useState(0.3);
  const frameRef = useRef(0);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % HEXAGRAM_SYMBOLS.length;
      setSymbol(HEXAGRAM_SYMBOLS[idx]);
      frameRef.current += 1;
      setOpacity(0.25 + Math.abs(Math.sin(frameRef.current * 0.1)) * 0.45);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center py-16 animate-ink-in">
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle, rgba(139,37,0,${opacity * 0.15}) 0%, transparent 70%)`,
            transform: "scale(2.5)",
          }}
        />
        <div
          className="text-7xl font-serif transition-all duration-150 relative"
          style={{ opacity, color: "#8b2500" }}
        >
          {symbol}
        </div>
      </div>
      <div className="flex gap-3 mt-8 mb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-10 h-0.5 rounded-full bg-primary/40"
            style={{
              animationName: "yarrow-shake",
              animationDuration: `${0.6 + i * 0.15}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
      <p className="text-base font-serif text-muted tracking-[0.25em]">
        卦象推演中
      </p>
    </div>
  );
}

export default function DivinationPage() {
  const [num1, setNum1] = useState("");
  const [num2, setNum2] = useState("");
  const [num3, setNum3] = useState("");
  const [meta, setMeta] = useState<DivinationMeta | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const animDoneRef = useRef(false);
  const metaRef = useRef<DivinationMeta | null>(null);
  const bufferedChunks = useRef<string[]>([]);

  async function handleDivine(useRandom: boolean) {
    setLoading(true);
    setAnimating(true);
    setMeta(null);
    setInterpretation("");
    animDoneRef.current = false;
    metaRef.current = null;
    bufferedChunks.current = [];

    const body: { numbers?: number[] } = {};
    if (!useRandom && num1 && num2 && num3) {
      body.numbers = [parseInt(num1), parseInt(num2), parseInt(num3)];
    }

    let isFirstChunk = true;

    setTimeout(() => {
      animDoneRef.current = true;
      setAnimating(false);
      if (metaRef.current) {
        setMeta(metaRef.current);
      }
      if (bufferedChunks.current.length > 0) {
        setInterpretation(bufferedChunks.current.join(""));
        bufferedChunks.current = [];
      }
    }, MIN_ANIMATION_MS);

    try {
      await fetchSSE(
        `${API_BASE}/api/divination/stream`,
        body,
        (chunk) => {
          if (isFirstChunk && typeof chunk === "object") {
            metaRef.current = chunk as unknown as DivinationMeta;
            if (animDoneRef.current) {
              setMeta(metaRef.current);
            }
            isFirstChunk = false;
            return;
          }
          isFirstChunk = false;
          if (animDoneRef.current) {
            setInterpretation((prev) => prev + chunk);
          } else {
            bufferedChunks.current.push(chunk as string);
          }
        },
      );
    } catch {
      setInterpretation("服务暂时不可用，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink tracking-wider">起卦解卦</h1>
        <div className="w-12 h-px bg-primary/30 mt-2 mb-3" />
        <p className="text-sm text-muted">心中默想所问之事，输入三个数字或随机起卦</p>
      </div>

      <div className="p-8 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm mb-8">
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            { value: num1, setter: setNum1, label: "第一个数" },
            { value: num2, setter: setNum2, label: "第二个数" },
            { value: num3, setter: setNum3, label: "第三个数" },
          ].map((item, i) => (
            <div key={i}>
              <label className="block text-xs text-muted mb-2 tracking-wide">{item.label}</label>
              <input
                type="number"
                value={item.value}
                onChange={(e) => item.setter(e.target.value)}
                placeholder="1-999"
                min="1"
                max="999"
                className="w-full px-3 py-3 rounded-lg border border-border/60 bg-paper/40 text-center text-lg font-serif focus:outline-none focus:border-primary/40 transition-colors duration-200"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => handleDivine(false)}
            disabled={loading || !num1 || !num2 || !num3}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/85 disabled:opacity-40 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Hash size={16} strokeWidth={1.5} />
            以数起卦
          </button>
          <button
            onClick={() => handleDivine(true)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-primary/60 text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-40 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Shuffle size={16} strokeWidth={1.5} />
            随机起卦
          </button>
        </div>
      </div>

      {animating && <CastingAnimation />}

      {meta && (
        <div className="p-8 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm animate-ink-in">
          {/* 卦象标题 */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{meta.hexagram_symbol}</div>
            <h2 className="text-2xl font-serif font-bold text-ink tracking-wider">
              {meta.hexagram_description}（{meta.hexagram_name}卦）
            </h2>
          </div>

          {/* 起卦过程说明 */}
          <div className="bg-paper-dark/40 rounded-lg p-5 mb-6 text-sm leading-[1.8]">
            <h3 className="font-serif font-semibold text-foreground mb-3 tracking-wide">起卦说明</h3>
            <p className="text-foreground/80 mb-2">
              本次使用三数起卦法（梅花易数），所用数字为
              <span className="font-serif font-semibold text-primary"> {meta.numbers[0]}</span>、
              <span className="font-serif font-semibold text-primary">{meta.numbers[1]}</span>、
              <span className="font-serif font-semibold text-primary">{meta.numbers[2]}</span>：
            </p>
            <ul className="space-y-1.5 text-foreground/75 ml-1">
              <li>
                <span className="text-muted">第一个数</span> {meta.numbers[0]} ÷ 8 余 {meta.numbers[0] % 8 || 8} →
                <span className="font-semibold text-foreground/90"> 上卦 {meta.upper_trigram}（{meta.upper_nature}）</span>
              </li>
              <li>
                <span className="text-muted">第二个数</span> {meta.numbers[1]} ÷ 8 余 {meta.numbers[1] % 8 || 8} →
                <span className="font-semibold text-foreground/90"> 下卦 {meta.lower_trigram}（{meta.lower_nature}）</span>
              </li>
              <li>
                <span className="text-muted">第三个数</span> {meta.numbers[2]} ÷ 6 余 {meta.numbers[2] % 6 || 6} →
                <span className="font-semibold text-foreground/90"> 动爻第{meta.changing_line}爻</span>
              </li>
            </ul>
            <p className="text-foreground/65 mt-3 text-xs">
              上卦代表外在环境，下卦代表自身状态，动爻是变化的关键所在，指示事态发展的转折点。
            </p>
          </div>

          <div className="divider-ink mb-6" />

          {/* AI 解读 */}
          <div>
            <h3 className="text-sm font-serif font-semibold text-primary mb-4 tracking-wider">卦象解读</h3>
            <div className="text-sm leading-relaxed">
              {interpretation ? (
                <Markdown content={interpretation} />
              ) : (
                <span className="text-muted font-serif">正在生成解读<span className="animate-pulse">...</span></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
