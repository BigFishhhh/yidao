import Link from "next/link";
import { MessageCircle, Hexagon, BookOpen } from "lucide-react";

const FEATURES = [
  {
    href: "/chat",
    icon: MessageCircle,
    title: "智能问答",
    desc: "基于经典文献的周易智能问答，有问必答",
  },
  {
    href: "/divination",
    icon: Hexagon,
    title: "起卦解卦",
    desc: "三数起卦，AI 结合经典为你详细解读卦象",
  },
  {
    href: "/study",
    icon: BookOpen,
    title: "经典学习",
    desc: "六十四卦原文与白话讲解，系统学习周易",
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6">
      <div className="pt-16 md:pt-24 pb-14 md:pb-20 text-center animate-ink-in">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink tracking-[0.3em] mb-6">
          易道
        </h1>
        <div className="w-16 h-px bg-primary/20 mx-auto mb-6" />
        <p className="text-base md:text-lg font-serif text-muted leading-loose tracking-widest">
          天行健，君子以自强不息
        </p>
        <p className="text-base md:text-lg font-serif text-muted leading-loose tracking-widest">
          地势坤，君子以厚德载物
        </p>
        <p className="text-sm text-primary/60 mt-6 tracking-wider">
          AI 驱动的周易智慧
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-14 md:pb-20">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.href}
              href={f.href}
              className="group block p-6 md:p-8 rounded-xl border border-border/60 bg-card-bg/60 backdrop-blur-sm hover:border-primary/30 hover:bg-card-bg/80 transition-all duration-200 cursor-pointer animate-ink-in"
              style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'backwards' }}
            >
              <Icon size={24} strokeWidth={1.2} className="text-primary/60 mb-4 md:mb-5 group-hover:text-primary transition-colors duration-200" />
              <h2 className="text-lg font-serif font-bold text-ink mb-2 tracking-wider">
                {f.title}
              </h2>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
