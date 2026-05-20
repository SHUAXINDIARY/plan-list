/**
 * 全站主题偏好：与 `App.css` 中 `data-theme` 及构建期注入脚本共用同一约定。
 */

/** 用户界面主题：深色为默认「夜航档案」，亮色为日间阅读环境。 */
export type ThemePreference = "dark" | "light";

/** localStorage 键名；须与 `rsbuild.config.ts` 内嵌脚本保持一致。 */
export const THEME_STORAGE_KEY = "plane-list-theme";

/**
 * 将存储或其它来源的字符串规范化为可识别的主题值。
 *
 * @param raw 取自 `localStorage` 或 `data-theme` 的原始字符串，可能为 `null`。
 * @returns 识别成功返回对应主题，否则回落为深色以保证可读基线。
 */
export function normalizeThemePreference(raw: string | null): ThemePreference {
    if (raw === "light" || raw === "dark") {
        return raw;
    }
    return "dark";
}

/**
 * 从 `localStorage` 读取用户上次选择的主题；不可用或异常时回落深色。
 */
export function readThemePreferenceFromStorage(): ThemePreference {
    try {
        return normalizeThemePreference(
            window.localStorage.getItem(THEME_STORAGE_KEY),
        );
    } catch {
        return "dark";
    }
}

/**
 * 将当前主题写入 `localStorage`；私密模式等导致写入失败时静默忽略。
 *
 * @param preference 要持久化的主题。
 */
export function writeThemePreferenceToStorage(
    preference: ThemePreference,
): void {
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
        /* 无写入权限时不阻断界面 */
    }
}

/**
 * 将主题反映到文档根元素，供 CSS 变量与选择器 `[data-theme="..."]` 消费。
 *
 * @param preference 当前应对外呈现的主题。
 */
export function applyThemePreference(preference: ThemePreference): void {
    document.documentElement.setAttribute("data-theme", preference);
}

/** 供 `<meta name="theme-color">` 与新亮色壳层协调的色值（非纯黑白，略带冷色）。 */
export const THEME_COLOR_DARK = "#07111d";

/** 亮色模式下地址栏/系统 UI 用 theme-color，与壳层渐变末端对齐。 */
export const THEME_COLOR_LIGHT = "#d8e6f0";

/**
 * 更新文档中 `theme-color` meta，便于移动端浏览器顶栏与主题一致。
 *
 * @param preference 当前主题。
 */
export function updateDocumentThemeColor(
    preference: ThemePreference,
): void {
    const content =
        preference === "light" ? THEME_COLOR_LIGHT : THEME_COLOR_DARK;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute("content", content);
    }
}
