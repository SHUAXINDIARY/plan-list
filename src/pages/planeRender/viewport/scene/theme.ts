/** 从当前主题读取颜色 token，缺失时返回模型视窗的稳定回退值。 */
export const readThemeColor = (token: string, fallback: string): string => {
    if (typeof document === "undefined") {
        return fallback;
    }

    return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || fallback;
};
