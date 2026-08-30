import { createRequire } from "node:module";
import {
    access,
    mkdtemp,
    mkdir,
    readFile,
    readdir,
    rm,
    writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";

const require = createRequire(import.meta.url);

/** OBJ、MTL 以及常见图片资源的文件扩展名。 */
const EXTENSIONS = Object.freeze({
    IMAGE: new Set([".jpg", ".jpeg", ".png"]),
    OBJ: ".obj",
});
/** GLB 文件头中的 magic 和版本，用于防止把错误结果写入产物。 */
const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
/** 生成材料时用于识别各类纹理的文件名关键词。 */
const TEXTURE_PATTERNS = Object.freeze({
    DIFFUSE: /(albedo|base.?color|colou?r|coloe|diffuse|map.?kd|texture)/iu,
    NORMAL: /(normal|norm|bump)/iu,
    OCCLUSION: /(ambient|ao|occlusion)/iu,
    ROUGHNESS: /(roughness|metallic|specular|(?:^|[_-])r(?:[_-]|\.|$))/iu,
});
/** 可选参数默认值。输出文件默认使用输入目录名称。 */
const DEFAULT_OPTIONS = Object.freeze({
    flipForward: "AUTO",
    inputUpAxis: "AUTO",
    output: undefined,
    outputUpAxis: "Y",
});
/** obj2gltf 支持的三种输入/输出上方向，以及自动检测输入轴的特殊值。 */
const UP_AXES = new Set(["AUTO", "X", "Y", "Z"]);
/** 自动识别需要与视窗约定翻转前后方向的资源目录名称。 */
const FORWARD_FLIP_DIRECTORY_PATTERN = /(?:^|[-_ ])(?:an)?225(?:$|[-_ ])/iu;
/** 绕输出 Y 轴旋转 180 度，将机头前后方向翻转但保持上下方向不变。 */
const FORWARD_FLIP_MATRIX = Object.freeze([
    -1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, -1, 0,
    0, 0, 0, 1,
]);
/** An-225 OBJ 的 X 轴为机身长度、Z 轴为翼展且 Y 轴向下；按列主序映射 x'=z、y'=-y、z'=-x。 */
const AN225_AXIS_ALIGNMENT_MATRIX = Object.freeze([
    0, 0, -1, 0,
    0, -1, 0, 0,
    1, 0, 0, 0,
    0, 0, 0, 1,
]);

/** 将依赖加载失败转换为包含安装命令的可操作错误。 */
const loadObj2Gltf = () => {
    try {
        const converter = require("obj2gltf");

        if (typeof converter !== "function") {
            throw new Error("obj2gltf 没有导出转换函数。");
        }

        return converter;
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        throw new Error(
            `无法加载 obj2gltf，请先执行 pnpm install。${reason}`,
        );
    }
};

/** 解析命令行参数；第一个位置参数是待处理目录，输出文件可选。 */
const parseArguments = (argumentsList) => {
    const options = { ...DEFAULT_OPTIONS, sourceDirectory: undefined };

    for (let index = 0; index < argumentsList.length; index += 1) {
        const argument = argumentsList[index];

        if (argument === "--help" || argument === "-h") {
            printHelp();
            process.exit(0);
        }

        if (argument === "--flip-forward") {
            options.flipForward = true;
            continue;
        }

        if (argument === "--no-flip-forward") {
            options.flipForward = false;
            continue;
        }

        if (argument === "--output" || argument === "-o" || argument === "--input-up-axis" || argument === "--output-up-axis") {
            const value = argumentsList[index + 1];

            if (!value || value.startsWith("-")) {
                throw new Error(`${argument} 需要一个参数。`);
            }

            if (argument === "--output" || argument === "-o") {
                options.output = value;
            } else {
                const axis = value.toUpperCase();

                if (!UP_AXES.has(axis)) {
                    throw new Error(`${argument} 只支持 AUTO、X、Y 或 Z。`);
                }

                if (argument === "--input-up-axis") {
                    options.inputUpAxis = axis;
                } else {
                    options.outputUpAxis = axis;
                }
            }

            index += 1;
            continue;
        }

        if (argument.startsWith("-")) {
            throw new Error(`未知参数：${argument}`);
        }

        if (options.sourceDirectory !== undefined) {
            throw new Error("只能指定一个 OBJ 资源目录。");
        }

        options.sourceDirectory = argument;
    }

    if (options.sourceDirectory === undefined) {
        printHelp();
        throw new Error("缺少 OBJ 资源目录。");
    }

    return options;
};

/** 输出命令用法，便于不熟悉脚本参数的调用者直接运行。 */
const printHelp = () => {
    console.log(`用法：node scripts/bundleGlb.js <资源目录> [选项]

选项：
  -o, --output <文件>  输出 GLB 文件名或路径（默认：<资源目录>/<目录名>.glb）
      --input-up-axis <轴>  输入 OBJ 的上方向 AUTO/X/Y/Z（默认：AUTO）
      --output-up-axis <轴> 输出 GLB 的上方向 X/Y/Z（默认：Y）
      --flip-forward       绕竖直轴旋转 180°，翻转机头前后方向
      --no-flip-forward    禁用自动前后方向翻转
  -h, --help           显示帮助

示例：
  node scripts/bundleGlb.js /path/to/Airbus_beluga_xl
  node scripts/bundleGlb.js ./assets/beluga --output beluga.glb`);
};

/** 判断路径是否存在；资源扫描中不存在的可选 MTL 会回退到自动材料。 */
const pathExists = async (path) => {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
};

/** 递归收集目录中的指定扩展名文件，并以相对路径排序保证结果稳定。 */
const collectFiles = async (directory, extensionSet) => {
    const files = [];
    const visit = async (currentDirectory) => {
        const entries = await readdir(currentDirectory, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = join(currentDirectory, entry.name);

            if (entry.isDirectory()) {
                await visit(entryPath);
                continue;
            }

            if (entry.isFile() && extensionSet.has(extname(entry.name).toLowerCase())) {
                files.push(entryPath);
            }
        }
    };

    await visit(directory);
    files.sort((first, second) => relative(directory, first).localeCompare(relative(directory, second)));

    return files;
};

/** 根据所有 OBJ 顶点的最小包围盒推断上方向；飞机模型通常高度是最小跨度。 */
const detectInputUpAxis = async (objFiles) => {
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];

    for (const objPath of objFiles) {
        const sourceText = await readFile(objPath, "utf8");

        for (const line of sourceText.split(/\r?\n/u)) {
            const trimmedLine = line.trim();

            if (!/^v\s/iu.test(trimmedLine)) {
                continue;
            }

            const values = trimmedLine.slice(1).trim().split(/\s+/u).slice(0, 3).map(Number);

            if (values.length < 3 || values.some((value) => !Number.isFinite(value))) {
                continue;
            }

            values.forEach((value, axis) => {
                minimum[axis] = Math.min(minimum[axis], value);
                maximum[axis] = Math.max(maximum[axis], value);
            });
        }
    }

    const spans = maximum.map((value, axis) => value - minimum[axis]);
    const smallestAxis = spans.indexOf(Math.min(...spans));
    const axisName = ["X", "Y", "Z"][smallestAxis];

    if (axisName === undefined || !Number.isFinite(spans[smallestAxis])) {
        throw new Error("无法根据 OBJ 顶点推断输入上方向，请使用 --input-up-axis 指定。");
    }

    console.log(`自动检测输入上方向：${axisName}（跨度 X=${spans[0].toFixed(3)}，Y=${spans[1].toFixed(3)}，Z=${spans[2].toFixed(3)}）`);

    return axisName;
};

/** 把文件名归一化后用于模糊匹配 OBJ 与贴图的共同命名片段。 */
const normalizeName = (filePath) => {
    return basename(filePath, extname(filePath))
        .toLowerCase()
        .replace(/(?:_|-)?(?:diffuse|base.?color|albedo|occlusion|ambient|ao|normal|bump|roughness|metallic|color)/giu, "")
        .replace(/[^a-z0-9]+/giu, "");
};

/** 读取 OBJ 顶点包围盒，供缺少 UV 的部件选择合理的纯色回退材质。 */
const getSourceBounds = (sourceLines) => {
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];

    for (const line of sourceLines) {
        const trimmedLine = line.trim();

        if (!/^v\s/iu.test(trimmedLine)) {
            continue;
        }

        const values = trimmedLine.slice(1).trim().split(/\s+/u).slice(0, 3).map(Number);

        if (values.length < 3 || values.some((value) => !Number.isFinite(value))) {
            continue;
        }

        values.forEach((value, axis) => {
            minimum[axis] = Math.min(minimum[axis], value);
            maximum[axis] = Math.max(maximum[axis], value);
        });
    }

    return { minimum, maximum };
};

/** 为没有 UV 的小型部件提供可读的玻璃/轮组回退色，避免静默显示纯白。 */
const getFallbackMaterialColor = (objPath, bounds) => {
    const objectName = basename(objPath).toLowerCase();
    const spans = bounds.maximum.map((value, axis) => value - bounds.minimum[axis]).sort((a, b) => a - b);

    if (/(wheel|tire|tyre|gear|landing)/iu.test(objectName) || spans[2] <= 100) {
        return [0.06, 0.07, 0.08];
    }

    if (/(glass|window|windshield|cockpit)/iu.test(objectName) || (spans[0] <= 15 && spans[2] <= 200)) {
        return [0.04, 0.14, 0.3];
    }

    return [0.82, 0.84, 0.88];
};

/** 选择与当前 OBJ 最相关的纹理；优先同名，其次按稳定顺序反向轮询。 */
const selectTexture = (objPath, candidates, textureIndex, vertexCount) => {
    if (candidates.length === 0 || vertexCount < 100) {
        return undefined;
    }

    const objectName = normalizeName(objPath);
    const namedMatch = candidates.find((candidate) => {
        const textureName = normalizeName(candidate);

        return textureName.length > 0 && (textureName.includes(objectName) || objectName.includes(textureName));
    });

    // 无 MTL 时无法从 OBJ 得知材质归属；Blender 导出的材质拆分通常与
    // model_0/model_1/... 的网格顺序相反，反向轮询可避免主网格误用次级 atlas。
    const fallbackIndex = candidates.length - 1 - (textureIndex % candidates.length);

    return namedMatch ?? candidates[fallbackIndex];
};

/** 为没有可用 MTL 的 OBJ 生成材料，并将可识别的贴图路径写入 MTL。 */
const createGeneratedMaterial = (objPath, objectIndex, textureIndex, vertexCount, imageFiles, sourceBounds, hasUvs) => {
    const diffuseCandidates = imageFiles.filter((filePath) => {
        const fileName = basename(filePath);

        return TEXTURE_PATTERNS.DIFFUSE.test(fileName) && !TEXTURE_PATTERNS.OCCLUSION.test(fileName) && !TEXTURE_PATTERNS.NORMAL.test(fileName);
    });
    const fallbackDiffuseCandidates = imageFiles.filter((filePath) => {
        const fileName = basename(filePath);

        return !TEXTURE_PATTERNS.OCCLUSION.test(fileName) && !TEXTURE_PATTERNS.NORMAL.test(fileName) && !TEXTURE_PATTERNS.ROUGHNESS.test(fileName);
    });
    const diffuseTexture = hasUvs
        ? selectTexture(objPath, diffuseCandidates.length > 0 ? diffuseCandidates : fallbackDiffuseCandidates, textureIndex, vertexCount)
        : undefined;
    const matchingName = diffuseTexture === undefined ? "" : normalizeName(diffuseTexture);
    const findRelated = (pattern) => {
        const relatedCandidates = imageFiles.filter((filePath) => pattern.test(basename(filePath)));
        const namedRelated = relatedCandidates.find((filePath) => matchingName === "" || normalizeName(filePath).includes(matchingName));

        return namedRelated ?? relatedCandidates[0];
    };
    const occlusionTexture = findRelated(TEXTURE_PATTERNS.OCCLUSION);
    const normalTexture = findRelated(TEXTURE_PATTERNS.NORMAL);
    const roughnessTexture = findRelated(TEXTURE_PATTERNS.ROUGHNESS);
    const materialName = `generated_${objectIndex}_${basename(objPath, EXTENSIONS.OBJ).replace(/[^a-z0-9_]+/giu, "_")}`;
    const materialColor = hasUvs ? [1, 1, 1] : getFallbackMaterialColor(objPath, sourceBounds);
    const lines = [`newmtl ${materialName}`, `Kd ${materialColor.join(" ")}`, "Ns 0.0"];

    if (diffuseTexture !== undefined) {
        lines.push(`map_Kd ${diffuseTexture}`);
    }

    if (occlusionTexture !== undefined) {
        lines.push(`map_Ka ${occlusionTexture}`);
    }

    if (normalTexture !== undefined) {
        lines.push(`map_Bump ${normalTexture}`);
    }

    if (roughnessTexture !== undefined) {
        lines.push(`map_Ns ${roughnessTexture}`);
    }

    return {
        materialName,
        mtlLines: lines,
    };
};

/** 将 OBJ 面索引从当前文件的局部坐标改写为合并文件的全局坐标。 */
const offsetFaceToken = (token, offsets, localCounts) => {
    const parts = token.split("/");
    const adjusted = parts.map((part, partIndex) => {
        if (part === "") {
            return "";
        }

        const value = Number.parseInt(part, 10);

        if (!Number.isInteger(value) || value === 0) {
            throw new Error(`OBJ 面索引无效：${token}`);
        }

        const localCount = localCounts[partIndex];
        const globalOffset = offsets[partIndex];
        const localIndex = value > 0 ? value : localCount + value + 1;

        if (localIndex < 1 || localIndex > localCount) {
            throw new Error(`OBJ 面索引超出范围：${token}`);
        }

        return String(globalOffset + localIndex);
    });

    return adjusted.join("/");
};

/** 合并多个 OBJ 文本并生成临时 MTL，保留顶点、UV、法线和面拓扑。 */
const buildCombinedObj = async (objFiles, imageFiles, temporaryDirectory) => {
    const combinedLines = ["# Generated by scripts/bundleGlb.js"];
    const generatedMtlLines = ["# Generated materials for OBJ files without usable MTL files"];
    const globalCounts = [0, 0, 0];
    const untexturedObjects = [];
    let generatedMaterialCount = 0;
    let texturedObjectIndex = 0;

    for (let objectIndex = 0; objectIndex < objFiles.length; objectIndex += 1) {
        const objPath = objFiles[objectIndex];
        const sourceText = await readFile(objPath, "utf8");
        const sourceLines = sourceText.split(/\r?\n/u);
        const localCounts = [0, 0, 0];
        const offsets = [...globalCounts];
        const objectName = `${basename(objPath, EXTENSIONS.OBJ)}_${objectIndex}`.replace(/[^a-z0-9_]+/giu, "_");
        const mtlReferences = [];
        const sourceVertexCount = sourceLines.filter((line) => /^v\s/iu.test(line.trim())).length;
        const sourceBounds = getSourceBounds(sourceLines);
        const sourceHasUvs = sourceLines.some((line) => /^vt\s/iu.test(line.trim()));

        for (const line of sourceLines) {
            if (!line.trim().toLowerCase().startsWith("mtllib ")) {
                continue;
            }

            const declaredMtlPath = line.slice(7).trim().replace(/^"|"$/gu, "");
            const absoluteMtlPath = resolve(dirname(objPath), declaredMtlPath);

            if (await pathExists(absoluteMtlPath)) {
                mtlReferences.push(absoluteMtlPath);
            }
        }

        const usableMtl = mtlReferences.length > 0;
        const generatedMaterial = usableMtl
            ? undefined
            : createGeneratedMaterial(objPath, objectIndex, texturedObjectIndex, sourceVertexCount, imageFiles, sourceBounds, sourceHasUvs);

        if (!sourceHasUvs) {
            untexturedObjects.push(basename(objPath));
        }

        if (sourceVertexCount >= 100) {
            texturedObjectIndex += 1;
        }

        if (usableMtl) {
            for (const mtlPath of mtlReferences) {
                combinedLines.push(`mtllib ${mtlPath.replace(/\\/gu, "/")}`);
            }
        } else if (generatedMaterial !== undefined) {
            generatedMtlLines.push(...generatedMaterial.mtlLines, "");
            generatedMaterialCount += 1;
        }

        combinedLines.push(`o ${objectName}`);

        if (generatedMaterial !== undefined) {
            combinedLines.push(`usemtl ${generatedMaterial.materialName}`);
        }

        for (const line of sourceLines) {
            const trimmedLine = line.trim();

            if (trimmedLine === "" || trimmedLine.startsWith("#") || /^mtllib\s/iu.test(trimmedLine) || /^o\s/iu.test(trimmedLine)) {
                continue;
            }

            if (/^usemtl\s/iu.test(trimmedLine)) {
                if (usableMtl) {
                    combinedLines.push(trimmedLine);
                }

                continue;
            }

            if (/^v\s/iu.test(trimmedLine)) {
                localCounts[0] += 1;
                combinedLines.push(line);
                continue;
            }

            if (/^vt\s/iu.test(trimmedLine)) {
                localCounts[1] += 1;
                combinedLines.push(line);
                continue;
            }

            if (/^vn\s/iu.test(trimmedLine)) {
                localCounts[2] += 1;
                combinedLines.push(line);
                continue;
            }

            if (/^f\s/iu.test(trimmedLine)) {
                const faceTokens = trimmedLine.slice(1).trim().split(/\s+/u);
                const adjustedTokens = faceTokens.map((token) => offsetFaceToken(token, offsets, localCounts));

                combinedLines.push(`f ${adjustedTokens.join(" ")}`);
                continue;
            }

            if (/^g\s/iu.test(trimmedLine)) {
                combinedLines.push(`g ${objectName}_${trimmedLine.slice(1).trim().replace(/[^a-z0-9_]+/giu, "_")}`);
                continue;
            }

            combinedLines.push(line);
        }

        globalCounts[0] += localCounts[0];
        globalCounts[1] += localCounts[1];
        globalCounts[2] += localCounts[2];
    }

    const combinedObjPath = join(temporaryDirectory, "combined.obj");
    const generatedMtlPath = join(temporaryDirectory, "generated-materials.mtl");

    if (generatedMaterialCount > 0) {
        await writeFile(generatedMtlPath, `${generatedMtlLines.join("\n")}\n`, "utf8");
        combinedLines.splice(1, 0, `mtllib ${generatedMtlPath}`);
    }

    await writeFile(combinedObjPath, `${combinedLines.join("\n")}\n`, "utf8");

    return { combinedObjPath, untexturedObjects };
};

/** 检查转换结果是合法的 glTF 2.0 二进制文件。 */
const assertGlbV2 = (glb) => {
    if (!Buffer.isBuffer(glb) || glb.length < 12 || glb.readUInt32LE(0) !== GLB_MAGIC || glb.readUInt32LE(4) !== GLB_VERSION) {
        throw new Error("obj2gltf 返回的结果不是合法 GLB v2 文件。");
    }
};

/** 根据目录名和显式参数决定需要写入 GLB 根节点的模型变换。 */
const getRootTransformMatrix = (sourceDirectory, option) => {
    if (typeof option === "boolean") {
        return option ? FORWARD_FLIP_MATRIX : undefined;
    }

    return FORWARD_FLIP_DIRECTORY_PATTERN.test(basename(sourceDirectory)) || /antonov/iu.test(basename(sourceDirectory))
        ? AN225_AXIS_ALIGNMENT_MATRIX
        : undefined;
};

/** 在 GLB 场景根部增加旋转节点，保留原始网格、材质和访问器数据。 */
const wrapGlbWithTransform = (glb, matrix) => {
    const jsonLength = glb.readUInt32LE(12);
    const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString("utf8").trim());
    const sceneIndex = json.scene ?? 0;
    const scene = json.scenes?.[sceneIndex];

    if (scene === undefined || !Array.isArray(scene.nodes) || !Array.isArray(json.nodes)) {
        throw new Error("GLB 缺少可包装的场景根节点。");
    }

    const rootNodeIndex = json.nodes.length;
    json.nodes.push({
        children: [...scene.nodes],
        matrix: [...matrix],
        name: "bundleGlb_root_transform",
    });
    scene.nodes = [rootNodeIndex];

    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
    const paddedJsonLength = Math.ceil(jsonBuffer.length / 4) * 4;
    const paddedJson = Buffer.concat([jsonBuffer, Buffer.alloc(paddedJsonLength - jsonBuffer.length, 0x20)]);
    const binaryChunks = glb.subarray(20 + jsonLength);
    const header = Buffer.alloc(12);
    const jsonHeader = Buffer.alloc(8);

    header.writeUInt32LE(GLB_MAGIC, 0);
    header.writeUInt32LE(GLB_VERSION, 4);
    header.writeUInt32LE(12 + 8 + paddedJson.length + binaryChunks.length, 8);
    jsonHeader.writeUInt32LE(paddedJson.length, 0);
    jsonHeader.writeUInt32LE(0x4e4f534a, 4);

    return Buffer.concat([header, jsonHeader, paddedJson, binaryChunks]);
};

/** 将输入目录转换为单个内嵌资源的 GLB，并在失败时保留清晰上下文。 */
const bundleDirectory = async (options) => {
    const sourceDirectory = resolve(options.sourceDirectory);

    if (!(await pathExists(sourceDirectory))) {
        throw new Error(`资源目录不存在：${sourceDirectory}`);
    }

    const objFiles = await collectFiles(sourceDirectory, new Set([EXTENSIONS.OBJ]));

    if (objFiles.length === 0) {
        throw new Error(`资源目录中没有 OBJ 文件：${sourceDirectory}`);
    }

    const imageFiles = await collectFiles(sourceDirectory, EXTENSIONS.IMAGE);
    const inputUpAxis = options.inputUpAxis === "AUTO"
        ? await detectInputUpAxis(objFiles)
        : options.inputUpAxis;
    const rootTransformMatrix = getRootTransformMatrix(sourceDirectory, options.flipForward);
    const outputPath = resolve(sourceDirectory, options.output ?? `${basename(sourceDirectory)}.glb`);

    if (!isAbsolute(outputPath) || !outputPath.startsWith(`${sourceDirectory}/`)) {
        throw new Error("输出 GLB 必须位于输入资源目录内。");
    }

    if (extname(outputPath).toLowerCase() !== ".glb") {
        throw new Error("输出文件必须使用 .glb 扩展名。");
    }

    const temporaryDirectory = await mkdtemp(join(tmpdir(), "bundle-glb-"));
    const convert = loadObj2Gltf();

    try {
        const { combinedObjPath, untexturedObjects } = await buildCombinedObj(objFiles, imageFiles, temporaryDirectory);
        const glb = await convert(combinedObjPath, {
            binary: true,
            checkTransparency: true,
            doubleSidedMaterial: true,
            inputUpAxis,
            outputUpAxis: options.outputUpAxis,
            triangleWindingOrderSanitization: true,
        });

        const outputGlb = rootTransformMatrix !== undefined
            ? wrapGlbWithTransform(glb, rootTransformMatrix)
            : glb;

        assertGlbV2(outputGlb);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, outputGlb);
        console.log(`打包完成：${objFiles.length} 个 OBJ，${imageFiles.length} 张图片`);
        console.log(`输出文件：${outputPath}（${outputGlb.length} bytes，根节点变换：${rootTransformMatrix === undefined ? "无" : "有"}）`);

        if (untexturedObjects.length > 0) {
            console.warn(`以下 OBJ 没有 UV 坐标，无法按图片贴图，已使用回退材质：${untexturedObjects.join("、")}`);
        }
    } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
    }
};

try {
    await bundleDirectory(parseArguments(process.argv.slice(2)));
} catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    console.error(`打包失败：${reason}`);
    process.exitCode = 1;
}
