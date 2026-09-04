import { uploadOssGlbAssets } from "./uploadOssGlbAssets.generated";

/** 可由模型浏览器加载的单个 GLB 静态资源。 */
export interface AircraftModelAsset {
    /** 由资源相对路径派生的稳定选择标识。 */
    id: string;
    /** 面向用户展示的模型名称。 */
    label: string;
    /** 相对于项目根目录的模型文件路径，用于区分不同模型目录中的同名机型。 */
    sourcePath: string;
    /** 模型所属的相对目录，用于在模型目录中进行分类展示。 */
    sourceDirectory: string;
    /** 懒加载资源并返回构建后 GLB 文件 URL。 */
    loadUrl: () => Promise<string>;
}

/** Rspack 返回的模型模块路径中，指向项目根目录的相对前缀。 */
const PROJECT_ROOT_RELATIVE_PREFIX_PATTERN = /^(?:\.\.\/)+/;

// FR24 的 glTF 1.0 文件不在 GLTFLoade r 2.0 支持范围内，因此只收集兼容的 GLB 模型。
const fr24ModelModules: Record<string, () => Promise<string>> =
    import.meta.glob<string>("../../../fr24-3d-models-glbv2/models/**/*.glb", {
        import: "default",
    });

// 自定义模型目录由项目本地维护，同样只收集 GLTFLoader 兼容的  GLB 文件。
const customModelModules: Record<string, () => Promise<string>> =
    import.meta.glob<string>("../../../sketchfab/**/*.glb", {
        import: "default",
    });

/** 各模型目录的构建期 GLB 加载器映射，键保留完整相对路径避免同名模型冲突。 */
const modelModules: Record<string, () => Promise<string>> = {
    ...customModelModules,
    ...fr24ModelModules,
};

/** 从 Rspack 上下文路径派生稳定的模型选择标识。 */
const getModelId = (sourcePath: string): string => {
    return sourcePath
        .replace(/\.glb$/i, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLocaleLowerCase();
};

/** 将文件名转为目录中可扫描的模型名称，并保留无标识版本与来源的区别。 */
const getModelLabel = (sourcePath: string): string => {
    const pathSegments = sourcePath.split("/");
    const fileName = pathSegments[pathSegments.length - 1] ?? sourcePath;
    const fileStem = fileName.replace(/\.glb$/i, "");
    const isLogoFreeVariant = fileStem.endsWith("_nologo");
    const baseLabel = isLogoFreeVariant
        ? fileStem.slice(0, -"_nologo".length)
        : fileStem;
    const variantLabel = isLogoFreeVariant
        ? `${baseLabel} · 无标识`
        : baseLabel;

    return variantLabel;
};

/** 从模型相对路径中提取文件所在目录，用于目录分类标题。 */
const getModelSourceDirectory = (sourcePath: string): string => {
    const pathSegments = sourcePath.split("/");
    const directoryPath = pathSegments.slice(0, -1).join("/");

    return directoryPath || sourcePath;
};

/** 将 Rspack 返回的构建期模块路径转换为相对于项目根目录的可读路径。 */
const getModelSourcePath = (modulePath: string): string => {
    return modulePath.replace(PROJECT_ROOT_RELATIVE_PREFIX_PATTERN, "");
};

/** 上传至 OSS 的 GLB 公共 URL 前缀。 */
const OSS_GLB_URL_PREFIX = "https://img.shuaxinjs.cn/glb/";

/** 上传至 OSS 的模型在目录分类中使用的本地目录名。 */
const UPLOAD_OSS_GLB_DIRECTORY = "upload_oss_glb";

/** 各模型目录内可由 glTF 2.0 loader 加载的本地模型资源。 */
const localAircraftModelAssets: AircraftModelAsset[] = Object.entries(modelModules).map(
    ([modulePath, loadUrl]: [string, () => Promise<string>]): AircraftModelAsset => {
        const sourcePath = getModelSourcePath(modulePath);

        return {
            id: getModelId(sourcePath),
            label: getModelLabel(sourcePath),
            sourcePath,
            sourceDirectory: getModelSourceDirectory(sourcePath),
            loadUrl,
        };
    },
);
const localAircraftModelIdSet = new Set(
    localAircraftModelAssets.map((asset: AircraftModelAsset): string => asset.id),
);

// 构建期扫描 upload_oss_glb 目录后，这些模型统一通过 OSS 公共地址加载。
const uploadOssGlbModelAssets: AircraftModelAsset[] = uploadOssGlbAssets.map(
    (uploadAsset: (typeof uploadOssGlbAssets)[number]): AircraftModelAsset => {
        const ossPath = `${OSS_GLB_URL_PREFIX}${uploadAsset.fileName}`;

        return {
            id: getModelId(uploadAsset.sourcePath),
            label: getModelLabel(uploadAsset.sourcePath),
            sourcePath: ossPath,
            sourceDirectory: UPLOAD_OSS_GLB_DIRECTORY,
            loadUrl: () => Promise.resolve(ossPath),
        };
    },
);

/** 各模型目录内可由 glTF 2.0 loader 加载的完整 GLB 模型目录，含 upload_oss_glb 的 OSS 资源。 */
export const AIRCRAFT_MODEL_ASSETS: readonly AircraftModelAsset[] = [
    ...localAircraftModelAssets,
    ...uploadOssGlbModelAssets.filter(
        (uploadAsset: AircraftModelAsset): boolean => !localAircraftModelIdSet.has(uploadAsset.id),
    ),
];
