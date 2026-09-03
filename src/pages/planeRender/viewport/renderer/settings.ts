import * as THREE from "three";
import type { WebGPURenderer } from "three/webgpu";
import type {
    AircraftRenderQuality,
    AircraftRenderSettings,
    AircraftShadowMode,
    AircraftToneMapping,
} from "../types";

/** WebGPU 不可用时的用户可见提示。 */
export const WEBGPU_UNAVAILABLE_MESSAGE = "当前浏览器或设备未提供 WebGPU 支持。";
/** WebGPU 初始化失败时的用户可见提示。 */
export const WEBGPU_INITIALIZATION_ERROR_MESSAGE = "WebGPU 渲染器初始化失败。";
/** WebGPU 设备运行中丢失时的用户可见提示。 */
export const WEBGPU_DEVICE_LOST_MESSAGE = "WebGPU 设备已丢失，请重试当前模型。";
/** 渲染倍率默认采用的最高物理像素比，兼顾清晰度与常规设备性能。 */
export const DEFAULT_RENDER_PIXEL_RATIO = 2;

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

/** 质量预设可直接修改的渲染参数，不覆盖曝光、色调映射和灯光位置。 */
const RENDER_QUALITY_PRESET_VALUES: Readonly<
    Record<
        Exclude<AircraftRenderQuality, "custom">,
        Pick<AircraftRenderSettings, "pixelRatio" | "shadowsEnabled" | "shadowMode">
    >
> = {
    performance: { pixelRatio: 1, shadowsEnabled: false, shadowMode: "pcf" },
    balanced: { pixelRatio: 1.5, shadowsEnabled: true, shadowMode: "vsm" },
    quality: { pixelRatio: 2, shadowsEnabled: true, shadowMode: "vsm" },
};

/** 读取设备像素比并限制在当前视窗的基础安全上限内。 */
const getDevicePixelRatio = (): number =>
    typeof window === "undefined"
        ? 1
        : Math.min(window.devicePixelRatio || 1, DEFAULT_RENDER_PIXEL_RATIO);

/** 根据设备像素比解析质量预设，避免低 DPI 设备被强制放大。 */
export const getQualityPresetSettings = (
    qualityPreset: Exclude<AircraftRenderQuality, "custom">,
): Pick<AircraftRenderSettings, "pixelRatio" | "shadowsEnabled" | "shadowMode"> => {
    const presetSettings = RENDER_QUALITY_PRESET_VALUES[qualityPreset];

    return {
        ...presetSettings,
        pixelRatio: Math.min(presetSettings.pixelRatio, getDevicePixelRatio()),
    };
};

/** 将用户可读的预设名称映射至模型视窗可用的色调映射值。 */
export const getToneMappingValue = (toneMapping: AircraftToneMapping): THREE.ToneMapping => {
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
export const getShadowMapType = (shadowMode: AircraftShadowMode): THREE.ShadowMapType =>
    shadowMode === "vsm" ? THREE.VSMShadowMap : THREE.PCFShadowMap;

/** 建立渲染控制面板的默认设置，高 DPI 设备最多使用 2x。 */
export const createDefaultRenderSettings = (): AircraftRenderSettings => ({
    ...DEFAULT_RENDER_SETTINGS,
    pixelRatio: Math.min(
        RENDER_QUALITY_PRESET_VALUES.balanced.pixelRatio,
        getDevicePixelRatio(),
        DEFAULT_RENDER_PIXEL_RATIO,
    ),
});

/** 校验 select 元素的字符串值是否为已支持的色调映射预设。 */
export const isAircraftToneMapping = (value: string): value is AircraftToneMapping =>
    value === "aces" || value === "agx" || value === "neutral" || value === "none";

/** 校验 select 元素的字符串值是否为已支持的 WebGPU 阴影算法。 */
export const isAircraftShadowMode = (value: string): value is AircraftShadowMode =>
    value === "pcf" || value === "vsm";

/** 校验画质预设 select 的字符串值是否为已支持的质量档位。 */
export const isAircraftRenderQuality = (value: string): value is AircraftRenderQuality =>
    value === "performance" || value === "balanced" || value === "quality" || value === "custom";

/** 将当前控制面板设置一次性写入已初始化的 WebGPU 渲染器。 */
export const applyRenderSettings = (
    renderer: WebGPURenderer,
    settings: AircraftRenderSettings,
): void => {
    renderer.toneMapping = getToneMappingValue(settings.toneMapping);
    renderer.toneMappingExposure = settings.exposure;
    renderer.setPixelRatio(settings.pixelRatio);
    renderer.shadowMap.enabled = settings.shadowsEnabled;
    renderer.shadowMap.type = getShadowMapType(settings.shadowMode);
};
