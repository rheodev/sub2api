# frontend2

全新设计的独立 Vue 3 前端。开发分支 `feat/new-frontend`，功能基线为 `parity-baseline.json` 中的 main 提交。保留原有接口、路由、角色权限、功能开关及登录态存储协议。

## 开发

在仓库根目录执行（Node.js 20+、pnpm 9.15.9）：

```sh
pnpm --dir frontend2 install --frozen-lockfile
pnpm --dir frontend2 dev
```

访问 `http://localhost:3001`；原 frontend 默认使用 3000。后端默认 `http://localhost:8080`，可通过 `frontend2/.env.local` 的 `VITE_DEV_PROXY_TARGET` 修改。API 请求和安装接口经 Vite 代理转发；生产环境仍由 Go 注入站点配置与 CSP nonce。

## 检查与构建

```sh
pnpm --dir frontend2 run check:parity
pnpm --dir frontend2 run lint:check
pnpm --dir frontend2 run test:run
pnpm --dir frontend2 run build
pnpm --dir frontend2 exec playwright install chromium
pnpm --dir frontend2 run test:e2e
```

直接构建只写 `frontend2/dist`，不会修改旧前端。Playwright 使用本地模拟接口；默认启动 3001，若端口已有同一开发服务器则复用。可设置 `PLAYWRIGHT_CHANNEL=chrome` 使用本机 Chrome。截图保存到 `.impeccable/review/`，失败追踪保存到 `test-results/`，均不提交。

## 发布与回退

```sh
# 前端构建后，完整切换 Go embed 资源
make build-frontend FRONTEND_APP=frontend2
# 同时构建后端二进制
make build FRONTEND_APP=frontend2
# 恢复旧版产物并重新构建二进制
make build FRONTEND_APP=frontend
# Docker（deploy/Dockerfile 也支持相同参数）
docker build --build-arg FRONTEND_APP=frontend2 -t sub2api:frontend2 .
```

未指定 `FRONTEND_APP` 时默认旧版。新版构建成功后由 `deploy/stage-frontend.mjs` 将完整目录切换到 `backend/internal/web/dist`，移除陈旧资源；拷贝失败保留旧版。发布期间应保留前一个可用二进制/镜像，实际回滚直接切换该版本。

CI 分别检查两个前端，新版额外运行浏览器测试。Release 手动触发可选择 `frontend_app`；标签发布读取仓库变量 `FRONTEND_APP`，未配置时为 `frontend`。选择只影响嵌入的前端，不改变后端接口。

## 工程结构

- `src/components/layout`：工作空间、导航、认证布局与页面标题。
- `src/styles/workspace.css`：深浅主题变量与共享组件样式。
- `src/views/admin/settings/sections`：9 个设置分区；通过类型化上下文共享原有业务状态。
- `src/views/admin/useSystemSettings.ts`：原设置加载、校验、保存及子配置操作。
- `src/api`、`src/types`、`src/router`：与原版一致的后端契约和权限路由。
- `tools/check-parity.mjs`：运行文件、契约哈希和设置字段的静态完整性检查。
- `e2e`：桌面/移动浏览器测试，所有测试数据均为模拟数据。

视觉规则见 `DESIGN.md`，功能覆盖与联调边界见 `ACCEPTANCE.md`。
