import {
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type PointerEvent,
    type RefObject,
    type ReactElement,
    useId,
} from "react";
import * as THREE from "three";
import { PMREMGenerator, WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    RenderControls,
    type AircraftRenderSettings,
    type AircraftRenderQuality,
    type AircraftLightingPreset,
    type AircraftShadowMode,
    type AircraftToneMapping,
} from "./components/RenderControls";
import {
    applyAircraftLightingSettings,
    createAircraftLightingRig,
    createRoomEnvironmentResources,
    disposeEnvironmentResources,
    disposeHdriEnvironment,
    loadHdriEnvironment,
    type AircraftEnvironmentPreset,
    type AircraftEnvironmentResources,
    type AircraftLightingRig,
} from "./lighting";
import ModelDir from "./ModelDir";
import type { AircraftModelAsset } from "./modelAssets";

/** 模型视窗当前所处的初始化或加载阶段。 */
export type AircraftModelLoadingPhase =
    | "initializing"
    | "loading"
    | "ready"
    | "error";

/** 当前 WebGPU 渲染后端的可读状态。 */
export type AircraftRendererStatus =
    | "initializing"
    | "webgpu"
    | "unavailable"
    | "lost";

/** 当前模型资源加载所处的细分阶段。 */
export type AircraftModelLoadingStage = "renderer" | "downloading" | "parsing";

/** 模型目录加载进度，供页面显示可访问的状态信息。 */
export interface AircraftModelLoadingProgress {
    /** 当前渲染器或模型资源的处理阶段。 */
    phase: AircraftModelLoadingPhase;
    /** 已成功加入 Three.js 场景的模型数量。 */
    loadedModelCount: number;
    /** 无法加载的模型数量。 */
    failedModelCount: number;
    /** 当前渲染后端状态，避免页面在错误时仍显示 WebGPU 已就绪。 */
    rendererStatus: AircraftRendererStatus;
    /** loading 阶段的细分步骤。 */
    loadingStage?: AircraftModelLoadingStage;
    /** 可获得 Content-Length 时的资源下载比例，范围为 0 到 1。 */
    progressRatio?: number;
    /** 初始化或全部加载失败时展示的具体原因。 */
    message?: string;
}

/** 模型视窗的输入数据和对外状态回调。 */
interface AircraftModelViewportProps {
    /** 当前需要加载并渲染的单个 GLB 模型资源。 */
    asset: AircraftModelAsset | undefined;
    /** 当前页面选中的模型 ID，用于同步全屏目录的 active 状态。 */
    selectedModelId: string;
    /** 向页面报告 WebGPU 初始化和模型加载进度。 */
    onLoadingProgressChange: (progress: AircraftModelLoadingProgress) => void;
    /** 从全屏目录选择模型后通知页面重新加载对应资源。 */
    onModelSelection: (modelId: string) => void;
    /** 页面级完整视窗元素，全屏时应包含画布、状态和元信息。 */
    fullscreenTargetRef: RefObject<HTMLElement | null>;
    /** 当前模型重试序号，变化时强制重新初始化渲染器和资源请求。 */
    retryToken: number;
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

/** 当前 GLB 是否包含可播放动画，以及播放位置和时长。 */
interface AircraftAnimationState {
    /** 当前模型是否存在可播放的第一段动画。 */
    available: boolean;
    /** 当前动画名称，资源未命名时使用生成名称。 */
    name: string;
    /** 当前动画总时长，单位为秒。 */
    duration: number;
    /** 当前动画时间，单位为秒。 */
    currentTime: number;
    /** 当前是否正在播放动画。 */
    isPlaying: boolean;
}

/** 相机 HUD 中单个世界轴投影到屏幕后的显示参数。 */
interface AircraftCameraHudAxis {
    /** 轴线相对于屏幕水平向右方向的角度。 */
    angle: number;
    /** 轴线的可见度，用于弱化背向相机的轴。 */
    opacity: number;
}

/** 相机 HUD 展示的观察方位和世界轴投影状态。 */
interface AircraftCameraHudState {
    /** 相机相对于 controls.target 的方位角。 */
    azimuth: number;
    /** 相机相对于 controls.target 的俯仰角。 */
    elevation: number;
    /** 相机相对于 controls.target 的距离。 */
    distance: number;
    /** 世界 X 轴在当前相机画面中的投影。 */
    axisX: AircraftCameraHudAxis;
    /** 世界 Y 轴在当前相机画面中的投影。 */
    axisY: AircraftCameraHudAxis;
    /** 世界 Z 轴在当前相机画面中的投影。 */
    axisZ: AircraftCameraHudAxis;
}

/** 相机视角菜单支持的标准方向和自动适配状态。 */
type AircraftCameraView =
    | "custom"
    | "fit"
    | "front"
    | "side"
    | "top"
    | "bottom";

/** 归一化后单架模型的最大尺寸，确保不同机型能在同一场景对比。 */
const NORMALIZED_MODEL_MAX_SIZE = 1.35;
/** 允许近距离检查机身细节时的相机最小距离。 */
const MINIMUM_CAMERA_DISTANCE = 0.45;
/** 允许完整检查模型外形时的相机最大距离。 */
const MAXIMUM_CAMERA_DISTANCE = 80;
/** 相机允许接近极点的安全角度，避免 OrbitControls 翻转。 */
const POLAR_ANGLE_MARGIN = 0.08;
/** 提升滚轮和双指缩放的响应速度，便于在全屏时检查细节。 */
const MODEL_VIEWER_ZOOM_SPEED = 1.15;
/** WebGPU 不可用时的用户可见提示。 */
const WEBGPU_UNAVAILABLE_MESSAGE = "当前浏览器或设备未提供 WebGPU 支持。";
/** WebGPU 初始化失败时的用户可见提示。 */
const WEBGPU_INITIALIZATION_ERROR_MESSAGE = "WebGPU 渲染器初始化失败。";
/** WebGPU 设备运行中丢失时的用户可见提示。 */
const WEBGPU_DEVICE_LOST_MESSAGE = "WebGPU 设备已丢失，请重试当前模型。";
/** 模型目录为空时的用户可见提示。 */
const EMPTY_MODEL_DIRECTORY_MESSAGE = "模型目录中没有可加载的 GLB 文件。";
/** 当前选中模型加载失败时的用户可见提示。 */
const CURRENT_MODEL_FAILED_MESSAGE = "当前模型未能加载。";
/** 浏览器拒绝全屏请求时的用户可见提示。 */
const FULLSCREEN_REQUEST_ERROR_MESSAGE = "当前浏览器无法进入全屏查看。";
/** 当前模型或浏览器尚不具备截图条件时的用户可见提示。 */
const SNAPSHOT_UNAVAILABLE_MESSAGE = "当前模型尚未就绪，无法导出。";
/** 浏览器生成 PNG 失败时的用户可见提示。 */
const SNAPSHOT_EXPORT_ERROR_MESSAGE = "当前浏览器无法生成模型截图。";
/** 工作室设置导出失败时的用户可见提示。 */
const SETTINGS_EXPORT_ERROR_MESSAGE = "当前模型设置无法导出。";
/** GLB 未提供动画名称时显示的回退名称。 */
const DEFAULT_MODEL_ANIMATION_NAME = "模型动画";
/** 工作室地面颜色 token，在深浅主题下由 App.css 提供值。 */
const MODEL_FLOOR_COLOR_TOKEN = "--pl-model-floor-color";
/** 工作室主光颜色 token，在深浅主题下由 App.css 提供值。 */
const MODEL_KEY_LIGHT_COLOR_TOKEN = "--pl-model-key-light-color";
/** 工作室补光颜色 token，在深浅主题下由 App.css 提供值。 */
const MODEL_FILL_LIGHT_COLOR_TOKEN = "--pl-model-fill-light-color";
/** 工作室轮廓光颜色 token，在深浅主题下由 App.css 提供值。 */
const MODEL_RIM_LIGHT_COLOR_TOKEN = "--pl-model-rim-light-color";
/** 渲染倍率默认采用的最高物理像素比，兼顾清晰度与常规设备性能。 */
const DEFAULT_RENDER_PIXEL_RATIO = 2;
/** 姿态角度换算为 Three.js 弧度时使用的比例。 */
const DEGREES_TO_RADIANS = Math.PI / 180;
/** 需要进行导入姿态校正的 FR24 GLB 资源路径前缀。 */
const FR24_MODEL_SOURCE_PREFIX = "fr24-3d-models-glbv2/models/";
/** FR24 模型以 -Z 为机头方向，绕 Y 轴 180° 后与视窗 +Z 前方约定一致。 */
const FR24_MODEL_FORWARD_CORRECTION = Math.PI;
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
/** 3D 操控器每移动一个屏幕像素对应的俯仰/偏航角度。 */
const ATTITUDE_ORBIT_DRAG_SENSITIVITY = 0.5;
/** 3D 操控器外圈每移动一个屏幕像素对应的滚转角度。 */
const ATTITUDE_ROLL_DRAG_SENSITIVITY = 0.8;
/** 原生姿态 range 每次键盘或指针调整的角度步长。 */
const ATTITUDE_ANGLE_STEP = 1;
/** 飞机姿态使用航空常见的偏航、俯仰、滚转组合顺序。 */
const AIRCRAFT_ROTATION_ORDER: THREE.EulerOrder = "YXZ";
/** 初始相机 fit 为模型包围球保留的可视边距。 */
const CAMERA_FIT_MARGIN = 1.18;
/** 相机标准视角对应的观察方向，坐标系以 Y 轴向上。 */
const CAMERA_VIEW_DIRECTIONS: Readonly<
    Record<Exclude<AircraftCameraView, "custom">, THREE.Vector3Tuple>
> = {
    fit: [0.8, 0.5, 1],
    front: [0, 0, 1],
    side: [1, 0, 0],
    top: [0, 1, 0],
    bottom: [0, -1, 0],
};

/** 初始动画状态，模型无动画时不渲染播放控件。 */
const EMPTY_ANIMATION_STATE: AircraftAnimationState = {
    available: false,
    name: "",
    duration: 0,
    currentTime: 0,
    isPlaying: false,
};
/** 尚未建立相机和模型关系时不显示观察 HUD。 */
const EMPTY_CAMERA_HUD_STATE: AircraftCameraHudState | null = null;
/** 主方向光 X 轴的默认位置。 */
const DEFAULT_LIGHT_POSITION_X = 7;
/** 主方向光 Y 轴的默认位置。 */
const DEFAULT_LIGHT_POSITION_Y = 10;
/** 主方向光 Z 轴的默认位置。 */
const DEFAULT_LIGHT_POSITION_Z = 8;
/** 主方向光默认强度，保持模型轮廓和阴影可读。 */
const DEFAULT_KEY_LIGHT_INTENSITY = 3.2;
/** 默认冷色补光强度，保留现有视窗的暗部亮度。 */
const DEFAULT_FILL_LIGHT_INTENSITY = 1.2;
/** 默认关闭轮廓光，避免改变既有 neutral 画面。 */
const DEFAULT_RIM_LIGHT_INTENSITY = 0;
/** 内置 RoomEnvironment 的环境反射强度。 */
const DEFAULT_ENVIRONMENT_INTENSITY = 0.45;
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
    qualityPreset: "balanced",
    lightingPreset: "neutral",
    toneMapping: "aces",
    exposure: 1.1,
    shadowsEnabled: true,
    shadowMode: "vsm",
    displayFloor: false,
    lightPositionX: DEFAULT_LIGHT_POSITION_X,
    lightPositionY: DEFAULT_LIGHT_POSITION_Y,
    lightPositionZ: DEFAULT_LIGHT_POSITION_Z,
    keyLightIntensity: DEFAULT_KEY_LIGHT_INTENSITY,
    fillLightIntensity: DEFAULT_FILL_LIGHT_INTENSITY,
    rimLightIntensity: DEFAULT_RIM_LIGHT_INTENSITY,
    environmentPreset: "room",
    hdriUrl: "",
    environmentIntensity: DEFAULT_ENVIRONMENT_INTENSITY,
};

/** 工作室照明预设，调整主光方向和强度，保留用户对色调和曝光的选择。 */
const LIGHTING_PRESET_VALUES: Readonly<
    Record<
        Exclude<AircraftLightingPreset, "custom">,
        Pick<
            AircraftRenderSettings,
            | "lightPositionX"
            | "lightPositionY"
            | "lightPositionZ"
            | "keyLightIntensity"
            | "fillLightIntensity"
            | "rimLightIntensity"
        >
    >
> = {
    neutral: {
        lightPositionX: DEFAULT_LIGHT_POSITION_X,
        lightPositionY: DEFAULT_LIGHT_POSITION_Y,
        lightPositionZ: DEFAULT_LIGHT_POSITION_Z,
        keyLightIntensity: DEFAULT_KEY_LIGHT_INTENSITY,
        fillLightIntensity: DEFAULT_FILL_LIGHT_INTENSITY,
        rimLightIntensity: DEFAULT_RIM_LIGHT_INTENSITY,
    },
    silhouette: {
        lightPositionX: -8,
        lightPositionY: 6,
        lightPositionZ: -10,
        keyLightIntensity: 3.8,
        fillLightIntensity: 0.65,
        rimLightIntensity: 1.8,
    },
    top: {
        lightPositionX: 0,
        lightPositionY: 14,
        lightPositionZ: 2,
        keyLightIntensity: 3,
        fillLightIntensity: 1,
        rimLightIntensity: 0.9,
    },
    "three-point": {
        lightPositionX: 7,
        lightPositionY: 10,
        lightPositionZ: 8,
        keyLightIntensity: 3.2,
        fillLightIntensity: 1.25,
        rimLightIntensity: 2.1,
    },
};

/** 质量预设可直接修改的渲染参数，不覆盖曝光、色调映射和灯光位置。 */
const RENDER_QUALITY_PRESET_VALUES: Readonly<
    Record<
        Exclude<AircraftRenderQuality, "custom">,
        Pick<
            AircraftRenderSettings,
            "pixelRatio" | "shadowsEnabled" | "shadowMode"
        >
    >
> = {
    performance: {
        pixelRatio: 1,
        shadowsEnabled: false,
        shadowMode: "pcf",
    },
    balanced: {
        pixelRatio: 1.5,
        shadowsEnabled: true,
        shadowMode: "vsm",
    },
    quality: {
        pixelRatio: 2,
        shadowsEnabled: true,
        shadowMode: "vsm",
    },
};

/** 读取设备像素比并限制在当前视窗的基础安全上限内。 */
const getDevicePixelRatio = (): number =>
    typeof window === "undefined"
        ? 1
        : Math.min(window.devicePixelRatio || 1, 2);

/** 根据设备像素比解析质量预设，避免低 DPI 设备被强制放大。 */
const getQualityPresetSettings = (
    qualityPreset: Exclude<AircraftRenderQuality, "custom">,
): Pick<
    AircraftRenderSettings,
    "pixelRatio" | "shadowsEnabled" | "shadowMode"
> => {
    const presetSettings = RENDER_QUALITY_PRESET_VALUES[qualityPreset];

    return {
        ...presetSettings,
        pixelRatio: Math.min(presetSettings.pixelRatio, getDevicePixelRatio()),
    };
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

/** 建立渲染控制面板的默认设置，高 DPI 设备最多使用 2x。 */
const createDefaultRenderSettings = (): AircraftRenderSettings => ({
    ...DEFAULT_RENDER_SETTINGS,
    pixelRatio: Math.min(
        RENDER_QUALITY_PRESET_VALUES.balanced.pixelRatio,
        getDevicePixelRatio(),
        DEFAULT_RENDER_PIXEL_RATIO,
    ),
});

/** 校验 select 元素的字符串值是否为已支持的色调映射预设。 */
const isAircraftToneMapping = (value: string): value is AircraftToneMapping =>
    value === "aces" ||
    value === "agx" ||
    value === "neutral" ||
    value === "none";

/** 校验 select 元素的字符串值是否为已支持的 WebGPU 阴影算法。 */
const isAircraftShadowMode = (value: string): value is AircraftShadowMode =>
    value === "pcf" || value === "vsm";

/** 校验相机视角菜单的字符串值是否为已支持的标准视角。 */
const isAircraftCameraView = (value: string): value is AircraftCameraView =>
    value === "custom" ||
    value === "fit" ||
    value === "front" ||
    value === "side" ||
    value === "top" ||
    value === "bottom";

/** 校验画质预设 select 的字符串值是否为已支持的质量档位。 */
const isAircraftRenderQuality = (
    value: string,
): value is AircraftRenderQuality =>
    value === "performance" ||
    value === "balanced" ||
    value === "quality" ||
    value === "custom";

/** 校验照明预设 select 的字符串值是否为已支持的档位。 */
const isAircraftLightingPreset = (
    value: string,
): value is AircraftLightingPreset =>
    value === "neutral" ||
    value === "silhouette" ||
    value === "top" ||
    value === "three-point" ||
    value === "custom";

/** 校验环境来源 select 的字符串值是否为已支持的环境类型。 */
const isAircraftEnvironmentPreset = (
    value: string,
): value is AircraftEnvironmentPreset => value === "room" || value === "hdri";

/** 从当前主题读取颜色 token，缺失时返回模型视窗的稳定回退值。 */
const readThemeColor = (token: string, fallback: string): string => {
    if (typeof document === "undefined") {
        return fallback;
    }

    return (
        getComputedStyle(document.documentElement)
            .getPropertyValue(token)
            .trim() || fallback
    );
};

/** 将截图或设置 JSON 转为浏览器下载，下载后立即释放临时 URL。 */
const downloadBlob = (blob: Blob, fileName: string): void => {
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout((): void => {
        URL.revokeObjectURL(downloadUrl);
    }, 0);
};

/** 将世界轴投影为 HUD 中的屏幕线段，并按朝向调整可见度。 */
const getCameraHudAxis = (
    axis: THREE.Vector3,
    inverseCameraQuaternion: THREE.Quaternion,
): AircraftCameraHudAxis => {
    const cameraAxis = axis.clone().applyQuaternion(inverseCameraQuaternion);
    const screenAngle =
        Math.atan2(-cameraAxis.y, cameraAxis.x) / DEGREES_TO_RADIANS || 0;

    return {
        angle: screenAngle,
        opacity: 0.34 + Math.abs(cameraAxis.z) * 0.5,
    };
};

/** 读取相机相对观察目标的球面方位和世界轴投影。 */
const getCameraHudState = (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
): AircraftCameraHudState => {
    const offset = camera.position.clone().sub(controls.target);
    const horizontalDistance = Math.hypot(offset.x, offset.z);
    const inverseCameraQuaternion = camera.quaternion.clone().invert();

    return {
        azimuth: Math.atan2(offset.x, offset.z) / DEGREES_TO_RADIANS,
        elevation:
            Math.atan2(offset.y, horizontalDistance) / DEGREES_TO_RADIANS,
        distance: offset.length(),
        axisX: getCameraHudAxis(
            new THREE.Vector3(1, 0, 0),
            inverseCameraQuaternion,
        ),
        axisY: getCameraHudAxis(
            new THREE.Vector3(0, 1, 0),
            inverseCameraQuaternion,
        ),
        axisZ: getCameraHudAxis(
            new THREE.Vector3(0, 0, 1),
            inverseCameraQuaternion,
        ),
    };
};

/** 判断 HUD 数值变化是否超过用户可感知阈值，避免每帧触发 React 重渲染。 */
const isCameraHudStateEqual = (
    currentState: AircraftCameraHudState | null,
    nextState: AircraftCameraHudState,
): boolean => {
    if (currentState === null) {
        return false;
    }

    const isAxisEqual = (
        currentAxis: AircraftCameraHudAxis,
        nextAxis: AircraftCameraHudAxis,
    ): boolean =>
        Math.abs(currentAxis.angle - nextAxis.angle) < 0.2 &&
        Math.abs(currentAxis.opacity - nextAxis.opacity) < 0.02;

    return (
        Math.abs(currentState.azimuth - nextState.azimuth) < 0.2 &&
        Math.abs(currentState.elevation - nextState.elevation) < 0.2 &&
        Math.abs(currentState.distance - nextState.distance) < 0.01 &&
        isAxisEqual(currentState.axisX, nextState.axisX) &&
        isAxisEqual(currentState.axisY, nextState.axisY) &&
        isAxisEqual(currentState.axisZ, nextState.axisZ)
    );
};

/** 为相机 HUD 生成带方向符号的角度读数。 */
const formatCameraHudAngle = (angle: number): string =>
    `${angle > 0 ? "+" : ""}${Math.round(angle)}°`;

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

/** 将模型资源的导入坐标方向统一到视窗约定的机头朝 +Z、机身 Y-up。 */
const applyModelSourceOrientation = (
    model: THREE.Object3D,
    sourcePath: string,
): void => {
    if (!sourcePath.startsWith(FR24_MODEL_SOURCE_PREFIX)) {
        return;
    }

    model.rotateY(FR24_MODEL_FORWARD_CORRECTION);
};

/** 将姿态面板的三轴角度写入模型根节点，保持模型资源本身不变。 */
const applyAircraftAttitude = (
    model: THREE.Object3D,
    settings: AircraftAttitudeSettings,
): void => {
    model.rotation.set(
        degreesToRadians(settings.pitch),
        degreesToRadians(settings.yaw),
        degreesToRadians(settings.roll),
        AIRCRAFT_ROTATION_ORDER,
    );
};

/** 为姿态角度生成带方向符号的紧凑读数。 */
const formatAttitudeAngle = (angle: number): string =>
    `${angle > 0 ? "+" : ""}${angle}°`;

/** 将拖拽计算出的角度限制在指定的安全范围内。 */
const clampAngle = (angle: number, minimum: number, maximum: number): number =>
    Math.min(Math.max(angle, minimum), maximum);

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

/** 将模型归一化到统一尺寸，并将几何中心移至姿态旋转原点。 */
const normalizeAircraftModel = (model: THREE.Object3D): void => {
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const largestDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z);

    if (largestDimension > 0) {
        model.scale.setScalar(NORMALIZED_MODEL_MAX_SIZE / largestDimension);
    }

    const normalizedBounds = new THREE.Box3().setFromObject(model);
    const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());

    model.position.sub(normalizedCenter);
    model.traverse((object: THREE.Object3D): void => {
        if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
};

/** 根据模型包围球和当前视口 FOV 计算标准视角所需距离。 */
const getCameraFitDistance = (
    camera: THREE.PerspectiveCamera,
    model: THREE.Object3D,
): { center: THREE.Vector3; distance: number } => {
    const bounds = new THREE.Box3().setFromObject(model);
    const modelCenter = model.getWorldPosition(new THREE.Vector3());
    const modelSphere = bounds.getBoundingSphere(new THREE.Sphere());
    const verticalFov = degreesToRadians(camera.fov);
    const horizontalFov =
        2 *
        Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.01));
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const cameraDistance = Math.max(
        (modelSphere.radius / Math.sin(limitingFov / 2)) * CAMERA_FIT_MARGIN,
        0.5,
    );

    return { center: modelCenter, distance: cameraDistance };
};

/** 应用一个标准相机视角，并让上下视图保持稳定的屏幕朝向。 */
const applyCameraView = (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    model: THREE.Object3D,
    view: Exclude<AircraftCameraView, "custom">,
): void => {
    const { center, distance } = getCameraFitDistance(camera, model);
    const viewDirection = new THREE.Vector3(
        ...CAMERA_VIEW_DIRECTIONS[view],
    ).normalize();

    if (view === "top") {
        camera.up.set(0, 0, -1);
    } else if (view === "bottom") {
        camera.up.set(0, 0, 1);
    } else {
        camera.up.set(0, 1, 0);
    }

    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(viewDirection, distance);
    controls.update();
};

/** 按模型包围球和当前视口 FOV 聚焦模型，默认使用右前上方适配视角。 */
const focusModel = (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    model: THREE.Object3D,
): void => {
    applyCameraView(camera, controls, model, "fit");
};

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
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const orbitControlsRef = useRef<OrbitControls | null>(null);
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
    const animationClockRef = useRef<THREE.Clock>(new THREE.Clock(false));
    const animationPlayingRef = useRef<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isModelDirectoryOpen, setIsModelDirectoryOpen] =
        useState<boolean>(false);
    const [cameraView, setCameraView] = useState<AircraftCameraView>("fit");
    const [cameraHudState, setCameraHudState] =
        useState<AircraftCameraHudState | null>(EMPTY_CAMERA_HUD_STATE);
    const [animationState, setAnimationState] =
        useState<AircraftAnimationState>(EMPTY_ANIMATION_STATE);
    const [isRenderControlsOpen, setIsRenderControlsOpen] =
        useState<boolean>(false);
    const [isAttitudeControlsOpen, setIsAttitudeControlsOpen] =
        useState<boolean>(false);
    const [fullscreenError, setFullscreenError] = useState<string | null>(null);
    const [snapshotError, setSnapshotError] = useState<string | null>(null);
    const [environmentError, setEnvironmentError] = useState<string | null>(
        null,
    );
    const [isSnapshotAvailable, setIsSnapshotAvailable] =
        useState<boolean>(false);
    const [renderSettings, setRenderSettings] =
        useState<AircraftRenderSettings>(createDefaultRenderSettings);
    const [attitudeSettings, setAttitudeSettings] =
        useState<AircraftAttitudeSettings>(DEFAULT_ATTITUDE_SETTINGS);
    const renderSettingsRef = useRef<AircraftRenderSettings>(renderSettings);
    const attitudeSettingsRef =
        useRef<AircraftAttitudeSettings>(attitudeSettings);
    const attitudeDragRef = useRef<AircraftAttitudeDragState | null>(null);
    const fullscreenToggleRef = useRef<HTMLButtonElement | null>(null);
    const wasFullscreenRef = useRef<boolean>(false);
    const isApplyingCameraViewRef = useRef<boolean>(false);
    const [isAttitudeDragging, setIsAttitudeDragging] =
        useState<boolean>(false);

    renderSettingsRef.current = renderSettings;
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
                setIsAttitudeControlsOpen(false);
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
            const nextIsOpen = !isOpen;

            if (nextIsOpen) {
                setIsAttitudeControlsOpen(false);
            }

            return nextIsOpen;
        });
    };

    /** 切换画布内飞行姿态面板，保留模型目录和轨道操作的空间。 */
    const handleAttitudeControlsToggle = (): void => {
        setIsAttitudeControlsOpen((isOpen: boolean): boolean => {
            const nextIsOpen = !isOpen;

            if (nextIsOpen) {
                setIsRenderControlsOpen(false);
            }

            return nextIsOpen;
        });
    };

    /** 将画布外的空白指针按下视为收起工具面板，面板自身不触发该行为。 */
    const handleViewportPointerDown = (
        event: PointerEvent<HTMLDivElement>,
    ): void => {
        if (
            event.target instanceof Element &&
            (event.target.closest(".plane-render__viewport-tools") !== null ||
                event.target.closest(".plane-render__lighting-hud") !== null ||
                event.target.closest(".plane-render__fullscreen-model-dir") !==
                    null)
        ) {
            return;
        }

        setIsRenderControlsOpen(false);
        setIsAttitudeControlsOpen(false);
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
            schemaVersion: 1,
            modelId: asset?.id ?? null,
            camera: {
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
            animationClockRef.current.start();
        } else {
            animationClockRef.current.stop();
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
        animationClockRef.current.stop();
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
            setIsAttitudeControlsOpen(false);
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
            ): AircraftRenderSettings => ({
                ...currentSettings,
                environmentPreset,
            }),
        );
    };

    /** 保存 HDRI URL，异步加载 effect 会对连续输入做短暂去抖。 */
    const handleHdriUrlChange = (
        event: ChangeEvent<HTMLInputElement>,
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
            (
                currentSettings: AircraftAttitudeSettings,
            ): AircraftAttitudeSettings => ({
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

        const timeoutId = window.setTimeout((): void => {
            void applyEnvironment(renderSettings);
        }, 240);

        return (): void => {
            window.clearTimeout(timeoutId);
        };
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
            animationClockRef.current.stop();
            setAnimationState(EMPTY_ANIMATION_STATE);
            setCameraHudState(EMPTY_CAMERA_HUD_STATE);
            setIsSnapshotAvailable(false);
            setSnapshotError(null);
            setEnvironmentError(null);

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

            if (!("gpu" in navigator)) {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    rendererStatus: "unavailable",
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
            const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
            const controls = new OrbitControls(camera, renderer.domElement);
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

            controls.enableDamping = true;
            controls.dampingFactor = 0.065;
            controls.minDistance = MINIMUM_CAMERA_DISTANCE;
            controls.maxDistance = MAXIMUM_CAMERA_DISTANCE;
            controls.minPolarAngle = POLAR_ANGLE_MARGIN;
            controls.maxPolarAngle = Math.PI - POLAR_ANGLE_MARGIN;
            controls.zoomSpeed = MODEL_VIEWER_ZOOM_SPEED;
            controls.zoomToCursor = true;

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

            /** 将当前主题的工作室背景与灯光颜色同步到 Three.js 对象。 */
            const applyThemePalette = (): void => {
                displayFloor.material.color.set(
                    readThemeColor(MODEL_FLOOR_COLOR_TOKEN, "#163343"),
                );
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
                    setEnvironmentError(
                        settings.environmentPreset === "hdri"
                            ? "请输入 HDRI URL，当前已回退内置工作室。"
                            : null,
                    );
                    requestRenderRef.current?.();
                    return;
                }

                setEnvironmentError(null);

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

                camera.aspect = resolvedWidth / resolvedHeight;
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
                    const animationDelta = animationClockRef.current.getDelta();
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
                        animationClockRef.current.start();
                    }
                    requestRender();
                } else {
                    animationClockRef.current.stop();
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
                                  animationClockRef.current.start();
                              }
                              requestRender();
                          } else {
                              animationClockRef.current.stop();
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

            controls.addEventListener("change", handleControlsChange);

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
                animationPlayingRef.current = false;
                animationClockRef.current.stop();
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
            className={`plane-render__viewport-canvas${animationState.available ? " plane-render__viewport-canvas--has-animation" : ""}`}
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
                    onHdriUrlChange={handleHdriUrlChange}
                    environmentError={environmentError}
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
            {cameraHudState !== null ? (
                <div
                    className="plane-render__camera-hud"
                    role="group"
                    aria-label="观察相机状态"
                >
                    <div
                        className="plane-render__camera-hud-axis"
                        aria-hidden="true"
                    >
                        <span
                            className="plane-render__camera-hud-axis-line plane-render__camera-hud-axis-line--x"
                            style={{
                                transform: `rotate(${cameraHudState.axisX.angle}deg)`,
                                opacity: cameraHudState.axisX.opacity,
                            }}
                        />
                        <span
                            className="plane-render__camera-hud-axis-line plane-render__camera-hud-axis-line--y"
                            style={{
                                transform: `rotate(${cameraHudState.axisY.angle}deg)`,
                                opacity: cameraHudState.axisY.opacity,
                            }}
                        />
                        <span
                            className="plane-render__camera-hud-axis-line plane-render__camera-hud-axis-line--z"
                            style={{
                                transform: `rotate(${cameraHudState.axisZ.angle}deg)`,
                                opacity: cameraHudState.axisZ.opacity,
                            }}
                        />
                        <span className="plane-render__camera-hud-origin" />
                    </div>
                    <div className="plane-render__camera-hud-readout">
                        <span>
                            AZ {formatCameraHudAngle(cameraHudState.azimuth)}
                        </span>
                        <span>
                            EL {formatCameraHudAngle(cameraHudState.elevation)}
                        </span>
                        <span>DIST {cameraHudState.distance.toFixed(2)}</span>
                    </div>
                </div>
            ) : null}
            {animationState.available ? (
                <div className="plane-render__animation-controls">
                    <div className="plane-render__animation-heading">
                        <span>{animationState.name}</span>
                        <output>
                            {animationState.currentTime.toFixed(1)}s /{" "}
                            {animationState.duration.toFixed(1)}s
                        </output>
                    </div>
                    <div className="plane-render__animation-row">
                        <button
                            className="plane-render__viewport-action"
                            type="button"
                            onClick={handleAnimationToggle}
                        >
                            {animationState.isPlaying ? "暂停" : "播放"}
                        </button>
                        <label className="plane-render__animation-range">
                            <span className="plane-render__visually-hidden">
                                动画时间
                            </span>
                            <input
                                aria-label="动画时间"
                                type="range"
                                min={0}
                                max={animationState.duration}
                                step={0.01}
                                value={animationState.currentTime}
                                onChange={handleAnimationScrub}
                            />
                        </label>
                    </div>
                </div>
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
