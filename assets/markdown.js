const escapeMap = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
  ['"', "&quot;"],
  ["'", "&#39;"],
]);

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => escapeMap.get(char));
}

function createRenderer() {
  if (!window.marked) return null;
  const renderer = new window.marked.Renderer();

  renderer.code = (token) => {
    const language = String(token.lang || "").trim().toLowerCase();
    const code = token.text || "";

    if (language === "mermaid") {
      return `<div class="mermaid">${escapeHtml(code)}</div>`;
    }

    const langClass = language ? ` class="language-${escapeHtml(language)}"` : "";
    return `<pre><code${langClass}>${escapeHtml(code)}</code></pre>`;
  };

  return renderer;
}

export function renderMarkdown(markdown = "") {
  if (!window.marked) {
    return `<pre><code>${escapeHtml(markdown)}</code></pre>`;
  }

  const marked = new window.marked.Marked({
    gfm: true,
    breaks: false,
    renderer: createRenderer(),
  });

  return marked.parse(markdown);
}

export async function renderMermaid(root = document) {
  if (!window.mermaid || !root.querySelector(".mermaid")) return;
  window.mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "default",
  });
  await window.mermaid.run({
    nodes: root.querySelectorAll(".mermaid"),
  });
}

export function postHeader(post) {
  const tags = (post.tags || [])
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <header>
      <div class="meta-row">
        <time datetime="${escapeHtml(post.date)}">${formatDate(post.date)}</time>
        <span>${readingTime(post.content || post.summary || "")} min read</span>
      </div>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.summary || "")}</p>
      <div class="tag-row">${tags}</div>
    </header>
  `;
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function readingTime(text) {
  const plain = String(text).trim();
  if (!plain) return 1;
  const latinWords = plain.match(/[A-Za-z0-9_]+/g)?.length || 0;
  const cjkChars = plain.match(/[\u3400-\u9fff]/g)?.length || 0;
  return Math.max(1, Math.ceil((latinWords + cjkChars / 2) / 220));
}
