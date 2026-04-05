"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Hexagon, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: Home },
  { href: "/chat", label: "问答", icon: MessageCircle },
  { href: "/divination", label: "起卦", icon: Hexagon },
  { href: "/study", label: "学习", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2">
          <span className="text-lg md:text-xl font-serif font-bold text-primary tracking-[0.2em] group-hover:text-primary-light transition-colors duration-200">
            易道
          </span>
        </Link>
        <div className="flex gap-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2.5 md:px-4 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-primary bg-primary/5 font-medium"
                    : "text-muted hover:text-foreground hover:bg-card-bg/60"
                }`}
              >
                <Icon size={16} strokeWidth={1.5} />
                <span className="hidden sm:inline tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
