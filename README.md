# Plane List

**Night Flight Archive**，面向航空爱好者的航司机型资料库与个人乘坐记录工具。界面以夜航档案为基调，强调快速查阅、筛选、记录和回顾。

项目仓库：[https://github.com/SHUAXINDIARY/plane-list](https://github.com/SHUAXINDIARY/plane-list)

联系作者：[shuaxinjs@qq.com](mailto:shuaxinjs@qq.com)

## 功能概览

- **机型资料库**：按航司浏览机队、制造商、机型与参考来源，并支持组合筛选。
- **个人记录**：查看乘机过的机型、航班记录、机场足迹、航线和地图可视化。
- **飞机照片**：浏览个人飞机照片目录，支持筛选和全屏预览。
- **参考资料**：集中索引航司官网、机场、数据库、百科和其他航空来源。
- **模型渲染**：使用 Three.js WebGPU 单架加载 GLB 模型，支持全屏、缩放、姿态、光源、色调映射和阴影控制。

首页机队数据来自 `public/data/airplan.json`，静态数据由前端按需读取。

## 页面路由

| 路径 | 页面 |
| --- | --- |
| `/` | 机型资料库 |
| `/personal` | 飞行日志 |
| `/photos` | 飞机照片 |
| `/references` | 参考资料 |
| `/plane-render` | 模型渲染 |

## 模型资源

模型页会在构建期扫描以下目录中的 `.glb` 文件，并按模型直接所属目录分组展示：

- `fr24-3d-models-glbv2/models/`：由 FR24 legacy GLB v1 转换得到的 glTF 2.0 模型。
- `sketchfab/`：项目本地维护的 Sketchfab 模型，包含其下级目录。
- `upload_oss_glb/`：超过 25 MiB 的 Sketchfab 模型转移后的目录，通过 OSS 公共地址加载。

生产构建开始前，体积超过 25 MiB 的 `sketchfab/` 模型会移动到 `upload_oss_glb/`，同时生成模型资源清单。此类模型使用 `https://img.shuaxinjs.cn/glb/<文件名>` 作为加载地址。

原始 FR24 模型位于 `fr24-3d-models/models/`，其 GLB v1 不能直接由当前 `GLTFLoader` 加载。转换脚本会将结果写入 `fr24-3d-models-glbv2/models/`，并复制源仓库许可证。各模型的许可证和署名要求以对应目录中的说明为准。

转换 FR24 模型：

```bash
pnpm install
node scripts/convert-fr24-models.mjs
```

模型渲染需要浏览器和设备支持 WebGPU。

## 技术栈

- [React](https://react.dev) 19、[React Router](https://reactrouter.com) 7
- TypeScript、[Three.js](https://threejs.org) 0.185、[Rsbuild](https://rsbuild.rs)
- [Rspack](https://rspack.rs) 静态资源处理

产品与体验约定见 [`PRODUCT.md`](./PRODUCT.md)、[`DESIGN.md`](./DESIGN.md)；项目开发规范见 [`AGENTS.md`](./AGENTS.md)。

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm run dev
```

开发环境通常使用 [http://localhost:3000](http://localhost:3000)。

生产构建：

```bash
pnpm run build
```

TypeScript 检查：

```bash
pnpm run type-check
```

本地预览产物：

```bash
pnpm run preview
```

同步所有 Git 子模块：

```bash
pnpm run updateGitDep
```

## 延伸阅读

- [Rsbuild 文档](https://rsbuild.rs)
- [Rspack 文档](https://rspack.rs)
- [Three.js 文档](https://threejs.org/docs)
- [FR24 模型转换技术方案](./docs/fr24-model-conversion.md)
- [飞机模型 WebGPU 视窗技术方案](./docs/aircraft-model-viewport.md)
