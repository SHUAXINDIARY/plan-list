import { useEffect, useRef, type ReactElement } from "react";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { AircraftModelAsset } from "./modelAssets";

/** 模型视窗当前所处的初始化或加载阶段。 */
export type AircraftModelLoadingPhase =
    | "initializing"
    | "loading"
    | "ready"
    | "error";

/** 模型目录加载进度，供页面显示可访问的状态信息。 */
export interface AircraftModelLoadingProgress {
    /** 当前渲染器或模型资源的处理阶段。 */
    phase: AircraftModelLoadingPhase;
    /** 已成功加入 Three.js 场景的模型数量。 */
    loadedModelCount: number;
    /** 无法加载的模型数量。 */
    failedModelCount: number;
    /** 初始化或全部加载失败时展示的具体原因。 */
    message?: string;
}

/** 模型视窗的输入数据和对外状态回调。 */
interface AircraftModelViewportProps {
    /** 构建期收集的全部 GLB 模型资源。 */
    assets: readonly AircraftModelAsset[];
    /** 当前聚焦的模型标识，`null` 表示展示完整机队。 */
    selectedModelId: string | null;
    /** 向页面报告 WebGPU 初始化和模型加载进度。 */
    onLoadingProgressChange: (
        progress: AircraftModelLoadingProgress,
    ) => void;
}

/** 全览模式下每行展示的模型数量。 */
const MODEL_GRID_COLUMN_COUNT = 7;
/** 归一化后单架模型的最大尺寸，确保不同机型能在同一场景对比。 */
const NORMALIZED_MODEL_MAX_SIZE = 1.35;
/** 全览模式下模型之间的横向间距。 */
const MODEL_GRID_COLUMN_GAP = 2.55;
/** 全览模式下模型之间的纵向间距。 */
const MODEL_GRID_ROW_GAP = 2.55;
/** WebGPU 不可用时的用户可见提示。 */
const WEBGPU_UNAVAILABLE_MESSAGE = "当前浏览器或设备未提供 WebGPU 支持。";
/** WebGPU 初始化失败时的用户可见提示。 */
const WEBGPU_INITIALIZATION_ERROR_MESSAGE = "WebGPU 渲染器初始化失败。";
/** 模型目录为空时的用户可见提示。 */
const EMPTY_MODEL_DIRECTORY_MESSAGE = "模型目录中没有可加载的 GLB 文件。";
/** 所有模型加载失败时的用户可见提示。 */
const ALL_MODELS_FAILED_MESSAGE = "所有模型均未能加载。";

/** 释放 GLB 场景中使用的网格几何、材质和常见贴图资源。 */
const disposeSceneResources = (scene: THREE.Scene): void => {
    scene.traverse((object: THREE.Object3D): void => {
        if (!(object instanceof THREE.Mesh)) {
            return;
        }

        object.geometry.dispose();

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
        materials.forEach((material: THREE.Material): void => {
            if (material instanceof THREE.MeshStandardMaterial) {
                material.map?.dispose();
                material.aoMap?.dispose();
                material.emissiveMap?.dispose();
                material.metalnessMap?.dispose();
                material.normalMap?.dispose();
                material.roughnessMap?.dispose();
            }

            material.dispose();
        });
    });
};

/** 将模型归一化到统一尺寸，并让起落架或机身底部贴合展示平面。 */
const normalizeAircraftModel = (model: THREE.Object3D): void => {
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const largestDimension = Math.max(
        sourceSize.x,
        sourceSize.y,
        sourceSize.z,
    );

    if (largestDimension > 0) {
        model.scale.setScalar(NORMALIZED_MODEL_MAX_SIZE / largestDimension);
    }

    const normalizedBounds = new THREE.Box3().setFromObject(model);
    const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());

    model.position.x -= normalizedCenter.x;
    model.position.y -= normalizedBounds.min.y;
    model.position.z -= normalizedCenter.z;
    model.traverse((object: THREE.Object3D): void => {
        if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
};

/** 根据模型在目录中的顺序计算其在全览场景中的稳定位置。 */
const getModelGridPosition = (
    index: number,
    modelCount: number,
): THREE.Vector3 => {
    const columnCount = Math.min(MODEL_GRID_COLUMN_COUNT, modelCount);
    const rowCount = Math.ceil(modelCount / columnCount);
    const columnIndex = index % columnCount;
    const rowIndex = Math.floor(index / columnCount);

    return new THREE.Vector3(
        (columnIndex - (columnCount - 1) / 2) * MODEL_GRID_COLUMN_GAP,
        0,
        (rowIndex - (rowCount - 1) / 2) * MODEL_GRID_ROW_GAP,
    );
};

/** 将相机恢复至可同时检查所有已加载模型的全览位置。 */
const focusFleet = (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    modelCount: number,
): void => {
    const columnCount = Math.min(MODEL_GRID_COLUMN_COUNT, modelCount);
    const rowCount = Math.ceil(modelCount / columnCount);
    const fleetWidth = Math.max(
        (columnCount - 1) * MODEL_GRID_COLUMN_GAP + 3.5,
        8,
    );
    const fleetDepth = Math.max(
        (rowCount - 1) * MODEL_GRID_ROW_GAP + 3.5,
        6,
    );
    const cameraDistance = Math.max(fleetWidth, fleetDepth) * 1.15;

    controls.target.set(0, 0, 0);
    camera.position.set(
        cameraDistance * 0.8,
        cameraDistance * 0.55,
        cameraDistance,
    );
    controls.update();
};

/** 将相机聚焦至当前选中的单架模型，保留适合检查机身轮廓的角度。 */
const focusModel = (
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    model: THREE.Object3D,
): void => {
    const bounds = new THREE.Box3().setFromObject(model);
    const modelCenter = bounds.getCenter(new THREE.Vector3());
    const modelSize = bounds.getSize(new THREE.Vector3());
    const cameraDistance = Math.max(
        Math.max(modelSize.x, modelSize.y, modelSize.z) * 4,
        4.2,
    );

    controls.target.copy(modelCenter);
    camera.position.set(
        modelCenter.x + cameraDistance * 0.8,
        modelCenter.y + cameraDistance * 0.5,
        modelCenter.z + cameraDistance,
    );
    controls.update();
};

/**
 * 使用 Three.js WebGPU 渲染器加载整个子模块模型目录，并支持聚焦单架模型。
 */
export const AircraftModelViewport = ({
    assets,
    selectedModelId,
    onLoadingProgressChange,
}: AircraftModelViewportProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedModelIdRef = useRef<string | null>(selectedModelId);
    const focusSelectionRef = useRef<
        ((modelId: string | null) => void) | null
    >(null);

    useEffect((): void => {
        selectedModelIdRef.current = selectedModelId;
        focusSelectionRef.current?.(selectedModelId);
    }, [selectedModelId]);

    useEffect((): (() => void) | undefined => {
        const container = containerRef.current;

        if (container === null) {
            return undefined;
        }

        let isDisposed = false;
        let cleanupRenderer: (() => void) | undefined;

        /** 在组件未卸载时将模型加载进度回传给页面。 */
        const publishProgress = (
            progress: AircraftModelLoadingProgress,
        ): void => {
            if (!isDisposed) {
                onLoadingProgressChange(progress);
            }
        };

        /** 初始化 WebGPU 场景，再并发加载整个模型目录。 */
        const initializeViewport = async (): Promise<void> => {
            if (assets.length === 0) {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    message: EMPTY_MODEL_DIRECTORY_MESSAGE,
                });
                return;
            }

            if (!("gpu" in navigator)) {
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    message: WEBGPU_UNAVAILABLE_MESSAGE,
                });
                return;
            }

            const renderer = new WebGPURenderer({
                alpha: true,
                antialias: true,
            });

            try {
                await renderer.init();
            } catch {
                renderer.dispose();
                publishProgress({
                    phase: "error",
                    loadedModelCount: 0,
                    failedModelCount: 0,
                    message: WEBGPU_INITIALIZATION_ERROR_MESSAGE,
                });
                return;
            }

            if (isDisposed) {
                renderer.dispose();
                return;
            }

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
            const controls = new OrbitControls(camera, renderer.domElement);
            const modelGroup = new THREE.Group();
            const modelById = new Map<string, THREE.Object3D>();
            const gltfLoader = new GLTFLoader();

            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.shadowMap.enabled = true;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;
            renderer.domElement.className = "plane-render__canvas";
            renderer.domElement.setAttribute("aria-hidden", "true");
            container.appendChild(renderer.domElement);

            controls.enableDamping = true;
            controls.dampingFactor = 0.065;
            controls.minDistance = 2.5;
            controls.maxDistance = 35;
            controls.maxPolarAngle = Math.PI * 0.49;
            focusFleet(camera, controls, assets.length);

            scene.add(modelGroup);
            scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x102737, 2.1));

            const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
            keyLight.position.set(7, 10, 8);
            keyLight.castShadow = true;
            scene.add(keyLight);

            const fillLight = new THREE.DirectionalLight(0x8acbe7, 1.2);
            fillLight.position.set(-9, 4, -5);
            scene.add(fillLight);

            const displayFloor = new THREE.Mesh(
                new THREE.PlaneGeometry(24, 10),
                new THREE.MeshStandardMaterial({
                    color: 0x163343,
                    roughness: 0.82,
                    metalness: 0.08,
                }),
            );
            displayFloor.rotation.x = -Math.PI / 2;
            displayFloor.position.y = -0.015;
            displayFloor.receiveShadow = true;
            scene.add(displayFloor);

            /** 在保留全览布局的同时切换相机至选中的模型或机队。 */
            const focusSelection = (modelId: string | null): void => {
                if (modelId === null) {
                    focusFleet(camera, controls, assets.length);
                    return;
                }

                const selectedModel = modelById.get(modelId);

                if (selectedModel !== undefined) {
                    focusModel(camera, controls, selectedModel);
                }
            };

            focusSelectionRef.current = focusSelection;

            /** 根据容器实际尺寸更新相机投影和 WebGPU 画布分辨率。 */
            const resizeRenderer = (): void => {
                const { width, height } = container.getBoundingClientRect();
                const resolvedWidth = Math.max(width, 1);
                const resolvedHeight = Math.max(height, 1);

                camera.aspect = resolvedWidth / resolvedHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(resolvedWidth, resolvedHeight, false);
            };

            const resizeObserver = new ResizeObserver(resizeRenderer);
            resizeObserver.observe(container);
            resizeRenderer();

            /** 在 Three.js 动画循环中保持 OrbitControls 的阻尼交互与场景绘制。 */
            const renderFrame = (): void => {
                controls.update();
                renderer.render(scene, camera);
            };

            void renderer.setAnimationLoop(renderFrame);
            cleanupRenderer = (): void => {
                resizeObserver.disconnect();
                void renderer.setAnimationLoop(null);
                controls.dispose();
                disposeSceneResources(scene);
                renderer.dispose();
                renderer.domElement.remove();
            };

            if (isDisposed) {
                cleanupRenderer();
                return;
            }

            publishProgress({
                phase: "loading",
                loadedModelCount: 0,
                failedModelCount: 0,
            });

            let loadedModelCount = 0;
            let failedModelCount = 0;

            await Promise.all(
                assets.map(
                    async (
                        asset: AircraftModelAsset,
                        index: number,
                    ): Promise<void> => {
                        try {
                            const gltf = await gltfLoader.loadAsync(
                                await asset.loadUrl(),
                            );

                            if (isDisposed) {
                                return;
                            }

                            const model = gltf.scene;
                            normalizeAircraftModel(model);
                            model.position.add(
                                getModelGridPosition(index, assets.length),
                            );
                            modelGroup.add(model);
                            modelById.set(asset.id, model);
                            loadedModelCount += 1;
                            if (selectedModelIdRef.current === asset.id) {
                                focusSelection(asset.id);
                            }
                            publishProgress({
                                phase: "loading",
                                loadedModelCount,
                                failedModelCount,
                            });
                        } catch {
                            failedModelCount += 1;
                            publishProgress({
                                phase: "loading",
                                loadedModelCount,
                                failedModelCount,
                            });
                        }
                    },
                ),
            );

            if (isDisposed) {
                return;
            }

            focusSelection(selectedModelIdRef.current);
            publishProgress({
                phase: loadedModelCount > 0 ? "ready" : "error",
                loadedModelCount,
                failedModelCount,
                message:
                    loadedModelCount > 0
                        ? undefined
                        : ALL_MODELS_FAILED_MESSAGE,
            });
        };

        void initializeViewport();

        return (): void => {
            isDisposed = true;
            focusSelectionRef.current = null;
            cleanupRenderer?.();
        };
    }, [assets, onLoadingProgressChange]);

    return <div ref={containerRef} className="plane-render__viewport-canvas" />;
};
