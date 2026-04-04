"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import Markdown from "@/components/Markdown";
import { API_BASE, fetchSSE } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      await fetchSSE(
        `${API_BASE}/api/chat/stream`,
        { question, history: messages.slice(-10) },
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
            return updated;
          });
        },
      );
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink tracking-wider">周易问答</h1>
        <div className="w-12 h-px bg-primary/30 mt-2" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-20 animate-ink-in">
            <div className="text-5xl font-serif text-primary/20 mb-4">☰</div>
            <p className="text-lg font-serif text-foreground/60 tracking-wider mb-2">有何疑问，尽管问来</p>
            <p className="text-sm text-muted">试试问：&ldquo;乾卦的核心思想是什么？&rdquo;</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-5 py-3.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-2xl rounded-br-sm"
                  : "bg-card-bg/80 border border-border/60 rounded-2xl rounded-bl-sm"
              }`}
            >
              {msg.role === "user" ? msg.content : <Markdown content={msg.content} />}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start">
            <div className="bg-card-bg/80 border border-border/60 px-5 py-3.5 rounded-2xl rounded-bl-sm text-sm text-muted font-serif">
              正在思考<span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="请输入你的问题..."
          className="flex-1 px-5 py-3 rounded-xl border border-border/60 bg-card-bg/60 text-sm focus:outline-none focus:border-primary/40 transition-colors duration-200"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/85 disabled:opacity-40 transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          <Send size={16} strokeWidth={1.5} />
          <span>发送</span>
        </button>
      </div>
    </div>
  );
}
