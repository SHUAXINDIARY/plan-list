import type { ReactElement } from "react";
import "./index.css";

/**
 * 飞机模型渲染页面的临时承载区，后续将在模型视窗中接入实际渲染能力。
 */
const PlaneRenderPage = (): ReactElement => {
    return (
        <section
            className="page-panel plane-render"
            aria-labelledby="plane-render-heading"
        >
            <header className="plane-render__header">
                <p className="page-eyebrow">Model Studio</p>
                <h1 id="plane-render-heading">飞机模型渲染</h1>
                <p>
                    用于承载后续的飞机三维模型、视角控制和场景参数。
                </p>
            </header>

            <section
                className="plane-render__viewport"
                aria-label="模型视窗占位区域"
            >
                <div className="plane-render__viewport-label">
                    <span aria-hidden="true">3D</span>
                    <p>模型视窗待接入</p>
                </div>
                <p className="plane-render__viewport-note">暂无模型资源</p>
            </section>

            <dl className="plane-render__status-list">
                <div>
                    <dt>模型</dt>
                    <dd>未载入</dd>
                </div>
                <div>
                    <dt>场景</dt>
                    <dd>待配置</dd>
                </div>
                <div>
                    <dt>渲染状态</dt>
                    <dd>占位中</dd>
                </div>
            </dl>
        </section>
    );
};

export default PlaneRenderPage;
