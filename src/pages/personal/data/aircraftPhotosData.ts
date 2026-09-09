import { aircraftPhotoPreviewUrls } from "../photoPreviews.generated";
import { AIRCRAFT_PHOTO_ORIGINAL_URLS } from "../constants/photoMeta";
import type {
    AircraftPhoto,
    AircraftPhotoDirectoryOption,
    AircraftPhotosBundle,
} from "../type";

/** `key` 仅含文件名时使用的根目录筛选键。 */
const AIRCRAFT_PHOTO_ROOT_DIRECTORY_KEY = "root";

/** 原图 URL 到构建期生成的本地预览图 URL 映射。 */
const aircraftPhotoPreviewUrlByOriginalUrl: Record<string, string> =
    aircraftPhotoPreviewUrls;

// 从图片链接的 key 参数提取文件所属目录，保留完整目录层级供筛选复用。
const getAircraftPhotoDirectoryKey = (originalUrl: string): string => {
    const parsedUrl = new URL(originalUrl);
    const objectKey = parsedUrl.searchParams.get("key") ?? "";
    const keySegments = objectKey
        .split("/")
        .filter((keySegment: string): boolean => keySegment.length > 0);

    if (keySegments.length <= 1) {
        return AIRCRAFT_PHOTO_ROOT_DIRECTORY_KEY;
    }

    return keySegments.slice(0, -1).join("/");
};

// 将目录键转为可读标签，根目录展示固定文案，子目录展示完整层级。
const getAircraftPhotoDirectoryLabel = (directoryKey: string): string => {
    if (directoryKey === AIRCRAFT_PHOTO_ROOT_DIRECTORY_KEY) {
        return "根目录";
    }

    return directoryKey;
};

// 相册仅发布构建成功且具有本地映射的照片，避免浏览器回源请求远程图片。
const aircraftPhotos: AircraftPhoto[] = AIRCRAFT_PHOTO_ORIGINAL_URLS.flatMap(
    (originalUrl: string): AircraftPhoto[] => {
        const previewUrl = aircraftPhotoPreviewUrlByOriginalUrl[originalUrl];

        if (previewUrl === undefined) {
            return [];
        }

        return [
            {
                originalUrl,
                previewUrl,
                directory: getAircraftPhotoDirectoryKey(originalUrl),
            },
        ];
    },
);

// 汇总各目录照片数量，根目录优先、其余按路径字母序排列。
const aircraftPhotoDirectoryOptions: AircraftPhotoDirectoryOption[] =
    ((): AircraftPhotoDirectoryOption[] => {
        const directoryPhotoCounts = new Map<string, number>();

        aircraftPhotos.forEach((aircraftPhoto: AircraftPhoto): void => {
            const currentPhotoCount =
                directoryPhotoCounts.get(aircraftPhoto.directory) ?? 0;
            directoryPhotoCounts.set(
                aircraftPhoto.directory,
                currentPhotoCount + 1,
            );
        });

        return Array.from(directoryPhotoCounts.entries())
            .sort(
                (
                    [firstDirectoryKey]: [string, number],
                    [secondDirectoryKey]: [string, number],
                ): number => {
                    const isFirstDirectoryRoot =
                        firstDirectoryKey === AIRCRAFT_PHOTO_ROOT_DIRECTORY_KEY;
                    const isSecondDirectoryRoot =
                        secondDirectoryKey ===
                        AIRCRAFT_PHOTO_ROOT_DIRECTORY_KEY;

                    if (isFirstDirectoryRoot && !isSecondDirectoryRoot) {
                        return -1;
                    }

                    if (!isFirstDirectoryRoot && isSecondDirectoryRoot) {
                        return 1;
                    }

                    return firstDirectoryKey.localeCompare(secondDirectoryKey);
                },
            )
            .map(
                ([directoryValue, photoCount]: [
                    string,
                    number,
                ]): AircraftPhotoDirectoryOption => ({
                    value: directoryValue,
                    label: getAircraftPhotoDirectoryLabel(directoryValue),
                    photoCount,
                }),
            );
    })();

/** 构建期预览与目录元数据，仅在 `personal-aircraft-photos` chunk 内初始化。 */
export const aircraftPhotosBundle: AircraftPhotosBundle = {
    aircraftPhotos,
    aircraftPhotoDirectoryOptions,
};
