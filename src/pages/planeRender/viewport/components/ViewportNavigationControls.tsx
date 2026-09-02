import type { ChangeEvent, ReactElement } from "react";
import type {
    AircraftCameraView,
    AircraftProjectionMode,
} from "../types";

/** 相机导航工具栏的状态和命令回调。 */
export interface ViewportNavigationControlsProps {
    /** 当前相机标准视角。 */
    cameraView: AircraftCameraView;
    /** 修改相机标准视角。 */
    onCameraViewChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 当前相机投影模式。 */
    projectionMode: AircraftProjectionMode;
    /** 修改相机投影模式。 */
    onProjectionModeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    /** 当前模型是否已经可以导出。 */
    isSnapshotAvailable: boolean;
    /** 导出 PNG 截图。 */
    onSnapshotExport: () => void;
    /** 导出 JSON 检查设置。 */
    onSettingsExport: () => void;
}

/** 仅承载相机导航和导出命令，不持有 Three.js 资源。 */
export const ViewportNavigationControls = ({
    cameraView,
    onCameraViewChange,
    projectionMode,
    onProjectionModeChange,
    isSnapshotAvailable,
    onSnapshotExport,
    onSettingsExport,
}: ViewportNavigationControlsProps): ReactElement => (
    <>
        <label className="plane-render__camera-view-control">
            <span className="plane-render__visually-hidden">相机视角</span>
            <select
                aria-label="相机视角"
                value={cameraView}
                onChange={onCameraViewChange}
            >
                <option value="custom">自定义视角</option>
                <option value="fit">适配视图</option>
                <option value="front">正面</option>
                <option value="side">侧面</option>
                <option value="top">顶部</option>
                <option value="bottom">底部</option>
            </select>
        </label>
        <label className="plane-render__camera-projection-control">
            <span className="plane-render__visually-hidden">
                摄像机投影模式
            </span>
            <select
                aria-label="摄像机投影模式"
                value={projectionMode}
                onChange={onProjectionModeChange}
            >
                <option value="perspective">Perspective 透视</option>
                <option value="orthographic">Orthographic 正交</option>
            </select>
        </label>
        <button
            className="plane-render__viewport-action"
            type="button"
            disabled={!isSnapshotAvailable}
            onClick={onSnapshotExport}
        >
            导出 PNG
        </button>
        <button
            className="plane-render__viewport-action"
            type="button"
            disabled={!isSnapshotAvailable}
            onClick={onSettingsExport}
        >
            导出设置
        </button>
    </>
);
