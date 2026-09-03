import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RsbuildPlugin } from "@rsbuild/core";
import sharp from "sharp";

interface PhotoPreviewEntry {
    originalUrl: string;
    previewDataUrl: string;
}

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(PLUGIN_DIR, "..");
const PERSONAL_PHOTO_META_PATH = join(PROJECT_ROOT, "src/pages/personal/constants/photoMeta.ts");
const PHOTO_PREVIEWS_MODULE_PATH = join(
    PROJECT_ROOT,
    "src/pages/personal/photoPreviews.generated.ts",
);
const PREVIEW_BATCH_SIZE = 4;
const PREVIEW_DOWNLOAD_TIMEOUT_MS = 12000;
const PREVIEW_CACHE_VERSION = "480p-v1";
const PREVIEW_IMAGE_WIDTH = 640;
const PREVIEW_IMAGE_HEIGHT = 480;
const PREVIEW_IMAGE_QUALITY = 62;
const PREVIEW_IMAGE_EFFORT = 5;

// 从个人页图片常量中提取启用的远程图片 URL，注释掉的图片不会参与构建期预览图生成。
const extractAircraftPhotoUrls = (constantSource: string): string[] => {
    const imgsDeclarationMatch = constantSource.match(
        /export const AIRCRAFT_PHOTO_ORIGINAL_URLS: readonly string\[\] = \[([\s\S]*?)\] as const;/,
    );

    if (!imgsDeclarationMatch) {
        return [];
    }

    const uncommentedImgsSource = imgsDeclarationMatch[1]
        .split("\n")
        .filter((line: string): boolean => !line.trim().startsWith("//"))
        .join("\n");
    const photoUrlMatches = uncommentedImgsSource.matchAll(/["']((?:https?:\/\/)[^"']+)["']/g);

    return Array.from(
        new Set(
            Array.from(
                photoUrlMatches,
                (photoUrlMatch: RegExpMatchArray): string => photoUrlMatch[1],
            ),
        ),
    );
};

// 将远程原图压缩成 480p 级别 WebP data URL，兼顾列表加载速度和内容可辨识度。
const createPhotoPreviewDataUrl = async (photoUrl: string): Promise<string | null> => {
    const abortController = new AbortController();
    const timeoutId = setTimeout((): void => {
        abortController.abort();
    }, PREVIEW_DOWNLOAD_TIMEOUT_MS);

    try {
        const imageResponse = await fetch(photoUrl, { signal: abortController.signal });

        if (!imageResponse.ok) {
            console.warn(`[photo-preview] 图片下载失败：${photoUrl}`);
            return null;
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const previewBuffer = await sharp(imageBuffer)
            .rotate()
            .resize({ width: PREVIEW_IMAGE_WIDTH, height: PREVIEW_IMAGE_HEIGHT, fit: "cover" })
            .webp({ quality: PREVIEW_IMAGE_QUALITY, effort: PREVIEW_IMAGE_EFFORT })
            .toBuffer();

        return `data:image/webp;base64,${previewBuffer.toString("base64")}`;
    } catch {
        console.warn(`[photo-preview] 图片下载或预览图生成超时，已回退原图：${photoUrl}`);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
};

// 分批处理远程图片，避免构建时同时发起过多下载请求。
const createPhotoPreviewEntries = async (photoUrls: string[]): Promise<PhotoPreviewEntry[]> => {
    const photoPreviewEntries: PhotoPreviewEntry[] = [];

    for (let startIndex = 0; startIndex < photoUrls.length; startIndex += PREVIEW_BATCH_SIZE) {
        const photoUrlBatch = photoUrls.slice(startIndex, startIndex + PREVIEW_BATCH_SIZE);
        const batchEntries = await Promise.all(
            photoUrlBatch.map(async (photoUrl: string): Promise<PhotoPreviewEntry | null> => {
                const previewDataUrl = await createPhotoPreviewDataUrl(photoUrl);

                return previewDataUrl ? { originalUrl: photoUrl, previewDataUrl } : null;
            }),
        );

        batchEntries.forEach((photoPreviewEntry: PhotoPreviewEntry | null): void => {
            if (photoPreviewEntry) {
                photoPreviewEntries.push(photoPreviewEntry);
            }
        });
    }

    return photoPreviewEntries;
};

// 复用已生成的 data URL，减少重复构建时的远程下载成本。
const readExistingPhotoPreviewRecord = async (): Promise<Record<string, string>> => {
    try {
        const previewModuleSource = await readFile(PHOTO_PREVIEWS_MODULE_PATH, "utf8");

        if (!previewModuleSource.includes(`Preview cache version: ${PREVIEW_CACHE_VERSION}`)) {
            return {};
        }

        const previewRecord: Record<string, string> = {};
        const previewRecordMatches = previewModuleSource.matchAll(/"([^"]+)": "([^"]+)"/g);

        Array.from(previewRecordMatches).forEach((previewRecordMatch: RegExpMatchArray): void => {
            previewRecord[previewRecordMatch[1]] = previewRecordMatch[2];
        });

        return previewRecord;
    } catch {
        return {};
    }
};

// 生成一个可被页面常量读取的 TS 模块；开发模式没有执行插件时会使用仓库内的空映射兜底。
const writePhotoPreviewsModule = async (
    photoPreviewEntries: PhotoPreviewEntry[],
): Promise<void> => {
    const previewRecordEntries = photoPreviewEntries
        .map(
            (photoPreviewEntry: PhotoPreviewEntry): string =>
                `  ${JSON.stringify(photoPreviewEntry.originalUrl)}: ${JSON.stringify(photoPreviewEntry.previewDataUrl)},`,
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

    await writeFile(PHOTO_PREVIEWS_MODULE_PATH, moduleSource);
};

// 读取 photoMeta.ts 中的图片 URL，增量生成预览图映射并写入生成文件。
const generateAircraftPhotoPreviews = async (): Promise<void> => {
    const constantSource = await readFile(PERSONAL_PHOTO_META_PATH, "utf8");
    const photoUrls = extractAircraftPhotoUrls(constantSource);

    if (photoUrls.length === 0) {
        console.warn("[photo-preview] 未从 photoMeta.ts 解析到图片 URL，跳过预览图生成。");
        return;
    }

    const existingPhotoPreviewRecord = await readExistingPhotoPreviewRecord();
    const missingPhotoUrls = photoUrls.filter(
        (photoUrl: string): boolean => existingPhotoPreviewRecord[photoUrl] === undefined,
    );
    const generatedPhotoPreviewEntries = await createPhotoPreviewEntries(missingPhotoUrls);
    const generatedPhotoPreviewRecord = generatedPhotoPreviewEntries.reduce(
        (
            previewRecord: Record<string, string>,
            photoPreviewEntry: PhotoPreviewEntry,
        ): Record<string, string> => ({
            ...previewRecord,
            [photoPreviewEntry.originalUrl]: photoPreviewEntry.previewDataUrl,
        }),
        {},
    );
    const photoPreviewEntries = photoUrls
        .map((photoUrl: string): PhotoPreviewEntry | null => {
            const previewDataUrl =
                existingPhotoPreviewRecord[photoUrl] ?? generatedPhotoPreviewRecord[photoUrl];

            return previewDataUrl ? { originalUrl: photoUrl, previewDataUrl } : null;
        })
        .filter(
            (photoPreviewEntry: PhotoPreviewEntry | null): photoPreviewEntry is PhotoPreviewEntry =>
                Boolean(photoPreviewEntry),
        );

    await writePhotoPreviewsModule(photoPreviewEntries);
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
