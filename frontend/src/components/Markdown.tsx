import ReactMarkdown from "react-markdown";

export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-serif font-bold mt-6 mb-3 text-ink tracking-wide">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-serif font-bold mt-5 mb-2 text-ink tracking-wide">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-serif font-semibold mt-4 mb-2 text-foreground">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 leading-[1.9] text-foreground/85">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-[1.9] text-foreground/85">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-ink">{children}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/30 pl-4 my-3 text-muted italic font-serif">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="bg-paper-dark/60 px-1.5 py-0.5 rounded text-sm text-foreground/80">{children}</code>
        ),
        hr: () => (
          <div className="divider-ink my-5" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
