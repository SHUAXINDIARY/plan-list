import type { RefObject } from "react";
import * as THREE from "three";
import type { AircraftModelAsset } from "../modelAssets";

/** 模型视窗可选的工作室环境来源。 */
export type AircraftEnvironmentPreset = "room" | "hdri";

/** 可即时写入三点灯光 rig 的位置与强度参数。 */
export interface AircraftLightingSettings {
    /** 主方向光在场景 X 轴上的位置。 */
    lightPositionX: number;
    /** 主方向光在场景 Y 轴上的位置。 */
    lightPositionY: number;
    /** 主方向光在场景 Z 轴上的位置。 */
    lightPositionZ: number;
    /** 主方向光强度，控制模型高光和阴影对比。 */
    keyLightIntensity: number;
    /** 三点灯光中的补光强度，控制暗部可读性。 */
    fillLightIntensity: number;
    /** 三点灯光中的轮廓光强度，控制机身边缘分离度。 */
    rimLightIntensity: number;
}

/** 可即时切换的场景环境参数。 */
export interface AircraftEnvironmentSettings {
    /** 当前使用内置工作室环境还是 HDRI 环境。 */
    environmentPreset: AircraftEnvironmentPreset;
    /** 当前目录 HDRI 资源生成的运行时 URL。 */
    hdriUrl: string;
    /** 场景环境反射与漫反射的整体强度。 */
    environmentIntensity: number;
}

/** 可供模型视窗即时切换的色调映射预设。 */
export type AircraftToneMapping = "aces" | "agx" | "neutral" | "none";

/** 可供模型视窗即时切换的 WebGPU 阴影算法。 */
export type AircraftShadowMode = "pcf" | "vsm";

/** 模型视窗可选的渲染质量档位。 */
export type AircraftRenderQuality = "performance" | "balanced" | "quality" | "custom";

/** 模型视窗可选的工作室照明档位。 */
export type AircraftLightingPreset = "neutral" | "silhouette" | "top" | "three-point" | "custom";

/** 模型视窗中可即时写入 WebGPU 场景的用户偏好。 */
export interface AircraftRenderSettings extends AircraftLightingSettings {
    /** 当前画质预设；手动修改高级参数后标记为 custom。 */
    qualityPreset: AircraftRenderQuality;
    /** 当前照明预设；手动修改灯光参数后标记为 custom。 */
    lightingPreset: AircraftLightingPreset;
    /** 输出画面使用的色调映射预设。 */
    toneMapping: AircraftToneMapping;
    /** 色调映射在输出前使用的曝光系数。 */
    exposure: number;
    /** 写入渲染器的物理像素倍率。 */
    pixelRatio: number;
    /** 是否全局开启模型和展示平面的实时阴影。 */
    shadowsEnabled: boolean;
    /** 阴影贴图采用的 WebGPU 算法。 */
    shadowMode: AircraftShadowMode;
    /** 是否渲染飞机底部的展示平面。 */
    displayFloor: boolean;
    /** 当前使用内置工作室环境还是 HDRI 环境。 */
    environmentPreset: AircraftEnvironmentPreset;
    /** 当前从 HDRI 目录选择的运行时资源 URL。 */
    hdriUrl: string;
    /** 场景环境反射与漫反射的整体强度。 */
    environmentIntensity: number;
}

/** 模型视窗当前所处的初始化或加载阶段。 */
export type AircraftModelLoadingPhase = "initializing" | "loading" | "ready" | "error";

/** 当前 WebGPU 渲染后端的可读状态。 */
export type AircraftRendererStatus = "initializing" | "webgpu" | "unavailable" | "lost";

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
export interface AircraftModelViewportProps {
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

/** 当前 GLB 是否包含可播放动画，以及播放位置和时长。 */
export interface AircraftAnimationState {
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
export interface AircraftCameraHudAxis {
    /** 轴线相对于屏幕水平向右方向的角度。 */
    angle: number;
    /** 轴线的可见度，用于弱化背向相机的轴。 */
    opacity: number;
}

/** 相机 HUD 展示的观察方位和世界轴投影状态。 */
export interface AircraftCameraHudState {
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
export type AircraftCameraView = "custom" | "fit" | "front" | "side" | "top" | "bottom";

/** 模型视窗支持的摄像机投影模式。 */
export type AircraftProjectionMode = "perspective" | "orthographic";

/** 视窗当前可用的透视或正交相机实例。 */
export type AircraftCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;
