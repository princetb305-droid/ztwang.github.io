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

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function renderInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+|[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return html;
}

function flushParagraph(lines, html) {
  if (lines.length === 0) return;
  html.push(`<p>${renderInline(lines.join(" "))}</p>`);
  lines.length = 0;
}

function flushList(lines, html) {
  if (lines.length === 0) return;
  html.push("<ul>");
  for (const line of lines) {
    html.push(`<li>${renderInline(line)}</li>`);
  }
  html.push("</ul>");
  lines.length = 0;
}

export function renderMarkdown(markdown = "") {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const paragraph = [];
  const list = [];
  let inCode = false;
  let codeLines = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/g, "");

    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph(paragraph, html);
        flushList(list, html);
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph(paragraph, html);
      flushList(list, html);
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph(paragraph, html);
      flushList(list, html);
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text);
      html.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      continue;
    }

    const quote = /^>\s+(.+)$/.exec(line);
    if (quote) {
      flushParagraph(paragraph, html);
      flushList(list, html);
      html.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      flushParagraph(paragraph, html);
      list.push(listItem[1]);
      continue;
    }

    flushList(list, html);
    paragraph.push(line.trim());
  }

  flushParagraph(paragraph, html);
  flushList(list, html);
  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  return html.join("\n");
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
