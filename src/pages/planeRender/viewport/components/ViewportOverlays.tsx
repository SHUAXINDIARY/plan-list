import type { ReactElement } from "react";
import ModelDir from "../../ModelDir";
import { AnimationControls } from "../animation";
import type { AircraftAnimationState, AircraftCameraHudState } from "../types";
import { CameraHud } from "../visualization";

/** 视窗覆盖层的输入状态和交互回调。 */
export interface ViewportOverlaysProps {
    /** 当前是否处于全屏模式。 */
    isFullscreen: boolean;
    /** 全屏模型目录是否展开。 */
    isModelDirectoryOpen: boolean;
    /** 模型目录按钮和面板使用的稳定 ID。 */
    modelDirectoryId: string;
    /** 当前页面选中的模型 ID。 */
    selectedModelId: string;
    /** 选择模型后通知页面切换资源。 */
    onModelSelection: (modelId: string) => void;
    /** 当前相机 HUD 状态；未初始化时为空。 */
    cameraHudState: AircraftCameraHudState | null;
    /** 当前动画状态。 */
    animationState: AircraftAnimationState;
    /** 切换动画播放状态。 */
    onAnimationToggle: () => void;
    /** 拖动动画时间轴。 */
    onAnimationScrub: React.ComponentProps<typeof AnimationControls>["onScrub"];
    /** 全屏请求错误信息。 */
    fullscreenError: string | null;
    /** 导出操作错误信息。 */
    snapshotError: string | null;
}

/** 渲染目录、HUD、动画控制和状态提示等非 canvas 内容。 */
export const ViewportOverlays = ({
    isFullscreen,
    isModelDirectoryOpen,
    modelDirectoryId,
    selectedModelId,
    onModelSelection,
    cameraHudState,
    animationState,
    onAnimationToggle,
    onAnimationScrub,
    fullscreenError,
    snapshotError,
}: ViewportOverlaysProps): ReactElement => (
    <>
        {isFullscreen && isModelDirectoryOpen ? (
            <div id={modelDirectoryId} className="plane-render__fullscreen-model-dir">
                <ModelDir selectedModelId={selectedModelId} onModelSelection={onModelSelection} />
            </div>
        ) : null}
        {cameraHudState !== null ? <CameraHud state={cameraHudState} /> : null}
        {animationState.available ? (
            <AnimationControls
                state={animationState}
                onToggle={onAnimationToggle}
                onScrub={onAnimationScrub}
            />
        ) : null}
        {fullscreenError !== null ? (
            <p className="plane-render__fullscreen-error" role="alert">
                {fullscreenError}
            </p>
        ) : null}
        {snapshotError !== null ? (
            <p className="plane-render__snapshot-error" role="alert">
                {snapshotError}
            </p>
        ) : null}
        <div className="plane-render__loading-overlay" aria-hidden="true">
            <span className="plane-render__loading-spinner" />
        </div>
    </>
);
