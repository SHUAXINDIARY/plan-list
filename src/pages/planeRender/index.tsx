import { useCallback, useRef, useState, type ReactElement } from "react";
import { AircraftModelViewport, type AircraftModelLoadingProgress } from "./AircraftModelViewport";
import ModelDir from "./ModelDir";
import { AIRCRAFT_MODEL_ASSETS, type AircraftModelAsset } from "./modelAssets";
import "./index.css";

/** 页面加载模型时使用的初始进度状态。 */
const INITIAL_LOADING_PROGRESS: AircraftModelLoadingProgress = {
    phase: "initializing",
    loadedModelCount: 0,
    failedModelCount: 0,
    rendererStatus: "initializing",
    loadingStage: "renderer",
};

/** 用户切换模型后立即呈现的加载状态，避免旧模型状态延迟停留。 */
const MODEL_SWITCHING_PROGRESS: AircraftModelLoadingProgress = {
    phase: "loading",
    loadedModelCount: 0,
    failedModelCount: 0,
    rendererStatus: "initializing",
    loadingStage: "renderer",
};

/** 页面首次打开时默认渲染模型目录中的第一架飞机。 */
const INITIAL_SELECTED_MODEL_ID = AIRCRAFT_MODEL_ASSETS[0]?.id ?? "";

/** 根据加载阶段生成页面内的状态标题。 */
const getLoadingStatusTitle = (progress: AircraftModelLoadingProgress): string => {
    if (progress.phase === "initializing") {
        return "正在初始化 WebGPU";
    }

    if (progress.phase === "loading") {
        return progress.loadingStage === "parsing" ? "正在解析当前模型" : "正在载入当前模型";
    }

    if (progress.phase === "error") {
        return "模型视窗不可用";
    }

    return "当前模型已就绪";
};

/** 根据加载阶段和可用字节进度生成页面内的状态说明。 */
const getLoadingStatusDescription = (progress: AircraftModelLoadingProgress): string => {
    if (progress.message !== undefined) {
        return progress.message;
    }

    if (progress.loadingStage === "downloading") {
        if (progress.progressRatio !== undefined) {
            return `资源下载 ${Math.round(progress.progressRatio * 100)}%`;
        }

        return "资源大小未知，正在下载";
    }

    if (progress.loadingStage === "parsing") {
        return "正在解析 GLB 场景";
    }

    return `${progress.loadedModelCount} / 1 个模型`;
};

/** 将渲染后端状态转换为状态栏中的可读文本。 */
const getRendererStatusLabel = (progress: AircraftModelLoadingProgress): string => {
    if (progress.rendererStatus === "initializing") {
        return "初始化中";
    }

    if (progress.rendererStatus === "unavailable") {
        return "不可用";
    }

    if (progress.rendererStatus === "lost") {
        return "设备丢失";
    }

    return "WebGPU 已就绪";
};

/** 从模型目录中查找当前选择的单架模型。 */
const getSelectedModel = (selectedModelId: string): AircraftModelAsset | undefined =>
    AIRCRAFT_MODEL_ASSETS.find((asset): boolean => asset.id === selectedModelId);

/**
 * 使用 WebGPU 每次渲染当前选择的一架飞机模型。
 */
const PlaneRenderPage = (): ReactElement => {
    const viewportRef = useRef<HTMLElement | null>(null);
    const [selectedModelId, setSelectedModelId] = useState<string>(INITIAL_SELECTED_MODEL_ID);
    const [loadingProgress, setLoadingProgress] =
        useState<AircraftModelLoadingProgress>(INITIAL_LOADING_PROGRESS);
    const [retryToken, setRetryToken] = useState<number>(0);

    /** 接收视窗的异步进度更新，驱动目录与状态区显示。 */
    const handleLoadingProgressChange = useCallback(
        (progress: AircraftModelLoadingProgress): void => {
            setLoadingProgress(progress);
        },
        [],
    );

    /** 切换当前模型，并在点击提交的同一帧反馈新模型正在载入。 */
    const handleModelSelection = (modelId: string): void => {
        if (modelId === selectedModelId) {
            return;
        }

        setLoadingProgress(MODEL_SWITCHING_PROGRESS);
        setSelectedModelId(modelId);
    };

    /** 重新初始化当前模型视窗，并立即清除旧错误状态。 */
    const handleModelRetry = (): void => {
        if (selectedModelId === "") {
            return;
        }

        setLoadingProgress(MODEL_SWITCHING_PROGRESS);
        setRetryToken((currentToken: number): number => currentToken + 1);
    };

    const selectedModel = getSelectedModel(selectedModelId);
    const selectedModelSummary = selectedModel?.label ?? "暂无模型";
    const hasFailedModels = loadingProgress.failedModelCount > 0;
    const isModelLoading =
        loadingProgress.phase === "initializing" || loadingProgress.phase === "loading";

    return (
        <section className="page-panel plane-render" aria-labelledby="plane-render-heading">
            <header className="plane-render__header">
                <p className="page-eyebrow">Model Studio</p>
                <h1 id="plane-render-heading">飞机模型渲染</h1>
                <p>从模型目录中选择并检查单架 GLB 模型。</p>
            </header>

            <div className="plane-render__workspace">
                <section
                    ref={viewportRef}
                    className="plane-render__viewport"
                    aria-label="WebGPU 三维模型视窗，支持拖拽旋转与滚动缩放"
                    aria-busy={isModelLoading}
                    data-loading={isModelLoading}
                >
                    <AircraftModelViewport
                        asset={selectedModel}
                        selectedModelId={selectedModelId}
                        onLoadingProgressChange={handleLoadingProgressChange}
                        onModelSelection={handleModelSelection}
                        fullscreenTargetRef={viewportRef}
                        retryToken={retryToken}
                    />
                    {loadingProgress.phase !== "ready" ? (
                        <div
                            className={`plane-render__viewport-status plane-render__viewport-status--${loadingProgress.phase}`}
                            role={loadingProgress.phase === "error" ? "alert" : "status"}
                        >
                            <strong>{getLoadingStatusTitle(loadingProgress)}</strong>
                            <span>{getLoadingStatusDescription(loadingProgress)}</span>
                            {loadingProgress.phase === "error" && selectedModel !== undefined ? (
                                <button
                                    className="plane-render__retry-button"
                                    type="button"
                                    onClick={handleModelRetry}
                                >
                                    重试当前模型
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    <p className="plane-render__viewport-caption" aria-live="polite">
                        {selectedModelSummary}
                    </p>
                </section>

                <ModelDir
                    selectedModelId={selectedModelId}
                    onModelSelection={handleModelSelection}
                />
            </div>

            <dl className="plane-render__status-list">
                <div>
                    <dt>目录模型</dt>
                    <dd>{AIRCRAFT_MODEL_ASSETS.length} 个</dd>
                </div>
                <div>
                    <dt>已载入</dt>
                    <dd>{loadingProgress.loadedModelCount} / 1</dd>
                </div>
                <div>
                    <dt>渲染状态</dt>
                    <dd>{getRendererStatusLabel(loadingProgress)}</dd>
                </div>
            </dl>
            {hasFailedModels ? (
                <p className="plane-render__load-note" role="status">
                    {loadingProgress.failedModelCount} 个模型未能加载。
                </p>
            ) : null}
            <p className="plane-render__attribution">
                模型资源由{" "}
                <a
                    href="https://github.com/amvlab/aircraft-models"
                    target="_blank"
                    rel="noreferrer"
                >
                    amvlab
                </a>
                {"、"}
                <a
                    href="https://github.com/Flightradar24/fr24-3d-models"
                    target="_blank"
                    rel="noreferrer"
                >
                    fr24-3d-models
                </a>
                {"、"}
                <a href="https://sketchfab.com" target="_blank" rel="noreferrer">
                    sketchfab
                </a>{" "}
                提供。
            </p>
        </section>
    );
};

export default PlaneRenderPage;
