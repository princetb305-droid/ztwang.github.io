# ztwang.github.io

这是部署到 `princetb305-droid/ztwang.github.io` 的个人主页与静态博客。

首页参考 <https://yyzhang2025.github.io/> 的组织方式：第一屏是个人简介，下面是教育经历、实践经历、技术方向和项目。文章列表被拆到独立的 `articles.html`，右上角“文章”会直接跳转到文章页。
`publish.html` 现在作为论文与奖项页使用，后续可以直接在页面中替换占位内容。

## 本地预览

```powershell
cd D:\blog
python -m http.server 4173
```

打开 <http://localhost:4173>。

## 推送到 GitHub

```powershell
cd D:\blog
git remote set-url origin https://github.com/princetb305-droid/ztwang.github.io.git
git branch -M main
git add .
git commit -m "Update personal site"
git push -u origin main
```

## 开启 GitHub Pages

进入仓库：

`Settings -> Pages -> Build and deployment`

选择：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/(root)`

保存后访问：

<https://ztwang.github.io>

## 发布新文章

1. 在 `posts/` 下新建 Markdown 文件，例如 `2026-06-11-my-note.md`。
2. 在 `posts/index.json` 顶部新增文章信息：

```json
{
  "slug": "2026-06-11-my-note",
  "title": "文章标题",
  "date": "2026-06-11",
  "summary": "文章摘要",
  "tags": ["Notes"]
}
```

3. 提交并推送：

```powershell
cd D:\blog
git add .
git commit -m "Add new post"
git push
```

## 文件结构

```text
.
├── index.html
├── articles.html
├── post.html
├── publish.html        # Publications & Awards
├── assets/
│   ├── home.js
│   ├── markdown.js
│   ├── post.js
│   └── styles.css
└── posts/
    ├── index.json
    ├── 2026-06-08-how-this-site-publishes.md
    └── 2026-06-09-welcome.md
```
