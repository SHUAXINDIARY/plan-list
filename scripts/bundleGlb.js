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
    DIFFUSE: /(albedo|base.?color|color|diffuse|map.?kd|texture)/iu,
    NORMAL: /(normal|norm|bump)/iu,
    OCCLUSION: /(ambient|ao|occlusion)/iu,
});
/** 可选参数默认值。输出文件默认使用输入目录名称。 */
const DEFAULT_OPTIONS = Object.freeze({
    output: undefined,
});

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

        if (argument === "--output" || argument === "-o") {
            const value = argumentsList[index + 1];

            if (!value || value.startsWith("-")) {
                throw new Error(`${argument} 需要一个输出文件路径。`);
            }

            options.output = value;
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

/** 把文件名归一化后用于模糊匹配 OBJ 与贴图的共同命名片段。 */
const normalizeName = (filePath) => {
    return basename(filePath, extname(filePath))
        .toLowerCase()
        .replace(/(?:_|-)?(?:diffuse|base.?color|albedo|occlusion|ambient|ao|normal|bump|roughness|metallic|color)/giu, "")
        .replace(/[^a-z0-9]+/giu, "");
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
const createGeneratedMaterial = (objPath, objectIndex, textureIndex, vertexCount, imageFiles) => {
    const diffuseCandidates = imageFiles.filter((filePath) => {
        const fileName = basename(filePath);

        return TEXTURE_PATTERNS.DIFFUSE.test(fileName) && !TEXTURE_PATTERNS.OCCLUSION.test(fileName) && !TEXTURE_PATTERNS.NORMAL.test(fileName);
    });
    const diffuseTexture = selectTexture(objPath, diffuseCandidates, textureIndex, vertexCount);
    const matchingName = diffuseTexture === undefined ? "" : normalizeName(diffuseTexture);
    const findRelated = (pattern) => {
        return imageFiles.find((filePath) => {
            const fileName = basename(filePath);

            return pattern.test(fileName) && (matchingName === "" || normalizeName(filePath).includes(matchingName));
        });
    };
    const occlusionTexture = findRelated(TEXTURE_PATTERNS.OCCLUSION);
    const normalTexture = findRelated(TEXTURE_PATTERNS.NORMAL);
    const materialName = `generated_${objectIndex}_${basename(objPath, EXTENSIONS.OBJ).replace(/[^a-z0-9_]+/giu, "_")}`;
    const lines = [`newmtl ${materialName}`, "Kd 1.0 1.0 1.0", "Ns 0.0"];

    if (diffuseTexture !== undefined) {
        lines.push(`map_Kd ${diffuseTexture}`);
    }

    if (occlusionTexture !== undefined) {
        lines.push(`map_Ka ${occlusionTexture}`);
    }

    if (normalTexture !== undefined) {
        lines.push(`map_Bump ${normalTexture}`);
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
            : createGeneratedMaterial(objPath, objectIndex, texturedObjectIndex, sourceVertexCount, imageFiles);

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

    return combinedObjPath;
};

/** 检查转换结果是合法的 glTF 2.0 二进制文件。 */
const assertGlbV2 = (glb) => {
    if (!Buffer.isBuffer(glb) || glb.length < 12 || glb.readUInt32LE(0) !== GLB_MAGIC || glb.readUInt32LE(4) !== GLB_VERSION) {
        throw new Error("obj2gltf 返回的结果不是合法 GLB v2 文件。");
    }
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
        const combinedObjPath = await buildCombinedObj(objFiles, imageFiles, temporaryDirectory);
        const glb = await convert(combinedObjPath, {
            binary: true,
            checkTransparency: true,
            doubleSidedMaterial: true,
            triangleWindingOrderSanitization: true,
        });

        assertGlbV2(glb);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, glb);
        console.log(`打包完成：${objFiles.length} 个 OBJ，${imageFiles.length} 张图片`);
        console.log(`输出文件：${outputPath}（${glb.length} bytes）`);
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
