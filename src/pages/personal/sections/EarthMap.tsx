import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactElement,
} from "react";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { WorldMapMarker, WorldMapRoute } from "../../../components/map";
import worldMapGeoJsonSource from "../../../components/map/map.geojson?raw";

/** 三维地球组件的输入数据，复用现有机场标记与航迹数据契约。 */
interface EarthMapProps {
    /** 用于三维标记的已打卡机场。 */
    markers: WorldMapMarker[];
    /** 用于三维弧线的已飞航段。 */
    routes: WorldMapRoute[];
    /** 地图区域的无障碍名称。 */
    ariaLabel: string;
}

/** GeoJSON 位置，按经度、纬度的顺序存储。 */
type GeoJsonPosition = number[];

/** GeoJSON 国家边界的 Polygon 或 MultiPolygon 几何结构。 */
type EarthGeoJsonGeometry =
    | {
          /** 单一国家或岛屿多边形。 */
          type: "Polygon";
          /** 每个元素为一条闭合轮廓。 */
          coordinates: GeoJsonPosition[][];
      }
    | {
          /** 由多个独立国家或岛屿多边形组成的边界。 */
          type: "MultiPolygon";
          /** 多边形集合。 */
          coordinates: GeoJsonPosition[][][];
      };

/** GeoJSON 国家边界要素，只消费三维地球所需的几何字段。 */
interface EarthGeoJsonFeature {
    /** 国家边界的几何数据。 */
    geometry: EarthGeoJsonGeometry;
}

/** 世界地图 GeoJSON 的最小数据结构。 */
interface EarthGeoJsonCollection {
    /** 所有国家边界要素。 */
    features: EarthGeoJsonFeature[];
}

/** 当前鼠标命中的机场标记与其容器内坐标。 */
interface EarthMarkerTooltip {
    /** 当前命中的机场数据。 */
    marker: WorldMapMarker;
    /** 浮层相对地球容器的横向坐标。 */
    x: number;
    /** 浮层相对地球容器的纵向坐标。 */
    y: number;
}

/** 地球半径，所有机场点与航迹都基于该半径计算。 */
const GLOBE_RADIUS = 1;
/** 每条航迹用于采样曲线的分段数。 */
const ROUTE_SEGMENTS = 48;
/** 初始地球偏航角，使亚洲与已有航线在首屏可见。 */
const INITIAL_GLOBE_YAW = -0.9;
/** 大陆轮廓略高于球体表面，避免被地球材质遮挡。 */
const LANDMASS_RADIUS = GLOBE_RADIUS + 0.008;

/** 三维地球可使用的 WebGPU 或 WebGL 渲染器实例。 */
type EarthRenderer = THREE.WebGLRenderer | WebGPURenderer;

/** 优先初始化 WebGPU 渲染器，设备不可用或初始化失败时保留 WebGL 回退。 */
const createEarthRenderer = async (): Promise<EarthRenderer> => {
    if (navigator.gpu !== undefined) {
        const webGpuRenderer = new WebGPURenderer({
            alpha: true,
            antialias: true,
        });

        try {
            await webGpuRenderer.init();
            return webGpuRenderer;
        } catch {
            webGpuRenderer.dispose();
        }
    }

    return new THREE.WebGLRenderer({ alpha: true, antialias: true });
};

/** 解析构建期内联的 GeoJSON 文本，为大陆边界绘制提供结构化数据。 */
const parseWorldMapGeoJson = (source: string): EarthGeoJsonCollection => {
    return JSON.parse(source) as EarthGeoJsonCollection;
};

/** 世界地图 GeoJSON 仅按三维渲染实际需要的结构读取。 */
const WORLD_MAP_GEOJSON = parseWorldMapGeoJson(worldMapGeoJsonSource);

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

/** 提取 Polygon 与 MultiPolygon 中的所有闭合边界轮廓。 */
const getLandmassRings = (
    geometry: EarthGeoJsonGeometry,
): GeoJsonPosition[][] => {
    if (geometry.type === "Polygon") {
        return geometry.coordinates;
    }

    return geometry.coordinates.flat();
};

/** 将 GeoJSON 大陆与国家边界绘制为贴合球面的三维轮廓线。 */
const addLandmassContours = (
    globeGroup: THREE.Group,
    isDarkTheme: boolean,
): void => {
    WORLD_MAP_GEOJSON.features.forEach((feature: EarthGeoJsonFeature): void => {
        getLandmassRings(feature.geometry).forEach(
            (ring: GeoJsonPosition[]): void => {
                if (ring.length < 3) {
                    return;
                }

                const contourPoints = ring.map(
                    (position: GeoJsonPosition): THREE.Vector3 =>
                        coordinateToVector3(
                            { lat: position[1], lng: position[0] },
                            LANDMASS_RADIUS,
                        ),
                );
                const firstContourPoint = contourPoints[0];
                const lastContourPoint = contourPoints[contourPoints.length - 1];

                // WebGPU 不支持 LineLoop；补齐首尾顶点后使用 Line 保持相同的闭合轮廓。
                if (!firstContourPoint.equals(lastContourPoint)) {
                    contourPoints.push(firstContourPoint.clone());
                }

                const contourGeometry = new THREE.BufferGeometry().setFromPoints(
                    contourPoints,
                );
                const contourMaterial = new THREE.LineBasicMaterial({
                    color: isDarkTheme ? 0x5b9ab7 : 0x407b99,
                    transparent: true,
                    opacity: isDarkTheme ? 0.58 : 0.5,
                });

                globeGroup.add(new THREE.Line(contourGeometry, contourMaterial));
            },
        );
    });
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
    const [hoveredMarker, setHoveredMarker] = useState<EarthMarkerTooltip | null>(
        null,
    );
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

        let isDisposed = false;
        let cleanupRenderer: (() => void) | undefined;

        /** 异步获取渲染器后创建场景；卸载期间完成的初始化会立即释放。 */
        const initializeEarthMap = async (): Promise<void> => {
            const renderer = await createEarthRenderer();

            if (isDisposed) {
                renderer.dispose();
                return;
            }

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
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
            addLandmassContours(globeGroup, isDarkTheme);

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
                    color:
                        route.scope === "domestic"
                            ? domesticRouteColor
                            : routeColor,
                    transparent: true,
                    opacity: route.scope === "domestic" ? 0.62 : 0.88,
                });

                globeGroup.add(new THREE.Line(routeGeometry, routeMaterial));
            });

            const markerMeshes: THREE.Mesh[] = [];
            const markerById = new Map<string, WorldMapMarker>();

            markers.forEach((marker: WorldMapMarker): void => {
                const markerMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(
                        marker.scope === "domestic" ? 0.018 : 0.023,
                        12,
                        12,
                    ),
                    new THREE.MeshBasicMaterial({ color: markerColor }),
                );
                markerMesh.position.copy(
                    coordinateToVector3(
                        marker.coordinate,
                        GLOBE_RADIUS + 0.028,
                    ),
                );
                markerMesh.name = marker.id;
                markerMeshes.push(markerMesh);
                markerById.set(marker.id, marker);
                globeGroup.add(markerMesh);
            });

            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();

            /** 根据指针位置命中机场球体，并将可见提示定位到容器内。 */
            const handleMarkerHover = (event: PointerEvent): void => {
                const bounds = container.getBoundingClientRect();
                pointer.x =
                    ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
                pointer.y =
                    -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
                globeGroup.updateWorldMatrix(true, true);
                raycaster.setFromCamera(pointer, camera);

                const intersectedMarker = raycaster.intersectObjects(
                    markerMeshes,
                    false,
                )[0];
                const marker = intersectedMarker
                    ? markerById.get(intersectedMarker.object.name)
                    : undefined;

                setHoveredMarker(
                    marker === undefined
                        ? null
                        : {
                              marker,
                              x: event.clientX - bounds.left,
                              y: event.clientY - bounds.top,
                          },
                );
            };

            /** 清空指针离开三维地球后的机场提示。 */
            const clearMarkerHover = (): void => setHoveredMarker(null);

            renderer.domElement.addEventListener(
                "pointermove",
                handleMarkerHover,
            );
            renderer.domElement.addEventListener(
                "pointerleave",
                clearMarkerHover,
            );

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

            cleanupRenderer = (): void => {
                resizeObserver.disconnect();
                renderer.setAnimationLoop(null);
                renderer.domElement.removeEventListener(
                    "pointermove",
                    handleMarkerHover,
                );
                renderer.domElement.removeEventListener(
                    "pointerleave",
                    clearMarkerHover,
                );
                controls.dispose();
                disposeSceneResources(scene);
                renderer.dispose();
                renderer.domElement.remove();
            };

            if (isDisposed) {
                cleanupRenderer();
            }
        };

        void initializeEarthMap();

        return (): void => {
            isDisposed = true;
            cleanupRenderer?.();
        };
    }, [isDarkTheme, markers, routes]);

    const markerTooltipStyle: CSSProperties | undefined =
        hoveredMarker === null
            ? undefined
            : {
                  left: `${hoveredMarker.x}px`,
                  top: `${hoveredMarker.y}px`,
              };

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
            {hoveredMarker !== null ? (
                <div
                    className={`earth-map__tooltip earth-map__tooltip--${hoveredMarker.marker.scope}`}
                    style={markerTooltipStyle}
                    aria-hidden="true"
                >
                    <strong>{hoveredMarker.marker.name}</strong>
                    {hoveredMarker.marker.description ? (
                        <span>{hoveredMarker.marker.description}</span>
                    ) : null}
                </div>
            ) : null}
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
