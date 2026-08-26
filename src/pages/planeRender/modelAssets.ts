/** 可由模型浏览器加载的单个 GLB 静态资源。 */
export interface AircraftModelAsset {
    /** 由资源相对路径派生的稳定选择标识。 */
    id: string;
    /** 面向用户展示的模型名称。 */
    label: string;
    /** 相对于 `aircraft-models/models` 的原始文件路径。 */
    sourcePath: string;
    /** 懒加载资源并返回构建后 GLB 文件 URL。 */
    loadUrl: () => Promise<string>;
}

/** 用于从构建期模块路径提取 models 目录内相对路径的分隔标记。 */
const MODEL_DIRECTORY_PATH_MARKER = "/models/";

// Rspack 要求 glob 模式为字面量，泛型确保每个按需导入模块返回 GLB 构建资源 URL。
const aircraftModelModules: Record<string, () => Promise<string>> =
    import.meta.glob<string>("../../../aircraft-models/models/**/*.glb", {
        import: "default",
    });

/** 从 Rspack 上下文路径派生稳定的模型选择标识。 */
const getModelId = (sourcePath: string): string => {
    return sourcePath
        .replace(/\.glb$/i, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLocaleLowerCase();
};

/** 将文件名转为目录中可扫描的模型名称，并保留无标识版本的区别。 */
const getModelLabel = (sourcePath: string): string => {
    const fileStem = sourcePath.replace(/\.glb$/i, "");
    const isLogoFreeVariant = fileStem.endsWith("_nologo");
    const baseLabel = isLogoFreeVariant
        ? fileStem.slice(0, -"_nologo".length)
        : fileStem;

    return isLogoFreeVariant ? `${baseLabel} · 无标识` : baseLabel;
};

/** 将 Rspack 返回的构建期模块路径转换为 models 目录内的相对文件路径。 */
const getModelSourcePath = (modulePath: string): string => {
    const markerIndex = modulePath.lastIndexOf(MODEL_DIRECTORY_PATH_MARKER);

    return markerIndex < 0
        ? modulePath
        : modulePath.slice(
              markerIndex + MODEL_DIRECTORY_PATH_MARKER.length,
          );
};

/** 当前子模块 models 目录内的完整 GLB 模型目录，按原始路径稳定排序。 */
export const AIRCRAFT_MODEL_ASSETS: readonly AircraftModelAsset[] =
    Object.entries(aircraftModelModules)
        .map(
            ([modulePath, loadUrl]: [string, () => Promise<string>]): AircraftModelAsset => {
                const sourcePath = getModelSourcePath(modulePath);

                return {
                    id: getModelId(sourcePath),
                    label: getModelLabel(sourcePath),
                    sourcePath,
                    loadUrl,
                };
            },
        )
        .sort(
            (
                firstAsset: AircraftModelAsset,
                secondAsset: AircraftModelAsset,
            ): number => firstAsset.sourcePath.localeCompare(secondAsset.sourcePath),
        );
