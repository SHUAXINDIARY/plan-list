import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type PointerEvent,
    type ReactElement,
    useId,
} from "react";
import * as THREE from "three";
import { PMREMGenerator, type WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    RenderControls,
} from "./components/RenderControls";
import {
    applyAircraftLightingSettings,
    createAircraftLightingRig,
    createRoomEnvironmentResources,
    disposeEnvironmentResources,
    type AircraftEnvironmentResources,
    type AircraftLightingRig,
} from "./viewport/scene";
import { AIRCRAFT_HDRI_ASSETS } from "./hdriAssets";
import type {
    AircraftAnimationState,
    AircraftCamera,
    AircraftCameraHudState,
    AircraftCameraView,
    AircraftModelLoadingProgress,
    AircraftModelViewportProps,
    AircraftProjectionMode,
    AircraftRenderSettings,
} from "./viewport/types";
import {
    applyModelSourceOrientation,
    normalizeAircraftModel,
    disposeSceneResources,
} from "./viewport/aircraft";
import {
    applyCameraView,
    createAircraftCamera,
    focusModel,
    getCameraFitDistance,
    getCameraHudState,
    isAircraftCameraView,
    isCameraHudStateEqual,
    isAircraftProjectionMode,
    configureAircraftOrbitControls,
} from "./viewport/camera";
import {
    applyRenderSettings,
    hasAircraftWebGPUSupport,
    initializeAircraftWebGPURenderer,
    WEBGPU_DEVICE_LOST_MESSAGE,
    WEBGPU_INITIALIZATION_ERROR_MESSAGE,
    WEBGPU_UNAVAILABLE_MESSAGE,
} from "./viewport/renderer";
import {
    CURRENT_MODEL_FAILED_MESSAGE,
    EMPTY_MODEL_DIRECTORY_MESSAGE,
    MODEL_FILL_LIGHT_COLOR_TOKEN,
    MODEL_FLOOR_COLOR_TOKEN,
    MODEL_KEY_LIGHT_COLOR_TOKEN,
    MODEL_RIM_LIGHT_COLOR_TOKEN,
    createAircraftDisplayFloor,
    readThemeColor,
} from "./viewport/scene";
import {
    EMPTY_ANIMATION_STATE,
    DEFAULT_MODEL_ANIMATION_NAME,
} from "./viewport/animation";
import {
    downloadBlob,
    FULLSCREEN_REQUEST_ERROR_MESSAGE,
    SETTINGS_EXPORT_ERROR_MESSAGE,
    SNAPSHOT_EXPORT_ERROR_MESSAGE,
    SNAPSHOT_UNAVAILABLE_MESSAGE,
} from "./viewport/diagnostics";
import { isViewportControlTarget } from "./viewport/interaction";
import { useRenderSettings } from "./viewport/hooks/useRenderSettings";
import { ViewportOverlays } from "./viewport/components/ViewportOverlays";
import { ViewportNavigationControls } from "./viewport/components/ViewportNavigationControls";
import {
    createAircraftRenderLoop,
    type AircraftRenderLoopHandle,
} from "./viewport/runtime/renderLoop";
import { createAircraftEnvironmentController } from "./viewport/runtime/environmentController";

/** 保持页面级导入路径兼容，加载进度类型由 viewport 领域模块统一维护。 */
export type { AircraftModelLoadingProgress } from "./viewport/types";

/** 尚未建立相机和模型关系时不显示观察 HUD。 */
const EMPTY_CAMERA_HUD_STATE: AircraftCameraHudState | null = null;
/**
 * 使用 Three.js WebGPU 渲染器加载当前选择的单个 GLB 模型。
 */
export const AircraftModelViewport = ({
    asset,
    selectedModelId,
    onLoadingProgressChange,
    onModelSelection,
    fullscreenTargetRef,
    retryToken,
}: AircraftModelViewportProps): ReactElement => {
    const modelDirectoryBaseId = useId();
    const modelDirectoryId = `${modelDirectoryBaseId}-model-dir`;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rendererRef = useRef<WebGPURenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<AircraftCamera | null>(null);
    const orbitControlsRef = useRef<OrbitControls<AircraftCamera> | null>(null);
    const projectionModeApplyRef = useRef<
        ((mode: AircraftProjectionMode) => void) | null
    >(null);
    const requestRenderRef = useRef<(() => void) | null>(null);
    const resizeRendererRef = useRef<(() => void) | null>(null);
    const aircraftModelRef = useRef<THREE.Object3D | null>(null);
    const aircraftAttitudePivotRef = useRef<THREE.Group | null>(null);
    const displayFloorRef = useRef<THREE.Mesh | null>(null);
    const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
    const lightingRigRef = useRef<AircraftLightingRig | null>(null);
    const environmentApplyRef = useRef<
        ((settings: AircraftRenderSettings) => Promise<void>) | null
    >(null);
    const animationMixerRef = useRef<THREE.AnimationMixer | null>(null);
    const animationActionRef = useRef<THREE.AnimationAction | null>(null);
    /** Three.js 动画计时器；暂停/恢复时 reset，避免累计不可见期间的时间差。 */
    const animationTimerRef = useRef<THREE.Timer>(new THREE.Timer());
    const animationPlayingRef = useRef<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isModelDirectoryOpen, setIsModelDirectoryOpen] =
        useState<boolean>(false);
    const [cameraView, setCameraView] = useState<AircraftCameraView>("fit");
    const [projectionMode, setProjectionMode] =
        useState<AircraftProjectionMode>("perspective");
    const [cameraHudState, setCameraHudState] =
        useState<AircraftCameraHudState | null>(EMPTY_CAMERA_HUD_STATE);
    const [animationState, setAnimationState] =
        useState<AircraftAnimationState>(EMPTY_ANIMATION_STATE);
    const [isRenderControlsOpen, setIsRenderControlsOpen] =
        useState<boolean>(false);
    const [fullscreenError, setFullscreenError] = useState<string | null>(null);
    const [snapshotError, setSnapshotError] = useState<string | null>(null);
    const [environmentError, setEnvironmentError] = useState<string | null>(
        null,
    );
    const [environmentLoading, setEnvironmentLoading] =
        useState<boolean>(false);
    const [isSnapshotAvailable, setIsSnapshotAvailable] =
        useState<boolean>(false);
    const {
        settings: renderSettings,
        onToneMappingChange: handleToneMappingChange,
        onQualityPresetChange: handleQualityPresetChange,
        onLightingPresetChange: handleLightingPresetChange,
        onEnvironmentPresetChange: handleEnvironmentPresetChange,
        onHdriChange: handleHdriChange,
        onEnvironmentIntensityChange: handleEnvironmentIntensityChange,
        onExposureChange: handleExposureChange,
        onPixelRatioChange: handlePixelRatioChange,
        onLightPositionXChange: handleLightPositionXChange,
        onLightPositionYChange: handleLightPositionYChange,
        onLightPositionZChange: handleLightPositionZChange,
        onKeyLightIntensityChange: handleKeyLightIntensityChange,
        onFillLightIntensityChange: handleFillLightIntensityChange,
        onRimLightIntensityChange: handleRimLightIntensityChange,
        onShadowsEnabledChange: handleShadowsEnabledChange,
        onDisplayFloorChange: handleDisplayFloorChange,
        onShadowModeChange: handleShadowModeChange,
        onReset: handleRenderSettingsReset,
    } = useRenderSettings();
    const renderSettingsRef = useRef<AircraftRenderSettings>(renderSettings);
    const projectionModeRef = useRef<AircraftProjectionMode>(projectionMode);
    const fullscreenToggleRef = useRef<HTMLButtonElement | null>(null);
    const wasFullscreenRef = useRef<boolean>(false);
    const isApplyingCameraViewRef = useRef<boolean>(false);

    renderSettingsRef.current = renderSettings;
    projectionModeRef.current = projectionMode;

    /** 获取包含画布、工具和状态信息的页面级全屏目标。 */
    const getFullscreenTarget = (): HTMLElement | null =>
        fullscreenTargetRef.current ?? containerRef.current;

    /** 从当前 Three.js 相机读取 HUD 状态，并过滤掉无意义的小幅抖动。 */
    const updateCameraHud = (): void => {
        const camera = cameraRef.current;
        const controls = orbitControlsRef.current;

        if (camera === null || controls === null) {
            return;
        }

        const nextState = getCameraHudState(camera, controls);
        setCameraHudState(
            (
                currentState: AircraftCameraHudState | null,
            ): AircraftCameraHudState =>
                isCameraHudStateEqual(currentState, nextState)
                    ? (currentState ?? nextState)
                    : nextState,
        );
    };

    /** 切换 Perspective 与 Orthographic，并由场景生命周期替换相机实例。 */
    const handleProjectionModeChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const nextProjectionMode = event.currentTarget.value;

        if (!isAircraftProjectionMode(nextProjectionMode)) {
            return;
        }

        setProjectionMode(nextProjectionMode);
    };

    useEffect((): void => {
        projectionModeApplyRef.current?.(projectionMode);
    }, [projectionMode]);

    useEffect((): (() => void) => {
        /** 同步 Esc 退出及浏览器原生控件触发的全屏状态。 */
        const handleFullscreenChange = (): void => {
            const nextIsFullscreen =
                document.fullscreenElement === getFullscreenTarget();

            setIsFullscreen(nextIsFullscreen);

            if (!nextIsFullscreen) {
                setIsModelDirectoryOpen(false);
            }

            if (nextIsFullscreen || wasFullscreenRef.current) {
                requestAnimationFrame((): void => {
                    fullscreenToggleRef.current?.focus();
                });
            }

            wasFullscreenRef.current = nextIsFullscreen;
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
        const fullscreenTarget = getFullscreenTarget();

        if (container === null || fullscreenTarget === null) {
            return;
        }

        try {
            if (document.fullscreenElement === fullscreenTarget) {
                await document.exitFullscreen();
            } else {
                await fullscreenTarget.requestFullscreen();
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

    /** 切换全屏模式内的模型目录，并关闭同层级的其他工具面板。 */
    const handleModelDirectoryToggle = (): void => {
        setIsModelDirectoryOpen((isOpen: boolean): boolean => {
            const nextIsOpen = !isOpen;

            if (nextIsOpen) {
                setIsRenderControlsOpen(false);
            }

            return nextIsOpen;
        });
    };

    /** 选择全屏目录中的模型后立即收起目录，保持画布观察焦点。 */
    const handleFullscreenModelSelection = (modelId: string): void => {
        onModelSelection(modelId);
        setIsModelDirectoryOpen(false);
    };

    /** 切换画布内渲染控制面板，并保持三维模型的直接操作区域可用。 */
    const handleRenderControlsToggle = (): void => {
        setIsRenderControlsOpen((isOpen: boolean): boolean => {
            return !isOpen;
        });
    };

    /** 将画布外的空白指针按下视为收起工具面板，面板自身不触发该行为。 */
    const handleViewportPointerDown = (
        event: PointerEvent<HTMLDivElement>,
    ): void => {
        if (isViewportControlTarget(event.target)) {
            return;
        }

        setIsRenderControlsOpen(false);
        setIsModelDirectoryOpen(false);
    };

    /** 应用标准相机视角，模型尚未就绪时保留菜单选择不变。 */
    const handleCameraViewChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const nextCameraView = event.currentTarget.value;

        if (
            !isAircraftCameraView(nextCameraView) ||
            nextCameraView === "custom"
        ) {
            return;
        }

        const camera = cameraRef.current;
        const controls = orbitControlsRef.current;
        const model = aircraftAttitudePivotRef.current;

        if (camera === null || controls === null || model === null) {
            return;
        }

        isApplyingCameraViewRef.current = true;
        applyCameraView(camera, controls, model, nextCameraView);
        setCameraView(nextCameraView);
        updateCameraHud();
        isApplyingCameraViewRef.current = false;
    };

    /** 将当前 WebGPU canvas 导出为 PNG，并使用模型 ID 生成稳定文件名。 */
    const handleSnapshotExport = (): void => {
        const renderer = rendererRef.current;

        if (!isSnapshotAvailable || renderer === null) {
            setSnapshotError(SNAPSHOT_UNAVAILABLE_MESSAGE);
            return;
        }

        setSnapshotError(null);
        renderer.domElement.toBlob((blob: Blob | null): void => {
            if (blob === null) {
                setSnapshotError(SNAPSHOT_EXPORT_ERROR_MESSAGE);
                return;
            }

            const timeStamp = new Date().toISOString().replace(/[:.]/g, "-");
            downloadBlob(
                blob,
                `plane-${asset?.id ?? "model"}-${timeStamp}.png`,
            );
        }, "image/png");
    };

    /** 导出可复现当前模型检查状态的 JSON，包括相机、姿态和渲染参数。 */
    const handleSettingsExport = (): void => {
        const camera = cameraRef.current;
        const controls = orbitControlsRef.current;

        if (!isSnapshotAvailable || camera === null || controls === null) {
            setSnapshotError(SETTINGS_EXPORT_ERROR_MESSAGE);
            return;
        }

        setSnapshotError(null);
        const settings = {
            schemaVersion: 2,
            modelId: asset?.id ?? null,
            camera: {
                projectionMode,
                view: cameraView,
                position: camera.position.toArray(),
                target: controls.target.toArray(),
                up: camera.up.toArray(),
            },
            render: renderSettings,
            animation: animationState.available
                ? {
                      name: animationState.name,
                      currentTime: animationState.currentTime,
                  }
                : null,
        };
        const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], {
            type: "application/json",
        });
        downloadBlob(
            settingsBlob,
            `plane-${asset?.id ?? "model"}-settings.json`,
        );
    };

    /** 切换当前 GLB 动画播放状态，并在播放时恢复按需渲染帧。 */
    const handleAnimationToggle = (): void => {
        const action = animationActionRef.current;

        if (action === null || !animationState.available) {
            return;
        }

        const isPlaying = !animationState.isPlaying;
        animationPlayingRef.current = isPlaying;
        action.paused = !isPlaying;

        if (isPlaying) {
            animationTimerRef.current.reset();
        } else {
            animationTimerRef.current.reset();
        }

        setAnimationState(
            (currentState: AircraftAnimationState): AircraftAnimationState => ({
                ...currentState,
                isPlaying,
            }),
        );
        requestRenderRef.current?.();
    };

    /** 拖动动画时间轴时暂停播放并立刻把 mixer 定位到目标秒数。 */
    const handleAnimationScrub = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const action = animationActionRef.current;

        if (action === null || !animationState.available) {
            return;
        }

        const currentTime = Math.min(
            Math.max(Number(event.currentTarget.value), 0),
            animationState.duration,
        );
        action.time = currentTime;
        animationMixerRef.current?.setTime(currentTime);
        action.paused = true;
        animationPlayingRef.current = false;
        animationTimerRef.current.reset();
        setAnimationState(
            (currentState: AircraftAnimationState): AircraftAnimationState => ({
                ...currentState,
                currentTime,
                isPlaying: false,
            }),
        );
        requestRenderRef.current?.();
    };

    useEffect((): (() => void) => {
        /** Esc 优先收起当前工具面板，保留浏览器对全屏退出的原生处理。 */
        const handlePanelEscape = (event: globalThis.KeyboardEvent): void => {
            if (event.key !== "Escape") {
                return;
            }

            setIsRenderControlsOpen(false);
            setIsModelDirectoryOpen(false);
        };

        document.addEventListener("keydown", handlePanelEscape);

        return (): void => {
            document.removeEventListener("keydown", handlePanelEscape);
        };
    }, []);

    useEffect((): void => {
        const renderer = rendererRef.current;

        if (renderer === null) {
            return;
        }

        // 更新渲染器后重新使用当前容器尺寸分配物理绘制缓冲区。
        applyRenderSettings(renderer, renderSettings);
        if (sceneRef.current !== null) {
            sceneRef.current.environmentIntensity =
                renderSettings.environmentIntensity;
        }
        if (lightingRigRef.current !== null) {
            applyAircraftLightingSettings(lightingRigRef.current, renderSettings);
        }
        resizeRendererRef.current?.();
        requestRenderRef.current?.();
    }, [renderSettings]);

    useEffect((): void => {
        const displayFloor = displayFloorRef.current;

        if (displayFloor === null) {
            return;
        }

        displayFloor.visible = renderSettings.displayFloor;
        requestRenderRef.current?.();
    }, [renderSettings.displayFloor]);

    useEffect((): void => {
        const lightingRig = lightingRigRef.current;

        if (lightingRig === null) {
            return;
        }

        applyAircraftLightingSettings(lightingRig, renderSettings);
        requestRenderRef.current?.();
    }, [
        renderSettings.lightPositionX,
        renderSettings.lightPositionY,
        renderSettings.lightPositionZ,
        renderSettings.keyLightIntensity,
        renderSettings.fillLightIntensity,
        renderSettings.rimLightIntensity,
    ]);

    useEffect((): void => {
        if (sceneRef.current !== null) {
            sceneRef.current.environmentIntensity =
                renderSettings.environmentIntensity;
            requestRenderRef.current?.();
        }
    }, [renderSettings.environmentIntensity]);

    useEffect((): (() => void) => {
        const applyEnvironment = environmentApplyRef.current;

        if (applyEnvironment === null) {
            return (): void => undefined;
        }

        void applyEnvironment(renderSettings);

        return (): void => undefined;
    }, [renderSettings.environmentPreset, renderSettings.hdriUrl]);

    useEffect((): (() => void) | undefined => {
        const container = containerRef.current;

        if (container === null) {
            return undefined;
        }

        let isDisposed = false;
        let cleanupRenderer: (() => void) | undefined;
        let isRendererUnavailable = false;
        let environmentResources: AircraftEnvironmentResources | null = null;
        let themeObserver: MutationObserver | null = null;
        let renderLoopHandle: AircraftRenderLoopHandle | undefined;

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
            animationPlayingRef.current = false;
            animationTimerRef.current.reset();
            setAnimationState(EMPTY_ANIMATION_STATE);
            setCameraHudState(EMPTY_CAMERA_HUD_STATE);
            setIsSnapshotAvailable(false);
            setSnapshotError(null);
            setEnvironmentError(null);
            setEnvironmentLoading(false);

            publishProgress({
                phase: "initializing",
                loadedModelCount: 0,
                failedModelCount: 0,
                rendererStatus: "initializing",
                loadingStage: "renderer",
            });

            if (asset === undefined) {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    rendererStatus: "unavailable",
                    message: EMPTY_MODEL_DIRECTORY_MESSAGE,
                });
                return;
            }

            if (!hasAircraftWebGPUSupport()) {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    rendererStatus: "unavailable",
                    message: WEBGPU_UNAVAILABLE_MESSAGE,
                });
                return;
            }

            let renderer: WebGPURenderer;

            try {
                renderer = await initializeAircraftWebGPURenderer();
            } catch {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    rendererStatus: "unavailable",
                    message: WEBGPU_INITIALIZATION_ERROR_MESSAGE,
                });
                return;
            }

            if (isDisposed) {
                renderer.dispose();
                return;
            }

            /** 把 WebGPU 设备丢失转换为可重试的页面错误状态。 */
            const defaultOnDeviceLost = renderer.onDeviceLost;
            renderer.onDeviceLost = (info): void => {
                defaultOnDeviceLost(info);
                isRendererUnavailable = true;
                renderLoopHandle?.cleanup();
                publishProgress({
                    phase: "error",
                    loadedModelCount: aircraftModelRef.current === null ? 0 : 1,
                    failedModelCount: 0,
                    rendererStatus: "lost",
                    message: WEBGPU_DEVICE_LOST_MESSAGE,
                });
                animationPlayingRef.current = false;
                setAnimationState(
                    (
                        currentState: AircraftAnimationState,
                    ): AircraftAnimationState => ({
                        ...currentState,
                        isPlaying: false,
                    }),
                );
            };

            const scene = new THREE.Scene();
            let camera: AircraftCamera = createAircraftCamera(
                projectionModeRef.current,
                1,
            );
            let controls: OrbitControls<AircraftCamera> = new OrbitControls<AircraftCamera>(
                camera,
                renderer.domElement,
            );
            const gltfLoader = new GLTFLoader();
            const environmentGenerator = new PMREMGenerator(renderer);
            const createdEnvironmentResources =
                createRoomEnvironmentResources(environmentGenerator);
            environmentResources = createdEnvironmentResources;
            const environmentController =
                createAircraftEnvironmentController({
                    environmentGenerator,
                    resources: createdEnvironmentResources,
                    scene,
                    getCurrentSettings: (): AircraftRenderSettings =>
                        renderSettingsRef.current,
                    isDisposed: (): boolean => isDisposed,
                    onLoadingChange: setEnvironmentLoading,
                    onErrorChange: setEnvironmentError,
                    requestRender: (): void => {
                        requestRenderRef.current?.();
                    },
                });
            scene.environment =
                createdEnvironmentResources.roomRenderTarget.texture;
            scene.environmentIntensity =
                renderSettingsRef.current.environmentIntensity;

            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.domElement.className = "plane-render__canvas";
            renderer.domElement.setAttribute("aria-hidden", "true");
            container.appendChild(renderer.domElement);

            configureAircraftOrbitControls(controls);

            const lightingRig = createAircraftLightingRig(
                renderSettingsRef.current,
                readThemeColor(MODEL_KEY_LIGHT_COLOR_TOKEN, "#ffffff"),
                readThemeColor(MODEL_FILL_LIGHT_COLOR_TOKEN, "#8acbe7"),
                readThemeColor(MODEL_FILL_LIGHT_COLOR_TOKEN, "#8acbe7"),
            );
            scene.add(
                lightingRig.hemisphereLight,
                lightingRig.keyLight,
                lightingRig.fillLight,
                lightingRig.rimLight,
            );
            const keyLight = lightingRig.keyLight;
            keyLightRef.current = keyLight;
            lightingRigRef.current = lightingRig;

            const displayFloor = createAircraftDisplayFloor(
                renderSettingsRef.current.displayFloor,
            );
            displayFloorRef.current = displayFloor;
            scene.add(displayFloor);

            /** 将当前主题的工作室背景与灯光颜色同步到 Three.js 对象。 */
            const applyThemePalette = (): void => {
                if (displayFloor.material instanceof THREE.MeshStandardMaterial) {
                    displayFloor.material.color.set(
                        readThemeColor(MODEL_FLOOR_COLOR_TOKEN, "#163343"),
                    );
                }
                keyLight.color.set(
                    readThemeColor(MODEL_KEY_LIGHT_COLOR_TOKEN, "#ffffff"),
                );
                lightingRig.fillLight.color.set(
                    readThemeColor(MODEL_FILL_LIGHT_COLOR_TOKEN, "#8acbe7"),
                );
                lightingRig.rimLight.color.set(
                    readThemeColor(MODEL_RIM_LIGHT_COLOR_TOKEN, "#b8d8ff"),
                );
                requestRenderRef.current?.();
            };

            applyThemePalette();
            themeObserver = new MutationObserver(applyThemePalette);
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["data-theme"],
            });

            rendererRef.current = renderer;
            sceneRef.current = scene;
            cameraRef.current = camera;
            orbitControlsRef.current = controls;
            environmentApplyRef.current = environmentController.apply;
            renderLoopHandle = createAircraftRenderLoop({
                container,
                renderer,
                scene,
                getCamera: (): AircraftCamera => camera,
                getControls: (): OrbitControls<AircraftCamera> => controls,
                getAnimationMixer: (): THREE.AnimationMixer | null =>
                    animationMixerRef.current,
                getAnimationAction: (): THREE.AnimationAction | null =>
                    animationActionRef.current,
                animationTimer: animationTimerRef.current,
                isAnimationPlaying: (): boolean =>
                    animationPlayingRef.current,
                onAnimationTimeChange: (currentTime: number): void => {
                    setAnimationState(
                        (
                            currentState: AircraftAnimationState,
                        ): AircraftAnimationState => ({
                            ...currentState,
                            currentTime,
                        }),
                    );
                },
                getPixelRatio: (): number => renderSettingsRef.current.pixelRatio,
                isRendererUnavailable: (): boolean => isRendererUnavailable,
            });
            requestRenderRef.current = renderLoopHandle.requestRender;
            resizeRendererRef.current = renderLoopHandle.resizeRenderer;
            applyRenderSettings(renderer, renderSettingsRef.current);
            void environmentController.apply(renderSettingsRef.current);

            const handleControlsChange = (): void => {
                if (!isApplyingCameraViewRef.current) {
                    setCameraView("custom");
                }

                updateCameraHud();
                requestRenderRef.current?.();
            };

            /** 创建与当前相机行为一致的新 OrbitControls，供投影切换复用。 */
            const createConfiguredControls = (
                nextCamera: AircraftCamera,
            ): OrbitControls<AircraftCamera> => {
                const nextControls = new OrbitControls<AircraftCamera>(
                    nextCamera,
                    renderer.domElement,
                );

                configureAircraftOrbitControls(nextControls);

                return nextControls;
            };

            /** 即时替换投影相机，保留观察目标和当前轨道位置。 */
            const applyProjectionMode = (
                nextProjectionMode: AircraftProjectionMode,
            ): void => {
                if (
                    isDisposed ||
                    (nextProjectionMode === "orthographic" &&
                        camera instanceof THREE.OrthographicCamera) ||
                    (nextProjectionMode === "perspective" &&
                        camera instanceof THREE.PerspectiveCamera)
                ) {
                    return;
                }

                const previousCamera = camera;
                const previousControls = controls;
                const { width, height } = container.getBoundingClientRect();
                const aspect = Math.max(width, 1) / Math.max(height, 1);
                const nextCamera = createAircraftCamera(
                    nextProjectionMode,
                    aspect,
                );

                nextCamera.position.copy(previousCamera.position);
                nextCamera.up.copy(previousCamera.up);
                nextCamera.lookAt(previousControls.target);
                nextCamera.updateProjectionMatrix();

                const aircraftModel = aircraftAttitudePivotRef.current;
                if (aircraftModel !== null) {
                    if (nextCamera instanceof THREE.OrthographicCamera) {
                        getCameraFitDistance(nextCamera, aircraftModel);
                    } else if (
                        previousCamera instanceof THREE.OrthographicCamera
                    ) {
                        const viewDirection = nextCamera.position
                            .clone()
                            .sub(previousControls.target)
                            .normalize();
                        const fitDistance = getCameraFitDistance(
                            nextCamera,
                            aircraftModel,
                        ).distance;

                        nextCamera.position
                            .copy(previousControls.target)
                            .addScaledVector(viewDirection, fitDistance);
                    }
                }

                const nextControls = createConfiguredControls(nextCamera);
                nextControls.target.copy(previousControls.target);
                nextControls.addEventListener("change", handleControlsChange);

                previousControls.removeEventListener(
                    "change",
                    handleControlsChange,
                );
                previousControls.dispose();

                camera = nextCamera;
                controls = nextControls;
                cameraRef.current = nextCamera;
                orbitControlsRef.current = nextControls;
                nextControls.update();
                updateCameraHud();
                requestRenderRef.current?.();
            };

            controls.addEventListener("change", handleControlsChange);
            projectionModeApplyRef.current = applyProjectionMode;
            applyProjectionMode(projectionModeRef.current);

            cleanupRenderer = (): void => {
                const activeRenderLoop = renderLoopHandle;
                activeRenderLoop?.cleanup();
                renderLoopHandle = undefined;
                themeObserver?.disconnect();
                if (
                    requestRenderRef.current ===
                    activeRenderLoop?.requestRender
                ) {
                    requestRenderRef.current = null;
                }
                controls.removeEventListener("change", handleControlsChange);
                controls.dispose();
                if (projectionModeApplyRef.current === applyProjectionMode) {
                    projectionModeApplyRef.current = null;
                }
                animationPlayingRef.current = false;
                animationTimerRef.current.dispose();
                animationMixerRef.current?.stopAllAction();
                if (aircraftModelRef.current !== null) {
                    animationMixerRef.current?.uncacheRoot(
                        aircraftModelRef.current,
                    );
                }
                animationMixerRef.current = null;
                animationActionRef.current = null;
                environmentController.invalidate();
                if (environmentResources !== null) {
                    disposeEnvironmentResources(environmentResources);
                    environmentResources = null;
                }
                environmentGenerator.dispose();
                if (
                    environmentApplyRef.current === environmentController.apply
                ) {
                    environmentApplyRef.current = null;
                }
                disposeSceneResources(scene);
                renderer.dispose();
                renderer.domElement.remove();

                if (rendererRef.current === renderer) {
                    rendererRef.current = null;
                    resizeRendererRef.current = null;
                }

                if (cameraRef.current === camera) {
                    cameraRef.current = null;
                }

                if (sceneRef.current === scene) {
                    sceneRef.current = null;
                }

                if (orbitControlsRef.current === controls) {
                    orbitControlsRef.current = null;
                }

                if (aircraftModelRef.current !== null) {
                    aircraftModelRef.current = null;
                }

                if (aircraftAttitudePivotRef.current !== null) {
                    aircraftAttitudePivotRef.current = null;
                }

                if (displayFloorRef.current === displayFloor) {
                    displayFloorRef.current = null;
                }

                if (keyLightRef.current === keyLight) {
                    keyLightRef.current = null;
                }

                if (lightingRigRef.current === lightingRig) {
                    lightingRigRef.current = null;
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
                rendererStatus: "webgpu",
                loadingStage: "downloading",
                progressRatio: 0,
            });

            let loadedModelCount = 0;
            let failedModelCount = 0;

            try {
                const modelUrl = await asset.loadUrl();
                const gltf = await gltfLoader.loadAsync(
                    modelUrl,
                    (event: ProgressEvent): void => {
                        publishProgress({
                            phase: "loading",
                            loadedModelCount: 0,
                            failedModelCount: 0,
                            rendererStatus: "webgpu",
                            loadingStage: "downloading",
                            progressRatio:
                                event.lengthComputable && event.total > 0
                                    ? event.loaded / event.total
                                    : undefined,
                        });
                    },
                );

                if (isDisposed) {
                    disposeSceneResources(gltf.scene);
                    return;
                }

                publishProgress({
                    phase: "loading",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    rendererStatus: "webgpu",
                    loadingStage: "parsing",
                });

                const model = gltf.scene;
                normalizeAircraftModel(model);
                applyModelSourceOrientation(model, asset.sourcePath);

                const aircraftAttitudePivot = new THREE.Group();
                aircraftAttitudePivot.add(model);
                scene.add(aircraftAttitudePivot);
                aircraftModelRef.current = model;
                aircraftAttitudePivotRef.current = aircraftAttitudePivot;
                const normalizedBounds = new THREE.Box3().setFromObject(model);
                displayFloor.position.y = normalizedBounds.min.y - 0.015;

                const animationClip = gltf.animations[0];
                if (animationClip !== undefined && animationClip.duration > 0) {
                    const animationMixer = new THREE.AnimationMixer(model);
                    const animationAction =
                        animationMixer.clipAction(animationClip);

                    animationAction.play();
                    animationAction.paused = true;
                    animationMixerRef.current = animationMixer;
                    animationActionRef.current = animationAction;
                    setAnimationState({
                        available: true,
                        name:
                            animationClip.name || DEFAULT_MODEL_ANIMATION_NAME,
                        duration: animationClip.duration,
                        currentTime: 0,
                        isPlaying: false,
                    });
                }

                isApplyingCameraViewRef.current = true;
                focusModel(camera, controls, aircraftAttitudePivot);
                setCameraView("fit");
                isApplyingCameraViewRef.current = false;
                updateCameraHud();
                requestRenderRef.current?.();
                setIsSnapshotAvailable(true);
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
                rendererStatus: "webgpu",
                message:
                    loadedModelCount > 0
                        ? undefined
                        : CURRENT_MODEL_FAILED_MESSAGE,
            });
        };

        void initializeViewport();

        return (): void => {
            isDisposed = true;
            cleanupRenderer?.();
        };
    }, [asset, onLoadingProgressChange, retryToken]);

    return (
        <div
            ref={containerRef}
            className={`plane-render__viewport-canvas${animationState.available ? " plane-render__viewport-canvas--has-animation" : ""}${environmentLoading ? " plane-render__viewport-canvas--environment-loading" : ""}`}
            onPointerDown={handleViewportPointerDown}
        >
            <div className="plane-render__viewport-tools">
                <ViewportNavigationControls
                    cameraView={cameraView}
                    onCameraViewChange={handleCameraViewChange}
                    projectionMode={projectionMode}
                    onProjectionModeChange={handleProjectionModeChange}
                    isSnapshotAvailable={isSnapshotAvailable}
                    onSnapshotExport={handleSnapshotExport}
                    onSettingsExport={handleSettingsExport}
                />
                <RenderControls
                    isOpen={isRenderControlsOpen}
                    settings={renderSettings}
                    onToggle={handleRenderControlsToggle}
                    onToneMappingChange={handleToneMappingChange}
                    onQualityPresetChange={handleQualityPresetChange}
                    onLightingPresetChange={handleLightingPresetChange}
                    onEnvironmentPresetChange={handleEnvironmentPresetChange}
                    hdriAssets={AIRCRAFT_HDRI_ASSETS}
                    onHdriChange={handleHdriChange}
                    environmentError={environmentError}
                    environmentLoading={environmentLoading}
                    onEnvironmentIntensityChange={
                        handleEnvironmentIntensityChange
                    }
                    onExposureChange={handleExposureChange}
                    onPixelRatioChange={handlePixelRatioChange}
                    onLightPositionXChange={handleLightPositionXChange}
                    onLightPositionYChange={handleLightPositionYChange}
                    onLightPositionZChange={handleLightPositionZChange}
                    onKeyLightIntensityChange={handleKeyLightIntensityChange}
                    onFillLightIntensityChange={handleFillLightIntensityChange}
                    onRimLightIntensityChange={handleRimLightIntensityChange}
                    onShadowsEnabledChange={handleShadowsEnabledChange}
                    onDisplayFloorChange={handleDisplayFloorChange}
                    onShadowModeChange={handleShadowModeChange}
                    onReset={handleRenderSettingsReset}
                />
                {isFullscreen ? (
                    <button
                        className="plane-render__model-directory-toggle"
                        type="button"
                        aria-controls={modelDirectoryId}
                        aria-expanded={isModelDirectoryOpen}
                        onClick={handleModelDirectoryToggle}
                    >
                        {isModelDirectoryOpen ? "收起目录" : "模型目录"}
                    </button>
                ) : null}
                <button
                    ref={fullscreenToggleRef}
                    className="plane-render__fullscreen-button"
                    type="button"
                    aria-pressed={isFullscreen}
                    onClick={handleFullscreenToggle}
                >
                    {isFullscreen ? "退出全屏" : "全屏查看"}
                </button>
            </div>
            <ViewportOverlays
                isFullscreen={isFullscreen}
                isModelDirectoryOpen={isModelDirectoryOpen}
                modelDirectoryId={modelDirectoryId}
                selectedModelId={selectedModelId}
                onModelSelection={handleFullscreenModelSelection}
                cameraHudState={cameraHudState}
                animationState={animationState}
                onAnimationToggle={handleAnimationToggle}
                onAnimationScrub={handleAnimationScrub}
                fullscreenError={fullscreenError}
                snapshotError={snapshotError}
            />
        </div>
    );
};
