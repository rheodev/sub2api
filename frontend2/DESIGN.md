---
name: "Sub2API Frontend2"
description: "清晰精致、操作高效的日常工作空间"
colors:
  "ws-canvas": "#f6f7f9"
  "ws-surface": "#ffffff"
  "ws-inset": "#f0f3f7"
  "ws-text": "#182230"
  "ws-muted": "#5b6575"
  "ws-border": "#e3e7ed"
  "ws-action": "#2563eb"
  "ws-selected": "#eff6ff"
  "ws-canvas-dark": "#101318"
  "ws-surface-dark": "#191e27"
  "ws-inset-dark": "#222a36"
  "ws-text-dark": "#edf1f7"
  "ws-muted-dark": "#a2adbc"
  "ws-border-dark": "#303845"
  "ws-action-dark": "#60a5fa"
  "ws-selected-dark": "#1b2c48"
  "primary-hover": "#1d4ed8"
  "danger": "#dc2626"
  "danger-hover": "#b91c1c"
  "success": "#047857"
  "warning": "#b45309"
  "auth-story": "#162844"
  "auth-story-text": "#f5f8ff"
  "auth-story-muted": "#becce1"
  "auth-story-border": "#3d506d"
  "primary-chip": "#dbeafe"
  "ghost-text": "#4b5563"
  "ghost-hover": "#f3f4f6"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "clamp(36px, 5vw, 64px)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "13px"
  caption:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "12px"
  metric:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
rounded:
  "badge": "4px"
  "control": "6px"
  "popover": "8px"
  "panel": "10px"
  "dialog": "12px"
spacing:
  "4": "4px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "32": "32px"
  "40": "40px"
  "48": "48px"
components:
  button-primary:
    backgroundColor: "{colors.ws-action}"
    textColor: "{colors.ws-surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.ws-surface}"
    textColor: "{colors.ws-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ghost-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ws-surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.ws-surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.ws-surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  input:
    backgroundColor: "{colors.ws-surface}"
    textColor: "{colors.ws-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.ws-surface}"
    rounded: "{rounded.panel}"
    padding: "24px"
  nav-active:
    backgroundColor: "{colors.ws-selected}"
    textColor: "{colors.ws-action}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  chip-primary:
    backgroundColor: "{colors.primary-chip}"
    textColor: "{colors.primary-hover}"
    rounded: "{rounded.badge}"
    padding: "2px 10px"
---
# Design System: Sub2API Frontend2

## Overview

**Creative North Star: "面向日常操作的工作空间"**

面向日常操作的工作空间。浅灰画布、实体面板、蓝色操作和细边界共同建立清楚的任务层级；深色主题保持相同的空间关系。品牌由动态站点名称、Logo 和配置内容表达。

设计服务于频繁操作与高密度数据：导航、筛选、表格与表单沿用一致的状态语言，以克制阴影和适量留白支持快速判断。系统字体覆盖中英文，数字使用等宽字面。

**Key Characteristics:**

- 中性灰画布与蓝色操作色
- 实体面板、细边界和克制阴影
- 中英文、深浅主题与响应式布局
- 键盘焦点可见，尊重减少动态效果偏好

## Colors

中性灰蓝负责结构，蓝色负责操作。前置 tokens 为规范值；`ws-*` 对应 `workspace.css` 中同名 CSS 变量，`*-dark` 记录 `.dark` 覆盖值。主要来源为 `src/styles/workspace.css`，基础组件来自 `src/style.css`，色阶与字体来自 `tailwind.config.js`。页面局部样式可覆盖全局组件。

### Primary

`ws-action` 用于导航选中、焦点与光标；深色主题使用 `ws-action-dark`。主按钮和进度条保持固定蓝色填充，主按钮悬停使用 `primary-hover`，并不直接跟随深色导航强调色。

### Neutral

`ws-canvas` 为画布与表头，`ws-surface` 为面板、输入框与导航背景，`ws-inset` 为次级内嵌层。`ws-text` 与 `ws-muted` 承载主要与辅助文字，`ws-border` 分隔区域。相应 dark tokens 保持相同职责。

### Semantic and contextual colors

`danger`、`success`、`warning` 用于业务操作与状态。状态徽章沿用 Tailwind 语义色浅底深字，并有深色变体。`auth-story-*` 只用于认证页的深蓝叙述区域，不作为工作空间背景。文本选择沿用 primary 色阶。

**The Action Rule.** 蓝色强调操作、焦点和当前区域；业务状态色只表达相应状态。

## Typography

正文与标题使用系统中英文字体栈，完整定义见 frontmatter。代码使用 `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`。正文采用 `tabular-nums`。

- **Display** 用于公共首页标题，最大行长（16ch）；认证页标题使用更收敛的响应字号（clamp(28px, 3.5vw, 48px)）。
- **Headline** 用于工作空间页面标题，窄屏（639px 以下）收至（22px）。
- **Body** 用于常规内容，辅助段落按场景采用（13px）或 caption。
- **Label / Caption** 用于导航、字段标签和提示。导航默认（13px），分组标题和徽章（11px）。
- **Metric** 用于仪表盘主指标；次级指标（23px），手机主指标（24px）。普通统计卡数值采用（26px）、字重（650）。

长标题允许断行；站点名和导航条目在有限空间省略。移动设备（639px 以下）的文本输入、选择框与多行输入使用（16px）。

## Layout

以侧栏、粘性顶栏、正文工作区组织任务。侧栏展开宽（248px）、折叠宽（72px），顶栏高（64px）。桌面正文随侧栏留出左边距；（1024px 以下）侧栏转为抽屉。

间距以 frontmatter 尺度为基础，允许已有组件的细化值。正文默认内边距（24px 16px 40px）；（768px 起）为（28px 24px 48px）；（1024px 起）左右扩至（32px）。标题与正文之间留（24px）。

设置页默认水平滚动分区导航，（1280px 起）改为左侧（184px）导航、（32px）列间距。认证页（1024px 起）采用双栏，表单最大宽（400px）。公共页内容最大宽（1200px）。

表格提供标准与紧凑密度。基础表格单元格内边距（12px 16px）；紧凑模式表体上下（7px）、表头上下（9px）。`TablePageLayout` 桌面提供固定操作区、表体滚动和分页区，其 scoped 表格单元格采用（16px 20px）；窄屏恢复页面滚动。具体页面可提供结构化移动记录，不将其视作所有表格的统一转换。

## Elevation & Depth

实体背景、边界和明度层次承担结构，阴影补充面板与浮层的层级。面板使用 `--ws-shadow`，深色主题相应调整阴影；普通统计卡取消阴影。菜单与 Toast 使用浮层阴影，模态框使用较深阴影。完整值保存在 sidecar。

面板禁用背景模糊；模态遮罩使用实色半透明遮罩。`TablePageLayout` 的局部粘性表头仍有轻微背景模糊，属于当前实现的局部处理，不扩展为全局玻璃风格。

交互颜色过渡通常（140ms），侧栏与布局移动（180ms），菜单（200ms）。减少动态效果时统一压缩动画和过渡至（0.01ms）、只执行一次。

## Shapes

细边界采用（1px）。徽章是小幅圆角矩形，控件和导航采用克制圆角，面板比控件稍柔和；精确尺度见 rounded tokens。菜单与 Toast 使用 popover 圆角，模态框使用 dialog 圆角。头像、开关和进度条保留各自功能形状。

## Components

### Buttons

主操作蓝底白字；次操作使用面板背景与边界；幽灵按钮透明底；危险、成功和警告按钮使用相应语义填充。默认内边距见组件 tokens，最小高度（38px），小按钮（30px），图标按钮（36px）。禁用降低不透明度并显示禁用指针。Hover 改变颜色，focus 保留清楚轮廓。

### Inputs / Fields

实体面板背景、细边界，最小高度（40px），标签与就地提示分开呈现。焦点沿用 primary-500 边界和（2px）淡蓝 ring；全局 `:focus-visible` 提供语义蓝（2px）轮廓、偏移（3px）。错误采用红色边界及就地文字，禁用采用减弱背景和禁用指针。

### Navigation

默认使用辅助文字；悬停提升文字层级并增加 inset 背景；当前项使用 selected 背景、蓝色与加重字重。主项最小高（38px），子项（34px），子区域左侧有细引导线。支持侧栏搜索、折叠与移动抽屉；折叠隐藏标签时保留图标及可访问名称。页面含跳转主内容链接。

### Chips

基础徽章字号（11px），小矩形圆角，水平内边距（10px）、垂直（2px）。色彩表达业务状态，文字和图标补足状态含义；徽章默认是信息，不自动变为可点击控件。

### Cards / Containers

实体背景、细边界和轻阴影；正文内边距（24px），头部（18px 24px）。指标汇总容器用分隔线组织信息，手机采用两列。不要将所有指标强行拆为独立卡片。

### Tables and overlays

表头采用画布背景与辅助文字，表体以细边界分行，排序、选择、加载、空状态沿用相同层级。密度切换复用统一控件。菜单圆角和浮层阴影一致；模态框沿用实体背景、分隔头尾与可滚动正文。键盘交互与语义以实际组件实现为准。

## Do's and Don'ts

### Do:

- Do 优先复用 workspace 语义变量及已有组件，深浅主题保持同一信息层级。
- Do 将高频操作直接呈现，复杂设置分区，数值使用 tabular-nums。
- Do 保留动态站点品牌、中英文内容、可见焦点和减少动态效果支持。

### Don't:

- Don't 在工作空间面板增加装饰渐变、玻璃背景或发光阴影。
- Don't 将成功、警告、危险色用作无业务含义的装饰。
- Don't 依靠颜色独自传达选中或错误状态，也不要移除键盘焦点。

## 个人资料

个人资料页采用实体面板和简洁分隔线。顶部保留头像、用户名、邮箱与状态，余额、并发和注册时间以 13px 信息行展示；用户名使用 18px，设置面板标题沿用工作空间的 15px。

内容分为基础资料、账号安全、通知设置，通知入口遵循站点功能开关。页签支持方向键及 Home/End，切换时保留表单草稿。基础资料在桌面并排展示头像与用户名编辑，窄屏纵向排列；账号安全集中展示密码、双因素认证、Passkey 与登录方式绑定。第三方资料来源只在顶部显示，支持长用户名、长邮箱、中英文和深浅主题。

## 默认公共首页：面向用户的 AI 空间

首屏以“找到适合你的 AI，开启更多可能”为主题，左侧介绍创作、工作与学习的价值，右侧用纸张式灵感示例切换内容创作、编程辅助、学习研究。示例标明场景示意，不模拟聊天或发送模型请求。下方依次呈现使用场景、当前模型、个人服务和开始使用入口。

首页采用白色 `#ffffff`、浅青 `#edf5f4`、深青正文 `#203b48`、青色装饰 `#28756d` 和现有操作蓝 `#2563eb`；暗色沿用工作空间语义变量，浅青区域改为 `#1d3034`。保持现有中英文系统字体，标题最大58px，正文左对齐。纸张示例为主要视觉元素，其余区块保持清晰、克制。

默认程序名称在首页显示为“AI 空间 / AI Space”，过滤出厂技术副标题，保留用户配置的品牌与介绍。首页不展示协议、代码、网关关系和项目仓库入口。自定义 HTML/URL 首页、简洁模式、文档链接、登录角色跳转、功能开关仍按原配置生效。模型预览只读取站点实际提供的数据，遵循模型广场权限，提供加载、失败重试与空状态。

场景页签支持方向键与 Home/End。布局支持手机、320像素英文及深浅主题；局部样式放在 HomeView 中。
