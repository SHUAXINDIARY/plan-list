# AircraftModelViewport HDRI 灯光与摄像机投影技术实现

## 1. 文档范围

本文说明 `/plane-render` 中飞机模型视窗的 HDRI 环境、三点灯光以及摄像机投影模式实现。实现基于 Three.js `WebGPURenderer`，模型仍由 `GLTFLoader` 单模型加载链路提供。

目标如下：

- 通过项目根目录 `hdri/*.hdr` 的构建期清单选择 HDRI 环境。
- 使用 `HDRLoader + PMREMGenerator` 为 PBR 材质提供环境反射和漫反射。
- 提供 key、fill、rim 三点灯光，并允许实时调整主光位置及三盏灯的强度。
- 支持 `PerspectiveCamera` 和 `OrthographicCamera` 两种投影模式。
- 切换环境、灯光或投影模式时不重新加载 GLB 模型。
- 在模型切换、组件卸载和异步请求过期时释放 GPU 资源。

当前实现不负责 HDRI 编辑、曝光合成、WebGL 回退或运行时上传文件。HDRI 文件由仓库维护，并在构建期成为静态资源。

## 2. 模块拆分

```text
src/pages/planeRender/
├── AircraftModelViewport.tsx       # 场景生命周期、相机切换、模型加载和按需渲染
├── lighting.ts                     # HDRI/PMREM 与三点灯光的无 UI 运行时模块
├── hdriAssets.ts                   # hdri/*.hdr 构建期资源目录
├── components/RenderControls.tsx   # 环境、灯光、输出参数表单
├── index.css                       # 工具栏、控制面板和响应式样式
└── modelAssets.ts                  # GLB 模型目录和懒加载资源

hdri/
└── *.hdr                           # 项目维护的 RGBE HDR 环境文件
```

| 模块 | 主要职责 | 不应承担的职责 |
| --- | --- | --- |
| `hdriAssets.ts` | 扫描 HDR 文件、生成稳定 ID、导出构建后 URL | 创建 Three.js 纹理、管理场景状态 |
| `lighting.ts` | 创建/同步三点灯光，生成/加载/释放 PMREM | React state、DOM 事件、控件文案 |
| `AircraftModelViewport.tsx` | 创建 renderer、scene、camera、controls，连接模型和资源生命周期 | 维护 HDR 文件列表的扫描规则 |
| `RenderControls.tsx` | 渲染 `<select>`、range、switch 和回调接口 | 直接访问 Three.js 对象 |
| `rsbuild.config.ts` | 将 `.hdr` 声明为源资源 | 运行时选择或加载 HDRI |

## 3. 核心数据契约

### 3.1 HDRI 资源目录

`hdriAssets.ts` 使用字面量 glob 扫描 `../../../hdri/*.hdr`，并设置 `eager: true` 与 `import: "default"`，得到构建后的 URL：

```ts
const hdriModules: Record<string, string> = import.meta.glob<string>(
    "../../../hdri/*.hdr",
    {
        eager: true,
        import: "default",
    },
);
```

每个资源导出为：

```ts
interface AircraftHdriAsset {
    id: string;
    label: string;
    sourcePath: string;
    url: string;
}
```

`.DS_Store` 和其他非 `.hdr` 文件不会匹配 glob，因此不会出现在控件中。当前仓库中的 `hdri/brown_photostudio_02_4k.hdr` 会自动成为一个选择项。

`rsbuild.config.ts` 必须包含：

```ts
source: {
    assetsInclude: /\.(geojson|glb|hdr)$/,
}
```

这样构建器会把 HDR 文件复制为静态资产，并让 glob 的 default import 返回可请求 URL，而不是把 HDR 内容内嵌进 JavaScript bundle。

### 3.2 渲染设置

`AircraftRenderSettings` 仍由 `RenderControls.tsx` 定义，新增字段与现有输出参数一起由父组件维护：

| 字段 | 类型/范围 | 用途 |
| --- | --- | --- |
| `environmentPreset` | `room \| hdri` | 内置 RoomEnvironment 或 HDRI PMREM |
| `hdriUrl` | `string` | 当前 select 选中的构建后 URL |
| `environmentIntensity` | `0..2` | 写入 `scene.environmentIntensity` |
| `keyLightIntensity` | `0..6` | 主方向光强度 |
| `fillLightIntensity` | `0..4` | 补光强度 |
| `rimLightIntensity` | `0..4` | 轮廓光强度 |
| `lightPositionX/Y/Z` | `-20..20` | 主方向光位置 |

环境设置和灯光设置都通过 React state 到 Three.js 对象的单向同步 effect 写入，不会触发模型 effect 重新执行。

## 4. HDRI 环境实现

### 4.1 初始化与默认回退

场景初始化时创建一个 `PMREMGenerator`，并通过 `createRoomEnvironmentResources()` 创建内置环境：

```ts
const environmentGenerator = new PMREMGenerator(renderer);
const environmentResources = createRoomEnvironmentResources(
    environmentGenerator,
);

scene.environment = environmentResources.roomRenderTarget.texture;
scene.environmentIntensity = renderSettings.environmentIntensity;
```

RoomEnvironment 是稳定回退源，默认使用它可以避免页面初次进入时依赖网络 HDR 文件。

### 4.2 HDRLoader 与 PMREM

选择 HDRI 后，`AircraftModelViewport` 调用 `loadHdriEnvironment()`：

1. 使用 `HDRLoader.loadAsync(url)` 解析 RGBE HDR 文件。
2. 将纹理设置为 `THREE.EquirectangularReflectionMapping`。
3. 调用 `PMREMGenerator.fromEquirectangular()` 生成 PBR 可用的预过滤环境。
4. 立即释放原始 equirectangular HDR 纹理，只保留 PMREM render target。
5. 将 PMREM 的 texture 写入 `scene.environment`。

伪代码如下：

```ts
const hdrTexture = await new HDRLoader().loadAsync(url);
hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

try {
    return pmremGenerator.fromEquirectangular(hdrTexture);
} finally {
    hdrTexture.dispose();
}
```

`renderer.outputColorSpace` 设置为 `THREE.SRGBColorSpace`。HDR 环境本身由 loader 以线性 HDR 数据提供，不应额外把 HDR 纹理标记为 sRGB。

### 4.3 选择生效与竞态保护

控制面板中的 HDRI `<select>` 只使用 `AIRCRAFT_HDRI_ASSETS` 的 URL，不接受自由文本 URL：

- `environmentPreset` 选择 `hdri` 时，如果尚未选择资源，自动选中第一项。
- select 变化后直接启动异步加载。
- 每次加载递增 `environmentRequestToken`。
- 异步结果返回时比较 token、组件销毁状态以及当前 `environmentPreset/hdriUrl`。
- 过期结果只释放自己的 PMREM，不替换当前环境。

选择空项或加载失败时恢复 RoomEnvironment，并在控制面板显示回退提示。当前 HDRI PMREM 在替换前调用 `disposeHdriEnvironment()`，保证场景中最多保留一份活动 HDRI PMREM。

## 5. 三点灯光实现

### 5.1 灯光 rig

`createAircraftLightingRig()` 返回四个对象：

| 对象 | 类型 | 默认位置 | 默认强度 | 阴影 |
| --- | --- | --- | ---: | --- |
| `hemisphereLight` | `HemisphereLight` | Three.js 默认 | `2.1` | 否 |
| `keyLight` | `DirectionalLight` | `(7, 10, 8)` | `3.2` | 是 |
| `fillLight` | `DirectionalLight` | `(-9, 4, -5)` | `1.2` | 否 |
| `rimLight` | `DirectionalLight` | `(7, 5, -10)` | `0` | 否 |

只有 key light 投射实时阴影，避免 fill/rim 产生不必要的阴影贴图开销和多重阴影污染。三盏方向光的 target 保持在场景原点，模型归一化后无需重新计算 target。

### 5.2 预设与实时同步

`LIGHTING_PRESET_VALUES` 保留原有 `neutral`、`silhouette`、`top`，并新增 `three-point`：

| 预设 | key | fill | rim | 适用场景 |
| --- | ---: | ---: | ---: | --- |
| neutral | 3.2 | 1.2 | 0 | 保持原有中性检查画面 |
| silhouette | 3.8 | 0.65 | 1.8 | 强化轮廓和背光分离 |
| top | 3.0 | 1.0 | 0.9 | 检查机身顶部结构 |
| three-point | 3.2 | 1.25 | 2.1 | 标准摄影棚三点灯光 |

主光位置和三盏灯强度变化只修改已有对象：

```ts
rig.keyLight.position.set(x, y, z);
rig.keyLight.intensity = keyLightIntensity;
rig.fillLight.intensity = fillLightIntensity;
rig.rimLight.intensity = rimLightIntensity;
```

### 5.3 主题同步

深浅主题通过 CSS token 控制灯光颜色：

- `--pl-model-key-light-color`
- `--pl-model-fill-light-color`
- `--pl-model-rim-light-color`

`MutationObserver` 监听 `html[data-theme]`，主题变化时更新地面、key、fill、rim 颜色，并请求一帧按需渲染。

## 6. 摄像机投影模式

### 6.1 模式定义

```ts
type AircraftProjectionMode = "perspective" | "orthographic";
type AircraftCamera =
    | THREE.PerspectiveCamera
    | THREE.OrthographicCamera;
```

工具栏 select 显示：

- `Perspective 透视`：使用 `PerspectiveCamera(36, aspect, 0.1, 100)`，近大远小。
- `Orthographic 正交`：使用 `OrthographicCamera(left, right, top, bottom, 0.1, 100)`，物体尺寸不随距离变化。

### 6.2 正交视锥与缩放

正交相机使用固定基础视锥高度 `2.4`：

```text
halfHeight = 2.4 / 2
halfWidth  = halfHeight * aspect
left       = -halfWidth
right      = halfWidth
top        = halfHeight
bottom     = -halfHeight
```

模型 fit 时根据模型包围球直径和视锥可用尺寸计算 zoom：

```text
fitZoom = min(
    availableWidth / (modelDiameter * CAMERA_FIT_MARGIN),
    availableHeight / (modelDiameter * CAMERA_FIT_MARGIN),
)
zoom = clamp(fitZoom, 0.25, 8)
```

因此正交相机的“远近”只影响观察轨道和 HUD 距离，不影响物体屏幕尺寸；实际放大缩小由 `OrbitControls.zoom` 完成。

### 6.3 投影切换流程

`applyProjectionMode()` 不销毁 renderer，也不重新加载 GLB，步骤如下：

1. 读取当前 camera、controls position、up 和 target。
2. 根据新模式创建 camera，并使用容器当前 aspect 初始化视锥。
3. 复制旧 camera 的 position 和 up，先 `lookAt(previousControls.target)`。
4. 切换到正交模式时按模型包围球更新 fit zoom。
5. 从正交切回透视时按 FOV 重新计算合适距离，但保留原观察方向。
6. 创建新的 `OrbitControls<AircraftCamera>`，复制 target 和全部交互约束。
7. 移除旧 controls 的 change 监听并调用 `dispose()`。
8. 更新 `cameraRef`、`orbitControlsRef`，调用 `updateCameraHud()` 和按需渲染。

Controls 泛型必须显式统一：

```ts
let controls: OrbitControls<AircraftCamera> =
    new OrbitControls<AircraftCamera>(camera, renderer.domElement);
```

这可以避免 `OrbitControls<Camera>` 与 `OrbitControls<AircraftCamera>` 重新赋值时的 TypeScript 不兼容错误。

### 6.4 标准视角与 resize

`getCameraFitDistance()` 接受两种 camera：

- 透视模式按垂直/水平 FOV 取较小值，计算 camera distance。
- 正交模式更新 `zoom`，返回用于轨道旋转的稳定距离。

`ResizeObserver` 触发时：

- 透视模式更新 `camera.aspect`。
- 正交模式按新 aspect 重算 left/right，保持基础视锥高度不变。
- 两种模式都调用 `camera.updateProjectionMatrix()` 和 `renderer.setSize()`。

## 7. 按需渲染与生命周期

视窗不使用永久帧循环。以下事件会调用 `requestRender()`：

- OrbitControls change
- 相机投影切换
- HDRI PMREM 加载完成或回退
- 灯光、环境强度、曝光和画质设置变化
- 模型加载完成并完成相机 fit
- ResizeObserver 尺寸变化

每帧执行 `controls.update()`、动画 mixer 更新和 `renderer.render(scene, camera)`。当没有阻尼、动画或用户操作时，不继续排队下一帧。

清理顺序：

1. 断开 ResizeObserver、IntersectionObserver、MutationObserver 和 visibility 监听。
2. 取消待执行的 requestAnimationFrame。
3. 移除 controls change 监听并销毁当前 controls。
4. 停止 AnimationMixer，释放模型几何、材质和贴图。
5. 释放活动 HDRI PMREM、RoomEnvironment PMREM 和 PMREMGenerator。
6. 调用 `renderer.dispose()` 并移除 canvas。
7. 清空 camera、scene、controls、灯光 rig 和环境 apply refs。

异步 HDRI 和 GLB 加载都使用 `isDisposed` 以及资源 token 防止卸载后的结果写入已销毁场景。

## 8. 错误和回退策略

| 场景 | 行为 |
| --- | --- |
| `hdri/` 没有 `.hdr` | select 显示目录为空并禁用，环境保持 RoomEnvironment |
| HDRI 未选择资源 | 选择 HDRI 模式时回退内置环境并提示选择资源 |
| HDRLoader 失败 | 释放旧 HDRI，恢复 RoomEnvironment，保留当前模型 |
| HDRI 请求过期 | 丢弃并释放过期 PMREM，不改变当前环境 |
| WebGPU 不可用 | 沿用现有 WebGPU 错误状态，不静默回退 WebGL |
| 正交相机 fit 异常 | 使用 `zoom` 最小/最大边界，避免模型完全不可见或无限放大 |

## 9. 性能约束

- HDR 文件通过静态资源 URL 加载，不进入 JS bundle。
- 同一时间只保留一份活动 HDRI PMREM。
- 原始 HDR 纹理在 PMREM 生成后立即 dispose。
- fill/rim 不投射阴影，阴影只由 key light 驱动。
- 投影切换不重新加载 GLB，只替换 camera 和 controls。
- 默认按需渲染，页面隐藏或视窗离开可视区域时暂停。
- HDR 文件建议使用 1K 左右等距柱状图，避免 4K 以上资源在移动设备上产生过高显存和加载成本。

## 10. 开发验收清单

在支持 WebGPU 的浏览器中打开 `/plane-render` 后检查：

1. 渲染控制中的环境来源切换为 HDRI，select 能列出 `hdri/*.hdr` 文件。
2. 选择 `brown_photostudio_02_4k` 后，模型反射和整体受光发生变化。
3. 快速切换 HDRI 或切回内置工作室，最终画面不被过期请求覆盖。
4. 选择“三点灯光”，确认轮廓光出现；调节补光/轮廓光强度无需重新加载模型。
5. 在 Perspective 与 Orthographic 间切换，观察目标和轨道方向保持连续。
6. 正交模式下滚轮缩放改变 `zoom`，相机距离变化不会造成近大远小。
7. 使用适配、正面、侧面、顶部、底部视角，确认两种投影都能 fit 模型。
8. 调整浏览器窗口或进入全屏，确认两种相机的投影矩阵和 canvas 尺寸同步。
9. 切换深浅主题，确认地面、key、fill、rim 灯光颜色同步。
10. 切换模型或卸载页面后，确认旧 canvas、模型和 HDRI 资源不再残留。

## 11. 后续扩展

- 在 `hdriAssets.ts` 增加名称、作者、版权和推荐强度等元数据，不改变 `url` 字段契约。
- 在 `lighting.ts` 增加 EXR loader 或压缩 HDR 格式适配，保持 `AircraftModelViewport` 不直接依赖具体文件格式。
- 将三点灯光的位置也抽为配置字段时，优先扩展 `AircraftLightingSettings`，不要把对象引用传入 `RenderControls`。
- 如果未来支持 WebGL 回退，应将 renderer 创建和 PMREM 生成抽为后端适配层，并在状态中明确当前后端。
