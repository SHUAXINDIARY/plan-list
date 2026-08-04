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

/** 三维地球允许用户选择并实际报告的渲染引擎。 */
export type EarthRenderEngine = "webgpu" | "webgl";

/** 三维地球组件的输入数据，复用现有机场标记与航迹数据契约。 */
interface EarthMapProps {
    /** 用于三维标记的已打卡机场。 */
    markers: WorldMapMarker[];
    /** 用于三维弧线的已飞航段。 */
    routes: WorldMapRoute[];
    /** 地图区域的无障碍名称。 */
    ariaLabel: string;
    /** 用户要求优先尝试的三维渲染引擎。 */
    renderEngine: EarthRenderEngine;
    /** 渲染器完成初始化后，向父级报告实际启用的引擎。 */
    onRendererReady: (renderEngine: EarthRenderEngine) => void;
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
    /** 用于复用二维地图各大洲色彩的最小属性集。 */
    properties: {
        /** Natural Earth 中标记的大洲名称。 */
        CONTINENT?: string;
    };
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
/** 大陆填充位于球面和边界线之间，使边界与航迹保持清晰。 */
const LANDMASS_FILL_RADIUS = GLOBE_RADIUS + 0.005;
/** 填充三角面在球面上的最大边长，防止平面弦面落入底球内部。 */
const LANDMASS_FILL_MAX_ARC = THREE.MathUtils.degToRad(6);

/** 二维地图与三维地球共同使用的大洲色彩分组。 */
type EarthLandmassGroup =
    | "northAmerica"
    | "southAmerica"
    | "europe"
    | "africa"
    | "asia"
    | "oceania"
    | "antarctica"
    | "other";

/** 依次生成大陆网格，确保每个分组都有稳定的绘制顺序。 */
const EARTH_LANDMASS_GROUPS: EarthLandmassGroup[] = [
    "northAmerica",
    "southAmerica",
    "europe",
    "africa",
    "asia",
    "oceania",
    "antarctica",
    "other",
];

/** 从二维深色地图 SVG 的各洲填充色转换而来的 sRGB 色值。 */
const EARTH_LANDMASS_DARK_COLORS: Record<EarthLandmassGroup, number> = {
    northAmerica: 0x27444f,
    southAmerica: 0x1f4046,
    europe: 0x2e4958,
    africa: 0x26414c,
    asia: 0x2c474f,
    oceania: 0x2f485a,
    antarctica: 0x43535b,
    other: 0x2a414a,
};

/** 从二维浅色地图 SVG 的各洲填充色转换而来的 sRGB 色值。 */
const EARTH_LANDMASS_LIGHT_COLORS: Record<EarthLandmassGroup, number> = {
    northAmerica: 0xb3c8d1,
    southAmerica: 0xa2c1c5,
    europe: 0xbcced8,
    africa: 0xa3bcc5,
    asia: 0xafc6cb,
    oceania: 0xafcfce,
    antarctica: 0xd6e0e4,
    other: 0xadc2cb,
};

/** 三维地球可使用的 WebGPU 或 WebGL 渲染器实例。 */
type EarthRenderer = THREE.WebGLRenderer | WebGPURenderer;

/** 渲染器创建结果，携带实例及实际使用的渲染引擎。 */
interface EarthRendererResult {
    /** 已完成创建的 Three.js 渲染器实例。 */
    renderer: EarthRenderer;
    /** 该实例实际采用的渲染引擎。 */
    renderEngine: EarthRenderEngine;
}

/** 按用户选择优先初始化 WebGPU，设备不可用或初始化失败时保留 WebGL 回退。 */
const createEarthRenderer = async (
    requestedRenderEngine: EarthRenderEngine,
): Promise<EarthRendererResult> => {
    if (requestedRenderEngine === "webgpu" && navigator.gpu !== undefined) {
        const webGpuRenderer = new WebGPURenderer({
            alpha: true,
            antialias: true,
        });

        try {
            await webGpuRenderer.init();
            return {
                renderer: webGpuRenderer,
                renderEngine: "webgpu",
            };
        } catch {
            webGpuRenderer.dispose();
        }
    }

    return {
        renderer: new THREE.WebGLRenderer({ alpha: true, antialias: true }),
        renderEngine: "webgl",
    };
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

/** 按多边形保留外环与内洞，供大陆填充三角化使用。 */
const getLandmassPolygons = (
    geometry: EarthGeoJsonGeometry,
): GeoJsonPosition[][][] => {
    if (geometry.type === "Polygon") {
        return [geometry.coordinates];
    }

    return geometry.coordinates;
};

/** 将 Natural Earth 的大洲字段映射为二维地图所使用的色彩分组。 */
const getLandmassGroup = (continent: string | undefined): EarthLandmassGroup => {
    switch (continent) {
        case "North America":
            return "northAmerica";
        case "South America":
            return "southAmerica";
        case "Europe":
            return "europe";
        case "Africa":
            return "africa";
        case "Asia":
            return "asia";
        case "Oceania":
            return "oceania";
        case "Antarctica":
            return "antarctica";
        default:
            return "other";
    }
};

/** 去除 GeoJSON 闭合环的重复末点，避免三角化生成退化面。 */
const removeRingClosingPosition = (
    ring: GeoJsonPosition[],
): GeoJsonPosition[] => {
    const firstPosition = ring[0];
    const lastPosition = ring[ring.length - 1];

    if (
        firstPosition !== undefined &&
        lastPosition !== undefined &&
        firstPosition[0] === lastPosition[0] &&
        firstPosition[1] === lastPosition[1]
    ) {
        return ring.slice(0, -1);
    }

    return ring;
};

/** 连续化跨日期变更线的经度，保证平面三角化不会穿过地球另一侧。 */
const createTriangulationRing = (
    ring: GeoJsonPosition[],
): THREE.Vector2[] => {
    const openRing = removeRingClosingPosition(ring);
    let previousLongitude: number | undefined;

    return openRing.map((position: GeoJsonPosition): THREE.Vector2 => {
        let longitude = position[0];

        if (previousLongitude !== undefined) {
            while (longitude - previousLongitude > 180) {
                longitude -= 360;
            }

            while (longitude - previousLongitude < -180) {
                longitude += 360;
            }
        }

        previousLongitude = longitude;
        return new THREE.Vector2(longitude, position[1]);
    });
};

/** 将平面三角化结果细分并重新投射到球面，避免大面片被底球遮挡。 */
const appendSphericalTriangle = (
    positions: number[],
    firstPoint: THREE.Vector2,
    secondPoint: THREE.Vector2,
    thirdPoint: THREE.Vector2,
): void => {
    const firstSurfacePoint = coordinateToVector3(
        { lat: firstPoint.y, lng: firstPoint.x },
        1,
    );
    const secondSurfacePoint = coordinateToVector3(
        { lat: secondPoint.y, lng: secondPoint.x },
        1,
    );
    const thirdSurfacePoint = coordinateToVector3(
        { lat: thirdPoint.y, lng: thirdPoint.x },
        1,
    );
    const segmentCount = Math.max(
        1,
        Math.ceil(
            Math.max(
                firstSurfacePoint.angleTo(secondSurfacePoint),
                secondSurfacePoint.angleTo(thirdSurfacePoint),
                thirdSurfacePoint.angleTo(firstSurfacePoint),
            ) / LANDMASS_FILL_MAX_ARC,
        ),
    );

    /** 用重心坐标插值后归一化到球面，保持细分面始终贴合地球曲率。 */
    const createSurfacePoint = (
        secondWeight: number,
        thirdWeight: number,
    ): THREE.Vector3 => {
        const firstWeight = 1 - secondWeight - thirdWeight;
        const surfacePoint = new THREE.Vector3()
            .addScaledVector(firstSurfacePoint, firstWeight)
            .addScaledVector(secondSurfacePoint, secondWeight)
            .addScaledVector(thirdSurfacePoint, thirdWeight);

        return surfacePoint.normalize().multiplyScalar(LANDMASS_FILL_RADIUS);
    };

    /** 写入非索引三角形顶点，避免额外索引管理并兼容两个渲染后端。 */
    const appendTriangle = (
        firstVertex: THREE.Vector3,
        secondVertex: THREE.Vector3,
        thirdVertex: THREE.Vector3,
    ): void => {
        positions.push(
            firstVertex.x,
            firstVertex.y,
            firstVertex.z,
            secondVertex.x,
            secondVertex.y,
            secondVertex.z,
            thirdVertex.x,
            thirdVertex.y,
            thirdVertex.z,
        );
    };

    for (
        let firstSegmentIndex = 0;
        firstSegmentIndex < segmentCount;
        firstSegmentIndex += 1
    ) {
        for (
            let secondSegmentIndex = 0;
            secondSegmentIndex < segmentCount - firstSegmentIndex;
            secondSegmentIndex += 1
        ) {
            const firstWeight = firstSegmentIndex / segmentCount;
            const secondWeight = secondSegmentIndex / segmentCount;
            const firstVertex = createSurfacePoint(firstWeight, secondWeight);
            const secondVertex = createSurfacePoint(
                (firstSegmentIndex + 1) / segmentCount,
                secondWeight,
            );
            const thirdVertex = createSurfacePoint(
                firstWeight,
                (secondSegmentIndex + 1) / segmentCount,
            );

            appendTriangle(firstVertex, secondVertex, thirdVertex);

            if (firstSegmentIndex + secondSegmentIndex < segmentCount - 1) {
                const fourthVertex = createSurfacePoint(
                    (firstSegmentIndex + 1) / segmentCount,
                    (secondSegmentIndex + 1) / segmentCount,
                );
                appendTriangle(secondVertex, fourthVertex, thirdVertex);
            }
        }
    }
};

/** 将 GeoJSON 多边形三角化后贴合到球面，按大洲合并为少量填充网格。 */
const addLandmassFills = (
    globeGroup: THREE.Group,
    isDarkTheme: boolean,
): void => {
    const positionsByGroup: Record<EarthLandmassGroup, number[]> = {
        northAmerica: [],
        southAmerica: [],
        europe: [],
        africa: [],
        asia: [],
        oceania: [],
        antarctica: [],
        other: [],
    };

    WORLD_MAP_GEOJSON.features.forEach((feature: EarthGeoJsonFeature): void => {
        const positions = positionsByGroup[
            getLandmassGroup(feature.properties.CONTINENT)
        ];

        getLandmassPolygons(feature.geometry).forEach(
            (polygon: GeoJsonPosition[][]): void => {
                const outerRing = polygon[0];

                if (outerRing === undefined) {
                    return;
                }

                const contour = createTriangulationRing(outerRing);
                const holes = polygon
                    .slice(1)
                    .map(createTriangulationRing)
                    .filter(
                        (hole: THREE.Vector2[]): boolean => hole.length >= 3,
                    );

                if (contour.length < 3) {
                    return;
                }

                const polygonPoints = [contour, ...holes].flat();
                const triangles = THREE.ShapeUtils.triangulateShape(
                    contour,
                    holes,
                );

                triangles.forEach((triangle: number[]): void => {
                    const firstPoint = polygonPoints[triangle[0]];
                    const secondPoint = polygonPoints[triangle[1]];
                    const thirdPoint = polygonPoints[triangle[2]];

                    if (
                        firstPoint === undefined ||
                        secondPoint === undefined ||
                        thirdPoint === undefined
                    ) {
                        return;
                    }

                    appendSphericalTriangle(
                        positions,
                        firstPoint,
                        secondPoint,
                        thirdPoint,
                    );
                });
            },
        );
    });

    const landmassColors = isDarkTheme
        ? EARTH_LANDMASS_DARK_COLORS
        : EARTH_LANDMASS_LIGHT_COLORS;

    EARTH_LANDMASS_GROUPS.forEach((group: EarthLandmassGroup): void => {
        const positions = positionsByGroup[group];

        if (positions.length === 0) {
            return;
        }

        const landmassGeometry = new THREE.BufferGeometry();
        landmassGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3),
        );
        landmassGeometry.computeBoundingSphere();

        const landmassMaterial = new THREE.MeshBasicMaterial({
            color: landmassColors[group],
            side: THREE.DoubleSide,
        });
        globeGroup.add(new THREE.Mesh(landmassGeometry, landmassMaterial));
    });
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
const EarthMap = ({
    markers,
    routes,
    ariaLabel,
    renderEngine,
    onRendererReady,
}: EarthMapProps): ReactElement => {
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
            const rendererResult = await createEarthRenderer(renderEngine);
            const renderer = rendererResult.renderer;

            if (isDisposed) {
                renderer.dispose();
                return;
            }

            onRendererReady(rendererResult.renderEngine);

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
            controls.minDistance = 1;
            controls.maxDistance = 10;
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
            addLandmassFills(globeGroup, isDarkTheme);
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
    }, [isDarkTheme, markers, onRendererReady, renderEngine, routes]);

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
