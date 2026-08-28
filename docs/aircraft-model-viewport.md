# 飞机模型 WebGPU 视窗技术方案

## 背景

`/plane-render` 页面需要在同一个画布中检查项目模型目录里的飞机模型。模型由 `modelAssets.ts` 提供资源描述，页面只将当前选中的一项传给 `AircraftModelViewport`，视窗负责 WebGPU 初始化、GLB 加载、相机交互、显示参数调整和资源释放。

当前实现基于 Three.js `WebGPURenderer`，不提供 WebGL 自动回退。浏览器不支持 WebGPU、渲染器初始化失败或模型加载失败时，组件通过进度回调把可读错误交给页面展示。

## 目标与边界

### 目标

- 每次只在场景中加载一架当前选中的 GLB 模型。
- 使用 WebGPU 渲染并保持模型在不同尺寸下具有可比较的视图尺度。
- 提供轨道旋转、滚轮/双指缩放、全屏查看和飞行姿态调整。
- 允许在不重新加载模型的情况下调整输出画质、阴影、展示平面和主光源位置。
- 在切换模型或卸载组件时释放 Three.js 对象和 GPU 资源。
- 对空目录、WebGPU 不可用、初始化失败和模型加载失败提供状态反馈。

### 非目标

- 不在视窗中同时渲染模型目录的全部模型。
- 不修改 GLB 文件内容或模型自身的材质纹理数据。
- 不在浏览器端转换 legacy glTF 1.0/GLB v1；FR24 模型应先通过转换脚本生成 GLB v2。
- 不在本组件内实现模型搜索、目录排序或路由切换。

## 文件职责

| 文件 | 职责 |
| --- | --- |
| `src/pages/planeRender/AircraftModelViewport.tsx` | WebGPU 渲染器、Three.js 场景、模型加载、相机/姿态交互、全屏和清理逻辑 |
| `src/pages/planeRender/components/RenderControls.tsx` | 渲染控制面板的表单结构与控件范围，不直接操作 Three.js 对象 |
| `src/pages/planeRender/modelAssets.ts` | 通过构建期 glob 生成模型资源清单及 `loadUrl()` 加载函数 |
| `src/pages/planeRender/index.tsx` | 选择单个模型、消费加载进度并展示目录和页面级状态 |
| `src/pages/planeRender/index.css` | 画布、工具面板、全屏、加载遮罩、响应式布局和减少动态效果样式 |
| `scripts/convert-fr24-models.mjs` | 将 FR24 legacy GLB v1 转换为可供本视窗加载的 GLB v2 |

## 组件接口

组件对外接收两个属性：

```ts
interface AircraftModelViewportProps {
    /** 当前需要加载并渲染的单个 GLB 模型资源。 */
    asset: AircraftModelAsset | undefined;
    /** 向页面报告 WebGPU 初始化和模型加载进度。 */
    onLoadingProgressChange: (
        progress: AircraftModelLoadingProgress,
    ) => void;
    /** 页面级完整视窗元素，全屏时应包含画布、状态和元信息。 */
    fullscreenTargetRef: RefObject<HTMLElement | null>;
    /** 当前模型重试序号，变化时强制重新初始化渲染器和资源请求。 */
    retryToken: number;
}
```

加载阶段及其含义：

| `phase` | 含义 | `loadedModelCount` | `failedModelCount` |
| --- | --- | ---: | ---: |
| `initializing` | 页面已开始准备 WebGPU 视窗 | 0 | 0 |
| `loading` | 渲染器已就绪，正在加载当前 GLB | 0 | 0 |
| `ready` | 当前模型已加入场景并完成相机聚焦 | 1 | 0 |
| `error` | 没有资源、WebGPU 初始化失败或模型解析失败 | 0 | 0 或 1 |

`message` 只在错误或需要补充原因时提供。组件通过 `publishProgress` 忽略卸载后的异步回调，避免页面已销毁后继续写入状态。

`rendererStatus` 区分 `initializing`、`webgpu`、`unavailable` 和 `lost`；`loadingStage` 区分 renderer、downloading 和 parsing。下载事件能提供总字节时回传 `progressRatio`，否则页面展示不定量状态。

## 运行时流程

```mermaid
flowchart TD
    A[页面选择 asset] --> B[useEffect 初始化视窗]
    B --> C{asset 是否存在}
    C -- 否 --> E[报告空目录错误]
    C -- 是 --> D{navigator 提供 WebGPU}
    D -- 否 --> F[报告 WebGPU 不可用]
    D -- 是 --> G[创建 WebGPURenderer]
    G --> H[await renderer.init]
    H -- 失败 --> I[释放 renderer 并报告错误]
    H -- 成功 --> J[创建 scene/camera/controls/lights/floor]
    J --> K[挂载 canvas 与 ResizeObserver]
    K --> L[按需 requestAnimationFrame: controls.update + render]
    L --> M[GLTFLoader.loadAsync(asset.loadUrl())]
    M -- 失败 --> N[报告当前模型加载失败]
    M -- 成功 --> O[归一化尺寸、应用姿态、聚焦相机]
    O --> P[报告 ready]
    P --> Q[asset 变化或组件卸载]
    Q --> R[取消 RAF、断开可见性观察器、dispose 场景和 renderer]
```

## WebGPU 初始化

1. 先检查 `"gpu" in navigator`。该写法同时满足运行时能力检测和 TypeScript 环境中没有 `Navigator.gpu` 声明的情况。
2. 创建 `new WebGPURenderer({ alpha: true, antialias: true })`，随后 `await renderer.init()`。初始化是异步边界，失败时销毁已创建的 renderer 并回传 `error`。
3. 设置 `renderer.outputColorSpace = THREE.SRGBColorSpace`，保证 GLB 中的颜色纹理按 sRGB 输出。
4. 通过 `applyRenderSettings` 写入色调映射、曝光、像素倍率和阴影设置。
5. 将 renderer 的 canvas 添加到视窗容器，并设置 `aria-hidden="true"`。三维画布本身不是信息阅读入口，状态和控制由外围语义 HTML 提供。

Three.js 的 `WebGPURenderer.init()` 必须在首次渲染前完成。当前视窗使用按需 `requestAnimationFrame`：每帧先调用 `OrbitControls.update()` 处理阻尼，再渲染场景；没有控制器变化时不继续排队下一帧。页面隐藏或视窗离开可视区域时取消待执行帧。

## 场景结构

```text
THREE.Scene
├── Texture (RoomEnvironment PMREM)            # PBR 环境反射
├── HemisphereLight                         # 环境填充
├── DirectionalLight (keyLight)              # 主光源，可调 X/Y/Z，投射阴影
├── DirectionalLight (fillLight)             # 固定的冷色补光
├── Mesh (displayFloor, optional visible)    # 展示平面，默认隐藏
└── Group (aircraftAttitudePivot)            # 姿态旋转枢轴
    └── Object3D (normalizedModel)           # 当前唯一模型，几何中心归一化到原点
        └── Mesh / material / texture         # GLB 内部资源
```

默认关键参数：

- 主方向光位置为 `(7, 10, 8)`，强度为 `3.2`。
- 补光位置为 `(-9, 4, -5)`，强度为 `1.2`。
- 半球光强度为 `2.1`。
- 展示平面尺寸为 `24 x 10`，旋转到水平面，默认 `visible = false`。
- 模型网格统一设置 `castShadow = true` 和 `receiveShadow = true`。

## 模型加载与归一化

模型加载使用 `GLTFLoader.loadAsync(await asset.loadUrl())`，因此 `AircraftModelAsset` 可以延迟生成构建资源 URL。当前 effect 只接收一个 `asset`，不会对整个资源清单执行并发加载。

加载成功后按以下顺序处理：

1. 使用 `Box3.setFromObject` 获取源包围盒。
2. 取 X/Y/Z 最大尺寸，将模型缩放到最大维度 `1.35`。
3. 重新计算包围盒，将模型三轴几何中心移到原点，作为姿态枢轴的稳定旋转中心。
4. 将模型放入 `aircraftAttitudePivot`，只对 pivot 应用当前姿态设置，避免模型资源根节点同时承担归一化和姿态变换。
5. 按归一化模型底部定位展示平面；非平飞姿态下展示平面仅作为空间参考。
6. 将模型加入场景，并按包围球与当前视口 FOV 计算适配距离。

相机使用 `PerspectiveCamera(36, 1, 0.1, 100)`。适配距离按包围球和水平/垂直 FOV 计算并保留边距；窗口变化时由 `ResizeObserver` 更新 aspect 和绘制缓冲区。

## 相机与画布交互

`OrbitControls` 绑定到 renderer canvas：

| 配置 | 当前值 | 目的 |
| --- | ---: | --- |
| `enableDamping` | `true` | 让旋转停止更自然 |
| `dampingFactor` | `0.065` | 控制阻尼衰减速度 |
| `minDistance` | `0.45` | 允许近距离检查纹理和机身细节 |
| `maxDistance` | `80` | 防止缩放到不可见范围 |
| `minPolarAngle` | `0.08` | 避免相机贴近极点时翻转 |
| `maxPolarAngle` | `π - 0.08` | 允许检查模型底部，同时保留极点安全边距 |
| `zoomSpeed` | `1.15` | 提高滚轮和双指缩放响应 |
| `zoomToCursor` | `true` | 以光标位置为缩放关注点 |

画布通过 CSS `touch-action: none` 将触摸手势交给 Three.js；工具面板和页面 viewport 保留默认触摸行为。工具层提供 `自定义视角`、`适配视图`、`正面`、`侧面`、`顶部` 和 `底部` 菜单，手动轨道操作后视角状态标记为自定义。画布左下角观察 HUD 显示世界 X/Y/Z 轴投影及相对 `controls.target` 的方位角、俯仰角和距离；它是只读状态层，不拦截 canvas 指针事件。

## 渲染控制面板

`RenderControls` 只负责表单和事件回调，父组件维护 `AircraftRenderSettings`，再通过 effect 将设置同步到已初始化的 Three.js 对象。

| 设置 | 范围/选项 | 应用位置 |
| --- | --- | --- |
| 画质预设 | 性能优先、均衡、质量优先、自定义 | 同步像素倍率和阴影参数 |
| 照明预设 | 中性检查、轮廓检查、顶部检查、自定义 | 同步主光源方向和强度 |
| 右侧 KEY LIGHT HUD | 拖拽方位/仰角 + 强度滑条 | 同步主方向光方向和强度 |
| 色调映射 | ACES、AgX、Neutral、关闭 | `renderer.toneMapping` |
| 曝光 | `0.5..2`，步长 `0.05` | `renderer.toneMappingExposure` |
| 渲染倍率 | `0.5..3`，步长 `0.25`，默认不超过设备 `2x` | `renderer.setPixelRatio` |
| 主光源 X/Y/Z | `-20..20`，步长 `0.5` | `keyLight.position` |
| 主光强度 | `0..6`，步长 `0.1` | `keyLight.intensity` |
| 实时阴影 | 开/关，默认开启 | `renderer.shadowMap.enabled` |
| 阴影算法 | PCF、VSM，默认 VSM | `renderer.shadowMap.type` |
| 展示平面 | 开/关，默认关闭 | `displayFloor.visible` |

设置变化不会重新创建 renderer 或重新加载 GLB。质量预设覆盖像素倍率和阴影参数；照明预设覆盖主光方向和强度；任一高级参数手动修改后标记为自定义。右侧 KEY LIGHT HUD 用球面坐标映射主方向光，横向拖拽调整方位、纵向拖拽调整仰角，同时显示 X/Y/Z 坐标并提供 Z 轴独立滑条；半球中心到光点的方向线用于强化当前受光方向。像素倍率变更会结合当前容器尺寸重新分配绘制缓冲区；光源和展示平面则直接修改现有对象。

## 飞行姿态控制

姿态状态以角度保存，写入 `aircraftAttitudePivot` 时统一转换为弧度，并使用 `YXZ` 顺序表达偏航、俯仰、滚转：

```ts
aircraftAttitudePivot.rotation.set(
    pitch * Math.PI / 180,
    yaw * Math.PI / 180,
    roll * Math.PI / 180,
    "YXZ",
);
```

支持四个预设：

| 预设 | 俯仰 | 滚转 | 偏航 |
| --- | ---: | ---: | ---: |
| 平飞 | 0° | 0° | 0° |
| 起飞 | +10° | 0° | 0° |
| 下降 | -8° | 0° | 0° |
| 落地 | +3° | 0° | 0° |

自定义控制范围为俯仰 `-60..60°`、滚转 `-180..180°`、偏航 `-180..180°`。中心区域拖拽调整俯仰/偏航，外圈横向拖拽调整滚转；方向键可逐度调整，按住 Shift 时步长为 5°。每次手动调整都会把预设标记为 `custom`。

姿态 gizmo 保留指针直接操控；俯仰、滚转、偏航另提供三个独立的原生 range，分别拥有单值范围和可读名称，避免一个 slider 同时表达两个角度。模型真实姿态和面板中的 SVG 示意图使用同一组状态，避免控制反馈与渲染结果脱节。

## 全屏查看

全屏目标是包含画布、工具、加载状态和模型元信息的 `.plane-render__viewport`，而不是单独的 canvas 或内部画布容器：

1. 点击按钮时调用 `requestFullscreen()`；再次点击或按 Esc 时调用 `document.exitFullscreen()`。
2. 监听 `fullscreenchange`，以浏览器实际状态同步 `isFullscreen`，覆盖 Esc 和系统级退出。
3. 请求被拒绝或浏览器不支持时，将错误写入 `fullscreenError`，使用 `role="alert"` 告知用户。
4. 全屏容器使用 `100vw` / `100dvh`，保留工具层、加载遮罩、canvas、状态和 caption；`::backdrop` 提供页面外背景。
5. 进入和退出全屏时将焦点放在可见的全屏按钮上，避免键盘用户失去当前位置。

## 加载、空状态与错误

页面根据进度回调显示状态标题和说明：

- `initializing`：正在初始化 WebGPU。
- `loading`：正在载入当前选中的模型，并可进一步区分下载和 GLB 解析阶段。
- `ready`：当前模型已加入场景并完成相机聚焦。
- `error`：显示具体失败原因，包括空目录、WebGPU 不可用、renderer 初始化失败、当前模型加载失败和设备丢失。
- `lost`：WebGPU 设备运行中丢失，显示可重试当前模型的错误状态。

加载期间页面给 viewport 设置 `aria-busy="true"`，CSS 在 canvas 上显示半透明状态和遮罩动画；工具按钮仍保持独立层级。失败状态提供当前模型重试入口。页面隐藏或视窗离开可视区域时暂停按需绘制；减少动态效果偏好下，旋转动画退化为静态指示。

## 生命周期与资源释放

模型切换会让初始化 effect 重新执行。清理函数按以下顺序释放资源：

1. 断开 `ResizeObserver`。
2. 取消待执行的 requestAnimationFrame，并断开页面可见性和 `IntersectionObserver` 监听。
3. `OrbitControls.dispose()` 解除 canvas 事件监听。
4. 遍历当前场景，移除模型和展示平面引用，并释放网格几何、`MeshStandardMaterial` 常见贴图和材质对象。
5. 调用 `renderer.dispose()`，移除 renderer 生成的 canvas。
6. 清空 renderer、camera、controls、模型 pivot、展示平面和 key light 引用，防止后续设置 effect 访问旧对象。

异步加载通过 `isDisposed` 标记进行竞态保护：组件卸载或模型切换后，晚到的 GLB 结果会立即释放，且不会再次发布进度。

## 响应式布局

页面容器使用 `height: 90vh` 和 `min-height: 0`，工作区通过 flex/grid 将视窗与目录分栏。窄屏时目录移到视窗下方，工具条允许换行，控制面板相对于完整工具层定位并限制可视高度；移动端交互目标不小于 44px；全屏状态下 viewport 改为 `100vw` / `100dvh`。新增或调整视窗高度时，必须同时检查：

- canvas 是否仍覆盖容器且没有因父级高度塌陷变成 0。
- 工具面板、状态提示和全屏按钮是否互相遮挡。
- 目录滚动区是否保留独立滚动，不把页面整体撑出横向滚动。
- 640px 以下设备上的姿态面板和控制面板是否能在可视区域内操作。

## 性能与扩展点

- 单模型加载避免了目录级并发请求和多场景 GPU 占用。
- 渲染倍率有 `3x` 上限，默认不超过设备 `2x`；质量预设可快速在性能、均衡和质量之间切换。
- `ResizeObserver` 只在容器尺寸变化时更新投影和缓冲区，不依赖全局 window resize。
- 渲染帧在模型加载、控制器变化、设置变化、尺寸变化和可见性恢复时按需请求，静止状态不持续占用帧循环。
- 使用 `RoomEnvironment` 和 WebGPU `PMREMGenerator` 为 PBR 材质提供本地环境反射；深浅主题通过 CSS token 和 `MutationObserver` 同步地面与灯光颜色。
- 若 GLB 提供动画，使用 `AnimationMixer` 驱动单段动画的播放、暂停和时间轴，动画播放期间由按需帧调度持续请求绘制。
- 后续可增加模型加载缓存，但必须以资源 URL 为 key，并在缓存淘汰时复用同一套 dispose 逻辑。
- 若未来支持 WebGL 回退，应把 renderer 创建抽成后端适配层，并在进度状态中明确当前后端，不能静默改变画质路径。
- PNG 与设置 JSON 导出均从当前 canvas/状态生成，下载完成后释放 Blob URL；无动画模型不渲染动画控件。

## 常见问题排查

| 现象 | 可能原因 | 检查方式 |
| --- | --- | --- |
| 视窗显示“WebGPU 不可用” | 浏览器/设备未暴露 `navigator.gpu` | 检查浏览器版本、GPU 开关和安全上下文 |
| 目录有文件但模型加载失败 | 仍指向 legacy GLB v1，或资源 URL 不存在 | 检查 `modelAssets.ts` 的 glob、网络请求和转换产物 |
| 切换模型后旧模型仍占显存 | effect 清理未执行或新增资源未纳入 dispose | 检查 cleanup、`disposeSceneResources` 和引用 ref |
| 画布全屏后尺寸不正确 | 容器尺寸变化未触发 ResizeObserver | 检查全屏 CSS 和 `resizeRenderer` 是否重新设置 aspect/size |
| 模型过亮、过暗或两侧明暗差异大 | 色调映射、曝光、主光源位置或模型法线/材质本身 | 先恢复默认渲染设置，再分别调整曝光和 X/Y/Z 光源 |
| 高倍率下卡顿 | 像素倍率过高、模型纹理过大或设备 GPU 能力有限 | 临时降至 `1x`，再逐项打开阴影和展示平面 |
| 姿态面板读数变化但模型不动 | 模型尚未加载，或 `aircraftModelRef` 已被清理 | 检查姿态 effect 执行时机和当前模型引用 |

## 验收方案

本次只整理技术文档，按用户约定不运行构建、类型检查、开发服务器或浏览器测试。实际验收建议由项目维护者执行：

1. 在支持 WebGPU 的浏览器中打开 `/plane-render`，确认默认只出现第一架模型。
2. 切换目录项，确认旧 canvas/模型被清理，新模型完成归一化和自动聚焦。
3. 验证拖拽旋转、滚轮/双指缩放、全屏进入/退出和 Esc 退出。
4. 调整色调映射、曝光、渲染倍率、阴影、展示平面及三轴光源，确认无需重新加载模型即可生效。
5. 打开姿态面板，验证预设、指针拖拽、方向键、Shift 加速和读数同步。
6. 在不支持 WebGPU、空目录、转换产物缺失和单文件损坏场景下确认页面显示可读错误。
7. 在桌面、窄屏和全屏尺寸下检查画布高度、目录滚动和工具面板遮挡情况。

## 相关资料

- [Three.js WebGPURenderer](https://threejs.org/docs/#api/en/renderers/WebGPURenderer)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [Three.js OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)
- [FR24 模型转换技术方案](./fr24-model-conversion.md)
- [模型渲染页面源码](../src/pages/planeRender/index.tsx)
