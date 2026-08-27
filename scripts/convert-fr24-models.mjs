import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/** GLB 文件头中标识二进制 glTF 格式的固定字节。 */
const GLB_MAGIC = "glTF";
/** Three.js GLTFLoader 所需的 GLB/glTF 2.0 文件版本。 */
const GLB_V2_VERSION = 2;
/** 源子模块中待转换的 legacy GLB 模型目录。 */
const SOURCE_MODELS_DIRECTORY_SEGMENTS = [
    "fr24-3d-models",
    "models",
];
/** 根目录下存放转换产物的目录名称。 */
const OUTPUT_DIRECTORY_NAME = "fr24-3d-models-glbv2";
/** 输出仓库内保留与源仓库一致的模型目录名称。 */
const MODELS_DIRECTORY_NAME = "models";
/** GPLv2 许可证在源子模块与输出目录中使用的文件名称。 */
const LICENSE_FILE_NAME = "LICENSE";

/** 由当前脚本路径推导项目根目录，避免依赖调用时的工作目录。 */
const getProjectRoot = () => {
    const scriptPath = fileURLToPath(import.meta.url);

    return dirname(dirname(scriptPath));
};

/** 从 gltf-pipeline 加载 legacy GLB v1 至 glTF 2.0 的转换函数。 */
const loadGlbConverter = () => {
    try {
        const pipeline = require("gltf-pipeline");

        if (typeof pipeline.processGlb !== "function") {
            throw new Error("gltf-pipeline 未导出 processGlb。");
        }

        return pipeline.processGlb;
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        throw new Error(
            `无法加载 gltf-pipeline。请先执行 pnpm add -D gltf-pipeline。${reason}`,
        );
    }
};

/** 判断转换输出是否是可由 GLTFLoader 加载的 GLB v2 文件。 */
const isGlbV2 = (glb) => {
    return (
        glb.length >= 12 &&
        glb.subarray(0, 4).toString("utf8") === GLB_MAGIC &&
        glb.readUInt32LE(4) === GLB_V2_VERSION
    );
};

/** 读取源目录中全部 GLB 文件，排除当前 GLTFLoader 不支持的 legacy .gltf 文件。 */
const getSourceModelFileNames = async (sourceDirectory) => {
    const directoryEntries = await readdir(sourceDirectory, {
        withFileTypes: true,
    });

    return directoryEntries
        .filter(
            (entry) =>
                entry.isFile() && extname(entry.name).toLowerCase() === ".glb",
        )
        .map((entry) => entry.name)
        .sort((firstFileName, secondFileName) =>
            firstFileName.localeCompare(secondFileName),
        );
};

/** 顺序转换全部 legacy GLB v1 文件，降低转换期间的峰值内存占用。 */
const convertModels = async () => {
    const projectRoot = getProjectRoot();
    const sourceDirectory = join(
        projectRoot,
        ...SOURCE_MODELS_DIRECTORY_SEGMENTS,
    );
    const outputRootDirectory = join(projectRoot, OUTPUT_DIRECTORY_NAME);
    const outputDirectory = join(outputRootDirectory, MODELS_DIRECTORY_NAME);
    const convertGlb = loadGlbConverter();
    const sourceFileNames = await getSourceModelFileNames(sourceDirectory);
    const failures = [];

    if (sourceFileNames.length === 0) {
        throw new Error(`源目录中没有 GLB 文件：${sourceDirectory}`);
    }

    await mkdir(outputDirectory, { recursive: true });
    await cp(
        join(projectRoot, "fr24-3d-models", LICENSE_FILE_NAME),
        join(outputRootDirectory, LICENSE_FILE_NAME),
    );

    for (
        let sourceIndex = 0;
        sourceIndex < sourceFileNames.length;
        sourceIndex += 1
    ) {
        const sourceFileName = sourceFileNames[sourceIndex];

        if (sourceFileName === undefined) {
            continue;
        }

        const sourcePath = join(sourceDirectory, sourceFileName);
        const outputPath = join(outputDirectory, sourceFileName);

        try {
            const sourceGlb = await readFile(sourcePath);
            const conversionResult = await convertGlb(sourceGlb, {
                keepUnusedElements: true,
            });

            if (!isGlbV2(conversionResult.glb)) {
                throw new Error("转换结果不是 GLB v2 文件。");
            }

            await writeFile(outputPath, conversionResult.glb);
            console.log(
                `[${sourceIndex + 1}/${sourceFileNames.length}] 已转换 ${sourceFileName}`,
            );
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            failures.push(`${sourceFileName}: ${reason}`);
            console.error(`[${sourceIndex + 1}/${sourceFileNames.length}] 失败 ${sourceFileName}: ${reason}`);
        }
    }

    if (failures.length > 0) {
        throw new Error(
            `${failures.length} 个模型转换失败：\n${failures.join("\n")}`,
        );
    }

    console.log(
        `转换完成：${sourceFileNames.length} 个 GLB v2 文件，输出目录：${outputDirectory}`,
    );
};

await convertModels();
