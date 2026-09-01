import * as THREE from "three";

/** 创建模型检查用展示平面，颜色由场景主题同步逻辑在初始化后覆盖。 */
export const createAircraftDisplayFloor = (
    visible: boolean,
): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> => {
    const displayFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 10),
        new THREE.MeshStandardMaterial({
            color: 0x163343,
            roughness: 0.82,
            metalness: 0.08,
        }),
    );
    displayFloor.rotation.x = -Math.PI / 2;
    displayFloor.position.y = -0.015;
    displayFloor.receiveShadow = true;
    displayFloor.visible = visible;

    return displayFloor;
};
