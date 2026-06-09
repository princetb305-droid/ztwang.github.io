import { escapeHtml, postHeader, renderMarkdown } from "./markdown.js";

const form = document.querySelector("#publishForm");
const status = document.querySelector("#publishStatus");
const preview = document.querySelector("#preview");
const previewButton = document.querySelector("#previewButton");
const submitButton = document.querySelector("#submitButton");
const dateInput = document.querySelector("#date");

dateInput.valueAsDate = new Date();

const textEncoder = new TextEncoder();

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
  const content = formValue("content");
  return {
    title,
    date,
    summary: formValue("summary"),
    tags: parseTags(formValue("tags")),
    slug: `${date}-${slugify(title)}`,
    content,
  };
}

function normalizeSitePath(value) {
  return value.replace(/^\/+|\/+$/g, "");
}

function repoPath(sitePath, path) {
  const cleanSitePath = normalizeSitePath(sitePath);
  return cleanSitePath ? `${cleanSitePath}/${path}` : path;
}

function toBase64(content) {
  const bytes = textEncoder.encode(content);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || `GitHub 请求失败：${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function getFile({ owner, repo, branch, token, path }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`;
  try {
    return await githubRequest(url, token);
  } catch (error) {
    if (/not found/i.test(error.message)) return null;
    throw error;
  }
}

async function createBlob({ owner, repo, token, content }) {
  return githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: toBase64(content),
      encoding: "base64",
    }),
  });
}

async function createCommitWithFiles({ owner, repo, branch, token, files, message }) {
  const ref = await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    token,
  );
  const baseCommitSha = ref.object.sha;
  const baseCommit = await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
    token,
  );

  const treeEntries = [];
  for (const file of files) {
    const blob = await createBlob({ owner, repo, token, content: file.content });
    treeEntries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const tree = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/trees`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: treeEntries,
    }),
  });

  const commit = await githubRequest(`https://api.github.com/repos/${owner}/${repo}/git/commits`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [baseCommitSha],
    }),
  });

  await githubRequest(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    token,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sha: commit.sha,
        force: false,
      }),
    },
  );

  return commit;
}

function decodeBase64Utf8(value) {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function updatePreview() {
  const post = collectPost();
  preview.innerHTML = `${postHeader(post)}${renderMarkdown(post.content)}`;
}

async function publish(event) {
  event.preventDefault();
  submitButton.disabled = true;
  setStatus("正在校验 GitHub 账号...");

  const owner = formValue("repoOwner");
  const repo = formValue("repoName");
  const branch = formValue("repoBranch");
  const sitePath = formValue("sitePath");
  const token = formValue("githubToken");
  const post = collectPost();
  const articlePath = repoPath(sitePath, `posts/${post.slug}.md`);
  const indexPath = repoPath(sitePath, "posts/index.json");

  try {
    const viewer = await githubRequest("https://api.github.com/user", token);
    if (viewer.login.toLowerCase() !== owner.toLowerCase()) {
      throw new Error(`当前 token 属于 ${viewer.login}，不是仓库 owner ${owner}`);
    }

    setStatus("正在读取仓库索引...");
    const indexFile = await getFile({ owner, repo, branch, token, path: indexPath });
    const existingPosts = indexFile ? JSON.parse(decodeBase64Utf8(indexFile.content)) : [];

    if (existingPosts.some((item) => item.slug === post.slug)) {
      throw new Error("这个标题和日期生成的 slug 已存在，请修改标题或日期");
    }

    const nextPosts = [
      {
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
        tags: post.tags,
      },
      ...existingPosts,
    ].sort((a, b) => b.date.localeCompare(a.date));

    const message = `Publish blog post: ${post.title}`;

    setStatus("正在创建 GitHub 提交...");
    await createCommitWithFiles({
      owner,
      repo,
      branch,
      token,
      message,
      files: [
        {
          path: articlePath,
          content: post.content,
        },
        {
          path: indexPath,
          content: `${JSON.stringify(nextPosts, null, 2)}\n`,
        },
      ],
    });

    setStatus("发布成功。GitHub Pages 稍后会自动更新。", "success");
    form.reset();
    dateInput.valueAsDate = new Date();
    preview.innerHTML = '<p class="empty-state">点击“预览”查看渲染效果。</p>';
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

previewButton.addEventListener("click", updatePreview);
form.addEventListener("submit", publish);
