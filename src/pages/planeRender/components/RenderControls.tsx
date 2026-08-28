import { useId, type ChangeEvent, type ReactElement } from "react";

/** 可供模型视窗即时切换的色调映射预设。 */
export type AircraftToneMapping = "aces" | "agx" | "neutral" | "none";

/** 可供模型视窗即时切换的 WebGPU 阴影算法。 */
export type AircraftShadowMode = "pcf" | "vsm";

/** 模型视窗可选的渲染质量档位，手动调整后进入 custom。 */
export type AircraftRenderQuality =
    | "performance"
    | "balanced"
    | "quality"
    | "custom";

/** 模型视窗可选的工作室照明档位，手动移动主光源后进入 custom。 */
export type AircraftLightingPreset =
    | "neutral"
    | "silhouette"
    | "top"
    | "custom";

/** 模型视窗中可即时写入 WebGPU 渲染器的用户偏好。 */
export interface AircraftRenderSettings {
    /** 当前画质预设；任何高级参数手动修改后标记为 custom。 */
    qualityPreset: AircraftRenderQuality;
    /** 当前照明预设；任何主光源轴向手动修改后标记为 custom。 */
    lightingPreset: AircraftLightingPreset;
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
    /** 主方向光在场景 X 轴上的位置。 */
    lightPositionX: number;
    /** 主方向光在场景 Y 轴上的位置。 */
    lightPositionY: number;
    /** 主方向光在场景 Z 轴上的位置。 */
    lightPositionZ: number;
    /** 主方向光强度，控制模型高光和阴影对比。 */
    keyLightIntensity: number;
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
    /** 处理画质预设 select 的变更。 */
    onQualityPresetChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理照明预设 select 的变更。 */
    onLightingPresetChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理曝光滑块的变更。 */
    onExposureChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理渲染倍率滑块的变更。 */
    onPixelRatioChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理主光源 X 轴位置滑块的变更。 */
    onLightPositionXChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理主光源 Y 轴位置滑块的变更。 */
    onLightPositionYChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理主光源 Z 轴位置滑块的变更。 */
    onLightPositionZChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理主光源强度滑块的变更。 */
    onKeyLightIntensityChange: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
    /** 处理实时阴影开关的变更。 */
    onShadowsEnabledChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理展示平面开关的变更。 */
    onDisplayFloorChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理阴影算法 select 的变更。 */
    onShadowModeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 恢复渲染控制的默认设置。 */
    onReset: () => void;
}

/** 渲染倍率滑块允许的最低物理像素比。 */
const MINIMUM_RENDER_PIXEL_RATIO = 0.5;
/** 渲染倍率滑块允许的最高物理像素比。 */
const MAXIMUM_RENDER_PIXEL_RATIO = 3;
/** 渲染倍率滑块的离散精度。 */
const RENDER_PIXEL_RATIO_STEP = 0.25;
/** 曝光滑块允许的最低值。 */
const MINIMUM_TONE_MAPPING_EXPOSURE = 0.5;
/** 曝光滑块允许的最高值。 */
const MAXIMUM_TONE_MAPPING_EXPOSURE = 2;
/** 曝光滑块的离散精度。 */
const TONE_MAPPING_EXPOSURE_STEP = 0.05;
/** 主光源位置滑块的最小值。 */
const MINIMUM_LIGHT_POSITION = -20;
/** 主光源位置滑块的最大值。 */
const MAXIMUM_LIGHT_POSITION = 20;
/** 主光源位置滑块的离散精度。 */
const LIGHT_POSITION_STEP = 0.5;
/** 主光源强度滑块的最小值。 */
const MINIMUM_KEY_LIGHT_INTENSITY = 0;
/** 主光源强度滑块的最大值。 */
const MAXIMUM_KEY_LIGHT_INTENSITY = 6;
/** 主光源强度滑块的离散精度。 */
const KEY_LIGHT_INTENSITY_STEP = 0.1;

/** 渲染控制面板，集中承载 WebGPU 输出和主光源配置。 */
export const RenderControls = ({
    isOpen,
    settings,
    onToggle,
    onToneMappingChange,
    onQualityPresetChange,
    onLightingPresetChange,
    onExposureChange,
    onPixelRatioChange,
    onLightPositionXChange,
    onLightPositionYChange,
    onLightPositionZChange,
    onKeyLightIntensityChange,
    onShadowsEnabledChange,
    onDisplayFloorChange,
    onShadowModeChange,
    onReset,
}: RenderControlsProps): ReactElement => {
    const controlIdPrefix = useId();
    const exposureControlId = `${controlIdPrefix}-exposure`;
    const pixelRatioControlId = `${controlIdPrefix}-pixel-ratio`;
    const shadowsControlId = `${controlIdPrefix}-shadows`;
    const displayFloorControlId = `${controlIdPrefix}-display-floor`;
    const lightPositionXControlId = `${controlIdPrefix}-light-position-x`;
    const lightPositionYControlId = `${controlIdPrefix}-light-position-y`;
    const lightPositionZControlId = `${controlIdPrefix}-light-position-z`;
    const keyLightIntensityControlId = `${controlIdPrefix}-key-light-intensity`;
    const renderControlsId = `${controlIdPrefix}-panel`;

    return (
        <div className="plane-render__render-controls">
        <button
            className="plane-render__render-controls-toggle"
            type="button"
            aria-controls={renderControlsId}
            aria-expanded={isOpen}
            onClick={onToggle}
        >
            {isOpen ? "收起控制" : "渲染控制"}
        </button>
        {isOpen ? (
            <aside
                id={renderControlsId}
                className="plane-render__render-controls-panel"
                aria-label="WebGPU 渲染控制"
            >
                <div className="plane-render__render-controls-heading">
                    <p>WebGPU Output</p>
                    <h2>渲染控制</h2>
                </div>
                <div className="plane-render__render-fields">
                    <label className="plane-render__render-field">
                        <span>画质预设</span>
                        <select
                            value={settings.qualityPreset}
                            onChange={onQualityPresetChange}
                        >
                            <option value="performance">性能优先</option>
                            <option value="balanced">均衡</option>
                            <option value="quality">质量优先</option>
                            <option value="custom">自定义</option>
                        </select>
                    </label>
                    <label className="plane-render__render-field">
                        <span>照明预设</span>
                        <select
                            value={settings.lightingPreset}
                            onChange={onLightingPresetChange}
                        >
                            <option value="neutral">中性检查</option>
                            <option value="silhouette">轮廓检查</option>
                            <option value="top">顶部检查</option>
                            <option value="custom">自定义</option>
                        </select>
                    </label>
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
                            <output htmlFor={exposureControlId}>
                                {settings.exposure.toFixed(2)}
                            </output>
                        </span>
                        <input
                            id={exposureControlId}
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
                            <output htmlFor={pixelRatioControlId}>
                                {settings.pixelRatio.toFixed(2)}x
                            </output>
                        </span>
                        <input
                            id={pixelRatioControlId}
                            type="range"
                            min={MINIMUM_RENDER_PIXEL_RATIO}
                            max={MAXIMUM_RENDER_PIXEL_RATIO}
                            step={RENDER_PIXEL_RATIO_STEP}
                            value={settings.pixelRatio}
                            onChange={onPixelRatioChange}
                        />
                    </label>
                    <p className="plane-render__render-section-label">
                        光源位置
                    </p>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            主光强度
                            <output htmlFor={keyLightIntensityControlId}>
                                {settings.keyLightIntensity.toFixed(1)}
                            </output>
                        </span>
                        <input
                            id={keyLightIntensityControlId}
                            type="range"
                            min={MINIMUM_KEY_LIGHT_INTENSITY}
                            max={MAXIMUM_KEY_LIGHT_INTENSITY}
                            step={KEY_LIGHT_INTENSITY_STEP}
                            value={settings.keyLightIntensity}
                            onChange={onKeyLightIntensityChange}
                        />
                    </label>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            X 轴
                            <output htmlFor={lightPositionXControlId}>
                                {settings.lightPositionX.toFixed(1)}
                            </output>
                        </span>
                        <input
                            id={lightPositionXControlId}
                            type="range"
                            min={MINIMUM_LIGHT_POSITION}
                            max={MAXIMUM_LIGHT_POSITION}
                            step={LIGHT_POSITION_STEP}
                            value={settings.lightPositionX}
                            onChange={onLightPositionXChange}
                        />
                    </label>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            Y 轴
                            <output htmlFor={lightPositionYControlId}>
                                {settings.lightPositionY.toFixed(1)}
                            </output>
                        </span>
                        <input
                            id={lightPositionYControlId}
                            type="range"
                            min={MINIMUM_LIGHT_POSITION}
                            max={MAXIMUM_LIGHT_POSITION}
                            step={LIGHT_POSITION_STEP}
                            value={settings.lightPositionY}
                            onChange={onLightPositionYChange}
                        />
                    </label>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            Z 轴
                            <output htmlFor={lightPositionZControlId}>
                                {settings.lightPositionZ.toFixed(1)}
                            </output>
                        </span>
                        <input
                            id={lightPositionZControlId}
                            type="range"
                            min={MINIMUM_LIGHT_POSITION}
                            max={MAXIMUM_LIGHT_POSITION}
                            step={LIGHT_POSITION_STEP}
                            value={settings.lightPositionZ}
                            onChange={onLightPositionZChange}
                        />
                    </label>
                    <label className="plane-render__render-switch">
                        <span>
                            实时阴影
                            {!settings.displayFloor ? "（展示平面关闭）" : ""}
                        </span>
                        <input
                            id={shadowsControlId}
                            type="checkbox"
                            role="switch"
                            checked={settings.shadowsEnabled}
                            onChange={onShadowsEnabledChange}
                        />
                    </label>
                    <label className="plane-render__render-switch">
                        <span>展示平面</span>
                        <input
                            id={displayFloorControlId}
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
};
