import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type ReactElement,
} from "react";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { AircraftModelAsset } from "./modelAssets";

/** 模型视窗当前所处的初始化或加载阶段。 */
export type AircraftModelLoadingPhase =
    | "initializing"
    | "loading"
    | "ready"
    | "error";

/** 模型目录加载进度，供页面显示可访问的状态信息。 */
export interface AircraftModelLoadingProgress {
    /** 当前渲染器或模型资源的处理阶段。 */
    phase: AircraftModelLoadingPhase;
    /** 已成功加入 Three.js 场景的模型数量。 */
    loadedModelCount: number;
    /** 无法加载的模型数量。 */
    failedModelCount: number;
    /** 初始化或全部加载失败时展示的具体原因。 */
    message?: string;
}

/** 模型视窗的输入数据和对外状态回调。 */
interface AircraftModelViewportProps {
    /** 当前需要加载并渲染的单个 GLB 模型资源。 */
    asset: AircraftModelAsset | undefined;
    /** 向页面报告 WebGPU 初始化和模型加载进度。 */
    onLoadingProgressChange: (
        progress: AircraftModelLoadingProgress,
    ) => void;
}

/** 可供模型视窗即时切换的色调映射预设。 */
type AircraftToneMapping = "aces" | "agx" | "neutral" | "none";

/** 可供模型视窗即时切换的 WebGPU 阴影算法。 */
type AircraftShadowMode = "pcf" | "vsm";

/** 模型视窗中可即时写入 WebGPU 渲染器的用户偏好。 */
interface AircraftRenderSettings {
    /** 输出画面使用的色调映射预设。 */
    toneMapping: AircraftToneMapping;
    /** 色调映射在输出前使用的曝光系数。 */
    exposure: number;
    /** 写入渲染器的物理像素倍率，影响清晰度与 GPU 负载。 */
    pixelRatio: number;
    /** 是否全局开启模型和展示平面的实时阴影。 */
    shadowsEnabled: boolean;
    /** 阴影贴图采用的 WebGPU 算法。 */
    shadowMode: AircraftShadowMode;
}

/** 归一化后单架模型的最大尺寸，确保不同机型能在同一场景对比。 */
const NORMALIZED_MODEL_MAX_SIZE = 1.35;
/** 允许近距离检查机身细节时的相机最小距离。 */
const MINIMUM_CAMERA_DISTANCE = 0.45;
/** 允许完整检查模型外形时的相机最大距离。 */
const MAXIMUM_CAMERA_DISTANCE = 80;
/** 提升滚轮和双指缩放的响应速度，便于在全屏时检查细节。 */
const MODEL_VIEWER_ZOOM_SPEED = 1.15;
/** WebGPU 不可用时的用户可见提示。 */
const WEBGPU_UNAVAILABLE_MESSAGE = "当前浏览器或设备未提供 WebGPU 支持。";
/** WebGPU 初始化失败时的用户可见提示。 */
const WEBGPU_INITIALIZATION_ERROR_MESSAGE = "WebGPU 渲染器初始化失败。";
/** 模型目录为空时的用户可见提示。 */
const EMPTY_MODEL_DIRECTORY_MESSAGE = "模型目录中没有可加载的 GLB 文件。";
/** 所有模型加载失败时的用户可见提示。 */
const ALL_MODELS_FAILED_MESSAGE = "所有模型均未能加载。";
/** 浏览器拒绝全屏请求时的用户可见提示。 */
const FULLSCREEN_REQUEST_ERROR_MESSAGE = "当前浏览器无法进入全屏查看。";
/** 渲染倍率滑块允许的最低物理像素比，适用于需要降低 GPU 负载的设备。 */
const MINIMUM_RENDER_PIXEL_RATIO = 0.5;
/** 渲染倍率滑块允许的最高物理像素比，限制高密度屏幕的 GPU 开销。 */
const MAXIMUM_RENDER_PIXEL_RATIO = 2;
/** 渲染倍率滑块的离散精度。 */
const RENDER_PIXEL_RATIO_STEP = 0.25;
/** 曝光滑块允许的最低值，避免模型细节完全压暗。 */
const MINIMUM_TONE_MAPPING_EXPOSURE = 0.5;
/** 曝光滑块允许的最高值，避免模型高光过度溢出。 */
const MAXIMUM_TONE_MAPPING_EXPOSURE = 2;
/** 曝光滑块的离散精度。 */
const TONE_MAPPING_EXPOSURE_STEP = 0.05;
/** 曝光控件的 DOM 标识，用于关联数值输出。 */
const EXPOSURE_CONTROL_ID = "plane-render-exposure";
/** 渲染倍率控件的 DOM 标识，用于关联数值输出。 */
const PIXEL_RATIO_CONTROL_ID = "plane-render-pixel-ratio";
/** 阴影开关的 DOM 标识，用于关联可读标签。 */
const SHADOWS_CONTROL_ID = "plane-render-shadows";
/** 画布内可收起渲染控制区的 DOM 标识。 */
const RENDER_CONTROLS_ID = "plane-render-controls";

/** 模型视窗保留原有画面效果时采用的渲染参数基线。 */
const DEFAULT_RENDER_SETTINGS: Omit<AircraftRenderSettings, "pixelRatio"> = {
    toneMapping: "aces",
    exposure: 1.1,
    shadowsEnabled: true,
    shadowMode: "pcf",
};

/** 将用户可读的预设名称映射至模型视窗可用的色调映射值。 */
const getToneMappingValue = (
    toneMapping: AircraftToneMapping,
): THREE.ToneMapping => {
    if (toneMapping === "agx") {
        return THREE.AgXToneMapping;
    }

    if (toneMapping === "neutral") {
        return THREE.NeutralToneMapping;
    }

    if (toneMapping === "none") {
        return THREE.NoToneMapping;
    }

    return THREE.ACESFilmicToneMapping;
};

/** 将界面中的阴影模式映射至 WebGPU 渲染器的阴影贴图类型。 */
const getShadowMapType = (
    shadowMode: AircraftShadowMode,
): THREE.ShadowMapType =>
    shadowMode === "vsm" ? THREE.VSMShadowMap : THREE.PCFShadowMap;

/** 基于当前设备像素密度建立与原始视窗一致的初始渲染设置。 */
const createDefaultRenderSettings = (): AircraftRenderSettings => ({
    ...DEFAULT_RENDER_SETTINGS,
    pixelRatio: Math.min(window.devicePixelRatio, MAXIMUM_RENDER_PIXEL_RATIO),
});

/** 校验 select 元素的字符串值是否为已支持的色调映射预设。 */
const isAircraftToneMapping = (
    value: string,
): value is AircraftToneMapping =>
    value === "aces" ||
    value === "agx" ||
    value === "neutral" ||
    value === "none";

/** 校验 select 元素的字符串值是否为已支持的 WebGPU 阴影算法。 */
const isAircraftShadowMode = (
    value: string,
): value is AircraftShadowMode => value === "pcf" || value === "vsm";

/** 将当前控制面板设置一次性写入已初始化的 WebGPU 渲染器。 */
const applyRenderSettings = (
    renderer: WebGPURenderer,
    settings: AircraftRenderSettings,
): void => {
    renderer.toneMapping = getToneMappingValue(settings.toneMapping);
    renderer.toneMappingExposure = settings.exposure;
    renderer.setPixelRatio(settings.pixelRatio);
    renderer.shadowMap.enabled = settings.shadowsEnabled;
    renderer.shadowMap.type = getShadowMapType(settings.shadowMode);
};

/** 释放 GLB 对象树中使用的网格几何、材质和常见贴图资源。 */
const disposeSceneResources = (objectRoot: THREE.Object3D): void => {
    objectRoot.traverse((object: THREE.Object3D): void => {
        if (!(object instanceof THREE.Mesh)) {
            return;
        }

        object.geometry.dispose();

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
        materials.forEach((material: THREE.Material): void => {
            if (material instanceof THREE.MeshStandardMaterial) {
                material.map?.dispose();
                material.aoMap?.dispose();
                material.emissiveMap?.dispose();
                material.metalnessMap?.dispose();
                material.normalMap?.dispose();
                material.roughnessMap?.dispose();
            }

            material.dispose();
        });
    });
};

/** 将模型归一化到统一尺寸，并让起落架或机身底部贴合展示平面。 */
const normalizeAircraftModel = (model: THREE.Object3D): void => {
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const largestDimension = Math.max(
        sourceSize.x,
        sourceSize.y,
        sourceSize.z,
    );

    if (largestDimension > 0) {
        model.scale.setScalar(NORMALIZED_MODEL_MAX_SIZE / largestDimension);
    }

    const normalizedBounds = new THREE.Box3().setFromObject(model);
    const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());

    model.position.x -= normalizedCenter.x;
    model.position.y -= normalizedBounds.min.y;
    model.position.z -= normalizedCenter.z;
    model.traverse((object: THREE.Object3D): void => {
        if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
};

/** 将相机聚焦至当前选中的单架模型，保留适合检查机身轮廓的角度。 */
const focusModel = (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    model: THREE.Object3D,
): void => {
    const bounds = new THREE.Box3().setFromObject(model);
    const modelCenter = bounds.getCenter(new THREE.Vector3());
    const modelSize = bounds.getSize(new THREE.Vector3());
    const cameraDistance = Math.max(
        Math.max(modelSize.x, modelSize.y, modelSize.z) * 4,
        4.2,
    );

    controls.target.copy(modelCenter);
    camera.position.set(
        modelCenter.x + cameraDistance * 0.8,
        modelCenter.y + cameraDistance * 0.5,
        modelCenter.z + cameraDistance,
    );
    controls.update();
};

/**
 * 使用 Three.js WebGPU 渲染器加载当前选择的单个 GLB 模型。
 */
export const AircraftModelViewport = ({
    asset,
    onLoadingProgressChange,
}: AircraftModelViewportProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<WebGPURenderer | null>(null);
    const resizeRendererRef = useRef<(() => void) | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isRenderControlsOpen, setIsRenderControlsOpen] =
        useState<boolean>(false);
    const [fullscreenError, setFullscreenError] = useState<string | null>(
        null,
    );
    const [renderSettings, setRenderSettings] =
        useState<AircraftRenderSettings>(createDefaultRenderSettings);
    const renderSettingsRef = useRef<AircraftRenderSettings>(renderSettings);

    renderSettingsRef.current = renderSettings;

    useEffect((): (() => void) => {
        /** 同步 Esc 退出及浏览器原生控件触发的全屏状态。 */
        const handleFullscreenChange = (): void => {
            setIsFullscreen(document.fullscreenElement === containerRef.current);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return (): void => {
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
        };
    }, []);

    /** 切换当前画布容器的浏览器全屏状态，并在被拒绝时保留可读反馈。 */
    const toggleFullscreen = async (): Promise<void> => {
        const container = containerRef.current;

        if (container === null) {
            return;
        }

        try {
            if (document.fullscreenElement === container) {
                await document.exitFullscreen();
            } else {
                await container.requestFullscreen();
            }

            setFullscreenError(null);
        } catch {
            setFullscreenError(FULLSCREEN_REQUEST_ERROR_MESSAGE);
        }
    };

    /** 由明确的按钮命令触发异步全屏切换。 */
    const handleFullscreenToggle = (): void => {
        void toggleFullscreen();
    };

    /** 切换画布内渲染控制面板，并保持三维模型的直接操作区域可用。 */
    const handleRenderControlsToggle = (): void => {
        setIsRenderControlsOpen((isOpen: boolean): boolean => !isOpen);
    };

    /** 仅接受已声明的色调映射值，避免 select 意外值破坏渲染器状态。 */
    const handleToneMappingChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const toneMapping = event.currentTarget.value;

        if (!isAircraftToneMapping(toneMapping)) {
            return;
        }

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                toneMapping,
            }),
        );
    };

    /** 更新色调映射曝光，并由滑块范围约束有效数值。 */
    const handleExposureChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const exposure = Number(event.currentTarget.value);

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                exposure,
            }),
        );
    };

    /** 更新 WebGPU 画布的物理像素倍率，平衡模型边缘清晰度与 GPU 负载。 */
    const handlePixelRatioChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const pixelRatio = Number(event.currentTarget.value);

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                pixelRatio,
            }),
        );
    };

    /** 切换场景级阴影，便于直接对比模型底部与地面接触效果。 */
    const handleShadowsEnabledChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const shadowsEnabled = event.currentTarget.checked;

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                shadowsEnabled,
            }),
        );
    };

    /** 仅接受已声明的阴影算法，避免向 WebGPU 渲染器写入无效配置。 */
    const handleShadowModeChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const shadowMode = event.currentTarget.value;

        if (!isAircraftShadowMode(shadowMode)) {
            return;
        }

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                shadowMode,
            }),
        );
    };

    /** 将当前视窗恢复为项目既有的 ACES、PCF 阴影和设备像素比基线。 */
    const handleRenderSettingsReset = (): void => {
        setRenderSettings(createDefaultRenderSettings());
    };

    useEffect((): void => {
        const renderer = rendererRef.current;

        if (renderer === null) {
            return;
        }

        // 更新渲染器后重新使用当前容器尺寸分配物理绘制缓冲区。
        applyRenderSettings(renderer, renderSettings);
        resizeRendererRef.current?.();
    }, [renderSettings]);

    useEffect((): (() => void) | undefined => {
        const container = containerRef.current;

        if (container === null) {
            return undefined;
        }

        let isDisposed = false;
        let cleanupRenderer: (() => void) | undefined;

        /** 在组件未卸载时将模型加载进度回传给页面。 */
        const publishProgress = (
            progress: AircraftModelLoadingProgress,
        ): void => {
            if (!isDisposed) {
                onLoadingProgressChange(progress);
            }
        };

        /** 初始化 WebGPU 场景，再加载当前选择的单个模型。 */
        const initializeViewport = async (): Promise<void> => {
            if (asset === undefined) {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    message: EMPTY_MODEL_DIRECTORY_MESSAGE,
                });
                return;
            }

            if (!("gpu" in navigator)) {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    message: WEBGPU_UNAVAILABLE_MESSAGE,
                });
                return;
            }

            const renderer = new WebGPURenderer({
                alpha: true,
                antialias: true,
            });

            try {
                await renderer.init();
            } catch {
                renderer.dispose();
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    message: WEBGPU_INITIALIZATION_ERROR_MESSAGE,
                });
                return;
            }

            if (isDisposed) {
                renderer.dispose();
                return;
            }

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
            const controls = new OrbitControls(camera, renderer.domElement);
            const gltfLoader = new GLTFLoader();

            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.domElement.className = "plane-render__canvas";
            renderer.domElement.setAttribute("aria-hidden", "true");
            container.appendChild(renderer.domElement);

            controls.enableDamping = true;
            controls.dampingFactor = 0.065;
            controls.minDistance = MINIMUM_CAMERA_DISTANCE;
            controls.maxDistance = MAXIMUM_CAMERA_DISTANCE;
            controls.maxPolarAngle = Math.PI * 0.49;
            controls.zoomSpeed = MODEL_VIEWER_ZOOM_SPEED;
            controls.zoomToCursor = true;

            scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x102737, 2.1));

            const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
            keyLight.position.set(7, 10, 8);
            keyLight.castShadow = true;
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(0x8acbe7, 1.2);
            fillLight.position.set(-9, 4, -5);
            scene.add(fillLight);

            const displayFloor = new THREE.Mesh(
                new THREE.PlaneGeometry(24, 10),
                new THREE.MeshStandardMaterial({
                    color: 0x163343,
                    roughness: 0.82,
                    metalness: 0.08,
                }),
            );
            displayFloor.rotation.x = -Math.PI / 2;
            displayFloor.position.y = -0.015;
            displayFloor.receiveShadow = true;
            scene.add(displayFloor);

            /** 根据容器实际尺寸更新相机投影和 WebGPU 画布分辨率。 */
            const resizeRenderer = (): void => {
                const { width, height } = container.getBoundingClientRect();
                const resolvedWidth = Math.max(width, 1);
                const resolvedHeight = Math.max(height, 1);

                camera.aspect = resolvedWidth / resolvedHeight;
                camera.updateProjectionMatrix();
                renderer.setPixelRatio(renderSettingsRef.current.pixelRatio);
                renderer.setSize(resolvedWidth, resolvedHeight, false);
            };

            rendererRef.current = renderer;
            resizeRendererRef.current = resizeRenderer;
            applyRenderSettings(renderer, renderSettingsRef.current);

            const resizeObserver = new ResizeObserver(resizeRenderer);
            resizeObserver.observe(container);
            resizeRenderer();

            /** 在 Three.js 动画循环中保持 OrbitControls 的阻尼交互与场景绘制。 */
            const renderFrame = (): void => {
                controls.update();
                renderer.render(scene, camera);
            };

            void renderer.setAnimationLoop(renderFrame);
            cleanupRenderer = (): void => {
                resizeObserver.disconnect();
                void renderer.setAnimationLoop(null);
                controls.dispose();
                disposeSceneResources(scene);
                renderer.dispose();
                renderer.domElement.remove();

                if (rendererRef.current === renderer) {
                    rendererRef.current = null;
                    resizeRendererRef.current = null;
                }
            };

            if (isDisposed) {
                cleanupRenderer();
                return;
            }

            publishProgress({
                phase: "loading",
                loadedModelCount: 0,
                failedModelCount: 0,
            });

            let loadedModelCount = 0;
            let failedModelCount = 0;

            try {
                const gltf = await gltfLoader.loadAsync(await asset.loadUrl());

                if (isDisposed) {
                    disposeSceneResources(gltf.scene);
                    return;
                }

                const model = gltf.scene;
                normalizeAircraftModel(model);
                scene.add(model);
                focusModel(camera, controls, model);
                loadedModelCount = 1;
            } catch {
                failedModelCount = 1;
            }

            if (isDisposed) {
                return;
            }

            publishProgress({
                phase: loadedModelCount > 0 ? "ready" : "error",
                loadedModelCount,
                failedModelCount,
                message:
                    loadedModelCount > 0
                        ? undefined
                        : ALL_MODELS_FAILED_MESSAGE,
            });
        };

        void initializeViewport();

        return (): void => {
            isDisposed = true;
            cleanupRenderer?.();
        };
    }, [asset, onLoadingProgressChange]);

    return (
        <div ref={containerRef} className="plane-render__viewport-canvas">
            <div className="plane-render__render-controls">
                <button
                    className="plane-render__render-controls-toggle"
                    type="button"
                    aria-controls={RENDER_CONTROLS_ID}
                    aria-expanded={isRenderControlsOpen}
                    onClick={handleRenderControlsToggle}
                >
                    {isRenderControlsOpen ? "收起控制" : "渲染控制"}
                </button>
                {isRenderControlsOpen ? (
                    <aside
                        id={RENDER_CONTROLS_ID}
                        className="plane-render__render-controls-panel"
                        aria-label="WebGPU 渲染控制"
                    >
                        <div className="plane-render__render-controls-heading">
                            <p>WebGPU Output</p>
                            <h2>渲染控制</h2>
                        </div>
                        <div className="plane-render__render-fields">
                            <label className="plane-render__render-field">
                                <span>色调映射</span>
                                <select
                                    value={renderSettings.toneMapping}
                                    onChange={handleToneMappingChange}
                                >
                                    <option value="aces">ACES Filmic</option>
                                    <option value="agx">AgX</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="none">关闭</option>
                                </select>
                            </label>
                            <label className="plane-render__render-field plane-render__render-field--range">
                                <span>
                                    曝光
                                    <output htmlFor={EXPOSURE_CONTROL_ID}>
                                        {renderSettings.exposure.toFixed(2)}
                                    </output>
                                </span>
                                <input
                                    id={EXPOSURE_CONTROL_ID}
                                    type="range"
                                    min={MINIMUM_TONE_MAPPING_EXPOSURE}
                                    max={MAXIMUM_TONE_MAPPING_EXPOSURE}
                                    step={TONE_MAPPING_EXPOSURE_STEP}
                                    value={renderSettings.exposure}
                                    onChange={handleExposureChange}
                                />
                            </label>
                            <label className="plane-render__render-field plane-render__render-field--range">
                                <span>
                                    渲染倍率
                                    <output htmlFor={PIXEL_RATIO_CONTROL_ID}>
                                        {renderSettings.pixelRatio.toFixed(2)}x
                                    </output>
                                </span>
                                <input
                                    id={PIXEL_RATIO_CONTROL_ID}
                                    type="range"
                                    min={MINIMUM_RENDER_PIXEL_RATIO}
                                    max={MAXIMUM_RENDER_PIXEL_RATIO}
                                    step={RENDER_PIXEL_RATIO_STEP}
                                    value={renderSettings.pixelRatio}
                                    onChange={handlePixelRatioChange}
                                />
                            </label>
                            <label className="plane-render__render-switch">
                                <span>实时阴影</span>
                                <input
                                    id={SHADOWS_CONTROL_ID}
                                    type="checkbox"
                                    role="switch"
                                    checked={renderSettings.shadowsEnabled}
                                    onChange={handleShadowsEnabledChange}
                                />
                            </label>
                            <label className="plane-render__render-field">
                                <span>阴影算法</span>
                                <select
                                    value={renderSettings.shadowMode}
                                    disabled={!renderSettings.shadowsEnabled}
                                    onChange={handleShadowModeChange}
                                >
                                    <option value="pcf">标准 PCF</option>
                                    <option value="vsm">柔化 VSM</option>
                                </select>
                            </label>
                            <button
                                className="plane-render__render-reset"
                                type="button"
                                onClick={handleRenderSettingsReset}
                            >
                                恢复默认
                            </button>
                        </div>
                    </aside>
                ) : null}
            </div>
            <button
                className="plane-render__fullscreen-button"
                type="button"
                aria-pressed={isFullscreen}
                onClick={handleFullscreenToggle}
            >
                {isFullscreen ? "退出全屏" : "全屏查看"}
            </button>
            {fullscreenError !== null ? (
                <p className="plane-render__fullscreen-error" role="alert">
                    {fullscreenError}
                </p>
            ) : null}
        </div>
    );
};
