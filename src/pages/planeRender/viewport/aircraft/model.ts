import * as THREE from "three";

/** 归一化后单架模型的最大尺寸，确保不同机型能在同一场景对比。 */
export const NORMALIZED_MODEL_MAX_SIZE = 1.35;
/** 需要进行导入姿态校正的 FR24 GLB 资源路径前缀。 */
export const FR24_MODEL_SOURCE_PREFIX = "fr24-3d-models-glbv2/models/";
/** FR24 模型以 -Z 为机头方向，绕 Y 轴 180° 后与视窗 +Z 前方约定一致。 */
export const FR24_MODEL_FORWARD_CORRECTION = Math.PI;

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
