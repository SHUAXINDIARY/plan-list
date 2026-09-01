import type { AircraftAnimationState } from "../types";

/** GLB 未提供动画名称时显示的回退名称。 */
export const DEFAULT_MODEL_ANIMATION_NAME = "模型动画";

/** 初始动画状态，模型无动画时不渲染播放控件。 */
export const EMPTY_ANIMATION_STATE: AircraftAnimationState = {
    available: false,
    name: "",
    duration: 0,
    currentTime: 0,
    isPlaying: false,
};
