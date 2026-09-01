import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
    MAXIMUM_CAMERA_DISTANCE,
    MAXIMUM_ORTHOGRAPHIC_ZOOM,
    MINIMUM_CAMERA_DISTANCE,
    MINIMUM_ORTHOGRAPHIC_ZOOM,
    MODEL_VIEWER_ZOOM_SPEED,
    POLAR_ANGLE_MARGIN,
} from "./camera";
import type { AircraftCamera } from "../types";

/** 为飞机模型统一配置轨道相机的阻尼、缩放与极角边界。 */
export const configureAircraftOrbitControls = (
    controls: OrbitControls<AircraftCamera>,
): void => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = MINIMUM_CAMERA_DISTANCE;
    controls.maxDistance = MAXIMUM_CAMERA_DISTANCE;
    controls.minPolarAngle = POLAR_ANGLE_MARGIN;
    controls.maxPolarAngle = Math.PI - POLAR_ANGLE_MARGIN;
    controls.zoomSpeed = MODEL_VIEWER_ZOOM_SPEED;
    controls.zoomToCursor = true;
    controls.minZoom = MINIMUM_ORTHOGRAPHIC_ZOOM;
    controls.maxZoom = MAXIMUM_ORTHOGRAPHIC_ZOOM;
};
