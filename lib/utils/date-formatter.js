// === Date Formatting Utilities ===

/**
 * Format date for event display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatEventDate(date) {
    if (!date) return 'Fecha no disponible';
    try {
        return new Date(date).toLocaleString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return 'Fecha no disponible';
    }
}

/**
 * Format date as short date (DD/MM)
 * @param {string|Date} date - Date to format
 * @returns {string} Short date string
 */
export function formatShortDate(date) {
    if (!date) return '??/??';
    try {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit'
        });
    } catch (e) {
        console.error('Error formatting short date:', e);
        return '??/??';
    }
}

/**
 * Format date for gallery display
 * @param {string|Date} date - Date to format
 * @returns {string} Gallery date string
 */
export function formatGalleryDate(date) {
    if (!date) return 'Fecha desconocida';
    try {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long'
        });
    } catch (e) {
        console.error('Error formatting gallery date:', e);
        return 'Fecha desconocida';
    }
}

/**
 * Check if a date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(date) {
    if (!date) return false;
    try {
        return new Date(date) < new Date();
    } catch (e) {
        console.error('Error checking past date:', e);
        return false;
    }
}

/**
 * Check if a date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export function isFutureDate(date) {
    if (!date) return false;
    try {
        return new Date(date) > new Date();
    } catch (e) {
        console.error('Error checking future date:', e);
        return false;
    }
}
