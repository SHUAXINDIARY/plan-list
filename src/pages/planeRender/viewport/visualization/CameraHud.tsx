import type { ReactElement } from "react";
import { formatCameraHudAngle } from "../camera";
import type { AircraftCameraHudState } from "../types";

/** 相机 HUD 的展示输入，状态由相机生命周期采样后传入。 */
interface CameraHudProps {
    /** 当前相机方位、距离与世界轴投影。 */
    state: AircraftCameraHudState;
}

/** 展示当前相机方位和世界轴投影，避免 HUD JSX 污染视窗协调器。 */
export const CameraHud = ({ state }: CameraHudProps): ReactElement => (
    <div
        className="plane-render__camera-hud"
        role="group"
        aria-label="观察相机状态"
    >
        <div className="plane-render__camera-hud-axis" aria-hidden="true">
            <span
                className="plane-render__camera-hud-axis-line plane-render__camera-hud-axis-line--x"
                style={{
                    transform: `rotate(${state.axisX.angle}deg)`,
                    opacity: state.axisX.opacity,
                }}
            />
            <span
                className="plane-render__camera-hud-axis-line plane-render__camera-hud-axis-line--y"
                style={{
                    transform: `rotate(${state.axisY.angle}deg)`,
                    opacity: state.axisY.opacity,
                }}
            />
            <span
                className="plane-render__camera-hud-axis-line plane-render__camera-hud-axis-line--z"
                style={{
                    transform: `rotate(${state.axisZ.angle}deg)`,
                    opacity: state.axisZ.opacity,
                }}
            />
            <span className="plane-render__camera-hud-origin" />
        </div>
        <div className="plane-render__camera-hud-readout">
            <span>AZ {formatCameraHudAngle(state.azimuth)}</span>
            <span>EL {formatCameraHudAngle(state.elevation)}</span>
            <span>DIST {state.distance.toFixed(2)}</span>
        </div>
    </div>
);
