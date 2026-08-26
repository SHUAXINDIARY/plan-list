import { useCallback, useState, type ReactElement } from "react";
import {
    AircraftModelViewport,
    type AircraftModelLoadingProgress,
} from "./AircraftModelViewport";
import { AIRCRAFT_MODEL_ASSETS } from "./modelAssets";
import "./index.css";

/** 页面加载模型时使用的初始进度状态。 */
const INITIAL_LOADING_PROGRESS: AircraftModelLoadingProgress = {
    phase: "initializing",
    loadedModelCount: 0,
    failedModelCount: 0,
};

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

/** 根据当前选择状态返回目录工具栏的可读说明。 */
const getSelectedModelSummary = (selectedModelId: string | null): string => {
    if (selectedModelId === null) {
        return "完整机队";
    }

    return (
        AIRCRAFT_MODEL_ASSETS.find(
            (asset): boolean => asset.id === selectedModelId,
        )?.label ?? "完整机队"
    );
};

/**
 * 使用 WebGPU 渲染整个子模块模型目录，并提供全览与单机聚焦浏览。
 */
const PlaneRenderPage = (): ReactElement => {
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] =
        useState<AircraftModelLoadingProgress>(INITIAL_LOADING_PROGRESS);

    /** 接收视窗的异步进度更新，驱动目录与状态区显示。 */
    const handleLoadingProgressChange = useCallback(
        (progress: AircraftModelLoadingProgress): void => {
            setLoadingProgress(progress);
        },
        [],
    );

    /** 切换全览或单架模型焦点，不重新请求已加载的模型资源。 */
    const handleModelSelection = (modelId: string | null): void => {
        setSelectedModelId(modelId);
    };

    const selectedModelSummary = getSelectedModelSummary(selectedModelId);
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
                    来自 aircraft-models 子模块的完整 GLB 模型目录。
                </p>
            </header>

            <div className="plane-render__workspace">
                <section
                    className="plane-render__viewport"
                    aria-label="WebGPU 三维模型视窗，支持拖拽旋转与滚动缩放"
                    aria-busy={loadingProgress.phase === "loading"}
                >
                    <AircraftModelViewport
                        assets={AIRCRAFT_MODEL_ASSETS}
                        selectedModelId={selectedModelId}
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
                                    `${loadingProgress.loadedModelCount} / ${AIRCRAFT_MODEL_ASSETS.length} 个模型`}
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
                        <button
                            className={`plane-render__model-button${selectedModelId === null ? " plane-render__model-button--active" : ""}`}
                            type="button"
                            aria-pressed={selectedModelId === null}
                            onClick={(): void => handleModelSelection(null)}
                        >
                            <span>完整机队</span>
                            <small>全览</small>
                        </button>
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
                        {loadingProgress.loadedModelCount} / {AIRCRAFT_MODEL_ASSETS.length}
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
