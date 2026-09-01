/** 将截图或设置 JSON 转为浏览器下载，下载后立即释放临时 URL。 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout((): void => {
        URL.revokeObjectURL(downloadUrl);
    }, 0);
};
