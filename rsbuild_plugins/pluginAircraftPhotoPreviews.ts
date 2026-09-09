import {
    access,
    mkdir,
    readFile,
    readdir,
    rename,
    unlink,
    writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RsbuildPlugin } from "@rsbuild/core";
import sharp from "sharp";
import ts from "typescript";

/** 单张待落盘的预览图。 */
interface PhotoPreviewEntry {
    /** 运行时用于查找预览图的原图 URL。 */
    originalUrl: string;
    /** 预览图在 public 目录下的绝对访问路径。 */
    previewUrl: string;
    /** 已完成方向校正、缩放和 JPEG 编码的图片内容。 */
    previewBuffer: Buffer;
}

/** 生成模块中持久化的预览图缓存。 */
interface PhotoPreviewCache {
    /** 原图 URL 到已验证静态预览路径的映射。 */
    previewUrls: Record<string, string>;
}

const PLUGIN_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(PLUGIN_DIRECTORY, "..");
const PERSONAL_PHOTO_META_PATH = join(
    PROJECT_ROOT,
    "src/pages/personal/constants/photoMeta.ts",
);
const PHOTO_PREVIEWS_MODULE_PATH = join(
    PROJECT_ROOT,
    "src/pages/personal/photoPreviews.generated.ts",
);
const PHOTO_PREVIEW_ASSET_DIRECTORY = join(
    PROJECT_ROOT,
    "public/Preview",
);
const PHOTO_PREVIEW_PUBLIC_PREFIX = "/Preview";
const PHOTO_URL_LIST_EXPORT = "AIRCRAFT_PHOTO_ORIGINAL_URLS";
const PREVIEW_BATCH_SIZE = 4;
/** 单张下载超时；大体积原图在弱网下需要更长窗口。 */
const PREVIEW_DOWNLOAD_TIMEOUT_MS = 30_000;
/** 下载体积上限；相机 JPEG 常超过 20MB，保留安全余量。 */
const PREVIEW_MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
/**
 * sharp 解码像素上限。40MP 不足以覆盖现代手机/中画幅原图，
 * 取 libvips 常用上限（约 16383²）以兼容超高分辨率输入。
 */
const PREVIEW_MAX_INPUT_PIXELS = 268_402_689;
const PREVIEW_CACHE_VERSION = "600w-jpeg-q82-v3";
const PREVIEW_IMAGE_WIDTH = 600;
const PREVIEW_IMAGE_QUALITY = 82;
const PREVIEW_ASSET_FILE_NAME_PATTERN = /^[a-f0-9]{64}\.jpg$/;
const REMOTE_PHOTO_URL_PATTERN = /^https?:\/\//;

/** 移除 TypeScript 仅用于类型层面的表达式包装，取得实际初始化表达式。 */
const unwrapExpression = (expression: ts.Expression): ts.Expression => {
    if (
        ts.isAsExpression(expression) ||
        ts.isSatisfiesExpression(expression) ||
        ts.isTypeAssertionExpression(expression) ||
        ts.isParenthesizedExpression(expression)
    ) {
        return unwrapExpression(expression.expression);
    }

    return expression;
};

/** 收集源文件顶层变量的初始化表达式，供数组 spread 递归解析。 */
const getVariableInitializers = (
    sourceFile: ts.SourceFile,
): Map<string, ts.Expression> => {
    const initializers = new Map<string, ts.Expression>();

    sourceFile.statements.forEach((statement: ts.Statement): void => {
        if (!ts.isVariableStatement(statement)) {
            return;
        }

        statement.declarationList.declarations.forEach(
            (declaration: ts.VariableDeclaration): void => {
                if (
                    ts.isIdentifier(declaration.name) &&
                    declaration.initializer !== undefined
                ) {
                    initializers.set(declaration.name.text, declaration.initializer);
                }
            },
        );
    });

    return initializers;
};

/** 递归解析由字符串字面量和本地数组 spread 组成的照片 URL 列表。 */
const resolvePhotoUrls = (
    expression: ts.Expression,
    variableInitializers: ReadonlyMap<string, ts.Expression>,
    resolvingVariables: ReadonlySet<string>,
): string[] => {
    const unwrappedExpression = unwrapExpression(expression);

    if (!ts.isArrayLiteralExpression(unwrappedExpression)) {
        throw new Error(
            `[photo-preview] ${PHOTO_URL_LIST_EXPORT} 只能由数组字面量或本地数组 spread 组成。`,
        );
    }

    const photoUrls: string[] = [];

    unwrappedExpression.elements.forEach((element: ts.Expression): void => {
        if (
            ts.isStringLiteral(element) ||
            ts.isNoSubstitutionTemplateLiteral(element)
        ) {
            if (!REMOTE_PHOTO_URL_PATTERN.test(element.text)) {
                throw new Error(
                    `[photo-preview] ${PHOTO_URL_LIST_EXPORT} 包含非 HTTP(S) 图片地址：${element.text}`,
                );
            }

            photoUrls.push(element.text);
            return;
        }

        if (!ts.isSpreadElement(element) || !ts.isIdentifier(element.expression)) {
            throw new Error(
                `[photo-preview] ${PHOTO_URL_LIST_EXPORT} 仅支持字符串 URL 和本地数组 spread。`,
            );
        }

        const spreadVariableName = element.expression.text;
        const spreadInitializer = variableInitializers.get(spreadVariableName);

        if (spreadInitializer === undefined) {
            throw new Error(
                `[photo-preview] 无法解析 ${PHOTO_URL_LIST_EXPORT} 中的 spread：${spreadVariableName}。`,
            );
        }

        if (resolvingVariables.has(spreadVariableName)) {
            throw new Error(
                `[photo-preview] 图片 URL 数组存在循环 spread：${spreadVariableName}。`,
            );
        }

        const nextResolvingVariables = new Set(resolvingVariables);
        nextResolvingVariables.add(spreadVariableName);
        photoUrls.push(
            ...resolvePhotoUrls(
                spreadInitializer,
                variableInitializers,
                nextResolvingVariables,
            ),
        );
    });

    return photoUrls;
};

/** 只提取页面实际读取的导出照片列表，避免误下载同文件的无关 URL。 */
const extractAircraftPhotoUrls = (constantSource: string): string[] => {
    const sourceFile = ts.createSourceFile(
        PERSONAL_PHOTO_META_PATH,
        constantSource,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const variableInitializers = getVariableInitializers(sourceFile);
    const photoUrlInitializer = variableInitializers.get(PHOTO_URL_LIST_EXPORT);

    if (photoUrlInitializer === undefined) {
        throw new Error(
            `[photo-preview] 未找到导出的 ${PHOTO_URL_LIST_EXPORT}。`,
        );
    }

    return Array.from(
        new Set(
            resolvePhotoUrls(
                photoUrlInitializer,
                variableInitializers,
                new Set([PHOTO_URL_LIST_EXPORT]),
            ),
        ),
    );
};

/** 根据缓存版本和原图 URL 生成稳定的 JPEG 文件名。 */
const getPreviewAssetFileName = (photoUrl: string): string =>
    `${createHash("sha256")
        .update(`${PREVIEW_CACHE_VERSION}:${photoUrl}`)
        .digest("hex")}.jpg`;

/** 验证公开预览路径并解析成预览目录中的本地文件路径。 */
const getPreviewAssetPath = (previewUrl: string): string | null => {
    const expectedPrefix = `${PHOTO_PREVIEW_PUBLIC_PREFIX}/`;
    const fileName = previewUrl.startsWith(expectedPrefix)
        ? previewUrl.slice(expectedPrefix.length)
        : "";

    if (!PREVIEW_ASSET_FILE_NAME_PATTERN.test(fileName)) {
        return null;
    }

    return join(PHOTO_PREVIEW_ASSET_DIRECTORY, fileName);
};

/** 读取响应流并在声明长度和实际长度两个层面限制内存占用。 */
const readImageResponseBuffer = async (
    imageResponse: Response,
): Promise<Buffer | null> => {
    const contentLengthHeader = imageResponse.headers.get("content-length");
    const contentLength =
        contentLengthHeader === null ? null : Number(contentLengthHeader);

    if (
        contentLength !== null &&
        Number.isFinite(contentLength) &&
        contentLength > PREVIEW_MAX_DOWNLOAD_BYTES
    ) {
        await imageResponse.body?.cancel();
        return null;
    }

    if (imageResponse.body === null) {
        return null;
    }

    const reader = imageResponse.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            if (value === undefined) {
                continue;
            }

            totalBytes += value.byteLength;

            if (totalBytes > PREVIEW_MAX_DOWNLOAD_BYTES) {
                await reader.cancel();
                return null;
            }

            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    return Buffer.concat(
        chunks.map((chunk: Uint8Array): Buffer => Buffer.from(chunk)),
        totalBytes,
    );
};

/** 下载并生成一张保持完整构图、宽度不超过 600px 的压缩 JPEG 预览图。 */
const createPhotoPreviewEntry = async (
    photoUrl: string,
    timeoutMs: number,
): Promise<PhotoPreviewEntry | null> => {
    const abortController = new AbortController();
    const timeoutId = setTimeout((): void => {
        abortController.abort();
    }, timeoutMs);

    try {
        const imageResponse = await fetch(photoUrl, {
            signal: abortController.signal,
        });

        if (!imageResponse.ok) {
            console.warn(
                `[photo-preview] 图片下载失败（HTTP ${imageResponse.status}）：${photoUrl}`,
            );
            return null;
        }

        const imageBuffer = await readImageResponseBuffer(imageResponse);

        if (imageBuffer === null) {
            console.warn(
                `[photo-preview] 图片超过 ${PREVIEW_MAX_DOWNLOAD_BYTES} 字节或响应体为空：${photoUrl}`,
            );
            return null;
        }

        // sequentialRead 降低超高分辨率解码时的峰值内存，避免构建机 OOM。
        const previewBuffer = await sharp(imageBuffer, {
            limitInputPixels: PREVIEW_MAX_INPUT_PIXELS,
            sequentialRead: true,
        })
            .rotate()
            .resize(PREVIEW_IMAGE_WIDTH, null, {
                withoutEnlargement: true,
            })
            .jpeg({
                quality: PREVIEW_IMAGE_QUALITY,
                progressive: true,
                mozjpeg: true,
            })
            .toBuffer();

        return {
            originalUrl: photoUrl,
            previewUrl: `${PHOTO_PREVIEW_PUBLIC_PREFIX}/${getPreviewAssetFileName(photoUrl)}`,
            previewBuffer,
        };
    } catch (error) {
        const failureReason = abortController.signal.aborted
            ? "图片下载或处理超时"
            : error instanceof Error
                ? `图片下载或处理失败（${error.message}）`
                : "图片下载或处理失败";

        console.warn(`[photo-preview] ${failureReason}，本次不发布该照片：${photoUrl}`);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
};

/** 从生成模块中取得指定导出对象，格式异常时让本次构建将其视为缓存未命中。 */
const getGeneratedRecordLiteral = (
    moduleSource: string,
    exportName: string,
): ts.ObjectLiteralExpression | null => {
    const sourceFile = ts.createSourceFile(
        PHOTO_PREVIEWS_MODULE_PATH,
        moduleSource,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );

    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) {
            continue;
        }

        for (const declaration of statement.declarationList.declarations) {
            if (
                !ts.isIdentifier(declaration.name) ||
                declaration.name.text !== exportName ||
                declaration.initializer === undefined
            ) {
                continue;
            }

            const initializer = unwrapExpression(declaration.initializer);
            return ts.isObjectLiteralExpression(initializer) ? initializer : null;
        }
    }

    return null;
};

/** 从生成模块中解析原图 URL 到预览 URL 的字符串映射。 */
const parsePreviewUrlRecord = (moduleSource: string): Record<string, string> => {
    const recordLiteral = getGeneratedRecordLiteral(
        moduleSource,
        "aircraftPhotoPreviewUrls",
    );
    const previewUrls: Record<string, string> = {};

    if (recordLiteral === null) {
        return previewUrls;
    }

    recordLiteral.properties.forEach((property: ts.ObjectLiteralElementLike): void => {
        if (
            !ts.isPropertyAssignment(property) ||
            !ts.isStringLiteral(property.name) ||
            !ts.isStringLiteral(unwrapExpression(property.initializer))
        ) {
            return;
        }

        const previewUrlExpression = unwrapExpression(property.initializer);

        if (ts.isStringLiteral(previewUrlExpression)) {
            previewUrls[property.name.text] = previewUrlExpression.text;
        }
    });

    return previewUrls;
};

/** 读取版本匹配、路径合法且本地文件仍存在的静态预览缓存。 */
const readExistingPhotoPreviewCache = async (): Promise<PhotoPreviewCache> => {
    try {
        const moduleSource = await readFile(PHOTO_PREVIEWS_MODULE_PATH, "utf8");

        if (
            !moduleSource.includes(
                `Preview cache version: ${PREVIEW_CACHE_VERSION}`,
            )
        ) {
            return { previewUrls: {} };
        }

        const cachedPreviewUrls = parsePreviewUrlRecord(moduleSource);
        const validPreviewEntries = await Promise.all(
            Object.entries(cachedPreviewUrls).map(
                async ([originalUrl, previewUrl]: [string, string]): Promise<
                    [string, string] | null
                > => {
                    const previewAssetPath = getPreviewAssetPath(previewUrl);

                    if (previewAssetPath === null) {
                        return null;
                    }

                    try {
                        await access(previewAssetPath);
                        return [originalUrl, previewUrl];
                    } catch {
                        return null;
                    }
                },
            ),
        );

        return {
            previewUrls: Object.fromEntries(
                validPreviewEntries.filter(
                    (entry: [string, string] | null): entry is [string, string] =>
                        entry !== null,
                ),
            ),
        };
    } catch {
        return { previewUrls: {} };
    }
};

/** 以临时文件写入并原子替换目标，避免构建被中断时留下不完整资源。 */
const writeFileAtomically = async (
    filePath: string,
    content: string | Uint8Array,
): Promise<void> => {
    const temporaryFilePath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

    try {
        await writeFile(temporaryFilePath, content);
        await rename(temporaryFilePath, filePath);
    } catch (error) {
        try {
            await unlink(temporaryFilePath);
        } catch {
            // 临时文件无法清理时，仍应保留原始写入错误。
        }
        throw error;
    }
};

/** 将预览二进制写入受校验的静态资源目录。 */
const writePhotoPreviewAsset = async (
    entry: PhotoPreviewEntry,
): Promise<void> => {
    const previewAssetPath = getPreviewAssetPath(entry.previewUrl);

    if (previewAssetPath === null) {
        throw new Error(`[photo-preview] 无效的预览资源路径：${entry.previewUrl}`);
    }

    await writeFileAtomically(previewAssetPath, entry.previewBuffer);
};

/** 删除当前照片列表不再引用的历史预览文件。 */
const pruneUnusedPhotoPreviewAssets = async (
    previewUrls: Readonly<Record<string, string>>,
): Promise<void> => {
    try {
        const activeFileNames = new Set<string>();

        Object.values(previewUrls).forEach((previewUrl: string): void => {
            const previewAssetPath = getPreviewAssetPath(previewUrl);

            if (previewAssetPath !== null) {
                activeFileNames.add(basename(previewAssetPath));
            }
        });

        const assetEntries = await readdir(PHOTO_PREVIEW_ASSET_DIRECTORY, {
            withFileTypes: true,
        });

        await Promise.all(
            assetEntries
                .filter(
                    (assetEntry): boolean =>
                        assetEntry.isFile() &&
                        PREVIEW_ASSET_FILE_NAME_PATTERN.test(assetEntry.name) &&
                        !activeFileNames.has(assetEntry.name),
                )
                .map((assetEntry): Promise<void> =>
                    unlink(join(PHOTO_PREVIEW_ASSET_DIRECTORY, assetEntry.name)),
                ),
        );
    } catch (error) {
        const reason = error instanceof Error ? error.message : "未知错误";
        console.warn(`[photo-preview] 清理未引用预览图失败：${reason}`);
    }
};

/** 写入供页面运行时读取的预览路径映射。 */
const writePhotoPreviewsModule = async (
    previewUrls: Readonly<Record<string, string>>,
): Promise<void> => {
    const previewRecordEntries = Object.entries(previewUrls)
        .map(
            ([originalUrl, previewUrl]: [string, string]): string =>
                `  ${JSON.stringify(originalUrl)}: ${JSON.stringify(previewUrl)},`,
        )
        .join("\n");
    const moduleSource = [
        "// This file is generated by pluginAircraftPhotoPreviews during production build.",
        `// Preview cache version: ${PREVIEW_CACHE_VERSION}`,
        "// Do not edit by hand.",
        "export const aircraftPhotoPreviewUrls = {",
        previewRecordEntries,
        "} satisfies Record<string, string>;",
        "",
    ].join("\n");

    await writeFileAtomically(PHOTO_PREVIEWS_MODULE_PATH, moduleSource);
};

/** 分批下载、编码并立即落盘，避免在一个构建批次中长期保留大量图片 Buffer。 */
const generateMissingPhotoPreviews = async (
    photoUrls: readonly string[],
): Promise<{
    /** 本次构建新增的原图 URL 到预览路径映射。 */
    generatedPreviewUrls: Map<string, string>;
}> => {
    const generatedPreviewUrls = new Map<string, string>();

    for (
        let startIndex = 0;
        startIndex < photoUrls.length;
        startIndex += PREVIEW_BATCH_SIZE
    ) {
        const photoUrlBatch = photoUrls.slice(
            startIndex,
            startIndex + PREVIEW_BATCH_SIZE,
        );
        const previewEntries = await Promise.all(
            photoUrlBatch.map(
                (photoUrl: string): Promise<PhotoPreviewEntry | null> =>
                    createPhotoPreviewEntry(photoUrl, PREVIEW_DOWNLOAD_TIMEOUT_MS),
            ),
        );

        for (const [entryIndex, previewEntry] of previewEntries.entries()) {
            const photoUrl = photoUrlBatch[entryIndex];

            if (photoUrl === undefined) {
                continue;
            }

            if (previewEntry === null) {
                continue;
            }

            try {
                await writePhotoPreviewAsset(previewEntry);
                generatedPreviewUrls.set(
                    previewEntry.originalUrl,
                    previewEntry.previewUrl,
                );
            } catch (error) {
                const reason = error instanceof Error ? error.message : "未知错误";
                console.warn(
                    `[photo-preview] 预览文件写入失败（${reason}），本次不发布该照片：${photoUrl}`,
                );
            }
        }
    }

    return { generatedPreviewUrls };
};

/** 读取照片元数据，每次构建完整请求全部照片并覆盖生成预览。 */
const generateAircraftPhotoPreviews = async (): Promise<void> => {
    const constantSource = await readFile(PERSONAL_PHOTO_META_PATH, "utf8");
    const photoUrls = extractAircraftPhotoUrls(constantSource);
    const existingCache = await readExistingPhotoPreviewCache();
    const previewUrls: Record<string, string> = {};

    await mkdir(PHOTO_PREVIEW_ASSET_DIRECTORY, { recursive: true });

    const { generatedPreviewUrls } = await generateMissingPhotoPreviews(
        photoUrls,
    );

    // 成功项发布新预览；失败项若本地仍有合法缓存则沿用，否则不进入页面相册。
    photoUrls.forEach((photoUrl: string): void => {
        const generatedPreviewUrl = generatedPreviewUrls.get(photoUrl);

        if (generatedPreviewUrl !== undefined) {
            previewUrls[photoUrl] = generatedPreviewUrl;
            return;
        }

        const cachedPreviewUrl = existingCache.previewUrls[photoUrl];

        if (cachedPreviewUrl !== undefined) {
            previewUrls[photoUrl] = cachedPreviewUrl;
        }
    });

    await writePhotoPreviewsModule(previewUrls);
    await pruneUnusedPhotoPreviewAssets(previewUrls);
};

/** 在生产构建开始前生成可缓存的飞机照片预览图与页面读取的 URL 映射。 */
export const pluginAircraftPhotoPreviews = (): RsbuildPlugin => ({
    name: "plugin-aircraft-photo-previews",
    setup(api): void {
        api.onBeforeBuild(async (): Promise<void> => {
            await generateAircraftPhotoPreviews();
        });
    },
});
