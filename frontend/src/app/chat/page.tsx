"use client";

import { useState, useRef, useEffect } from "react";
import { Send, BookOpen, Hexagon, Hash, Shuffle } from "lucide-react";
import Markdown from "@/components/Markdown";
import { API_BASE, fetchSSE } from "@/lib/api";

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

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  divination?: DivinationMeta;
  guideCard?: boolean;
}

function DivinationCard({ meta, interpretation, loading }: { meta: DivinationMeta; interpretation: string; loading: boolean }) {
  return (
    <div className="p-4 md:p-6 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm animate-ink-in">
      <div className="text-center mb-4">
        <div className="text-3xl md:text-5xl mb-3">{meta.hexagram_symbol}</div>
        <h3 className="text-lg md:text-xl font-serif font-bold text-ink tracking-wider">
          {meta.hexagram_description}（{meta.hexagram_name}卦）
        </h3>
      </div>
      <div className="bg-paper-dark/40 rounded-lg p-3 md:p-4 mb-4 text-sm leading-[1.8]">
        <p className="text-foreground/80 mb-2">
          随机起卦，所用数字为
          <span className="font-serif font-semibold text-primary"> {meta.numbers[0]}</span>、
          <span className="font-serif font-semibold text-primary">{meta.numbers[1]}</span>、
          <span className="font-serif font-semibold text-primary">{meta.numbers[2]}</span>：
        </p>
        <ul className="space-y-1 text-foreground/75 ml-1">
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
      </div>
      <div className="divider-ink mb-4" />
      <div>
        <h4 className="text-sm font-serif font-semibold text-primary mb-3 tracking-wider">卦象解读</h4>
        <div className="text-sm leading-relaxed">
          {interpretation ? (
            <Markdown content={interpretation} />
          ) : loading ? (
            <span className="text-muted font-serif">正在生成解读<span className="animate-pulse">...</span></span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DivineGuideCard({ onSubmitNumbers, onRandom, disabled }: {
  onSubmitNumbers: (nums: number[]) => void;
  onRandom: () => void;
  disabled: boolean;
}) {
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [n3, setN3] = useState("");

  return (
    <div className="p-4 md:p-6 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm animate-ink-in">
      <p className="font-serif text-ink text-sm leading-relaxed mb-4">
        请先在心中默想你所问之事，集中念头片刻……<br />
        <span className="text-muted text-xs">心诚则灵，想好之后选择起卦方式：</span>
      </p>
      <div className="mb-4">
        <p className="text-xs text-muted mb-2 tracking-wide">输入三个数字（1-999），以数起卦：</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { value: n1, setter: setN1, label: "第一个数" },
            { value: n2, setter: setN2, label: "第二个数" },
            { value: n3, setter: setN3, label: "第三个数" },
          ].map((item, i) => (
            <input
              key={i}
              type="number"
              value={item.value}
              onChange={(e) => item.setter(e.target.value)}
              placeholder={item.label}
              min="1"
              max="999"
              className="w-full px-2 py-2 rounded-lg border border-border/60 bg-paper/40 text-center text-sm font-serif focus:outline-none focus:border-primary/40 transition-colors duration-200"
            />
          ))}
        </div>
        <button
          onClick={() => onSubmitNumbers([parseInt(n1), parseInt(n2), parseInt(n3)])}
          disabled={disabled || !n1 || !n2 || !n3}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/85 disabled:opacity-40 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <Hash size={14} strokeWidth={1.5} />
          以数起卦
        </button>
      </div>
      <div className="relative flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs text-muted">或</span>
        <div className="flex-1 h-px bg-border/40" />
      </div>
      <button
        onClick={onRandom}
        disabled={disabled}
        className="w-full py-2.5 rounded-xl border border-primary/60 text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-40 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
      >
        <Shuffle size={14} strokeWidth={1.5} />
        随机起卦
      </button>
    </div>
  );
}

const DIVINE_KEYWORDS = /起卦|算一卦|算卦|占卜|卜一卦|卜卦|来一卦|测一卦|求一卦|抽一卦/;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStream(url: string, body: object, userContent: string) {
    const userMsg: Message = { role: "user", content: userContent };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    let isFirstChunk = true;
    try {
      await fetchSSE(url, body, (chunk) => {
        if (isFirstChunk && typeof chunk === "object") {
          const obj = chunk as Record<string, unknown>;
          if (obj.type === "divination") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                divination: chunk as unknown as DivinationMeta,
              };
              return updated;
            });
          } else if ("sources" in obj) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                sources: (chunk as { sources: string[] }).sources,
              };
              return updated;
            });
          }
          isFirstChunk = false;
          return;
        }
        isFirstChunk = false;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        });
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "抱歉，服务暂时不可用，请稍后再试。",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    const question = input.trim();
    if (!question || loading) return;
    // 关键词触发起卦引导
    if (DIVINE_KEYWORDS.test(question)) {
      setInput("");
      setMessages((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: "", guideCard: true },
      ]);
      return;
    }
    handleStream(
      `${API_BASE}/api/chat/stream`,
      { question, history: messages.filter((m) => !m.guideCard).slice(-10) },
      question,
    );
  }

  function handleDivine() {
    if (loading) return;
    // 插入引导卡片
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "起卦" },
      { role: "assistant", content: "", guideCard: true },
    ]);
  }

  function doDivine(numbers?: number[]) {
    if (loading) return;
    // 移除引导卡片
    setMessages((prev) => prev.filter((m) => !m.guideCard));
    const body: { question: string; history: { role: string; content: string }[]; numbers?: number[] } = {
      question: "起卦",
      history: messages.filter((m) => !m.guideCard).slice(-10),
    };
    if (numbers) body.numbers = numbers;
    handleStream(
      `${API_BASE}/api/chat/divine`,
      body,
      numbers ? `以数起卦：${numbers.join("、")}` : "随机起卦",
    );
  }

  const lastMsg = messages[messages.length - 1];
  const showThinking = loading && lastMsg?.content === "" && !lastMsg?.divination;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-wider">
          周易问答
        </h1>
        <div className="w-12 h-px bg-primary/30 mt-2" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-16 md:py-20 animate-ink-in">
            <div className="text-4xl md:text-5xl font-serif text-primary/20 mb-4">☰</div>
            <p className="text-base md:text-lg font-serif text-foreground/60 tracking-wider mb-2">
              有何疑问，尽管问来
            </p>
            <p className="text-sm text-muted">
              试试问：&ldquo;乾卦的核心思想是什么？&rdquo; 或直接点击起卦
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={
                msg.role === "user"
                  ? "max-w-[85%] md:max-w-[80%] px-4 md:px-5 py-3 md:py-3.5 text-sm leading-relaxed bg-primary text-white rounded-2xl rounded-br-sm"
                  : msg.divination || msg.guideCard
                    ? "w-full"
                    : "max-w-[85%] md:max-w-[80%] px-4 md:px-5 py-3 md:py-3.5 text-sm leading-relaxed bg-card-bg/80 border border-border/60 rounded-2xl rounded-bl-sm"
              }
            >
              {msg.role === "user" ? (
                msg.content
              ) : msg.guideCard ? (
                <DivineGuideCard
                  onSubmitNumbers={(nums) => doDivine(nums)}
                  onRandom={() => doDivine()}
                  disabled={loading}
                />
              ) : msg.divination ? (
                <DivinationCard
                  meta={msg.divination}
                  interpretation={msg.content}
                  loading={loading && i === messages.length - 1}
                />
              ) : (
                <>
                  <Markdown content={msg.content} />
                  {msg.sources && msg.sources.length > 0 && msg.content && (
                    <div className="mt-3 pt-3 border-t border-border/40">
                      <div className="flex items-center gap-1.5 text-xs text-muted mb-1.5">
                        <BookOpen size={12} strokeWidth={1.5} />
                        <span>参考典籍</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-0.5 rounded-md bg-primary/5 text-primary/70 font-serif"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {showThinking && (
          <div className="flex justify-start">
            <div className="bg-card-bg/80 border border-border/60 px-4 md:px-5 py-3 md:py-3.5 rounded-2xl rounded-bl-sm text-sm text-muted font-serif">
              正在思考<span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 md:gap-3">
        <button
          onClick={handleDivine}
          disabled={loading}
          className="px-3 md:px-4 py-3 rounded-xl border border-primary/60 text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-40 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
          title="起卦"
        >
          <Hexagon size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">起卦</span>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="请输入你的问题..."
          className="flex-1 px-4 md:px-5 py-3 rounded-xl border border-border/60 bg-card-bg/60 text-sm focus:outline-none focus:border-primary/40 transition-colors duration-200"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 md:px-5 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/85 disabled:opacity-40 transition-all duration-200 cursor-pointer flex items-center gap-1.5 md:gap-2"
        >
          <Send size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">发送</span>
        </button>
      </div>
    </div>
  );
}
