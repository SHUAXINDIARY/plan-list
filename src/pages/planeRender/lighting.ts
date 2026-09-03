import * as THREE from "three";
import { PMREMGenerator } from "three/webgpu";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
export type {
    AircraftEnvironmentPreset,
    AircraftEnvironmentSettings,
    AircraftLightingSettings,
} from "./viewport/types";

import type { AircraftLightingSettings } from "./viewport/types";

/** 模型视窗使用的三点灯光对象集合。 */
export interface AircraftLightingRig {
    /** 顶部半球环境填充，保持未启用三点模式时的原有基线。 */
    hemisphereLight: THREE.HemisphereLight;
    /** 主方向光，负责关键明暗和实时阴影。 */
    keyLight: THREE.DirectionalLight;
    /** 位于相机左后方的冷色补光。 */
    fillLight: THREE.DirectionalLight;
    /** 位于机身右后方的轮廓光，不投射阴影。 */
    rimLight: THREE.DirectionalLight;
}

/** 内置工作室环境以及当前 HDRI PMREM 的资源句柄。 */
export interface AircraftEnvironmentResources {
    /** 用于回退和默认模式的 RoomEnvironment 场景。 */
    roomScene: RoomEnvironment;
    /** RoomEnvironment 生成的 PMREM 目标。 */
    roomRenderTarget: THREE.RenderTarget;
    /** 当前 HDRI 生成的 PMREM 目标，使用内置环境时为空。 */
    hdriRenderTarget: THREE.RenderTarget | null;
}

/** 使用当前主题色创建可复用的三点灯光 rig。 */
export const createAircraftLightingRig = (
    settings: AircraftLightingSettings,
    keyLightColor: THREE.ColorRepresentation,
    fillLightColor: THREE.ColorRepresentation,
    rimLightColor: THREE.ColorRepresentation,
): AircraftLightingRig => {
    const hemisphereLight = new THREE.HemisphereLight(0xeaf6ff, 0x102737, 2.1);
    const keyLight = new THREE.DirectionalLight(keyLightColor, settings.keyLightIntensity);
    const fillLight = new THREE.DirectionalLight(fillLightColor, settings.fillLightIntensity);
    const rimLight = new THREE.DirectionalLight(rimLightColor, settings.rimLightIntensity);

    keyLight.position.set(
        settings.lightPositionX,
        settings.lightPositionY,
        settings.lightPositionZ,
    );
    fillLight.position.set(-9, 4, -5);
    rimLight.position.set(7, 5, -10);
    keyLight.castShadow = true;

    return { hemisphereLight, keyLight, fillLight, rimLight };
};

/** 将控制面板参数同步到已创建的三点灯光对象。 */
export const applyAircraftLightingSettings = (
    rig: AircraftLightingRig,
    settings: AircraftLightingSettings,
): void => {
    rig.keyLight.position.set(
        settings.lightPositionX,
        settings.lightPositionY,
        settings.lightPositionZ,
    );
    rig.keyLight.intensity = settings.keyLightIntensity;
    rig.fillLight.intensity = settings.fillLightIntensity;
    rig.rimLight.intensity = settings.rimLightIntensity;
};

/** 从内置 RoomEnvironment 生成默认的 PMREM 环境贴图。 */
export const createRoomEnvironmentResources = (
    pmremGenerator: PMREMGenerator,
): AircraftEnvironmentResources => {
    const roomScene = new RoomEnvironment();
    const roomRenderTarget = pmremGenerator.fromScene(roomScene);

    return {
        roomScene,
        roomRenderTarget,
        hdriRenderTarget: null,
    };
};

/** 加载 RGBE HDR 文件并转换为适用于 PBR 材质的 PMREM 目标。 */
export const loadHdriEnvironment = async (
    pmremGenerator: PMREMGenerator,
    url: string,
): Promise<THREE.RenderTarget> => {
    const normalizedUrl = url.trim();

    if (normalizedUrl.length === 0) {
        throw new Error("HDRI 资源不能为空。");
    }

    const hdrTexture = await new HDRLoader().loadAsync(normalizedUrl);
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

    try {
        return pmremGenerator.fromEquirectangular(hdrTexture);
    } finally {
        hdrTexture.dispose();
    }
};

/** 释放当前 HDRI PMREM，同时保留 RoomEnvironment 作为稳定回退。 */
export const disposeHdriEnvironment = (resources: AircraftEnvironmentResources): void => {
    resources.hdriRenderTarget?.dispose();
    resources.hdriRenderTarget = null;
};

/** 释放 RoomEnvironment、其 PMREM 与当前 HDRI 资源。 */
export const disposeEnvironmentResources = (resources: AircraftEnvironmentResources): void => {
    disposeHdriEnvironment(resources);
    resources.roomRenderTarget.dispose();
    resources.roomScene.dispose();
};
