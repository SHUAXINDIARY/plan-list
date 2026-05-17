# Task Record

## 日期

2026-05-17

## 任务目的

完善当前项目的 Agent 协作基础设施与 UI 设计基调，让后续代码生成、文件生成、前端设计和 Rsbuild 相关任务都有明确约束。

本次任务主要目标包括：

- 建立更完整的 Cursor 项目基础规则。
- 补充 Cursor Skills 和项目内 skills 的使用规范。
- 明确当前项目目录结构与文件生成位置要求。
- 使用已安装的 Impeccable UI skill，为项目指定产品定位和 UI 基调。
- 将本次执行内容记录到 `taskRecord.md`。

## 完成过程

1. 完善 `.cursor/rules/project-base-rules.mdc` 的 frontmatter，补充规则描述，让该规则作为全局项目规则生效。
2. 将原有简略代码规范扩展为完整项目基础规则，覆盖技术栈、TypeScript、异步与数据流、函数与状态、常量与注释、前端实现、验证与交付。
3. 阅读并遵循 `create-rule` skill，按 `.mdc` 规则文件格式完善 Cursor 规则内容。
4. 根据 Cursor Skills 官方文档补充 Skills 使用说明，包括自动发现目录、`SKILL.md` frontmatter、`paths`、`disable-model-invocation` 等约定。
5. 扫描项目目录结构，补充 `当前目录` 小节，明确 `/plan-list` 下各目录和关键文件的职责。
6. 明确生成文件必须严格按照当前目录职责存放，禁止将业务源码、文档、脚本或资源生成到 `.git/`、`node_modules/` 或项目根目录外。
7. 阅读项目已安装的 `.agents/skills/impeccable/SKILL.md`，并结合用户提供的 Impeccable 文档了解 `teach`、`document`、anti-pattern 检测和 UI 基调工作流。
8. 运行 `node .agents/skills/impeccable/scripts/load-context.mjs` 检查设计上下文，确认项目当时尚未存在 `PRODUCT.md` 和 `DESIGN.md`。
9. 阅读 `impeccable/reference/teach.md`、`impeccable/reference/product.md` 和 `impeccable/reference/document.md`，按 skill 流程继续执行。
10. 扫描 `README.md`、`package.json`、`src/App.tsx`、`src/App.css`、`rsbuild.config.ts` 和 `src/index.tsx`，确认当前项目仍是 Rsbuild React 初始页。
11. 向用户确认产品定位、用户人群、UI 气质、反参考、颜色策略、字体方向、动效能量和参考对象。
12. 根据用户反馈，将项目定位为内容型产品：航司机型 wiki 与个人乘坐记录。
13. 生成 `PRODUCT.md`，记录 register、目标用户、产品目的、品牌语气、反参考、设计原则和可访问性要求。
14. 生成 seed 版 `DESIGN.md`，指定 UI 基调为 `Night Flight Archive`：深色夜航档案风、信息密度高、内容详情带轻编辑感、操作区域保持工具型清晰。
15. 在 `.cursor/rules/project-base-rules.mdc` 中补充 `PRODUCT.md` 和 `DESIGN.md` 的目录职责说明。
16. 再次运行 `node .agents/skills/impeccable/scripts/load-context.mjs`，确认 Impeccable 能读取新生成的 `PRODUCT.md` 和 `DESIGN.md`。
17. 使用 `ReadLints` 检查 `.cursor/rules/project-base-rules.mdc`、`PRODUCT.md`、`DESIGN.md` 和 `taskRecord.md`，未发现 linter 问题。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 补充 frontmatter 描述。
  - 扩展项目基础规则。
  - 增加当前目录结构与文件生成约束。
  - 增加 Cursor Skills 使用规则。
  - 增加 `PRODUCT.md` 和 `DESIGN.md` 的目录职责说明。

- `PRODUCT.md`
  - 新增产品定位文档。
  - 记录项目 register 为 `product`。
  - 明确项目是航司机型 wiki 与个人乘坐记录工具。
  - 补充目标用户、产品目的、品牌语气、反参考、设计原则和可访问性要求。

- `DESIGN.md`
  - 新增 seed 版设计系统文档。
  - 指定 UI 基调为 `Night Flight Archive`。
  - 明确深色夜航档案风、信息层级、色彩策略、字体方向、组件原则和禁忌项。
  - 标记后续可在真实组件和 tokens 建立后重新运行 `/impeccable document` 提取正式设计系统。

- `taskRecord.md`
  - 新增本次对话任务记录。
  - 当前已调整为“日期、任务目的、完成过程、修改具体文件”的格式。

---

## 日期

2026-05-17

## 任务目的

将“每次任务生成完成并交付前自动更新 `taskRecord.md`”写入项目规则，确保后续任务都有持续、统一的执行记录。

## 完成过程

1. 阅读 `create-rule` skill，确认修改 Cursor 项目规则时应遵循 `.mdc` 规则文件格式。
2. 读取 `.cursor/rules/project-base-rules.mdc` 和 `taskRecord.md`，确认现有规则结构与任务记录格式。
3. 在 `.cursor/rules/project-base-rules.mdc` 的当前目录说明中补充 `taskRecord.md` 的文件职责。
4. 在 `.cursor/rules/project-base-rules.mdc` 中新增 `任务记录` 小节。
5. 明确后续每次任务完成并准备交付前，必须自动追加或补充 `taskRecord.md`。
6. 明确记录格式必须包含 `日期`、`任务目的`、`完成过程`、`修改具体文件` 四个部分。
7. 明确更新任务记录后，需要使用 `ReadLints` 检查 `taskRecord.md` 和本次修改过的文件。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 新增 `taskRecord.md` 的目录职责说明。
  - 新增 `任务记录` 小节，规定后续任务完成后自动更新任务记录。

- `taskRecord.md`
  - 追加本次规则变更的任务记录。

---

## 日期

2026-05-17

## 任务目的

更新 `.cursor/rules/project-base-rules.mdc` 中的当前目录说明，使项目规则与最新目录结构保持一致。

## 完成过程

1. 阅读 `create-rule` skill，确认修改 Cursor 项目规则应遵循 `.mdc` 文件格式。
2. 读取 `.cursor/rules/project-base-rules.mdc` 和 `taskRecord.md`，确认当前规则内容与任务记录格式。
3. 扫描项目目录，发现新增的 `public/data/airplan.json` 和 `.agents/skills/vercel-react-native-skills/`。
4. 读取 `public/data/airplan.json` 前部内容，确认其为航司与机型映射数据。
5. 更新 `.cursor/rules/project-base-rules.mdc` 的 `当前目录` 小节，补充新增目录和文件职责。
6. 按项目规则将本次执行内容追加到 `taskRecord.md`。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 新增 `.agents/skills/vercel-react-native-skills/` 的目录职责说明。
  - 新增 `public/data/` 和 `public/data/airplan.json` 的目录与数据职责说明。
  - 新增 `.gitignore` 的文件职责说明。

- `taskRecord.md`
  - 追加本次目录更新任务记录。

---

## 日期

2026-05-17

## 任务目的

修正上一次目录扫描遗漏的问题，补充 `src` 下新增页面目录到项目规则中。

## 完成过程

1. 根据用户反馈重新检查 `src` 目录，确认上一次使用 `Glob("src/**/*")` 只返回文件，未体现空目录。
2. 使用目录列表重新核对 `src`，发现新增 `src/pages/` 目录。
3. 继续检查 `src/pages/`，确认其中包含 `home/` 和 `personal/` 两个页面子目录。
4. 更新 `.cursor/rules/project-base-rules.mdc` 的 `当前目录` 小节，补充 `src/pages/`、`src/pages/home/` 和 `src/pages/personal/` 的职责说明。
5. 按项目规则将本次修正追加到 `taskRecord.md`。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 新增 `src/pages/` 页面级模块目录说明。
  - 新增 `src/pages/home/` 和 `src/pages/personal/` 页面子目录职责说明。

- `taskRecord.md`
  - 追加本次目录扫描修正记录。

---

## 日期

2026-05-17

## 任务目的

为项目新增 `react-router` 路由能力，在 `src/pages/*` 页面目录下创建占位页面，并在 `src/App.tsx` 中增加页面路由和跳转导航。

## 完成过程

1. 读取 `src/App.tsx`、`src/App.css`、`src/index.tsx` 和 `package.json`，确认当前应用仍是 Rsbuild React 初始页面。
2. 检查 `src/pages/home` 和 `src/pages/personal`，确认两个页面目录存在但尚未创建页面入口文件。
3. 使用 `pnpm add react-router` 安装 `react-router` 依赖。
4. 新增 `src/pages/home/index.tsx`，作为航司机型资料库页面占位组件。
5. 新增 `src/pages/personal/index.tsx`，作为个人乘坐记录页面占位组件。
6. 更新 `src/App.tsx`，引入 `BrowserRouter`、`Routes`、`Route` 和 `NavLink`，配置 `/` 与 `/personal` 两个路由。
7. 在 `src/App.tsx` 中新增主导航配置和导航渲染逻辑，支持跳转到机型资料库与我的乘坐记录。
8. 更新 `src/App.css`，补充应用壳、顶部导航、激活态链接、页面面板和响应式布局样式。
9. 使用 `ReadLints` 检查新增和修改的源码文件，未发现 linter 问题。
10. 运行 `pnpm run build` 验证生产构建通过。

## 修改具体文件

- `package.json`
  - 新增 `react-router` 依赖。

- `pnpm-lock.yaml`
  - 因安装 `react-router` 自动更新锁文件。

- `src/App.tsx`
  - 新增 React Router 路由配置。
  - 新增主导航和 `NavLink` 跳转入口。
  - 接入 `HomePage` 与 `PersonalPage` 页面组件。

- `src/App.css`
  - 替换初始页样式。
  - 新增应用壳、导航、页面面板和移动端适配样式。

- `src/pages/home/index.tsx`
  - 新增航司机型资料库页面占位组件。

- `src/pages/personal/index.tsx`
  - 新增个人乘坐记录页面占位组件。

- `taskRecord.md`
  - 追加本次新增路由与页面占位任务记录。

---

## 日期

2026-05-17

## 任务目的

将 `public/data/airplan.json` 中的航司与机型数据渲染到首页 `src/pages/home/index.tsx`。

## 完成过程

1. 读取 `impeccable` skill 相关说明，确认本次首页数据展示仍需遵守项目 UI 基调。
2. 读取 `public/data/airplan.json`，确认数据结构为“航司 -> 制造商 -> 机型数组”。
3. 读取 `src/pages/home/index.tsx` 和 `src/App.css`，确认首页仍是占位内容。
4. 在 `src/pages/home/index.tsx` 中新增数据类型声明、数据加载逻辑和数据格式化函数。
5. 使用 `fetch('/data/airplan.json')` 加载静态 JSON，并补充加载、错误和空数据状态。
6. 按航司渲染制造商与机型列表，并展示航司数量和机型记录总数。
7. 在 `src/App.css` 中新增首页数据列表、统计摘要、状态提示、航司条目、制造商分组和机型标签样式。
8. 使用 `ReadLints` 检查 `src/pages/home/index.tsx` 和 `src/App.css`，未发现 linter 问题。
9. 运行 `pnpm run build` 验证生产构建通过。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增读取和渲染 `public/data/airplan.json` 的逻辑。
  - 新增加载、错误、空数据和数据摘要状态。
  - 按航司、制造商、机型层级渲染数据。

- `src/App.css`
  - 新增首页数据渲染相关样式。
  - 新增航司条目、制造商分组、机型标签、统计摘要和状态提示样式。

- `taskRecord.md`
  - 追加本次首页数据渲染任务记录。

---

## 日期

2026-05-17

## 任务目的

在首页机型数据概览同一行增加航司搜索和机型制造商下拉筛选，用于过滤展示航司与机型数据。

## 完成过程

1. 读取 `impeccable` skill 并刷新 Impeccable 项目上下文，确认本次筛选交互需要遵守当前产品与 UI 基调。
2. 读取 `src/pages/home/index.tsx`、`src/App.css` 和现有任务记录，确认首页数据渲染与样式结构。
3. 在 `src/pages/home/index.tsx` 中新增航司搜索状态和制造商筛选状态。
4. 新增制造商选项提取逻辑，从已加载的航司机型数据中生成下拉选项。
5. 新增数据过滤逻辑，按航司名称和选中制造商过滤航司、制造商与机型展示。
6. 将机型数据概览调整为同一行工具栏，左侧展示过滤后的统计，右侧展示航司搜索和制造商下拉筛选。
7. 补充无匹配结果状态，当前筛选条件无数据时展示提示。
8. 在 `src/App.css` 中新增筛选工具栏、搜索输入、下拉框和响应式布局样式。
9. 使用 `ReadLints` 检查 `src/pages/home/index.tsx` 和 `src/App.css`，未发现 linter 问题。
10. 运行 `pnpm run build` 验证生产构建通过。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增航司搜索输入和机型制造商下拉筛选。
  - 新增制造商选项提取和数据过滤逻辑。
  - 将统计摘要改为基于过滤结果展示。
  - 新增筛选无结果提示。

- `src/App.css`
  - 新增筛选工具栏、输入框、下拉框和小屏适配样式。

- `taskRecord.md`
  - 追加本次筛选功能任务记录。

---

## 日期

2026-05-17

## 任务目的

补充项目基础规则，要求所有函数都必须添加逻辑注释。

## 完成过程

1. 读取 `create-rule` skill，确认修改 Cursor 项目规则应遵循 `.mdc` 文件格式。
2. 定位 `.cursor/rules/project-base-rules.mdc` 的 `常量与注释` 小节。
3. 在该小节中新增函数注释要求，明确所有函数都必须说明函数目的、关键输入输出或核心处理逻辑。
4. 按项目规则将本次规则补充追加到 `taskRecord.md`。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 在 `常量与注释` 小节补充所有函数必须添加逻辑注释的规则。

- `taskRecord.md`
  - 追加本次规则补充任务记录。

---

## 日期

2026-05-17

## 任务目的

按 `/animate` 要求为首页机型数据页面加入克制的动效和微交互，提升加载、筛选、悬停和状态反馈体验。

## 完成过程

1. 读取 `frontend-design` skill，并结合手动附加的 `animate` skill 要求确认动效原则。
2. 读取 `PRODUCT.md` 和 `DESIGN.md`，确认项目 UI 基调为 `Night Flight Archive`，动效应克制、服务状态反馈并支持减少动态偏好。
3. 读取 `src/pages/home/index.tsx` 和 `src/App.css`，确认首页已有航司数据渲染、搜索和制造商筛选。
4. 在 `src/pages/home/index.tsx` 中补充函数逻辑注释，满足项目规则中“所有函数都必须添加逻辑注释”的要求。
5. 在 `src/App.css` 中新增动效变量、进入动画和加载态脉冲动画。
6. 为页面面板、筛选工具栏和航司列表加入顺序进入动效。
7. 为导航、筛选输入、航司条目和机型标签加入 hover / focus 微交互。
8. 将脉冲动效限制在加载状态，避免错误或空结果提示持续闪动。
9. 增加 `prefers-reduced-motion: reduce` 规则，保证减少动态偏好下禁用动画和过渡。
10. 使用 `ReadLints` 检查 `src/pages/home/index.tsx` 和 `src/App.css`，未发现 linter 问题。
11. 运行 `pnpm run build` 验证生产构建通过。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 补充函数逻辑注释。
  - 为加载状态增加专用 `data-state--loading` 类名。

- `src/App.css`
  - 新增动效变量、进入动画和加载态脉冲动画。
  - 新增导航、筛选控件、航司条目和机型标签的微交互。
  - 新增 `prefers-reduced-motion` 降级规则。

- `taskRecord.md`
  - 追加本次 `/animate` 动效增强任务记录。

---

## 日期

2026-05-17

## 任务目的

调整首页机型数据筛选工具栏布局，让统计信息、搜索控件和制造商筛选在桌面端同一排水平对齐展示。

## 完成过程

1. 读取 `impeccable` skill，并加载 `PRODUCT.md`、`DESIGN.md` 与 product register 参考，确认本次为产品界面布局微调。
2. 读取 `src/pages/home/index.tsx` 和 `src/App.css`，定位工具栏结构与 `fleet-toolbar`、`fleet-filter` 相关样式。
3. 将桌面端工具栏和筛选区改为居中对齐的横向布局。
4. 将筛选 label 内部从上下排列改为横向排列，并为输入框和下拉框设置稳定宽度。
5. 补充小屏媒体查询，使筛选项在窄屏下恢复纵向排列并占满可用宽度。

## 修改具体文件

- `src/App.css`
  - 调整首页筛选工具栏、统计摘要和筛选控件的水平对齐方式。
  - 保留小屏下纵向适配，避免控件挤压。

- `taskRecord.md`
  - 追加本次 UI 对齐调整任务记录。

---

## 日期

2026-05-17

## 任务目的

按 `/animate` 要求为首页机型数据筛选后的结果切换增加过渡效果，避免搜索或制造商切换时列表突然重绘。

## 完成过程

1. 读取 `frontend-design` skill，并结合手动附加的 `animate` skill 确认动效应服务状态变化、使用 transform 与 opacity，并支持减少动态偏好。
2. 复核首页当前数据加载、筛选和列表渲染结构，确认切换发生在搜索词和制造商筛选条件变化后。
3. 在 `src/pages/home/index.tsx` 中新增筛选结果视图 key，让列表和无结果状态在筛选条件变化时重新执行进入过渡。
4. 在 `src/App.css` 中新增数据切换专用动画，并应用到结果列表、航司条目和筛选无结果提示。
5. 为航司条目加入轻微错峰延迟，使筛选结果切换更有层次但不拖慢操作。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增筛选结果视图 key，并用于结果列表和筛选无结果状态的重新渲染过渡。

- `src/App.css`
  - 新增 `archive-filter-swap` 数据切换动画。
  - 为列表、条目和无结果状态增加轻量进入过渡与条目错峰。

- `taskRecord.md`
  - 追加本次 `/animate` 数据切换过渡任务记录。

---

## 日期

2026-05-17

## 任务目的

将首页专属样式从全局 `App.css` 拆分到 `src/pages/home/` 目录下，便于首页模块单独维护样式。

## 完成过程

1. 读取 `src/App.tsx`、`src/pages/home/index.tsx` 和 `src/App.css`，确认当前样式入口和首页样式选择器分布。
2. 使用搜索确认 `aircraft-wiki`、`data-state`、`fleet-*`、`airline-*`、`manufacturer-*` 和 `aircraft-model-*` 等样式只被首页使用。
3. 新建 `src/pages/home/index.css`，迁移首页专属样式、首页数据切换动画和首页小屏适配规则。
4. 在 `src/pages/home/index.tsx` 中引入 `./index.css`，让首页模块自行加载样式。
5. 从 `src/App.css` 删除首页专属选择器，仅保留全局布局、导航、通用面板和全局减少动态规则。

## 修改具体文件

- `src/pages/home/index.css`
  - 新增首页专属样式文件，承载首页筛选、列表、数据状态、机型标签和相关动画样式。

- `src/pages/home/index.tsx`
  - 引入首页专属 `index.css`。

- `src/App.css`
  - 移除首页专属样式，保留应用级全局样式。

- `taskRecord.md`
  - 追加本次首页样式拆分任务记录。

---

## 日期

2026-05-17

## 任务目的

优化首页筛选结果布局，避免切换数据后因结果数量变化导致外层容器高度忽高忽低。

## 完成过程

1. 读取 `src/pages/home/index.tsx` 和 `src/pages/home/index.css`，确认当前结果列表直接随数据数量自然撑开页面面板。
2. 在首页组件中新增统一的 `fleet-results` 结果区，将筛选无结果提示和航司列表放入同一稳定容器。
3. 调整条件渲染逻辑，让有数据源时才渲染结果区，并在结果区内部切换空状态或列表。
4. 在首页 CSS 中为 `fleet-results` 设置固定响应式高度、内部滚动、稳定滚动条预留和空状态居中。
5. 移除列表自身顶部间距，改由结果区统一控制与筛选工具栏的间距。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增 `fleet-results` 结果区结构，统一承载筛选无结果和列表渲染。

- `src/pages/home/index.css`
  - 新增稳定高度的结果区样式和小屏高度适配。
  - 调整列表间距，避免切换数据时外层面板高度跳变。

- `taskRecord.md`
  - 追加本次首页结果区布局优化任务记录。

---

## 日期

2026-05-17

## 任务目的

将不同页面组件改为按需加载，避免应用启动时一次性全量引入首页和个人记录页代码。

## 完成过程

1. 读取 `src/App.tsx`、`src/App.css` 和 `src/pages/personal/index.tsx`，确认当前路由页面通过静态 import 全量引入。
2. 在 `src/App.tsx` 中使用 React `lazy` 将 `HomePage` 和 `PersonalPage` 改为动态导入。
3. 使用 `Suspense` 包裹路由区域，为页面 chunk 加载期间提供轻量加载态。
4. 为导航类名函数和根组件补充逻辑注释，保持函数注释规则一致。
5. 在 `src/App.css` 中新增路由加载态样式，保持与现有深色档案视觉一致。
6. 根据 TypeScript 诊断补充 `module: "ESNext"`，让动态 `import()` 与 Rsbuild 代码分割配置匹配。

## 修改具体文件

- `src/App.tsx`
  - 将首页和个人记录页从静态 import 改为 `lazy` 动态导入。
  - 使用 `Suspense` 包裹路由，增加页面按需加载边界。

- `src/App.css`
  - 新增 `route-loading` 页面加载态样式。

- `tsconfig.json`
  - 新增 `module: "ESNext"`，支持动态导入和路由级代码分割。

- `taskRecord.md`
  - 追加本次页面按需加载任务记录。

---

## 日期

2026-05-17

## 任务目的

让首页筛选结果每次过滤后自动回到结果区顶部，避免滚动位置停留在旧结果列表中段。

## 完成过程

1. 读取 `src/pages/home/index.tsx`，确认筛选结果由 `filteredViewKey` 驱动切换，并由 `fleet-results` 容器内部滚动。
2. 为结果滚动容器新增 `useRef<HTMLDivElement | null>` 引用。
3. 新增监听 `filteredViewKey` 的 `useEffect`，在搜索词或制造商筛选变化后将结果区 `scrollTop` 重置为 `0`。
4. 将 `fleetResultsRef` 绑定到 `fleet-results` 容器，确保重置作用于内部滚动区域。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增结果区 ref 和筛选变化后的滚动位置重置逻辑。

- `taskRecord.md`
  - 追加本次筛选滚动重置任务记录。

---

## 日期

2026-05-17

## 任务目的

在首页新增数据来源说明，并提供指向中国民用航空局公开 PDF 资料的新窗口链接。

## 完成过程

1. 读取 `src/pages/home/index.css`，确认首页局部样式维护位置。
2. 在 `src/pages/home/index.tsx` 的页面简介下方新增数据来源小字说明。
3. 为数据来源链接添加 `target="_blank"` 和 `rel="noreferrer"`，确保点击后新窗口打开并减少外链风险。
4. 在 `src/pages/home/index.css` 中新增数据来源说明样式，保持低调元信息层级，并补充链接 hover / focus 状态。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增数据来源说明和外部 PDF 链接。

- `src/pages/home/index.css`
  - 新增数据来源说明与链接交互样式。

- `taskRecord.md`
  - 追加本次数据来源说明任务记录。

---

## 日期

2026-05-17

## 任务目的

按照 `public/data/airplan.json` 的新数组数据结构调整首页字段读取与展示逻辑。

## 完成过程

1. 对照 `public/data/airplan.json` 的新结构，确认数据项字段为 `airline`、`passengerAircraftCount` 和 `models`。
2. 调整 `src/pages/home/index.tsx` 中的 TypeScript 数据类型，将旧对象映射结构改为数组数据项结构。
3. 更新 `createAirlineFleets`，从新字段中读取航司名称、客机数量和制造商机型分组。
4. 新增过滤结果中的客机数量统计，让顶部概览展示新数据结构提供的机队规模。
5. 更新航司条目元信息，展示每家航司的客机数量、制造商数量和机型数量。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 调整 `AirplaneData` 类型与数据转换逻辑以匹配新 JSON 结构。
  - 新增客机数量统计与航司条目展示字段。

- `taskRecord.md`
  - 追加本次数据结构适配任务记录。

---

## 日期

2026-05-17

## 任务目的

在首页筛选条件中新增客机数量排序，排序依据为 `public/data/airplan.json` 中的 `passengerAircraftCount` 字段。

## 完成过程

1. 读取当前首页数据结构适配后的 `src/pages/home/index.tsx`，确认航司数据已包含 `passengerAircraftCount`。
2. 新增 `PassengerAircraftSortOrder` 类型、默认排序常量和排序值判断函数。
3. 新增按客机数量排序的辅助函数，数量相同时使用航司名称保持稳定排序。
4. 将排序方式接入 `filterAirlineFleets`，让搜索、制造商筛选和客机数量排序共同生成展示结果。
5. 在筛选工具栏新增“客机数量排序”下拉控件，支持由多到少和由少到多。
6. 将排序条件加入 `filteredViewKey`，确保排序变化后结果区动画和滚动重置正常触发。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增客机数量排序状态、排序控件和排序逻辑。
  - 按 `passengerAircraftCount` 对筛选结果进行升序或降序排列。

- `taskRecord.md`
  - 追加本次筛选排序功能任务记录。

---

## 日期

2026-05-17

## 任务目的

使用 `impeccable` 思路优化首页筛选工具栏布局，解决统计胶囊和筛选控件混排后视觉杂乱的问题。

## 完成过程

1. 读取 `src/pages/home/index.css`，确认当前 `fleet-toolbar` 使用单行 flex 同时承载统计信息和筛选控件，换行后容易错位。
2. 将 `fleet-toolbar` 调整为独立筛选面板，使用深色层级、细边框和统一内边距承载工具区。
3. 将统计信息 `fleet-summary` 固定在面板上层，并通过分隔线与筛选控件区分层级。
4. 将筛选控件 `fleet-filters` 改为三列网格，让航司搜索、制造商筛选和客机数量排序保持稳定对齐。
5. 将单个 `fleet-filter` 改为标签在上、控件在下的表单布局，减少横向挤压。
6. 补充 900px 和 640px 断点，让筛选控件在中小屏下分别降为两列和一列。

## 修改具体文件

- `src/pages/home/index.css`
  - 优化首页筛选工具栏、统计摘要和筛选控件的布局样式。
  - 新增中屏断点并简化小屏适配规则。

- `taskRecord.md`
  - 追加本次筛选工具栏布局优化任务记录。

---

## 日期

2026-05-17

## 任务目的

配置 Rsbuild 生成的 HTML 站点信息，让页面标题和 meta 内容匹配当前航司机型资料库产品定位。

## 完成过程

1. 读取 `PRODUCT.md` 和 `rsbuild.config.ts`，确认站点定位为航司机型资料库与个人乘坐记录工具。
2. 在 `rsbuild.config.ts` 中新增 `html.title`，设置站点标题为 `Plane List | 航司机型资料库`。
3. 在 `html.meta` 中补充作者、描述、关键词、主题色和 viewport 信息。
4. 保留现有 React 插件配置，不改动构建入口和其他无关配置。

## 修改具体文件

- `rsbuild.config.ts`
  - 新增 HTML 标题与站点相关 meta 信息配置。

- `taskRecord.md`
  - 追加本次 HTML 站点信息配置任务记录。

---

## 日期

2026-05-17

## 任务目的

配置站点标签页 icon，让 Rsbuild 生成的 HTML 使用指定 GitHub 头像作为 favicon。

## 完成过程

1. 读取 `rsbuild-best-practices` skill，确认继续使用 `rsbuild.config.ts` 和 Rsbuild 一等配置项。
2. 在 `rsbuild.config.ts` 的 `html` 配置中新增 `favicon` 字段。
3. 将 favicon 指向 `https://avatars.githubusercontent.com/u/32100575?v=4`，保留现有标题、meta 和 React 插件配置。

## 修改具体文件

- `rsbuild.config.ts`
  - 新增 `html.favicon`，配置站点标签页 icon。

- `taskRecord.md`
  - 追加本次 favicon 配置任务记录。

---

## 日期

2026-05-17

## 任务目的

为 `public/data/airplan.json` 中的每个航司数据项新增 `imgs` 字段，用于后续存放图片 URL。

## 完成过程

1. 读取用户选中的 `public/data/airplan.json` 数据结构，确认数组每一项代表一家航司。
2. 在每个航司对象的 `passengerAircraftCount` 后新增 `imgs` 字段。
3. 将所有 `imgs` 初始值设置为空数组，保持当前暂无图片 URL 的状态。
4. 使用搜索统计确认文件中共有 46 个 `imgs` 字段，与当前 46 家航司数据项一致。

## 修改具体文件

- `public/data/airplan.json`
  - 为每个航司对象新增 `imgs: []` 字段。

- `taskRecord.md`
  - 追加本次数据字段扩展任务记录。

---

## 日期

2026-05-17

## 任务目的

在首页航司数据卡片中新增查看图片入口，并通过弹窗展示对应数据项 `imgs` 数组中的图片。

## 完成过程

1. 读取 `src/pages/home/index.tsx` 和 `src/pages/home/index.css`，确认当前航司卡片结构和首页样式位置。
2. 扩展首页数据类型，将 `imgs: string[]` 从 `public/data/airplan.json` 映射到 `AirlineFleet`。
3. 新增当前选中航司图片弹窗状态，并提供打开、关闭和 Escape 关闭逻辑。
4. 在每个航司卡片头部新增“查看图片”按钮，点击后打开对应航司图片弹窗。
5. 在弹窗中根据 `imgs` 数组渲染图片网格；为空时显示暂无图片状态。
6. 新增弹窗遮罩、弹窗面板、关闭按钮、图片网格和卡片按钮样式，并补充小屏适配。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增航司图片字段映射、图片弹窗状态和查看图片按钮。
  - 新增图片弹窗渲染、空状态和 Escape 关闭逻辑。

- `src/pages/home/index.css`
  - 新增航司卡片图片按钮、图片弹窗、图片网格和空状态样式。

- `taskRecord.md`
  - 追加本次航司图片弹窗功能任务记录。

---

## 日期

2026-05-17

## 任务目的

在首页底部新增补充数据参考来源，集中展示部分航司数据对应的外部参考链接。

## 完成过程

1. 读取 `src/pages/home/index.tsx` 和 `src/pages/home/index.css`，确认当前顶部已有 CAAC 数据来源说明，页面底部尚无参考来源区域。
2. 新增 `AirlineReferenceSource` 类型和 `AIRLINE_REFERENCE_SOURCES` 常量，结构化保存用户提供的航司与参考 URL。
3. 在首页结果区之后新增“补充数据参考来源”区域，按航司分组渲染外部链接。
4. 为参考链接设置 `target="_blank"` 和 `rel="noreferrer"`，保持外链打开方式与现有数据来源一致。
5. 在首页 CSS 中新增底部参考来源区、分组、标题和链接交互样式。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增补充数据参考来源常量。
  - 在页面底部新增参考来源分组渲染。

- `src/pages/home/index.css`
  - 新增底部参考来源区域与链接样式。

- `taskRecord.md`
  - 追加本次补充数据参考来源任务记录。

---

## 日期

2026-05-17

## 任务目的

按 `impeccable` 产品界面要求，将首页所有数据参考来源集中到页面合适位置，避免干扰航司机型资料主内容展示。

## 完成过程

1. 读取 `impeccable` skill、`PRODUCT.md`、`DESIGN.md` 与产品型参考规范，确认本次界面应保持夜航档案式的克制信息层级。
2. 将顶部 CAAC 数据来源说明移入统一的 `AIRLINE_REFERENCE_SOURCES` 结构，与航司补充来源集中管理。
3. 移除首页标题下方的单独数据来源段落，减少主内容前的视觉噪音。
4. 将底部参考来源区域调整为默认收起的 `details` 折叠区，保留可访问的键盘展开能力和外链列表。
5. 更新参考来源区域样式，使其在视觉上低于筛选、概览和航司机型列表，同时补充小屏布局适配。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 将全局 CAAC 统计来源并入统一参考来源数组。
  - 移除顶部单独数据来源说明，改为底部统一折叠展示。

- `src/pages/home/index.css`
  - 移除旧顶部数据来源样式。
  - 重写参考来源区域为低干扰、默认收起的折叠样式，并补充响应式适配。

- `taskRecord.md`
  - 追加本次参考来源集中展示设计调整记录。

---

## 日期

2026-05-17

## 任务目的

为 `public/data/airplan.json` 选中航司数据补充缺失的 `imgs` 字段，保证首页图片弹窗读取数据结构一致。

## 完成过程

1. 读取 `public/data/airplan.json` 选中区块，确认瑞安航空、全日空、亚洲航空、泰国航空、泛航航空和泰国狮子航空缺少 `imgs` 字段。
2. 在每个缺失数据项的 `passengerAircraftCount` 后补充 `imgs: []`。
3. 保持现有机型数据、航司名称和客机数量不变，仅补齐图片数组字段。

## 修改具体文件

- `public/data/airplan.json`
  - 为选中 6 家航司补充空图片数组 `imgs` 字段。

- `taskRecord.md`
  - 追加本次数据字段补齐任务记录。

---

## 日期

2026-05-17

## 任务目的

将个人页从占位内容改为展示拍摄飞机和机场打卡的个人航空档案，并录入用户提供的机场数据。

## 完成过程

1. 读取 `src/pages/personal/index.tsx`、全局应用样式和首页样式，确认个人页当前仅有占位内容。
2. 按产品型夜航档案界面方向，设计个人页为概览、拍摄飞机空状态、机场足迹图和机场分组列表。
3. 在个人页中新增机场类型、坐标边界、坐标投射和国家地区分组等类型与纯函数。
4. 录入用户提供的 28 个机场打卡数据，并按国家或地区聚合展示。
5. 新增个人页专属样式，保持深色档案视觉、克制信息层级和小屏适配。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增机场打卡数据、统计概览、足迹图和国家地区分组列表。
  - 新增拍摄飞机模块空状态，为后续照片数据扩展预留结构。

- `src/pages/personal/index.css`
  - 新增个人页概览、拍摄飞机空状态、机场足迹图、标记点和机场分组列表样式。

- `taskRecord.md`
  - 追加本次个人航空档案页面任务记录。

---

## 日期

2026-05-17

## 任务目的

调整个人页顶部三项统计内容，使数字与文案在各自统计项容器内水平和垂直居中。

## 完成过程

1. 读取 `src/pages/personal/index.css`，确认统计项使用 `.personal-summary span` 控制内部布局。
2. 将统计项内部对齐从基线对齐改为居中对齐，并补充水平居中规则。
3. 为统计数字设置紧凑行高，避免数字默认行高影响视觉垂直居中。

## 修改具体文件

- `src/pages/personal/index.css`
  - 调整 `.personal-summary span` 的内部对齐方式。
  - 为 `.personal-summary strong` 补充行高。

- `taskRecord.md`
  - 追加本次统计项居中调整任务记录。

---

## 日期

2026-05-17

## 任务目的

优化个人页机场打卡足迹图，将原本抽象网格升级为更直观的地图示意图。

## 完成过程

1. 读取 `src/pages/personal/index.tsx` 和 `src/pages/personal/index.css`，确认当前机场足迹图只包含网格背景和机场点位。
2. 新增地图坐标、陆地区块和区域标签类型，补充覆盖欧洲、北非、东亚与东南亚的固定地图边界。
3. 用同一套经纬度投射逻辑生成简化陆地区块、区域标签和机场点位，保持点位相对位置一致。
4. 在机场足迹图中新增 SVG 地图层和区域标签层，让网格退为辅助坐标。
5. 更新地图样式层级，补充水面、陆地轮廓、区域标签和机场标记的视觉区分。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增简化地图数据、区域标签数据和 SVG 地图渲染。
  - 复用经纬度投射函数渲染陆地区块、标签和机场点位。

- `src/pages/personal/index.css`
  - 新增地图边框、陆地区块、区域标签和层级样式。

- `taskRecord.md`
  - 追加本次机场足迹图优化任务记录。

---

## 日期

2026-05-17

## 任务目的

按 `impeccable` 产品界面要求继续优化个人页机场地图示意图样式，使其比纯多边形地图更美观、更像航空足迹组件。

## 完成过程

1. 读取 `impeccable` 产品界面规范、个人页地图结构和当前地图样式，确认优化重点是层级、质感和可读性。
2. 新增主要航迹数据与航线贝塞尔路径生成函数，用弧线连接跨区域打卡点。
3. 在地图 SVG 中渲染航迹路径，让机场点位从单纯散点变成旅行足迹。
4. 重写地图视觉样式，降低陆地区块粗糙感，增强深色海图背景、柔和陆地轮廓、机场点发光和 hover 反馈。
5. 新增地图图例，并调整遮罩、标签、点位和图例层级，确保主要信息清晰。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增主要航迹数据、航线生成函数和航迹 SVG 渲染。

- `src/pages/personal/index.css`
  - 优化地图背景、陆地区块、航迹线、机场点、区域标签和图例样式。

- `taskRecord.md`
  - 追加本次地图样式优化任务记录。

---

## 日期

2026-05-17

## 任务目的

在个人页“拍摄的飞机”模块中渲染 `src/pages/personal/constant.ts` 提供的图片数据。

## 完成过程

1. 读取 `src/pages/personal/index.tsx`、`src/pages/personal/index.css` 和 `src/pages/personal/constant.ts`，确认拍摄飞机模块仍为空状态。
2. 为 `constant.ts` 中的 `imgs` 补充 `string[]` 类型声明，并保持图片 URL 数据结构不变。
3. 在个人页中导入图片数组，将顶部拍摄飞机统计数改为图片数组长度。
4. 使用语义化列表渲染图片网格，并为每张图片添加懒加载和可读 `alt` 文案。
5. 新增图片画廊样式，支持响应式网格、固定比例裁切和 hover 反馈。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - 为 `imgs` 图片数组补充显式类型声明，并统一字符串写法。

- `src/pages/personal/index.tsx`
  - 导入图片数组并渲染拍摄飞机图片网格。
  - 将拍摄飞机统计数改为图片数量。

- `src/pages/personal/index.css`
  - 移除拍摄飞机空状态样式，新增图片画廊网格样式。

- `taskRecord.md`
  - 追加本次图片数据渲染任务记录。

---

## 日期

2026-05-17

## 任务目的

将个人页中的常量数据拆分到同目录 `constant.ts`，让页面组件聚焦渲染和计算逻辑。

## 完成过程

1. 读取 `src/pages/personal/index.tsx` 与 `src/pages/personal/constant.ts`，确认页面内仍包含机场、地图边界、陆地区块、区域标签和航迹等静态数据。
2. 在 `constant.ts` 中导出个人页所需的数据类型、图片数组、机场列表、地图边界、陆地区块、区域标签和航迹数据。
3. 调整 `index.tsx` 导入逻辑，移除页面内常量数据定义，保留国家分组、坐标换算和组件渲染逻辑。
4. 检查相关文件诊断，确认本次调整没有引入新的编辑器诊断。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - 新增并导出个人页机场、地图和航迹相关常量数据及类型。

- `src/pages/personal/index.tsx`
  - 改为从 `constant.ts` 导入静态数据和共享类型，删除页面内常量数据定义。

- `taskRecord.md`
  - 追加本次常量拆分任务记录。

---

## 日期

2026-05-17

## 任务目的

将个人页相关 TypeScript 类型定义统一拆分到同目录 `type.d.ts`，让常量数据和页面组件不再直接声明共享类型。

## 完成过程

1. 读取 `src/pages/personal/type.d.ts`、`constant.ts` 和 `index.tsx`，确认类型定义分别散落在常量文件和页面文件中。
2. 将机场、地图、航迹、机场分组和坐标定位相关接口统一迁入 `type.d.ts` 并导出。
3. 调整 `constant.ts` 使用 `import type` 引入数据标注所需类型，保留静态数据导出。
4. 调整 `index.tsx` 使用 `import type` 从 `type.d.ts` 引入页面渲染与计算所需类型。
5. 检查相关文件诊断并运行构建验证，确认类型拆分后项目仍可正常构建。

## 修改具体文件

- `src/pages/personal/type.d.ts`
  - 新增个人页机场、地图、航迹、机场分组和坐标定位相关类型定义。

- `src/pages/personal/constant.ts`
  - 移除内联接口定义，改为从 `type.d.ts` 导入类型。

- `src/pages/personal/index.tsx`
  - 移除页面内接口定义，改为从 `type.d.ts` 导入类型。

- `taskRecord.md`
  - 追加本次类型拆分任务记录。

---

## 日期

2026-05-17

## 任务目的

为个人页“拍摄的飞机”图片列表增加单张图片点击后的全屏预览能力。

## 完成过程

1. 读取 `impeccable` 规范、项目产品与设计上下文，确认全屏预览需要保持夜航档案风格并具备键盘可用性。
2. 将图片缩略图改为可聚焦按钮，点击后记录当前图片索引并打开全屏预览层。
3. 新增预览层关闭逻辑，支持关闭按钮、点击遮罩和 `Esc` 键退出，并在打开时锁定背景滚动。
4. 为预览层补充焦点管理，打开后聚焦关闭按钮，关闭后回到原触发元素。
5. 新增全屏预览样式，补充缩略图按钮焦点态、预览标题、关闭按钮和响应式布局。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增图片预览状态、打开关闭逻辑、键盘退出、背景滚动锁定和焦点管理。
  - 将图片缩略图改为按钮触发，并渲染全屏预览层。

- `src/pages/personal/index.css`
  - 新增缩略图按钮、焦点态和全屏图片预览层样式。

- `taskRecord.md`
  - 追加本次图片全屏预览任务记录。

---

## 日期

2026-05-17

## 任务目的

修复个人页图片全屏预览层布局，使其覆盖当前全部可视窗口并让图片垂直水平居中。

## 完成过程

1. 读取 `src/pages/personal/index.tsx`、`src/pages/personal/index.css` 和全局 `App.css`，确认预览层放在带 `transform` 动画的页面容器内会影响固定定位效果。
2. 将全屏预览层改为通过 `createPortal` 挂载到 `document.body`，避免被页面容器的定位上下文限制。
3. 调整预览层 CSS 为固定覆盖完整视口，并让内容容器绝对铺满窗口。
4. 调整预览图片样式，使用视口尺寸限制并保持垂直水平居中展示。
5. 保留关闭按钮、遮罩点击、键盘退出和焦点管理能力。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 使用 `createPortal` 将图片预览层挂载到 `document.body`。

- `src/pages/personal/index.css`
  - 调整预览层为整屏覆盖布局，并让预览图片在视口中居中。

- `taskRecord.md`
  - 追加本次全屏预览布局修复记录。

---

## 日期

2026-05-17

## 任务目的

为个人页图片全屏预览的打开和关闭增加平滑过渡效果。

## 完成过程

1. 读取 `/animate` 与前端设计规范，确认动效应服务于预览层状态变化，避免装饰性过度动画。
2. 为图片预览关闭流程增加延迟卸载状态，让退出动画播放完成后再移除预览层。
3. 新增关闭计时器清理逻辑，避免快速开关图片时残留过期关闭任务。
4. 为预览遮罩和图片内容补充进入与退出关键帧，使用 `opacity` 和 `transform` 保持动画性能。
5. 保留原有全屏覆盖、居中展示、遮罩关闭、`Esc` 关闭和焦点管理能力。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增预览关闭状态、退出动画延迟卸载和计时器清理逻辑。

- `src/pages/personal/index.css`
  - 新增图片预览遮罩和内容的进入、退出过渡动画。

- `taskRecord.md`
  - 追加本次图片预览动效任务记录。

---

## 日期

2026-05-17

## 任务目的

新增仅在生产构建阶段执行的 Rsbuild 插件，为个人页飞机图片生成小体积预览图，并让列表使用预览图、全屏时加载原图。

## 完成过程

1. 读取 `rsbuild-best-practices` 规范、`rsbuild.config.ts`、个人页图片常量和页面渲染逻辑，确认应使用 Rsbuild build hook 在生产构建前生成预览资源。
2. 新增 `sharp` 和 Node 类型声明作为构建期依赖，用于下载远程图片并压缩成 48px WebP data URL。
3. 在 `rsbuild.config.ts` 中新增 `pluginAircraftPhotoPreviews`，通过 `onBeforeBuild` 提取 `constant.ts` 中启用的图片 URL，分批下载并生成预览图映射。
4. 为插件增加单图下载超时、失败回退和已生成预览图缓存读取，避免远程图片不可达时阻塞构建。
5. 新增 `photoPreviews.generated.ts` 作为构建生成模块，并在 `constant.ts` 中导出包含 `originalUrl` 与 `previewUrl` 的 `aircraftPhotos` 数据。
6. 调整个人页图片列表使用 `previewUrl` 展示缩略图，全屏预览继续读取 `originalUrl`，确保只有点击后才加载原图。
7. 运行诊断和生产构建验证，确认构建成功；部分远程图片超时会按预期回退到原图。

## 修改具体文件

- `rsbuild.config.ts`
  - 新增生产构建期图片预览图生成插件，包含 URL 提取、下载、压缩、缓存和超时兜底逻辑。

- `src/pages/personal/photoPreviews.generated.ts`
  - 新增构建生成的图片预览图映射模块。

- `src/pages/personal/type.d.ts`
  - 新增 `AircraftPhoto` 类型。

- `src/pages/personal/constant.ts`
  - 新增 `aircraftPhotos` 数据，将原图 URL 与构建期预览图 URL 组合输出。

- `src/pages/personal/index.tsx`
  - 图片列表改用预览图展示，全屏预览继续使用原图。

- `package.json`
  - 新增 `sharp` 和 `@types/node` 构建期开发依赖。

- `pnpm-lock.yaml`
  - 更新依赖锁定信息。

- `taskRecord.md`
  - 追加本次构建期图片预览图生成任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

将飞机照片预览图生成插件逻辑从 `rsbuild.config.ts` 拆分到独立的 `rsbuild_plugins/pluginAircraftPhotoPreviews.ts`，保持 Rsbuild 配置文件聚焦于配置声明。

## 完成过程

1. 读取 `rsbuild-best-practices` 规范和现有 `rsbuild.config.ts`，确认拆分范围为构建期图片预览图生成插件及其辅助函数。
2. 在 `rsbuild_plugins/pluginAircraftPhotoPreviews.ts` 中迁入 URL 提取、远程图片下载压缩、缓存读取、生成模块写入和 Rsbuild 插件注册逻辑。
3. 精简 `rsbuild.config.ts`，移除插件内部实现，仅保留 `pluginAircraftPhotoPreviews` 的导入与 `plugins` 注册。
4. 使用诊断工具检查 `rsbuild.config.ts` 与 `rsbuild_plugins/pluginAircraftPhotoPreviews.ts`，确认未发现 lint 问题。

## 修改具体文件

- `rsbuild.config.ts`
  - 移除构建期图片预览图生成实现，改为从插件文件导入并注册 `pluginAircraftPhotoPreviews`。

- `rsbuild_plugins/pluginAircraftPhotoPreviews.ts`
  - 新增飞机照片预览图生成插件实现，封装原有下载、压缩、缓存和生成模块逻辑。

- `taskRecord.md`
  - 追加本次 Rsbuild 插件逻辑拆分任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

在应用底部新增联系作者入口，链接到作者 GitHub 主页。

## 完成过程

1. 读取 `impeccable` 设计规范、`PRODUCT.md`、`DESIGN.md` 与产品界面参考，确认新增入口应保持克制的产品型样式。
2. 在 `src/App.tsx` 中新增作者主页常量，并在应用主内容后添加语义化 `footer` 与外链。
3. 在 `src/App.css` 中新增底部联系入口样式，补充 hover 与键盘 focus 可见反馈，并适配小屏对齐。
4. 准备通过诊断和构建验证新增底部链接不会破坏现有应用壳布局。

## 修改具体文件

- `src/App.tsx`
  - 新增 `AUTHOR_PROFILE_URL` 常量和底部“联系作者”外链。

- `src/App.css`
  - 新增应用底部和联系作者链接样式，包含 hover、focus-visible 与小屏布局。

- `taskRecord.md`
  - 追加本次底部联系作者入口任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

将“联系作者”入口从页面底部调整到顶部导航栏，提升入口可见性并与主导航保持一致。

## 完成过程

1. 读取 `src/App.tsx` 与 `src/App.css`，确认当前“联系作者”位于应用底部 footer。
2. 将作者 GitHub 外链移动到顶部 `nav` 内，复用现有导航链接样式。
3. 删除不再使用的 footer 结构和底部联系链接样式，避免遗留无效 CSS。
4. 准备通过诊断和构建验证导航布局调整。

## 修改具体文件

- `src/App.tsx`
  - 将“联系作者”外链从底部 footer 移入顶部导航栏。

- `src/App.css`
  - 删除底部 footer 与联系作者链接样式，保留顶部导航统一样式。

- `taskRecord.md`
  - 追加本次联系作者入口位置调整任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

为个人航空档案的全屏图片预览新增原图加载提示，减少大图加载期间的卡顿错觉并增强交互反馈。

## 完成过程

1. 读取 `src/pages/personal/index.tsx` 与 `src/pages/personal/index.css`，确认全屏预览层当前直接渲染原图。
2. 在个人页组件中新增原图加载状态，打开预览时进入 loading，图片 `load` 或 `error` 后结束 loading。
3. 在全屏预览层中新增带 `role="status"` 与 `aria-live` 的加载提示，兼顾视觉反馈与辅助技术提示。
4. 为加载提示补充深色档案风格样式和轻量转动指示，图片加载期间隐藏未完成渲染的原图。
5. 准备运行诊断和构建验证交互改动。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增全屏原图加载状态、加载完成处理和加载提示结构。

- `src/pages/personal/index.css`
  - 新增加载提示、转动指示和加载期间图片隐藏样式。

- `taskRecord.md`
  - 追加本次全屏图片预览 loading 任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

提高构建期飞机照片预览图压缩质量，让缩略图达到接近 480p 的可辨识清晰度。

## 完成过程

1. 读取 `rsbuild_plugins/pluginAircraftPhotoPreviews.ts`，确认当前预览图生成参数为 48px 与较低 WebP 质量。
2. 将预览图尺寸提升为 640x480，并提高 WebP quality 与 effort，让压缩后仍可看清图片内容。
3. 新增 `480p-v1` 缓存版本标记，避免继续复用旧版模糊 data URL。
4. 将下载与压缩超时时间放宽到 12 秒，提高较大预览图生成成功率。
5. 运行生产构建刷新 `photoPreviews.generated.ts`，确认构建通过；少数远程图片仍因网络或处理耗时超时并按现有逻辑回退原图。

## 修改具体文件

- `rsbuild_plugins/pluginAircraftPhotoPreviews.ts`
  - 提升预览图尺寸、WebP 压缩质量和超时时间，并新增缓存版本校验。

- `src/pages/personal/photoPreviews.generated.ts`
  - 由构建刷新为新版更高清的预览图 data URL 映射。

- `taskRecord.md`
  - 追加本次预览图压缩质量提升任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

将世界地图 SVG 生成脚本 `rsbuild_plugins/generateMap.ts` 从 JavaScript 写法转换为类型完整的 TypeScript。

## 完成过程

1. 读取 `generateMap.ts` 与 `tsconfig.json`，确认当前脚本虽为 `.ts` 文件但仍使用 CommonJS `require` 和隐式类型。
2. 将文件系统依赖改为 `node:fs` ESM import，并为 GeoJSON 坐标、几何、Feature、国家路径和地图标签补充类型声明。
3. 为 XML 转义、投影、ring/path 转换、经纬网和国家分组生成函数补齐参数与返回值类型。
4. 保留原有输入输出路径、SVG 样式和生成结构，避免改变生成结果职责。
5. 使用 `ReadLints` 与单文件 `tsc --ignoreConfig --noEmit` 验证脚本类型检查通过。

## 修改具体文件

- `rsbuild_plugins/generateMap.ts`
  - 转换为 TypeScript ESM 写法，补齐 GeoJSON 与 SVG 生成逻辑类型声明。

- `taskRecord.md`
  - 追加本次地图生成脚本 TypeScript 化任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

将个人航空档案中的机场打卡足迹图改为使用 `src/components/map/map.svg` 作为 React 组件渲染。

## 完成过程

1. 读取 `src/pages/personal/index.tsx`、`index.css`、`map.svg`、`rsbuild.config.ts` 与环境类型声明，确认项目已有 `*.svg?react` 类型但尚未接入 SVGR 插件。
2. 新增 `@rsbuild/plugin-svgr` 开发依赖，并在 `rsbuild.config.ts` 中启用 `pluginSvgr()`。
3. 在个人页引入 `map.svg?react`，用 `WorldMap` 组件替换原有手写地块 polygon 和地区标签渲染。
4. 将机场 marker 与航线叠加坐标改为基于地图 SVG 的 1200x650 世界投影坐标，保留打卡机场点位和主要航迹展示。
5. 清理不再使用的地图网格、地块和地区标签样式，新增航线叠层样式。
6. 运行诊断和生产构建验证通过；由于 SVG 地图作为组件内联进个人页异步包，个人页包体积会相应增加。

## 修改具体文件

- `rsbuild.config.ts`
  - 接入 `@rsbuild/plugin-svgr`，支持 `*.svg?react` 组件导入。

- `package.json`
  - 新增 `@rsbuild/plugin-svgr` 开发依赖。

- `pnpm-lock.yaml`
  - 更新 SVG React 组件插件依赖锁定信息。

- `src/pages/personal/index.tsx`
  - 使用 `WorldMap` 组件渲染机场足迹底图，并改用世界地图 SVG 坐标叠加航线与机场点。

- `src/pages/personal/index.css`
  - 调整地图底图、航线叠层和清理旧地块/标签样式。

- `taskRecord.md`
  - 追加本次 SVG 地图组件渲染任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

让个人航空档案中的世界地图适配当前页面组件尺寸，并将带经纬度的机场数据点准确渲染到地图内对应国家坐标位置。

## 完成过程

1. 读取个人页组件、样式、机场坐标常量、地图 SVG 与地图生成脚本，确认底图和数据投影都使用 `1200x650` 世界经纬度线性投影。
2. 将航线叠层从拉伸填充改为与底图一致的 `xMidYMid meet` 等比视窗，避免页面尺寸变化时航线偏离国家边界。
3. 将机场点位从 HTML 百分比绝对定位改为 SVG `circle`，直接使用地图画布坐标渲染，保证点位随地图等比缩放。
4. 将地图容器设置为 `1200 / 650` 宽高比，并调整点位样式为 SVG 可缩放样式。
5. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 将机场经纬度数据点渲染进 SVG 叠层，并统一地图、航线与点位的坐标系。

- `src/pages/personal/index.css`
  - 设置地图容器宽高比，并将机场点位样式改为 SVG circle 样式。

- `taskRecord.md`
  - 追加本次地图尺寸适配与坐标点渲染任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

在个人航空档案的机场足迹地图中，为机场坐标点新增鼠标 hover 时展示对应机场名称的交互。

## 完成过程

1. 读取个人页组件与样式，确认机场点位已通过 SVG `circle` 使用统一世界地图坐标系渲染。
2. 在个人页组件中新增当前悬停机场状态，根据点位投影坐标换算 tooltip 的百分比定位。
3. 为机场点增加鼠标 hover、离开、键盘 focus 和 blur 处理，并补充可读的 `aria-label`。
4. 新增地图 tooltip 样式，并让机场点在 hover 与 focus 时使用一致的高亮反馈。
5. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增机场点悬停状态与名称浮层渲染，并为点位补充键盘焦点交互。

- `src/pages/personal/index.css`
  - 新增机场名称 tooltip 样式，统一机场点 hover 与 focus 高亮效果。

- `taskRecord.md`
  - 追加本次地图坐标点名称提示任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

让个人航空档案地图中的机场坐标点在鼠标 hover 时，将鼠标样式变成对应机场所属国家的 emoji 国旗。

## 完成过程

1. 读取个人页组件与样式，确认已有机场点 hover 状态和机场名称 tooltip。
2. 新增国家名称到 emoji 国旗的映射，并复用机场描述中的国家前缀识别逻辑。
3. 在机场点鼠标进入和移动时记录鼠标屏幕坐标，用固定定位的 emoji 元素模拟跟随鼠标的国旗光标。
4. 在机场点 hover 时隐藏原生鼠标光标，同时保留键盘 focus 下的名称 tooltip 可访问性。
5. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增机场所属国家国旗映射、鼠标坐标状态与国旗光标渲染逻辑。

- `src/pages/personal/index.css`
  - 新增国旗光标样式，并在机场点 hover 时隐藏原生光标。

- `taskRecord.md`
  - 追加本次地图点位国旗光标任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

将个人航空档案中的地图渲染、坐标投影、点位交互和样式逻辑拆分到 `src/components/map/index.tsx`，形成只接收标注数据即可渲染的通用地图组件。

## 完成过程

1. 读取个人页组件、个人页样式、地图组件入口和机场坐标数据，确认地图逻辑目前集中在个人页内。
2. 在 `src/components/map/index.tsx` 中新增 `AnnotatedWorldMap` 组件，封装地图底图、坐标投影、航线绘制、点位 hover、tooltip、国旗光标和图例渲染。
3. 新增 `src/components/map/index.css`，将原个人页内的地图容器、底图、航线、标记点、tooltip、国旗光标和图例样式迁移到组件目录。
4. 改造个人页，只将机场数据整理为 `WorldMapMarker[]` 并传入通用地图组件，移除页面内地图渲染和交互状态。
5. 清理个人页样式中已迁移的地图样式，保留照片预览和机场列表样式。
6. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/components/map/index.tsx`
  - 新增通用地图组件及其标注、航线数据类型，封装地图渲染与交互逻辑。

- `src/components/map/index.css`
  - 新增地图组件样式，承载底图容器、航线、点位、tooltip、国旗光标和图例视觉。

- `src/pages/personal/index.tsx`
  - 改为生成机场标注数据并调用通用地图组件，移除页面内地图坐标投影与 hover 交互逻辑。

- `src/pages/personal/index.css`
  - 删除已迁移到地图组件内的地图相关样式。

- `taskRecord.md`
  - 追加本次地图通用组件拆分任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

修正通用地图组件中国旗光标的位置，让机场点 hover 时国旗稳定悬浮在鼠标上方。

## 完成过程

1. 读取 `src/components/map/index.tsx` 和 `src/components/map/index.css`，确认国旗光标当前渲染在地图容器内部。
2. 将国旗光标通过 `createPortal` 渲染到 `document.body`，避免受地图容器定位和裁剪影响。
3. 调整国旗光标 CSS transform，以鼠标屏幕坐标为锚点居中悬浮在鼠标上方。
4. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/components/map/index.tsx`
  - 将国旗光标改为 portal 渲染，保持基于鼠标 `clientX/clientY` 的固定定位。

- `src/components/map/index.css`
  - 调整国旗光标偏移方式，使其显示在鼠标正上方。

- `taskRecord.md`
  - 追加本次国旗光标位置修正任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

微调地图机场点 hover 时的国旗光标位置，让国旗直接出现在鼠标 hover 位置。

## 完成过程

1. 根据交互反馈确认国旗不再需要悬浮在鼠标上方，而是应与鼠标 hover 坐标对齐。
2. 调整 `src/components/map/index.css` 中国旗光标的 `transform`，以鼠标坐标为中心显示。
3. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/components/map/index.css`
  - 将国旗光标偏移从上方悬浮调整为鼠标 hover 位置居中显示。

- `taskRecord.md`
  - 追加本次国旗光标 hover 位置微调任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

修复地图机场点 hover 时系统问号光标与国旗光标切换产生的闪烁问题。

## 完成过程

1. 确认闪烁来自机场标记点默认 `cursor: help` 在国旗光标渲染前短暂显示。
2. 将机场标记点默认光标直接设置为 `cursor: none`，避免进入 hover 区域时先显示问号光标。
3. 移除冗余的 hover 光标覆盖样式。
4. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/components/map/index.css`
  - 将地图标记点默认光标改为隐藏，消除切换到国旗光标前的问号闪烁。

- `taskRecord.md`
  - 追加本次国旗光标闪烁修复任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

维护项目基础规则，补充 `src/pages/` 与 `src/components/` 模块目录的文件组织职责说明。

## 完成过程

1. 读取 `create-rule` skill 与现有 `.cursor/rules/project-base-rules.mdc`，确认需要维护的是已存在的 alwaysApply 项目基础规则。
2. 在目录说明中新增 `src/components/` 的职责描述。
3. 补充 `src/pages/*/` 页面模块和 `src/components/*/` 组件模块的常见四文件结构约定，明确 `constant.ts`、`type.d.ts`、`index.tsx`、`index.css` 的职责边界。
4. 使用 `ReadLints` 检查本次修改文件。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 新增通用组件目录说明，并补充页面/组件模块四类文件的职责约定。

- `taskRecord.md`
  - 追加本次项目规则维护任务记录。

---

# 任务记录

## 日期

2026-05-17

## 任务目的

为通用地图组件新增基于鼠标局部位置的缩放能力，并支持放大后拖拽平移地图。

## 完成过程

1. 读取 `src/components/map/index.tsx` 和 `src/components/map/index.css`，确认地图底图、航线、标记点和 tooltip 已封装在通用组件内。
2. 新增地图视口缩放和平移状态，滚轮缩放时以鼠标在地图容器内的位置为锚点重新计算位移。
3. 将底图、航线、标记点和 tooltip 放入同一个可变换视口层，确保缩放和拖拽时保持同步。
4. 新增 pointer 拖拽逻辑，只有地图放大后才允许拖拽，并限制平移范围避免地图被拖出可视区域。
5. 调整地图样式，补充可缩放视口层、放大拖拽光标和触控拖拽行为。
6. 使用 `ReadLints` 与构建命令检查本次修改文件。

## 修改具体文件

- `src/components/map/index.tsx`
  - 新增地图缩放、局部锚点计算、边界收束和放大后拖拽平移逻辑。

- `src/components/map/index.css`
  - 新增地图视口层样式、放大/拖拽光标状态和触控拖拽配置。

- `taskRecord.md`
  - 追加本次地图缩放拖拽交互任务记录。

---

## 日期

2026-05-17

## 任务目的

避免地图内滚轮缩放影响外层页面滚动，并修正放大后机场名称气泡相对标记点的定位错位。

## 完成过程

1. 确认 React 合成事件对 `wheel` 的 passive 默认行为会导致 `preventDefault` 无法阻止页面滚动。
2. 使用 `ref` 在地图容器上以 `{ passive: false }` 注册原生 `wheel` 监听，在缩放逻辑中同时 `preventDefault` 与 `stopPropagation`，并移除 JSX 上的 `onWheel` 避免重复处理。
3. 放大状态下 tooltip 使用 `scale(1/scale)` 抵消父级缩放时，为气泡设置 `transform-origin: 50% 100%`，使底部中心对准标记点，避免默认中心原点导致的水平偏移。
4. 使用 `ReadLints` 检查 `taskRecord.md` 与本次修改过的 `src/components/map/index.tsx`。

## 修改具体文件

- `src/components/map/index.tsx`
  - 原生非 passive `wheel` 监听、`stopPropagation`、tooltip 的 `transformOrigin` 与相关 hooks 调整。

- `taskRecord.md`
  - 追加本次地图滚轮与 tooltip 修正记录。
