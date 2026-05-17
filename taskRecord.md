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
