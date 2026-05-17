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
