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

/** 已生成的预览图及其静态资源文件。 */
interface PhotoPreviewEntry {
    /** 原始照片 URL，用作运行时映射键。 */
    originalUrl: string;
    /** 预览图在 public 目录下的访问路径。 */
    previewUrl: string;
    /** 待写入静态资源目录的 WebP 二进制内容。 */
    previewBuffer: Buffer;
}

/** 生成模块中不含二进制内容的预览图映射条目。 */
interface PhotoPreviewManifestEntry {
    /** 原始照片 URL，用作运行时映射键。 */
    originalUrl: string;
    /** 预览图在 public 目录下的访问路径。 */
    previewUrl: string;
}

/** 读取到的缓存记录，包含可复用预览和近期失败时间。 */
interface PhotoPreviewCache {
    /** 已存在且文件仍可读取的预览图 URL 映射。 */
    previewUrls: Record<string, string>;
    /** 最近一次生成失败的时间戳，避免构建反复等待同一故障源。 */
    failureTimestamps: Record<string, number>;
}

/** 当前批次生成的预览结果和失败 URL。 */
interface PhotoPreviewGenerationResult {
    /** 已转换但尚未写入磁盘的预览图。 */
    entries: PhotoPreviewEntry[];
    /** 下载或处理失败、需要回退原图的 URL。 */
    failedPhotoUrls: string[];
}

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(PLUGIN_DIR, "..");
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
    "public/generated/aircraft-photo-previews",
);
const PHOTO_PREVIEW_PUBLIC_PREFIX = "/generated/aircraft-photo-previews";
/** 并发下载数量，避免单次构建压垮图片服务或 Sharp worker。 */
const PREVIEW_BATCH_SIZE = 4;
/** 单个 URL 的网络和处理时间上限。 */
const PREVIEW_DOWNLOAD_TIMEOUT_MS = 12000;
/** 单次构建允许消耗的总预览生成时间，超出后保留原图回退。 */
const PREVIEW_GENERATION_BUDGET_MS = 60000;
/** 单张源图片允许读取的最大字节数，避免异常响应占满构建进程内存。 */
const PREVIEW_MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
/** Sharp 解码时允许的最大像素数，防止超大尺寸图片造成内存压力。 */
const PREVIEW_MAX_INPUT_PIXELS = 40_000_000;
/** 失败缓存的冷却时间，过期后才会重新尝试下载。 */
const PREVIEW_FAILURE_RETRY_AFTER_MS = 60 * 60 * 1000;
/** 预览图格式或尺寸变化时递增，旧缓存会自动失效。 */
const PREVIEW_CACHE_VERSION = "480p-static-v2";
const PREVIEW_IMAGE_WIDTH = 640;
const PREVIEW_IMAGE_HEIGHT = 480;
const PREVIEW_IMAGE_QUALITY = 62;
const PREVIEW_IMAGE_EFFORT = 5;
const PREVIEW_ASSET_FILE_NAME_PATTERN = /^[a-f0-9]{64}\.webp$/;
const REMOTE_PHOTO_URL_PATTERN = /^https?:\/\//;

// 通过 TypeScript AST 提取所有照片字符串字面量，覆盖 spread 内容并自动排除注释。
const extractAircraftPhotoUrls = (constantSource: string): string[] => {
    const sourceFile = ts.createSourceFile(
        PERSONAL_PHOTO_META_PATH,
        constantSource,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );
    const photoUrls: string[] = [];
    const visit = (node: ts.Node): void => {
        if (
            (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
            REMOTE_PHOTO_URL_PATTERN.test(node.text)
        ) {
            photoUrls.push(node.text);
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return Array.from(new Set(photoUrls));
};

/** 为每个原图 URL 生成稳定文件名，源文件内容变化时可通过版本号整体失效。 */
const getPreviewAssetFileName = (photoUrl: string): string =>
    `${createHash("sha256")
        .update(`${PREVIEW_CACHE_VERSION}:${photoUrl}`)
        .digest("hex")}.webp`;

/** 将缓存中的公开路径限制在预览目录内，并转换为本地文件路径。 */
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

/** 读取响应体并限制最大字节数，避免 arrayBuffer 无上限分配内存。 */
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

/** 下载并压缩单张图片；返回 null 时由页面继续使用原图。 */
const createPhotoPreviewBuffer = async (
    photoUrl: string,
    timeoutMs: number,
): Promise<Buffer | null> => {
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

        return await sharp(imageBuffer, {
            limitInputPixels: PREVIEW_MAX_INPUT_PIXELS,
        })
            .rotate()
            .resize({
                width: PREVIEW_IMAGE_WIDTH,
                height: PREVIEW_IMAGE_HEIGHT,
                fit: "cover",
            })
            .webp({
                quality: PREVIEW_IMAGE_QUALITY,
                effort: PREVIEW_IMAGE_EFFORT,
            })
            .toBuffer();
    } catch (error) {
        const failureReason = abortController.signal.aborted
            ? "图片下载或处理超时"
            : error instanceof Error
              ? `图片下载或处理失败（${error.message}）`
              : "图片下载或处理失败";

        console.warn(`[photo-preview] ${failureReason}，已回退原图：${photoUrl}`);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
};

/** 分批处理远程图片，并在总预算耗尽时将剩余 URL 标记为失败。 */
const createPhotoPreviewEntries = async (
    photoUrls: string[],
    generationDeadline: number,
): Promise<PhotoPreviewGenerationResult> => {
    const entries: PhotoPreviewEntry[] = [];
    const failedPhotoUrls: string[] = [];

    for (
        let startIndex = 0;
        startIndex < photoUrls.length;
        startIndex += PREVIEW_BATCH_SIZE
    ) {
        const remainingTimeMs = generationDeadline - Date.now();
        const photoUrlBatch = photoUrls.slice(
            startIndex,
            startIndex + PREVIEW_BATCH_SIZE,
        );

        if (remainingTimeMs <= 0) {
            failedPhotoUrls.push(
                ...photoUrlBatch,
                ...photoUrls.slice(startIndex + PREVIEW_BATCH_SIZE),
            );
            break;
        }

        const batchTimeoutMs = Math.min(
            PREVIEW_DOWNLOAD_TIMEOUT_MS,
            remainingTimeMs,
        );
        const batchEntries = await Promise.all(
            photoUrlBatch.map(
                async (
                    photoUrl: string,
                ): Promise<PhotoPreviewEntry | null> => {
                    const previewBuffer = await createPhotoPreviewBuffer(
                        photoUrl,
                        batchTimeoutMs,
                    );

                    return previewBuffer === null
                        ? null
                        : {
                              originalUrl: photoUrl,
                              previewUrl: `${PHOTO_PREVIEW_PUBLIC_PREFIX}/${getPreviewAssetFileName(photoUrl)}`,
                              previewBuffer,
                          };
                },
            ),
        );

        batchEntries.forEach(
            (entry: PhotoPreviewEntry | null, entryIndex: number): void => {
                if (entry === null) {
                    const failedPhotoUrl = photoUrlBatch[entryIndex];

                    if (failedPhotoUrl !== undefined) {
                        failedPhotoUrls.push(failedPhotoUrl);
                    }
                    return;
                }

                entries.push(entry);
            },
        );
    }

    return { entries, failedPhotoUrls };
};

/** 从生成模块的对象文本中读取字符串映射。 */
const parseStringRecord = (recordSource: string): Record<string, string> => {
    const record: Record<string, string> = {};
    const recordMatches = recordSource.matchAll(
        /^\s*"([^"\\]+)":\s*"([^"\\]+)",?$/gm,
    );

    Array.from(recordMatches).forEach(
        (recordMatch: RegExpMatchArray): void => {
            record[recordMatch[1]] = recordMatch[2];
        },
    );

    return record;
};

/** 从生成模块的对象文本中读取失败时间戳映射。 */
const parseNumberRecord = (recordSource: string): Record<string, number> => {
    const record: Record<string, number> = {};
    const recordMatches = recordSource.matchAll(
        /^\s*"([^"\\]+)":\s*(\d+),?$/gm,
    );

    Array.from(recordMatches).forEach(
        (recordMatch: RegExpMatchArray): void => {
            record[recordMatch[1]] = Number(recordMatch[2]);
        },
    );

    return record;
};

/** 读取版本匹配且静态文件仍存在的预览缓存。 */
const readExistingPhotoPreviewCache = async (): Promise<PhotoPreviewCache> => {
    try {
        const previewModuleSource = await readFile(
            PHOTO_PREVIEWS_MODULE_PATH,
            "utf8",
        );

        if (
            !previewModuleSource.includes(
                `Preview cache version: ${PREVIEW_CACHE_VERSION}`,
            )
        ) {
            return { previewUrls: {}, failureTimestamps: {} };
        }

        const previewRecordSource =
            previewModuleSource.match(
                /export const aircraftPhotoPreviewUrls = \{([\s\S]*?)\n\} satisfies/,
            )?.[1] ?? "";
        const failureRecordSource =
            previewModuleSource.match(
                /export const aircraftPhotoPreviewFailures = \{([\s\S]*?)\n\} satisfies/,
            )?.[1] ?? "";
        const previewUrls = parseStringRecord(previewRecordSource);
        const validPreviewEntries = await Promise.all(
            Object.entries(previewUrls).map(
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
            failureTimestamps: parseNumberRecord(failureRecordSource),
        };
    } catch {
        return { previewUrls: {}, failureTimestamps: {} };
    }
};

/** 用临时文件写入后原子替换目标，避免中断时留下半截生成文件。 */
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
            // 清理失败不应覆盖原始写入错误。
        }
        throw error;
    }
};

/** 将生成的 WebP 写入专用静态资源目录。 */
const writePhotoPreviewAsset = async (
    entry: PhotoPreviewEntry,
): Promise<void> => {
    await writeFileAtomically(
        join(
            PHOTO_PREVIEW_ASSET_DIRECTORY,
            getPreviewAssetFileName(entry.originalUrl),
        ),
        entry.previewBuffer,
    );
};

/** 清理当前照片清单已不再引用的旧预览文件。 */
const pruneUnusedPhotoPreviewAssets = async (
    previewUrls: Record<string, string>,
): Promise<void> => {
    try {
        const activeFileNames = new Set(
            Object.values(previewUrls).map(
                (previewUrl: string): string | null => {
                    const assetPath = getPreviewAssetPath(previewUrl);
                    return assetPath === null ? null : basename(assetPath);
                },
            ),
        );
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
    } catch {
        // 清理失败不影响已经生成的映射和本次构建。
    }
};

/** 生成页面读取的静态路径映射和失败冷却记录。 */
const writePhotoPreviewsModule = async (
    photoPreviewEntries: PhotoPreviewManifestEntry[],
    failureTimestamps: Record<string, number>,
): Promise<void> => {
    const previewRecordEntries = photoPreviewEntries
        .map(
            (entry: PhotoPreviewManifestEntry): string =>
                `  ${JSON.stringify(entry.originalUrl)}: ${JSON.stringify(entry.previewUrl)},`,
        )
        .join("\n");
    const failureRecordEntries = Object.entries(failureTimestamps)
        .map(
            ([originalUrl, failedAt]: [string, number]): string =>
                `  ${JSON.stringify(originalUrl)}: ${failedAt},`,
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
        "export const aircraftPhotoPreviewFailures = {",
        failureRecordEntries,
        "} satisfies Record<string, number>;",
        "",
    ].join("\n");

    await writeFileAtomically(PHOTO_PREVIEWS_MODULE_PATH, moduleSource);
};

// 读取 photoMeta.ts 中的图片 URL，增量生成静态预览图映射并写入生成文件。
const generateAircraftPhotoPreviews = async (): Promise<void> => {
    const constantSource = await readFile(PERSONAL_PHOTO_META_PATH, "utf8");
    const photoUrls = extractAircraftPhotoUrls(constantSource);

    if (photoUrls.length === 0) {
        console.warn(
            "[photo-preview] 未从 photoMeta.ts 解析到图片 URL，跳过预览图生成。",
        );
        return;
    }

    const existingPhotoPreviewCache = await readExistingPhotoPreviewCache();
    const currentTime = Date.now();
    const retryablePhotoUrls = photoUrls.filter((photoUrl: string): boolean => {
        if (existingPhotoPreviewCache.previewUrls[photoUrl] !== undefined) {
            return false;
        }

        const failedAt = existingPhotoPreviewCache.failureTimestamps[photoUrl];

        return (
            failedAt === undefined ||
            currentTime - failedAt >= PREVIEW_FAILURE_RETRY_AFTER_MS
        );
    });
    const retryablePhotoUrlSet = new Set(retryablePhotoUrls);
    const generationResult = await createPhotoPreviewEntries(
        retryablePhotoUrls,
        currentTime + PREVIEW_GENERATION_BUDGET_MS,
    );

    await mkdir(PHOTO_PREVIEW_ASSET_DIRECTORY, { recursive: true });

    const persistedEntries: PhotoPreviewEntry[] = [];
    const failedPhotoUrls = new Set(generationResult.failedPhotoUrls);

    for (const entry of generationResult.entries) {
        try {
            await writePhotoPreviewAsset(entry);
            persistedEntries.push(entry);
        } catch (error) {
            failedPhotoUrls.add(entry.originalUrl);
            console.warn(
                `[photo-preview] 预览文件写入失败，已回退原图：${entry.originalUrl}`,
                error,
            );
        }
    }

    const generatedPhotoPreviewRecord = new Map<string, string>(
        persistedEntries.map(
            (entry: PhotoPreviewEntry): [string, string] => [
                entry.originalUrl,
                entry.previewUrl,
            ],
        ),
    );
    const previewUrls: Record<string, string> = {};

    photoUrls.forEach((photoUrl: string): void => {
        const previewUrl =
            existingPhotoPreviewCache.previewUrls[photoUrl] ??
            generatedPhotoPreviewRecord.get(photoUrl);

        if (previewUrl !== undefined) {
            previewUrls[photoUrl] = previewUrl;
        }
    });

    const failureTimestamps: Record<string, number> = {};

    photoUrls.forEach((photoUrl: string): void => {
        if (previewUrls[photoUrl] !== undefined) {
            return;
        }

        const existingFailedAt =
            existingPhotoPreviewCache.failureTimestamps[photoUrl];

        failureTimestamps[photoUrl] = failedPhotoUrls.has(photoUrl)
            ? existingFailedAt !== undefined &&
              !retryablePhotoUrlSet.has(photoUrl)
                ? existingFailedAt
                : Date.now()
            : existingFailedAt ?? Date.now();
    });

    const previewEntries: PhotoPreviewManifestEntry[] = Object.entries(
        previewUrls,
    ).map(
        ([originalUrl, previewUrl]: [string, string]): PhotoPreviewManifestEntry => ({
            originalUrl,
            previewUrl,
        }),
    );

    await writePhotoPreviewsModule(previewEntries, failureTimestamps);
    await pruneUnusedPhotoPreviewAssets(previewUrls);
};

// 在生产构建前生成飞机照片预览图映射，页面端按该映射优先展示轻量缩略图。
export const pluginAircraftPhotoPreviews = (): RsbuildPlugin => ({
    name: "plugin-aircraft-photo-previews",
    setup(api): void {
        api.onBeforeBuild(async (): Promise<void> => {
            await generateAircraftPhotoPreviews();
        });
    },
});
