import type { ChangeEvent, ReactElement } from "react";

/** 可供模型视窗即时切换的色调映射预设。 */
export type AircraftToneMapping = "aces" | "agx" | "neutral" | "none";

/** 可供模型视窗即时切换的 WebGPU 阴影算法。 */
export type AircraftShadowMode = "pcf" | "vsm";

/** 模型视窗中可即时写入 WebGPU 渲染器的用户偏好。 */
export interface AircraftRenderSettings {
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
    /** 是否渲染飞机底部的展示平面。 */
    displayFloor: boolean;
    /** 主方向光绕场景垂直轴的水平角度。 */
    lightAzimuth: number;
    /** 主方向光相对水平面的高度角。 */
    lightElevation: number;
}

/** 渲染控制面板的输入状态和交互回调。 */
interface RenderControlsProps {
    /** 当前是否展开渲染控制面板。 */
    isOpen: boolean;
    /** 当前应用于 WebGPU 场景的渲染设置。 */
    settings: AircraftRenderSettings;
    /** 切换渲染控制面板的展开状态。 */
    onToggle: () => void;
    /** 处理色调映射 select 的变更。 */
    onToneMappingChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理曝光滑块的变更。 */
    onExposureChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理渲染倍率滑块的变更。 */
    onPixelRatioChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理主光源水平角滑块的变更。 */
    onLightAzimuthChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理主光源高度角滑块的变更。 */
    onLightElevationChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理实时阴影开关的变更。 */
    onShadowsEnabledChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理展示平面开关的变更。 */
    onDisplayFloorChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理阴影算法 select 的变更。 */
    onShadowModeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 恢复渲染控制的默认设置。 */
    onReset: () => void;
}

/** 曝光控件的 DOM 标识，用于关联数值输出。 */
const EXPOSURE_CONTROL_ID = "plane-render-exposure";
/** 渲染倍率控件的 DOM 标识，用于关联数值输出。 */
const PIXEL_RATIO_CONTROL_ID = "plane-render-pixel-ratio";
/** 阴影开关的 DOM 标识，用于关联可读标签。 */
const SHADOWS_CONTROL_ID = "plane-render-shadows";
/** 展示平面开关的 DOM 标识，用于关联可读标签。 */
const DISPLAY_FLOOR_CONTROL_ID = "plane-render-display-floor";
/** 主光源水平角控件的 DOM 标识。 */
const LIGHT_AZIMUTH_CONTROL_ID = "plane-render-light-azimuth";
/** 主光源高度角控件的 DOM 标识。 */
const LIGHT_ELEVATION_CONTROL_ID = "plane-render-light-elevation";
/** 画布内可收起渲染控制区的 DOM 标识。 */
const RENDER_CONTROLS_ID = "plane-render-controls";
/** 渲染倍率滑块允许的最低物理像素比。 */
const MINIMUM_RENDER_PIXEL_RATIO = 0.5;
/** 渲染倍率滑块允许的最高物理像素比。 */
const MAXIMUM_RENDER_PIXEL_RATIO = 2;
/** 渲染倍率滑块的离散精度。 */
const RENDER_PIXEL_RATIO_STEP = 0.25;
/** 曝光滑块允许的最低值。 */
const MINIMUM_TONE_MAPPING_EXPOSURE = 0.5;
/** 曝光滑块允许的最高值。 */
const MAXIMUM_TONE_MAPPING_EXPOSURE = 2;
/** 曝光滑块的离散精度。 */
const TONE_MAPPING_EXPOSURE_STEP = 0.05;
/** 主光源水平角滑块的最小值。 */
const MINIMUM_LIGHT_AZIMUTH = -180;
/** 主光源水平角滑块的最大值。 */
const MAXIMUM_LIGHT_AZIMUTH = 180;
/** 主光源高度角滑块的最小值。 */
const MINIMUM_LIGHT_ELEVATION = 5;
/** 主光源高度角滑块的最大值。 */
const MAXIMUM_LIGHT_ELEVATION = 85;
/** 主光源角度滑块的离散精度。 */
const LIGHT_ANGLE_STEP = 1;

/** 将角度格式化为带方向符号的紧凑读数。 */
const formatAngle = (angle: number): string =>
    `${angle > 0 ? "+" : ""}${angle}°`;

/** 渲染控制面板，集中承载 WebGPU 输出和主光源配置。 */
export const RenderControls = ({
    isOpen,
    settings,
    onToggle,
    onToneMappingChange,
    onExposureChange,
    onPixelRatioChange,
    onLightAzimuthChange,
    onLightElevationChange,
    onShadowsEnabledChange,
    onDisplayFloorChange,
    onShadowModeChange,
    onReset,
}: RenderControlsProps): ReactElement => (
    <div className="plane-render__render-controls">
        <button
            className="plane-render__render-controls-toggle"
            type="button"
            aria-controls={RENDER_CONTROLS_ID}
            aria-expanded={isOpen}
            onClick={onToggle}
        >
            {isOpen ? "收起控制" : "渲染控制"}
        </button>
        {isOpen ? (
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
                            value={settings.toneMapping}
                            onChange={onToneMappingChange}
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
                                {settings.exposure.toFixed(2)}
                            </output>
                        </span>
                        <input
                            id={EXPOSURE_CONTROL_ID}
                            type="range"
                            min={MINIMUM_TONE_MAPPING_EXPOSURE}
                            max={MAXIMUM_TONE_MAPPING_EXPOSURE}
                            step={TONE_MAPPING_EXPOSURE_STEP}
                            value={settings.exposure}
                            onChange={onExposureChange}
                        />
                    </label>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            渲染倍率
                            <output htmlFor={PIXEL_RATIO_CONTROL_ID}>
                                {settings.pixelRatio.toFixed(2)}x
                            </output>
                        </span>
                        <input
                            id={PIXEL_RATIO_CONTROL_ID}
                            type="range"
                            min={MINIMUM_RENDER_PIXEL_RATIO}
                            max={MAXIMUM_RENDER_PIXEL_RATIO}
                            step={RENDER_PIXEL_RATIO_STEP}
                            value={settings.pixelRatio}
                            onChange={onPixelRatioChange}
                        />
                    </label>
                    <p className="plane-render__render-section-label">
                        打光方向
                    </p>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            水平角
                            <output htmlFor={LIGHT_AZIMUTH_CONTROL_ID}>
                                {formatAngle(settings.lightAzimuth)}
                            </output>
                        </span>
                        <input
                            id={LIGHT_AZIMUTH_CONTROL_ID}
                            type="range"
                            min={MINIMUM_LIGHT_AZIMUTH}
                            max={MAXIMUM_LIGHT_AZIMUTH}
                            step={LIGHT_ANGLE_STEP}
                            value={settings.lightAzimuth}
                            onChange={onLightAzimuthChange}
                        />
                    </label>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            高度角
                            <output htmlFor={LIGHT_ELEVATION_CONTROL_ID}>
                                {formatAngle(settings.lightElevation)}
                            </output>
                        </span>
                        <input
                            id={LIGHT_ELEVATION_CONTROL_ID}
                            type="range"
                            min={MINIMUM_LIGHT_ELEVATION}
                            max={MAXIMUM_LIGHT_ELEVATION}
                            step={LIGHT_ANGLE_STEP}
                            value={settings.lightElevation}
                            onChange={onLightElevationChange}
                        />
                    </label>
                    <label className="plane-render__render-switch">
                        <span>实时阴影</span>
                        <input
                            id={SHADOWS_CONTROL_ID}
                            type="checkbox"
                            role="switch"
                            checked={settings.shadowsEnabled}
                            onChange={onShadowsEnabledChange}
                        />
                    </label>
                    <label className="plane-render__render-switch">
                        <span>展示平面</span>
                        <input
                            id={DISPLAY_FLOOR_CONTROL_ID}
                            type="checkbox"
                            role="switch"
                            checked={settings.displayFloor}
                            onChange={onDisplayFloorChange}
                        />
                    </label>
                    <label className="plane-render__render-field">
                        <span>阴影算法</span>
                        <select
                            value={settings.shadowMode}
                            disabled={!settings.shadowsEnabled}
                            onChange={onShadowModeChange}
                        >
                            <option value="pcf">标准 PCF</option>
                            <option value="vsm">柔化 VSM</option>
                        </select>
                    </label>
                    <button
                        className="plane-render__render-reset"
                        type="button"
                        onClick={onReset}
                    >
                        恢复默认
                    </button>
                </div>
            </aside>
        ) : null}
    </div>
);
