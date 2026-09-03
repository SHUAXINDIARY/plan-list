import { useId, type ChangeEvent, type ReactElement } from "react";
import type { AircraftHdriAsset } from "../hdriAssets";
import type { AircraftRenderSettings } from "../viewport/types";

export type {
    AircraftLightingPreset,
    AircraftRenderQuality,
    AircraftRenderSettings,
    AircraftShadowMode,
    AircraftToneMapping,
} from "../viewport/types";

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
    /** 处理环境来源 select 的变更。 */
    onEnvironmentPresetChange: (
        event: ChangeEvent<HTMLSelectElement>,
    ) => void;
    /** 当前构建期扫描到的 HDRI 资源目录。 */
    hdriAssets: readonly AircraftHdriAsset[];
    /** 处理 HDRI select 的变更。 */
    onHdriChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 当前 HDRI 加载失败或配置不完整时的回退提示。 */
    environmentError: string | null;
    /** 当前 HDRI 是否正在下载和生成 PMREM。 */
    environmentLoading: boolean;
    /** 处理环境强度滑块的变更。 */
    onEnvironmentIntensityChange: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
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
    /** 处理补光强度滑块的变更。 */
    onFillLightIntensityChange: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
    /** 处理轮廓光强度滑块的变更。 */
    onRimLightIntensityChange: (
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
/** 环境强度滑块允许的最低值。 */
const MINIMUM_ENVIRONMENT_INTENSITY = 0;
/** 环境强度滑块允许的最高值。 */
const MAXIMUM_ENVIRONMENT_INTENSITY = 2;
/** 环境强度滑块的离散精度。 */
const ENVIRONMENT_INTENSITY_STEP = 0.05;
/** 补光与轮廓光强度的最低值。 */
const MINIMUM_SECONDARY_LIGHT_INTENSITY = 0;
/** 补光与轮廓光强度的最高值。 */
const MAXIMUM_SECONDARY_LIGHT_INTENSITY = 4;
/** 补光与轮廓光强度的离散精度。 */
const SECONDARY_LIGHT_INTENSITY_STEP = 0.1;

/** 渲染控制面板，集中承载 WebGPU 输出和主光源配置。 */
export const RenderControls = ({
    isOpen,
    settings,
    onToggle,
    onToneMappingChange,
    onQualityPresetChange,
    onLightingPresetChange,
    onEnvironmentPresetChange,
    hdriAssets,
    onHdriChange,
    environmentError,
    environmentLoading,
    onEnvironmentIntensityChange,
    onExposureChange,
    onPixelRatioChange,
    onLightPositionXChange,
    onLightPositionYChange,
    onLightPositionZChange,
    onKeyLightIntensityChange,
    onFillLightIntensityChange,
    onRimLightIntensityChange,
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
    const fillLightIntensityControlId = `${controlIdPrefix}-fill-light-intensity`;
    const rimLightIntensityControlId = `${controlIdPrefix}-rim-light-intensity`;
    const environmentIntensityControlId = `${controlIdPrefix}-environment-intensity`;
    const hdriUrlControlId = `${controlIdPrefix}-hdri-url`;
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
                className="plane-render__render-controls-panel scroll-area-night"
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
                            <option value="three-point">三点灯光</option>
                            <option value="custom">自定义</option>
                        </select>
                    </label>
                    <label className="plane-render__render-field">
                        <span>环境来源</span>
                        <select
                            value={settings.environmentPreset}
                            onChange={onEnvironmentPresetChange}
                        >
                            <option value="room">内置工作室</option>
                            <option value="hdri">HDRI 环境</option>
                        </select>
                    </label>
                    <label className="plane-render__render-field">
                        <span>HDRI 环境</span>
                        <select
                            id={hdriUrlControlId}
                            value={settings.hdriUrl}
                            disabled={
                                settings.environmentPreset !== "hdri" ||
                                hdriAssets.length === 0
                            }
                            onChange={onHdriChange}
                        >
                            <option value="">
                                {hdriAssets.length === 0
                                    ? "hdri 目录为空"
                                    : "选择 HDRI 环境"}
                            </option>
                            {hdriAssets.map(
                                (asset: AircraftHdriAsset): ReactElement => (
                                    <option key={asset.id} value={asset.url}>
                                        {asset.label}
                                    </option>
                                ),
                            )}
                        </select>
                        {environmentLoading ? (
                            <small
                                className="plane-render__render-field-note plane-render__render-field-note--loading"
                                role="status"
                                aria-live="polite"
                            >
                                正在加载 HDRI 环境...
                            </small>
                        ) : null}
                        {environmentError !== null ? (
                            <small
                                className="plane-render__render-field-note"
                                role="status"
                            >
                                {environmentError}
                            </small>
                        ) : null}
                    </label>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            环境强度
                            <output htmlFor={environmentIntensityControlId}>
                                {settings.environmentIntensity.toFixed(2)}
                            </output>
                        </span>
                        <input
                            id={environmentIntensityControlId}
                            type="range"
                            min={MINIMUM_ENVIRONMENT_INTENSITY}
                            max={MAXIMUM_ENVIRONMENT_INTENSITY}
                            step={ENVIRONMENT_INTENSITY_STEP}
                            value={settings.environmentIntensity}
                            onChange={onEnvironmentIntensityChange}
                        />
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
                            补光强度
                            <output htmlFor={fillLightIntensityControlId}>
                                {settings.fillLightIntensity.toFixed(1)}
                            </output>
                        </span>
                        <input
                            id={fillLightIntensityControlId}
                            type="range"
                            min={MINIMUM_SECONDARY_LIGHT_INTENSITY}
                            max={MAXIMUM_SECONDARY_LIGHT_INTENSITY}
                            step={SECONDARY_LIGHT_INTENSITY_STEP}
                            value={settings.fillLightIntensity}
                            onChange={onFillLightIntensityChange}
                        />
                    </label>
                    <label className="plane-render__render-field plane-render__render-field--range">
                        <span>
                            轮廓光强度
                            <output htmlFor={rimLightIntensityControlId}>
                                {settings.rimLightIntensity.toFixed(1)}
                            </output>
                        </span>
                        <input
                            id={rimLightIntensityControlId}
                            type="range"
                            min={MINIMUM_SECONDARY_LIGHT_INTENSITY}
                            max={MAXIMUM_SECONDARY_LIGHT_INTENSITY}
                            step={SECONDARY_LIGHT_INTENSITY_STEP}
                            value={settings.rimLightIntensity}
                            onChange={onRimLightIntensityChange}
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
