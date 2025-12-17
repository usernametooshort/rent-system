export const API_BASE_URL = 'https://junited.synology.me:9898';

/**
 * 获取完整的图片 URL
 * 如果是相对路径，自动拼接后端地址
 * 如果是绝对路径，直接返回
 */
export const getImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;

    // 确保 path 以 / 开头
    const CleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${CleanPath}`;
};
