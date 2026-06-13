<!-- 已与当前源码视觉对齐：`src/App.css`（应用壳层、tokens）、`src/pages/**/index.css`（页面块）。大范围改版时请同步本节。 -->
---
name: Plane List
description: 航司机型 wiki 与个人乘坐记录的深色档案型产品界面（Night Flight Archive）
---

# Design System: Plane List

## 1. Overview

**Creative North Star: "Night Flight Archive"**

这个系统应该像夜间航程中的个人航空档案：深色、沉稳、信息密度足够高，但每个层级都清楚。它服务的是查阅、筛选、记录和回顾，不服务于营销展示。

**当前产品结构（实现层）**

| 路由            | 角色       | 说明 |
|-----------------|------------|------|
| `/`             | 机型资料库 | 航司机队列表与机型芯片；数据来源 `public/data/airplan.json`。 |
| `/personal`     | 个人记录   | 乘机足迹、地图与机场/机型可视化（页面自有样式承接同一壳层 token）。 |
| `/photos`       | 飞机照片   | 独立飞机照片相册，复用个人页相册数据、目录筛选与全屏预览能力。 |
| `/references`   | 参考资料   | 航司官网、公开年报、百科与航空资料站集中索引，供机队数据校对。 |

**Key Characteristics**

- 深色沉浸背景承载整体氛围，内容面板用半透明 navy 层级压在上面，不靠重阴影分层。
- 全站 sans：数据、筛选、导航、芯片统一无衬线，避免 ornament 混入控件。
- 信息组织优先使用列表、分区标题、筛选行和状态胶囊；Fleet 区域内联滚动与整页滚动共用一套滚动条色相（见 §7）。
- 动效以 160–480ms 的过渡与单次 reveal 动画为主，`prefers-reduced-motion: reduce` 下收窄为瞬时（见 `src/App.css`）。
- **双主题**：默认深色「Night Flight Archive」；亮色为日间阅读向的冷灰蓝底，由 `--pl-*` token 在 `html[data-theme="light"]` 下整体覆写，顶栏可切换并写入 `localStorage`（见 §2.4）。

## 2. Colors

沉浸式深色基底 + 低频冷青强调：**强调色只做信号**（选中、Eyebrow、外链、Hover 提亮），不靠大面积纯色块。

### 2.1 语义命名与参考值

下列值为当前实现常用落点（多为 `rgba` 叠在深色背景上，勿单独拿到浅色底使用）。

#### Primary（信号 / Accent）

| Token（文档用名）       | 参考值                                      | 用途 |
|-------------------------|---------------------------------------------|------|
| **Archive Accent Sky** | `#7cc8eb`                                   | 页面 Eyebrow、维基模块小标题强调。 |
| **Navigation Signal**  | `rgba(100, 181, 216, …)`、`rgba(124,200,235,…)` | 导航 Hover 边框与焦点、Fleet 滚动条thumb、次级 CTA 描边（见 `--scroll-area-thumb`）。 |
| **Link Ice**           | `#9ed8f2` 等                                | 参考来源区等外链可读蓝（随上下文 underline）。 |

#### Neutral（阅读与承载）

| Token（文档用名）         | 参考值                                      | 用途 |
|---------------------------|---------------------------------------------|------|
| **Readable Cabin Peak**   | `#f4f8fb`                                   | 主标题、页面 H1、导航激活文字。 |
| **Readable Cabin Body**   | `#edf4f8`                                   | `body` 默认字色。 |
| **Secondary Cabin**       | `#b5c6d1`                                   | 副文案、次级导航默认态字色。 |
| **Muted Eyebrow**        | `#9fb6c5`                                   | 顶栏 kicker (`Night Flight Archive`)。 |
| **Meta / Hint**           | `#8ea7b5`                                   | Fleet 条目元一行（载客数 / 制造商等）。 |
| **Night Cabin Gradient** | `#020917` → `#101725`                       | `body` 纵向渐变垫底。 |

#### Surfaces（面板与芯片）

| Token（文档用名）           | 参考值示例                                  | 用途 |
|-----------------------------|---------------------------------------------|------|
| **Archive Panel Surface** | `rgba(10, 21, 33, 0.78)`                    | `.page-panel`、主内容卡。 |
| **Deep Toolbar Surface**   | `rgba(7, 17, 29, 0.56)` ~ `rgba(15,31,48,0.78)` | Fleet 筛选条、条目卡、Toast 风格状态块等。 |
| **Data Chip Surface**      | `rgba(18, 36, 54, 0.84)`                    | 机型名称芯片底色。 |

#### Borders & Dividers（低对比分割线）

常用hairline：**`rgba(164, 188, 201, 0.10–0.18)`**——顶栏下边、卡片描边、输入框边框；色相一致，只靠透明度阶梯区分强弱。

导航**激活态**：背景 `rgba(55, 126, 160, 0.28)`，边框 `rgba(100, 181, 216, 0.82)`（见 `.app-nav__link--active`）。

错误与筛选空态等特殊色仍在各模块 CSS 内定义，语义上保持可读红/边界强调，不向全局引入第二套色相系统。

### 2.2 App Shell Background

`.app-shell` 在深蓝线性渐变上加一角径向高光（弱青），模拟夜航机舱微光。**禁止**在此处叠大幅模糊或玻璃拟态；层次交给面板 opacity。

### 2.3 Named Rules

**The Drenched Night Rule.** 深色为默认档案语境；亮色为可选日间阅读语境。两套主题下正文与数据行均以 WCAG AA 为对比度目标（参见 `PRODUCT.md`）。

**The Accent Rarity Rule.** 青蓝停留在导航信号、Eyebrow、外链与滚动 thumb 等小面积色块；Fleet 条目 hover 只允许轻微上浮与边框变亮，不写满屏渐变。

### 2.4 亮色主题（Daylight Archive）

**场景句**：日间在自然光或明亮室内查阅机型、核对乘机记录时，需要接近纸张的浅色冷灰底，强调色略压低饱和度，避免屏幕眩光与浅色外链对比不足。

| 机制 | 说明 |
|------|------|
| **变量层** | `:root` 定义深色默认 `--pl-*`；`html[data-theme="light"]` 覆写同一批变量，首页 / 个人页 / 地图样式只引用变量，不手写两套色值。 |
| **首屏** | `rsbuild.config.ts` 的 `html.tags` 在 `<head>` 最前注入内联脚本，从 `localStorage.getItem('plane-list-theme')` 恢复 `light` / `dark`，减轻亮色刷新时的闪烁。 |
| **控件** | 顶栏右侧、`主导航` 左侧：`ThemeToggle` 圆角按钮，图标太阳（当前深色时可切浅色）/ 月亮（当前亮色时可切深色），`aria-pressed` 为真表示亮色激活；`meta[name=theme-color]` 随主题切换。 |
| **色票倾向** | 壳层：浅冷灰蓝渐变（`#dfeaf3`～`#e8f0f7` 系）；正文墨蓝灰（`#243848` 系）；强调与外链改为偏深的钢青（`#1a6f9a` / `#0b6e9e` 系），仍保持单冷色accent 体系。 |

## 3. Typography

**当前字体栈（实现）**：`Inter, Avenir, Helvetica, Arial, sans-serif` —— 全部为系统友好 sans，不使用装饰性 display 字体；「档案编辑感」由字重、字距与大标题比例承担，不靠换字体族。

### Hierarchy（与实现对齐的指导）

| 层级        | 实现参考 | 用法 |
|-------------|----------|------|
| **Display** | `clamp(2.4rem, 6vw, 4.25rem)`，收紧行高 | `page-panel` 内 H1；小屏再上 `clamp(1.85rem, 9vw, 2.75rem)`。 |
| **App Title** | `1.15rem` bold | 顶栏产品名 Plane List。 |
| **Eyebrow** | `0.72rem–0.78rem`，大写，`letter-spacing: 0.14em–0.18em` | 区块标签（References、kicker、Fleet 过滤器 label）。 |
| **Body**    | `1.05rem`（小屏 `1rem`）、`line-height: 1.7`，段落 `max-width: 42rem` | 长说明与介绍性段落。 |
| **Data / Caption** | `0.82rem–0.86rem` | 条目元数据、脚注、次要链接说明。 |

### Named Rules

**The Data Stays Sans Rule.** 列表、表单、筛选、芯片与数据统计禁止换 serif / display；大标题可以保持戏剧性的 **尺寸与字距**，而不是换字体。

## 4. Motion

时间变量集中在 `body`/`App.css` 根样式旁（亦为各页 `var(--motion-*)` 引用来源）：

| Token | 值 | 用途 |
|-------|-----|------|
| `--motion-duration-fast` | `160ms` | hover、边框与微位移动画。 |
| `--motion-duration-standard` | `240ms` | 筛选切换、条目轻反馈。 |
| `--motion-duration-enter` | `480ms` | 首屏/面板 archive-reveal 类入场。 |

缓动：**`--motion-ease-out-quart`**、**`--motion-ease-out-quint`** 用于绝大部分过渡。

`@media (prefers-reduced-motion: reduce)` 下 animations/transitions 压到 `0.01ms`，避免剥夺动效用户信息。

## 5. Shape, Elevation & Layout

- **圆角策略**：功能性区块 `0.75rem–1.25rem`；**胶囊导航与统计 pill** `border-radius: 999px`；机型等小芯片 ~`0.55rem`。**避免**整块大屏圆角同质化堆叠。
- **Elevation：** 静止态几乎无盒子阴影；层次靠 **半透明 surface + hairline border**。交互 Hover 允许的位移控制在约 `1–2px`（`translate3d`）。
- **主内容宽度**：Landing `page-panel` 约 `48rem` cap；维基内容区 `home` 内 `.aircraft-wiki` ~`72rem`，与Fleet 并排留白由 `App` 主区域 padding 管辖。
- **安全区**：`env(safe-area-inset-*)` 已与顶栏/主区域内边距合成 `max(...)`。

## 6. Components（与实现对齐）

### Application Shell

| 构件 | 行为 |
|------|------|
| **Header** | 左品牌（kicker + title），右为 **主题切换**（`ThemeToggle`）与 `NavLink` 主导航；小屏纵向堆叠、链接全宽约定触摸高度 `2.75rem`。 |
| **Nav Pill** | 默认幽灵边线；`**--active`** 浅青底 + 亮边；`**--cta**`（若使用）更高亮青的浅填充。外链（如「联系作者」）与路由链视觉同级。 |
| **Main** | 单列 `grid` 居中承接页面模块；Wiki 与个人页自控内部 max-width。 |
| **Back To Top** | 全局固定圆形图标按钮，离开首屏后浮现；使用主题 surface、hairline border 与 `prefers-reduced-motion` 友好的滚动反馈。 |

### Wiki / Fleet 区域（首页）

- **Fleet 筛选条**：深底 + hairline box；控件为深色底、`focus` 时青边 + **轻量级外辉**（禁用模糊）。
- **航司条目卡**：半透明面板、分隔 header / manufacturer 分段；`**h3`** 制造商名为全大小写式 label 色谱（`Archive Accent Sky` 系）。
- **机型芯片**：小圆角pill，浅色字 + 发丝边框；外联机型带 underline，色相继承字色、`hover` 提亮。
- **`details`（参考来源）**：summary 箭头由 CSS border 绘制，展开带轻量交错动画类名与筛选一致色系。

### 列表 / Chips

「芯片」语义覆盖航司 pill、Fleet 摘要统计胶囊与机型条目：**选中/聚焦必须可看键盘焦点**（:border / :outline 或由 `focus-visible` 承担）。

### Forms

Fleet 过滤器：`select`/`input` 深色表面、可读 placeholder、`**focus-visible`** 明确定义；移动端 `select`/`input` 字号避免小于 `16px` 以防 iOS 聚焦缩放（实现中已为窄屏调高）。

### Navigation（已定案）

顶部横向主导航已实现；不要求侧栏。**当前路由高亮**：`NavLink` + `aria-label="主导航"`。

## 7. Scroll Areas（滚动条）

全站纵向滚动条与 **Fleet 内嵌滚动区** 共用 **Night Archive Scroll** token，避免出现 Windows/macOS 默认灰条与 Fleet 自定义条两套语言。

**CSS 变量（`:root`，`src/App.css`）**

| 变量名 | 用途 |
|--------|------|
| `--scroll-area-size` | 纵向滚动条宽度（如 `10px`）。 |
| `--scroll-area-track-bg` | 轨道背景 rgba。 |
| `--scroll-area-thumb` | 拖拽条默认色。 |
| `--scroll-area-thumb-hover` | 拖拽条悬停提亮。 |

**应用方式**

1. **文档视口**：选择器 `:root` 已挂载 `scrollbar-*` 与 `::-webkit-scrollbar-*`；并使用 **`scrollbar-gutter: stable`** 降低滚动条显隐引起的横向跳动。
2. **组件内溢出区**：在同一 CSS 中为容器增加类名 **`scroll-area-night`**（并设置 `overflow-y: auto|scroll`、`overscroll-behavior` 等布局属性）。Fleet 容器 `.fleet-results` 已实现该拼接。

Firefox：依赖 `scrollbar-width: thin` + `scrollbar-color`；Safari/Chromium：`::-webkit-scrollbar` 分支；移动端部分系统仍会回落为原生 overlay，行为可接受。

## 8. Do's and Don'ts

### Do

- **Do** 继续使用层级化 navy surface + hairline border 区分区块，少用阴影讲故事。
- **Do** 让机型代号、航司名、载客统计与数据来源成为Fleet列表的第一可读信息。
- **Do** 把溢出滚动区域接到 **`scroll-area-night` + `:root`（或 `html[data-theme]`）滚动变量**，保持轨道色相一致。
- **Do** 用 `motion-duration-fast` / `standard` / `enter` 三档时间管理反馈，不与随机自定义时长混用。

### Don't

- **Don't** 引入大范围 glassmorphism、frosted、无意义半透明堆叠模糊。
- **Don't** 用同质卡片网格塞满维基；Fleet 已通过「航司条目 + manufacturer 小节」打散节奏，新增模块应类比此结构而非盲目加卡片。
- **Don't** 为强调使用粗竖色条分割列表项主导航。
- **Don't** 在正文或数据控件上使用低对比「装饰灰」替代 **Secondary Cabin / Meta** 已经校验过的可读灰阶。
