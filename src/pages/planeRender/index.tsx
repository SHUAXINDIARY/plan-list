import { useCallback, useState, type ReactElement } from "react";
import {
    AircraftModelViewport,
    type AircraftModelLoadingProgress,
} from "./AircraftModelViewport";
import {
    AIRCRAFT_MODEL_ASSETS,
    type AircraftModelAsset,
} from "./modelAssets";
import "./index.css";

/** 页面加载模型时使用的初始进度状态。 */
const INITIAL_LOADING_PROGRESS: AircraftModelLoadingProgress = {
    phase: "initializing",
    loadedModelCount: 0,
    failedModelCount: 0,
};

/** 页面首次打开时默认渲染模型目录中的第一架飞机。 */
const INITIAL_SELECTED_MODEL_ID = AIRCRAFT_MODEL_ASSETS[0]?.id ?? "";

/** 根据加载阶段生成页面内的状态标题。 */
const getLoadingStatusTitle = (
    progress: AircraftModelLoadingProgress,
): string => {
    if (progress.phase === "initializing") {
        return "正在初始化 WebGPU";
    }

    if (progress.phase === "loading") {
        return "正在载入模型目录";
    }

    if (progress.phase === "error") {
        return "模型视窗不可用";
    }

    return "模型目录已载入";
};

/** 从模型目录中查找当前选择的单架模型。 */
const getSelectedModel = (
    selectedModelId: string,
): AircraftModelAsset | undefined =>
    AIRCRAFT_MODEL_ASSETS.find(
        (asset): boolean => asset.id === selectedModelId,
    );

/**
 * 使用 WebGPU 每次渲染当前选择的一架飞机模型。
 */
const PlaneRenderPage = (): ReactElement => {
    const [selectedModelId, setSelectedModelId] = useState<string>(
        INITIAL_SELECTED_MODEL_ID,
    );
    const [loadingProgress, setLoadingProgress] =
        useState<AircraftModelLoadingProgress>(INITIAL_LOADING_PROGRESS);

    /** 接收视窗的异步进度更新，驱动目录与状态区显示。 */
    const handleLoadingProgressChange = useCallback(
        (progress: AircraftModelLoadingProgress): void => {
            setLoadingProgress(progress);
        },
        [],
    );

    /** 切换当前模型，视窗会清理旧场景并载入新选择。 */
    const handleModelSelection = (modelId: string): void => {
        setSelectedModelId(modelId);
    };

    const selectedModel = getSelectedModel(selectedModelId);
    const selectedModelSummary = selectedModel?.label ?? "暂无模型";
    const hasFailedModels = loadingProgress.failedModelCount > 0;

    return (
        <section
            className="page-panel plane-render"
            aria-labelledby="plane-render-heading"
        >
            <header className="plane-render__header">
                <p className="page-eyebrow">Model Studio</p>
                <h1 id="plane-render-heading">飞机模型渲染</h1>
                <p>
                    从 aircraft-models 子模块目录中选择并检查单架 GLB 模型。
                </p>
            </header>

            <div className="plane-render__workspace">
                <section
                    className="plane-render__viewport"
                    aria-label="WebGPU 三维模型视窗，支持拖拽旋转与滚动缩放"
                    aria-busy={loadingProgress.phase === "loading"}
                >
                    <AircraftModelViewport
                        asset={selectedModel}
                        onLoadingProgressChange={handleLoadingProgressChange}
                    />
                    {loadingProgress.phase !== "ready" ? (
                        <div
                            className={`plane-render__viewport-status plane-render__viewport-status--${loadingProgress.phase}`}
                            role={
                                loadingProgress.phase === "error"
                                    ? "alert"
                                    : "status"
                            }
                        >
                            <strong>{getLoadingStatusTitle(loadingProgress)}</strong>
                            <span>
                                {loadingProgress.message ??
                                    `${loadingProgress.loadedModelCount} / 1 个模型`}
                            </span>
                        </div>
                    ) : null}
                    <p className="plane-render__viewport-caption" aria-live="polite">
                        {selectedModelSummary}
                    </p>
                </section>

                <aside className="plane-render__catalog" aria-label="模型目录">
                    <div className="plane-render__catalog-heading">
                        <div>
                            <p className="plane-render__catalog-label">模型目录</p>
                            <h2>{AIRCRAFT_MODEL_ASSETS.length} 个 GLB 文件</h2>
                        </div>
                    </div>
                    <div className="plane-render__catalog-list scroll-area-night">
                        {AIRCRAFT_MODEL_ASSETS.map(
                            (asset): ReactElement => (
                                <button
                                    key={asset.id}
                                    className={`plane-render__model-button${selectedModelId === asset.id ? " plane-render__model-button--active" : ""}`}
                                    type="button"
                                    aria-pressed={selectedModelId === asset.id}
                                    onClick={(): void =>
                                        handleModelSelection(asset.id)
                                    }
                                >
                                    <span>{asset.label}</span>
                                    <small>{asset.sourcePath}</small>
                                </button>
                            ),
                        )}
                    </div>
                </aside>
            </div>

            <dl className="plane-render__status-list">
                <div>
                    <dt>目录模型</dt>
                    <dd>{AIRCRAFT_MODEL_ASSETS.length} 个</dd>
                </div>
                <div>
                    <dt>已载入</dt>
                    <dd>
                        {loadingProgress.loadedModelCount} / 1
                    </dd>
                </div>
                <div>
                    <dt>渲染状态</dt>
                    <dd>WebGPU</dd>
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
                </a>{" "}
                提供，遵循{" "}
                <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                >
                    CC BY 4.0
                </a>
                。
            </p>
        </section>
    );
};

export default PlaneRenderPage;
