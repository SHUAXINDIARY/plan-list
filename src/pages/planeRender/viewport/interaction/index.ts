/** 判断指针事件是否落在工具面板内，避免误收起当前交互面板。 */
export const isViewportControlTarget = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    (target.closest(".plane-render__viewport-tools") !== null ||
        target.closest(".plane-render__lighting-hud") !== null ||
        target.closest(".plane-render__fullscreen-model-dir") !== null);
