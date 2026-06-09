# 这个站点如何发布

发布页会让你填写仓库 owner、仓库名、分支、发布目录和 GitHub token。

流程很直接：

- 调用 `https://api.github.com/user` 确认 token 属于仓库 owner。
- 读取 `posts/index.json`。
- 创建新的 `posts/<slug>.md`。
- 更新 `posts/index.json`。

## 权限边界

前端页面没有能力真正“声明只有某个人能写仓库”。最终权限一定由 GitHub 判断：

- token 必须属于你的 GitHub 账号。
- token 必须拥有目标仓库 Contents: Read and write 权限。
- 仓库分支保护规则仍然生效。

所以这个方案不会把密钥写进代码，也不会把 token 存到浏览器 localStorage。
