# My Blog

一个参考 Quarto 个人站结构的静态博客，支持在网页中通过 GitHub API 发布文章。

## 本地预览

```powershell
cd D:\blog
python -m http.server 4173
```

打开 <http://localhost:4173>。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，例如 `你的用户名.github.io` 或 `blog`。
2. 把本目录推送到仓库。
3. 在仓库 `Settings -> Pages` 中选择从 `main` 分支根目录部署。

如果你想部署到 `docs/`，把这些文件放入 `docs/`，并在发布页的“发布目录”填写 `docs`。

## 网页内发布文章

发布页地址是 `/publish.html`。

需要准备 GitHub fine-grained personal access token：

- Repository access：只选择你的博客仓库。
- Permissions：`Contents` 设置为 `Read and write`。
- 不要把 token 提交到仓库，也不要写进任何源码文件。

发布时页面会做两层限制：

- 调用 GitHub API 确认 token 对应的 GitHub 用户名等于仓库 owner。
- GitHub 自身会检查 token 是否真的有仓库写权限。

因此只有拥有该博客仓库写权限的 GitHub 账号才能发布。

## 文件结构

```text
.
├── index.html
├── post.html
├── publish.html
├── assets/
│   ├── hero.svg
│   ├── home.js
│   ├── markdown.js
│   ├── post.js
│   ├── publish.js
│   └── styles.css
└── posts/
    ├── index.json
    ├── 2026-06-08-how-this-site-publishes.md
    └── 2026-06-09-welcome.md
```
