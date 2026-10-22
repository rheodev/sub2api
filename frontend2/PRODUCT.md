# Sub2API 新版前端

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

普通用户管理 API 密钥、额度、用量、订阅与支付；管理员配置上游账户、渠道、分组、用户、计费和运维。

## Product Purpose

用全新界面完整提供原 frontend 的实际可达功能，保持原有后端接口、权限、功能开关和回调兼容。

## Operating Context

用户在桌面和移动浏览器使用；管理端包含高密度表格、批量操作和复杂设置表单。

## Capabilities and Constraints

- Vue 3、TypeScript、Vite 5、Pinia、Vue Router、Tailwind CSS 3。
- 独立工程；业务代码迁移到本工程内部，不跨目录引用旧源码。
- 保留中英文、深浅主题、站点品牌配置、登录态和已有网址。
- 新旧前端可选择构建，通过相同 Go 嵌入入口发布，开发期间默认旧版。

## Brand Commitments

用户确认清晰精致、操作高效的方向。界面采用中性灰、蓝色操作色、克制阴影；动态站点名称、Logo 和配置内容优先。

## Product Principles

- 功能完整优先，以逐项对照和测试验证完整性。
- 高频操作直接可见，复杂配置分区呈现。
- 设计变量统一，桌面与移动端行为一致。

## Accessibility & Inclusion

中英文完整；键盘可操作、焦点可见、支持减少动态效果；输入字号在移动端不低于 16px。
