import * as THREE from "three";
import type { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { AircraftCamera } from "../types";
import { ORTHOGRAPHIC_FRUSTUM_HEIGHT } from "../camera";

/** 渲染循环创建所需的 Three.js 资源和动画状态读取器。 */
export interface AircraftRenderLoopOptions {
    /** 承载 canvas 的视窗元素。 */
    container: HTMLElement;
    /** 当前 WebGPU 渲染器。 */
    renderer: WebGPURenderer;
    /** 当前场景。 */
    scene: THREE.Scene;
    /** 获取可能在投影切换时替换的相机。 */
    getCamera: () => AircraftCamera;
    /** 获取可能在投影切换时替换的轨道控制器。 */
    getControls: () => OrbitControls<AircraftCamera>;
    /** 获取当前动画混合器。 */
    getAnimationMixer: () => THREE.AnimationMixer | null;
    /** 获取当前动画动作。 */
    getAnimationAction: () => THREE.AnimationAction | null;
    /** 用于暂停期间避免累计时间差的 Three.js 计时器。 */
    animationTimer: THREE.Timer;
    /** 获取动画是否正在播放。 */
    isAnimationPlaying: () => boolean;
    /** 将动画时间节流同步到 React 状态。 */
    onAnimationTimeChange: (currentTime: number) => void;
    /** 获取当前用户设置的物理像素倍率。 */
    getPixelRatio: () => number;
    /** 获取 renderer 是否因设备丢失而不可用。 */
    isRendererUnavailable: () => boolean;
}

/** 可供初始化 effect 使用的渲染循环句柄。 */
export interface AircraftRenderLoopHandle {
    /** 请求下一帧按需绘制。 */
    requestRender: () => void;
    /** 根据容器尺寸更新相机投影和 canvas 分辨率。 */
    resizeRenderer: () => void;
    /** 取消帧请求并解除可见性观察。 */
    cleanup: () => void;
}

/** 创建按需渲染循环，并统一管理尺寸、页面可见性和视窗可见性。 */
export const createAircraftRenderLoop = ({
    container,
    renderer,
    scene,
    getCamera,
    getControls,
    getAnimationMixer,
    getAnimationAction,
    animationTimer,
    isAnimationPlaying,
    onAnimationTimeChange,
    getPixelRatio,
    isRendererUnavailable,
}: AircraftRenderLoopOptions): AircraftRenderLoopHandle => {
    let isDisposed = false;
    let animationFrameId: number | null = null;
    let isDocumentVisible = document.visibilityState === "visible";
    let isViewportVisible = true;
    let animationUiAccumulator = 0;

    /** 取消尚未执行的按需绘制帧。 */
    const cancelScheduledFrame = (): void => {
        if (animationFrameId === null) {
            return;
        }

        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    };

    /** 根据容器实际尺寸更新当前相机和 WebGPU 画布。 */
    const resizeRenderer = (): void => {
        const camera = getCamera();
        const { width, height } = container.getBoundingClientRect();
        const resolvedWidth = Math.max(width, 1);
        const resolvedHeight = Math.max(height, 1);
        const aspect = resolvedWidth / resolvedHeight;

        if (camera instanceof THREE.OrthographicCamera) {
            const halfHeight = ORTHOGRAPHIC_FRUSTUM_HEIGHT / 2;
            const halfWidth = halfHeight * aspect;

            camera.left = -halfWidth;
            camera.right = halfWidth;
            camera.top = halfHeight;
            camera.bottom = -halfHeight;
        } else {
            camera.aspect = aspect;
        }

        camera.updateProjectionMatrix();
        renderer.setPixelRatio(getPixelRatio());
        renderer.setSize(resolvedWidth, resolvedHeight, false);
        requestRender();
    };

    /** 更新控制器和动画，再绘制单帧；无变化时不继续占用帧循环。 */
    const renderFrame = (): void => {
        animationFrameId = null;

        if (
            isDisposed ||
            isRendererUnavailable() ||
            !isDocumentVisible ||
            !isViewportVisible
        ) {
            return;
        }

        const controlsChanged = getControls().update();
        const animationMixer = getAnimationMixer();

        if (isAnimationPlaying() && animationMixer !== null) {
            animationTimer.update();
            const animationDelta = animationTimer.getDelta();
            animationMixer.update(animationDelta);
            animationUiAccumulator += animationDelta;

            if (animationUiAccumulator >= 0.1) {
                animationUiAccumulator = 0;
                onAnimationTimeChange(getAnimationAction()?.time ?? 0);
            }
        }

        renderer.render(scene, getCamera());

        if (controlsChanged || isAnimationPlaying()) {
            requestRender();
        }
    };

    /** 在可见时请求下一帧，阻尼结束后自动停止。 */
    const requestRender = (): void => {
        if (
            isDisposed ||
            isRendererUnavailable() ||
            !isDocumentVisible ||
            !isViewportVisible ||
            animationFrameId !== null
        ) {
            return;
        }

        animationFrameId = requestAnimationFrame(renderFrame);
    };

    /** 页面重新可见时补一帧，隐藏时暂停待执行帧。 */
    const handleVisibilityChange = (): void => {
        isDocumentVisible = document.visibilityState === "visible";

        if (isDocumentVisible) {
            if (isAnimationPlaying()) {
                animationTimer.reset();
            }
            requestRender();
            return;
        }

        animationTimer.reset();
        cancelScheduledFrame();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(container);

    const intersectionObserver =
        typeof IntersectionObserver === "undefined"
            ? null
            : new IntersectionObserver(([entry]): void => {
                  isViewportVisible = entry?.isIntersecting ?? true;

                  if (isViewportVisible) {
                      if (isAnimationPlaying()) {
                          animationTimer.reset();
                      }
                      requestRender();
                      return;
                  }

                  animationTimer.reset();
                  cancelScheduledFrame();
              });

    intersectionObserver?.observe(container);

    /** 解除观察者并停止后续帧请求。 */
    const cleanup = (): void => {
        isDisposed = true;
        resizeObserver.disconnect();
        intersectionObserver?.disconnect();
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        cancelScheduledFrame();
    };

    resizeRenderer();
    requestRender();

    return { requestRender, resizeRenderer, cleanup };
};
