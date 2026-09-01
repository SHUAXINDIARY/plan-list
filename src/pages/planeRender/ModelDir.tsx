import type { ReactElement } from "react";
import { AIRCRAFT_MODEL_ASSETS } from "./modelAssets";

/** 模型目录组件的当前选择和回传回调。 */
interface ModelDirProps {
    /** 当前页面选中的模型 ID，用于同步 active 状态。 */
    selectedModelId: string;
    /** 用户点击目录模型后通知父页面切换当前模型。 */
    onModelSelection: (modelId: string) => void;
}

/** 独立维护 GLB 模型目录的展示和选择交互。 */
export const ModelDir = ({
    selectedModelId,
    onModelSelection,
}: ModelDirProps): ReactElement => (
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
                        onClick={(): void => onModelSelection(asset.id)}
                    >
                        <span>{asset.label}</span>
                        {/* <small>{asset.sourcePath}</small> */}
                    </button>
                ),
            )}
        </div>
    </aside>
);

export default ModelDir;
