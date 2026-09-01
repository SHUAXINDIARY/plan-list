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
    type AircraftRenderSettings,
} from "./components/RenderControls";
import {
    applyAircraftLightingSettings,
    createAircraftLightingRig,
    createRoomEnvironmentResources,
    disposeEnvironmentResources,
    disposeHdriEnvironment,
    loadHdriEnvironment,
    type AircraftEnvironmentResources,
    type AircraftLightingRig,
} from "./viewport/scene";
import ModelDir from "./ModelDir";
import { AIRCRAFT_HDRI_ASSETS } from "./hdriAssets";
import type {
    AircraftAttitudeSettings,
    AircraftAnimationState,
    AircraftCamera,
    AircraftCameraHudState,
    AircraftCameraView,
    AircraftModelLoadingProgress,
    AircraftModelViewportProps,
    AircraftProjectionMode,
} from "./viewport/types";
import {
    applyAircraftAttitude,
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
    ORTHOGRAPHIC_FRUSTUM_HEIGHT,
} from "./viewport/camera";
import {
    applyRenderSettings,
    createDefaultRenderSettings,
    getQualityPresetSettings,
    hasAircraftWebGPUSupport,
    initializeAircraftWebGPURenderer,
    isAircraftRenderQuality,
    isAircraftShadowMode,
    isAircraftToneMapping,
    WEBGPU_DEVICE_LOST_MESSAGE,
    WEBGPU_INITIALIZATION_ERROR_MESSAGE,
    WEBGPU_UNAVAILABLE_MESSAGE,
} from "./viewport/renderer";
import {
    CURRENT_MODEL_FAILED_MESSAGE,
    DEFAULT_ATTITUDE_SETTINGS,
    EMPTY_MODEL_DIRECTORY_MESSAGE,
    isAircraftEnvironmentPreset,
    isAircraftLightingPreset,
    LIGHTING_PRESET_VALUES,
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
    AnimationControls,
} from "./viewport/animation";
import {
    downloadBlob,
    FULLSCREEN_REQUEST_ERROR_MESSAGE,
    SETTINGS_EXPORT_ERROR_MESSAGE,
    SNAPSHOT_EXPORT_ERROR_MESSAGE,
    SNAPSHOT_UNAVAILABLE_MESSAGE,
} from "./viewport/diagnostics";
import { isViewportControlTarget } from "./viewport/interaction";
import { CameraHud } from "./viewport/visualization";

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
    const attitudeControlsId = useId();
    const modelDirectoryId = `${attitudeControlsId}-model-dir`;
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
    const [renderSettings, setRenderSettings] =
        useState<AircraftRenderSettings>(createDefaultRenderSettings);
    const [attitudeSettings] = useState<AircraftAttitudeSettings>(
        DEFAULT_ATTITUDE_SETTINGS,
    );
    const renderSettingsRef = useRef<AircraftRenderSettings>(renderSettings);
    const projectionModeRef = useRef<AircraftProjectionMode>(projectionMode);
    const attitudeSettingsRef =
        useRef<AircraftAttitudeSettings>(attitudeSettings);
    const fullscreenToggleRef = useRef<HTMLButtonElement | null>(null);
    const wasFullscreenRef = useRef<boolean>(false);
    const isApplyingCameraViewRef = useRef<boolean>(false);

    renderSettingsRef.current = renderSettings;
    projectionModeRef.current = projectionMode;
    attitudeSettingsRef.current = attitudeSettings;

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
            attitude: attitudeSettings,
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

    /** 仅接受已声明的色调映射值，避免 select 意外值破坏渲染器状态。 */
    const handleToneMappingChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const toneMapping = event.currentTarget.value;

        if (!isAircraftToneMapping(toneMapping)) {
            return;
        }

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                toneMapping,
            }),
        );
    };

    /** 应用一档质量预设，仅覆盖像素倍率和阴影参数。 */
    const handleQualityPresetChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const qualityPreset = event.currentTarget.value;

        if (
            !isAircraftRenderQuality(qualityPreset) ||
            qualityPreset === "custom"
        ) {
            return;
        }

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                ...getQualityPresetSettings(qualityPreset),
                qualityPreset,
            }),
        );
    };

    /** 应用一档工作室照明预设，覆盖主光源方向和强度。 */
    const handleLightingPresetChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const lightingPreset = event.currentTarget.value;

        if (
            !isAircraftLightingPreset(lightingPreset) ||
            lightingPreset === "custom"
        ) {
            return;
        }

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                ...LIGHTING_PRESET_VALUES[lightingPreset],
                lightingPreset,
            }),
        );
    };

    /** 切换内置工作室与 HDRI 环境，环境贴图由场景生命周期异步替换。 */
    const handleEnvironmentPresetChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const environmentPreset = event.currentTarget.value;

        if (!isAircraftEnvironmentPreset(environmentPreset)) {
            return;
        }

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => {
                const firstHdriUrl = AIRCRAFT_HDRI_ASSETS[0]?.url ?? "";

                return {
                    ...currentSettings,
                    environmentPreset,
                    hdriUrl:
                        environmentPreset === "hdri" &&
                        currentSettings.hdriUrl.length === 0
                            ? firstHdriUrl
                            : currentSettings.hdriUrl,
                };
            },
        );
    };

    /** 切换目录中的 HDRI 资源，异步加载 effect 会对选择结果做短暂去抖。 */
    const handleHdriChange = (
        event: ChangeEvent<HTMLSelectElement>,
    ): void => {
        const hdriUrl = event.currentTarget.value;

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                hdriUrl,
            }),
        );
    };

    /** 更新环境反射强度，不触发 renderer 或模型重建。 */
    const handleEnvironmentIntensityChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const environmentIntensity = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                environmentIntensity,
            }),
        );
    };

    /** 更新色调映射曝光，并由滑块范围约束有效数值。 */
    const handleExposureChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const exposure = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
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
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                pixelRatio,
                qualityPreset: "custom",
            }),
        );
    };

    /** 切换场景级阴影，便于直接对比模型底部与地面接触效果。 */
    const handleShadowsEnabledChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const shadowsEnabled = event.currentTarget.checked;

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                shadowsEnabled,
                qualityPreset: "custom",
            }),
        );
    };

    /** 切换飞机底部展示平面的可见性，默认保持纯模型画面。 */
    const handleDisplayFloorChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const displayFloor = event.currentTarget.checked;

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                displayFloor,
            }),
        );
    };

    /** 更新主方向光的 X 轴位置，实时改变模型的侧向受光。 */
    const handleLightPositionXChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const lightPositionX = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                lightPositionX,
                lightingPreset: "custom",
            }),
        );
    };

    /** 更新主方向光的 Y 轴位置，实时改变模型顶部与底部的明暗关系。 */
    const handleLightPositionYChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const lightPositionY = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                lightPositionY,
                lightingPreset: "custom",
            }),
        );
    };

    /** 更新主方向光的 Z 轴位置，实时改变模型的前后受光关系。 */
    const handleLightPositionZChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const lightPositionZ = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                lightPositionZ,
                lightingPreset: "custom",
            }),
        );
    };

    /** 更新主方向光强度，并将照明预设标记为自定义。 */
    const handleKeyLightIntensityChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const keyLightIntensity = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                keyLightIntensity,
                lightingPreset: "custom",
            }),
        );
    };

    /** 更新三点灯光补光强度，并将照明预设标记为自定义。 */
    const handleFillLightIntensityChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const fillLightIntensity = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                fillLightIntensity,
                lightingPreset: "custom",
            }),
        );
    };

    /** 更新三点灯光轮廓光强度，并将照明预设标记为自定义。 */
    const handleRimLightIntensityChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const rimLightIntensity = Number(event.currentTarget.value);

        setRenderSettings(
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                rimLightIntensity,
                lightingPreset: "custom",
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
            (
                currentSettings: AircraftRenderSettings,
            ): AircraftRenderSettings => ({
                ...currentSettings,
                shadowMode,
                qualityPreset: "custom",
            }),
        );
    };

    /** 将当前视窗恢复为项目既有的 ACES、PCF 阴影和设备像素比基线。 */
    const handleRenderSettingsReset = (): void => {
        setRenderSettings(createDefaultRenderSettings());
    };

    /** 应用一组飞行阶段预设，并将手动角度同步至三维模型。 */
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

    useEffect((): void => {
        const model = aircraftAttitudePivotRef.current;

        if (model === null) {
            return;
        }

        applyAircraftAttitude(model, attitudeSettings);
        requestRenderRef.current?.();
    }, [attitudeSettings]);

    useEffect((): (() => void) | undefined => {
        const container = containerRef.current;

        if (container === null) {
            return undefined;
        }

        let isDisposed = false;
        let cleanupRenderer: (() => void) | undefined;
        let isRendererUnavailable = false;
        let animationFrameId: number | null = null;
        let isDocumentVisible = document.visibilityState === "visible";
        let isViewportVisible = true;
        let environmentResources: AircraftEnvironmentResources | null = null;
        let environmentRequestToken = 0;
        let themeObserver: MutationObserver | null = null;

        /** 取消尚未执行的按需绘制帧，避免卸载后继续访问 renderer。 */
        const cancelScheduledFrame = (): void => {
            if (animationFrameId === null) {
                return;
            }

            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        };

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
                cancelScheduledFrame();
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

            /** 根据当前环境设置异步加载 HDRI，失败时回退到内置工作室。 */
            const applyEnvironment = async (
                settings: AircraftRenderSettings,
            ): Promise<void> => {
                const resources = environmentResources;

                if (resources === null || isDisposed) {
                    return;
                }

                const requestToken = ++environmentRequestToken;
                scene.environmentIntensity = settings.environmentIntensity;
                const isCurrentEnvironmentSelection = (): boolean =>
                    renderSettingsRef.current.environmentPreset ===
                        settings.environmentPreset &&
                    renderSettingsRef.current.hdriUrl === settings.hdriUrl;

                if (
                    settings.environmentPreset === "room" ||
                    settings.hdriUrl.trim().length === 0
                ) {
                    disposeHdriEnvironment(resources);
                    scene.environment = resources.roomRenderTarget.texture;
                    setEnvironmentLoading(false);
                    setEnvironmentError(
                        settings.environmentPreset === "hdri"
                            ? "请选择 HDRI 环境，当前已回退内置工作室。"
                            : null,
                    );
                    requestRenderRef.current?.();
                    return;
                }

                setEnvironmentError(null);
                setEnvironmentLoading(true);

                try {
                    const hdriRenderTarget = await loadHdriEnvironment(
                        environmentGenerator,
                        settings.hdriUrl,
                    );

                    if (
                        isDisposed ||
                        requestToken !== environmentRequestToken ||
                        !isCurrentEnvironmentSelection()
                    ) {
                        hdriRenderTarget.dispose();
                        return;
                    }

                    disposeHdriEnvironment(resources);
                    resources.hdriRenderTarget = hdriRenderTarget;
                    scene.environment = hdriRenderTarget.texture;
                    setEnvironmentLoading(false);
                    setEnvironmentError(null);
                    requestRenderRef.current?.();
                } catch {
                    if (
                        isDisposed ||
                        requestToken !== environmentRequestToken ||
                        !isCurrentEnvironmentSelection()
                    ) {
                        return;
                    }

                    disposeHdriEnvironment(resources);
                    scene.environment = resources.roomRenderTarget.texture;
                    setEnvironmentLoading(false);
                    setEnvironmentError(
                        "HDRI 加载失败，当前已回退内置工作室。",
                    );
                    requestRenderRef.current?.();
                }
            };

            applyThemePalette();
            themeObserver = new MutationObserver(applyThemePalette);
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["data-theme"],
            });

            /** 根据容器实际尺寸更新相机投影和 WebGPU 画布分辨率。 */
            const resizeRenderer = (): void => {
                const { width, height } = container.getBoundingClientRect();
                const resolvedWidth = Math.max(width, 1);
                const resolvedHeight = Math.max(height, 1);

                const aspect = resolvedWidth / resolvedHeight;

                if (camera instanceof THREE.OrthographicCamera) {
                    const halfHeight = ORTHOGRAPHIC_FRUSTUM_HEIGHT / 2;
                    const halfWidth = halfHeight * aspect;

                    camera.left = -halfWidth;
                    camera.right = halfWidth;
                    camera.top = halfHeight;
                    camera.bottom = -halfHeight;
                } else {
                    camera.aspect = aspect;
                }

                camera.updateProjectionMatrix();
                renderer.setPixelRatio(renderSettingsRef.current.pixelRatio);
                renderer.setSize(resolvedWidth, resolvedHeight, false);
                requestRenderRef.current?.();
            };

            rendererRef.current = renderer;
            sceneRef.current = scene;
            cameraRef.current = camera;
            orbitControlsRef.current = controls;
            resizeRendererRef.current = resizeRenderer;
            environmentApplyRef.current = applyEnvironment;
            applyRenderSettings(renderer, renderSettingsRef.current);
            void applyEnvironment(renderSettingsRef.current);

            const resizeObserver = new ResizeObserver(resizeRenderer);
            resizeObserver.observe(container);

            /** 更新相机阻尼并绘制一帧；没有变化时不继续占用帧循环。 */
            let animationUiAccumulator = 0;
            const renderFrame = (): void => {
                animationFrameId = null;

                if (
                    isDisposed ||
                    isRendererUnavailable ||
                    !isDocumentVisible ||
                    !isViewportVisible
                ) {
                    return;
                }

                const controlsChanged = controls.update();

                if (
                    animationPlayingRef.current &&
                    animationMixerRef.current !== null
                ) {
                    animationTimerRef.current.update();
                    const animationDelta = animationTimerRef.current.getDelta();
                    animationMixerRef.current.update(animationDelta);
                    animationUiAccumulator += animationDelta;

                    if (animationUiAccumulator >= 0.1) {
                        animationUiAccumulator = 0;
                        setAnimationState(
                            (
                                currentState: AircraftAnimationState,
                            ): AircraftAnimationState => ({
                                ...currentState,
                                currentTime:
                                    animationActionRef.current?.time ??
                                    currentState.currentTime,
                            }),
                        );
                    }
                }

                renderer.render(scene, camera);

                if (controlsChanged) {
                    requestRenderRef.current?.();
                }

                if (animationPlayingRef.current) {
                    requestRenderRef.current?.();
                }
            };

            /** 在当前页面和视窗可见时请求下一帧，阻尼结束后自动停止。 */
            const requestRender = (): void => {
                if (
                    isDisposed ||
                    isRendererUnavailable ||
                    !isDocumentVisible ||
                    !isViewportVisible ||
                    animationFrameId !== null
                ) {
                    return;
                }

                animationFrameId = requestAnimationFrame(renderFrame);
            };

            requestRenderRef.current = requestRender;
            resizeRenderer();
            requestRender();

            /** 页面重新可见时补一帧，隐藏时取消待执行帧。 */
            const handleVisibilityChange = (): void => {
                isDocumentVisible = document.visibilityState === "visible";

                if (isDocumentVisible) {
                    if (animationPlayingRef.current) {
                        animationTimerRef.current.reset();
                    }
                    requestRender();
                } else {
                    animationTimerRef.current.reset();
                    cancelScheduledFrame();
                }
            };

            document.addEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );

            const intersectionObserver =
                typeof IntersectionObserver === "undefined"
                    ? null
                    : new IntersectionObserver(([entry]): void => {
                          isViewportVisible = entry?.isIntersecting ?? true;

                          if (isViewportVisible) {
                              if (animationPlayingRef.current) {
                                  animationTimerRef.current.reset();
                              }
                              requestRender();
                          } else {
                              animationTimerRef.current.reset();
                              cancelScheduledFrame();
                          }
                      });

            intersectionObserver?.observe(container);

            const handleControlsChange = (): void => {
                if (!isApplyingCameraViewRef.current) {
                    setCameraView("custom");
                }

                updateCameraHud();
                requestRender();
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
                requestRender();
            };

            controls.addEventListener("change", handleControlsChange);
            projectionModeApplyRef.current = applyProjectionMode;
            applyProjectionMode(projectionModeRef.current);

            cleanupRenderer = (): void => {
                resizeObserver.disconnect();
                intersectionObserver?.disconnect();
                themeObserver?.disconnect();
                document.removeEventListener(
                    "visibilitychange",
                    handleVisibilityChange,
                );
                cancelScheduledFrame();
                if (requestRenderRef.current === requestRender) {
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
                environmentRequestToken += 1;
                if (environmentResources !== null) {
                    disposeEnvironmentResources(environmentResources);
                    environmentResources = null;
                }
                environmentGenerator.dispose();
                if (environmentApplyRef.current === applyEnvironment) {
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
                applyAircraftAttitude(
                    aircraftAttitudePivot,
                    attitudeSettingsRef.current,
                );
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
                <label className="plane-render__camera-view-control">
                    <span className="plane-render__visually-hidden">
                        相机视角
                    </span>
                    <select
                        aria-label="相机视角"
                        value={cameraView}
                        onChange={handleCameraViewChange}
                    >
                        <option value="custom">自定义视角</option>
                        <option value="fit">适配视图</option>
                        <option value="front">正面</option>
                        <option value="side">侧面</option>
                        <option value="top">顶部</option>
                        <option value="bottom">底部</option>
                    </select>
                </label>
                <label className="plane-render__camera-projection-control">
                    <span className="plane-render__visually-hidden">
                        摄像机投影模式
                    </span>
                    <select
                        aria-label="摄像机投影模式"
                        value={projectionMode}
                        onChange={handleProjectionModeChange}
                    >
                        <option value="perspective">Perspective 透视</option>
                        <option value="orthographic">Orthographic 正交</option>
                    </select>
                </label>
                <button
                    className="plane-render__viewport-action"
                    type="button"
                    disabled={!isSnapshotAvailable}
                    onClick={handleSnapshotExport}
                >
                    导出 PNG
                </button>
                <button
                    className="plane-render__viewport-action"
                    type="button"
                    disabled={!isSnapshotAvailable}
                    onClick={handleSettingsExport}
                >
                    导出设置
                </button>
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
                {/* <div className="plane-render__attitude-controls">
                    <button
                        className="plane-render__attitude-controls-toggle"
                        type="button"
                        aria-controls={attitudeControlsId}
                        aria-expanded={isAttitudeControlsOpen}
                        onClick={handleAttitudeControlsToggle}
                    >
                        {isAttitudeControlsOpen ? "收起姿态" : "飞行姿态"}
                    </button>
                    {isAttitudeControlsOpen ? (
                        <aside
                            id={attitudeControlsId}
                            className="plane-render__render-controls-panel plane-render__attitude-controls-panel"
                            aria-label="飞机飞行姿态控制"
                        >
                            <div className="plane-render__render-controls-heading">
                                <p>Flight Profile</p>
                                <h2>飞行姿态</h2>
                            </div>
                            <div className="plane-render__render-fields">
                                <div
                                    className="plane-render__attitude-presets"
                                    role="group"
                                    aria-label="飞行阶段预设"
                                >
                                    <button
                                        className={`plane-render__attitude-preset${attitudeSettings.preset === "level" ? " plane-render__attitude-preset--active" : ""}`}
                                        type="button"
                                        aria-pressed={
                                            attitudeSettings.preset === "level"
                                        }
                                        onClick={(): void =>
                                            handleAttitudePresetChange("level")
                                        }
                                    >
                                        平飞
                                    </button>
                                    <button
                                        className={`plane-render__attitude-preset${attitudeSettings.preset === "takeoff" ? " plane-render__attitude-preset--active" : ""}`}
                                        type="button"
                                        aria-pressed={
                                            attitudeSettings.preset ===
                                            "takeoff"
                                        }
                                        onClick={(): void =>
                                            handleAttitudePresetChange(
                                                "takeoff",
                                            )
                                        }
                                    >
                                        下降
                                    </button>
                                    <button
                                        className={`plane-render__attitude-preset${attitudeSettings.preset === "descent" ? " plane-render__attitude-preset--active" : ""}`}
                                        type="button"
                                        aria-pressed={
                                            attitudeSettings.preset ===
                                            "descent"
                                        }
                                        onClick={(): void =>
                                            handleAttitudePresetChange(
                                                "descent",
                                            )
                                        }
                                    >
                                        起飞
                                    </button>
                                    <button
                                        className={`plane-render__attitude-preset${attitudeSettings.preset === "landing" ? " plane-render__attitude-preset--active" : ""}`}
                                        type="button"
                                        aria-pressed={
                                            attitudeSettings.preset ===
                                            "landing"
                                        }
                                        onClick={(): void =>
                                            handleAttitudePresetChange(
                                                "landing",
                                            )
                                        }
                                    >
                                        落地
                                    </button>
                                </div>
                                <div className="plane-render__attitude-gizmo">
                                    <div
                                        className={`plane-render__attitude-gizmo-orbit${isAttitudeDragging && attitudeDragRef.current?.mode === "orbit" ? " plane-render__attitude-gizmo--dragging" : ""}`}
                                        role="group"
                                        aria-label="俯仰与偏航控制"
                                        onPointerDown={(
                                            event: PointerEvent<HTMLDivElement>,
                                        ): void =>
                                            handleAttitudePointerDown(
                                                "orbit",
                                                event,
                                            )
                                        }
                                        onPointerMove={
                                            handleAttitudePointerMove
                                        }
                                        onPointerUp={handleAttitudePointerUp}
                                        onPointerCancel={
                                            handleAttitudePointerUp
                                        }
                                    >
                                        <div className="plane-render__attitude-gizmo-grid" />
                                        <span
                                            className="plane-render__attitude-gizmo-center"
                                            aria-hidden="true"
                                        />
                                        <div
                                            className="plane-render__attitude-gizmo-aircraft"
                                            style={{
                                                transform: `rotateX(${attitudeSettings.pitch}deg) rotateY(${attitudeSettings.yaw}deg) rotateZ(${attitudeSettings.roll}deg)`,
                                            }}
                                        >
                                            <svg
                                                className="plane-render__attitude-gizmo-svg"
                                                viewBox="0 0 120 190"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    className="plane-render__attitude-gizmo-svg-wing"
                                                    d="M49 62 9 98v14l40-18v34l-22 19v9l22-11v15l-10 23 21 5 21-5-10-23v-15l22 11v-9L71 128V94l40 18V98L71 62Z"
                                                />
                                                <path
                                                    className="plane-render__attitude-gizmo-svg-fuselage"
                                                    d="M60 6C51 18 48 39 49 62v69l-10 36 21 17 21-17-10-36V62C72 39 69 18 60 6Z"
                                                />
                                                <path
                                                    className="plane-render__attitude-gizmo-svg-cockpit"
                                                    d="M60 20c-6 9-8 18-8 29h16c0-11-2-20-8-29Z"
                                                />
                                                <path
                                                    className="plane-render__attitude-gizmo-svg-highlight"
                                                    d="M57 40v85"
                                                />
                                                <path
                                                    className="plane-render__attitude-gizmo-svg-tail"
                                                    d="m52 132-14 13v8l22-11v-15Zm16 0 14 13v8l-22-11v-15Z"
                                                />
                                            </svg>
                                        </div>
                                        <div
                                            className="plane-render__attitude-gizmo-axis"
                                            aria-hidden="true"
                                        >
                                            <span>俯仰</span>
                                            <span>偏航</span>
                                        </div>
                                    </div>
                                    <div
                                        className={`plane-render__attitude-gizmo-roll${isAttitudeDragging && attitudeDragRef.current?.mode === "roll" ? " plane-render__attitude-gizmo--dragging" : ""}`}
                                        role="presentation"
                                        onPointerDown={(
                                            event: PointerEvent<HTMLDivElement>,
                                        ): void =>
                                            handleAttitudePointerDown(
                                                "roll",
                                                event,
                                            )
                                        }
                                        onPointerMove={
                                            handleAttitudePointerMove
                                        }
                                        onPointerUp={handleAttitudePointerUp}
                                        onPointerCancel={
                                            handleAttitudePointerUp
                                        }
                                    >
                                        <span
                                            className="plane-render__attitude-gizmo-roll-indicator"
                                            style={{
                                                left: `${50 + (attitudeSettings.roll / MAXIMUM_ROLL_ANGLE) * 42}%`,
                                            }}
                                            aria-hidden="true"
                                        />
                                        <span className="plane-render__attitude-gizmo-roll-label">
                                            ROLL
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="plane-render__attitude-native-controls"
                                    role="group"
                                    aria-label="精确姿态角度"
                                >
                                    <label className="plane-render__render-field plane-render__render-field--range">
                                        <span>
                                            俯仰
                                            <output>
                                                {formatAttitudeAngle(
                                                    attitudeSettings.pitch,
                                                )}
                                            </output>
                                        </span>
                                        <input
                                            aria-label="俯仰角度"
                                            type="range"
                                            min={MINIMUM_PITCH_ANGLE}
                                            max={MAXIMUM_PITCH_ANGLE}
                                            step={ATTITUDE_ANGLE_STEP}
                                            value={attitudeSettings.pitch}
                                            onChange={(
                                                event: ChangeEvent<HTMLInputElement>,
                                            ): void =>
                                                handleAttitudeAxisChange(
                                                    "pitch",
                                                    Number(
                                                        event.currentTarget
                                                            .value,
                                                    ),
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="plane-render__render-field plane-render__render-field--range">
                                        <span>
                                            滚转
                                            <output>
                                                {formatAttitudeAngle(
                                                    attitudeSettings.roll,
                                                )}
                                            </output>
                                        </span>
                                        <input
                                            aria-label="滚转角度"
                                            type="range"
                                            min={MINIMUM_ROLL_ANGLE}
                                            max={MAXIMUM_ROLL_ANGLE}
                                            step={ATTITUDE_ANGLE_STEP}
                                            value={attitudeSettings.roll}
                                            onChange={(
                                                event: ChangeEvent<HTMLInputElement>,
                                            ): void =>
                                                handleAttitudeAxisChange(
                                                    "roll",
                                                    Number(
                                                        event.currentTarget
                                                            .value,
                                                    ),
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="plane-render__render-field plane-render__render-field--range">
                                        <span>
                                            偏航
                                            <output>
                                                {formatAttitudeAngle(
                                                    attitudeSettings.yaw,
                                                )}
                                            </output>
                                        </span>
                                        <input
                                            aria-label="偏航角度"
                                            type="range"
                                            min={MINIMUM_YAW_ANGLE}
                                            max={MAXIMUM_YAW_ANGLE}
                                            step={ATTITUDE_ANGLE_STEP}
                                            value={attitudeSettings.yaw}
                                            onChange={(
                                                event: ChangeEvent<HTMLInputElement>,
                                            ): void =>
                                                handleAttitudeAxisChange(
                                                    "yaw",
                                                    Number(
                                                        event.currentTarget
                                                            .value,
                                                    ),
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                <dl
                                    className="plane-render__attitude-readout"
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    <div>
                                        <dt>俯仰</dt>
                                        <dd>
                                            {formatAttitudeAngle(
                                                attitudeSettings.pitch,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>滚转</dt>
                                        <dd>
                                            {formatAttitudeAngle(
                                                attitudeSettings.roll,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>偏航</dt>
                                        <dd>
                                            {formatAttitudeAngle(
                                                attitudeSettings.yaw,
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                                <button
                                    className="plane-render__render-reset"
                                    type="button"
                                    onClick={handleAttitudeReset}
                                >
                                    恢复平飞
                                </button>
                            </div>
                        </aside>
                    ) : null}
                </div> */}
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
            {isFullscreen && isModelDirectoryOpen ? (
                <div
                    id={modelDirectoryId}
                    className="plane-render__fullscreen-model-dir"
                >
                    <ModelDir
                        selectedModelId={selectedModelId}
                        onModelSelection={handleFullscreenModelSelection}
                    />
                </div>
            ) : null}
            {cameraHudState !== null ? <CameraHud state={cameraHudState} /> : null}
            {animationState.available ? (
                <AnimationControls
                    state={animationState}
                    onToggle={handleAnimationToggle}
                    onScrub={handleAnimationScrub}
                />
            ) : null}
            {fullscreenError !== null ? (
                <p className="plane-render__fullscreen-error" role="alert">
                    {fullscreenError}
                </p>
            ) : null}
            {snapshotError !== null ? (
                <p className="plane-render__snapshot-error" role="alert">
                    {snapshotError}
                </p>
            ) : null}
            <div className="plane-render__loading-overlay" aria-hidden="true">
                <span className="plane-render__loading-spinner" />
            </div>
        </div>
    );
};
