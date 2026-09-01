import type { ChangeEvent, ReactElement } from "react";
import type { AircraftAnimationState } from "../types";

/** 动画控制条的输入状态与时间轴交互回调。 */
interface AnimationControlsProps {
    /** 当前 GLB 动画状态。 */
    state: AircraftAnimationState;
    /** 播放或暂停第一段 GLB 动画。 */
    onToggle: () => void;
    /** 将动画时间轴定位到目标秒数。 */
    onScrub: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** 展示 GLB 动画播放和时间轴操作，隔离动画 UI 与 Three.js 生命周期。 */
export const AnimationControls = ({
    state,
    onToggle,
    onScrub,
}: AnimationControlsProps): ReactElement => (
    <div className="plane-render__animation-controls">
        <div className="plane-render__animation-heading">
            <span>{state.name}</span>
            <output>
                {state.currentTime.toFixed(1)}s / {state.duration.toFixed(1)}s
            </output>
        </div>
        <div className="plane-render__animation-row">
            <button
                className="plane-render__viewport-action"
                type="button"
                onClick={onToggle}
            >
                {state.isPlaying ? "暂停" : "播放"}
            </button>
            <label className="plane-render__animation-range">
                <span className="plane-render__visually-hidden">动画时间</span>
                <input
                    aria-label="动画时间"
                    type="range"
                    min={0}
                    max={state.duration}
                    step={0.01}
                    value={state.currentTime}
                    onChange={onScrub}
                />
            </label>
        </div>
    </div>
);
