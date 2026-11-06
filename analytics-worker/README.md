# YouYou 站点 Worker

这是 YouYou VPN 站点的 Cloudflare Worker，负责 D1 浏览量统计与机场订阅节点检测。

## 接口

- `POST /api/analytics/view`：记录页面浏览量
- `POST /api/analytics/pages`：批量读取文章浏览量
- `GET /api/analytics/summary`：返回全站统计与热门文章，可用 `?limit=60` 调整数量
- `POST /api/analytics/node-test`：解析用户主动提交的 HTTPS 订阅并检测节点 TCP 可达性

所有 JSON 接口均返回 `Cache-Control: no-store` 与 `X-Robots-Tag: noindex, nofollow`，避免接口内容进入搜索索引。

## 1. 创建并初始化 D1

```bash
cd analytics-worker
pnpm install
pnpm dlx wrangler d1 create youyou_analytics
```

把命令输出里的 `database_id` 填入 `wrangler.jsonc`，然后初始化远程数据库：

```bash
pnpm db:init
```

只初始化本地数据库时运行：

```bash
pnpm db:init:local
```

## 2. 本地调试

```bash
pnpm dev
```

Worker 默认地址为 `http://127.0.0.1:8787`。从 `127.0.0.1` 或 `localhost` 打开的 VuePress 本地站点会自动请求这个地址。

## 3. 检查与部署

```bash
pnpm typecheck
pnpm exec wrangler deploy --dry-run
pnpm run deploy
```

这里必须使用 `pnpm run deploy`，显式执行 `package.json` 中的 Wrangler 部署脚本，避免与 pnpm 的内置 `deploy` 命令冲突。

`wrangler.jsonc` 已配置以下主站路由：

```text
https://vpnnew.net/api/analytics*
https://www.vpnnew.net/api/analytics*
```

部署后可先检查统计接口：

```bash
curl https://vpnnew.net/api/analytics/summary
```

如果使用独立 Worker 域名，可在构建站点前设置：

```powershell
$env:VITE_ANALYTICS_ENDPOINT="https://youyou-analytics.example.workers.dev"
pnpm docs:build
```

## 4. 节点检测边界与隐私

- 订阅地址只在用户点击检测后提交，输入框随后立即清空；Worker 不写入 D1、不缓存、不回传订阅令牌。
- 仅返回订阅源主机名和节点必要字段；错误日志不包含订阅地址、请求体或节点明文。
- 每次最多检测 24 个节点，单节点执行 2 次 TCP 握手，并限制并发、超时和请求频率。
- UDP-only 的 Hysteria/Hysteria2/TUIC 节点只解析、不检测；结果也不等于本地延迟、带宽或代理协议可用性。
- 私网、本机、保留地址与不安全的订阅端口会被拒绝，避免把接口用作内网探测器。
- `NODE_TEST_RATE_LIMITER` 默认限制同一匿名访问者与订阅源组合每分钟 4 次。

## 注意事项

- 浏览量从 Worker 部署成功后开始累计，历史访问不会自动补回。
- 页面浏览量是 PV，不是精确 UV。
- `ALLOWED_ORIGIN` 默认包含正式站和本地开发地址；新增预览域名时应同步调整。
- 修改 Worker 绑定后要重新运行 `pnpm exec wrangler types ./src/worker-configuration.d.ts`。

## GitHub Actions 账单锁定排查

文章已由 Cloudflare Pages 监听 `main` 分支自动构建发布，无需运行 GitHub Actions。以下排查仅针对可选的手动旧部署流程。

如果失败任务没有执行任何步骤，并提示 `The job was not started because your account is locked due to a billing issue.`，说明 GitHub 在分配运行器前阻止了任务，需要先处理账户账单锁定；修改文章或重新推送不能解除此限制。

1. 在 [GitHub 账单设置](https://github.com/settings/billing) 检查付款失败或付款方式验证异常，并按页面提示处理。
2. 如果没有待付余额或可处理的账单提示，按照 [GitHub 账户解锁说明](https://docs.github.com/en/billing/how-tos/troubleshooting/locked-account) 联系 GitHub Support 检查锁定状态。
3. 账户解锁后，在对应的 Actions 运行页面重新运行失败任务，并确认构建与部署步骤实际完成。

GitHub Actions 和 Cloudflare Pages 的检查结果相互独立，应分别确认各自的部署状态。
