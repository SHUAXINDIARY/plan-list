import * as THREE from "three";
import type { AircraftAttitudeSettings } from "../types";

/** 归一化后单架模型的最大尺寸，确保不同机型能在同一场景对比。 */
export const NORMALIZED_MODEL_MAX_SIZE = 1.35;
/** 姿态角度换算为 Three.js 弧度时使用的比例。 */
export const DEGREES_TO_RADIANS = Math.PI / 180;
/** 需要进行导入姿态校正的 FR24 GLB 资源路径前缀。 */
export const FR24_MODEL_SOURCE_PREFIX = "fr24-3d-models-glbv2/models/";
/** FR24 模型以 -Z 为机头方向，绕 Y 轴 180° 后与视窗 +Z 前方约定一致。 */
export const FR24_MODEL_FORWARD_CORRECTION = Math.PI;
/** 3D 姿态操控器允许的最低俯仰角。 */
export const MINIMUM_PITCH_ANGLE = -60;
/** 3D 姿态操控器允许的最高俯仰角。 */
export const MAXIMUM_PITCH_ANGLE = 60;
/** 3D 姿态操控器允许的最低滚转角。 */
export const MINIMUM_ROLL_ANGLE = -180;
/** 3D 姿态操控器允许的最高滚转角。 */
export const MAXIMUM_ROLL_ANGLE = 180;
/** 3D 姿态操控器允许的最低偏航角。 */
export const MINIMUM_YAW_ANGLE = -180;
/** 3D 姿态操控器允许的最高偏航角。 */
export const MAXIMUM_YAW_ANGLE = 180;
/** 3D 操控器每移动一个屏幕像素对应的俯仰/偏航角度。 */
export const ATTITUDE_ORBIT_DRAG_SENSITIVITY = 0.5;
/** 3D 操控器外圈每移动一个屏幕像素对应的滚转角度。 */
export const ATTITUDE_ROLL_DRAG_SENSITIVITY = 0.8;
/** 原生姿态 range 每次键盘或指针调整的角度步长。 */
export const ATTITUDE_ANGLE_STEP = 1;
/** 飞机姿态使用航空常见的偏航、俯仰、滚转组合顺序。 */
export const AIRCRAFT_ROTATION_ORDER: THREE.EulerOrder = "YXZ";

/** 将模型资源的导入坐标方向统一到视窗约定的机头朝 +Z、机身 Y-up。 */
export const applyModelSourceOrientation = (
    model: THREE.Object3D,
    sourcePath: string,
): void => {
    if (!sourcePath.startsWith(FR24_MODEL_SOURCE_PREFIX)) {
        return;
    }

    model.rotateY(FR24_MODEL_FORWARD_CORRECTION);
};

/** 将姿态面板的三轴角度写入模型根节点，保持模型资源本身不变。 */
export const applyAircraftAttitude = (
    model: THREE.Object3D,
    settings: AircraftAttitudeSettings,
): void => {
    model.rotation.set(
        settings.pitch * DEGREES_TO_RADIANS,
        settings.yaw * DEGREES_TO_RADIANS,
        settings.roll * DEGREES_TO_RADIANS,
        AIRCRAFT_ROTATION_ORDER,
    );
};

/** 为姿态角度生成带方向符号的紧凑读数。 */
export const formatAttitudeAngle = (angle: number): string =>
    `${angle > 0 ? "+" : ""}${angle}°`;

/** 将拖拽计算出的角度限制在指定的安全范围内。 */
export const clampAngle = (
    angle: number,
    minimum: number,
    maximum: number,
): number => Math.min(Math.max(angle, minimum), maximum);

/** 释放 GLB 对象树中使用的网格几何、材质和常见贴图资源。 */
export const disposeSceneResources = (objectRoot: THREE.Object3D): void => {
    objectRoot.traverse((object: THREE.Object3D): void => {
        if (!(object instanceof THREE.Mesh)) {
            return;
        }

        object.geometry.dispose();

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
        materials.forEach((material: THREE.Material): void => {
            if (material instanceof THREE.MeshStandardMaterial) {
                material.map?.dispose();
                material.aoMap?.dispose();
                material.emissiveMap?.dispose();
                material.metalnessMap?.dispose();
                material.normalMap?.dispose();
                material.roughnessMap?.dispose();
            }

            material.dispose();
        });
    });
};

/** 将模型归一化到统一尺寸，并将几何中心移至姿态旋转原点。 */
export const normalizeAircraftModel = (model: THREE.Object3D): void => {
    const sourceBounds = new THREE.Box3().setFromObject(model);
    const sourceSize = sourceBounds.getSize(new THREE.Vector3());
    const largestDimension = Math.max(sourceSize.x, sourceSize.y, sourceSize.z);

    if (largestDimension > 0) {
        model.scale.setScalar(NORMALIZED_MODEL_MAX_SIZE / largestDimension);
    }

    const normalizedBounds = new THREE.Box3().setFromObject(model);
    const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());

    model.position.sub(normalizedCenter);
    model.traverse((object: THREE.Object3D): void => {
        if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
};
