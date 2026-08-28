import {
    mkdir,
    readdir,
    readFile,
    stat,
    writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** AC3D 模型的文件扩展名；目录中的 XML、贴图和 Blender 源文件不会被当作输入。 */
const AC3D_EXTENSION = ".ac";
/** glTF 二进制文件的固定 magic。 */
const GLB_MAGIC = 0x46546c67;
/** glTF 2.0 的版本号。 */
const GLTF_VERSION = 2;
/** glTF bufferView 的 ARRAY_BUFFER target。 */
const ARRAY_BUFFER_TARGET = 34962;
/** glTF bufferView 的 ELEMENT_ARRAY_BUFFER target。 */
const ELEMENT_ARRAY_BUFFER_TARGET = 34963;
/** glTF primitive mode：三角形、线段和点。 */
const PRIMITIVE_MODE = Object.freeze({
    POINTS: 0,
    LINES: 1,
    TRIANGLES: 4,
});
/** 默认源模型目录。 */
const DEFAULT_SOURCE_DIRECTORY = ["787-family", "Models"];
/** 默认 GLB 输出目录。 */
const DEFAULT_OUTPUT_DIRECTORY = "787Family_glb";

/** 由当前脚本路径推导项目根目录，避免依赖调用脚本时的工作目录。 */
const getProjectRoot = () => {
    const scriptPath = fileURLToPath(import.meta.url);

    return dirname(dirname(scriptPath));
};

/** 解析命令行参数，让大目录可以先 dry-run 或只转换一个模型。 */
const parseArguments = (argumentsList) => {
    const options = {
        dryRun: false,
        includeTextures: true,
        only: undefined,
        outputDirectory: undefined,
        sourceDirectory: undefined,
    };

    for (let index = 0; index < argumentsList.length; index += 1) {
        const argument = argumentsList[index];

        if (argument === "--dry-run") {
            options.dryRun = true;
            continue;
        }

        if (argument === "--no-textures") {
            options.includeTextures = false;
            continue;
        }

        if (argument === "--source" || argument === "--output" || argument === "--only") {
            const value = argumentsList[index + 1];

            if (!value || value.startsWith("--")) {
                throw new Error(`${argument} 需要一个路径参数。`);
            }

            if (argument === "--source") {
                options.sourceDirectory = value;
            } else if (argument === "--output") {
                options.outputDirectory = value;
            } else {
                options.only = value;
            }

            index += 1;
            continue;
        }

        throw new Error(`未知参数：${argument}`);
    }

    return options;
};

/** 将 AC3D 的带引号字符串解码为普通 JavaScript 字符串。 */
const parseQuotedString = (value) => {
    const match = value.match(/^"((?:\\.|[^"\\])*)"/);

    if (!match || match[1] === undefined) {
        return value.trim();
    }

    try {
        return JSON.parse(`"${match[1]}"`);
    } catch {
        return match[1];
    }
};

/** 从一行 AC3D 文本中读取浮点数，遇到非法坐标时保留可定位的错误。 */
const parseNumberList = (line, expectedLength, context) => {
    const values = line
        .trim()
        .split(/\s+/u)
        .map((value) => Number(value));

    if (values.length < expectedLength || values.slice(0, expectedLength).some((value) => !Number.isFinite(value))) {
        throw new Error(`${context} 包含无效数字：${line}`);
    }

    return values.slice(0, expectedLength);
};

/** 读取 AC3D MATERIAL 行，映射为 glTF PBR 可以表达的基础参数。 */
const parseMaterial = (line) => {
    const nameMatch = line.match(/^MATERIAL\s+"((?:\\.|[^"\\])*)"/u);
    const readTriple = (key, fallback) => {
        const match = line.match(new RegExp(`\\b${key}\\s+([-+0-9.eE]+)\\s+([-+0-9.eE]+)\\s+([-+0-9.eE]+)`, "u"));

        return match
            ? match.slice(1, 4).map((value) => Number(value))
            : fallback;
    };
    const readSingle = (key, fallback) => {
        const match = line.match(new RegExp(`\\b${key}\\s+([-+0-9.eE]+)`, "u"));

        return match ? Number(match[1]) : fallback;
    };

    return {
        name: nameMatch ? parseQuotedString(`"${nameMatch[1]}"`) : "Material",
        color: readTriple("rgb", [1, 1, 1]),
        emission: readTriple("emis", [0, 0, 0]),
        shininess: readSingle("shi", 0),
        specular: readTriple("spec", [0, 0, 0]),
        transparency: readSingle("trans", 0),
    };
};

/** 解析一个 AC3D OBJECT 及其递归子对象。 */
const parseObject = (lines, cursor, materials) => {
    const objectLine = lines[cursor.index]?.trim();

    if (!objectLine?.startsWith("OBJECT ")) {
        throw new Error(`第 ${cursor.index + 1} 行不是 OBJECT：${objectLine ?? "文件结尾"}`);
    }

    const object = {
        children: [],
        data: undefined,
        location: [0, 0, 0],
        materials,
        name: "Object",
        rotation: undefined,
        surfaces: [],
        texture: undefined,
        textureOffset: [0, 0],
        textureRepeat: [1, 1],
        type: objectLine.slice("OBJECT ".length).trim(),
        vertices: [],
    };

    cursor.index += 1;

    while (cursor.index < lines.length) {
        const line = lines[cursor.index]?.trim() ?? "";

        if (!line) {
            cursor.index += 1;
            continue;
        }

        if (line.startsWith("OBJECT ")) {
            throw new Error(`对象 ${object.name} 缺少 kids 声明。`);
        }

        if (line.startsWith("name ")) {
            object.name = parseQuotedString(line.slice(5));
            cursor.index += 1;
            continue;
        }

        if (line.startsWith("data ")) {
            const length = Number.parseInt(line.slice(5), 10);
            cursor.index += 1;
            let remaining = Number.isFinite(length) ? length : 0;

            while (remaining > 0 && cursor.index < lines.length) {
                remaining -= (lines[cursor.index]?.length ?? 0) + 1;
                cursor.index += 1;
            }

            object.data = lines[cursor.index - 1]?.trim();
            continue;
        }

        if (line.startsWith("texture ")) {
            object.texture = parseQuotedString(line.slice(8));
            cursor.index += 1;
            continue;
        }

        if (line.startsWith("texrep ")) {
            object.textureRepeat = parseNumberList(line.slice(7), 2, `对象 ${object.name} 的 texrep`);
            cursor.index += 1;
            continue;
        }

        if (line.startsWith("texoff ")) {
            object.textureOffset = parseNumberList(line.slice(7), 2, `对象 ${object.name} 的 texoff`);
            cursor.index += 1;
            continue;
        }

        if (line.startsWith("loc ")) {
            object.location = parseNumberList(line.slice(4), 3, `对象 ${object.name} 的 loc`);
            cursor.index += 1;
            continue;
        }

        if (line.startsWith("rot ")) {
            object.rotation = parseNumberList(line.slice(4), 9, `对象 ${object.name} 的 rot`);
            cursor.index += 1;
            continue;
        }

        if (line.startsWith("numvert ")) {
            const vertexCount = Number.parseInt(line.slice(8), 10);

            if (!Number.isInteger(vertexCount) || vertexCount < 0) {
                throw new Error(`对象 ${object.name} 的 numvert 无效：${line}`);
            }

            cursor.index += 1;

            for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
                object.vertices.push(
                    parseNumberList(
                        lines[cursor.index] ?? "",
                        3,
                        `对象 ${object.name} 的顶点 ${vertexIndex + 1}`,
                    ),
                );
                cursor.index += 1;
            }

            continue;
        }

        if (line.startsWith("numsurf ")) {
            const surfaceCount = Number.parseInt(line.slice(8), 10);

            if (!Number.isInteger(surfaceCount) || surfaceCount < 0) {
                throw new Error(`对象 ${object.name} 的 numsurf 无效：${line}`);
            }

            cursor.index += 1;

            for (let surfaceIndex = 0; surfaceIndex < surfaceCount; surfaceIndex += 1) {
                const surfaceLine = lines[cursor.index]?.trim() ?? "";

                if (!surfaceLine.startsWith("SURF ")) {
                    throw new Error(`对象 ${object.name} 的曲面 ${surfaceIndex + 1} 缺少 SURF。`);
                }

                const flags = Number.parseInt(surfaceLine.slice(5), 16);
                cursor.index += 1;

                const materialLine = lines[cursor.index]?.trim() ?? "";

                if (!materialLine.startsWith("mat ")) {
                    throw new Error(`对象 ${object.name} 的曲面 ${surfaceIndex + 1} 缺少 mat。`);
                }

                const materialIndex = Number.parseInt(materialLine.slice(4), 10);
                cursor.index += 1;

                const refsLine = lines[cursor.index]?.trim() ?? "";

                if (!refsLine.startsWith("refs ")) {
                    throw new Error(`对象 ${object.name} 的曲面 ${surfaceIndex + 1} 缺少 refs。`);
                }

                const refCount = Number.parseInt(refsLine.slice(5), 10);
                cursor.index += 1;
                const refs = [];

                for (let refIndex = 0; refIndex < refCount; refIndex += 1) {
                    refs.push(
                        parseNumberList(
                            lines[cursor.index] ?? "",
                            3,
                            `对象 ${object.name} 的曲面 ${surfaceIndex + 1} 引用 ${refIndex + 1}`,
                        ),
                    );
                    cursor.index += 1;
                }

                object.surfaces.push({
                    flags: Number.isFinite(flags) ? flags : 0,
                    materialIndex: Number.isInteger(materialIndex) ? materialIndex : 0,
                    refs,
                });
            }

            continue;
        }

        if (line.startsWith("kids ")) {
            const childCount = Number.parseInt(line.slice(5), 10);

            if (!Number.isInteger(childCount) || childCount < 0) {
                throw new Error(`对象 ${object.name} 的 kids 无效：${line}`);
            }

            cursor.index += 1;

            for (let childIndex = 0; childIndex < childCount; childIndex += 1) {
                object.children.push(parseObject(lines, cursor, materials));
            }

            return object;
        }

        cursor.index += 1;
    }

    return object;
};

/** 解析 AC3D 文件头、全局材质和根对象。 */
const parseAc3d = (source, sourcePath) => {
    const lines = source.replace(/\r\n?/gu, "\n").split("\n");
    let lineIndex = 0;

    while (lineIndex < lines.length && !lines[lineIndex]?.trim()) {
        lineIndex += 1;
    }

    if (lines[lineIndex]?.trim() !== "AC3Db") {
        throw new Error(`不是 AC3D binary 文本模型：${sourcePath}`);
    }

    lineIndex += 1;
    const materials = [];

    while (lineIndex < lines.length && lines[lineIndex]?.trim().startsWith("MATERIAL ")) {
        materials.push(parseMaterial(lines[lineIndex].trim()));
        lineIndex += 1;
    }

    while (lineIndex < lines.length && !lines[lineIndex]?.trim()) {
        lineIndex += 1;
    }

    const cursor = { index: lineIndex };
    const root = parseObject(lines, cursor, materials);

    return { materials, root };
};

/** 计算一个模型对象引用的贴图绝对路径；优先采用对象所在目录的贴图。 */
const resolveTexturePath = async (textureName, objectDirectory, sourceDirectory) => {
    if (!textureName) {
        return undefined;
    }

    const candidates = [
        resolve(objectDirectory, textureName),
        resolve(sourceDirectory, textureName),
    ];

    for (const candidate of candidates) {
        try {
            const fileStats = await stat(candidate);

            if (fileStats.isFile()) {
                return candidate;
            }
        } catch {
            // 继续尝试 AC3D 常见的另一个贴图相对路径。
        }
    }

    return undefined;
};

/** 根据扩展名推断 glTF image 的 MIME 类型，未知格式不会伪装成可加载图片。 */
const getImageMimeType = (filePath) => {
    const extension = extname(filePath).toLowerCase();
    const mimeTypes = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    };

    return mimeTypes[extension];
};

/** 将 AC3D 的局部旋转和平移转换为 glTF 使用的列主序节点矩阵。 */
const getNodeMatrix = (object) => {
    const rotation = object.rotation;
    const location = object.location;

    if (!rotation && location.every((value) => value === 0)) {
        return undefined;
    }

    const matrix = rotation ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];

    return [
        matrix[0], matrix[3], matrix[6], 0,
        matrix[1], matrix[4], matrix[7], 0,
        matrix[2], matrix[5], matrix[8], 0,
        location[0], location[1], location[2], 1,
    ];
};

/** 将数字限制在 glTF 材质参数允许的范围内。 */
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

/** 创建一个按 4 字节对齐的二进制 glTF 文档构建器。 */
const createGlbBuilder = () => {
    const binaryParts = [];
    let binaryLength = 0;
    const gltf = {
        asset: {
            generator: "convert-787-models.mjs",
            version: "2.0",
        },
        buffers: [{ byteLength: 0 }],
        bufferViews: [],
        accessors: [],
        images: [],
        materials: [],
        meshes: [],
        nodes: [],
        samplers: [],
        scene: 0,
        scenes: [{ nodes: [] }],
        textures: [],
    };

    /** 向 BIN chunk 追加数据并返回对应 bufferView。 */
    const addBinary = (data, target) => {
        const padding = (4 - (binaryLength % 4)) % 4;

        if (padding > 0) {
            binaryParts.push(Buffer.alloc(padding));
            binaryLength += padding;
        }

        const bufferViewIndex = gltf.bufferViews.length;
        binaryParts.push(data);
        binaryLength += data.length;
        gltf.bufferViews.push({
            buffer: 0,
            byteLength: data.length,
            byteOffset: binaryLength - data.length,
            ...(target ? { target } : {}),
        });

        return bufferViewIndex;
    };

    /** 为属性二进制数据建立 accessor，并写入可选的包围盒元数据。 */
    const addAccessor = (data, componentType, type, count, target, min, max) => {
        const bufferView = addBinary(data, target);
        const accessor = {
            bufferView,
            componentType,
            count,
            type,
        };

        if (min && max) {
            accessor.min = min;
            accessor.max = max;
        }

        const accessorIndex = gltf.accessors.length;
        gltf.accessors.push(accessor);

        return accessorIndex;
    };

    /** 将一个内嵌图片注册为 glTF image/texture，并按路径避免同一模型重复写入。 */
    const addImage = async (filePath, imageCache) => {
        const cached = imageCache.get(filePath);

        if (cached !== undefined) {
            return cached;
        }

        const mimeType = getImageMimeType(filePath);

        if (!mimeType) {
            return undefined;
        }

        const imageData = await readFile(filePath);
        const imageIndex = gltf.images.length;
        const bufferView = addBinary(imageData);

        gltf.images.push({
            bufferView,
            mimeType,
            name: basename(filePath),
        });
        gltf.samplers.push({
            magFilter: 9729,
            minFilter: 9987,
            wrapS: 10497,
            wrapT: 10497,
        });
        gltf.textures.push({
            sampler: gltf.samplers.length - 1,
            source: imageIndex,
        });

        const textureIndex = gltf.textures.length - 1;
        imageCache.set(filePath, textureIndex);

        return textureIndex;
    };

    /** 完成 JSON/BIN 两个 chunk 的对齐和 GLB 文件头写入。 */
    const toGlb = () => {
        const binary = Buffer.concat(binaryParts);

        gltf.buffers[0].byteLength = binary.length;
        const json = Buffer.from(JSON.stringify(gltf), "utf8");
        const jsonPadding = (4 - (json.length % 4)) % 4;
        const paddedJson = Buffer.concat([json, Buffer.alloc(jsonPadding, 0x20)]);
        const binaryPadding = (4 - (binary.length % 4)) % 4;
        const paddedBinary = binaryPadding > 0
            ? Buffer.concat([binary, Buffer.alloc(binaryPadding)])
            : binary;
        const jsonChunkHeader = Buffer.alloc(8);
        const binaryChunkHeader = Buffer.alloc(8);
        const totalLength = 12 + jsonChunkHeader.length + paddedJson.length + binaryChunkHeader.length + paddedBinary.length;
        const header = Buffer.alloc(12);

        header.writeUInt32LE(GLB_MAGIC, 0);
        header.writeUInt32LE(GLTF_VERSION, 4);
        header.writeUInt32LE(totalLength, 8);
        jsonChunkHeader.writeUInt32LE(paddedJson.length, 0);
        jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);
        binaryChunkHeader.writeUInt32LE(paddedBinary.length, 0);
        binaryChunkHeader.writeUInt32LE(0x004e4942, 4);

        return Buffer.concat([
            header,
            jsonChunkHeader,
            paddedJson,
            binaryChunkHeader,
            paddedBinary,
        ]);
    };

    return { addAccessor, addImage, gltf, toGlb };
};

/** 生成对象曲面的可渲染 primitive，按材质和曲线标志拆分索引。 */
const buildObjectPrimitives = async (object, builder, options) => {
    const objectDirectory = options.objectDirectory;
    const imageCache = options.imageCache;
    const texturePath = options.includeTextures
        ? await resolveTexturePath(object.texture, objectDirectory, options.sourceDirectory)
        : undefined;

    if (object.texture && options.includeTextures && !texturePath) {
        const warningKey = `missing:${object.texture}`;

        if (!options.warningCache.has(warningKey)) {
            options.warningCache.add(warningKey);
            console.warn(`[贴图] ${relative(getProjectRoot(), options.sourcePath)} 缺少 ${object.texture}，将使用材质颜色。`);
        }
    }

    if (texturePath && !getImageMimeType(texturePath)) {
        const warningKey = `unsupported:${texturePath}`;

        if (!options.warningCache.has(warningKey)) {
            options.warningCache.add(warningKey);
            console.warn(`[贴图] ${relative(getProjectRoot(), options.sourcePath)} 不支持 ${object.texture} 的格式，将使用材质颜色。`);
        }
    }

    const textureIndex = texturePath ? await builder.addImage(texturePath, imageCache) : undefined;
    const groups = new Map();

    for (const surface of object.surfaces) {
        const mode = surface.refs.length >= 3
            ? PRIMITIVE_MODE.TRIANGLES
            : surface.refs.length === 2
                ? PRIMITIVE_MODE.LINES
                : PRIMITIVE_MODE.POINTS;
        const twoSided = (surface.flags & 0x2) !== 0 || (surface.flags & 0x20) !== 0;
        const key = `${surface.materialIndex}|${mode}|${twoSided}`;
        const group = groups.get(key) ?? {
            flags: surface.flags,
            materialIndex: surface.materialIndex,
            mode,
            refs: [],
            twoSided,
        };

        group.refs.push(surface.refs);
        groups.set(key, group);
    }

    const primitives = [];

    for (const group of groups.values()) {
        const positions = [];
        const normals = [];
        const texcoords = [];
        const indices = [];
        const normalSums = [];
        const vertexMap = new Map();
        const material = object.materials[group.materialIndex] ?? {
            color: [1, 1, 1],
            emission: [0, 0, 0],
            name: "Material",
            shininess: 0,
            specular: [0, 0, 0],
            transparency: 0,
        };
        const materialKey = `${group.materialIndex}|${textureIndex ?? "none"}|${group.twoSided}`;
        let materialIndex = options.materialCache.get(materialKey);

        if (materialIndex === undefined) {
            const alpha = clamp(1 - material.transparency, 0, 1);
            const roughness = clamp(1 - material.shininess / 128, 0.05, 1);
            const materialDefinition = {
                alphaMode: alpha < 0.999 ? "BLEND" : "OPAQUE",
                baseColorFactor: [
                    clamp(material.color[0] ?? 1, 0, 1),
                    clamp(material.color[1] ?? 1, 0, 1),
                    clamp(material.color[2] ?? 1, 0, 1),
                    alpha,
                ],
                doubleSided: group.twoSided,
                name: material.name,
                metallicFactor: 0,
                roughnessFactor: roughness,
            };

            if (textureIndex !== undefined) {
                materialDefinition.pbrMetallicRoughness = {
                    baseColorTexture: { index: textureIndex },
                    baseColorFactor: materialDefinition.baseColorFactor,
                    metallicFactor: 0,
                    roughnessFactor: roughness,
                };
                delete materialDefinition.baseColorFactor;
                delete materialDefinition.metallicFactor;
                delete materialDefinition.roughnessFactor;
            } else {
                materialDefinition.pbrMetallicRoughness = {
                    baseColorFactor: materialDefinition.baseColorFactor,
                    metallicFactor: 0,
                    roughnessFactor: roughness,
                };
                delete materialDefinition.baseColorFactor;
                delete materialDefinition.metallicFactor;
                delete materialDefinition.roughnessFactor;
            }

            const emission = material.emission.map((value) => clamp(value, 0, 1));

            if (emission.some((value) => value > 0)) {
                materialDefinition.emissiveFactor = emission;
            }

            materialIndex = builder.gltf.materials.length;
            builder.gltf.materials.push(materialDefinition);
            options.materialCache.set(materialKey, materialIndex);
        }

        /** 为同一 primitive 去重顶点，同时保留每个面的独立 UV。 */
        const getVertexIndex = (reference) => {
            const [sourceIndex, u, v] = reference;
            const sourceVertex = object.vertices[sourceIndex];

            if (!sourceVertex) {
                throw new Error(`对象 ${object.name} 引用了不存在的顶点 ${sourceIndex}。`);
            }

            const key = `${sourceIndex}|${u}|${v}`;
            const existingIndex = vertexMap.get(key);

            if (existingIndex !== undefined) {
                return existingIndex;
            }

            const vertexIndex = positions.length / 3;
            const [repeatU, repeatV] = object.textureRepeat;
            const [offsetU, offsetV] = object.textureOffset;

            positions.push(sourceVertex[0], sourceVertex[1], sourceVertex[2]);
            normalSums.push([0, 0, 0]);

            if (textureIndex !== undefined) {
                texcoords.push(u * repeatU + offsetU, v * repeatV + offsetV);
            }

            vertexMap.set(key, vertexIndex);

            return vertexIndex;
        };

        /** 为三角形面累加面积加权法线，避免输出没有法线的退化网格。 */
        const addTriangle = (first, second, third) => {
            const firstIndex = getVertexIndex(first);
            const secondIndex = getVertexIndex(second);
            const thirdIndex = getVertexIndex(third);
            const firstPosition = object.vertices[first[0]];
            const secondPosition = object.vertices[second[0]];
            const thirdPosition = object.vertices[third[0]];
            const edgeA = [
                secondPosition[0] - firstPosition[0],
                secondPosition[1] - firstPosition[1],
                secondPosition[2] - firstPosition[2],
            ];
            const edgeB = [
                thirdPosition[0] - firstPosition[0],
                thirdPosition[1] - firstPosition[1],
                thirdPosition[2] - firstPosition[2],
            ];
            const normal = [
                edgeA[1] * edgeB[2] - edgeA[2] * edgeB[1],
                edgeA[2] * edgeB[0] - edgeA[0] * edgeB[2],
                edgeA[0] * edgeB[1] - edgeA[1] * edgeB[0],
            ];

            for (const index of [firstIndex, secondIndex, thirdIndex]) {
                normalSums[index][0] += normal[0];
                normalSums[index][1] += normal[1];
                normalSums[index][2] += normal[2];
            }

            indices.push(firstIndex, secondIndex, thirdIndex);
        };

        for (const refs of group.refs) {
            if (group.mode === PRIMITIVE_MODE.TRIANGLES) {
                for (let refIndex = 1; refIndex < refs.length - 1; refIndex += 1) {
                    addTriangle(refs[0], refs[refIndex], refs[refIndex + 1]);
                }
            } else {
                const refIndices = refs.map((reference) => getVertexIndex(reference));

                if (group.mode === PRIMITIVE_MODE.LINES) {
                    for (let refIndex = 1; refIndex < refIndices.length; refIndex += 1) {
                        indices.push(refIndices[refIndex - 1], refIndices[refIndex]);
                    }
                } else {
                    indices.push(...refIndices);
                }
            }
        }

        for (const normalSum of normalSums) {
            const length = Math.hypot(normalSum[0], normalSum[1], normalSum[2]);

            if (length === 0) {
                normals.push(0, 1, 0);
            } else {
                normals.push(normalSum[0] / length, normalSum[1] / length, normalSum[2] / length);
            }
        }

        if (indices.length === 0) {
            continue;
        }

        const positionData = Buffer.from(new Float32Array(positions).buffer);
        const normalData = Buffer.from(new Float32Array(normals).buffer);
        const positionMin = [Infinity, Infinity, Infinity];
        const positionMax = [-Infinity, -Infinity, -Infinity];

        for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 3) {
            for (let axis = 0; axis < 3; axis += 1) {
                positionMin[axis] = Math.min(positionMin[axis], positions[positionIndex + axis]);
                positionMax[axis] = Math.max(positionMax[axis], positions[positionIndex + axis]);
            }
        }

        const indexData = indices.some((index) => index > 65535)
            ? Buffer.from(new Uint32Array(indices).buffer)
            : Buffer.from(new Uint16Array(indices).buffer);
        const indexComponentType = indices.some((index) => index > 65535) ? 5125 : 5123;
        const attributes = {
            NORMAL: builder.addAccessor(normalData, 5126, "VEC3", normals.length / 3, ARRAY_BUFFER_TARGET),
            POSITION: builder.addAccessor(positionData, 5126, "VEC3", positions.length / 3, ARRAY_BUFFER_TARGET, positionMin, positionMax),
        };

        if (textureIndex !== undefined) {
            attributes.TEXCOORD_0 = builder.addAccessor(
                Buffer.from(new Float32Array(texcoords).buffer),
                5126,
                "VEC2",
                texcoords.length / 2,
                ARRAY_BUFFER_TARGET,
            );
        }

        primitives.push({
            attributes,
            indices: builder.addAccessor(indexData, indexComponentType, "SCALAR", indices.length, ELEMENT_ARRAY_BUFFER_TARGET),
            material: materialIndex,
            mode: group.mode,
        });
    }

    return primitives;
};

/** 递归把 AC3D 对象树写入 glTF nodes，并为有曲面的对象创建 mesh。 */
const addObjectTree = async (object, builder, options) => {
    const nodeIndex = builder.gltf.nodes.length;
    const node = { name: object.name };

    builder.gltf.nodes.push(node);

    const primitives = await buildObjectPrimitives(object, builder, options);

    if (primitives.length > 0) {
        node.mesh = builder.gltf.meshes.length;
        builder.gltf.meshes.push({
            name: object.name,
            primitives,
        });
    }

    const matrix = getNodeMatrix(object);

    if (matrix) {
        node.matrix = matrix;
    }

    if (object.children.length > 0) {
        node.children = [];

        for (const child of object.children) {
            node.children.push(await addObjectTree(child, builder, options));
        }
    }

    return nodeIndex;
};

/** 转换一个 AC3D 文件并返回 GLB Buffer 与统计信息。 */
const convertAc3dFile = async (sourcePath, sourceDirectory, includeTextures) => {
    const source = await readFile(sourcePath, "utf8");
    const { root } = parseAc3d(source, sourcePath);
    const builder = createGlbBuilder();
    const nodeIndex = await addObjectTree(root, builder, {
        imageCache: new Map(),
        includeTextures,
        materialCache: new Map(),
        objectDirectory: dirname(sourcePath),
        sourcePath,
        sourceDirectory,
        warningCache: new Set(),
    });

    builder.gltf.scenes[0].nodes.push(nodeIndex);

    return {
        buffer: builder.toGlb(),
        meshCount: builder.gltf.meshes.length,
        textureCount: builder.gltf.textures.length,
    };
};

/** 递归查找所有 AC3D 扩展名文件，结果排序以确保日志和输出可复现。 */
const findAc3dFiles = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await findAc3dFiles(entryPath)));
        } else if (entry.isFile() && extname(entry.name).toLowerCase() === AC3D_EXTENSION) {
            files.push(entryPath);
        }
    }

    return files.sort((first, second) => first.localeCompare(second));
};

/** 将 --only 的相对路径解析为源目录中的单个模型文件。 */
const resolveOnlyFile = async (only, sourceDirectory) => {
    const candidate = isAbsolute(only) ? only : resolve(sourceDirectory, only);
    const fileStats = await stat(candidate);

    if (!fileStats.isFile()) {
        throw new Error(`--only 目标不是文件：${candidate}`);
    }

    return candidate;
};

/** 批量转换模型，单个文件失败时继续处理剩余文件并在末尾返回非零退出码。 */
const convertModels = async (options) => {
    const projectRoot = getProjectRoot();
    const sourceDirectory = resolve(
        projectRoot,
        options.sourceDirectory ?? join(...DEFAULT_SOURCE_DIRECTORY),
    );
    const outputDirectory = resolve(
        projectRoot,
        options.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY,
    );
    const sourceFiles = options.only
        ? [await resolveOnlyFile(options.only, sourceDirectory)]
        : await findAc3dFiles(sourceDirectory);
    const failures = [];
    let convertedCount = 0;
    let skippedCount = 0;

    if (sourceFiles.length === 0) {
        throw new Error(`源目录中没有 ${AC3D_EXTENSION} 文件：${sourceDirectory}`);
    }

    if (!options.dryRun) {
        await mkdir(outputDirectory, { recursive: true });
    }

    for (let index = 0; index < sourceFiles.length; index += 1) {
        const sourcePath = sourceFiles[index];
        const displayPath = relative(projectRoot, sourcePath);

        try {
            const sourceHeader = (await readFile(sourcePath, "utf8")).split(/\r?\n/u).find((line) => line.trim());

            if (sourceHeader?.trim() !== "AC3Db") {
                skippedCount += 1;
                console.warn(`[${index + 1}/${sourceFiles.length}] 跳过非 AC3D 文件 ${displayPath}`);
                continue;
            }

            if (options.dryRun) {
                convertedCount += 1;
                console.log(`[${index + 1}/${sourceFiles.length}] 将转换 ${displayPath}`);
                continue;
            }

            const result = await convertAc3dFile(sourcePath, sourceDirectory, options.includeTextures);
            const relativePath = relative(sourceDirectory, sourcePath);
            const outputPath = join(outputDirectory, relativePath.replace(/\.ac$/iu, ".glb"));

            await mkdir(dirname(outputPath), { recursive: true });
            await writeFile(outputPath, result.buffer);
            convertedCount += 1;
            console.log(
                `[${index + 1}/${sourceFiles.length}] 已转换 ${displayPath} -> ${relative(projectRoot, outputPath)} ` +
                `(${result.meshCount} meshes, ${result.textureCount} textures)`,
            );
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);

            failures.push(`${displayPath}: ${reason}`);
            console.error(`[${index + 1}/${sourceFiles.length}] 失败 ${displayPath}: ${reason}`);
        }
    }

    console.log(
        `${options.dryRun ? "扫描" : "转换"}完成：${convertedCount} 个，跳过 ${skippedCount} 个，失败 ${failures.length} 个。` +
        (options.dryRun ? " 使用不带 --dry-run 的命令写入 GLB。" : ` 输出目录：${outputDirectory}`),
    );

    if (failures.length > 0) {
        throw new Error(`以下模型处理失败：\n${failures.join("\n")}`);
    }
};

try {
    await convertModels(parseArguments(process.argv.slice(2)));
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
