# vpnnews

使用 VuePress 和 Plume 主题构建的 VPN 评测与教程站。

## 发布文章

正式站 `https://vpnnew.net` 由 Cloudflare Pages 项目 `vpnnew-net` 直接构建并发布。

1. 编辑或新增 `docs/` 下的 Markdown 文章。
2. 将修改提交并推送到 `main` 分支。
3. 等待提交上的 **Cloudflare Pages** 检查成功，再打开官网确认文章更新。

Cloudflare Pages 项目配置：

| 配置项 | 值 |
| --- | --- |
| 生产分支 | `main` |
| 自动部署 | 已启用 |
| 构建命令 | `pnpm run docs:build` |
| 构建输出目录 | `docs/.vuepress/dist` |
| 根目录 | 留空，使用仓库根目录 |

文章发布不依赖 GitHub Actions 或 `gh-pages` 分支。旧提交上的失败记录会保留，新的文章推送不会触发旧版 Actions 部署。

## 本地预览

```sh
pnpm install
pnpm docs:dev
```

开发地址为 `http://127.0.0.1:8081/`。生产构建与预览使用 `pnpm docs:build` 和 `pnpm docs:preview`。

## 手动维护旧部署与 Worker

`.github/workflows/deploy.yml` 仅保留手动入口：**Actions → Manual legacy deployment → Run workflow**。运行该流程仍需 GitHub Actions 账户状态正常、仓库写入权限，以及部署 Worker 所需的 Cloudflare secrets。

Worker 的直接部署与本地检查见 [analytics-worker/README.md](analytics-worker/README.md)。Cloudflare Pages 构建只发布静态网站，Worker 代码更新需要另行部署。
