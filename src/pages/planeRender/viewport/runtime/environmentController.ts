import * as THREE from "three";
import { PMREMGenerator } from "three/webgpu";
import {
    disposeHdriEnvironment,
    loadHdriEnvironment,
    type AircraftEnvironmentResources,
} from "../scene";
import type { AircraftRenderSettings } from "../types";

/** HDRI 环境控制器创建所需的场景资源和状态回调。 */
export interface AircraftEnvironmentControllerOptions {
    /** 用于将 HDRI 转换为 PMREM 的生成器。 */
    environmentGenerator: PMREMGenerator;
    /** 内置工作室与当前 HDRI 的资源句柄。 */
    resources: AircraftEnvironmentResources;
    /** 接收环境贴图的 Three.js 场景。 */
    scene: THREE.Scene;
    /** 读取最新设置，用于丢弃过期异步请求。 */
    getCurrentSettings: () => AircraftRenderSettings;
    /** 判断视窗是否已卸载。 */
    isDisposed: () => boolean;
    /** 发布 HDRI 加载状态。 */
    onLoadingChange: (isLoading: boolean) => void;
    /** 发布 HDRI 加载失败或回退提示。 */
    onErrorChange: (message: string | null) => void;
    /** 环境贴图替换完成后请求一帧绘制。 */
    requestRender: () => void;
}

/** 可供 React effect 调用并在清理时失效的环境控制器。 */
export interface AircraftEnvironmentController {
    /** 应用当前环境设置，HDRI 失败时回退到内置工作室。 */
    apply: (settings: AircraftRenderSettings) => Promise<void>;
    /** 使尚未完成的异步 HDRI 请求失效。 */
    invalidate: () => void;
}

/** 创建带竞态保护的 HDRI/工作室环境切换控制器。 */
export const createAircraftEnvironmentController = ({
    environmentGenerator,
    resources,
    scene,
    getCurrentSettings,
    isDisposed,
    onLoadingChange,
    onErrorChange,
    requestRender,
}: AircraftEnvironmentControllerOptions): AircraftEnvironmentController => {
    let requestToken = 0;

    /** 判断异步结果是否仍对应当前环境选择。 */
    const isCurrentSelection = (settings: AircraftRenderSettings): boolean => {
        const currentSettings = getCurrentSettings();

        return (
            currentSettings.environmentPreset === settings.environmentPreset &&
            currentSettings.hdriUrl === settings.hdriUrl
        );
    };

    /** 应用环境设置并处理空选择、竞态和失败回退。 */
    const apply = async (settings: AircraftRenderSettings): Promise<void> => {
        if (isDisposed()) {
            return;
        }

        const currentRequestToken = ++requestToken;
        scene.environmentIntensity = settings.environmentIntensity;

        if (
            settings.environmentPreset === "room" ||
            settings.hdriUrl.trim().length === 0
        ) {
            disposeHdriEnvironment(resources);
            scene.environment = resources.roomRenderTarget.texture;
            onLoadingChange(false);
            onErrorChange(
                settings.environmentPreset === "hdri"
                    ? "请选择 HDRI 环境，当前已回退内置工作室。"
                    : null,
            );
            requestRender();
            return;
        }

        onErrorChange(null);
        onLoadingChange(true);

        try {
            const hdriRenderTarget = await loadHdriEnvironment(
                environmentGenerator,
                settings.hdriUrl,
            );

            if (
                isDisposed() ||
                currentRequestToken !== requestToken ||
                !isCurrentSelection(settings)
            ) {
                hdriRenderTarget.dispose();
                return;
            }

            disposeHdriEnvironment(resources);
            resources.hdriRenderTarget = hdriRenderTarget;
            scene.environment = hdriRenderTarget.texture;
            onLoadingChange(false);
            onErrorChange(null);
            requestRender();
        } catch {
            if (
                isDisposed() ||
                currentRequestToken !== requestToken ||
                !isCurrentSelection(settings)
            ) {
                return;
            }

            disposeHdriEnvironment(resources);
            scene.environment = resources.roomRenderTarget.texture;
            onLoadingChange(false);
            onErrorChange("HDRI 加载失败，当前已回退内置工作室。");
            requestRender();
        }
    };

    /** 递增 token，使所有尚未完成的请求结果失效。 */
    const invalidate = (): void => {
        requestToken += 1;
    };

    return { apply, invalidate };
};
