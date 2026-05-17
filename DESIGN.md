<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Plane List
description: 航司机型 wiki 与个人乘坐记录的深色档案型产品界面
---

# Design System: Plane List

## 1. Overview

**Creative North Star: "Night Flight Archive"**

这个系统应该像夜间航程中的个人航空档案：深色、沉稳、信息密度足够高，但每个层级都清楚。它服务的是查阅、筛选、记录和回顾，不服务于营销展示。

界面可以带一点航空资料库和收藏目录的气质，但不能做成炫技页面。视觉重点应放在机型编号、航司、个人乘坐状态、记录进度和可浏览的信息结构上。

**Key Characteristics:**

- 深色沉浸背景承载整体氛围，但内容区域必须保持清晰对比。
- 编辑感用于内容详情页的标题、段落和资料介绍，工具区仍保持高效 sans 体系。
- 信息组织优先使用列表、表格、分区标题、筛选和状态标签。
- 微动效只反馈状态，不做表演性入场。

## 2. Colors

采用沉浸式深色策略，背景是夜航感的深色层，航空蓝或冷青色只用于关键动作、选中状态和进度提示。

### Primary

- **Navigation Signal** ([to be resolved during implementation]): 用于主操作、当前选中、链接和关键进度标识。

### Neutral

- **Night Cabin Surface** ([to be resolved during implementation]): 页面主背景，应避免纯黑。
- **Archive Panel Surface** ([to be resolved during implementation]): 列表、详情区和筛选区的承载层，应通过色阶区分而不是强阴影。
- **Readable Cabin Text** ([to be resolved during implementation]): 正文、标题和数据文字，必须满足 WCAG AA 对比度。
- **Subtle Divider Line** ([to be resolved during implementation]): 分割线、表格行和元信息边界，不能抢走内容注意力。

### Named Rules

**The Drenched Night Rule.** 深色不是装饰皮肤，而是航空档案的阅读环境。背景可以深，但文字、按钮、状态和筛选条件必须清楚。

**The Accent Rarity Rule.** 强调色只用于用户下一步动作、选中状态和重要记录进度。不要把蓝色铺满所有卡片边框。

## 3. Typography

**Display Font:** [font pairing to be chosen at implementation]  
**Body Font:** [font pairing to be chosen at implementation]  
**Label/Mono Font:** [font pairing to be chosen at implementation]

**Character:** 内容详情页允许轻编辑感，让机型介绍和航空资料有档案阅读感。列表、筛选、按钮、标签和数据字段必须保持清晰、紧凑、工具化。

### Hierarchy

- **Display** ([to be resolved during implementation]): 用于机型详情页标题、专题页标题和少量内容型页面。
- **Headline** ([to be resolved during implementation]): 用于模块标题、航司或机型分组标题。
- **Title** ([to be resolved during implementation]): 用于列表项、记录标题和详情卡片标题。
- **Body** ([to be resolved during implementation]): 用于说明文字和资料段落，长段落行长控制在 65-75ch。
- **Label** ([to be resolved during implementation]): 用于状态、筛选、表头、元信息和机型编号辅助说明。

### Named Rules

**The Data Stays Sans Rule.** 数据、筛选、按钮和状态标签禁止使用过度装饰字体。编辑感只用于内容层级，不进入操作控件。

## 4. Elevation

默认使用色阶和分割线建立层级，而不是依赖阴影。悬浮、展开、选中和拖拽等状态可以有轻微提升感，但深色界面里的阴影必须克制，不能变成玻璃拟态。

### Named Rules

**The Tonal Layer Rule.** 静止状态下用背景色阶表达层级。阴影只用于交互反馈和临时浮层。

## 5. Components

### Buttons

- **Shape:** 中等圆角，具体数值在实现时确定。
- **Primary:** 只用于主要操作，例如添加乘坐记录、保存记录、进入详情。
- **Hover / Focus:** 使用清晰的焦点环、轻微亮度变化和 150-250ms 过渡。
- **Secondary / Ghost:** 用于筛选、取消、次级导航，必须保持足够对比。

### Chips

- **Style:** 用于机型类别、航司、乘坐状态、年份和筛选条件。
- **State:** 选中态必须同时通过背景、边框或图标表达，不能只依赖颜色。

### Cards / Containers

- **Corner Style:** 克制圆角，避免同质化卡片网格。
- **Background:** 使用深色层级承载内容。
- **Shadow Strategy:** 默认无阴影，必要时使用轻微交互阴影。
- **Border:** 使用低对比细线，不允许粗侧边色条。
- **Internal Padding:** 信息密度优先，详情内容可以更宽松。

### Inputs / Fields

- **Style:** 深色底、清晰边界、可见占位符和标签。
- **Focus:** 使用明确焦点环，不只改变边框色。
- **Error / Disabled:** 错误状态需要文字说明，禁用状态仍要可读。

### Navigation

导航应服务于资料浏览和个人记录切换。默认建议使用清晰顶部导航或侧栏导航，当前页面状态必须明确，小屏下可折叠但不能隐藏核心入口。

## 6. Do's and Don'ts

### Do:

- **Do** 使用深色层级、清晰分区和高对比文本建立夜航档案感。
- **Do** 让机型编号、航司、乘坐状态和记录进度成为界面的第一视觉信息。
- **Do** 为列表、表格、筛选、详情和个人记录分别设计稳定的状态表达。
- **Do** 使用 150-250ms 的轻量过渡反馈 hover、focus、展开收起和选中状态。

### Don't:

- **Don't** 使用默认玻璃拟态、模糊卡片或为了装饰而添加的透明层。
- **Don't** 使用层层嵌套卡片和同质化卡片网格。
- **Don't** 把普通 SaaS 模板文案套到航空 wiki 和个人飞行记录上。
- **Don't** 用低对比灰字承载航司、机型、状态或按钮文字。
- **Don't** 使用粗侧边色条作为列表项或卡片的主要强调方式。
