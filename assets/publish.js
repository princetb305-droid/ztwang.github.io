import { escapeHtml, postHeader, renderMarkdown, renderMermaid } from "./markdown.js";

const form = document.querySelector("#publishForm");
const status = document.querySelector("#publishStatus");
const preview = document.querySelector("#preview");
const previewButton = document.querySelector("#previewButton");
const snippetButton = document.querySelector("#snippetButton");
const dateInput = document.querySelector("#date");

dateInput.valueAsDate = new Date();

function setStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`.trim();
}

function formValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `post-${Date.now()}`;
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function collectPost() {
  const title = formValue("title");
  const date = formValue("date");
  return {
    title,
    date,
    summary: formValue("summary"),
    tags: parseTags(formValue("tags")),
    slug: `${date}-${slugify(title)}`,
    content: formValue("content"),
  };
}

async function updatePreview() {
  const post = collectPost();
  preview.innerHTML = `${postHeader(post)}${renderMarkdown(post.content)}`;
  await renderMermaid(preview);
}

async function buildSnippet() {
  const post = collectPost();
  const indexEntry = {
    slug: post.slug,
    title: post.title,
    date: post.date,
    summary: post.summary,
    tags: post.tags,
  };

  const snippet = `Markdown 文件路径:
D:\\blog\\posts\\${post.slug}.md

posts/index.json 中新增:
${JSON.stringify(indexEntry, null, 2)}

发布命令:
cd D:\\blog
git add .
git commit -m "Add ${post.slug}"
git push`;

  preview.innerHTML = `
    ${postHeader(post)}
    ${renderMarkdown(post.content)}
    <h2>本地发布片段</h2>
    <pre><code>${escapeHtml(snippet)}</code></pre>
  `;
  await renderMermaid(preview);
  setStatus("已生成本地文件片段。根据片段创建文件并更新 posts/index.json 后 push。", "success");
}

previewButton.addEventListener("click", updatePreview);
snippetButton.addEventListener("click", buildSnippet);
form.addEventListener("submit", (event) => event.preventDefault());
