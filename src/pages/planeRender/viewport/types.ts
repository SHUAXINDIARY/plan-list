import type { RefObject } from "react";
import * as THREE from "three";
import type { AircraftModelAsset } from "../modelAssets";

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

/** 飞行姿态面板可切换的预设状态。 */
export type AircraftAttitudePreset =
    | "level"
    | "takeoff"
    | "descent"
    | "landing"
    | "custom";

/** 飞行姿态面板中可单独调节的旋转轴。 */
export type AircraftAttitudeAxis = "pitch" | "roll" | "yaw";

/** 3D 姿态操控器当前被拖拽的旋转维度。 */
export type AircraftAttitudeDragMode = "orbit" | "roll";

/** 一次姿态拖拽开始时记录的指针和角度快照。 */
export interface AircraftAttitudeDragState {
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
export interface AircraftAttitudeSettings {
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
export type AircraftCameraView =
    | "custom"
    | "fit"
    | "front"
    | "side"
    | "top"
    | "bottom";

/** 模型视窗支持的摄像机投影模式。 */
export type AircraftProjectionMode = "perspective" | "orthographic";

/** 视窗当前可用的透视或正交相机实例。 */
export type AircraftCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;
