import { readdir, stat, unlink } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { RsbuildPlugin } from "@rsbuild/core";

const PLUGIN_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(PLUGIN_DIRECTORY, "..");
const SKETCHFAB_DIRECTORY = join(PROJECT_ROOT, "sketchfab");
const MAX_SKETCHFAB_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// 递归查找 sketchfab 目录下超过大小限制的普通文件，符号链接不跟随以避免越出项目目录。
const findOversizedSketchfabFiles = async (directoryPath: string): Promise<string[]> => {
    const entries = await readdir(directoryPath, { withFileTypes: true });
    const oversizedFiles: string[] = [];

    for (const entry of entries) {
        const entryPath = join(directoryPath, entry.name);

        if (entry.isSymbolicLink()) {
            continue;
        }

        if (entry.isDirectory()) {
            oversizedFiles.push(...(await findOversizedSketchfabFiles(entryPath)));
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const fileStats = await stat(entryPath);

        if (fileStats.size > MAX_SKETCHFAB_FILE_SIZE_BYTES) {
            oversizedFiles.push(entryPath);
        }
    }

    return oversizedFiles;
};

// 读取并删除所有超限模型；删除失败时抛错，让构建明确中止而不是继续打包超大资源。
const removeOversizedSketchfabFiles = async (): Promise<void> => {
    let oversizedFiles: string[];

    try {
        oversizedFiles = await findOversizedSketchfabFiles(SKETCHFAB_DIRECTORY);
    } catch (error: unknown) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            console.info("[sketchfab-size-guard] 未找到 sketchfab 目录，跳过检查。");
            return;
        }

        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`[sketchfab-size-guard] 扫描 sketchfab 目录失败：${reason}`);
    }

    for (const filePath of oversizedFiles) {
        await unlink(filePath);
        console.warn(
            `[sketchfab-size-guard] 已删除超过 25 MiB 的文件：${relative(PROJECT_ROOT, filePath)}`,
        );
    }

    if (oversizedFiles.length === 0) {
        console.info("[sketchfab-size-guard] 未发现超过 25 MiB 的文件。");
    }
};

// 在生产构建开始前清理超大 Sketchfab 模型，避免它们参与资源处理和最终产物生成。
export const pluginSketchfabFileSizeGuard = (): RsbuildPlugin => ({
    name: "plugin-sketchfab-file-size-guard",
    setup(api): void {
        api.onBeforeBuild(async (): Promise<void> => {
            await removeOversizedSketchfabFiles();
        });
    },
});
