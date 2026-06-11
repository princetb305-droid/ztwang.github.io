import { escapeHtml, postHeader, renderMarkdown, renderMermaid } from "./markdown.js";

const article = document.querySelector("#article");
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

async function loadArticle() {
  if (!slug) {
    article.innerHTML = '<p class="empty-state">缺少文章 slug。</p>';
    return;
  }

  try {
    const indexResponse = await fetch("posts/index.json", { cache: "no-store" });
    if (!indexResponse.ok) throw new Error("文章索引加载失败");
    const posts = await indexResponse.json();
    const post = posts.find((item) => item.slug === slug);
    if (!post) throw new Error("没有找到这篇文章");

    const articleResponse = await fetch(`posts/${encodeURIComponent(slug)}.md`, {
      cache: "no-store",
    });
    if (!articleResponse.ok) throw new Error("文章正文加载失败");
    const content = await articleResponse.text();

    document.title = `${post.title} - ztwang`;
    article.innerHTML = `${postHeader({ ...post, content })}${renderMarkdown(content)}`;
    await renderMermaid(article);
  } catch (error) {
    article.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}。</p>`;
  }
}

loadArticle();
