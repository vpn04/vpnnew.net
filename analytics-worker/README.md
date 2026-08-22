# YouYou Analytics Worker

这是 YouYou VPN 站点的轻量浏览量统计后端，用 Cloudflare Worker + D1 存储真实数据。

前端已经默认请求：

- `POST /api/analytics/view`：记录页面浏览量
- `POST /api/analytics/pages`：批量读取文章列表浏览量
- `GET /api/analytics/summary`：返回全站今日、本月、今年、总浏览量和热门文章排行，可用 `?limit=60` 调整排行数量

## 1. 创建 D1 数据库

```bash
cd analytics-worker
pnpm install
pnpm dlx wrangler d1 create youyou_analytics
```

把命令输出里的 `database_id` 填到 `wrangler.jsonc`：

```jsonc
"database_id": "你的 D1 database_id"
```

## 2. 初始化数据表

```bash
pnpm db:init
```

这会初始化 Cloudflare 远程 D1 数据库。只想本地调试时可以运行：

```bash
pnpm db:init:local
```

## 3. 本地调试

```bash
pnpm dev
```

本地 Worker 默认地址通常是：

```text
http://127.0.0.1:8787
```

本地 VuePress 预览在 `127.0.0.1` 或 `localhost` 打开时，会自动请求：

```text
http://127.0.0.1:8787
```

## 4. 部署 Worker

```bash
cd analytics-worker
pnpm install
pnpm deploy
```

`wrangler.jsonc` 已经内置主站路由，部署成功后 Worker 会自动接管：

```text
https://vpnnew.net/api/analytics*
https://www.vpnnew.net/api/analytics*
```

这样前端默认的 `/api/analytics` 就能直接工作，不需要额外改构建变量。

部署后马上测试：

```bash
curl https://vpnnew.net/api/analytics/summary
```

如果这里仍然返回 404，说明 Worker 没有部署到 Cloudflare，或域名没有启用 Cloudflare 代理。请先运行 `pnpm exec wrangler login` 登录账号，再执行 `pnpm deploy`。

## 5. 使用独立 Worker 域名

如果你把 Worker 部署在独立域名，例如：

```text
https://youyou-analytics.example.workers.dev
```

则需要在网站构建时设置：

```bash
$env:VITE_ANALYTICS_ENDPOINT="https://youyou-analytics.example.workers.dev"
pnpm docs:build
```

## 6. 查看统计面板

部署完成并产生访问后，打开：

```text
https://vpnnew.net/analytics/
```

你会看到：

- 今日浏览
- 本月浏览
- 今年浏览
- 全站总浏览
- 今日热门文章
- 本月热门文章
- 年度热门文章
- 总榜热门文章

## 注意事项

- 统计从 Worker 部署成功后开始累计，历史访问不会自动补回。
- 页面浏览量是 PV，不是精确 UV。
- 如果你只部署前端、不部署 Worker，每篇文章会显示“浏览量待同步”，统计面板会提示接口未连接。
- `ALLOWED_ORIGIN` 默认包含 `https://vpnnew.net`、`http://127.0.0.1:8080` 和 `http://localhost:8080`，如果测试域名不同，需要在 `wrangler.jsonc` 里调整。
