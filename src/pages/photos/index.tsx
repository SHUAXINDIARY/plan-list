import { Suspense, lazy, type ReactElement } from "react";
import { PersonalPhotosSectionSkeleton } from "../personal/sections/PersonalPhotosSectionSkeleton";
import "../personal/index.css";
import "./index.css";

const PersonalAircraftPhotosSection = lazy(
    async () => import("../personal/sections/PersonalAircraftPhotosSection"),
);

/**
 * 飞机照片独立页面：复用个人页相册数据、目录筛选和全屏预览能力。
 */
const PhotosPage = (): ReactElement => {
    return (
        <section className="page-panel personal-archive photos-archive" aria-label="飞机照片">
            <Suspense fallback={<PersonalPhotosSectionSkeleton headingLevel="h1" />}>
                <PersonalAircraftPhotosSection headingLevel="h1" />
            </Suspense>
        </section>
    );
};

export default PhotosPage;
