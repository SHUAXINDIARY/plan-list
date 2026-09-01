import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type {
    AircraftCamera,
    AircraftCameraHudAxis,
    AircraftCameraHudState,
    AircraftCameraView,
    AircraftProjectionMode,
} from "../types";
import { DEGREES_TO_RADIANS } from "../aircraft/model";

/** 允许近距离检查机身细节时的相机最小距离。 */
export const MINIMUM_CAMERA_DISTANCE = 0.45;
/** 允许完整检查模型外形时的相机最大距离。 */
export const MAXIMUM_CAMERA_DISTANCE = 80;
/** 相机允许接近极点的安全角度，避免 OrbitControls 翻转。 */
export const POLAR_ANGLE_MARGIN = 0.08;
/** 正交相机的基础视锥高度，zoom 负责模型适配与细节检查。 */
export const ORTHOGRAPHIC_FRUSTUM_HEIGHT = 2.4;
/** 正交相机允许的最小缩放值，避免模型完全超出视窗。 */
export const MINIMUM_ORTHOGRAPHIC_ZOOM = 0.25;
/** 正交相机允许的最大缩放值，便于检查局部细节。 */
export const MAXIMUM_ORTHOGRAPHIC_ZOOM = 8;
/** 提升滚轮和双指缩放的响应速度，便于在全屏时检查细节。 */
export const MODEL_VIEWER_ZOOM_SPEED = 1.15;

/** 校验相机视角菜单的字符串值是否为已支持的标准视角。 */
export const isAircraftCameraView = (value: string): value is AircraftCameraView =>
    value === "custom" || value === "fit" || value === "front" || value === "side" || value === "top" || value === "bottom";

/** 校验投影模式 select 的字符串值是否为已支持的相机类型。 */
export const isAircraftProjectionMode = (
    value: string,
): value is AircraftProjectionMode =>
    value === "perspective" || value === "orthographic";
/** 初始相机 fit 为模型包围球保留的可视边距。 */
const CAMERA_FIT_MARGIN = 1.18;
/** 相机标准视角对应的观察方向，坐标系以 Y 轴向上。 */
const CAMERA_VIEW_DIRECTIONS: Readonly<
    Record<Exclude<AircraftCameraView, "custom">, THREE.Vector3Tuple>
> = {
    fit: [0.8, 0.5, 1],
    front: [0, 0, 1],
    side: [1, 0, 0],
    top: [0, 1, 0],
    bottom: [0, -1, 0],
};

/** 创建指定投影模式的相机，并使用统一的近远裁剪范围。 */
export const createAircraftCamera = (
    projectionMode: AircraftProjectionMode,
    aspect: number,
): AircraftCamera => {
    if (projectionMode === "orthographic") {
        const halfHeight = ORTHOGRAPHIC_FRUSTUM_HEIGHT / 2;
        const halfWidth = halfHeight * Math.max(aspect, 0.01);

        return new THREE.OrthographicCamera(
            -halfWidth,
            halfWidth,
            halfHeight,
            -halfHeight,
            0.1,
            100,
        );
    }

    return new THREE.PerspectiveCamera(36, Math.max(aspect, 0.01), 0.1, 100);
};

/** 将世界轴投影为 HUD 中的屏幕线段，并按朝向调整可见度。 */
export const getCameraHudAxis = (
    axis: THREE.Vector3,
    inverseCameraQuaternion: THREE.Quaternion,
): AircraftCameraHudAxis => {
    const cameraAxis = axis.clone().applyQuaternion(inverseCameraQuaternion);
    const screenAngle =
        Math.atan2(-cameraAxis.y, cameraAxis.x) / DEGREES_TO_RADIANS || 0;

    return {
        angle: screenAngle,
        opacity: 0.34 + Math.abs(cameraAxis.z) * 0.5,
    };
};

/** 读取相机相对观察目标的球面方位和世界轴投影。 */
export const getCameraHudState = (
    camera: AircraftCamera,
    controls: OrbitControls<AircraftCamera>,
): AircraftCameraHudState => {
    const offset = camera.position.clone().sub(controls.target);
    const horizontalDistance = Math.hypot(offset.x, offset.z);
    const inverseCameraQuaternion = camera.quaternion.clone().invert();

    return {
        azimuth: Math.atan2(offset.x, offset.z) / DEGREES_TO_RADIANS,
        elevation:
            Math.atan2(offset.y, horizontalDistance) / DEGREES_TO_RADIANS,
        distance: offset.length(),
        axisX: getCameraHudAxis(
            new THREE.Vector3(1, 0, 0),
            inverseCameraQuaternion,
        ),
        axisY: getCameraHudAxis(
            new THREE.Vector3(0, 1, 0),
            inverseCameraQuaternion,
        ),
        axisZ: getCameraHudAxis(
            new THREE.Vector3(0, 0, 1),
            inverseCameraQuaternion,
        ),
    };
};

/** 判断 HUD 数值变化是否超过用户可感知阈值，避免每帧触发 React 重渲染。 */
export const isCameraHudStateEqual = (
    currentState: AircraftCameraHudState | null,
    nextState: AircraftCameraHudState,
): boolean => {
    if (currentState === null) {
        return false;
    }

    const isAxisEqual = (
        currentAxis: AircraftCameraHudAxis,
        nextAxis: AircraftCameraHudAxis,
    ): boolean =>
        Math.abs(currentAxis.angle - nextAxis.angle) < 0.2 &&
        Math.abs(currentAxis.opacity - nextAxis.opacity) < 0.02;

    return (
        Math.abs(currentState.azimuth - nextState.azimuth) < 0.2 &&
        Math.abs(currentState.elevation - nextState.elevation) < 0.2 &&
        Math.abs(currentState.distance - nextState.distance) < 0.01 &&
        isAxisEqual(currentState.axisX, nextState.axisX) &&
        isAxisEqual(currentState.axisY, nextState.axisY) &&
        isAxisEqual(currentState.axisZ, nextState.axisZ)
    );
};

/** 为相机 HUD 生成带方向符号的角度读数。 */
export const formatCameraHudAngle = (angle: number): string =>
    `${angle > 0 ? "+" : ""}${Math.round(angle)}°`;

/** 根据模型包围球和当前视口 FOV 计算标准视角所需距离。 */
export const getCameraFitDistance = (
    camera: AircraftCamera,
    model: THREE.Object3D,
): { center: THREE.Vector3; distance: number } => {
    const bounds = new THREE.Box3().setFromObject(model);
    const modelCenter = model.getWorldPosition(new THREE.Vector3());
    const modelSphere = bounds.getBoundingSphere(new THREE.Sphere());
    if (camera instanceof THREE.OrthographicCamera) {
        const modelDiameter = Math.max(modelSphere.radius * 2, 0.01);
        const availableWidth = Math.max(camera.right - camera.left, 0.01);
        const availableHeight = Math.max(camera.top - camera.bottom, 0.01);
        const fitZoom = Math.min(
            availableWidth / (modelDiameter * CAMERA_FIT_MARGIN),
            availableHeight / (modelDiameter * CAMERA_FIT_MARGIN),
        );
        camera.zoom = Math.min(
            Math.max(fitZoom, MINIMUM_ORTHOGRAPHIC_ZOOM),
            MAXIMUM_ORTHOGRAPHIC_ZOOM,
        );
        camera.updateProjectionMatrix();

        return {
            center: modelCenter,
            distance: Math.max(modelSphere.radius * 3.2, 1),
        };
    }

    const verticalFov = camera.fov * DEGREES_TO_RADIANS;
    const horizontalFov =
        2 *
        Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.01));
    const limitingFov = Math.min(verticalFov, horizontalFov);
    const cameraDistance = Math.max(
        (modelSphere.radius / Math.sin(limitingFov / 2)) * CAMERA_FIT_MARGIN,
        0.5,
    );

    return { center: modelCenter, distance: cameraDistance };
};

/** 应用一个标准相机视角，并让上下视图保持稳定的屏幕朝向。 */
export const applyCameraView = (
    camera: AircraftCamera,
    controls: OrbitControls<AircraftCamera>,
    model: THREE.Object3D,
    view: Exclude<AircraftCameraView, "custom">,
): void => {
    const { center, distance } = getCameraFitDistance(camera, model);
    const viewDirection = new THREE.Vector3(
        ...CAMERA_VIEW_DIRECTIONS[view],
    ).normalize();

    if (view === "top") {
        camera.up.set(0, 0, -1);
    } else if (view === "bottom") {
        camera.up.set(0, 0, 1);
    } else {
        camera.up.set(0, 1, 0);
    }

    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(viewDirection, distance);
    controls.update();
};

/** 按模型包围球和当前视口 FOV 聚焦模型，默认使用右前上方适配视角。 */
export const focusModel = (
    camera: AircraftCamera,
    controls: OrbitControls<AircraftCamera>,
    model: THREE.Object3D,
): void => {
    applyCameraView(camera, controls, model, "fit");
};
