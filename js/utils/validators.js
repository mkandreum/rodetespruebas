// === Validation Utilities ===

/**
 * Validate if a string is a valid hex color
 * @param {string} color - Color string to validate
 * @returns {boolean} True if valid hex color
 */
export function isValidHexColor(color) {
    return color && /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Validate if a URL is an image URL
 * @param {string} url - URL to check
 * @returns {boolean} True if image URL
 */
export function isImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) ||
        url.startsWith('uploads/') ||
        url.startsWith('data:image');
}

/**
 * Validate if a URL is a video URL
 * @param {string} url - URL to check
 * @returns {boolean} True if video URL
 */
export function isVideoUrl(url) {
    return /\.(mp4|webm|ogv)$/i.test(url) ||
        (url.startsWith('uploads/') && !isImageUrl(url)) ||
        url.startsWith('data:video');
}

/**
 * Validate if a URL is an embed URL (YouTube, Vimeo, etc)
 * @param {string} url - URL to check
 * @returns {boolean} True if embed URL
 */
export function isEmbedUrl(url) {
    return url.includes('/embed/') ||
        url.includes('youtube.com/watch') ||
        url.includes('youtu.be') ||
        url.includes('vimeo.com');
}
