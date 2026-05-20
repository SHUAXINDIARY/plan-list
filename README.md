# Plane List

**Night Flight Archive** —— 面向航空爱好者的航司机型资料库与个人乘坐记录站点：界面偏深色「夜航档案」气质，兼顾快速查阅与回看自己的飞行足迹。

## 功能概览

- **机型资料库**：按航司浏览客机构成、机型与参考来源；支持与页面内一致的筛选。
- **个人记录**：乘机过的机型清单、可视化地图与航线、机场打卡等个人向内容聚合展示。

数据来源与映射见仓库内 `public/data/airplan.json`（静态 JSON，构建后由前端按需读取）。

## 技术栈

- [React](https://react.dev) 19、[React Router](https://reactrouter.com) 7  
- TypeScript、[Rsbuild](https://rsbuild.rs)  

更多本地命令说明见 [`AGENTS.md`](./AGENTS.md)；产品与体验基调见 [`PRODUCT.md`](./PRODUCT.md)、[`DESIGN.md`](./DESIGN.md)。

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发服务器（默认打开浏览器）：

```bash
pnpm run dev
```

应用在开发环境下通常为 [http://localhost:3000](http://localhost:3000)。

生产构建：

```bash
pnpm run build
```

本地预览产物：

```bash
pnpm run preview
```

## 延伸阅读

- [Rsbuild 文档](https://rsbuild.rs)
- [Rsbuild GitHub](https://github.com/web-infra-dev/rsbuild)
