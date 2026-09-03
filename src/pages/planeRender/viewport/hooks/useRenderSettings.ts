import { useState, type ChangeEvent } from "react";
import { AIRCRAFT_HDRI_ASSETS } from "../../hdriAssets";
import {
    isAircraftEnvironmentPreset,
    isAircraftLightingPreset,
    LIGHTING_PRESET_VALUES,
} from "../scene";
import {
    createDefaultRenderSettings,
    getQualityPresetSettings,
    isAircraftRenderQuality,
    isAircraftShadowMode,
    isAircraftToneMapping,
} from "../renderer";
import type { AircraftRenderSettings } from "../types";

/** 渲染设置控制器对外提供的状态和表单事件。 */
export interface AircraftRenderSettingsController {
    /** 当前应用于 WebGPU 场景的渲染设置。 */
    settings: AircraftRenderSettings;
    /** 处理色调映射 select 的变更。 */
    onToneMappingChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理画质预设 select 的变更。 */
    onQualityPresetChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理照明预设 select 的变更。 */
    onLightingPresetChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理环境来源 select 的变更。 */
    onEnvironmentPresetChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理 HDRI select 的变更。 */
    onHdriChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 处理环境强度滑块的变更。 */
    onEnvironmentIntensityChange: (event: ChangeEvent<HTMLInputElement>) => void;
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
    onKeyLightIntensityChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理补光强度滑块的变更。 */
    onFillLightIntensityChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理轮廓光强度滑块的变更。 */
    onRimLightIntensityChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理实时阴影开关的变更。 */
    onShadowsEnabledChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理展示平面开关的变更。 */
    onDisplayFloorChange: (event: ChangeEvent<HTMLInputElement>) => void;
    /** 处理阴影算法 select 的变更。 */
    onShadowModeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 恢复渲染控制的默认设置。 */
    onReset: () => void;
}

/** 负责解析渲染控制输入，并保持预设与 custom 标记的一致性。 */
export const useRenderSettings = (): AircraftRenderSettingsController => {
    const [settings, setSettings] = useState<AircraftRenderSettings>(createDefaultRenderSettings);

    /** 更新单个场景设置，避免表单 handler 重复展开对象。 */
    const updateSetting = <Key extends keyof AircraftRenderSettings>(
        key: Key,
        value: AircraftRenderSettings[Key],
    ): void => {
        setSettings((currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
            ...currentSettings,
            [key]: value,
        }));
    };

    /** 修改灯光参数后将灯光预设标记为 custom。 */
    const updateLightingSetting = <Key extends keyof AircraftRenderSettings>(
        key: Key,
        value: AircraftRenderSettings[Key],
    ): void => {
        setSettings((currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
            ...currentSettings,
            [key]: value,
            lightingPreset: "custom",
        }));
    };

    /** 只接受 select 声明过的色调映射值。 */
    const onToneMappingChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        const value = event.currentTarget.value;

        if (isAircraftToneMapping(value)) {
            updateSetting("toneMapping", value);
        }
    };

    /** 应用质量预设，同时覆盖其声明的像素倍率和阴影参数。 */
    const onQualityPresetChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        const value = event.currentTarget.value;

        if (!isAircraftRenderQuality(value) || value === "custom") {
            return;
        }

        setSettings((currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
            ...currentSettings,
            ...getQualityPresetSettings(value),
            qualityPreset: value,
        }));
    };

    /** 应用照明预设，同时覆盖其声明的灯光参数。 */
    const onLightingPresetChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        const value = event.currentTarget.value;

        if (!isAircraftLightingPreset(value) || value === "custom") {
            return;
        }

        setSettings((currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
            ...currentSettings,
            ...LIGHTING_PRESET_VALUES[value],
            lightingPreset: value,
        }));
    };

    /** 切换内置工作室和 HDRI，并为 HDRI 首次选择补上默认资源。 */
    const onEnvironmentPresetChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        const value = event.currentTarget.value;

        if (!isAircraftEnvironmentPreset(value)) {
            return;
        }

        const firstHdriUrl = AIRCRAFT_HDRI_ASSETS[0]?.url ?? "";
        setSettings((currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
            ...currentSettings,
            environmentPreset: value,
            hdriUrl:
                value === "hdri" && currentSettings.hdriUrl.length === 0
                    ? firstHdriUrl
                    : currentSettings.hdriUrl,
        }));
    };

    /** 选择 HDRI 目录中的运行时 URL。 */
    const onHdriChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        updateSetting("hdriUrl", event.currentTarget.value);
    };

    /** 更新环境反射强度。 */
    const onEnvironmentIntensityChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateSetting("environmentIntensity", Number(event.currentTarget.value));
    };

    /** 更新色调映射曝光。 */
    const onExposureChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateSetting("exposure", Number(event.currentTarget.value));
    };

    /** 更新 WebGPU 画布的物理像素倍率。 */
    const onPixelRatioChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateSetting("pixelRatio", Number(event.currentTarget.value));
    };

    /** 更新主方向光位置并切换到自定义照明。 */
    const onLightPositionXChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateLightingSetting("lightPositionX", Number(event.currentTarget.value));
    };

    /** 更新主方向光位置并切换到自定义照明。 */
    const onLightPositionYChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateLightingSetting("lightPositionY", Number(event.currentTarget.value));
    };

    /** 更新主方向光位置并切换到自定义照明。 */
    const onLightPositionZChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateLightingSetting("lightPositionZ", Number(event.currentTarget.value));
    };

    /** 更新主方向光强度并切换到自定义照明。 */
    const onKeyLightIntensityChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateLightingSetting("keyLightIntensity", Number(event.currentTarget.value));
    };

    /** 更新补光强度并切换到自定义照明。 */
    const onFillLightIntensityChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateLightingSetting("fillLightIntensity", Number(event.currentTarget.value));
    };

    /** 更新轮廓光强度并切换到自定义照明。 */
    const onRimLightIntensityChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateLightingSetting("rimLightIntensity", Number(event.currentTarget.value));
    };

    /** 切换场景级阴影并将画质预设标记为 custom。 */
    const onShadowsEnabledChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setSettings((currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
            ...currentSettings,
            shadowsEnabled: event.currentTarget.checked,
            qualityPreset: "custom",
        }));
    };

    /** 切换飞机底部展示平面。 */
    const onDisplayFloorChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateSetting("displayFloor", event.currentTarget.checked);
    };

    /** 只接受已声明的阴影算法。 */
    const onShadowModeChange = (event: ChangeEvent<HTMLSelectElement>): void => {
        const value = event.currentTarget.value;

        if (!isAircraftShadowMode(value)) {
            return;
        }

        setSettings((currentSettings: AircraftRenderSettings): AircraftRenderSettings => ({
            ...currentSettings,
            shadowMode: value,
            qualityPreset: "custom",
        }));
    };

    /** 恢复当前设备上的默认渲染基线。 */
    const onReset = (): void => {
        setSettings(createDefaultRenderSettings());
    };

    return {
        settings,
        onToneMappingChange,
        onQualityPresetChange,
        onLightingPresetChange,
        onEnvironmentPresetChange,
        onHdriChange,
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
    };
};
