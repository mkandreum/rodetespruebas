// === Generic API Client Module ===

/**
 * Fetch JSON from API endpoint
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 * @throws {Error} If request fails
 */
export async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}.`;
        if (response.status === 403) {
            errorMessage = "Acceso denegado. Tu sesión puede haber expirado.";
        } else if (result && result.message) {
            errorMessage = result.message;
        }
        throw new Error(errorMessage);
    }

    if (!result.success) {
        throw new Error(result.message || "El servidor reportó un error desconocido.");
    }

    return result;
}

/**
 * Upload file to server
 * @param {string} url - Upload endpoint URL
 * @param {FormData} formData - Form data with file
 * @returns {Promise<Object>} Upload response
 * @throws {Error} If upload fails
 */
export async function uploadFile(url, formData) {
    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });

    const result = await response.json();

    if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}.`;
        if (result && result.message) {
            errorMessage = result.message;
        }
        throw new Error(errorMessage);
    }

    if (!result.success) {
        throw new Error(result.message || "Error en la subida del archivo.");
    }

    return result;
}
