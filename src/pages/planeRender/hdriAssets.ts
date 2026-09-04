/** 构建期扫描到的单个 HDRI 环境资源。 */
export interface AircraftHdriAsset {
    /** 由源路径派生的稳定资源标识。 */
    id: string;
    /** 在环境来源 select 中展示的文件名。 */
    label: string;
    /** 相对于项目根目录的 HDRI 文件路径。 */
    sourcePath: string;
    /** Rsbuild 输出的可请求 HDRI URL。 */
    url: string;
}

/** Rspack glob 返回的模块路径中，指向项目根目录的相对前缀。 */
const PROJECT_ROOT_RELATIVE_PREFIX_PATTERN = /^(?:\.\.\/)+/;

/** 仅收集 hdri 目录下的 RGBE HDR 文件，避免把 .DS_Store 等文件展示到控件。 */
const hdriModules: Record<string, string> = import.meta.glob<string>(
    "../../../public/hdri/*.hdr",
    {
        eager: true,
        import: "default",
    },
);

/** 将 Rspack 模块路径转换为相对于项目根目录的可读路径。 */
const getHdriSourcePath = (modulePath: string): string =>
    modulePath.replace(PROJECT_ROOT_RELATIVE_PREFIX_PATTERN, "");

/** 从 HDRI 源路径提取不带扩展名的展示名称。 */
const getHdriLabel = (sourcePath: string): string => {
    const fileName = sourcePath.split("/").pop() ?? sourcePath;

    return fileName.replace(/\.hdr$/i, "");
};

/** 将构建期 HDRI 模块清单转换为稳定、只读的环境资源目录。 */
export const AIRCRAFT_HDRI_ASSETS: readonly AircraftHdriAsset[] = Object.entries(
    hdriModules,
)
    .map(
        ([modulePath, url]: [string, string]): AircraftHdriAsset => {
            const sourcePath = getHdriSourcePath(modulePath);

            return {
                id: sourcePath
                    .replace(/\.hdr$/i, "")
                    .replace(/[^a-zA-Z0-9]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .toLocaleLowerCase(),
                label: getHdriLabel(sourcePath),
                sourcePath,
                url,
            };
        },
    )
    .sort((left, right): number => left.label.localeCompare(right.label));
