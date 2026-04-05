const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export { API_BASE };

export async function fetchSSE(
  url: string,
  body: object,
  onChunk: (text: string | object) => void,
  method: "POST" | "GET" = "POST",
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const options: RequestInit = { method, headers };
  if (method === "POST") {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No readable stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      // chunk 是 JSON 编码的字符串，解析还原换行等字符
      try {
        onChunk(JSON.parse(data));
      } catch {
        onChunk(data);
      }
    }
  }
}
