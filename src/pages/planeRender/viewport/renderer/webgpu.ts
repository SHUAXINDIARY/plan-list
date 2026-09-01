import { WebGPURenderer } from "three/webgpu";

/** 判断当前运行环境是否暴露 WebGPU 入口，调用方负责展示业务错误状态。 */
export const hasAircraftWebGPUSupport = (): boolean =>
    typeof navigator !== "undefined" && "gpu" in navigator;

/** 创建并初始化模型视窗使用的 WebGPU 渲染器，失败时将初始化异常交给生命周期层。 */
export const initializeAircraftWebGPURenderer = async (): Promise<WebGPURenderer> => {
    const renderer = new WebGPURenderer({
        alpha: true,
        antialias: true,
    });

    try {
        await renderer.init();
        return renderer;
    } catch (error) {
        renderer.dispose();
        throw error;
    }
};
