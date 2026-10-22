# 功能覆盖与验收

本文件区分“已迁移”“自动化已验证”和“真实环境联调”，不将文件数量或模拟接口等同于真实第三方验收。

## 基线与完整性

基线 main 提交：`745ff1d3ca79a7f39520f627f6aa44d778a11580`。

- 64 条路由记录（包括重定向、404，别名保存在原路由源码）。
- 535 个运行时源码文件完整迁入，不跨目录引用 frontend 源码。
- 72 个 API、类型、路由及相关契约文件逐字节哈希检查。
- 260 个设置 v-model 绑定，拆分后全部保留。
- 350 份原有测试文件迁入；修正原版已复现的7项陈旧断言：新增 TypeSafe 默认配额、模型发现能力、Qwen 精确协议规则。业务实现保持不变。

上述检查由 `pnpm run check:parity` 执行。升级功能时须结合旧版差异审查后显式更新基线，不自动刷新哈希以绕过检查。

## 功能映射

| 模块 | 已迁移的能力 | 当前证据 |
| --- | --- | --- |
| 安装与公开页 | 数据库/Redis测试及安装；首页配置、简洁首页、自定义HTML/URL、密钥用量查询、法律文件、模型广场 | 原业务逻辑与单元测试；首页浏览器验证 |
| 认证 | 注册、邮件验证、密码重置、验证码、2FA、Passkey、会话刷新；LinuxDo/微信/钉钉/OIDC/通用OAuth回调和绑定补全 | 原业务逻辑与测试；登录页面及未授权跳转验证 |
| 用户工作台 | 余额、请求、Token、实际/标准费用、平台配额、图表、最近用量、快捷操作 | 原测试；桌面与移动渲染验证 |
| 密钥管理 | 创建/编辑/删除、批量操作、分组、额度/速率/IP/有效期限制、复制、客户端导入、列设置、筛选排序 | 原业务测试；密度持久化及创建弹窗浏览器验证 |
| 用户业务 | 用量记录、可用渠道、监控V1/V2、生图指南、兑换、推广、个人资料与安全、身份绑定、自定义页 | 原业务文件与单元测试 |
| 订阅与支付 | 套餐、充值、下单、订单、二维码、支付结果、微信支付恢复、Stripe/Airwallex及弹窗回调 | 原业务测试；真实支付待联调 |
| 管理与运维 | 仪表盘、运维监控、操作日志、用户、分组、渠道定价与监控、订阅、上游账户、插件、公告、IP、兑换码、优惠码、用量 | 原业务测试；账户管理页面浏览器验证 |
| 提示词审计 | 独立 features 下的 API、视图模型、查询与详情 | 契约保留与原测试 |
| 系统设置 | 通用、登录条款、功能开关、安全认证、用户默认值、网关、支付、邮件、备份；所有原字段与单独保存接口 | 43项设置行为测试；9分区浏览器切换 |
| 通用交互 | 深浅主题、中英文、动态品牌、公告、版本、角色导航、导航搜索、折叠/手机抽屉、表格密度 | 单元测试与浏览器测试 |
| 打包部署 | 独立dist、新旧选择、Go嵌入、Docker、CI、Release、回退入口 | 生产构建、资源切换单元测试、嵌入测试 |

## 本地检查结果

- Vitest：352 个测试文件、2,690 项测试全部通过。
- ESLint：0 错误、0 警告；vue-tsc 与生产构建通过。
- Playwright：桌面及移动共10项全部通过；含有数据的长名称列表、Enter/Space排序、移动排序、Tab/Shift+Tab焦点循环及Escape焦点恢复。
- 资源切换测试：2项通过；Go `go test -tags embed ./internal/web` 通过，静态资源用两版均提供的 `logo.svg` 验证。
- CI/Release/Security工作流 YAML 解析通过；Docker运行资源脚本检查通过。本机Docker守护进程未启动，尚未实际构建容器镜像。
- 生产构建仍有沿用业务模块的大体积chunk提示（账户页面约813kB，gzip约169kB）；页面继续懒加载，不将其描述为已完成真实性能验收。

## 浏览器验收边界

Playwright 在 1440×1000 和 390×844 运行相同流程：首页、主题切换、登录跳转、用户工作台、密钥弹窗与密度持久化、管理员9个设置分区、账户管理、未登录权限限制；页面检查无文档级横向溢出，监测关键流程的 JavaScript 异常；另以含数据的密钥及账户列表验证桌面键盘排序、手机排序及长名称显示，并测试弹窗首尾焦点循环和关闭后恢复。测试接口均本地拦截，未发起真实支付或生产写入。

真实环境仍需验证：第三方OAuth授权和账号绑定、邮件/短信/验证码、Passkey设备验证、真实支付及退款/回调、上游账户授权与网络代理、网关调用和流式请求、备份上传/恢复。须使用对应后端配置和沙箱账号完成后，再切换正式默认前端。

现阶段保留旧版默认构建；新界面已经可独立开发、构建和选择打包，未自动部署或发布。

## 路由清单

以下清单由固定基线生成；具体权限、别名与功能开关以 `src/router/index.ts` 为准。

- `/setup`
- `/home`
- `/login`
- `/register`
- `/email-verify`
- `/auth/callback`
- `/auth/linuxdo/callback`
- `/auth/wechat/callback`
- `/auth/wechat/payment/callback`
- `/auth/dingtalk/callback`
- `/auth/dingtalk/email-completion`
- `/auth/oidc/callback`
- `/forgot-password`
- `/reset-password`
- `/key-usage`
- `/legal/:documentId`
- `/model-plaza`
- `/`
- `/dashboard`
- `/keys`
- `/batch-image`
- `/usage`
- `/redeem`
- `/affiliate`
- `/available-channels`
- `/profile`
- `/subscriptions`
- `/purchase`
- `/orders`
- `/payment/qrcode`
- `/payment/result`
- `/payment/stripe`
- `/payment/airwallex`
- `/payment/stripe-popup`
- `/custom/:id`
- `/admin`
- `/admin/dashboard`
- `/admin/ops`
- `/admin/audit-logs`
- `/admin/users`
- `/admin/groups`
- `/admin/channels`
- `/admin/channels/pricing`
- `/admin/channels/monitor`
- `/monitor`
- `/admin/subscriptions`
- `/admin/accounts`
- `/admin/plugins`
- `/admin/announcements`
- `/admin/proxies`
- `/admin/redeem`
- `/admin/promo-codes`
- `/admin/settings`
- `/admin/risk-control`
- `/admin/prompt-audit`
- `/admin/usage`
- `/admin/affiliates`
- `/admin/affiliates/invites`
- `/admin/affiliates/rebates`
- `/admin/affiliates/transfers`
- `/admin/orders/dashboard`
- `/admin/orders`
- `/admin/orders/plans`
- `/:pathMatch(.*)*`
