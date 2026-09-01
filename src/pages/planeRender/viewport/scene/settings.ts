import type {
    AircraftLightingPreset,
    AircraftRenderSettings,
} from "../../components/RenderControls";

/** 模型目录为空时的用户可见提示。 */
export const EMPTY_MODEL_DIRECTORY_MESSAGE = "模型目录中没有可加载的 GLB 文件。";
/** 当前选中模型加载失败时的用户可见提示。 */
export const CURRENT_MODEL_FAILED_MESSAGE = "当前模型未能加载。";
/** 工作室地面颜色 token，在深浅主题下由 App.css 提供值。 */
export const MODEL_FLOOR_COLOR_TOKEN = "--pl-model-floor-color";
/** 工作室主光颜色 token，在深浅主题下由 App.css 提供值。 */
export const MODEL_KEY_LIGHT_COLOR_TOKEN = "--pl-model-key-light-color";
/** 工作室补光颜色 token，在深浅主题下由 App.css 提供值。 */
export const MODEL_FILL_LIGHT_COLOR_TOKEN = "--pl-model-fill-light-color";
/** 工作室轮廓光颜色 token，在深浅主题下由 App.css 提供值。 */
export const MODEL_RIM_LIGHT_COLOR_TOKEN = "--pl-model-rim-light-color";

/** 常用飞行阶段对应的姿态角度，便于快速预览空间状态。 */
export const ATTITUDE_PRESET_VALUES = {
    level: { pitch: 0, roll: 0, yaw: 0 },
    takeoff: { pitch: 10, roll: 0, yaw: 0 },
    descent: { pitch: -8, roll: 0, yaw: 0 },
    landing: { pitch: 3, roll: 0, yaw: 0 },
} as const;

/** 模型视窗打开时采用的平飞姿态基线。 */
export const DEFAULT_ATTITUDE_SETTINGS = {
    preset: "level",
    pitch: 0,
    roll: 0,
    yaw: 0,
} as const;

/** 工作室照明预设，调整主光方向和强度，保留用户对色调和曝光的选择。 */
export const LIGHTING_PRESET_VALUES: Readonly<
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
        lightPositionX: 7,
        lightPositionY: 10,
        lightPositionZ: 8,
        keyLightIntensity: 3.2,
        fillLightIntensity: 1.2,
        rimLightIntensity: 0,
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

/** 校验照明预设 select 的字符串值是否为已支持的档位。 */
export const isAircraftLightingPreset = (value: string): value is AircraftLightingPreset =>
    value === "neutral" || value === "silhouette" || value === "top" || value === "three-point" || value === "custom";

/** 校验环境来源 select 的字符串值是否为已支持的环境类型。 */
export const isAircraftEnvironmentPreset = (
    value: string,
): value is AircraftRenderSettings["environmentPreset"] =>
    value === "room" || value === "hdri";
