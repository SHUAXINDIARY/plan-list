import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type KeyboardEvent,
    type PointerEvent,
    type ReactElement,
} from "react";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    RenderControls,
    type AircraftRenderSettings,
    type AircraftShadowMode,
    type AircraftToneMapping,
} from "./components/RenderControls";
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

/** 飞行姿态面板可切换的预设状态。 */
type AircraftAttitudePreset =
    | "level"
    | "takeoff"
    | "descent"
    | "landing"
    | "custom";

/** 飞行姿态面板中可单独调节的旋转轴。 */
type AircraftAttitudeAxis = "pitch" | "roll" | "yaw";

/** 3D 姿态操控器当前被拖拽的旋转维度。 */
type AircraftAttitudeDragMode = "orbit" | "roll";

/** 一次姿态拖拽开始时记录的指针和角度快照。 */
interface AircraftAttitudeDragState {
    /** 本次拖拽使用的指针标识。 */
    pointerId: number;
    /** 拖拽起点的水平屏幕坐标。 */
    startX: number;
    /** 拖拽起点的垂直屏幕坐标。 */
    startY: number;
    /** 拖拽开始时的俯仰角。 */
    startPitch: number;
    /** 拖拽开始时的滚转角。 */
    startRoll: number;
    /** 拖拽开始时的偏航角。 */
    startYaw: number;
    /** 当前拖拽区域控制的旋转维度。 */
    mode: AircraftAttitudeDragMode;
}

/** 一组以角度表示的飞机旋转参数。 */
interface AircraftAttitudeSettings {
    /** 当前姿态预设，手动调节后变为 custom。 */
    preset: AircraftAttitudePreset;
    /** 机头上下摆动角度，正值表示抬头。 */
    pitch: number;
    /** 机翼左右倾斜角度，正值表示右侧下倾。 */
    roll: number;
    /** 机身水平转向角度，正值表示向右偏航。 */
    yaw: number;
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
/** 渲染倍率滑块允许的最高物理像素比，限制高密度屏幕的 GPU 开销。 */
const MAXIMUM_RENDER_PIXEL_RATIO = 2;
/** 画布内可收起飞行姿态区的 DOM 标识。 */
const ATTITUDE_CONTROLS_ID = "plane-render-attitude-controls";
/** 姿态角度换算为 Three.js 弧度时使用的比例。 */
const DEGREES_TO_RADIANS = Math.PI / 180;
/** 3D 姿态操控器允许的最低俯仰角。 */
const MINIMUM_PITCH_ANGLE = -60;
/** 3D 姿态操控器允许的最高俯仰角。 */
const MAXIMUM_PITCH_ANGLE = 60;
/** 3D 姿态操控器允许的最低滚转角。 */
const MINIMUM_ROLL_ANGLE = -180;
/** 3D 姿态操控器允许的最高滚转角。 */
const MAXIMUM_ROLL_ANGLE = 180;
/** 3D 姿态操控器允许的最低偏航角。 */
const MINIMUM_YAW_ANGLE = -180;
/** 3D 姿态操控器允许的最高偏航角。 */
const MAXIMUM_YAW_ANGLE = 180;
/** 姿态角度控件的离散精度。 */
const ATTITUDE_ANGLE_STEP = 1;
/** 3D 操控器每移动一个屏幕像素对应的俯仰/偏航角度。 */
const ATTITUDE_ORBIT_DRAG_SENSITIVITY = 0.5;
/** 3D 操控器外圈每移动一个屏幕像素对应的滚转角度。 */
const ATTITUDE_ROLL_DRAG_SENSITIVITY = 0.8;
/** 主方向光保持的距离，沿用初始位置 (7, 10, 8) 的向量长度。 */
const KEY_LIGHT_DISTANCE = Math.hypot(7, 10, 8);
/** 主光源水平角的默认值，对应初始位置的方位。 */
const DEFAULT_LIGHT_AZIMUTH = 49;
/** 主光源高度角的默认值，对应初始位置的仰角。 */
const DEFAULT_LIGHT_ELEVATION = 43;

/** 常用飞行阶段对应的姿态角度，便于快速预览空间状态。 */
const ATTITUDE_PRESET_VALUES: Readonly<
    Record<
        Exclude<AircraftAttitudePreset, "custom">,
        Omit<AircraftAttitudeSettings, "preset">
    >
> = {
    level: { pitch: 0, roll: 0, yaw: 0 },
    takeoff: { pitch: 10, roll: 0, yaw: 0 },
    descent: { pitch: -8, roll: 0, yaw: 0 },
    landing: { pitch: 3, roll: 0, yaw: 0 },
};
/** 模型视窗打开时采用的平飞姿态基线。 */
const DEFAULT_ATTITUDE_SETTINGS: AircraftAttitudeSettings = {
    preset: "level",
    pitch: 0,
    roll: 0,
    yaw: 0,
};

/** 模型视窗保留原有画面效果时采用的渲染参数基线。 */
const DEFAULT_RENDER_SETTINGS: Omit<AircraftRenderSettings, "pixelRatio"> = {
    toneMapping: "aces",
    exposure: 1.1,
    shadowsEnabled: true,
    shadowMode: "vsm",
    displayFloor: false,
    lightAzimuth: DEFAULT_LIGHT_AZIMUTH,
    lightElevation: DEFAULT_LIGHT_ELEVATION,
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

/** 将控制面板中的角度单位转换为 Three.js 使用的弧度。 */
const degreesToRadians = (degrees: number): number =>
    degrees * DEGREES_TO_RADIANS;

/** 将姿态面板的三轴角度写入模型根节点，保持模型资源本身不变。 */
const applyAircraftAttitude = (
    model: THREE.Object3D,
    settings: AircraftAttitudeSettings,
): void => {
    model.rotation.set(
        degreesToRadians(settings.pitch),
        degreesToRadians(settings.yaw),
        degreesToRadians(settings.roll),
    );
};

/** 为姿态角度生成带方向符号的紧凑读数。 */
const formatAttitudeAngle = (angle: number): string =>
    `${angle > 0 ? "+" : ""}${angle}°`;

/** 将拖拽计算出的角度限制在指定的安全范围内。 */
const clampAngle = (angle: number, minimum: number, maximum: number): number =>
    Math.min(Math.max(angle, minimum), maximum);

/** 根据水平角和高度角重新计算主方向光位置，保持光源距离与强度不变。 */
const applyKeyLightDirection = (
    light: THREE.DirectionalLight,
    azimuth: number,
    elevation: number,
): void => {
    const azimuthRadians = degreesToRadians(azimuth);
    const elevationRadians = degreesToRadians(elevation);
    const horizontalDistance =
        KEY_LIGHT_DISTANCE * Math.cos(elevationRadians);

    light.position.set(
        horizontalDistance * Math.cos(azimuthRadians),
        KEY_LIGHT_DISTANCE * Math.sin(elevationRadians),
        horizontalDistance * Math.sin(azimuthRadians),
    );
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
    const aircraftModelRef = useRef<THREE.Object3D | null>(null);
    const displayFloorRef = useRef<THREE.Mesh | null>(null);
    const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isRenderControlsOpen, setIsRenderControlsOpen] =
        useState<boolean>(false);
    const [isAttitudeControlsOpen, setIsAttitudeControlsOpen] =
        useState<boolean>(false);
    const [fullscreenError, setFullscreenError] = useState<string | null>(
        null,
    );
    const [renderSettings, setRenderSettings] =
        useState<AircraftRenderSettings>(createDefaultRenderSettings);
    const [attitudeSettings, setAttitudeSettings] =
        useState<AircraftAttitudeSettings>(DEFAULT_ATTITUDE_SETTINGS);
    const renderSettingsRef = useRef<AircraftRenderSettings>(renderSettings);
    const attitudeSettingsRef =
        useRef<AircraftAttitudeSettings>(attitudeSettings);
    const attitudeDragRef = useRef<AircraftAttitudeDragState | null>(null);
    const [isAttitudeDragging, setIsAttitudeDragging] =
        useState<boolean>(false);

    renderSettingsRef.current = renderSettings;
    attitudeSettingsRef.current = attitudeSettings;

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

    /** 切换画布内飞行姿态面板，保留模型目录和轨道操作的空间。 */
    const handleAttitudeControlsToggle = (): void => {
        setIsAttitudeControlsOpen((isOpen: boolean): boolean => !isOpen);
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

    /** 切换飞机底部展示平面的可见性，默认保持纯模型画面。 */
    const handleDisplayFloorChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const displayFloor = event.currentTarget.checked;

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                displayFloor,
            }),
        );
    };

    /** 更新主方向光的水平角度，实时改变模型的侧向受光。 */
    const handleLightAzimuthChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const lightAzimuth = Number(event.currentTarget.value);

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                lightAzimuth,
            }),
        );
    };

    /** 更新主方向光的高度角，实时改变模型顶部与底部的明暗关系。 */
    const handleLightElevationChange = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        const lightElevation = Number(event.currentTarget.value);

        setRenderSettings(
            (currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
                ...currentSettings,
                lightElevation,
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

    /** 应用一组飞行阶段预设，并将手动角度同步至三维模型。 */
    const handleAttitudePresetChange = (
        preset: Exclude<AircraftAttitudePreset, "custom">,
    ): void => {
        const presetSettings = ATTITUDE_PRESET_VALUES[preset];

        setAttitudeSettings({
            preset,
            ...presetSettings,
        });
    };

    /** 更新单个姿态轴，并将预设标记为自定义，保留其他轴当前值。 */
    const handleAttitudeAxisChange = (
        axis: AircraftAttitudeAxis,
        value: number,
    ): void => {
        setAttitudeSettings(
            (currentSettings: AircraftAttitudeSettings): AircraftAttitudeSettings => ({
                ...currentSettings,
                preset: "custom",
                [axis]: value,
            }),
        );
    };

    /** 将模型姿态恢复为平飞状态，不改变渲染器或相机参数。 */
    const handleAttitudeReset = (): void => {
        setAttitudeSettings(DEFAULT_ATTITUDE_SETTINGS);
    };

    /** 为可访问的 3D 操控区域提供方向键调整和 Shift 加速。 */
    const handleAttitudeKeyDown = (
        mode: AircraftAttitudeDragMode,
        event: KeyboardEvent<HTMLDivElement>,
    ): void => {
        const step = event.shiftKey ? 5 : 1;

        if (mode === "roll") {
            if (event.key === "ArrowLeft") {
                handleAttitudeAxisChange(
                    "roll",
                    clampAngle(
                        attitudeSettings.roll - step,
                        MINIMUM_ROLL_ANGLE,
                        MAXIMUM_ROLL_ANGLE,
                    ),
                );
            } else if (event.key === "ArrowRight") {
                handleAttitudeAxisChange(
                    "roll",
                    clampAngle(
                        attitudeSettings.roll + step,
                        MINIMUM_ROLL_ANGLE,
                        MAXIMUM_ROLL_ANGLE,
                    ),
                );
            } else {
                return;
            }
        } else if (event.key === "ArrowUp") {
            handleAttitudeAxisChange(
                "pitch",
                clampAngle(
                    attitudeSettings.pitch + step,
                    MINIMUM_PITCH_ANGLE,
                    MAXIMUM_PITCH_ANGLE,
                ),
            );
        } else if (event.key === "ArrowDown") {
            handleAttitudeAxisChange(
                "pitch",
                clampAngle(
                    attitudeSettings.pitch - step,
                    MINIMUM_PITCH_ANGLE,
                    MAXIMUM_PITCH_ANGLE,
                ),
            );
        } else if (event.key === "ArrowLeft") {
            handleAttitudeAxisChange(
                "yaw",
                clampAngle(
                    attitudeSettings.yaw - step,
                    MINIMUM_YAW_ANGLE,
                    MAXIMUM_YAW_ANGLE,
                ),
            );
        } else if (event.key === "ArrowRight") {
            handleAttitudeAxisChange(
                "yaw",
                clampAngle(
                    attitudeSettings.yaw + step,
                    MINIMUM_YAW_ANGLE,
                    MAXIMUM_YAW_ANGLE,
                ),
            );
        } else {
            return;
        }

        event.preventDefault();
    };

    /** 记录 3D 操控器拖拽起点，后续移动量会转换为姿态角度。 */
    const handleAttitudePointerDown = (
        mode: AircraftAttitudeDragMode,
        event: PointerEvent<HTMLDivElement>,
    ): void => {
        if (event.button !== 0) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        attitudeDragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startPitch: attitudeSettings.pitch,
            startRoll: attitudeSettings.roll,
            startYaw: attitudeSettings.yaw,
            mode,
        };
        setIsAttitudeDragging(true);
        event.preventDefault();
    };

    /** 将 3D 操控器的屏幕位移换算为俯仰、偏航或滚转角度。 */
    const handleAttitudePointerMove = (
        event: PointerEvent<HTMLDivElement>,
    ): void => {
        const dragState = attitudeDragRef.current;

        if (dragState === null || dragState.pointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        if (dragState.mode === "roll") {
            setAttitudeSettings({
                preset: "custom",
                pitch: dragState.startPitch,
                roll: clampAngle(
                    dragState.startRoll +
                        deltaX * ATTITUDE_ROLL_DRAG_SENSITIVITY,
                    MINIMUM_ROLL_ANGLE,
                    MAXIMUM_ROLL_ANGLE,
                ),
                yaw: dragState.startYaw,
            });
        } else {
            setAttitudeSettings({
                preset: "custom",
                pitch: clampAngle(
                    dragState.startPitch -
                        deltaY * ATTITUDE_ORBIT_DRAG_SENSITIVITY,
                    MINIMUM_PITCH_ANGLE,
                    MAXIMUM_PITCH_ANGLE,
                ),
                roll: dragState.startRoll,
                yaw: clampAngle(
                    dragState.startYaw +
                        deltaX * ATTITUDE_ORBIT_DRAG_SENSITIVITY,
                    MINIMUM_YAW_ANGLE,
                    MAXIMUM_YAW_ANGLE,
                ),
            });
        }
    };

    /** 结束一次姿态拖拽并释放指针捕获，避免拖出控件后继续修改模型。 */
    const handleAttitudePointerUp = (
        event: PointerEvent<HTMLDivElement>,
    ): void => {
        const dragState = attitudeDragRef.current;

        if (dragState === null || dragState.pointerId !== event.pointerId) {
            return;
        }

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        attitudeDragRef.current = null;
        setIsAttitudeDragging(false);
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

    useEffect((): void => {
        const displayFloor = displayFloorRef.current;

        if (displayFloor === null) {
            return;
        }

        displayFloor.visible = renderSettings.displayFloor;
    }, [renderSettings.displayFloor]);

    useEffect((): void => {
        const keyLight = keyLightRef.current;

        if (keyLight === null) {
            return;
        }

        applyKeyLightDirection(
            keyLight,
            renderSettings.lightAzimuth,
            renderSettings.lightElevation,
        );
    }, [renderSettings.lightAzimuth, renderSettings.lightElevation]);

    useEffect((): void => {
        const model = aircraftModelRef.current;

        if (model === null) {
            return;
        }

        applyAircraftAttitude(model, attitudeSettings);
    }, [attitudeSettings]);

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
            applyKeyLightDirection(
                keyLight,
                renderSettingsRef.current.lightAzimuth,
                renderSettingsRef.current.lightElevation,
            );
            keyLight.castShadow = true;
            keyLightRef.current = keyLight;
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
            displayFloor.visible = renderSettingsRef.current.displayFloor;
            displayFloorRef.current = displayFloor;
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

                if (aircraftModelRef.current !== null) {
                    aircraftModelRef.current = null;
                }

                if (displayFloorRef.current === displayFloor) {
                    displayFloorRef.current = null;
                }

                if (keyLightRef.current === keyLight) {
                    keyLightRef.current = null;
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
                applyAircraftAttitude(model, attitudeSettingsRef.current);
                scene.add(model);
                aircraftModelRef.current = model;
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
            <div className="plane-render__viewport-tools">
                <RenderControls
                    isOpen={isRenderControlsOpen}
                    settings={renderSettings}
                    onToggle={handleRenderControlsToggle}
                    onToneMappingChange={handleToneMappingChange}
                    onExposureChange={handleExposureChange}
                    onPixelRatioChange={handlePixelRatioChange}
                    onLightAzimuthChange={handleLightAzimuthChange}
                    onLightElevationChange={handleLightElevationChange}
                    onShadowsEnabledChange={handleShadowsEnabledChange}
                    onDisplayFloorChange={handleDisplayFloorChange}
                    onShadowModeChange={handleShadowModeChange}
                    onReset={handleRenderSettingsReset}
                />
                <div className="plane-render__attitude-controls">
                    <button
                        className="plane-render__attitude-controls-toggle"
                        type="button"
                        aria-controls={ATTITUDE_CONTROLS_ID}
                        aria-expanded={isAttitudeControlsOpen}
                        onClick={handleAttitudeControlsToggle}
                    >
                        {isAttitudeControlsOpen ? "收起姿态" : "飞行姿态"}
                    </button>
                    {isAttitudeControlsOpen ? (
                        <aside
                            id={ATTITUDE_CONTROLS_ID}
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
                                            attitudeSettings.preset === "takeoff"
                                        }
                                        onClick={(): void =>
                                            handleAttitudePresetChange("takeoff")
                                        }
                                    >
                                        起飞
                                    </button>
                                    <button
                                        className={`plane-render__attitude-preset${attitudeSettings.preset === "descent" ? " plane-render__attitude-preset--active" : ""}`}
                                        type="button"
                                        aria-pressed={
                                            attitudeSettings.preset === "descent"
                                        }
                                        onClick={(): void =>
                                            handleAttitudePresetChange("descent")
                                        }
                                    >
                                        下降
                                    </button>
                                    <button
                                        className={`plane-render__attitude-preset${attitudeSettings.preset === "landing" ? " plane-render__attitude-preset--active" : ""}`}
                                        type="button"
                                        aria-pressed={
                                            attitudeSettings.preset === "landing"
                                        }
                                        onClick={(): void =>
                                            handleAttitudePresetChange("landing")
                                        }
                                    >
                                        落地
                                    </button>
                                </div>
                                <div className="plane-render__attitude-gizmo">
                                    <div
                                        className={`plane-render__attitude-gizmo-orbit${isAttitudeDragging && attitudeDragRef.current?.mode === "orbit" ? " plane-render__attitude-gizmo--dragging" : ""}`}
                                        role="slider"
                                        tabIndex={0}
                                        aria-label="俯仰与偏航控制"
                                        aria-valuemin={MINIMUM_PITCH_ANGLE}
                                        aria-valuemax={MAXIMUM_PITCH_ANGLE}
                                        aria-valuenow={attitudeSettings.pitch}
                                        aria-valuetext={`俯仰 ${formatAttitudeAngle(attitudeSettings.pitch)}，偏航 ${formatAttitudeAngle(attitudeSettings.yaw)}`}
                                        onPointerDown={(
                                            event: PointerEvent<HTMLDivElement>,
                                        ): void =>
                                            handleAttitudePointerDown(
                                                "orbit",
                                                event,
                                            )
                                        }
                                        onPointerMove={handleAttitudePointerMove}
                                        onPointerUp={handleAttitudePointerUp}
                                        onPointerCancel={handleAttitudePointerUp}
                                        onKeyDown={(
                                            event: KeyboardEvent<HTMLDivElement>,
                                        ): void =>
                                            handleAttitudeKeyDown("orbit", event)
                                        }
                                    >
                                        <div className="plane-render__attitude-gizmo-grid" />
                                        <div
                                            className="plane-render__attitude-gizmo-aircraft"
                                            style={{
                                                transform: `rotateX(${attitudeSettings.pitch}deg) rotateY(${attitudeSettings.yaw}deg) rotateZ(${attitudeSettings.roll}deg)`,
                                            }}
                                        >
                                            <span className="plane-render__attitude-gizmo-fuselage" />
                                            <span className="plane-render__attitude-gizmo-wing plane-render__attitude-gizmo-wing--left" />
                                            <span className="plane-render__attitude-gizmo-wing plane-render__attitude-gizmo-wing--right" />
                                            <span className="plane-render__attitude-gizmo-tail" />
                                        </div>
                                        <span className="plane-render__attitude-gizmo-axis">
                                            PITCH / YAW
                                        </span>
                                    </div>
                                    <div
                                        className={`plane-render__attitude-gizmo-roll${isAttitudeDragging && attitudeDragRef.current?.mode === "roll" ? " plane-render__attitude-gizmo--dragging" : ""}`}
                                        role="slider"
                                        tabIndex={0}
                                        aria-label="滚转控制"
                                        aria-valuemin={MINIMUM_ROLL_ANGLE}
                                        aria-valuemax={MAXIMUM_ROLL_ANGLE}
                                        aria-valuenow={attitudeSettings.roll}
                                        aria-valuetext={`滚转 ${formatAttitudeAngle(attitudeSettings.roll)}`}
                                        onPointerDown={(
                                            event: PointerEvent<HTMLDivElement>,
                                        ): void =>
                                            handleAttitudePointerDown(
                                                "roll",
                                                event,
                                            )
                                        }
                                        onPointerMove={handleAttitudePointerMove}
                                        onPointerUp={handleAttitudePointerUp}
                                        onPointerCancel={handleAttitudePointerUp}
                                        onKeyDown={(
                                            event: KeyboardEvent<HTMLDivElement>,
                                        ): void =>
                                            handleAttitudeKeyDown("roll", event)
                                        }
                                    >
                                        <span>ROLL</span>
                                    </div>
                                </div>
                                <dl className="plane-render__attitude-readout">
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
                </div>
                <button
                    className="plane-render__fullscreen-button"
                    type="button"
                    aria-pressed={isFullscreen}
                    onClick={handleFullscreenToggle}
                >
                    {isFullscreen ? "退出全屏" : "全屏查看"}
                </button>
            </div>
            {fullscreenError !== null ? (
                <p className="plane-render__fullscreen-error" role="alert">
                    {fullscreenError}
                </p>
            ) : null}
        </div>
    );
};
