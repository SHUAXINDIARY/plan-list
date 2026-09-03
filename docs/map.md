# 世界地图组件（`src/components/map`）

可复用的 **机场打卡 + 航迹示意** 地图 SDK。基于 Canvas 绘制 Natural Earth 风格底图，支持深浅色主题、国内/国际双线型、标记点悬停与键盘聚焦。

当前唯一业务接入页：个人记录 `/personal`（`src/pages/personal/index.tsx`）。

---

## 目录结构

| 文件                        | 职责                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `index.tsx`                 | 默认导出 `AnnotatedWorldMap` React 组件；交互、主题、图例、无障碍                      |
| `type.d.ts`                 | 对外类型：`MapCoordinate`、`WorldMapMarker`、`WorldMapRoute`、`AnnotatedWorldMapProps` |
| `canvasMap.ts`              | 坐标投影、Canvas 绘制、离屏缓存、命中检测等纯函数（可单独复用）                        |
| `index.css`                 | 地图容器、图例、tooltip 布局；颜色引用全站 `--pl-map-*` token                          |
| `map.svg` / `map-light.svg` | 深色 / 亮色底图（viewBox `1200×650`）                                                  |

---

## 快速开始

```tsx
import AnnotatedWorldMap from "../../components/map";
import type { WorldMapMarker, WorldMapRoute } from "../../components/map";

const markers: WorldMapMarker[] = [
    {
        id: "北京首都国际机场",
        name: "北京首都国际机场",
        coordinate: { lat: 40.079856, lng: 116.603112 },
        scope: "domestic",
        description: "中国北京市北京首都国际机场",
        flag: "🇨🇳",
    },
];

const routes: WorldMapRoute[] = [
    {
        name: "首都至东京（成田）",
        start: { lat: 40.079856, lng: 116.603112 },
        end: { lat: 35.771986, lng: 140.39285 },
        scope: "international",
    },
];

<AnnotatedWorldMap ariaLabel="机场打卡足迹示意图" markers={markers} routes={routes} />;
```

组件会自动引入 `./index.css`，并监听 `document.documentElement[data-theme]` 切换 `map.svg` / `map-light.svg`。

---

## 组件 API：`AnnotatedWorldMap`

### Props

| 属性                             | 类型               | 必填 | 默认值     | 说明                                        |
| -------------------------------- | ------------------ | ---- | ---------- | ------------------------------------------- |
| `markers`                        | `WorldMapMarker[]` | 是   | —          | 地图上的机场/兴趣点                         |
| `routes`                         | `WorldMapRoute[]`  | 否   | `[]`       | 航迹弧线列表                                |
| `ariaLabel`                      | `string`           | 是   | —          | 区域无障碍名称；会拼入 canvas `aria-label`  |
| `domesticMarkerLegendLabel`      | `string`           | 否   | `国内机场` | 图例：国内标记                              |
| `internationalMarkerLegendLabel` | `string`           | 否   | `境外机场` | 图例：境外标记                              |
| `domesticRouteLegendLabel`       | `string`           | 否   | `国内航迹` | 图例：国内航线                              |
| `internationalRouteLegendLabel`  | `string`           | 否   | `国际航迹` | 图例：国际航线                              |
| `markerLegendLabel`              | `string`           | 否   | —          | **已废弃**，会同时覆盖国内/境外机场图例文案 |
| `routeLegendLabel`               | `string`           | 否   | —          | **已废弃**，会同时覆盖国内/国际航迹图例文案 |

图例项按数据是否存在自动显隐（例如仅有国内航迹时不显示「国际航迹」）。

### 导出类型

```ts
import type {
    AnnotatedWorldMapProps,
    MapCoordinate,
    MapRouteScope,
    WorldMapMarker,
    WorldMapRoute,
} from "../../components/map";
```

---

## 数据模型

### `MapRouteScope`

```ts
type MapRouteScope = "domestic" | "international";
```

| 值              | 语义                  | 画布线型           | 标记样式            |
| --------------- | --------------------- | ------------------ | ------------------- |
| `domestic`      | 中国大陆境内航段/机场 | 实线、较低饱和冷青 | 较深填充 + 细描边   |
| `international` | 跨境或境外航段/机场   | 虚线、accent 冷青  | 较亮填充 + 略粗描边 |

标记与航迹应使用 **同一套 `scope` 规则**，图例与画布才能一致。

### `WorldMapMarker`

| 字段          | 类型            | 必填 | 说明                               |
| ------------- | --------------- | ---- | ---------------------------------- |
| `id`          | `string`        | 是   | 唯一 ID，命中检测与 React 列表 key |
| `name`        | `string`        | 是   | 展示名；悬停 tooltip 文案          |
| `coordinate`  | `MapCoordinate` | 是   | `lat` / `lng`（WGS84）             |
| `scope`       | `MapRouteScope` | 是   | 国内 / 境外，决定圆点配色          |
| `description` | `string`        | 否   | 拼入聚焦时的 `aria-label`          |
| `flag`        | `string`        | 否   | 悬停时跟随指针的 emoji（如 `🇨🇳`）  |

### `WorldMapRoute`

| 字段    | 类型            | 必填 | 说明                           |
| ------- | --------------- | ---- | ------------------------------ |
| `name`  | `string`        | 是   | 航段名称（建议唯一，兼作 key） |
| `start` | `MapCoordinate` | 是   | 弧线起点                       |
| `end`   | `MapCoordinate` | 是   | 弧线终点                       |
| `scope` | `MapRouteScope` | 是   | 国内 / 国际，决定线型与颜色    |

航迹为 **有向** 线段（`start` → `end`），画布上用二次贝塞尔弧线连接，弧顶偏向北侧。

---

## 业务侧数据准备（个人页范例）

机场原始数据在 `src/constants/external-links.ts` 的 `CHECKED_AIRPORTS`；个人页在 `src/pages/personal/constant.ts` 中转换：

1. **`airportMapMarkers`**：由 `CHECKED_AIRPORTS` 映射为 `WorldMapMarker[]`
    - `scope`：`description` 国家前缀为 `中国` → `domestic`，否则 `international`
    - `flag`：按国家名从 `AIRPORT_COUNTRY_FLAG_BY_NAME` 取值

2. **`MAP_ROUTES`**：通过 `createMapRoute(label, startAirport, endAirport, scope)` 构造
    - 经纬度经 `coordinateOfCheckedAirport` 与机场表同源，避免手写坐标漂移
    - 北京：国际线首都、国内线大兴；曼谷/东京按实际起降场区分（见 `constant.ts` 顶部注释）

页面用法：

```tsx
<AnnotatedWorldMap ariaLabel="机场打卡足迹示意图" markers={airportMapMarkers} routes={MAP_ROUTES} />
```

新增航程时：在 `CHECKED_AIRPORTS` 补机场（若尚未打卡）→ 在 `MAP_ROUTES` 追加 `createMapRoute(...)` 并标明 `scope`。

---

## 交互与无障碍

| 操作     | 行为                                                                   |
| -------- | ---------------------------------------------------------------------- |
| **滚轮** | 以指针位置为中心缩放（约 `1.18×` 步进，范围 `1`–`5`）                  |
| **拖拽** | 仅当缩放 `> 1` 时可平移底图                                            |
| **悬停** | 显示机场名 tooltip；若提供 `flag` 则在 `document.body` portal 国旗光标 |
| **键盘** | Canvas 可聚焦；`↑/←` 与 `↓/→` 在标记点间循环聚焦                       |
| **主题** | 跟随 `html[data-theme="light"                                          | 默认深色]` 自动换底图并重绘 |

Canvas `aria-label` 会随当前聚焦/悬停标记动态补充说明。

---

## 视觉与主题 Token

颜色集中在 `src/App.css` 的 `--pl-map-*`，遵循 Night Flight Archive 冷青 accent（见 `DESIGN.md` §2.4）。地图样式文件只引用变量，不写死两套色值。

| Token                                                      | 用途           |
| ---------------------------------------------------------- | -------------- |
| `--pl-map-bg` / `--pl-map-border` / `--pl-map-vignette`    | 容器背景与暗角 |
| `--pl-map-route-domestic` / `--pl-map-route-international` | 航迹描边       |
| `--pl-map-marker-domestic-fill` 等                         | 国内机场圆点   |
| `--pl-map-marker-international-fill` 等                    | 境外机场圆点   |
| `--pl-map-legend-*` / `--pl-map-tooltip-*`                 | 图例与 tooltip |

调整地图观感时优先改 `App.css` 中上述变量；`index.css` 负责布局与图例几何（实线 / 虚线、圆点尺寸）。

---

## 底层模块：`canvasMap.ts`（可选）

面向自定义渲染或测试，可从 `canvasMap` 直接导入：

| 导出                                              | 说明                                         |
| ------------------------------------------------- | -------------------------------------------- |
| `projectMapCoordinate`                            | 经纬度 → 地图内部坐标（与 SVG viewBox 对齐） |
| `mapCoordinateToScreen` / `screenToMapCoordinate` | 地图坐标 ↔ 屏幕 CSS 像素（含视口平移缩放）   |
| `readMapCanvasPalette`                            | 从 DOM 容器读取 `--pl-map-*` 解析结果        |
| `paintMapBaseLayer`                               | 绘制底图 + 航迹（可写入离屏 canvas）         |
| `paintMapMarkers`                                 | 屏幕坐标下绘制标记（半径不随缩放变化）       |
| `paintAnnotatedWorldMap`                          | 组合绘制入口                                 |
| `buildMapLayerCache` / `blitMapLayerCache`        | 放大拖拽时的离屏缓存                         |
| `hitTestMarkerAtScreen`                           | 指针命中最近标记                             |
| `WORLD_MAP_WIDTH` / `WORLD_MAP_HEIGHT`            | 与 `map.svg` viewBox 一致：`1200×650`        |

常量如 `MIN_MAP_SCALE`、`MAX_MAP_SCALE`、`MARKER_RADIUS` 等同文件导出。

---

## 实现要点

- **坐标系**：经度 `[-180,180]`、纬度 `[-90,90]` 线性映射到绘图区（margin `42px`）。
- **性能**：高 DPR 超采样 + 像素面积上限；拖拽期降低 DPR 与缓存 blit，标记每帧轻绘。
- **绘制顺序**：航迹先国内后国际；标记在航迹之上。
- **依赖**：需在已挂载全站 `App.css`（`--pl-*`）的页面中使用；主题切换依赖 `utils/themePreference` 与顶栏 `ThemeToggle`。

---

## 扩展与约束

- **适合**：静态或构建期确定的机场/航迹展示，打卡足迹、旅行示意。
- **不适合**：实时航班追踪、大量动态聚合点（当前为全量 Canvas 重绘 + 逐点命中）。
- **底图**：替换 `map.svg` / `map-light.svg` 时需保持 viewBox `1200×650`，或同步修改 `WORLD_MAP_*` 常量。
- **不要**在组件目录外重复定义 `--pl-map-route-*` / `--pl-map-marker-*`，以免与全站主题脱节。
