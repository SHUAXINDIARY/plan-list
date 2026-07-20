import {
    Background,
    BackgroundVariant,
    Controls,
    Handle,
    MarkerType,
    Position,
    ReactFlow,
    type Edge,
    type Node,
    type NodeMouseHandler,
    type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState, type ReactElement } from "react";
import { CHECKED_AIRPORTS } from "../constants/summary";
import { MAP_ROUTES } from "../constants/airportsMap";
import type { CheckedAirport, MapRoute } from "../type";

/** 流程图机场节点承载的可见信息。 */
interface AirportFlowNodeData extends Record<string, string | number> {
    /** 机场完整名称。 */
    label: string;
    /** 机场所属国家或地区。 */
    countryName: string;
    /** 与该机场相连的航段数量。 */
    routeCount: number;
}

/** 机场流程图节点类型。 */
type AirportFlowNode = Node<AirportFlowNodeData, "airport">;

/** 各国家或地区在流程画布中的起始位置。 */
interface CountryFlowOrigin {
    /** 分组左上角横坐标。 */
    x: number;
    /** 分组左上角纵坐标。 */
    y: number;
    /** 分组每行容纳的节点数。 */
    columns: number;
}

/** 节点横向间距，保证长机场名在默认缩放下仍可辨认。 */
const NODE_COLUMN_GAP = 240;
/** 节点纵向间距，给双向航线留出清晰的边缘走线空间。 */
const NODE_ROW_GAP = 126;

/** 各地理分组围绕北京双枢纽排布，让长途链路与区域支线形成明确层级。 */
const COUNTRY_FLOW_ORIGINS: Record<string, CountryFlowOrigin> = {
    中国: { x: 0, y: 260, columns: 3 },
    日本: { x: 980, y: 190, columns: 2 },
    韩国: { x: 980, y: 445, columns: 2 },
    泰国: { x: 980, y: 610, columns: 2 },
    新加坡: { x: 740, y: 880, columns: 1 },
    澳大利亚: { x: 1100, y: 880, columns: 1 },
    西班牙: { x: 0, y: 0, columns: 1 },
    意大利: { x: 240, y: 0, columns: 1 },
    法国: { x: 480, y: 0, columns: 1 },
    摩洛哥: { x: 720, y: 0, columns: 1 },
};

/** 北京双枢纽固定在画布中轴，突出大多数航线的真实连接中心。 */
const HUB_AIRPORT_POSITIONS: Record<string, { x: number; y: number }> = {
    北京首都国际机场: { x: 700, y: 330 },
    北京大兴国际机场: { x: 700, y: 540 },
};

/** 从完整机场名中提炼用于节点主标题的城市或机场短名。 */
const getAirportShortName = (airportName: string): string =>
    airportName
        .replace("卡萨布兰卡穆罕默德五世机场", "卡萨布兰卡")
        .replace("巴塞罗那埃尔普拉特机场", "巴塞罗那")
        .replace("罗马菲乌米奇诺机场", "罗马")
        .replace("曼谷素万那普国际机场", "曼谷·素万那普")
        .replace("曼谷廊曼国际机场", "曼谷·廊曼")
        .replace("国际机场", "")
        .replace("机场", "");

/** 自定义机场节点以城市为主信息，并保留国家和连接数作为扫描线索。 */
const AirportFlowNode = ({ data }: NodeProps<AirportFlowNode>): ReactElement => (
    <div className="airport-flow-node__content">
        <Handle type="target" position={Position.Left} />
        <span className="airport-flow-node__country">{data.countryName}</span>
        <strong>{getAirportShortName(data.label)}</strong>
        <small>{data.routeCount} 条航段</small>
        <Handle type="source" position={Position.Right} />
    </div>
);

/** React Flow 自定义节点注册表，引用保持稳定以避免重复挂载。 */
const AIRPORT_FLOW_NODE_TYPES = {
    airport: AirportFlowNode,
};

/** 从机场说明文案中提取稳定的国家或地区名。 */
const getAirportCountryName = (airport: CheckedAirport): string => {
    const countryNameMatch = airport.description.match(
        /^(中国|日本|泰国|西班牙|意大利|法国|摩洛哥|韩国|新加坡|澳大利亚)/,
    );

    return countryNameMatch ? countryNameMatch[1] : "其他地区";
};

/** 将机场名转换为 React Flow 可安全复用的节点标识。 */
const getAirportNodeId = (airportName: string): string =>
    `airport-${encodeURIComponent(airportName)}`;

/** 统计每个机场参与的航段数，用于在节点中提示其网络重要度。 */
const countAirportRoutes = (airportName: string): number =>
    MAP_ROUTES.filter(
        (route: MapRoute): boolean =>
            route.sourceAirportName === airportName ||
            route.targetAirportName === airportName,
    ).length;

/** 将同一国家或地区内的机场依次排入固定网格。 */
const getAirportNodePosition = (
    countryName: string,
    countryIndex: number,
): { x: number; y: number } => {
    const origin = COUNTRY_FLOW_ORIGINS[countryName] ?? {
        x: 260,
        y: 900,
        columns: 2,
    };

    return {
        x: origin.x + (countryIndex % origin.columns) * NODE_COLUMN_GAP,
        y:
            origin.y +
            Math.floor(countryIndex / origin.columns) * NODE_ROW_GAP,
    };
};

/** 从共享机场与航迹常量生成只读的 React Flow 节点。 */
const createAirportFlowNodes = (): AirportFlowNode[] => {
    const connectedAirportNames = new Set<string>();
    MAP_ROUTES.forEach((route: MapRoute): void => {
        connectedAirportNames.add(route.sourceAirportName);
        connectedAirportNames.add(route.targetAirportName);
    });

    const countryIndexes = new Map<string, number>();
    return CHECKED_AIRPORTS.filter((airport: CheckedAirport): boolean =>
        connectedAirportNames.has(airport.name),
    ).map((airport: CheckedAirport): AirportFlowNode => {
        const countryName = getAirportCountryName(airport);
        const countryIndex = countryIndexes.get(countryName) ?? 0;
        countryIndexes.set(countryName, countryIndex + 1);
        const hubPosition = HUB_AIRPORT_POSITIONS[airport.name];
        const routeCount = countAirportRoutes(airport.name);

        return {
            id: getAirportNodeId(airport.name),
            type: "airport",
            position:
                hubPosition ??
                getAirportNodePosition(countryName, countryIndex),
            className:
                hubPosition !== undefined
                    ? "airport-flow-node airport-flow-node--hub"
                    : countryName === "中国"
                    ? "airport-flow-node airport-flow-node--domestic"
                    : "airport-flow-node airport-flow-node--international",
            data: {
                label: airport.name,
                countryName,
                routeCount,
            },
            ariaLabel: `${airport.name}，${countryName}，连接 ${routeCount} 条航段`,
        };
    });
};

/** 从共享航迹常量生成保留方向和国内外语义的 React Flow 边。 */
const createAirportFlowEdges = (): Edge[] =>
    MAP_ROUTES.map(
        (route: MapRoute, routeIndex: number): Edge => {
            const routeColor = `var(--pl-map-route-${route.scope})`;

            return {
                id: `route-${routeIndex}-${getAirportNodeId(route.sourceAirportName)}-${getAirportNodeId(route.targetAirportName)}`,
                source: getAirportNodeId(route.sourceAirportName),
                target: getAirportNodeId(route.targetAirportName),
                type: "smoothstep",
                className: `airport-flow-edge airport-flow-edge--${route.scope}`,
                style: {
                    stroke: routeColor,
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: routeColor,
                },
                ariaLabel: route.name,
            };
        },
    );

/** 以可缩放、可平移的只读航线网络展示个人机场足迹。 */
const PersonalAirportFlow = (): ReactElement => {
    const baseNodes = useMemo(createAirportFlowNodes, []);
    const baseEdges = useMemo(createAirportFlowEdges, []);
    /** 当前聚焦的机场节点；为空时展示完整航线网络。 */
    const [focusedAirportId, setFocusedAirportId] = useState<string | undefined>();

    const connectedAirportIds = useMemo((): Set<string> => {
        if (focusedAirportId === undefined) {
            return new Set<string>();
        }

        const connectedIds = new Set<string>([focusedAirportId]);
        baseEdges.forEach((edge: Edge): void => {
            if (edge.source === focusedAirportId) connectedIds.add(edge.target);
            if (edge.target === focusedAirportId) connectedIds.add(edge.source);
        });
        return connectedIds;
    }, [baseEdges, focusedAirportId]);

    const nodes = useMemo(
        (): AirportFlowNode[] =>
            baseNodes.map((node: AirportFlowNode): AirportFlowNode => ({
                ...node,
                className: `${node.className ?? ""}${node.id === focusedAirportId ? " airport-flow-node--focused" : ""}${focusedAirportId !== undefined && !connectedAirportIds.has(node.id) ? " airport-flow-node--muted" : ""}`,
            })),
        [baseNodes, connectedAirportIds, focusedAirportId],
    );

    const edges = useMemo(
        (): Edge[] =>
            baseEdges.map((edge: Edge): Edge => {
                const isConnected =
                    focusedAirportId === undefined ||
                    edge.source === focusedAirportId ||
                    edge.target === focusedAirportId;

                return {
                    ...edge,
                    className: `${edge.className ?? ""}${isConnected ? "" : " airport-flow-edge--muted"}`,
                    style: {
                        ...edge.style,
                        strokeWidth: isConnected && focusedAirportId !== undefined ? 2.8 : 1.6,
                    },
                };
            }),
        [baseEdges, focusedAirportId],
    );

    /** 点击节点时聚焦其直接航线，再次点击同一节点恢复全览。 */
    const handleNodeClick: NodeMouseHandler<AirportFlowNode> = (
        _event,
        node,
    ): void => {
        setFocusedAirportId((currentId: string | undefined): string | undefined =>
            currentId === node.id ? undefined : node.id,
        );
    };

    return (
        <div className="airport-flow" aria-label="机场航线流程图">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={AIRPORT_FLOW_NODE_TYPES}
                fitView
                fitViewOptions={{ padding: 0.08, maxZoom: 0.9 }}
                minZoom={0.3}
                maxZoom={2}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                onNodeClick={handleNodeClick}
                onPaneClick={(): void => setFocusedAirportId(undefined)}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
                <Controls showInteractive={false} position="bottom-left" />
            </ReactFlow>
            <div className="airport-flow__legend" aria-label="航线图例">
                <span className="airport-flow__legend-item airport-flow__legend-item--domestic">
                    国内航段
                </span>
                <span className="airport-flow__legend-item airport-flow__legend-item--international">
                    国际航段
                </span>
            </div>
        </div>
    );
};

export default PersonalAirportFlow;
