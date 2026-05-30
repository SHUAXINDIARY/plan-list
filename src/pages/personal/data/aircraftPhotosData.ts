import { aircraftPhotoPreviewUrls } from "../photoPreviews.generated";
import { AIRCRAFT_PHOTO_ORIGINAL_URLS } from "../constants/photoMeta";
import type {
    AircraftPhoto,
    AircraftPhotoDirectoryOption,
    AircraftPhotosBundle,
} from "../type";

// 根据图片 URL 的域名与文件名前是否存在路径段，生成稳定的目录键供筛选复用。
const getAircraftPhotoDirectoryKey = (originalUrl: string): string => {
    const parsedUrl = new URL(originalUrl);
    const pathSegments = parsedUrl.pathname
        .split("/")
        .filter((pathSegment: string): boolean => pathSegment.length > 0);
    const directoryPath =
        pathSegments.length <= 1
            ? ""
            : pathSegments.slice(0, -1).join("/");

    if (directoryPath.length === 0) {
        return parsedUrl.hostname;
    }

    return `${parsedUrl.hostname}/${directoryPath}`;
};

// 将目录键转为可读标签：根目录仅含域名，子目录展示路径段名称。
const getAircraftPhotoDirectoryLabel = (directoryKey: string): string => {
    const directoryPathSeparatorIndex = directoryKey.indexOf("/");

    if (directoryPathSeparatorIndex === -1) {
        return "根目录";
    }

    return directoryKey.slice(directoryPathSeparatorIndex + 1);
};

// 列表使用构建期生成的小体积预览图，未生成时回退到原图以保证开发环境可用。
const aircraftPhotos: AircraftPhoto[] = AIRCRAFT_PHOTO_ORIGINAL_URLS.map(
    (originalUrl: string): AircraftPhoto => ({
        originalUrl,
        previewUrl: aircraftPhotoPreviewUrls[originalUrl] ?? originalUrl,
        directory: getAircraftPhotoDirectoryKey(originalUrl),
    }),
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
                        !firstDirectoryKey.includes("/");
                    const isSecondDirectoryRoot =
                        !secondDirectoryKey.includes("/");

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
