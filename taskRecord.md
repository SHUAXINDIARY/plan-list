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

---

## 日期

2026-05-17

## 任务目的

将首页航司机型资料页的常量与 TypeScript 类型从 `index.tsx` 拆出，分别放入同级 `constant.ts` 与 `type.d.ts`。

## 完成过程

1. 新建 `src/pages/home/type.d.ts`，导出制造商/航司/JSON 数据结构、参考来源与客机排序联合类型。
2. 新建 `src/pages/home/constant.ts`，迁移静态数据 URL、制造商筛选占位值、默认排序与参考来源列表，并从 `./type` 引入所需类型。
3. 调整 `src/pages/home/index.tsx`：从 `./constant` 与 `./type` 导入，保留类型守卫与数据转换、过滤、排序等页面逻辑。
4. 使用 `ReadLints` 检查 `taskRecord.md` 与本次变更的 `src/pages/home/*` 文件。

## 修改具体文件

- `src/pages/home/type.d.ts`（新建）
  - 页面相关接口与类型别名。

- `src/pages/home/constant.ts`（新建）
  - `AIRPLANE_DATA_URL`、`ALL_MANUFACTURERS_VALUE`、`DEFAULT_PASSENGER_AIRCRAFT_SORT_ORDER`、`AIRLINE_REFERENCE_SOURCES`。

- `src/pages/home/index.tsx`
  - 移除内联类型与常量，改为从上述模块导入。

- `taskRecord.md`
  - 追加本次首页模块拆分记录。

---

## 日期

2026-05-17

## 任务目的

移除首页航司机型资料的图片入口与弹窗逻辑；从 `airplan.json` 与类型中删除 `imgs` 字段。

## 完成过程

1. 更新 `src/pages/home/type.d.ts` 与 `createAirlineFleets` 映射，去掉 `imgs`。
2. 删除 `index.tsx` 中图片弹窗状态、Escape 监听、按钮与弹窗 JSX。
3. 清理 `index.css` 中「查看图片」与 image-dialog 相关样式，并简化 `airline-entry__header` 布局。
4. 自 `public/data/airplan.json` 各航司条目中移除 `imgs` 行，保持其余 JSON 排版不变。
5. 使用 `ReadLints` 检查本次修改的 `src/pages/home/*` 与 `taskRecord.md`。

## 修改具体文件

- `src/pages/home/type.d.ts`
  - `AirlineFleet`、`AirplaneDataItem` 不再包含 `imgs`。

- `src/pages/home/index.tsx`
  - 移除图片按钮、弹窗及相关 effect 与 state。

- `src/pages/home/index.css`
  - 移除图片按钮与弹窗样式；微调航司卡片 header。

- `public/data/airplan.json`
  - 删除全部 `imgs` 属性。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-22

## 任务目的

调整参考资料页面外链 hover 效果，移除边框高亮，仅突出对应链接。

## 完成过程

1. 检查 `src/pages/references/index.css` 中参考资料链接的 hover 与 focus-visible 样式。
2. 移除 hover/focus 状态下的边框变色，保留文字颜色、背景和轻微位移反馈。
3. 使用 `ReadLints` 检查本次修改文件。

## 修改具体文件

- `src/pages/references/index.css`
  - 移除参考资料外链 hover/focus 时的边框高亮。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-22

## 任务目的

调整参考资料页面顶部概览胶囊，使数字与文案垂直居中。

## 完成过程

1. 检查 `src/pages/references/index.css` 中概览胶囊的对齐方式。
2. 将 `.reference-archive__summary span` 的交叉轴对齐从基线改为居中，避免数字和中文文案出现上下错位。
3. 使用 `ReadLints` 检查本次修改文件。

## 修改具体文件

- `src/pages/references/index.css`
  - 调整参考资料概览胶囊内文本垂直对齐方式。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-22

## 任务目的

将首页底部参考来源区块抽离为独立参考资料页面，并在主导航增加入口。

## 完成过程

1. 读取 `impeccable` skill、项目产品与设计上下文，确认新页面应延续 Night Flight Archive 的产品界面风格。
2. 从 `src/pages/home/index.tsx` 移除底部参考来源折叠区和本地 URL 域名格式化逻辑。
3. 新增 `src/pages/references/` 页面模块，集中展示参考来源分组、链接数量和可扫读外链域名。
4. 在 `src/App.tsx` 增加 `/references` 懒加载路由和“参考资料”主导航入口。
5. 同步更新 `DESIGN.md` 中的路由说明。

## 修改具体文件

- `src/App.tsx`
  - 新增“参考资料”导航项、懒加载页面和 `/references` 路由。
- `src/pages/home/index.tsx`
  - 移除首页内嵌参考来源区块。
- `src/pages/home/index.css`
  - 移除首页参考来源折叠区样式。
- `src/pages/references/index.tsx`
  - 新增独立参考资料页面，复用现有数据常量并展示来源分组。
- `src/pages/references/index.css`
  - 新增参考资料页布局、列表、外链和响应式样式。
- `DESIGN.md`
  - 更新当前产品结构中的路由说明。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-22

## 任务目的

按 Impeccable 产品界面原则优化首页底部数据参考来源区域的布局与样式，提升来源索引的可扫读性。

## 完成过程

1. 读取 `impeccable` skill 与用户提供的 Impeccable Style 摘录，确认本次优化应保持产品型、克制、资料索引式表达。
2. 在 `src/pages/home/index.tsx` 中新增参考来源 URL 域名格式化函数，让链接显示可辨识域名而不是泛泛的序号文案。
3. 调整参考来源 `details` 内部结构，新增说明文案、来源组数、单组来源数量、序号与域名展示。
4. 在 `src/pages/home/index.css` 中重写参考来源区域样式，改为低干扰折叠索引、紧凑分栏、细边框层级和清晰 hover / focus 状态。
5. 使用 `ReadLints` 检查首页 TSX 与 CSS 文件。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 新增 `getReferenceUrlHost` 辅助函数。
  - 优化参考来源区域结构与链接展示文案。
- `src/pages/home/index.css`
  - 重写参考来源区 summary、分组、链接行与移动端样式。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-21

## 任务目的

按 Impeccable 产品界面原则，为个人页机场国家/地区折叠列表增加克制的展开与收起过渡效果。

## 完成过程

1. 阅读用户提供的 Impeccable Style 页面摘录，并结合当前 `PRODUCT.md`、`DESIGN.md` 的产品界面基调确认动效应服务状态变化。
2. 将机场列表从 `hidden` 即时显示/隐藏改为保留在 DOM 中的 `airport-country__body` 折叠容器。
3. 通过 `grid-template-rows`、`opacity` 与 `transform` 组合实现短时长展开/收起过渡，并保留 `aria-expanded` 与 `aria-hidden` 状态表达。
4. 调整个人页 CSS，补充内容区过渡、溢出裁剪和展开态指示，保持 Night Flight Archive 的克制视觉。
5. 使用 `ReadLints` 检查个人页 TSX 与 CSS 文件。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 将机场列表包裹为可过渡的折叠内容区域。
  - 保留按钮控制关系，并用 `aria-hidden` 表达内容区折叠状态。
- `src/pages/personal/index.css`
  - 新增折叠内容区展开/收起过渡效果。
  - 移除 `hidden` 直接 `display: none` 的即时切换样式。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

在首页航司列表标题处展示航司英文名，并保持与中文名称同行、小字号辅助呈现。

## 完成过程

1. 阅读首页渲染逻辑、样式和航司机队类型定义，确认标题数据来自 `createAirlineFleets` 转换后的 `AirlineFleet`。
2. 在 `AirlineFleet` 中补充 `airlineEnglishName` 字段，并在数据转换时从 `AirplaneDataItem.airlineEnglishName` 传入。
3. 在航司标题 DOM 中新增英文名展示节点，放在中文名后方同行显示。
4. 新增标题行样式，让中英文名称基线对齐；英文名使用更小字号与更弱颜色，小屏允许换行避免溢出。
5. 使用 `ReadLints` 检查本次修改文件。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 航司机队转换保留英文名字段，并在航司标题中文名后展示英文名。
- `src/pages/home/index.css`
  - 新增 `.airline-entry__heading`、`.airline-entry__english-name`、`.airline-entry__meta` 样式，控制同行标题与辅助字号。
- `src/pages/home/type.d.ts`
  - 为 `AirlineFleet` 增加 `airlineEnglishName` 字段说明。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

为 `public/data/airplan.json` 中每个航司记录新增英文名字段，便于后续英文展示、搜索或数据匹配。

## 完成过程

1. 阅读 `public/data/airplan.json`，确认每条航司数据以 `airline`、`passengerAircraftCount`、`models` 为主结构。
2. 根据用户提供的中英文航司名称清单，在每个对应航司记录中新增 `airlineEnglishName` 字段。
3. 同步更新 `src/pages/home/type.d.ts` 中的 `AirplaneDataItem` 类型声明，补充新增字段语义。
4. 校验 JSON 结构与新增字段覆盖情况，并检查相关文件 linter 结果。

## 修改具体文件

- `public/data/airplan.json`
  - 为每个航司对象新增 `airlineEnglishName` 字段，值为用户提供的英文航司名称。
- `src/pages/home/type.d.ts`
  - 为 `AirplaneDataItem` 增加 `airlineEnglishName` 类型字段及说明。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-17

## 任务目的

将 `public/data/airplan.json` 中各航司 `models` 下的机型列表改为「机型名 -> 空字符串」的映射结构，并同步类型与首页数据转换逻辑。

## 完成过程

1. 遍历全部航司条目，将每个制造商下的机型数组转为以机型为 key、`value` 为 `""` 的对象。
2. 更新 `AirplaneDataItem.models` 类型为 `Record<string, Record<string, string>>`。
3. 在 `createAirlineFleets` 中用 `Object.keys(modelMap)` 得到机型列表供现有 UI 渲染。
4. 运行 `pnpm run build` 通过构建；对 `taskRecord.md` 与本次改动文件执行 `ReadLints`。

## 修改具体文件

- `public/data/airplan.json`
  - `models` 内由 `string[]` 改为 `Record<string, "" | string>`（当前值均为空串）。

- `src/pages/home/type.d.ts`
  - `AirplaneDataItem.models` 类型与上述结构对齐。

- `src/pages/home/index.tsx`
  - `createAirlineFleets` 从新映射结构提取机型名称数组。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-17

## 任务目的

首页航司机型列表中，当 `airplan.json` 里某机型映射值为非空且为 http(s) URL 时，点击在新标签页打开该链接。

## 完成过程

1. 扩展类型：`AircraftModelEntry` 承载机型名与原始映射字符串；`ManufacturerFleet.models` 使用该结构。
2. 在 `createAirlineFleets` 中由 `Object.entries(modelMap)` 构建条目，保留 JSON 中键顺序。
3. 新增 `isHttpOrHttpsUrl`，用 `URL` 校验协议仅为 `http:`/`https:`，列表渲染时对合法 URL 输出 `<a target="_blank" rel="noreferrer">`。
4. 为 `.aircraft-model-list` 内链接补充与现有芯片风格一致的样式。
5. 运行 `pnpm run build`；对改动文件执行 `ReadLints`。

## 修改具体文件

- `src/pages/home/type.d.ts`
  - 新增 `AircraftModelEntry`；`ManufacturerFleet.models` 改为该数组；补充 `AirplaneDataItem.models` 注释。

- `src/pages/home/index.tsx`
  - `isHttpOrHttpsUrl`、数据映射与机型列表条件渲染外链。

- `src/pages/home/index.css`
  - 机型列表内链接颜色与下划线样式。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

首页机型资料筛选区新增「具体型号」下拉，按所选机型过滤航司列表及卡片内展示的机型芯片。

## 完成过程

1. 在 `constant.ts` 增加 `ALL_AIRCRAFT_MODELS_VALUE`，与制造商「全部」语义对齐。
2. 实现 `getAircraftModelOptions`：在全部制造商时收集全局唯一型号；选定制造商时仅收集该制造商下出现过的型号。
3. 扩展 `filterAirlineFleets`：在制造商筛选后对 `ManufacturerFleet.models` 按机型名等值过滤，并同步 `aircraftCount` / `manufacturerCount`。
4. 增加 `selectedAircraftModel` 状态、`handleAircraftModelChange`、工具栏 `<select>`；制造商变化导致当前型号不在选项内时重置为「全部型号」。
5. 更新 `filteredViewKey` 含型号条件；运行 `pnpm run build` 与 `ReadLints`。

## 修改具体文件

- `src/pages/home/constant.ts`
  - 新增 `ALL_AIRCRAFT_MODELS_VALUE`。

- `src/pages/home/index.tsx`
  - `getAircraftModelOptions`、`filterAirlineFleets` 型号参数、型号选项 memo、`useEffect` 校正非法选中、工具栏「具体型号」下拉。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

首页筛选工具栏与概览统计在同一行横向排布，避免筛选条件换行。

## 完成过程

1. 将 `.fleet-toolbar` 改为横向 `flex` + `nowrap`，窄屏 `overflow-x: auto` 横向滚动。
2. `.fleet-summary` 与 `.fleet-filters` 同行；概览区右侧竖线分隔，去掉原先底部分割。
3. `.fleet-filters` 改为横向 `flex` + `nowrap`；为第一项航司搜索设置更大 `flex` 与 `max-width`。
4. 移除原 900px / 640px 下将筛选项改为多列栅格的规则；`ReadLints` 检查 CSS。

## 修改具体文件

- `src/pages/home/index.css`
  - `.fleet-toolbar`、`.fleet-summary`、`.fleet-filters`、`.fleet-filter` 布局与响应式调整。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

航司机型工具栏改为两行：首行仅概览统计，次行筛选条件仍单行横向展示（必要时横向滚动）。

## 完成过程

1. `.fleet-toolbar` 改为纵向 `flex-direction: column`，去掉整栏横向滚动。
2. `.fleet-summary` 恢复底部分割线，去掉与筛选区同列时的右侧竖线。
3. `.fleet-filters` 保留 `flex-wrap: nowrap`，将 `overflow-x: auto` 仅放在第二行；`ReadLints` 检查 `index.css`。

## 修改具体文件

- `src/pages/home/index.css`
  - `.fleet-toolbar`、`.fleet-summary`、`.fleet-filters` 两行布局调整。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

在项目基础规则中补充 TypeScript 类型与成员的注释要求。

## 完成过程

1. 在 `.cursor/rules/project-base-rules.mdc` 的「TypeScript 规范」中新增两条：类型定义须有类型级注释；`interface` / `class` 内每个属性与方法须有独立注释。
2. 对规则文件执行 `ReadLints`。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 补充类型与成员注释约定。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

延续 TypeScript 注释规范，补充具名 type、Pick/Omit、匿名对象、enum 成员与泛型参数的注释约定。

## 完成过程

1. 在 `.cursor/rules/project-base-rules.mdc`「TypeScript 规范」中新增五条，覆盖对象字面量与交叉 type、从已注释类型的工具类型省略重复注释、匿名结构边界、enum 成员与泛型形参。
2. `ReadLints` 检查规则文件。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 补充上述 edge case 约定。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

在「函数与状态」中补充函数体内部步骤、调用依赖与控制流注释要求。

## 完成过程

1. 在 `.cursor/rules/project-base-rules.mdc` 的「函数与状态」下新增两条：多步骤/异步边界的分段注释（依赖、调用链、外部读写）；非线性控制流与契约的意图说明。
2. `ReadLints` 检查规则文件。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 补充函数内部逻辑注释约定。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

在项目基础规则「技术栈」中补充 Impeccable Style、React 与 Rsbuild 官方文档链接。

## 完成过程

1. 在 `.cursor/rules/project-base-rules.mdc` 的「技术栈」下新增一条，汇总三个外链及使用场景说明。
2. `ReadLints` 检查规则文件。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`
  - 增加技术栈参考文档链接。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

首页参考来源列表补充 JetPhotos 与 Wikimedia Commons 两个通用数据/媒体出处。

## 完成过程

1. 在 `AIRLINE_REFERENCE_SOURCES` 中新增「航机影像与开放媒体」分组，收录 `https://www.jetphotos.com/` 与 `https://commons.wikimedia.org/`。
2. `ReadLints` 检查 `constant.ts` 与 `taskRecord.md`。

## 修改具体文件

- `src/pages/home/constant.ts`
  - 新增参考来源项。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

应用顶部主导航增加「补充资料」入口，新开标签页跳转飞书资料征集表单。

## 完成过程

1. 在 `App.tsx` 增加 `CONTRIBUTION_FORM_URL` 常量及「补充资料」外链（`target="_blank"`、`rel="noreferrer"`），置于「联系作者」之前。
2. 在 `App.css` 增加 `app-nav__link--cta` 样式以略突出的胶囊按钮视觉。
3. 运行 `pnpm run build`；`ReadLints` 检查改动文件。

## 修改具体文件

- `src/App.tsx`
  - 飞书表单 URL 常量与导航链接。

- `src/App.css`
  - `.app-nav__link--cta` 样式。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-18

## 任务目的

将首页机型数据概览统计与「补充资料」外链排在同一行展示。

## 完成过程

1. 抽取飞书表单地址至 `src/constants/external-links.ts`，供 `App.tsx` 与首页共用。
2. 在 `fleet-summary` 内增加 `fleet-summary__stats` 包裹三项统计胶囊，右侧放置与主导航样式一致的「补充资料」链接。
3. 调整 `index.css`：`fleet-summary` 使用横向 `flex` 与 `space-between`，窄屏时自动折行。
4. 运行 `pnpm run build`；`ReadLints` 检查改动文件。

## 修改具体文件

- `src/constants/external-links.ts`
  - 新增：`CONTRIBUTION_FORM_URL` 常量与文件说明注释。

- `src/App.tsx`
  - 从共享常量导入表单 URL，移除本地重复字符串。

- `src/pages/home/index.tsx`
  - 导入 `CONTRIBUTION_FORM_URL`；概览区结构与「补充资料」链接。

- `src/pages/home/index.css`
  - `.fleet-summary`、`.fleet-summary__stats`、`.fleet-summary__cta`；统计胶囊选择器改为 `.fleet-summary__stats span`。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-19

## 任务目的

针对移动端与小屏设备优化全局壳层、机型资料库首页、个人档案页与世界地图组件的布局与安全区，提升触控可用性与可读性。

## 完成过程

1. 在 `rsbuild.config.ts` 的 HTML viewport 中增加 `viewport-fit=cover`，配合 CSS `env(safe-area-inset-*)` 处理刘海屏与底部指示条。
2. 调整 `App.css`：`app-shell` 横向裁剪溢出、`app-main` 与页头使用安全区内边距；导航链接采用约 44px 最小触控高度；窄屏下收敛标题与正文字号。
3. `home/index.css`：≤640px 时筛选区改为纵向满宽堆叠、表单控件 `16px` 字号规避 iOS 输入缩放，概览区纵向排列并放大触控目标；参考来源列表单列。
4. `personal/index.css`：概览胶囊单列铺满；照片栅格调小最小列宽；机场列表单列；全屏预览关闭按钮与安全区内边距。
5. `components/map/index.css`：窄屏缩小地图内框、图例避开底部安全区、标记描边加粗，提示文案允许换行。
6. 清理 `App.tsx` 中未使用的表单常量导入与注释导航片段。
7. 运行 `pnpm run build`；`ReadLints` 检查改动文件。

## 修改具体文件

- `rsbuild.config.ts`
  - viewport 增加 `viewport-fit=cover`。

- `src/App.tsx`
  - 移除未使用的 `CONTRIBUTION_FORM_URL` 导入与注释掉的「补充资料」导航。

- `src/App.css`
  - 壳层横向裁剪、`app-header` / `app-main` 安全区与内边距；`page-panel` `max-width`；导航链接 `inline-flex`；640px 以下触控高度与标题字号。

- `src/pages/home/index.css`
  - 640px 以下工具条、概览、筛选、列表与参考来源栅格的移动端规则。

- `src/pages/personal/index.css`
  - 640px 以下概览、图库、机场列表与照片预览的移动端规则。

- `src/components/map/index.css`
  - 640px 以下地图装饰边距、图例安全区、标记与提示样式。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-19

## 任务目的

为中国东方航空机型映射补充用户给定清单中尚未出现的机型键，参考链接暂缺时使用空字符串占位。

## 完成过程

1. 对照用户提供机型列表与 `airplan.json` 中东航现有键名。
2. 新增 `A319`、`A321NX`、`B737-8`、`B787-9`、`C909` 五条记录，`value` 设为 `""`；其余机型已在数据中保留既有 Wikimedia 链接。
3. `python3 -m json.tool` 校验 JSON；`ReadLints` 检查 `taskRecord.md`。

## 修改具体文件

- `public/data/airplan.json`
  - 中国东方航空：Airbus / Boeing / COMAC 下补充上述机型与空链接占位。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-19

## 任务目的

为中国南方航空机型映射补充用户给定清单中尚未出现的机型键，参考链接暂缺时使用空字符串占位。

## 完成过程

1. 对照用户提供机型列表与 `airplan.json` 中南航现有键名。
2. 新增 `A319neo`、`A321NX`、`B737-8`、`B777-F`、`C919-700` 五条记录，`value` 设为 `""`；清单其余机型均已存在并保持原有 Wikimedia 链接。
3. `python3 -m json.tool` 校验 JSON；`ReadLints` 检查 `taskRecord.md`。

## 修改具体文件

- `public/data/airplan.json`
  - 中国南方航空：Airbus / Boeing / COMAC 下补充上述机型与空链接占位。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-19

## 任务目的

为中国国际航空机型映射补充用户给定清单中尚未出现的机型键，参考链接暂缺时使用空字符串占位。

## 完成过程

1. 对照用户提供机型列表与 `airplan.json` 中国航现有键名。
2. 新增 `B737-8`、`C909` 两条记录，`value` 设为 `""`；清单其余机型均已存在并保持原有 Wikimedia 链接。
3. `python3 -m json.tool` 校验 JSON；`ReadLints` 检查 `taskRecord.md`。

## 修改具体文件

- `public/data/airplan.json`
  - 中国国际航空：Boeing / COMAC 下补充上述机型与空链接占位。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-19

## 任务目的

为中国国际航空机型映射再次对照用户给定清单，补全尚未出现的机型键，参考链接缺失处使用空字符串占位。

## 完成过程

1. 对照用户提供机型列表与 `airplan.json` 中国航 Airbus / Boeing / COMAC 既有键名。
2. 新增 `A319`、`A321NX`、`B747-8`、`C919-700ER` 四条记录，`value` 设为 `""`；清单中其余机型均已存在，`B737 MAX 8` 等原有键保持不变。
3. `python3 -m json.tool` 校验 JSON；`ReadLints` 检查 `taskRecord.md`、`public/data/airplan.json`。

## 修改具体文件

- `public/data/airplan.json`
  - 中国国际航空：Airbus 增加 `A319`、`A321NX`；Boeing 增加 `B747-8`；COMAC 增加 `C919-700ER`，均为空链接占位。

- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

优化首页航司机型结果区域（fleet-results）滚动条为内嵌 Scroll area 风格，不额外挤压内容布局。

## 完成过程

1. 确认 `414-455` 行所在列表滚动由父级 `.fleet-results` 承载。
2. 为 `.fleet-results` 增加 `scrollbar-width`、`scrollbar-color`（Firefox）与 `::-webkit-scrollbar` 轨道/滑块样式，与深色档案风面板一致。
3. 移除与 `scrollbar-gutter: stable` 叠床架屋的 `padding-right`，由稳定滚动槽位统一预留宽度，避免滚动条出现时内容横向跳动。

## 修改具体文件

- `src/pages/home/index.css`
  - `.fleet-results`：细滚动条配色、WebKit 圆角 thumb、hover 提亮；去掉右侧手填 padding。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

将整页（视口）滚动条与应用内 Fleet「Scroll area」风格对齐，不改变 `App.tsx` 结构、整体留白与 Night Flight Archive 基调。

## 完成过程

1. 视口纵向滚动作用于文档 `:root`，在 `App.css` 增加与 `.fleet-results` 一致的 `scrollbar-width`、`scrollbar-color`（Firefox）与 `::-webkit-scrollbar` 样式。
2. 使用 `scrollbar-gutter: stable` 占位垂直 gutter，减轻滚动条出现/消失时正文宽度跳动；无需修改各页面 padding。
3. `ReadLints` 检查 `App.css`、`taskRecord.md`。

## 修改具体文件

- `src/App.css`
  - `:root` 视口滚动条细轨道与同色系 thumb/hover。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

将 README 从 Rsbuild 默认模板改写为 Plane List / Night Flight Archive 的站点说明，并保留可执行的开发与构建命令。

## 完成过程

1. 对照 `PRODUCT.md` 提炼产品定位、目标用户与两页主干能力（机型资料库、个人记录）。
2. 补充技术栈、静态数据路径与指向 `AGENTS.md` / `PRODUCT.md` / `DESIGN.md` 的延伸阅读。
3. `ReadLints` 检查 `README.md`、`taskRecord.md`。

## 修改具体文件

- `README.md`
  - 站点简介、功能、技术栈、本地命令与外链；中英文混排以中文为主便于读者理解。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

统一滚动条（Scroll area）样式实现，抽出共享 token 与选择器列表，去掉 `App.css` 与 `home/index.css` 的规则重复。

## 完成过程

1. 在 `App.css` 的 `:root` 上声明 `--scroll-area-*` 变量，` :root` 与 `.scroll-area-night` 共用 `scrollbar-*` / `::-webkit-scrollbar-*` 规则块。
2. 首页 Fleet 容器增加工具类 `scroll-area-night`，`home/index.css` 中 `.fleet-results` 仅保留高度与 `overflow`、`overscroll` 布局语义。
3. `pnpm run build` 校验构建；`ReadLints` 检查改动文件。

## 修改具体文件

- `src/App.css`
  - 顶层滚动 token；视口与其他挂载 `scroll-area-night` 的容器共用滚动条样式。
- `src/pages/home/index.tsx`
  - `.fleet-results` 增加 `scroll-area-night`。
- `src/pages/home/index.css`
  - 删除与全局重复的 Fleet 纵向滚动条规则。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

将 `DESIGN.md` 从 seed 占位更新为反映当前实现的 Night Flight Archive 设计说明：语义色票、排版、动效变量、组件形态与滚动区约定。

## 完成过程

1. 对照 `src/App.css`、滚动条 `:root` 变量与 Fleet/壳层用法，重写颜色、字型层级、motion token、圆角与面板策略。
2. 补充路由职责表、`scroll-area-night` / `--scroll-area-*` 章节与「已实现」导航形态，去掉大量 “to be resolved” 占位。
3. 顶端注释改为中文版同步指引；`ReadLints` 检查 `DESIGN.md`、`taskRecord.md`。

## 修改具体文件

- `DESIGN.md`
  - 与设计实现同步的语义 token、结构与 Do/Don't 更新。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-20

## 任务目的

在保留现有深色「Night Flight Archive」为默认的前提下，增加日间阅读向亮色主题，并在顶栏提供深浅切换与持久化。

## 完成过程

1. 依 impeccable 原则为亮色写场景句与冷灰蓝中性策略；在 `App.css` 用 `:root` / `html[data-theme="light"]` 定义 `--pl-*` 语义 token，壳层、面板、Fleet、个人页与地图样式改为引用变量。
2. 新增 `src/utils/themePreference.ts`、`ThemeToggle` 组件；`App.tsx` 用状态与 `useLayoutEffect` 同步 `data-theme`、`localStorage` 与 `theme-color` meta。
3. `rsbuild.config.ts` 在 `<head>` 最前注入内联脚本，降低亮色刷新 FOUC；更新 `DESIGN.md` §2.4 与 Header 说明；`pnpm run build` 通过；`ReadLints` 检查改动文件。

## 修改具体文件

- `src/App.css`
  - `--pl-*` 深浅两套 token；`.app-header__actions`、`.theme-toggle`。
- `src/App.tsx`
  - 主题状态、持久化与顶栏 `ThemeToggle` 编排。
- `src/utils/themePreference.ts`
  - 存储键、读写与 `meta theme-color` 辅助函数（新建）。
- `src/components/theme-toggle/index.tsx`
  - 无障碍主题切换按钮（新建）。
- `src/pages/home/index.css`、`src/pages/personal/index.css`、`src/components/map/index.css`
  - 颜色改为 `var(--pl-*)`；地图在亮色下补充 route/marker 对比微调。
- `rsbuild.config.ts`
  - `html.tags` 首屏主题恢复脚本。
- `DESIGN.md`
  - §2.4 亮色说明、双主题概览、Header 与 Do 条款小幅更新。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

将个人页 `index.tsx` 中的模块级机场分组、地图标注与预览关闭时长等常量与派生数据拆分到 `constant.ts`，页面组件只保留交互与渲染。

## 完成过程

1. 在 `constant.ts` 中于 `CHECKED_AIRPORTS` 之后补充 `getAirportCountryName`、`groupAirportsByCountry`（模块内私有）及导出项 `airportCountryGroups`、`checkedCountryCount`、`PHOTO_PREVIEW_EXIT_DURATION_MS`、`airportMapMarkers`；引入 `WorldMapMarker` 与 `AirportCountryGroup` 类型。
2. `index.tsx` 从 `./constant` 上述导出并删除重复定义；移除对已迁移逻辑的 `WorldMapMarker` 依赖。
3. 执行 `pnpm run build` 通过；`ReadLints` 检查本次修改文件。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - 集中个人页机场分组、国家地区计数、全屏预览关闭时长、地图 markers 与国旗映射逻辑。
- `src/pages/personal/index.tsx`
  - 仅保留组件与从 `constant` 的导入。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

将通用地图组件从 SVG 叠加层改为 Canvas 绘制 `map.svg` 底图，并按视口缩放做超采样，便于放大局部后清晰查看密集标记点。

## 完成过程

1. 新增 `canvasMap.ts`：经纬度投影、视口约束、超采样像素比计算、Canvas 绘制航线/标记、屏幕坐标命中检测与 CSS 变量配色读取。
2. 新增 `type.d.ts` 承载 `WorldMapMarker`、`WorldMapRoute` 等类型，避免与绘制模块循环依赖。
3. `index.tsx` 通过 `map.svg?url` 加载位图，`ResizeObserver` 与 `MutationObserver(data-theme)` 触发重绘；滚轮缩放上限提升至 5×，放大后可拖拽平移；指针命中与方向键聚焦保留 tooltip/国旗光标。
4. `index.css` 改为 Canvas 布局并补充 `--pl-map-canvas-*` 绘制 token；`env.d.ts` 声明 `*.svg?url`；修复 `KeyboardEvent` 类型引用；`pnpm run build` 通过。

## 修改具体文件

- `src/components/map/canvasMap.ts`（新建）
  - Canvas 绘制与超采样、命中检测、视口数学工具。
- `src/components/map/type.d.ts`（新建）
  - 地图组件公共类型。
- `src/components/map/index.tsx`
  - Canvas 渲染主流程，替代 `map.svg?react` + SVG overlay。
- `src/components/map/index.css`
  - Canvas/主题绘制变量与样式清理。
- `src/env.d.ts`
  - `*.svg?url` 模块声明。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

修复地图 Canvas 首次进入页面黑屏、需滚轮缩放后才显示的问题。

## 完成过程

1. 排查绘制链路：底图异步加载仅写入 `ref`，未触发 React 重绘；容器尺寸先就绪时 `redrawMapCanvas` 因无底图提前返回，底图到达后无二次绘制。
2. 增加 `isWorldMapImageReady` 状态，在 `image.decode()` 完成后置为 `true` 并纳入 `redrawMapCanvas` 与重绘 `useEffect` 依赖，保证底图与尺寸齐备后自动首帧绘制。
3. `pnpm run build` 通过；`ReadLints` 检查 `index.tsx`。

## 修改具体文件

- `src/components/map/index.tsx`
  - 底图加载就绪状态与首帧重绘触发修复。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

修复地图画布上指针移动时国旗光标不显示、仅悬停标记点才出现的问题。

## 完成过程

1. `updatePointerOverMap` 在画布内始终更新 `flagCursorPosition`，命中标记时仍单独设置 `hoveredMarker`。
2. 国旗 Portal 改为仅依赖 `flagCursorStyle`；标记点上用 `hoveredMarker.flag`，其余区域用默认 `🌐`。

## 修改具体文件

- `src/components/map/index.tsx`
  - 画布内实时跟随指针的国旗光标展示逻辑。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

优化地图拖拽时的卡顿：国旗光标与画布应实时跟随指针，避免延迟感。

## 完成过程

1. 拖拽中不再每次 `pointermove` 调用 `setViewportTransform`，改为更新 `viewportTransformRef` 并用 `requestAnimationFrame` 合并 Canvas 重绘。
2. 拖拽结束再同步 React 状态并补一帧绘制；国旗光标在拖拽中通过 ref 直接改 DOM 的 `left/top`，避免高频 setState。
3. 开始拖拽时清除悬停标记并同步光标位置。

## 修改具体文件

- `src/components/map/index.tsx`
  - rAF 批处理重绘、拖拽视口 ref 化、国旗光标直连 DOM 更新。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

地图标记点在任意缩放级别下保持相同屏幕尺寸，且缩放/平移后仍准确落在对应经纬度位置。

## 完成过程

1. `paintAnnotatedWorldMap` 中底图与航线仍在视口变换后绘制；`restore` 后在 CSS 像素空间用 `mapCoordinateToScreen` 定位圆心。
2. 标记点半径与描边宽度改为固定像素，不再除以 `viewportTransform.scale`。

## 修改具体文件

- `src/components/map/canvasMap.ts`
  - 标记点屏幕空间固定尺寸绘制与坐标投影。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

优化地图标记 hover 时 tooltip 出现的卡顿感。

## 完成过程

1. 排查得 hover 会更新 `activeMarker?.id` 并触发整幅 Canvas 超采样重绘；已改为仅键盘聚焦时在画布高亮，hover 只更新 DOM tooltip。
2. `setHoveredMarker` 在标记 id 未变时不更新状态；国旗光标在 Portal 挂载后一律直连 DOM，减少 pointermove 导致的重渲染。
3. tooltip 增加 `will-change: left, top` 以利合成层位移。

## 修改具体文件

- `src/components/map/index.tsx`
  - hover 与 Canvas 重绘解耦、悬停状态去重、光标 DOM 直连。
- `src/components/map/index.css`
  - tooltip 合成层提示。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

优化地图画布拖拽平移时的卡顿，在保持缩放后标记点位置准确的前提下提升交互帧率。

## 完成过程

1. 分析得拖拽每帧仍执行超采样全量 `drawImage` 世界地图与反复重置 canvas backing store，是主要瓶颈。
2. 在 `canvasMap.ts` 拆分底图/航线与标记绘制，新增离屏 `buildMapLayerCache` + `blitMapLayerCache`，拖拽帧仅 blit 可见区域并重绘标记点。
3. 拖拽期使用 `getMapCanvasInteractionMetrics` 降低 DPR 与像素面积上限，并仅在尺寸变化时调整 canvas，避免 pointermove 分配显存。
4. `startMapDrag` 预构建缓存并走 rAF 轻绘路径；`stopMapDrag` 恢复全质量超采样重绘；主题切换时清空调色板与缓存。

## 修改具体文件

- `src/components/map/canvasMap.ts`
  - 交互期画布指标、底图离屏缓存、blit 与绘制函数拆分。
- `src/components/map/index.tsx`
  - 拖拽快路径、缓存失效键、画布尺寸复用与拖拽起止流程调整。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

结合 Impeccable 与 Night Flight / Daylight Archive 设计体系，优化世界地图 SVG 配色并与应用双主题对齐。

## 完成过程

1. 将原暖色教科书式大陆填色改为 restrained 冷青档案色：OKLCH 深海渐变、低彩度洲际区分、描边与经纬网弱化，强调色仅保留 hover 与图框信号。
2. 新增 `map-light.svg`（日间冷灰蓝海 + 略亮陆地），默认 `map.svg` 为夜航深海色。
3. 地图组件按 `data-theme` 切换底图 URL 并在主题变更时重新解码位图与清空离屏缓存。

## 修改具体文件

- `src/components/map/map.svg`
  - Night Flight Archive 配色与无障碍文案更新。
- `src/components/map/map-light.svg`
  - Daylight Archive 亮色主题变体（新建）。
- `src/components/map/index.tsx`
  - 双主题 SVG 加载与 `worldMapTheme` 状态联动。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

加强世界地图各大洲边界可读性，同时保持 Night Flight / Daylight Archive 克制冷青体系。

## 完成过程

1. 提升 `.outline` 海岸线：略增亮度与 chroma、对齐 Navigation Signal 色相（hue 225–230），线宽 1.12px，透明度提高。
2. 弱化 `.country` 国内国界描边，形成「洲界 > 国界」层级，避免线条争抢。
3. 略拉大各洲填色 chroma 差，并减轻陆地阴影，避免描边被 drop-shadow 糊住。
4. 深色 `map.svg` 与亮色 `map-light.svg` 同步调整。

## 修改具体文件

- `src/components/map/map.svg`
  - 洲界、国界与填色对比度调整。
- `src/components/map/map-light.svg`
  - 同上（亮色主题参数）。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

将个人页 `CHECKED_AIRPORTS` 机场打卡数据从 `personal/constant.ts` 迁移到全站 `constants` 模块集中维护。

## 完成过程

1. 在 `src/constants/external-links.ts` 增加 `CheckedAirport` 类型与 `CHECKED_AIRPORTS` 数组，并更新文件头说明。
2. `personal/type.d.ts` 改为从 constants 再导出 `CheckedAirport`，页面类型引用保持不变。
3. `personal/constant.ts` 删除原数据块，改为导入并再导出 `CHECKED_AIRPORTS`，派生逻辑（分组、地图 marker）不变。

## 修改具体文件

- `src/constants/external-links.ts`
  - 承接机场打卡静态数据与类型定义。
- `src/pages/personal/constant.ts`
  - 移除内联数组，转引 constants。
- `src/pages/personal/type.d.ts`
  - `CheckedAirport` 类型来源改为 constants。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

根据个人实际航程列表，在地图航迹中补充机场之间的航线关系（忽略航班号与机型）。

## 完成过程

1. 梳理用户提供的往返/单程记录，将城市映射为 `CHECKED_AIRPORTS` 中的机场名称（国际线默认首都/仁川/成田或羽田/素万那普或廊曼等）。
2. 在 `personal/constant.ts` 增加 `coordinateOfCheckedAirport` 与 `createMapRoute`，航迹坐标与机场数据同源。
3. 用 28 段实际航迹替换原先 5 条示意弧线，覆盖日韩、东南亚、欧洲北非及国内等行程。
4. 执行 `pnpm run build` 验证通过。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - 新增航迹构造辅助函数；`MAP_ROUTES` 改为基于 `CHECKED_AIRPORTS` 的实际航程。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

按用户说明校正航迹中北京、曼谷、东京的机场选用：北京国际走首都、国内走大兴；曼谷与东京按实际起降场区分。

## 完成过程

1. 国内航段（三亚、上海浦东、昆明）北京端改为大兴国际机场。
2. 国际航段北京端保持首都；航段标签区分「首都/大兴」。
3. 曼谷维持亚航走廊曼、泰航等走素万那普；东京国航/春秋走成田、全日空走羽田，并补充注释说明规则。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - 更新 `MAP_ROUTES` 机场映射与注释。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

继续补充个人地图国内航迹：首都↔武汉、大兴↔西安、西安→宜昌/杭州。

## 完成过程

1. 在 `MAP_ROUTES` 追加 6 段航迹，北京端按首都/大兴规则选用。
2. 「东京成田→天津」已在既有春秋航段中，未重复添加。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - `MAP_ROUTES` 新增 6 条国内航线。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

继续补充国内航迹：大兴↔昆明、西安→昆明/广州、广州→大兴、首都↔虹桥。

## 完成过程

1. 在 `MAP_ROUTES` 追加 7 段航迹（含既有「大兴→昆明」的返程「昆明→大兴」）。
2. 首都↔上海使用虹桥机场，与既有大兴→浦东国际线区分。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - `MAP_ROUTES` 新增 7 条航线。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

地图航迹区分国内与国际，使用两种线型与颜色展示，并更新图例。

## 完成过程

1. `WorldMapRoute` / `MapRoute` 增加 `scope: domestic | international`。
2. `canvasMap` 国内用实线暖色、国际用虚线冷色；CSS 变量拆分为两套描边色。
3. 图例分「国内航迹」「国际航迹」两项，样式与画布一致。
4. `MAP_ROUTES` 为全部航段标注 scope（中国大陆境内为 domestic，跨境/境外为 international）。

## 修改具体文件

- `src/components/map/type.d.ts`、`canvasMap.ts`、`index.tsx`、`index.css`
  - 双轨航迹绘制与图例。
- `src/pages/personal/type.d.ts`、`constant.ts`、`index.tsx`
  - 航迹 scope 数据与图例入参调整。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

按 Impeccable / Night Flight Archive 设计体系优化地图航迹与机场标识：国内/国际双线型，标识与航迹视觉语义一致。

## 完成过程

1. 在 `App.css` 增加 `--pl-map-route-*`、`--pl-map-marker-*` token（OKLCH 冷青单色系，取代琥珀色国内线）。
2. 航迹：国内实线低饱和、国际虚线 accent；先绘国内再绘国际。
3. 机场标记增加 `scope`（中国=domestic），画布按范围分色填充/描边。
4. 图例拆为四项：国内/境外机场 + 国内/国际航迹，样式与画布一致。

## 修改具体文件

- `src/App.css`：地图航迹与标记语义色 token。
- `src/components/map/type.d.ts`、`canvasMap.ts`、`index.tsx`、`index.css`：双轨绘制与图例。
- `src/pages/personal/constant.ts`：机场 marker `scope`。
- `taskRecord.md`：追加记录。

## 日期

2026-05-20

## 任务目的

补充 `docs/map.md`，说明 `src/components/map` 组件 SDK 的用法与数据约定。

## 完成过程

1. 梳理 `AnnotatedWorldMap` Props、类型、交互与主题 token。
2. 写入快速开始、个人页数据准备范例、`canvasMap` 底层导出说明。

## 修改具体文件

- `docs/map.md`
  - 新增世界地图组件使用文档。
- `taskRecord.md`
  - 追加本次任务记录。

## 日期

2026-05-20

## 任务目的

补充个人地图航迹：大兴→庆阳、昆明→重庆。

## 完成过程

1. 在 `MAP_ROUTES` 追加 2 段国内航迹（`domestic`）。

## 修改具体文件

- `src/pages/personal/constant.ts`
  - 新增大兴—庆阳、昆明—重庆航线。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-21

## 任务目的

将个人页机场国家/地区分组列表改为默认折叠，并通过点击 header 展开对应机场清单。

## 完成过程

1. 读取 `impeccable` skill、项目产品与设计上下文，确认本次为产品界面的低干扰交互优化。
2. 在 `src/pages/personal/index.tsx` 中新增机场国家/地区展开状态，默认集合为空，使所有分组初始折叠。
3. 将机场分组 header 改为可点击按钮，补充 `aria-expanded`、`aria-controls` 与受控列表 `hidden` 状态。
4. 在 `src/pages/personal/index.css` 中调整折叠分组样式，增加展开指示、hover、focus-visible 与移动端排版。
5. 使用 `ReadLints` 检查本次修改的个人页文件。

## 修改具体文件

- `src/pages/personal/index.tsx`
  - 新增机场国家/地区分组展开状态与切换逻辑。
  - 将机场列表改为默认折叠、点击 header 展开/收起。
- `src/pages/personal/index.css`
  - 新增折叠按钮、展开指示、隐藏列表与小屏适配样式。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-22

## 任务目的

合并补充首页航司参考来源列表，扩展底部参考来源折叠区可展示的外部出处。

## 完成过程

1. 读取 `src/pages/home/constant.ts`，确认 `AIRLINE_REFERENCE_SOURCES` 当前包含全局统计、通用来源和少量航司来源。
2. 将用户提供的航司参考来源清单合并进 `AIRLINE_REFERENCE_SOURCES`。
3. 对已有同名航司条目进行补充合并，保留原有来源并新增 Wikipedia、航司官网等链接，避免同一航司重复分组。
4. 使用 `ReadLints` 检查 `src/pages/home/constant.ts`。

## 修改具体文件

- `src/pages/home/constant.ts`
  - 扩展 `AIRLINE_REFERENCE_SOURCES`，新增多家国内外航司参考来源。
  - 合并瑞安航空、全日空、亚洲航空、泰国航空、泛航航空、泰国狮子航空、国泰航空和汉莎航空等既有条目来源。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-22

## 任务目的

调整参考资料页面顶部概览胶囊，使数字与文案垂直居中。

## 完成过程

1. 检查 `src/pages/references/index.css` 中概览胶囊的对齐方式。
2. 将 `.reference-archive__summary span` 的交叉轴对齐从基线改为居中，避免数字和中文文案出现上下错位。
3. 使用 `ReadLints` 检查本次修改文件。

## 修改具体文件

- `src/pages/references/index.css`
  - 调整参考资料概览胶囊内文本垂直对齐方式。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

修复飞机照片预览图构建插件无法从 `constant.ts` 提取 URL、导致 `photoPreviews.generated.ts` 被写为空映射的问题。

## 完成过程

1. 排查 `photoPreviews.generated.ts` 为空，确认插件 `extractAircraftPhotoUrls` 仅匹配单引号 URL，而 `constant.ts` 已改为双引号字符串。
2. 将 URL 提取正则改为同时支持单引号与双引号。
3. 抽取 `generateAircraftPhotoPreviews` 并在解析不到 URL 时跳过写入，避免再次覆盖已有缓存。
4. 运行 `pnpm run build` 重新生成预览图映射（30 张中 22 张成功，8 张因下载超时回退原图）。
5. 使用 `ReadLints` 检查修改文件。

## 修改具体文件

- `rsbuild_plugins/pluginAircraftPhotoPreviews.ts`
  - 修复 URL 提取正则；增加空结果保护；重构生成逻辑为独立函数。
- `src/pages/personal/photoPreviews.generated.ts`
  - 构建插件重新生成的预览图 data URL 映射。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

实现符合 Night Flight Archive 站点视觉的全站通用 Select 下拉组件。

## 完成过程

1. 对照 `DESIGN.md` 与 Fleet / 个人页现有 `select` 样式，抽取 `--pl-*` token、圆角、焦点辉光与动效档位。
2. 在 `src/components/Select/` 新增 `type.d.ts`、`index.css`、`index.tsx`：支持 `options` 或 `children`、可选 eyebrow 标签字段布局、主题感知 chevron、`focus-visible` 与移动端 16px 防缩放。
3. 运行 `pnpm run build` 验证类型与构建通过；使用 `ReadLints` 检查修改文件。

## 修改具体文件

- `src/components/Select/type.d.ts`
  - 新增 `SelectOption`、`SelectProps` 类型声明。
- `src/components/Select/index.css`
  - 通用下拉字段与控件样式，对齐档案型深色/亮色主题 token。
- `src/components/Select/index.tsx`
  - 导出 `Select` 组件与类型。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

将首页 Fleet 筛选与个人页照片目录的原生 `<select>` 替换为通用 `Select` 组件，并清理重复样式。

## 完成过程

1. 在 `src/pages/home/index.tsx` 将 3 处制造商/型号/排序下拉改为 `Select`，航司搜索仍保留原生 `input` 与 `fleet-filter` 布局。
2. 在 `src/pages/personal/index.tsx` 将照片目录下拉改为 `Select`（`children` 模式保留动态计数文案）。
3. 精简 `home/index.css`、`personal/index.css` 中重复的 select 与 label 样式，仅保留页面级 flex/max-width 修饰（`.fleet-filter.pl-select-field`、`.aircraft-photo-filter.pl-select-field`）。
4. 运行 `pnpm run build` 验证通过；使用 `ReadLints` 检查修改文件。

## 修改具体文件

- `src/pages/home/index.tsx`
  - 引入 `Select` 并替换 3 处筛选下拉。
- `src/pages/personal/index.tsx`
  - 引入 `Select` 并替换照片目录下拉。
- `src/pages/home/index.css`
  - 移除 select 专用规则；保留搜索 input 样式与 Select 布局修饰。
- `src/pages/personal/index.css`
  - 移除 select/label 重复样式，保留 `max-width` 布局修饰。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

为通用 `Select` 组件补充克制的表单微交互动效，强化 hover / focus / active 反馈并尊重 `prefers-reduced-motion`。

## 完成过程

1. 依据 `DESIGN.md` 动效档位（`--motion-duration-fast` / `standard`、`--motion-ease-out-quart`）规划 Select 反馈层：hover 提亮边框与输入面、focus-visible 保持青辉上浮、active 快速回压。
2. 使用 `:has()` 联动 chevron 色相随 hover/focus 变化，并做 1px 下沉提示；字段 label 在 focus-within 时略提亮，建立标签与控件关系。
3. 在 `prefers-reduced-motion: reduce` 下关闭过渡与位移。使用 `ReadLints` 检查修改文件。

## 修改具体文件

- `src/components/Select/index.css`
  - 新增 hover、active、chevron 与 label 联动动效；扩展 reduced-motion 覆盖。
- `src/components/Select/index.tsx`
  - 更新组件注释以反映动效分层。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

按 Night Flight Archive 设计系统打磨通用 `Select` 组件视觉层次与控件质感。

## 完成过程

1. 对照 `DESIGN.md` Forms / Surfaces 约定，为 select 增加内嵌顶缘高光与 `--pl-text-data` 数据字色，hover/focus 时提亮为正文色。
2. 新增右侧 `pl-select__affordance` 指示轨道（`--pl-surface-reference` + 发丝分隔），chevron 纳入轨道并在 hover/focus/disabled 下联动背景与描边；统一 SVG 线宽与顶栏控件。
3. 保留既有动效分层与 `prefers-reduced-motion` 收窄；运行 `pnpm run build` 验证通过。

## 修改具体文件

- `src/components/Select/index.css`
  - 数据字色、内嵌高光、affordance 轨道与状态联动样式。
- `src/components/Select/index.tsx`
  - 增加 affordance 包裹结构，微调 chevron SVG。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

美化 `Select` 选项列表：用自定义 listbox 替代系统原生下拉，统一 Night Flight Archive 选项行视觉。

## 完成过程

1. 将 `renderSelectOptions` 重构为 `normalizeSelectItems` + `SelectMenuOption` + `SelectOptionsMenu`，支持 `options` 与 legacy `children`（`<option>`）两种入参。
2. `SelectControl` 改为 combobox（button + listbox）：键盘导航、外点关闭、选中勾号、展开 chevron 旋转；`onChange` 仍派发 synthetic `ChangeEvent<HTMLSelectElement>`。
3. 新增 `pl-select-menu` 面板样式（档案型 surface、选中/高亮态、入场动画、`scroll-area-night`）；更新 `prefers-reduced-motion` 覆盖。
4. 运行 `pnpm run build` 验证通过。

## 修改具体文件

- `src/components/Select/index.tsx`
  - 自定义 listbox 选项渲染与 combobox 交互逻辑。
- `src/components/Select/index.css`
  - 下拉面板、选项行、展开态与 check 图标样式。
- `src/components/Select/type.d.ts`
  - 更新组件契约说明。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

修复个人页 `Select` 点击后选项面板无法保持打开的问题。

## 完成过程

1. 定位根因：`<label htmlFor>` 包裹 combobox `button` 时，点击冒泡会再次激活 button，导致 `openMenu` 与 `closeMenu` 同一次点击内连续触发。
2. 将字段结构改为 `div.pl-select-field` + 独立 `label.pl-select-field__label`（`htmlFor` 关联触发器），listbox 不再位于 label 内，避免选项行触发 label 二次激活。
3. 触发器 `click` 增加 `stopPropagation`；外点关闭改为 capture 阶段 `pointerdown`，减少与内部点击竞态。
4. 运行 `pnpm run build` 验证通过。

## 修改具体文件

- `src/components/Select/index.tsx`
  - 修正 label/控件 DOM 结构；触发器 click 阻止冒泡；外点监听使用 capture。
- `src/components/Select/index.css`
  - `pl-select-field__label` 改为 block 级可点击 label。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-24

## 任务目的

修复 `Select` 下拉选项被父级 `overflow` 裁切遮挡的问题。

## 完成过程

1. 定位根因：首页 `.fleet-filters { overflow-x: auto }` 等祖先容器会裁切 `position: absolute` 的 listbox。
2. 将选项面板通过 `createPortal` 挂载到 `document.body`，使用 `fixed` 定位并按触发器 `getBoundingClientRect` 计算坐标。
3. scroll/resize 时重新定位；外点关闭逻辑同时覆盖 Portal 内的 listbox 节点。
4. 运行 `pnpm run build` 验证通过。

## 修改具体文件

- `src/components/Select/index.tsx`
  - Portal 渲染 listbox；`computeMenuPlacement` 与滚动/缩放重定位。
- `src/components/Select/index.css`
  - 新增 `pl-select-menu--portal` fixed 定位样式。
- `taskRecord.md`
  - 追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

为应用内路由切换增加过渡动效，减轻页面瞬间替换的突兀感，并与 Night Flight Archive 现有 motion token 保持一致。

## 完成过程

1. 新增 `RouteTransitionLayout` 布局路由，以 `location.pathname` 为 key 触发单次进入动画。
2. 按主导航顺序（`/` → `/personal` → `/references`）推断 `forward` / `backward` 方向，应用轻微横向位移 + 淡入。
3. 在 `.route-transition` 内关闭 `.page-panel` 的 `archive-reveal`，避免与路由层动效叠加重影。
4. 为 `route-loading` 增加与数据加载态一致的脉冲反馈。
5. 运行 `pnpm run build` 验证通过；`prefers-reduced-motion` 继续由 `App.css` 全局收窄。

## 修改具体文件

- `src/components/route-transition/index.tsx`：布局出口与方向推断逻辑。
- `src/components/route-transition/index.css`：路由进入 keyframes 与 page-panel 动画抑制。
- `src/App.tsx`：嵌套布局路由包裹三个懒加载页面。
- `src/App.css`：`route-loading-pulse` 加载态动效。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

拆分 `src/pages/personal` 打包体积，使进入个人页时首屏依赖的主 chunk 变小，地图与相册预览数据异步加载。

## 完成过程

1. 将原 `constant.ts` 拆为 `constants/photoMeta.ts`、`constants/summary.ts`、`constants/airportsMap.ts` 与 `data/aircraftPhotosData.ts`（含 `photoPreviews.generated.ts`）。
2. 新增 `PersonalAirportSection`（`React.lazy` 地图组件）与 `PersonalAircraftPhotosSection`（`import()` 加载相册 bundle）。
3. `index.tsx` 仅保留页头概览与两个 `Suspense` 边界；删除 `constant.ts`。
4. 更新 `pluginAircraftPhotoPreviews` 从 `photoMeta.ts` 解析图片 URL。
5. `pnpm run build`：个人页入口约 `127.*.js` 12KB（原单 chunk ~785KB）；预览数据在 `personal-aircraft-photos.*.js` 独立加载。

## 修改具体文件

- `src/pages/personal/index.tsx`：轻量壳层 + 分区懒加载。
- `src/pages/personal/constants/*`、`data/aircraftPhotosData.ts`：常量与相册数据拆分。
- `src/pages/personal/sections/*`：机场地图区、相册区组件。
- `src/pages/personal/index.css`：区块加载占位样式。
- `src/pages/personal/type.d.ts`：`AircraftPhotosBundle` 类型。
- `rsbuild_plugins/pluginAircraftPhotoPreviews.ts`：读取路径改为 `photoMeta.ts`。
- 删除 `src/pages/personal/constant.ts`。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

修复相册 base64 预览图在进入个人页、离屏时仍被全部解码的问题。

## 完成过程

1. 确认根因：预览图为 `data:` URI，原生 `loading="lazy"` 无法延迟解码；区块挂载后所有 `<img src>` 会立即占用内存。
2. 新增 `AircraftPhotoGalleryImage`，以 `IntersectionObserver` 在缩略图接近视口时才写入 `src`。
3. 恢复 `PersonalViewportSection`：相册区块使用 `variant="photos"`（`rootMargin: 0`），须进入视口才挂载 chunk。
4. 未进入视口的缩略图保留占位背景（`aircraft-photo-gallery__image--pending`）。
5. `pnpm run build` 通过。

## 修改具体文件

- `src/pages/personal/sections/AircraftPhotoGalleryImage.tsx`：视口内才赋值 src（新建）。
- `src/pages/personal/sections/PersonalViewportSection.tsx`：区块级视口门控（新建）。
- `src/pages/personal/sections/PersonalAircraftPhotosSection.tsx`：改用 `AircraftPhotoGalleryImage`。
- `src/pages/personal/index.tsx`：机场/相册套视口门控，相册用严格模式。
- `src/pages/personal/index.css`：待加载缩略图占位样式。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

为机场足迹地图 Suspense 边界增加与真实地图同尺寸的占位 loading，避免 chunk 加载完成前布局高度突变。

## 完成过程

1. 对照 `.annotated-world-map` 的 `aspect-ratio: 1200 / 650`、`margin-top` 与边框样式，新增 `PersonalAirportMapFallback` 占位组件。
2. 占位内使用旋转指示器与 `role="status"` / `aria-busy`，文案对屏幕阅读器可见、视觉上 sr-only。
3. `PersonalAirportSection` 的 `Suspense` fallback 由单行文字改为地图占位。
4. `pnpm run build` 验证通过。

## 修改具体文件

- `src/pages/personal/sections/PersonalAirportMapFallback.tsx`：地图尺寸占位 loading（新建）。
- `src/pages/personal/sections/PersonalAirportSection.tsx`：Suspense fallback 改用地图占位。
- `src/pages/personal/index.css`：`.personal-airport-map-loading` 占位与动效样式。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

消除机场足迹区块在多层 Suspense / 视口门控下仍出现的布局抖动：外层单行占位未预留地图与国家列表高度。

## 完成过程

1. 确认抖动来自三层加载：视口门控占位、区块 chunk Suspense、地图 chunk Suspense；仅最内层 `PersonalAirportMapFallback` 有固定高度。
2. 新增 `PersonalAirportSectionSkeleton`，同步渲染标题、地图比例占位与按 `airportCountryGroups` 数量的折叠列表骨架。
3. `PersonalViewportSection` 增加 `variant="airport"`，视口外与 chunk 加载中均使用该骨架。
4. `index.tsx` 外层 Suspense fallback 同步改为骨架，使整条加载链路尺寸一致。
5. `pnpm run build` 通过。

## 修改具体文件

- `src/pages/personal/sections/PersonalAirportSectionSkeleton.tsx`：机场区块完整骨架（新建）。
- `src/pages/personal/sections/PersonalViewportSection.tsx`：`variant="airport"` 使用骨架占位。
- `src/pages/personal/index.tsx`：机场区块 Suspense fallback 改为骨架。
- `src/pages/personal/index.css`：国家列表骨架 shimmer 样式。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

在个人航空档案页的机场足迹区块后新增「乘坐过的航司与机型」列表，数据集中维护于 `external-links.ts`。

## 完成过程

1. 在 `external-links.ts` 定义 `FlightRecord` 类型与 32 条乘机记录常量 `FLIGHT_RECORDS`，覆盖航司、机型、航线与日期（含往返与箭头连接符）。
2. 新建 `PersonalFlightRecordsSection` 组件，按时间倒序展示乘机列表并输出无障碍朗读文案。
3. 在 `index.tsx` 机场区块与相册区块之间插入视口门控 + Suspense 懒加载挂载。
4. 在 `index.css` 补充列表行样式，小屏下日期换行展示。
5. `pnpm run build` 通过。

## 修改具体文件

- `src/constants/external-links.ts`：新增 `FlightRecord` 类型与 `FLIGHT_RECORDS` 数据。
- `src/pages/personal/sections/PersonalFlightRecordsSection.tsx`：乘机记录展示组件（新建）。
- `src/pages/personal/index.tsx`：挂载乘机记录区块。
- `src/pages/personal/index.css`：乘机记录列表样式。
- `src/pages/personal/type.d.ts`：导出乘机记录相关类型。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

基于 Night Flight Archive 主站风格，重构 `PersonalViewportSection` 占位体系与乘机记录展示 UI。

## 完成过程

1. 扩展 `PersonalViewportSection`：`flight-records` / `photos` 变体与对应档案风骨架，视口外占位与真实区块结构对齐。
2. 新增 `PersonalFlightRecordsSectionSkeleton`、`PersonalPhotosSectionSkeleton`；升级 `PersonalSectionFallback` 为带标题层级的 shimmer 占位。
3. 乘机记录改为 Fleet 台账式单面板：统计胶囊、按年分组、hairline 分隔的数据行与机型芯片。
4. 新增 `flightRecordsSummary.ts` 聚合年份与航司/机型统计。
5. `pnpm run build` 通过。

## 修改具体文件

- `src/pages/personal/sections/PersonalViewportSection.tsx`：变体骨架路由与区块包装。
- `src/pages/personal/sections/PersonalSectionFallback.tsx`：结构化加载占位。
- `src/pages/personal/sections/PersonalFlightRecordsSectionSkeleton.tsx`：乘机台账骨架（新建）。
- `src/pages/personal/sections/PersonalPhotosSectionSkeleton.tsx`：相册骨架（新建）。
- `src/pages/personal/sections/PersonalFlightRecordsSection.tsx`：台账式乘机记录 UI。
- `src/pages/personal/constants/flightRecordsSummary.ts`：年份分组与统计（新建）。
- `src/pages/personal/index.tsx`：Suspense fallback 与变体对齐。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

压缩移动端乘机台账每行高度，避免四段纵向堆叠造成行距过大。

## 完成过程

1. 将 `@media (max-width: 640px)` 下 `.flight-ledger-row` 由单列四行改为两行两列：首行航司与日期，次行机型芯片与航线。
2. 同步收紧行内 padding、机型芯片尺寸与骨架占位网格。

## 修改具体文件

- `src/pages/personal/index.css`：移动端 `.flight-ledger-row` 紧凑布局。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

向 `FLIGHT_RECORDS` 补充 18 条国内乘机记录（南航、东航、河北航空、海航、川航、长龙、长安等航司及对应航线）。

## 完成过程

1. 在 `external-links.ts` 的 `FLIGHT_RECORDS` 中按出发日期从新到旧插入 18 条记录，覆盖西安、北京、广州、上海、昆明、武汉、杭州、宜昌、西峰等航线。
2. 将用户输入的 `731-81B` 修正为 `737-81B`；`海航` 与既有条目统一为 `海南航空`。
3. 未提供具体出发日时，按列表顺序分配 2025 年占位日期以保持台账排序；用户可后续更正。
4. `pnpm run build` 通过。

## 修改具体文件

- `src/constants/external-links.ts`：`FLIGHT_RECORDS` 新增 18 条乘机记录。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

修正乘机台账各列因文本长度不一导致的错位，统一为左对齐且列宽对齐。

## 完成过程

1. 在 `.flight-ledger-table` 定义四列网格模板，各行通过 `grid-template-columns: subgrid` 共享列宽，避免每行独立 `fr` 分配造成竖向不齐。
2. 航司、机型、航线、日期四列均设为 `justify-self: start` 与 `text-align: left`；移除日期列右对齐。
3. 移动端同样使用 subgrid 统一两列布局，骨架屏占位对齐方式同步调整。
4. `pnpm run build` 通过。

## 修改具体文件

- `src/pages/personal/index.css`：乘机台账 subgrid 列对齐与左对齐样式。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

按用户提供的真实出发日期与航线，更新 19 条国内乘机记录并重新排序。

## 完成过程

1. 修正 18 条既有国内记录的 `departureDate`，将 2026 年西安/广州等行程与 2018–2021 年历史航班归入正确年份。
2. 新增南航 `737-81B` 武汉—北京（2021-5-10）；`731-81B` 仍记为 `737-81B`；海航记为 `海南航空`。
3. 全表按出发日期从新到旧重排，并修正 2024 年 5 月/4 月条目原有乱序。
4. `pnpm run build` 通过。

## 修改具体文件

- `src/constants/external-links.ts`：更新乘机记录日期、航线与排序（共 51 条）。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

乘机台账日期列改为右对齐，便于纵向扫读对比。

## 完成过程

1. 桌面端 `.flight-ledger-row__date` 设置 `justify-self: end` 与 `text-align: right`。
2. 移动端与骨架屏日期占位同步右对齐。

## 修改具体文件

- `src/pages/personal/index.css`：日期列右对齐样式。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

乘机台账按年份折叠展示，默认全部收起，减少首屏信息密度。

## 完成过程

1. `PersonalFlightRecordsSection` 增加年份展开状态（`ReadonlySet<number>`，初始为空即全折叠）与 `toggleFlightYear`。
2. 各年份改为 `article` + 可聚焦按钮头（年份、次数、指示箭头）+ 可动画折叠体，对齐机场列表无障碍模式（`aria-expanded` / `aria-controls` / `aria-hidden`）。
3. 补充 `.flight-year-block__*` 折叠样式；骨架屏同步年份头结构。
4. `pnpm run build` 通过。

## 修改具体文件

- `src/pages/personal/sections/PersonalFlightRecordsSection.tsx`：年份折叠面板交互。
- `src/pages/personal/sections/PersonalFlightRecordsSectionSkeleton.tsx`：折叠头骨架结构。
- `src/pages/personal/index.css`：年份折叠面板样式。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

乘机台账年份面板改为手风琴模式，同一时刻仅允许一个年份展开。

## 完成过程

1. 将 `expandedFlightYears`（`ReadonlySet<number>`）改为 `expandedFlightYear`（`number | undefined`）。
2. `toggleFlightYear` 在点击已展开年份时折叠，点击其他年份时仅展开该年份并自动收起其余。

## 修改具体文件

- `src/pages/personal/sections/PersonalFlightRecordsSection.tsx`：手风琴展开逻辑。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

补充北京首都经新加坡樟宜往返悉尼的地图航迹数据。

## 完成过程

1. 在 `CHECKED_AIRPORTS` 新增新加坡樟宜机场、悉尼机场（SYD）坐标与描述。
2. `MAP_ROUTES` 追加去程两段（首都→樟宜→悉尼）与返程两段（悉尼→樟宜→首都），均为国际航迹。
3. 扩展 `AIRPORT_MAP_BOUNDS` 与澳大利亚示意陆块、区域标签；同步新加坡/澳大利亚分组与国旗映射。
4. `pnpm run build` 通过。

## 修改具体文件

- `src/constants/external-links.ts`：新增樟宜、悉尼机场打卡数据。
- `src/pages/personal/constants/airportsMap.ts`：航迹、地图范围与区域示意。
- `src/pages/personal/constants/summary.ts`：国家分组正则扩展。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

补充北京首都经新加坡樟宜往返悉尼的乘机台账，航司与机型按预订截图录入。

## 完成过程

1. 在 `FLIGHT_RECORDS` 顶部追加 4 段单程：首都→樟宜（777-300ER）、樟宜→悉尼（380-800）、悉尼→樟宜（380-800）、樟宜→首都（787-10），均为新加坡航空、2026 年。
2. 去程日期 `2026-7-12`、返程 `2026-7-22`（截图无具体日，待用户核对后可改）。
3. `pnpm run build` 通过。

## 修改具体文件

- `src/constants/external-links.ts`：新增 4 条乘机记录。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

校正新加坡航空北京—悉尼往返四段乘机记录的实际出发日期。

## 完成过程

1. 将首都→樟宜、樟宜→悉尼、悉尼→樟宜、樟宜→首都日期分别更新为 `2026-10-1`、`2026-10-2`、`2026-10-7`、`2026-10-8`。

## 修改具体文件

- `src/constants/external-links.ts`：新加坡航空四段日期。
- `taskRecord.md`：追加本次任务记录。

---

## 日期

2026-05-30

## 任务目的

机场打卡国家列表改为手风琴模式，同一时刻仅允许一个国家展开。

## 完成过程

1. 将 `expandedAirportCountries`（`ReadonlySet<string>`）改为 `expandedAirportCountry`（`string | undefined`）。
2. `toggleAirportCountry` 在点击已展开国家时折叠，点击其他国家时仅展开该项并自动收起其余。

## 修改具体文件

- `src/pages/personal/sections/PersonalAirportSection.tsx`：手风琴展开逻辑。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-10

## 任务目的

为 `airplan.json` 中全部航司补充官网链接，并新增独立字段 `airlineWebsite` 存放。

## 完成过程

1. 梳理 `airplan.json` 中 93 家航司清单，建立中文航司名称到官方网站的映射表。
2. 为每条航司记录新增 `airlineWebsite` 字段，置于 `airlineEnglishName` 之后、`passengerAircraftCount` 之前。
3. 同步更新 `AirplaneDataItem`、`AirlineFleet` 类型声明，并在首页数据转换逻辑中透传该字段。
4. 运行 `pnpm run build` 验证类型与构建通过。

## 修改具体文件

- `public/data/airplan.json`：93 家航司均新增 `airlineWebsite` 官网链接字段。
- `src/pages/home/type.d.ts`：`AirplaneDataItem`、`AirlineFleet` 补充 `airlineWebsite` 类型与注释。
- `src/pages/home/index.tsx`：`createAirlineFleets` 透传 `airlineWebsite`。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-10

## 任务目的

在首页航司列表的航司名称后展示「官网」链接，点击后于新窗口打开对应航司官网。

## 完成过程

1. 在 `airline-entry__heading` 中于航司中文名 `h2` 之后插入官网链接，复用 `isHttpOrHttpsUrl` 校验 `airlineWebsite` 有效性。
2. 链接使用 `target="_blank"`、`rel="noreferrer"` 新窗口打开，并补充 `aria-label` 提升可访问性。
3. 新增 `.airline-entry__website` 样式，与机型外链下划线风格保持一致。

## 修改具体文件

- `src/pages/home/index.tsx`：航司名称后渲染「官网」外链。
- `src/pages/home/index.css`：新增 `.airline-entry__website` 链接样式。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-10

## 任务目的

将首页航司条目中「官网」链接位置调整至英文名之后。

## 完成过程

1. 在 `airline-entry__heading` 内将「官网」链接从中文名 `h2` 后移至 `airline-entry__english-name` 之后。

## 修改具体文件

- `src/pages/home/index.tsx`：调整「官网」链接渲染顺序。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-13

## 任务目的

为 Cursor 项目基础规则补充 Agent 执行流程、依赖管理、安全隐私、React 实现、数据容错、前端验收、变更边界、Git 保护、质量验证、注释规则和任务记录约定。

## 完成过程

1. 阅读 `AGENTS.md`、`PRODUCT.md`、`DESIGN.md`、现有 `.cursor/rules/project-base-rules.mdc` 和 `taskRecord.md`，确认规则文件已有结构与任务记录格式。
2. 检查工作区状态，确认修改前没有未提交改动。
3. 将用户提供的补充规则追加到 `.cursor/rules/project-base-rules.mdc`。
4. 本次仅修改规则与任务记录文档，未运行构建命令。

## 修改具体文件

- `.cursor/rules/project-base-rules.mdc`：追加 Agent 执行流程、依赖管理、安全隐私、React 实现、数据容错、前端验收、变更边界、Git 保护、质量验证、注释规则和任务记录补充约定。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-13

## 任务目的

新增 Codex 可读取的项目规则入口，让 Cursor 规则文件中的项目规范在 Codex 执行任务时同样生效。

## 完成过程

1. 阅读 `.cursor/rules/project-base-rules.mdc`、`AGENTS.md`、`PRODUCT.md`、`DESIGN.md` 和 `taskRecord.md`，确认现有规则来源与记录格式。
2. 尝试创建 `.codex/rules/` 目录，因该路径在当前环境中无写入权限，改用仓库根目录的 `CODEX.md` 作为 Codex 桥接文件。
3. 新增 `CODEX.md`，声明 Codex 任务需读取并遵守 `.cursor/rules/project-base-rules.mdc`，并补充项目上下文、执行、验证和任务记录要求。
4. 更新 `AGENTS.md`，将 `CODEX.md` 设为 Codex 必读规则入口，并保留项目常用命令与文档链接。

## 修改具体文件

- `CODEX.md`：新增 Codex 项目规则桥接文件，引用 Cursor 基础规则并补充 Codex 执行说明。
- `AGENTS.md`：更新为 Codex 入口说明，要求任务开始前读取 `CODEX.md`。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-13

## 任务目的

将个人飞行日志页中的飞机照片相册拆分为独立页面展示，并在顶部导航新增照片页入口。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md`、`DESIGN.md`、项目 `impeccable` skill、当前路由与个人页照片组件，确认相册已有独立懒加载组件。
2. 新增 `/photos` 路由与导航项“飞机照片”，创建 `src/pages/photos/` 页面模块，复用原照片相册组件、目录筛选和全屏预览逻辑。
3. 从 `src/pages/personal/index.tsx` 移除照片相册区块，并将飞行日志页概览统计改为乘机记录、打卡机场、国家或地区。
4. 为照片相册组件和相册骨架增加标题层级参数，使独立照片页使用页面级 `h1`。
5. 清理个人页视口门控中不再使用的相册占位分支，微调顶部导航间距以容纳新增入口。
6. 运行 `pnpm run build` 与 `git diff --check` 验证通过，并在浏览器检查 `/photos`、`/personal` 以及 390px 移动宽度下无横向溢出。

## 修改具体文件

- `src/App.tsx`：新增“飞机照片”导航入口与 `/photos` 路由。
- `src/App.css`：调整顶部导航间距以适配新增入口。
- `src/pages/photos/index.tsx`：新增飞机照片独立页面，复用照片相册组件。
- `src/pages/photos/index.css`：新增照片页容器、标题与响应式网格样式。
- `src/pages/personal/index.tsx`：移除照片相册区块，并调整飞行日志页概览统计。
- `src/pages/personal/sections/PersonalAircraftPhotosSection.tsx`：新增 `headingLevel` 参数，支持页面级标题。
- `src/pages/personal/sections/PersonalPhotosSectionSkeleton.tsx`：新增 `headingLevel` 参数，保持照片页加载骨架语义一致。
- `src/pages/personal/sections/PersonalViewportSection.tsx`：删除不再使用的照片区块视口门控分支。
- `src/pages/personal/type.d.ts`：新增照片相册标题层级类型。
- `DESIGN.md`：同步项目路由结构，新增 `/photos` 照片页说明。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-13

## 任务目的

全局新增返回顶部按钮，帮助用户在长列表、照片相册等长页面中快速回到页面顶部。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md`、`DESIGN.md` 与 `impeccable` skill，确认全站视觉与可访问性约束。
2. 新增 `BackToTop` 全局组件，监听文档滚动距离，在离开首屏后显示返回顶部按钮，并使用 `requestAnimationFrame` 降低滚动监听开销。
3. 为按钮新增独立样式，复用当前主题 surface、hairline border、阴影与动效 token，并适配移动端 safe area。
4. 将 `BackToTop` 挂载到 `App` 根壳层，确保所有路由均可使用。
5. 同步 `DESIGN.md` 的 Application Shell 组件说明，补充全局返回顶部控件规范。
6. 运行 `pnpm run build` 与 `git diff --check` 验证通过，并在浏览器检查 `/photos` 桌面与 390px 移动宽度下按钮出现、点击回顶及无横向溢出。

## 修改具体文件

- `src/components/back-to-top/index.tsx`：新增全局返回顶部按钮组件。
- `src/components/back-to-top/index.css`：新增返回顶部按钮视觉、动效、响应式与 safe-area 样式。
- `src/App.tsx`：在应用壳层中挂载 `BackToTop`。
- `DESIGN.md`：补充 Application Shell 中的 Back To Top 组件规范。
- `taskRecord.md`：追加本次任务记录。

## 日期

2026-06-14

## 任务目的

为 `public/data/airplan.json` 补充大连航空数据，使航司机型资料库覆盖该航司。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认数据文件维护、验证和任务记录要求。
2. 读取 `public/data/airplan.json`，确认现有航司数据字段与按客机数量排列的中文航司区块位置。
3. 查询公开资料确认大连航空官网、客机数量和现役机型信息。
4. 在长安航空之后新增大连航空条目，补充中文名、英文名、官网、客机数量和 Boeing 737-800 机型链接。

## 修改具体文件

- `public/data/airplan.json`：新增大连航空记录，包含官网、13 架客机数量与 Boeing 737-800 机型映射。
- `taskRecord.md`：追加本次数据维护任务记录。

## 日期

2026-06-15

## 任务目的

为飞机照片相册原图 URL 常量补充 5 张新增照片，确保照片页统计与异步相册数据包含新图片。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码常量维护、验证和任务记录要求。
2. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 使用统一 R2 前缀加文件名的 URL 列表。
3. 按用户提供文件名补齐 5 条同前缀照片 URL，并保持原数组结构和相邻 PANA 照片分组。
4. 更新 `taskRecord.md`，记录本次照片常量维护过程。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：向 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 追加 5 条新照片原图 URL。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-15

## 任务目的

继续为飞机照片相册原图 URL 常量补充 2 张 `plane-model` 目录下的新照片。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码常量维护、验证和任务记录要求。
2. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 `plane-model` 分组照片 URL 使用独立目录前缀。
3. 按用户提供文件名和 `plane-model` 前缀补齐 2 条照片 URL，并追加在现有 `plane-model` 照片分组末尾。
4. 更新 `taskRecord.md`，记录本次继续补充照片 URL 的过程。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：向 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 的 `plane-model` 分组追加 2 条新照片原图 URL。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-15

## 任务目的

为 `public/data/airplan.json` 补充星宇航空与长荣航空数据，使台湾主要航司资料更加完整。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认静态数据维护、JSON 校验和任务记录要求。
2. 读取 `public/data/airplan.json`，确认现有中华航空位于台湾航司相关位置，星宇航空与长荣航空尚未收录。
3. 查询公开资料确认星宇航空、长荣航空官网、机队数量与现役主要机型。
4. 在中华航空附近补充长荣航空与星宇航空条目，保持 `airline`、`airlineEnglishName`、`airlineWebsite`、`passengerAircraftCount`、`models` 的既有结构。

## 修改具体文件

- `public/data/airplan.json`：新增长荣航空与星宇航空记录，补充官网、机队数量和机型映射。
- `taskRecord.md`：追加本次航司数据维护任务记录。

## 日期

2026-06-22

## 任务目的

让个人机场地图标记点 Tooltip 进一步跟随国内 / 国际标记类型适配颜色。

## 完成过程

1. 读取 `src/components/map/index.tsx` 与 `src/components/map/index.css`，确认 Tooltip 当前只按主题读取统一颜色变量。
2. 为 Tooltip 追加基于 `tooltipMarker.scope` 的国内 / 国际修饰类。
3. 在样式中将国内 Tooltip 映射到国内标记点高亮色，将国际 Tooltip 映射到国际标记点高亮色，并补充深色主题下的可读文字色。

## 修改具体文件

- `src/components/map/index.tsx`：Tooltip class 增加国内 / 国际标记类型修饰符。
- `src/components/map/index.css`：新增国内 / 国际 Tooltip 颜色规则，让 Tooltip 颜色和当前标记点类型一致。
- `taskRecord.md`：追加本次标记点 Tooltip 类型色适配任务记录。

## 日期

2026-06-22

## 任务目的

根据主站当前主题色，适配个人机场地图标记点 Tooltip 的视觉颜色。

## 完成过程

1. 读取 `src/components/map/index.css` 中 Tooltip、图例和地图主题修饰类的现有样式，确认 Tooltip 使用地图局部变量最贴合当前实现。
2. 为亮色地图补充浅色纸面 Tooltip 背景、琥珀边框、深琥珀文字和轻量阴影。
3. 为深色地图补充深舱 Tooltip 背景、青蓝边框、亮色文字和既有阴影，使 Tooltip 与标记点、航线主题保持一致。

## 修改具体文件

- `src/components/map/index.css`：补充 Tooltip 主题变量，并将 Tooltip 文字与阴影改为读取地图局部变量。
- `taskRecord.md`：追加本次地图 Tooltip 主题色适配任务记录。

## 日期

2026-06-22

## 任务目的

根据主站当前主题色，适配个人机场地图上的 Canvas 标记点、航线与图例颜色。

## 完成过程

1. 读取 `src/components/map/index.tsx`、`src/components/map/index.css` 与 `src/components/map/canvasMap.ts`，确认标记点和航线由 Canvas 读取 CSS 变量绘制，图例由 CSS 伪元素绘制。
2. 在地图根容器增加当前主题修饰类，使亮色与深色主题可以拥有独立的地图绘制变量。
3. 在地图组件样式中为亮色主题定义温暖纸感下的琥珀标记点、航线与高亮态，并保留深色主题的青蓝夜航标记体系。

## 修改具体文件

- `src/components/map/index.tsx`：为地图容器追加基于当前主题的 class，供 Canvas 读取对应 CSS 变量。
- `src/components/map/index.css`：补充亮色默认与深色主题下的地图标记点、航线、激活态配色变量，图例与 Canvas 绘制同步生效。
- `taskRecord.md`：追加本次地图标记点主题色适配任务记录。

## 日期

2026-06-22

## 任务目的

根据主站当前亮色与深色主题色，适配个人机场地图底图 SVG 的配色。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md`、`DESIGN.md` 与项目 `impeccable` skill，确认视觉与任务记录要求。
2. 检查 `src/App.css` 中实际生效的主题 token，确认当前主站为亮色默认、深色通过 `html[data-theme="dark"]` 覆写。
3. 读取 `src/components/map` 地图组件实现，确认 `map.svg` 与 `map-light.svg` 以 `?url` 方式作为 Canvas 底图加载，因此需要在 SVG 内部写入主题对应配色。
4. 调整两份 SVG 顶部配色定义，使亮色底图贴合温暖纸感与琥珀强调色，深色底图贴合夜航深蓝与青蓝信号色。

## 修改具体文件

- `src/components/map/map-light.svg`：将亮色地图从冷灰蓝调整为主站亮色的温暖纸面、柔和陆地与琥珀信号描边。
- `src/components/map/map.svg`：微调深色地图的海面、陆地、边界、经纬网与标签颜色，使其更贴合当前深色主题 token。
- `taskRecord.md`：追加本次 SVG 主题色适配任务记录。

## 日期

2026-06-16

## 任务目的

为 `public/data/airplan.json` 补充墨西哥航空数据，使北美航司资料覆盖 Aeromexico。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认静态数据维护、JSON 校验和任务记录要求。
2. 读取 `public/data/airplan.json`，确认墨西哥航空尚未收录，并查看北美航司区块的字段和链接风格。
3. 查询公开资料确认墨西哥航空官网、主线机队数量与现役 Boeing 机型。
4. 在北美航司区块补充墨西哥航空条目，保持既有 `airline`、`airlineEnglishName`、`airlineWebsite`、`passengerAircraftCount`、`models` 结构。

## 修改具体文件

- `public/data/airplan.json`：新增墨西哥航空记录，补充官网、机队数量和 Boeing 机型映射。
- `taskRecord.md`：追加本次航司数据维护任务记录。

## 日期

2026-06-16

## 任务目的

为 `public/data/airplan.json` 补充阿提哈德航空数据，使中东大型航司资料更加完整。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认静态数据维护、JSON 校验和任务记录要求。
2. 读取 `public/data/airplan.json`，确认阿提哈德航空尚未收录，并查看阿联酋航空附近的中东航司数据位置。
3. 查询公开资料确认阿提哈德航空官网、客运机队数量与现役主要 Airbus、Boeing 机型。
4. 在阿联酋航空之后补充阿提哈德航空条目，保持既有字段结构和机型链接风格。

## 修改具体文件

- `public/data/airplan.json`：新增阿提哈德航空记录，补充官网、客运机队数量和 Airbus、Boeing 机型映射。
- `taskRecord.md`：追加本次航司数据维护任务记录。

## 日期

2026-06-23

## 任务目的

根据用户提供的截图文件名，继续为飞机照片相册原图 URL 常量补充新增照片。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码常量维护、验证和任务记录要求。
2. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 现有 R2 前缀照片分组与已存在文件名。
3. 对照截图文件名，保留已存在的 URL，补充尚缺的 5 条照片 URL，避免重复写入已有照片。
4. 更新 `taskRecord.md`，记录本次照片 URL 补充过程。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：向 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 补充 5 条截图中尚未存在的照片原图 URL。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-23

## 任务目的

从飞机照片相册原图 URL 常量中删除指定的 `PANA1053.jpg` 原图链接。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码常量维护、验证和任务记录要求。
2. 使用搜索确认 `PANA1053.jpg` 与 `PANA1053_副本.jpg` 均存在，且本次只删除用户指定的 `PANA1053.jpg`。
3. 从 `src/pages/personal/constants/photoMeta.ts` 的 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 中移除指定 URL，保留 `PANA1053_副本.jpg`。
4. 更新 `taskRecord.md`，记录本次照片 URL 删除过程。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：删除 `PANA1053.jpg` 原图 URL，保留其他照片 URL。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-23

## 任务目的

根据用户提供的截图文件名，继续为飞机照片相册原图 URL 常量补充 8 张新增照片。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码常量维护、验证和任务记录要求。
2. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 现有 IMG 与 PANA 照片分组。
3. 搜索确认截图中的 8 个文件名尚未存在，按统一 R2 前缀补充 8 条照片 URL。
4. 更新 `taskRecord.md`，记录本次照片 URL 补充过程。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：向 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 补充 8 条截图中的照片原图 URL。
- `src/pages/personal/photoPreviews.generated.ts`：构建时刷新相册预览映射，新增照片按现有逻辑回退原图。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-13

## 任务目的

为飞机照片相册原图 URL 常量补充 8 张 PANA 系列新照片。

## 完成过程

1. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 `PANA0930.jpg` 使用统一 R2 前缀。
2. 按用户提供文件名在 `PANA0930.jpg` 后追加 `PANA1003` 至 `PANA1053` 共 8 条原图 URL。
3. 运行 `pnpm run build` 刷新 `photoPreviews.generated.ts`，构建通过。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：向 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 追加 8 条 PANA 系列照片原图 URL。
- `src/pages/personal/photoPreviews.generated.ts`：构建时自动刷新预览图映射。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-13

## 任务目的

继续为飞机照片相册原图 URL 常量补充 3 张 PANA 系列新照片。

## 完成过程

1. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 PANA 系列照片使用统一 R2 前缀。
2. 按用户提供文件名在 PANA 分组末尾追加 `PANA1009.jpg`、`PANA1019.jpg`、`PANA1027.jpg` 共 3 条原图 URL。
3. 运行 `pnpm run build` 刷新 `photoPreviews.generated.ts`，构建通过。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：向 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 追加 3 条 PANA 系列照片原图 URL。
- `src/pages/personal/photoPreviews.generated.ts`：构建时自动刷新预览图映射。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-13

## 任务目的

为飞机照片相册原图 URL 常量补充 5 张 IMG 系列新照片。

## 完成过程

1. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 IMG 系列照片使用统一 R2 前缀。
2. 按用户提供文件名在 IMG 分组末尾追加 `IMG_3584.jpeg` 至 `IMG_3599.jpeg` 共 5 条原图 URL。
3. 运行 `pnpm run build` 刷新 `photoPreviews.generated.ts`，构建通过。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：向 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 追加 5 条 IMG 系列照片原图 URL。
- `src/pages/personal/photoPreviews.generated.ts`：构建时自动刷新预览图映射。
- `taskRecord.md`：追加本次照片数据维护任务记录。

## 日期

2026-06-23

## 任务目的

为 `/photos` 照片页面在照片渲染前补充更贴近实际相册布局的骨架屏。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md` 与 `DESIGN.md` 上下文，确认照片页属于产品型深色档案界面。
2. 读取 `src/pages/photos/index.tsx`、个人页相册组件与现有骨架样式，确认页面级 `Suspense` 已有骨架，但相册数据加载和单张缩略图渲染前仍存在空白感。
3. 将相册数据加载态改为复用 `PersonalPhotosSectionSkeleton`，保证照片列表可渲染前显示标题、筛选栏和网格占位。
4. 为单张缩略图增加固定比例媒体槽和图片加载骨架，图片完成加载后再淡入，减少滚动时的空白与布局跳动。
5. 运行 `pnpm run build` 验证构建通过。

## 修改具体文件

- `src/pages/personal/sections/PersonalAircraftPhotosSection.tsx`：相册数据 bundle 加载期间复用照片相册骨架屏。
- `src/pages/personal/sections/AircraftPhotoGalleryImage.tsx`：新增缩略图加载完成状态和渲染前骨架占位。
- `src/pages/personal/index.css`：补充缩略图媒体槽、骨架层和淡入样式。
- `taskRecord.md`：追加本次照片页骨架屏任务记录。
整理一份基于 VueUse `useIdle` 的站点用户活跃时长统计 Hook 技术方案文档，便于直接复制、评审和后续实现。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认文档输出目录、任务记录和文件修改要求。
2. 阅读现有 `docs/map.md`，参考项目文档的 Markdown 组织方式。
3. 新增活跃时长统计技术方案文档，覆盖 Hook 职责、参数返回值、生命周期事件、上报策略、参考实现和验收建议。

## 修改具体文件

- `docs/active-duration-reporter.md`：新增基于 VueUse `useIdle` 的站点用户活跃时长统计 Hook 技术方案。
- `taskRecord.md`：追加本次技术方案文档整理任务记录。

## 日期

2026-06-23

## 任务目的

完善基于 VueUse `useIdle` 的站点用户活跃时长统计技术方案，补充可落地实现中的边界场景与可靠性设计。

## 完成过程

1. 复查 `docs/active-duration-reporter.md`，确认原方案中的 Hook 参数、状态判断、生命周期事件和参考实现。
2. 将优化建议并入原技术文档，补充 `segmentId` 幂等、串行上报、失败补报、SPA 路由切换、最大区间保护和 idle 事件范围说明。
3. 更新参考实现，移除非响应式浏览器状态上的 `computed` 判断，改为普通函数并补充区间 ID 与上报队列。

## 修改具体文件

- `docs/active-duration-reporter.md`：完善活跃时长统计方案的可靠性、边界处理、数据结构和验收场景。
- `taskRecord.md`：追加本次技术方案完善任务记录。

## 日期

2026-06-24

## 任务目的

为 `public/data/airplan.json` 补充芬兰航空数据，使航司机型资料库覆盖 Finnair。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认数据文件修改、JSON 校验与任务记录要求。
2. 读取 `public/data/airplan.json`，确认航司条目字段为 `airline`、`airlineEnglishName`、`airlineWebsite`、`passengerAircraftCount` 与 `models`。
3. 按现有格式新增芬兰航空条目，补充官网、客机数量以及 Airbus、ATR、Embraer 机型映射。

## 修改具体文件

- `public/data/airplan.json`：新增芬兰航空记录，包含官网、77 架客机数量与 A319/A320/A321/A330/A350、ATR 72-500、E190 机型映射。
- `taskRecord.md`：追加本次数据维护任务记录。

## 日期

2026-06-24

## 任务目的

将 `public/data/airplan.json` 中芬兰航空的机型资料链接统一替换为 Planespotters 数据来源。

## 完成过程

1. 读取 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认数据文件修改与任务记录要求。
2. 搜索现有 `airplan.json` 中 Planespotters 机型筛选链接写法，沿用 `fleet/list/{airline}/current?type={model}` 格式。
3. 保留芬兰航空现有字段、机型名与客机数量，仅将各机型链接替换为 Planespotters 对应页面。

## 修改具体文件

- `public/data/airplan.json`：将芬兰航空 A319/A320/A321/A330/A350、ATR 72-500、E190 的机型链接改为 Planespotters 来源。
- `taskRecord.md`：追加本次数据来源调整任务记录。
<<<<<<< HEAD

## 日期

2026-06-25

## 任务目的

为个人页飞机照片原图列表补充新增的 PANA 系列照片 URL。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码修改、验证与任务记录要求。
2. 读取 `src/pages/personal/constants/photoMeta.ts`，确认 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 使用完整 R2 资源 URL 列表维护。
3. 按截图文件名和指定 R2 前缀补充 9 条 PANA 照片原图 URL。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：新增 PANA1012、PANA1025、PANA1300、PANA1301、PANA1302、PANA1305、PANA1307、PANA1310、PANA1317 照片 URL。
- `taskRecord.md`：追加本次照片 URL 补充任务记录。

## 日期

2026-06-27

## 任务目的

为 `public/data/airplan.json` 补充美洲知名航司数据，扩展航司机型资料库覆盖范围。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认数据文件修改、JSON 校验与任务记录要求。
2. 读取现有 `public/data/airplan.json`，确认航司条目字段、Planespotters 机型链接格式与美洲航司现有追加位置。
3. 补充 Air Canada、WestJet、LATAM Airlines、Avianca、Copa Airlines、GOL、Azul Brazilian Airlines、Spirit Airlines 8 家航司的官网、客机数量与主要客运机型映射。
4. 使用 `jq` 校验 JSON 合法性，并核对新增条目已写入。
5. 使用本地 Rsbuild 二进制执行构建验证；`pnpm run build` 在依赖恢复阶段触发 pnpm 安装脚本审批拦截，未进入实际构建。

## 修改具体文件

- `public/data/airplan.json`：新增 8 家美洲航司及对应 Airbus、Boeing、ATR、Embraer 机型链接数据。
- `taskRecord.md`：追加本次美洲航司数据补充任务记录。

## 日期

2026-06-27

## 任务目的

让首页航司搜索输入框支持按英文航司名称搜索。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码修改、验证与任务记录要求。
2. 读取 `src/pages/home/index.tsx`，确认当前 `filterAirlineFleets` 仅使用中文航司名参与搜索。
3. 将航司筛选条件扩展为同时匹配中文航司名与英文航司名，并同步调整输入框占位文案。

## 修改具体文件

- `src/pages/home/index.tsx`：航司搜索支持匹配 `airlineEnglishName`，输入框提示改为中英文航司名称。
- `taskRecord.md`：追加本次首页航司搜索能力补充任务记录。

## 日期

2026-06-28

## 任务目的

将首页机型资料库加载态限定在航司卡片列表区域，并改为与真实数据卡片一致风格的骨架屏。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md` / `DESIGN.md` 与项目 `impeccable` 规则，确认首页 UI 修改、样式约束与任务记录要求。
2. 读取 `src/pages/home/index.tsx` 与 `src/pages/home/index.css`，确认原加载态为页面标题下的一行 `data-state` 文案。
3. 新增 `FleetResultsSkeleton`，让加载态只渲染在 `fleet-results` 列表区域，并以航司卡片、制造商行、机型芯片的结构展示骨架占位。
4. 补充骨架屏样式，使其复用现有航司卡片的背景、边框、顶部分色条、间距与芯片轮廓，并支持减少动态偏好。
5. 按用户要求未运行构建、未启动本地服务，由用户自行验证页面效果。

## 修改具体文件

- `src/pages/home/index.tsx`：移除全局文案加载态，新增列表区域骨架屏组件与占位配置。
- `src/pages/home/index.css`：新增航司卡片式骨架屏、shimmer 动效、响应式和减少动态样式。
- `taskRecord.md`：追加本次首页加载态样式调整任务记录。

## 日期

2026-06-28

## 任务目的

将首页路由懒加载阶段的 `正在载入页面...` 提示替换为机型资料库卡片骨架屏。

## 完成过程

1. 根据截图定位到居中 loading 来自 `src/App.tsx` 的 Suspense fallback，而非首页数据请求 loading。
2. 将首页骨架屏抽为 `FleetResultsSkeleton` 复用组件，并新增 `HomePageLoadingFallback` 承接首页路由懒加载阶段。
3. 在 `src/App.tsx` 中新增按当前路径选择 fallback 的逻辑：首页 `/` 使用机型资料库骨架屏，其他页面保留原轻量加载提示。
4. 运行 `node_modules/.bin/tsc --noEmit` 做类型检查；检查未通过，报错来自既有的 `src/pages/home/constant.ts` 未使用类型导入，以及 `src/pages/personal/data/aircraftPhotosData.ts` 预览图索引类型问题，非本次改动新增。

## 修改具体文件

- `src/App.tsx`：首页路由 Suspense fallback 改为机型资料库骨架屏，其他路由保留原加载提示。
- `src/pages/home/FleetResultsSkeleton.tsx`：新增可复用的航司卡片骨架屏与首页懒加载骨架页。
- `src/pages/home/index.tsx`：复用 `FleetResultsSkeleton` 替代页面内数据加载文案。
- `taskRecord.md`：追加本次首页路由加载态替换任务记录。

## 日期

2026-06-28

## 任务目的

移除首页机型资料库中的「补充资料」按钮及其外部表单链接相关逻辑。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc` 与项目 `impeccable` 规则，确认 UI 清理、引用删除和任务记录要求。
2. 搜索 `CONTRIBUTION_FORM_URL`、`补充资料`、`fleet-summary__cta`、`app-nav__link--cta` 与 `pl-nav-cta`，定位按钮、外部表单常量和样式 token 的全部源码引用。
3. 删除首页概览区「补充资料」链接与 `CONTRIBUTION_FORM_URL` 导入，调整统计概览为单侧自然排列。
4. 删除外部表单 URL 常量、首页 CTA 样式、导航 CTA 样式和不再使用的 CTA 颜色变量。
5. 运行 `node_modules/.bin/tsc --noEmit` 做类型检查；检查未通过，报错仍来自既有的 `src/pages/home/constant.ts` 未使用类型导入，以及 `src/pages/personal/data/aircraftPhotosData.ts` 预览图索引类型问题，非本次改动新增。

## 修改具体文件

- `src/pages/home/index.tsx`：移除「补充资料」链接和外部表单 URL 导入。
- `src/pages/home/index.css`：删除 `fleet-summary__cta` 样式，统计概览改为左侧自然排列。
- `src/constants/external-links.ts`：删除 `CONTRIBUTION_FORM_URL` 常量并更新文件说明。
- `src/App.css`：删除不再使用的导航 CTA 样式和相关主题变量。
- `taskRecord.md`：追加本次按钮与链接逻辑移除任务记录。

## 日期

2026-07-01

## 任务目的

在个人页飞机照片原图 URL 列表中补充两张 `plane-model` 目录下的图片。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码数据修改、验证与任务记录要求。
2. 查看 `src/pages/personal/constants/photoMeta.ts`，确认 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 中现有 `plane-model` URL 的排列方式。
3. 根据用户截图中的文件名与指定链接前缀，追加 `PANA1494.jpg` 和 `PANA1502.jpg` 两条原图 URL。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：在 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 中新增两条 `plane-model` 图片 URL。
- `taskRecord.md`：追加本次飞机照片原图 URL 补充任务记录。

## 日期

2026-07-01

## 任务目的

在个人页飞机照片原图 URL 列表中继续补充六张 `plane-model` 目录下的图片。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码数据修改、验证与任务记录要求。
2. 查看 `src/pages/personal/constants/photoMeta.ts`，确认上一轮新增 URL 位于 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 的 `plane-model` 分组末尾。
3. 根据用户三张截图中的文件名与同一链接前缀，追加 `DSC_0972.jpg`、`DSC_0975.jpg`、`PANA1521.jpg`、`PANA1525.jpg`、`PANA1460.jpg` 和 `PANA1461.jpg` 六条原图 URL。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：在 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 中新增六条 `plane-model` 图片 URL。
- `taskRecord.md`：追加本次飞机照片原图 URL 补充任务记录。

## 日期

2026-07-01

## 任务目的

在个人页飞机照片原图 URL 列表中继续补充两张 `plane-model` 目录下的图片。

## 完成过程

1. 阅读 `CODEX.md` 与 `.cursor/rules/project-base-rules.mdc`，确认源码数据修改、验证与任务记录要求。
2. 查看 `src/pages/personal/constants/photoMeta.ts`，确认当前 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 的 `plane-model` 分组末尾。
3. 根据用户截图中的文件名与同一链接前缀，追加 `DSC_0861.jpg` 和 `DSC_0884.jpg` 两条原图 URL。

## 修改具体文件

- `src/pages/personal/constants/photoMeta.ts`：在 `AIRCRAFT_PHOTO_ORIGINAL_URLS` 中新增两条 `plane-model` 图片 URL。
- `taskRecord.md`：追加本次飞机照片原图 URL 补充任务记录。
=======
>>>>>>> 66185a4 (feat: add air line data)

## 日期

2026-07-04

## 任务目的

根据桌面提示文件 `Aircraft-Log-UI-Improvement-Prompt.md` 优化站点 UI，使站点更贴近 Aircraft Log 航空摄影与飞机日志体验。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md` / `DESIGN.md` 语境和项目 `impeccable`、`rsbuild-best-practices` skill，确认深色档案型产品界面、Rsbuild 配置和验证要求。
2. 阅读桌面提示文件，提取 Hero、深色卡片、统计仪表、照片 overlay、Recent Spotting 时间线、Flight Map 和飞机 marker 等优化方向。
3. 将默认主题调整为深色 Aircraft Log 语境，同步顶部品牌、页面 title、description 与 theme-color。
4. 重构首页首屏为 Aircraft Log Hero，加入 Aircraft / Airlines / Airports / Countries 统计、Browse Aircraft / Flight Map CTA、Fleet Intelligence 仪表盘、首页航迹地图和更清晰的机队筛选入口。
5. 优化航司条目和机型 chip：加入统一尺寸品牌占位 logo、hover 轻微上浮、制造商品牌色 chip，并保持现有数据结构不变。
6. 优化照片页相册：为缩略图增加目录和编号 overlay，强化 hover zoom / shadow，同时保留懒加载与全屏预览。
7. 优化个人飞行日志：在摘要后增加 Recent Spotting 航程时间线，并将地图 canvas marker 与图例改成小飞机符号。
8. 修正 `pnpm-workspace.yaml` 中 `sharp` 构建脚本许可占位，保证项目照片预览依赖可正常安装和构建。
9. 运行 `CI=true pnpm run build`，构建通过；启动本地 dev server 并用浏览器检查桌面、移动首页、照片页 overlay、个人页时间线与地图，无控制台错误或横向溢出。

## 修改具体文件

- `src/App.tsx`：顶部品牌从 Aircraft Wiki 调整为 Aircraft Log。
- `src/App.css`：更新主题变量说明，保持默认深色运行时语义一致。
- `src/utils/themePreference.ts`：默认主题回落改为深色 Night Flight Archive。
- `rsbuild.config.ts`：更新页面 title、description、keywords、theme-color 和首屏主题注入脚本。
- `pnpm-workspace.yaml`：将 `sharp` 的 `allowBuilds` 占位设为 `true`。
- `src/pages/home/index.tsx`：新增首页 Hero 统计、仪表盘、航迹地图、Recent Spotting 摘录、航司 logo 占位和制造商 chip 分类。
- `src/pages/home/index.css`：新增首页 Hero、统计图、地图区、航司卡片、机型 chip 与响应式样式。
- `src/pages/personal/index.tsx`：新增个人页 Recent Spotting 航程时间线。
- `src/pages/personal/index.css`：新增时间线样式，强化照片相册 overlay、hover zoom 与移动端布局。
- `src/pages/personal/sections/PersonalAircraftPhotosSection.tsx`：为照片缩略图输出目录与编号 overlay 文案。
- `src/components/map/canvasMap.ts`：将地图 marker 绘制为小飞机符号。
- `src/components/map/index.css`：将地图图例 marker 同步为小飞机形状。
- `taskRecord.md`：追加本次 UI 优化任务记录。

## 日期

2026-07-04

## 任务目的

检查并修复站点浅色主题适配问题，重点解决首页 Aircraft Log 首屏在浅色下仍显示深色航图背景、文字对比不足的问题。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md` / `DESIGN.md` 语境和项目 `impeccable` skill，确认浅色主题、对比度、响应式和任务记录要求。
2. 根据用户截图定位首页 Hero 使用硬编码深色 OKLCH / rgba 背景、文字和统计卡色值，导致浅色主题下黑字压在深色背景上。
3. 为首页 Hero 增加局部浅色 / 深色主题 token，浅色使用冷灰蓝日间航图背景，深色保留 Night Flight Archive 夜航质感。
4. 将浅色全局语义色从偏暖米色调整为冷灰蓝 Daylight Archive，并同步浅色地图背景、图例、滚动条、边框和 focus / hover token。
5. 调整地图组件浅色路线、机场 marker 和 tooltip 色值，使其与新的浅色底图和全局主题一致。
6. 修正主题切换按钮月亮图标的 React SVG 属性命名，清除浅色验收时出现的控制台 warning。
7. 运行 `CI=true pnpm run build`，构建通过；使用浏览器在浅色主题下检查首页桌面、首页移动端、个人页、照片页和参考页，均无横向溢出，控制台无站点 warning / error。

## 修改具体文件

- `src/App.css`：更新浅色主题全局语义色、surface、边框、地图背景和滚动条 token。
- `src/pages/home/index.css`：为 Aircraft Log Hero 增加浅色 / 深色局部主题 token，并修正标题、按钮、统计卡在浅色下的颜色。
- `src/components/map/index.css`：更新浅色地图路线、marker 与 tooltip 色值。
- `src/components/theme-toggle/index.tsx`：修正月亮图标 SVG 属性为 React JSX 命名。
- `src/utils/themePreference.ts`：同步浅色 theme-color 到新的冷灰蓝壳层。
- `taskRecord.md`：追加本次浅色适配修复任务记录。

## 日期

2026-07-04

## 任务目的

针对站点地图在深色和浅色模式下的色系做完整适配，使底图、航迹、飞机标记、图例和外层容器与当前主题一致。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc` 和项目 `impeccable` skill，确认地图配色适配、可访问性、验证与任务记录要求。
2. 检查 `src/components/map/map-light.svg`、`src/components/map/map.svg`、`src/components/map/index.css` 与 `src/App.css`，定位浅色底图仍使用 warm paper / amber 色系，深色模式缺少对应地图容器变量覆写的问题。
3. 将浅色世界地图 SVG 调整为冷灰蓝海面、slate 陆地、蓝灰边界与标签，使其贴合 Daylight Archive 主题。
4. 将深色世界地图 SVG 调整为更深的夜间雷达海图风格，降低陆地亮度并强化青蓝边界与标签对比。
5. 更新全局地图 token，分别为浅色和深色提供地图背景、边框、frame、vignette、tooltip 与图例颜色。
6. 更新地图组件内的航迹和飞机 marker CSS 变量，让国内 / 国际航迹与机场标记在两套主题下都有独立的可读色阶。
7. 运行 `CI=true pnpm run build`，构建通过；使用浏览器检查浅色桌面地图、深色桌面地图、移动端浅色 / 深色地图，无横向溢出且控制台无 warning / error。

## 修改具体文件

- `src/components/map/map-light.svg`：将浅色底图从米棕 Natural Earth 色系调整为冷灰蓝 Daylight Archive 色系。
- `src/components/map/map.svg`：优化深色底图的海面、陆地、边界、标签和阴影色值。
- `src/components/map/index.css`：更新浅色和深色模式下的航迹、飞机 marker、tooltip 色值。
- `src/App.css`：补齐深色地图容器变量，并微调浅色地图背景、边框、frame、图例与 tooltip token。
- `taskRecord.md`：追加本次地图主题色适配任务记录。

## 日期

2026-07-04

## 任务目的

修复航司搜索时结果列表高度随匹配数量忽高忽低的问题，让筛选体验保持稳定。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md`、`DESIGN.md` 和项目 `impeccable` skill，确认产品 UI、滚动区、可访问性、验证与任务记录要求。
2. 检查首页航司筛选区域的 JSX 与 CSS，确认 `.fleet-results` 已挂载 `scroll-area-night`，但桌面样式仍为 `height: auto` 和 `overflow: visible`，会随结果数量改变页面高度。
3. 将航司结果区改为响应式固定高度的内部滚动容器，并保留滚动条 gutter、横向溢出防护和移动端稳定高度。
4. 为结果区补充 `role="region"`、`aria-label` 与 `tabIndex`，让键盘用户可以聚焦并滚动筛选结果区域。
5. 运行 `CI=true pnpm run build`，构建通过；启动 dev server 后用浏览器检查桌面与移动端默认列表、单条搜索结果、空结果和清空搜索路径，结果区高度稳定且无横向溢出，控制台无 warning / error。

## 修改具体文件

- `src/pages/home/index.tsx`：为航司筛选结果容器补充可访问区域语义与键盘聚焦能力。
- `src/pages/home/index.css`：将航司结果列表改为稳定高度的内部滚动区域，并同步移动端高度规则。
- `taskRecord.md`：追加本次航司搜索列表高度稳定性修复任务记录。

## 日期

2026-07-05

## 任务目的

调整航司筛选无匹配结果的空状态，让文案居中展示并移除结果区内部的额外提示容器边框。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc` 和项目 `impeccable` skill，确认空状态、可访问性、验证与任务记录要求。
2. 根据用户截图定位筛选空状态仍复用 `data-state` 通用提示卡样式，导致固定结果区内出现额外大边框容器。
3. 将筛选空状态改为 `fleet-results__empty` 专用文案类，保留文案居中、去除内部背景与边框。
4. 运行 `CI=true pnpm run build`，构建通过。

## 修改具体文件

- `src/pages/home/index.tsx`：将筛选空结果文案从通用 `data-state` 改为专用空态类。
- `src/pages/home/index.css`：为 `fleet-results__empty` 增加居中、无边框、无背景的空态样式。
- `taskRecord.md`：追加本次航司筛选空状态调整任务记录。

## 日期

2026-07-05

## 任务目的

根据桌面 `References-Page-UI-Redesign-Prompt.md` 重设计 `/references` 页面，将长列表升级为现代深色数据目录页。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md` / `DESIGN.md` 语境和项目 `impeccable` skill，确认产品型 UI、深浅色 token、可访问性、验证与任务记录要求。
2. 阅读桌面 Redesign Prompt，提取标题区、统计条、搜索筛选、Section + Card List、复制 toast、空状态、移动端单列和长列表优化要求。
3. 保留 `AIRLINE_REFERENCE_SOURCES` 原始数据不变，在页面层派生类型、地区、域名、最近添加、使用频率和分组视图模型。
4. 将 `/references` 从单一长列表重构为顶部搜索/筛选/排序、四项统计、sticky filter bar、类型分组、参考资料卡片、展开全部 / 折叠全部和复制域名 toast。
5. 为搜索结果增加实时过滤、命中文案高亮、结果数量展示和空状态提示；移动端改为单列卡片并避免横向滚动。
6. 为长列表卡片加入分组折叠与 `content-visibility`，默认展开前三个分组，降低首屏和滚动压力。
7. 运行 `CI=true pnpm run build`，构建通过；启动 dev server 后用浏览器检查桌面和移动端布局、搜索、类型筛选、展开折叠、空状态、复制 toast，无横向溢出且控制台无 warning / error。

## 修改具体文件

- `src/pages/references/index.tsx`：重构参考资料页结构，新增搜索、筛选、排序、统计、分组卡片、命中高亮和复制 toast。
- `src/pages/references/index.css`：重写参考资料页布局与视觉样式，支持 sticky filter bar、桌面双列卡片、移动端单列卡片和深浅色 token。
- `taskRecord.md`：追加本次参考资料页 UI 重设计任务记录。

## 日期

2026-07-05

## 任务目的

为 `/references` 参考资料页补充 purposeful 动效，增强页面入场编排、分组折叠过渡、筛选反馈与微交互，不改变业务逻辑与布局结构。

## 完成过程

1. 阅读 `PRODUCT.md`、`DESIGN.md` 与 animate / frontend-design skill，确认产品为克制档案型气质，动效应以 160–480ms transform + opacity 为主并尊重 `prefers-reduced-motion`。
2. 在 `index.css` 增加页面入场 stagger（intro、统计卡、sticky toolbar、分组 section）、`archive-filter-swap` 结果数与空状态过渡、分组 `grid-template-rows` 折叠展开、展开后卡片错峰 reveal，以及 chip / 按钮按压与主操作外链图标微位移反馈。
3. 在 `index.tsx` 做最小结构改动：分组 panel 常驻 DOM 以承载折叠动画，筛选结果数用 `key` 触发轻量 swap 动画；折叠态加 `aria-hidden` / `inert` 保持可访问性。
4. 运行 `pnpm run build`，构建通过。

## 修改具体文件

- `src/pages/references/index.css`：新增入场 stagger、折叠 panel、卡片 reveal、筛选结果 swap、空状态与微交互动效。
- `src/pages/references/index.tsx`：分组 panel 结构改为可动画折叠，筛选结果数包裹 `reference-toolbar__result-value` 以触发动画。
- `taskRecord.md`：追加本次参考资料页动效任务记录。

## 日期

2026-07-05

## 任务目的

使用 animate skill 优化 `/personal` 站长飞行日志页的动效过渡，让懒加载区块、时间线、机场列表和乘机记录展开反馈更连贯且保留减少动态偏好适配。

## 完成过程

1. 阅读 `CODEX.md`、`.cursor/rules/project-base-rules.mdc`、`PRODUCT.md`、`DESIGN.md`、项目 `impeccable` skill，以及 animate / frontend-design skill，确认产品型界面应使用克制、短时、状态导向的动效。
2. 检查 `/personal` 页面结构与 `src/pages/personal/index.css`，确认机场足迹与乘机记录采用 lazy viewport section 和手风琴展开，适合补充轻量区块进入、展开状态与 hover / active 反馈。
3. 为 personal 页增加局部 motion token、`personal-section-settle` 与 `personal-card-settle` keyframes，并让懒加载区块替换时以 transform + opacity 进入。
4. 优化时间线卡片、机场国家列表和乘机记录台账的 hover、active、展开态与行级 reveal 过渡，统一折叠面板 `grid-template-rows`、opacity 和 transform 的时间曲线。
5. 增加 `prefers-reduced-motion: reduce` 兜底，关闭新增 reveal 与位移动效，并保留布局状态可读。
6. 运行 `CI=true pnpm run build`，构建通过；启动 dev server 后用浏览器检查桌面和移动端 `/personal`，验证无横向溢出、国家与年份手风琴可展开、动效属性生效且控制台无项目 warning / error。

## 修改具体文件

- `src/pages/personal/index.css`：新增 personal 页局部 motion token、懒加载区块进入、时间线 hover、机场列表展开、乘机记录展开与 reduced-motion 动效适配。
- `taskRecord.md`：追加本次 personal 页动效优化任务记录。

## 日期

2026-07-12

## 任务目的

将飞机相册目录改为从图片链接的 `key` 参数提取：仅含文件名的图片归入根目录，包含目录层级的图片归入对应完整目录路径。

## 完成过程

1. 检查飞机照片原图链接、相册数据适配逻辑和目录字段定义，确认旧逻辑错误地依据 URL 域名与请求路径生成目录。
2. 改为通过 `URLSearchParams` 读取并解码 `key` 参数；无目录层级时返回根目录键，有目录层级时移除文件名并保留完整目录路径。
3. 同步调整根目录识别、目录标签和排序逻辑，并更新 `AircraftPhoto.directory` 字段注释。

## 修改具体文件

- `src/pages/personal/data/aircraftPhotosData.ts`：从链接 `key` 参数提取相册目录，并按新目录键生成标签及排序。
- `src/pages/personal/type.d.ts`：更新飞机照片目录字段的语义说明。
- `taskRecord.md`：追加本次相册目录提取逻辑调整记录。

## 日期

2026-07-18

## 任务目的

使用 `emil-design-eng` skill 优化首页高频筛选与快速入口的动效反馈，减少键盘筛选时的重复位移动画并补齐按压状态。

## 完成过程

1. 阅读项目产品、设计规范与首页实现，按产品型资料检索界面的使用频率审查现有动效。
2. 移除筛选条件变化时结果列表的 keyed remount、整表进入动画和条目 stagger，避免搜索每输入一个字符都触发重复位移。
3. 移除非交互航司卡片、品牌占位标识与机型标签的上浮 hover，避免制造虚假的可点击暗示。
4. 为首页两个快速入口补充轻量按压缩放反馈，同时保留加载状态动效和减少动态偏好适配。

## 修改具体文件

- `src/pages/home/index.tsx`：取消筛选结果 keyed remount，保留即时过滤与结果区滚动复位。
- `src/pages/home/index.css`：移除高频筛选和非交互内容的装饰动效，增加快速入口按压反馈。
- `taskRecord.md`：追加本次首页设计工程优化记录。

## 日期

2026-07-18

## 任务目的

使用 `emil-design-eng` skill 将首页的动效判断标准扩展到个人飞行日志、飞机照片与参考资料页面，减少高频操作和非交互内容的装饰动画。

## 完成过程

1. 审查 `/personal`、`/photos` 与 `/references` 的搜索筛选、折叠面板、相册预览、列表和按钮反馈。
2. 移除参考资料筛选统计、空态和展开卡片的重复 keyframe，取消非交互资料卡的 hover 上浮，并保留即时筛选结果更新。
3. 移除个人页静态时间线与乘机台账行的 hover 位移，以及机场和航班展开内容的行级 stagger。
4. 将相册、参考链接、工具按钮和折叠控件的 hover 反馈限制在精细指针设备，键盘焦点不再触发位移动画。
5. 为相册预览入口、预览关闭按钮、机场与年份折叠控件补充轻量按压反馈，并停止对 `grid-template-rows` 布局属性做过渡。

## 修改具体文件

- `src/pages/personal/index.css`：统一个人页与照片页共享交互的频率、按压、hover 和折叠动效策略。
- `src/pages/references/index.tsx`：取消筛选统计的 keyed remount。
- `src/pages/references/index.css`：移除高频筛选与非交互卡片动效，隔离触控 hover 并优化折叠反馈。
- `taskRecord.md`：追加本次剩余页面设计工程优化记录。

## 日期

2026-07-18

## 任务目的

实现 `plans/` 中的五项动效改进计划，补全共享下拉退出、主题切换、复制反馈、地图 tooltip 与返回顶部按钮的局部状态反馈。

## 完成过程

1. 为共享 `Select` 增加 160ms 延迟卸载与可中断的 opacity / transform 退出，关闭阶段立即撤销展开语义和指针交互，并保留 reduced-motion 淡出。
2. 为主题切换图标增加 160ms 局部状态进入和 0.97 按压反馈，将 hover 位移限制到精细指针设备。
3. 为参考资料复制按钮增加原位淡化与 2px blur 的“已复制”成功状态，保留原有 toast 和失败反馈，并稳定按钮尺寸。
4. 为地图指针触发的 tooltip 增加精细指针限定的 160ms opacity / scale 进入，方向键触发继续保持即时。
5. 为返回顶部按钮增加 0.97 按压反馈，并在 reduced-motion 下保持静止。
6. 运行 `CI=true pnpm run build`，构建通过；浏览器检查桌面和 390x844 移动布局、Select、主题、地图键盘路径及复制失败路径，四条路由无横向溢出且控制台无 warning / error。浏览器环境拒绝剪贴板写入，因此复制成功路径未能在该环境实际触发。

## 修改具体文件

- `src/components/Select/index.tsx`、`src/components/Select/index.css`：增加共享下拉的退出状态、延迟卸载与 reduced-motion 处理。
- `src/components/theme-toggle/index.tsx`、`src/App.css`：增加主题图标状态进入、按压反馈与 hover 输入方式隔离。
- `src/pages/references/index.tsx`、`src/pages/references/index.css`：增加复制按钮的局部成功状态与稳定交叉淡化。
- `src/components/map/index.tsx`、`src/components/map/index.css`：区分指针和键盘 tooltip，并仅动画指针入口。
- `src/components/back-to-top/index.css`：增加返回顶部按钮按压反馈。
- `plans/*.md`、`plans/README.md`：将五项动效计划及索引状态更新为 DONE。
- `taskRecord.md`：追加本次动效计划实施记录。

## 日期

2026-07-18

## 任务目的

使用 `apple-design` skill 对全部页面进行响应、可预测性与辅助偏好优化，让共享交互在指针按下时即时反馈，并覆盖透明度和高对比系统偏好。

## 完成过程

1. 审查全站壳层、导航、Select、参考资料控件、相册与地图手势，确认地图已具备 Pointer Capture、1:1 拖拽、缩放锚点和可中断 rAF 重绘。
2. 为全站按钮与链接增加 `touch-action: manipulation`，并为导航、Select、参考资料分组与资料链接补充克制的 pointer-down 缩放反馈。
3. 将导航 hover 位移限制在精细指针设备，键盘 focus 保持高对比状态但不位移；减少动态偏好下取消新增缩放。
4. 为 `prefers-reduced-transparency: reduce` 提供深浅主题近实色表面 token，为 `prefers-contrast: more` 提供强化文字、边界和焦点 token。
5. 增加全站 `font-optical-sizing: auto` 与文本缩放适配，保持系统字号调整时的可读性。
6. 运行 `CI=true pnpm run build`，构建通过；浏览器检查桌面和 390x844 下四条路由，无横向溢出且控制台无 warning / error。

## 修改具体文件

- `src/App.css`：增加全站触控响应、导航按压反馈、光学字号、减少透明度与高对比偏好 token。
- `src/components/Select/index.css`：增强共享 Select 的 pointer-down 缩放反馈。
- `src/pages/references/index.css`：增加资料分组与资料链接按压反馈及 reduced-motion 兜底。
- `DESIGN.md`：记录三类系统辅助偏好的全站设计约定。
- `taskRecord.md`：追加本次 Apple 风格全站体验优化记录。

## 日期

2026-07-20

## 任务目的

补充 2026 年 9 月北京首都与韩国仁川之间的大韩航空往返乘机记录。

## 完成过程

1. 核对乘机台账的数据结构、日期排序规则以及首都与仁川的既有地图航迹。
2. 新增北京至首尔、首尔至北京两条单程记录，航司统一为“大韩航空”，机型统一为“321”。
3. 确认地图中已存在首都至仁川及仁川至首都的双向航迹，无需重复新增。

## 修改具体文件

- `src/constants/external-links.ts`：新增 2026-9-4 北京至首尔与 2026-9-6 首尔至北京的大韩航空 321 乘机记录。
- `taskRecord.md`：追加本次飞行数据更新记录。

## 日期

2026-07-20

## 任务目的

为首页 Recent Spotting 最近乘机记录区块新增“查看更多”入口，并跳转至完整飞行日志页面。

## 完成过程

1. 核对首页最近乘机记录区块的结构、样式与项目站内路由方案。
2. 在四条最近记录下方增加“查看更多”站内链接，目标路径为 `/personal`。
3. 补充链接的悬停、键盘焦点、按压和移动端触控状态，沿用现有主题变量与动效时长。

## 修改具体文件

- `src/pages/home/index.tsx`：在 Recent Spotting 时间线下新增跳转至 `/personal` 的“查看更多”链接。
- `src/pages/home/index.css`：新增入口的默认、交互、焦点及移动端样式。
- `taskRecord.md`：追加本次首页入口更新记录。

## 日期

2026-07-20

## 任务目的

统一个人页飞行数据中的航司名称，使其与 `public/data/airplan.json` 的航司名称保持一致。

## 完成过程

1. 提取个人飞行记录中使用的航司名称，并与 `public/data/airplan.json` 的航司名称逐项比对。
2. 将简称和异名替换为数据文件中的正式名称，保留原有航线、日期、机型及记录顺序。
3. 检查个人飞行记录中的全部航司名称均能在 `public/data/airplan.json` 中匹配，并运行生产构建验证。

## 修改具体文件

- `src/constants/external-links.ts`：将个人飞行记录中的 8 类航司简称或异名统一为航司数据文件中的正式名称。
- `taskRecord.md`：追加本次航司名称统一记录。

## 日期

2026-07-20

## 任务目的

将个人页日本航线记录中的“春秋航空”更正为“春秋航空日本”。

## 完成过程

1. 定位个人飞行记录中两条使用“春秋航空”的天津与东京往返航段。
2. 将两条记录的航司名称统一更正为 `public/data/airplan.json` 中的“春秋航空日本”。
3. 检查个人飞行记录航司名称的数据匹配结果，并运行生产构建验证。

## 修改具体文件

- `src/constants/external-links.ts`：更正天津与东京往返记录的航司名称。
- `taskRecord.md`：追加本次航司名称更正记录。

## 日期

2026-07-20

## 任务目的

根据用户提供的详细机队截图更新新加坡航空现役机队数据。

## 完成过程

1. 按截图核对新加坡航空各现役子型号的 Current Total，并区分客机、货机与未来订单。
2. 将现役客机数量更新为 152 架，统计包含停场客机，不包含 7 架 B747-400 与 5 架 B777F 货机。
3. 在现役机型列表中补充 `B747-400` 与 `B777-F`，未将未来订单中的 A350-1000F 和 B777-9 计入现役数据。
4. 验证 JSON 格式、截图数量汇总及生产构建。

## 修改具体文件

- `public/data/airplan.json`：更新新加坡航空客机总数并补充两种现役货机型号。
- `taskRecord.md`：追加本次新加坡航空机队数据更新记录。

## 日期

2026-07-20

## 任务目的

在个人页机场足迹区新增基于 React Flow 的航线流程图，并支持与原有世界地图切换展示。

## 完成过程

1. 复用个人页现有机场与航迹数据，为航迹补充起终点机场名称，避免地图与流程图维护重复线路常量。
2. 根据已连接机场生成只读流程节点，根据国内与国际航段生成带方向的流程边，并提供缩放、平移与适配视图控件。
3. 在机场区标题旁增加“地图 / 航线图”分段切换，默认保留地图，并补充双主题、移动端、键盘焦点和减少动态效果样式。

## 修改具体文件

- `src/pages/personal/type.d.ts`：为航迹类型增加起终点机场名称字段。
- `src/pages/personal/constants/airportsMap.ts`：让地图航迹数据同步保留起终点机场名。
- `src/pages/personal/sections/PersonalAirportFlow.tsx`：新增 React Flow 机场航线网络组件。
- `src/pages/personal/sections/PersonalAirportSection.tsx`：新增地图与航线图切换交互及懒加载入口。
- `src/pages/personal/index.css`：新增切换控件、流程图、节点、航线、图例及响应式样式。
- `taskRecord.md`：追加本次机场航线流程图实现记录。

## 日期

2026-07-20

## 任务目的

优化个人页航线流程图的信息层级与交互，使机场网络更直观、更容易追踪。

## 完成过程

1. 将机场节点改为城市主标题、国家与航段数的分层结构，并突出北京首都与北京大兴两个核心枢纽。
2. 重新组织欧洲行程链、国内支线、东亚和东南亚机场的位置，减少全景下的线路交叉与标签拥挤。
3. 增加机场关联高亮，点击节点时仅强调与该机场直接相连的航线和机场，点击空白或再次点击可恢复全览。

## 修改具体文件

- `src/pages/personal/sections/PersonalAirportFlow.tsx`：新增自定义机场节点、枢纽布局与关联航线聚焦逻辑。
- `src/pages/personal/index.css`：完善节点信息层级、枢纽状态、聚焦弱化状态及过渡效果。
- `taskRecord.md`：追加本次航线图直观性优化记录。

## 日期

2026-07-22

## 任务目的

在航司数据中补充维兹航空及其现役客机机型与图片参考链接。

## 完成过程

1. 根据 Planespotters 的 Wizz Air Malta 机队页面核对当前机队规模与机型分类。
2. 新增维兹航空中英文名称、官网、127 架客机总数，以及 A320-200、A320neo、A321-200、A321neo 四类机型。
3. 为每类机型配置对应的 Planespotters 图片列表链接，并验证 JSON 格式与生产构建。

## 修改具体文件

- `public/data/airplan.json`：新增维兹航空基础信息、客机数量、现役机型和图片参考链接。
- `taskRecord.md`：追加本次维兹航空数据补充记录。

## 日期

2026-07-22

## 任务目的

在航司数据中补充英国航空及其现役客机机型与图片参考链接。

## 完成过程

1. 根据 Planespotters 的 British Airways 机队页面核对当前机队规模与现役子型号。
2. 新增英国航空中英文名称、官网、297 架客机总数，以及空客与波音共 12 类现役机型。
3. 为每类机型配置对应的 Planespotters 当前机队图片列表链接，并验证 JSON 格式与生产构建。

## 修改具体文件

- `public/data/airplan.json`：新增英国航空基础信息、客机数量、现役机型和图片参考链接。
- `taskRecord.md`：追加本次英国航空数据补充记录。

## 日期

2026-07-22

## 任务目的

统一英国航空与维兹航空的机型参考链接规则。

## 完成过程

1. 对比英国航空与维兹航空现有机型链接的路径结构。
2. 将英国航空 12 类机型链接由当前机队清单改为对应的 Planespotters 机型图片列表。
3. 检查所有英国航空机型链接均使用 `/photos/fleet/British-Airways/` 路径，并验证 JSON 格式。

## 修改具体文件

- `public/data/airplan.json`：统一英国航空机型链接为 Planespotters 图片列表链接。
- `taskRecord.md`：追加本次机型链接规则统一记录。

## 日期

2026-07-22

## 任务目的

根据 Planespotters 更新新加坡航空机队数据，并统一机型参考链接规则。

## 完成过程

1. 核对 Planespotters 新加坡航空页面于 2026-07-13 更新的机队规模与现役子型号。
2. 将新加坡航空机队数量更新为 163 架，并按站点命名规范调整波音 777F 的机型名称。
3. 参考英国航空条目，将 6 类现役机型的链接统一替换为 Planespotters 对应机型图片列表链接。
4. 验证 JSON 格式、机型链接规则及生产构建。

## 修改具体文件

- `public/data/airplan.json`：更新新加坡航空机队数量、机型名称及 Planespotters 图片列表链接。
- `taskRecord.md`：追加本次新加坡航空数据更新记录。

## 日期

2026-07-22

## 任务目的

替换新加坡航空波音 777F 的参考链接。

## 完成过程

1. 将新加坡航空 `B777F` 的链接替换为指定的 Planespotters 单张照片页面。
2. 按用户要求未运行构建或额外校验。

## 修改具体文件

- `public/data/airplan.json`：替换新加坡航空 `B777F` 的参考链接。
- `taskRecord.md`：追加本次链接替换记录。

## 日期

2026-07-24

## 任务目的

根据 Planespotters 更新日本航空机队数据，并统一机型参考链接格式。

## 完成过程

1. 核对 Planespotters 于 2026-07-14 更新的 Japan Airlines 机队规模与现役机型。
2. 将日本航空机队数量由 234 架更新为 150 架。
3. 按 Japan Airlines 页面口径移除 JAL 集团其他航司的 `A321-200`、ATR、DHC-8 和 Embraer 机型。
4. 将 `B767-300ER` 调整为来源使用的 `B767-300`，保留页面列出的 7 个现役机型。
5. 参照英国航空条目，将全部机型链接统一改为 Planespotters 对应机型图片列表链接。
6. 验证 JSON 格式、日本航空机型数据及链接格式。

## 修改具体文件

- `public/data/airplan.json`：更新日本航空机队数量、现役机型及 Planespotters 图片列表链接。
- `taskRecord.md`：追加本次日本航空数据更新记录。

## 日期

2026-07-24

## 任务目的

根据 Planespotters 更新新西兰航空机队数据，并统一机型参考链接格式。

## 完成过程

1. 核对 Planespotters 于 2026-07-15 更新的 Air New Zealand 机队规模与现役机型。
2. 确认当前机队规模仍为 115 架，现役机型集合无增减。
3. 将 `A320ceo` 调整为来源使用的 `A320-200`，将 `Q300` 调整为 `DHC-8-300`。
4. 参照英国航空条目，将 7 个机型链接统一改为 Planespotters 对应机型图片列表链接。
5. 验证 JSON 格式、新西兰航空机型数据及链接格式。

## 修改具体文件

- `public/data/airplan.json`：更新新西兰航空机型命名及 Planespotters 图片列表链接。
- `taskRecord.md`：追加本次新西兰航空数据更新记录。

## 日期

2026-07-24

## 任务目的

为全部航司数据增加航空联盟字段，并按指定成员名单标注所属联盟。

## 完成过程

1. 核对 `public/data/airplan.json` 中的 109 家航司及其中英文名称。
2. 为每个航司对象新增 `airlineAlliance` 字段，默认值设为 `null`。
3. 按用户提供的成员名单，将文件内匹配到的航司标记为 `Star Alliance`、`SkyTeam` 或 `oneworld`。
4. 按用户说明将 LATAM 保持为 `null`，未列入名单的航司同样保持为 `null`。
5. 验证 JSON 格式、字段覆盖数量、联盟成员映射及文件格式。

## 修改具体文件

- `public/data/airplan.json`：为 109 家航司新增并填写 `airlineAlliance` 字段。
- `taskRecord.md`：追加本次航空联盟字段更新记录。

## 日期

2026-07-24

## 任务目的

补充航空联盟名单中尚未收录的航司及其当前机队数据。

## 完成过程

1. 对照现有 109 家航司与用户提供的三大联盟成员名单，确认缺失 30 家航司。
2. 通过 Planespotters 航司页面及公开索引核对各航司当前机队规模和现役具体机型。
3. 新增星空联盟航司 13 家、天合联盟航司 10 家、寰宇一家航司 7 家。
4. 为新增航司填写官网、联盟、机队数量和按制造商分组的现役机型。
5. 参照英国航空条目，将机型链接统一为 Planespotters 对应航司的机型照片列表链接。
6. 验证 JSON 格式、航司唯一性、联盟映射、新增条目字段及链接格式。
7. 运行 `pnpm run build`，确认生产构建成功；现有照片预览下载超时后按项目逻辑回退原图。

## 修改具体文件

- `public/data/airplan.json`：新增 30 家联盟航司及其 Planespotters 当前机队数据。
- `taskRecord.md`：追加本次联盟航司数据补充记录。

## 日期

2026-07-23

## 任务目的

根据 Planespotters 更新阿联酋航空机队数据，并统一机型参考链接规则。

## 完成过程

1. 核对 Planespotters 的 Emirates 最新机队规模与现役子型号。
2. 将阿联酋航空机队数量更新为 286 架，并补充波音 777F 机型。
3. 将 5 类现役机型的链接统一替换为 Planespotters 对应机型图片列表链接。
4. 验证 JSON 格式及阿联酋航空机型数据内容。

## 修改具体文件

- `public/data/airplan.json`：更新阿联酋航空机队数量、现役机型及 Planespotters 图片列表链接。
- `taskRecord.md`：追加本次阿联酋航空数据更新记录。

## 日期

2026-07-23

## 任务目的

替换阿联酋航空波音 777-200LR 的参考链接。

## 完成过程

1. 将阿联酋航空 `B777-200LR` 的链接替换为指定的 Planespotters 单张照片页面。
2. 未运行完整构建。

## 修改具体文件

- `public/data/airplan.json`：替换阿联酋航空 `B777-200LR` 的参考链接。
- `taskRecord.md`：追加本次链接替换记录。

## 日期

2026-07-23

## 任务目的

在首页 Top Airline 机队排行中同时展示航司中文名与英文名。

## 完成过程

1. 确认首页航司排行数据已包含中文名与英文名字段。
2. 将排行展示名称调整为“中文名 英文名”的组合格式。
3. 按用户要求未运行构建或页面测试。

## 修改具体文件

- `src/pages/home/index.tsx`：调整 Top Airline 排行标签，中文名在前、英文名在后。
- `taskRecord.md`：追加本次航司中英文名展示调整记录。

## 日期

2026-07-23

## 任务目的

优化首页 Top Airline 排行的中英文航司名称层级。

## 完成过程

1. 将航司排行的中文名与英文名拆分为主标签和辅助标签。
2. 复用航司列表英文名样式，使英文名以更小字号跟随中文名展示。
3. 补充排行名称的基线对齐和长文本省略处理。
4. 按用户要求未运行构建或页面测试。

## 修改具体文件

- `src/pages/home/index.tsx`：为排行数据增加英文辅助名称，并拆分渲染中英文航司名。
- `src/pages/home/index.css`：增加排行名称横向层级和英文名溢出样式。
- `taskRecord.md`：追加本次排行名称样式优化记录。

## 日期

2026-07-23

## 任务目的

根据 Planespotters 更新阿提哈德航空机队数据，并统一机型参考链接规则。

## 完成过程

1. 核对 Planespotters 于 2026-07-14 更新的 Etihad Airways 机队规模与现役机型。
2. 将阿提哈德航空机队数量由 115 架更新为 126 架。
3. 补充 `A320neo` 与 `A321neo` 两类现役机型。
4. 参照英国航空条目，将 9 类机型链接统一改为 Planespotters 对应机型图片列表链接。
5. 验证 JSON 格式及阿提哈德航空机型数据内容。

## 修改具体文件

- `public/data/airplan.json`：更新阿提哈德航空机队数量、现役机型及 Planespotters 图片列表链接。
- `taskRecord.md`：追加本次阿提哈德航空数据更新记录。

## 日期

2026-07-24

## 任务目的

根据 Planespotters 更新全日空机队数据，并统一机型参考链接格式。

## 完成过程

1. 核对 Planespotters 于 2026-07-14 更新的 All Nippon Airways 机队规模与现役机型。
2. 将全日空机队数量由 267 架更新为 244 架。
3. 移除已非现役机型的 `A320-200` 和未作为当前独立机型列出的 `A321neoLR`，补充 `B777-300ER` 与 `B777F`。
4. 参照英国航空条目，将全部现役机型链接统一改为 Planespotters 对应机型图片列表链接。
5. 验证 JSON 格式、全日空机型数据及链接格式。

## 修改具体文件

- `public/data/airplan.json`：更新全日空机队数量、现役机型及 Planespotters 图片列表链接。
- `taskRecord.md`：追加本次全日空数据更新记录。

## 日期

2026-07-24

## 任务目的

将全日空 `B777F` 的参考链接替换为指定的 ANA Cargo 单机页面。

## 完成过程

1. 定位全日空机型数据中的 `B777F` 条目。
2. 将链接替换为 Planespotters 的 `JA771F` ANA Cargo 单机页面。
3. 验证 JSON 格式及本次文件差异。

## 修改具体文件

- `public/data/airplan.json`：替换全日空 `B777F` 的参考链接。
- `taskRecord.md`：追加本次链接替换记录。

## 日期

2026-07-24

## 任务目的

在航司卡片中展示航空联盟信息，并为机队目录新增联盟筛选。

## 完成过程

1. 扩展首页机队数据类型，将 `airlineAlliance` 传入航司展示结构。
2. 在航司卡片元数据行展示联盟名称，未加入联盟的航司显示 `-`。
3. 在筛选工具栏新增联盟下拉框，支持全部联盟、三大航空联盟及无联盟筛选。
4. 将联盟条件接入现有航司、制造商、机型和排序组合筛选逻辑。
5. 调整桌面端筛选栏网格，容纳新增控件并保留移动端单列布局。

## 修改具体文件

- `src/pages/home/type.d.ts`：补充联盟数据与筛选值类型。
- `src/pages/home/constant.ts`：新增联盟选项及筛选常量。
- `src/pages/home/index.tsx`：实现联盟展示和筛选交互。
- `src/pages/home/index.css`：调整筛选工具栏五列布局。
- `taskRecord.md`：追加本次界面更新记录。

## 日期

2026-07-25

## 任务目的

将首页与站长飞行日志页面截图中的 section title 统一替换为中文。

## 完成过程

1. 将首页主标题 `Aircraft Log` 替换为“飞机日志”。
2. 将首页统计区的 `Statistics / Fleet Intelligence` 替换为“数据统计 / 机队概览”。
3. 将站长飞行日志页的 `Flight Log` 和 `Recent Spotting` 替换为“飞行日志”和“最近航程”。
4. 将机场区域及其加载骨架的 `Airport Check-ins` 同步替换为“机场足迹”。
5. 将首页统计区三个子面板的标题及标题说明替换为中文，并同步中文化首页概览的无障碍标签。
6. 按用户要求仅完成文案修改，未运行构建测试。

## 修改具体文件

- `src/pages/home/index.tsx`：中文化首页和统计区标题。
- `src/pages/personal/index.tsx`：中文化飞行日志页及最近航程标题。
- `src/pages/personal/sections/PersonalAirportSection.tsx`：中文化机场区域标题。
- `src/pages/personal/sections/PersonalAirportSectionSkeleton.tsx`：同步中文化机场区域加载标题。
- `taskRecord.md`：追加本次文案调整记录。

## 日期

2026-07-25

## 任务目的

依据 Apple Design 原则重新设计首页航司卡片 UI，提升信息层级、可读性与响应式体验。

## 完成过程

1. 将航司卡片重组为航司身份、机队概览和制造商机型列表三层结构。
2. 将客机、制造商、机型和联盟信息改为语义化数据区，提升扫描效率并为联盟提供独立层级。
3. 将大面积品牌色条收敛为航司识别标和低强度环境色，保留品牌辨识度并减少视觉干扰。
4. 调整制造商分组、机型芯片、官网链接的间距、边界和即时交互反馈。
5. 新增中等宽度与移动端布局，并适配减少动态、减少透明度和增强对比度偏好。
6. 同步更新航司卡片加载骨架，使加载前后的结构保持一致。
7. 在本地页面检查 1280px 桌面端与 390px 移动端布局，卡片内容完整且页面无横向溢出。
8. 沿用用户此前要求，未运行构建测试。

## 修改具体文件

- `src/pages/home/index.tsx`：重构航司卡片头部和机队概览结构。
- `src/pages/home/index.css`：重新设计航司卡片视觉、交互及响应式样式。
- `src/pages/home/FleetResultsSkeleton.tsx`：同步更新航司卡片加载骨架。
- `taskRecord.md`：追加本次航司卡片 UI 重设计记录。

## 日期

2026-07-25

## 任务目的

依据 Apple Design 原则重新设计首页飞机日志总览区域 UI。

## 完成过程

1. 移除原有网格、航线与雷达圆等高噪声装饰，建立更安静的档案总览空间。
2. 将四张独立统计卡合并为一个共享材质面板，通过内部边界表达数据关系，避免卡片嵌套。
3. 调整标题、说明和操作入口的层级，并将统计标签、说明与按钮文案统一为中文。
4. 为两个入口保留即时按压反馈、清晰焦点状态和减少动态偏好回退。
5. 将 Hero 调整为页面内开放式内容带，仅保留底部分隔，使其与外层页面结构保持一致。
6. 补充 900px 中等宽度和 390px 移动端布局，并适配减少透明度与增强对比度偏好。
7. 在本地页面检查 1280px 桌面端与 390px 移动端，页面无横向溢出，并修正移动端统计面板的 2px 边框盒模型偏差。
8. 沿用用户此前要求，未运行构建测试。

## 修改具体文件

- `src/pages/home/index.tsx`：更新总览指标与操作入口文案。
- `src/pages/home/index.css`：重新设计 Hero、共享统计面板、交互及响应式样式。
- `taskRecord.md`：追加本次首页总览区域 UI 重设计记录。

## 日期

2026-07-25

## 任务目的

依据 Apple Design 原则重新设计首页机队概览数据统计区域。

## 完成过程

1. 将客机、制造商和照片总量从斜杠文本改为语义化三项摘要，强化数字对齐和信息层级。
2. 将航司排行、机型排行与最近航程合并到同一个材质面板，通过内部边界分区，移除三张并列浮动卡片。
3. 为两个排行增加稳定序号列，并统一名称、数值和进度条的对齐轴。
4. 将最近航程改为日期列与航程内容列，使用行分隔替代装饰性竖向时间线。
5. 保留“查看更多”链接的即时按压和焦点反馈，并补充减少动态、减少透明度及增强对比度回退。
6. 新增宽屏三栏、中等宽度双栏加跨行时间线、移动端单列的响应式映射。
7. 在本地页面检查 1280px、820px 与 390px 布局，页面无横向溢出，各模块按预期换行。
8. 沿用用户此前要求，未运行构建测试。

## 修改具体文件

- `src/pages/home/index.tsx`：将机队总量改为语义化摘要结构。
- `src/pages/home/index.css`：重新设计统一数据面板、排行、最近航程和响应式布局。
- `taskRecord.md`：追加本次机队概览 UI 重设计记录。

## 日期

2026-07-25

## 任务目的

依据 Apple Design 原则重新设计全局 Select 组件 UI。

## 完成过程

1. 保留现有键盘操作、ARIA listbox 语义与 Portal 弹层逻辑，仅调整组件视觉和交互反馈。
2. 移除触发器右侧生硬的分隔区域，将箭头整理为独立、克制的状态反馈区。
3. 重新设置触发器的圆角、间距、层次阴影以及悬停、聚焦、按压状态，使交互更轻盈且保持清晰焦点。
4. 将下拉菜单调整为半透明材质弹层，统一选项高度、圆角、选中标记和高亮反馈。
5. 补充减少动态效果、减少透明度和高对比度系统偏好的适配。
6. 在浏览器中验证下拉展开、Star Alliance 选中状态及弹层对齐。
7. 在 390px 宽度下验证四个 Select 均为 44px 高且页面无横向溢出。
8. 按用户要求未执行构建测试。

## 修改具体文件

- `src/components/Select/index.css`：重构 Select 触发器、箭头、弹层和选项的完整视觉与交互状态。
- `taskRecord.md`：追加本次 Select 组件 UI 重设计记录。

## 日期

2026-07-25

## 任务目的

依据 PlaneSpotters 国航页面更新中国国际航空现役机队数据，并统一机型链接格式。

## 完成过程

1. 核对英国航空数据使用的 PlaneSpotters Fleet Photos 分类链接格式。
2. 读取 Air China Fleet Details and History 页面，确认页面于 2026-07-24 更新，当前机队总数为 534 架。
3. 从页面 Fleet Photos 区域提取 18 个现役机型及其分类链接。
4. 将国航所有机型链接统一替换为 `/photos/fleet/Air-China/...` 格式。
5. 移除 `A321NX`、`B747-8I` 等重复别名，并按页面名称合并 COMAC 机型数据。
6. 校验 JSON 格式、国航机型数量及文件差异。

## 修改具体文件

- `public/data/airplan.json`：更新中国国际航空机队总数、现役机型及 PlaneSpotters 分类链接。
- `taskRecord.md`：追加本次中国国际航空数据更新记录。

## 日期

2026-07-25

## 任务目的

依据 PlaneSpotters 东航页面更新中国东方航空现役机队数据，并统一机型链接格式。

## 完成过程

1. 读取 China Eastern Airlines Fleet Details and History 页面，确认页面于 2026-07-24 更新，当前机队总数为 679 架。
2. 从页面 Fleet Photos 现役部分提取 15 个机型及其分类链接。
3. 将东航所有机型链接统一替换为 `/photos/fleet/China-Eastern-Airlines/...` 格式。
4. 移除 `A321NX`、`B737-8` 等重复别名，并按页面名称统一 COMAC 机型数据。
5. 校验 JSON 格式、东航机型数量及文件差异。

## 修改具体文件

- `public/data/airplan.json`：更新中国东方航空机队总数、现役机型及 PlaneSpotters 分类链接。
- `taskRecord.md`：追加本次中国东方航空数据更新记录。

## 日期

2026-07-25

## 任务目的

依据 PlaneSpotters 南航页面更新中国南方航空现役机队数据，并统一机型链接格式。

## 完成过程

1. 读取 China Southern Airlines Fleet Details and History 页面，确认页面于 2026-07-23 更新，当前机队总数为 688 架。
2. 从页面 Fleet Photos 现役部分提取 14 个机型及其分类链接，并通过 Fleet Matrix 核对机型状态。
3. 将南航所有现役机型链接统一替换为 `/photos/fleet/China-Southern-Airlines/...` 格式。
4. 移除 `A321NX` 等重复别名，以及 A319-100、A330-200、B737-700、B787-8、E190 等历史机型。
5. 将货机名称统一为 `B777F`，并按页面名称统一 COMAC 机型数据。
6. 校验 JSON 格式、南航机型数量及文件差异。

## 修改具体文件

- `public/data/airplan.json`：更新中国南方航空机队总数、现役机型及 PlaneSpotters 分类链接。
- `taskRecord.md`：追加本次中国南方航空数据更新记录。

## 日期

2026-07-25

## 任务目的

依据 PlaneSpotters 海南航空页面更新现役机队数据，并统一机型链接格式。

## 完成过程

1. 读取 Hainan Airlines Fleet Details and History 页面，确认页面于 2026-07-23 更新，当前机队总数为 230 架。
2. 从页面 Fleet Photos 现役部分提取 9 个机型及其分类链接。
3. 核对现役机型与当前文件一致，将全部链接统一替换为 `/photos/fleet/Hainan-Airlines/...` 格式。
4. 校验 JSON 格式、海南航空机型数量及文件差异。

## 修改具体文件

- `public/data/airplan.json`：更新海南航空机队总数及 PlaneSpotters 现役机型分类链接。
- `taskRecord.md`：追加本次海南航空数据更新记录。

## 日期

2026-07-25

## 任务目的

将西南航空现役机型链接统一为英国航空使用的 PlaneSpotters Fleet Photos 格式。

## 完成过程

1. 核对 Southwest Airlines 当前机队页面和 Fleet Photos 分类。
2. 确认现役机型仍为 B737-700、B737-800 与 B737 MAX 8；未来交付的 B737 MAX 7 不计入当前机型。
3. 将三个现役机型链接从 `/fleet/list/.../current?type=...` 替换为 `/photos/fleet/Southwest-Airlines/...` 格式。
4. 按用户要求仅调整机型链接，不修改机队数量。
5. 校验 JSON 格式及文件差异。

## 修改具体文件

- `public/data/airplan.json`：更新西南航空三个现役机型的 PlaneSpotters 分类链接。
- `taskRecord.md`：追加本次西南航空机型链接调整记录。
