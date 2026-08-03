import { useEffect, useRef, useState, type ReactElement } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { WorldMapMarker, WorldMapRoute } from "../../../components/map";

/** 三维地球组件的输入数据，复用现有机场标记与航迹数据契约。 */
interface EarthMapProps {
    /** 用于三维标记的已打卡机场。 */
    markers: WorldMapMarker[];
    /** 用于三维弧线的已飞航段。 */
    routes: WorldMapRoute[];
    /** 地图区域的无障碍名称。 */
    ariaLabel: string;
}

/** 地球半径，所有机场点与航迹都基于该半径计算。 */
const GLOBE_RADIUS = 1;
/** 每条航迹用于采样曲线的分段数。 */
const ROUTE_SEGMENTS = 48;
/** 初始地球偏航角，使亚洲与已有航线在首屏可见。 */
const INITIAL_GLOBE_YAW = -0.9;

/** 将地理坐标投射为球面上的 Three.js 坐标。 */
const coordinateToVector3 = (
    coordinate: WorldMapMarker["coordinate"],
    radius: number,
): THREE.Vector3 => {
    const latitude = THREE.MathUtils.degToRad(coordinate.lat);
    const longitude = THREE.MathUtils.degToRad(coordinate.lng);
    const horizontalRadius = radius * Math.cos(latitude);

    return new THREE.Vector3(
        horizontalRadius * Math.sin(longitude),
        radius * Math.sin(latitude),
        horizontalRadius * Math.cos(longitude),
    );
};

/** 在两个球面坐标间生成抬升的航线弧线点。 */
const createRoutePoints = (route: WorldMapRoute): THREE.Vector3[] => {
    const start = coordinateToVector3(route.start, GLOBE_RADIUS).normalize();
    const end = coordinateToVector3(route.end, GLOBE_RADIUS).normalize();
    const points: THREE.Vector3[] = [];

    for (let segment = 0; segment <= ROUTE_SEGMENTS; segment += 1) {
        const progress = segment / ROUTE_SEGMENTS;
        const surfacePoint = start.clone().lerp(end, progress).normalize();
        const routeLift = 0.045 + Math.sin(progress * Math.PI) * 0.2;

        points.push(surfacePoint.multiplyScalar(GLOBE_RADIUS + routeLift));
    }

    return points;
};

/** 释放地球场景内所有由组件创建的 GPU 资源。 */
const disposeSceneResources = (scene: THREE.Scene): void => {
    scene.traverse((object: THREE.Object3D): void => {
        const mesh = object as THREE.Mesh<THREE.BufferGeometry, THREE.Material>;

        if (mesh.geometry === undefined || mesh.material === undefined) {
            return;
        }

        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
        materials.forEach((material: THREE.Material | undefined): void => {
            if (material !== undefined) {
                material.dispose();
            }
        });
    });
};

/**
 * Three.js 地球：机场点与航线均由当前个人飞行数据驱动，支持拖拽旋转与滚轮缩放。
 */
const EarthMap = ({ markers, routes, ariaLabel }: EarthMapProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>(
        (): boolean => document.documentElement.dataset.theme !== "light",
    );

    useEffect((): (() => void) => {
        const documentRoot = document.documentElement;
        const themeObserver = new MutationObserver((): void => {
            setIsDarkTheme(documentRoot.dataset.theme !== "light");
        });

        themeObserver.observe(documentRoot, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return (): void => themeObserver.disconnect();
    }, []);

    useEffect((): (() => void) | undefined => {
        const container = containerRef.current;
        if (container === null) {
            return undefined;
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        const controls = new OrbitControls(camera, renderer.domElement);
        const globeGroup = new THREE.Group();
        const routeColor = isDarkTheme ? 0x9ed8f2 : 0x0f6f98;
        const domesticRouteColor = isDarkTheme ? 0x6cb4d0 : 0x3c7797;
        const markerColor = isDarkTheme ? 0xdff4ff : 0x0a5d84;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.className = "earth-map__canvas";
        renderer.domElement.setAttribute("aria-hidden", "true");
        container.appendChild(renderer.domElement);

        camera.position.set(0, 0.12, 3.25);
        controls.enableDamping = true;
        controls.dampingFactor = 0.06;
        controls.enablePan = false;
        controls.minDistance = 2.2;
        controls.maxDistance = 4.1;
        controls.target.set(0, 0, 0);
        controls.update();

        globeGroup.rotation.y = INITIAL_GLOBE_YAW;
        scene.add(globeGroup);
        scene.add(new THREE.AmbientLight(0xffffff, isDarkTheme ? 0.8 : 1.1));

        const globe = new THREE.Mesh(
            new THREE.SphereGeometry(GLOBE_RADIUS, 80, 56),
            new THREE.MeshPhongMaterial({
                color: isDarkTheme ? 0x0c2639 : 0x92b8ce,
                emissive: isDarkTheme ? 0x06121e : 0x243f52,
                emissiveIntensity: isDarkTheme ? 0.72 : 0.18,
                shininess: 6,
                transparent: true,
                opacity: isDarkTheme ? 0.96 : 0.88,
            }),
        );
        globeGroup.add(globe);

        const graticule = new THREE.Mesh(
            new THREE.SphereGeometry(GLOBE_RADIUS + 0.002, 40, 24),
            new THREE.MeshBasicMaterial({
                color: isDarkTheme ? 0x87cdea : 0x326d8c,
                wireframe: true,
                transparent: true,
                opacity: isDarkTheme ? 0.16 : 0.2,
            }),
        );
        globeGroup.add(graticule);

        const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(GLOBE_RADIUS + 0.055, 80, 56),
            new THREE.MeshBasicMaterial({
                color: isDarkTheme ? 0x73c7ed : 0x5292b4,
                transparent: true,
                opacity: isDarkTheme ? 0.09 : 0.1,
                side: THREE.BackSide,
            }),
        );
        globeGroup.add(atmosphere);

        routes.forEach((route: WorldMapRoute): void => {
            const routeGeometry = new THREE.BufferGeometry().setFromPoints(
                createRoutePoints(route),
            );
            const routeMaterial = new THREE.LineBasicMaterial({
                color: route.scope === "domestic" ? domesticRouteColor : routeColor,
                transparent: true,
                opacity: route.scope === "domestic" ? 0.62 : 0.88,
            });

            globeGroup.add(new THREE.Line(routeGeometry, routeMaterial));
        });

        markers.forEach((marker: WorldMapMarker): void => {
            const markerMesh = new THREE.Mesh(
                new THREE.SphereGeometry(marker.scope === "domestic" ? 0.018 : 0.023, 12, 12),
                new THREE.MeshBasicMaterial({ color: markerColor }),
            );
            markerMesh.position.copy(
                coordinateToVector3(marker.coordinate, GLOBE_RADIUS + 0.028),
            );
            globeGroup.add(markerMesh);
        });

        const resizeRenderer = (): void => {
            const { width, height } = container.getBoundingClientRect();
            const resolvedWidth = Math.max(width, 1);
            const resolvedHeight = Math.max(height, 1);

            camera.aspect = resolvedWidth / resolvedHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(resolvedWidth, resolvedHeight, false);
        };

        const resizeObserver = new ResizeObserver(resizeRenderer);
        resizeObserver.observe(container);
        resizeRenderer();

        const renderFrame = (): void => {
            controls.update();
            renderer.render(scene, camera);
        };

        renderer.setAnimationLoop(renderFrame);

        return (): void => {
            resizeObserver.disconnect();
            renderer.setAnimationLoop(null);
            controls.dispose();
            disposeSceneResources(scene);
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, [isDarkTheme, markers, routes]);

    return (
        <div
            ref={containerRef}
            className="earth-map"
            role="img"
            aria-label={ariaLabel}
        >
            <p className="earth-map__instruction">
                拖拽旋转地球，滚动可缩放。航线按个人飞行记录绘制。
            </p>
            <div className="earth-map__legend" aria-hidden="true">
                <span className="earth-map__legend-item earth-map__legend-item--domestic">
                    国内航线
                </span>
                <span className="earth-map__legend-item earth-map__legend-item--international">
                    国际航线
                </span>
            </div>
        </div>
    );
};

export default EarthMap;
