import type { ReactElement } from "react";
import type { AirlineReferenceSource } from "../home/type";
import "./index.css";
import { AIRLINE_REFERENCE_SOURCES } from "./constant";

// 统计全部来源链接数量，供页面概览与 aria 文案复用。
const getReferenceUrlCount = (
    referenceSources: AirlineReferenceSource[],
): number => {
    return referenceSources.reduce(
        (total: number, referenceSource: AirlineReferenceSource): number =>
            total + referenceSource.urls.length,
        0,
    );
};

// 将参考 URL 压缩为便于扫读的域名，同时保留外链 href 的原始完整地址。
const getReferenceUrlHost = (referenceUrl: string): string => {
    try {
        const parsedReferenceUrl = new URL(referenceUrl);
        return parsedReferenceUrl.hostname.replace(/^www\./, "");
    } catch {
        return "外部来源";
    }
};

// 独立参考资料页集中展示航司官网、公开年报和百科资料，便于用户核对数据出处。
const ReferencesPage = (): ReactElement => {
    const referenceGroupCount = AIRLINE_REFERENCE_SOURCES.length;
    const referenceUrlCount = getReferenceUrlCount(AIRLINE_REFERENCE_SOURCES);

    return (
        <section
            className="page-panel reference-archive"
            aria-labelledby="references-page-title"
        >
            <div className="reference-archive__hero">
                <div>
                    <p className="page-eyebrow">References</p>
                    <h1 id="references-page-title">参考资料</h1>
                    <p>
                        集中收纳航司官网、公开年报、百科与航空资料站链接，方便回溯机队数据来源与后续校对。
                    </p>
                </div>

                <div className="reference-archive__summary" aria-label="参考资料概览">
                    <span>
                        <strong>{referenceGroupCount}</strong>
                        组资料
                    </span>
                    <span>
                        <strong>{referenceUrlCount}</strong>
                        条链接
                    </span>
                </div>
            </div>

            <div
                className="reference-archive__list"
                aria-label="参考资料来源列表"
            >
                {AIRLINE_REFERENCE_SOURCES.map(
                    (
                        referenceSource: AirlineReferenceSource,
                        referenceSourceIndex: number,
                    ): ReactElement => (
                        <article
                            className="reference-entry"
                            key={referenceSource.airlineName}
                        >
                            <header className="reference-entry__header">
                                <span
                                    className="reference-entry__serial"
                                    aria-hidden="true"
                                >
                                    {String(referenceSourceIndex + 1).padStart(
                                        2,
                                        "0",
                                    )}
                                </span>
                                <div className="reference-entry__title">
                                    <h2>{referenceSource.airlineName}</h2>
                                    <span>
                                        {referenceSource.urls.length} 条可核对链接
                                    </span>
                                </div>
                            </header>

                            <ul className="reference-entry__links">
                                {referenceSource.urls.map(
                                    (
                                        referenceUrl: string,
                                        referenceIndex: number,
                                    ): ReactElement => (
                                        <li
                                            key={`${referenceSource.airlineName}-${referenceUrl}`}
                                        >
                                            <a
                                                href={referenceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <span className="reference-entry__link-index">
                                                    {String(
                                                        referenceIndex + 1,
                                                    ).padStart(2, "0")}
                                                </span>
                                                <span className="reference-entry__link-domain">
                                                    {getReferenceUrlHost(
                                                        referenceUrl,
                                                    )}
                                                </span>
                                            </a>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </article>
                    ),
                )}
            </div>
        </section>
    );
};

export default ReferencesPage;
