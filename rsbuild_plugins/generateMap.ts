import { readFileSync, writeFileSync } from "node:fs";

type Coordinate = readonly [number, number];
type LinearRing = Coordinate[];
type PolygonCoordinates = LinearRing[];
type MultiPolygonCoordinates = PolygonCoordinates[];
type GeoJsonGeometry =
    | {
          type: "Polygon";
          coordinates: PolygonCoordinates;
      }
    | {
          type: "MultiPolygon";
          coordinates: MultiPolygonCoordinates;
      }
    | null;

interface GeoJsonProperties {
    CONTINENT?: string;
    ADMIN?: string;
    NAME?: string;
    ADM0_A3?: string;
}

interface GeoJsonFeature {
    properties: GeoJsonProperties;
    geometry: GeoJsonGeometry;
}

interface GeoJsonFeatureCollection {
    features: GeoJsonFeature[];
}

interface CountryPath {
    name: string;
    abbrev: string;
    className: string;
    d: string;
}

const INPUT_PATH = "ne_110m_admin_0_countries.geojson";
const OUTPUT_PATH = "world-map-natural-earth.svg";
const WIDTH = 1200;
const HEIGHT = 650;
const MARGIN_X = 42;
const MARGIN_Y = 42;
const MAP_WIDTH = WIDTH - MARGIN_X * 2;
const MAP_HEIGHT = HEIGHT - MARGIN_Y * 2;

const continentClasses = {
    Africa: "africa",
    Asia: "asia",
    Europe: "europe",
    "North America": "north-america",
    "South America": "south-america",
    Oceania: "oceania",
    Antarctica: "antarctica",
    "Seven seas (open ocean)": "other",
} satisfies Record<string, string>;

const continentLabels: readonly (readonly [string, number, number])[] = [
    ["North America", -105, 48],
    ["South America", -60, -22],
    ["Europe", 16, 54],
    ["Africa", 21, 4],
    ["Asia", 90, 43],
    ["Oceania", 135, -25],
    ["Antarctica", 0, -77],
];

const sortedContinents = [
    "North America",
    "South America",
    "Europe",
    "Africa",
    "Asia",
    "Oceania",
    "Antarctica",
] as const;

const geojson = JSON.parse(readFileSync(INPUT_PATH, "utf8")) as GeoJsonFeatureCollection;

// 转义 XML 属性和文本内容，避免国家名中的特殊字符破坏 SVG。
const escapeXml = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

// 将经纬度映射到固定尺寸 SVG 画布坐标。
const project = ([lon, lat]: Coordinate): Coordinate => {
    const x = MARGIN_X + ((lon + 180) / 360) * MAP_WIDTH;
    const y = MARGIN_Y + ((90 - lat) / 180) * MAP_HEIGHT;

    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
};

// 将单个 GeoJSON ring 转为 SVG path，并在跨日期变更线时重新起笔。
const ringToPath = (ring: LinearRing): string => {
    let d = "";
    let open = false;
    let lastLon: number | null = null;

    ring.forEach((coord: Coordinate): void => {
        const [lon, lat] = coord;
        const [x, y] = project([lon, lat]);
        const crossesDateLine = lastLon !== null && Math.abs(lon - lastLon) > 180;

        if (!open || crossesDateLine) {
            d += `M${x} ${y}`;
            open = true;
        } else {
            d += `L${x} ${y}`;
        }

        lastLon = lon;
    });

    return `${d}Z`;
};

// 将 Polygon 的所有 ring 合并为一个 SVG path 字符串。
const polygonToPath = (polygon: PolygonCoordinates): string => polygon.map(ringToPath).join("");

// 支持 Polygon 与 MultiPolygon 两类 Natural Earth 国家边界。
const geometryToPath = (geometry: GeoJsonGeometry): string => {
    if (!geometry) {
        return "";
    }

    if (geometry.type === "Polygon") {
        return polygonToPath(geometry.coordinates);
    }

    return geometry.coordinates.map(polygonToPath).join("");
};

const countriesByContinent = new Map<string, CountryPath[]>();

geojson.features.forEach((feature: GeoJsonFeature): void => {
    const continent = feature.properties.CONTINENT || "Other";
    const className = continentClasses[continent as keyof typeof continentClasses] || "other";
    const d = geometryToPath(feature.geometry);

    if (!d) {
        return;
    }

    const country: CountryPath = {
        name: feature.properties.ADMIN || feature.properties.NAME || "Unnamed country",
        abbrev: feature.properties.ADM0_A3 || "",
        className,
        d,
    };
    const continentCountries = countriesByContinent.get(continent);

    if (continentCountries) {
        continentCountries.push(country);
        return;
    }

    countriesByContinent.set(continent, [country]);
});

// 生成经纬网线，作为地图的轻量定位参考。
const graticule = (): string => {
    const lines: string[] = [];

    for (let lon = -150; lon <= 150; lon += 30) {
        const [x1, y1] = project([lon, -85]);
        const [x2, y2] = project([lon, 85]);
        lines.push(`<path d="M${x1} ${y1}L${x2} ${y2}"/>`);
    }

    for (let lat = -60; lat <= 60; lat += 30) {
        const [x1, y1] = project([-180, lat]);
        const [x2, y2] = project([180, lat]);
        lines.push(`<path d="M${x1} ${y1}L${x2} ${y2}"/>`);
    }

    return lines.join("\n      ");
};

const getSortedCountries = (continent: string): CountryPath[] =>
    [...(countriesByContinent.get(continent) ?? [])].sort(
        (a: CountryPath, b: CountryPath): number => a.name.localeCompare(b.name),
    );

const countryGroups = sortedContinents
    .filter((continent: string): boolean => countriesByContinent.has(continent))
    .map((continent: string): string => {
        const countries = getSortedCountries(continent)
            .map(
                (country: CountryPath): string =>
                    `<path class="country ${country.className}" data-name="${escapeXml(
                        country.name,
                    )}" data-code="${escapeXml(country.abbrev)}" d="${country.d}"/>`,
            )
            .join("\n      ");

        return `<g id="${continent.toLowerCase().replace(/[^a-z]+/g, "-")}" data-continent="${escapeXml(
            continent,
        )}">
      ${countries}
    </g>`;
    })
    .join("\n\n    ");

const outlineGroups = sortedContinents
    .filter((continent: string): boolean => countriesByContinent.has(continent))
    .map((continent: string): string => {
        const outlines = getSortedCountries(continent)
            .map((country: CountryPath): string => `<path class="outline" d="${country.d}"/>`)
            .join("\n      ");

        return `<g id="outline-${continent.toLowerCase().replace(/[^a-z]+/g, "-")}">
      ${outlines}
    </g>`;
    })
    .join("\n\n    ");

const labels = continentLabels
    .map(([name, lon, lat]: readonly [string, number, number]): string => {
        const [x, y] = project([lon, lat]);

        return `<text x="${x}" y="${y}" class="continent-label" text-anchor="middle">${escapeXml(name)}</text>`;
    })
    .join("\n    ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">Simplified SVG world map with country borders</title>
  <desc id="desc">A low-detail world map drawn from Natural Earth 1:110m country polygons. Countries are grouped and colored by continent, with simplified coastlines and national borders.</desc>
  <defs>
    <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8f4f8"/>
      <stop offset="1" stop-color="#d8edf3"/>
    </linearGradient>
    <filter id="landShadow" x="-4%" y="-4%" width="108%" height="112%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#27424f" flood-opacity="0.12"/>
    </filter>
    <style>
      :root {
        color-scheme: light;
      }
      .ocean {
        fill: url(#ocean);
      }
      .frame {
        fill: none;
        stroke: #9ec7d2;
        stroke-width: 1.2;
        opacity: 0.5;
      }
      .graticule path {
        fill: none;
        stroke: #8ebbc8;
        stroke-width: 0.8;
        opacity: 0.42;
      }
      .countries {
        filter: url(#landShadow);
      }
      .country {
        stroke: #fffdf4;
        stroke-width: 0.82;
        stroke-linejoin: round;
        stroke-linecap: round;
        vector-effect: non-scaling-stroke;
      }
      .country:hover {
        fill: #f1c75b;
        stroke: #6c5a2f;
        stroke-width: 1.4;
      }
      .north-america { fill: #cfa06d; }
      .south-america { fill: #d5bd68; }
      .europe { fill: #88b8a6; }
      .africa { fill: #d99b6f; }
      .asia { fill: #b7ad78; }
      .oceania { fill: #90b2cf; }
      .antarctica { fill: #cfd9dd; }
      .other { fill: #b9c4bf; }
      .outline {
        fill: none;
        stroke: #596b63;
        stroke-width: 0.9;
        stroke-linejoin: round;
        stroke-linecap: round;
        opacity: 0.72;
        vector-effect: non-scaling-stroke;
      }
      .continent-label {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0;
        fill: #475954;
        opacity: 0.76;
        paint-order: stroke;
        stroke: rgba(255,255,255,0.75);
        stroke-width: 4px;
        stroke-linejoin: round;
      }
      .caption {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0;
        fill: #536a68;
        opacity: 0.72;
      }
    </style>
  </defs>

  <rect class="ocean" width="${WIDTH}" height="${HEIGHT}" rx="26"/>
  <rect class="frame" x="22" y="22" width="${WIDTH - 44}" height="${HEIGHT - 44}" rx="20"/>

  <g class="graticule" aria-hidden="true">
      ${graticule()}
  </g>

  <g class="countries">
    ${countryGroups}
  </g>

  <g class="outlines" aria-hidden="true">
    ${outlineGroups}
  </g>

  <g class="labels" aria-hidden="true">
    ${labels}
    <text x="${WIDTH / 2}" y="33" class="caption" text-anchor="middle">Natural Earth 1:110m simplified countries, grouped by continent</text>
  </g>
</svg>
`;

writeFileSync(OUTPUT_PATH, svg);
console.log(`Wrote ${OUTPUT_PATH} with ${geojson.features.length} country features.`);
