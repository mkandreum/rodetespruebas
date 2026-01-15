
import { store } from '/js/store.js';
import { showInfoModal, showLoading } from '/js/ui.js';
import { UPLOAD_URL } from '/js/config.js';

export async function handleFileUpload(file, targetInputId, isVideo = false) {
    if (!file) return;
    const targetInput = document.getElementById(targetInputId);

    // Check type
    if (isVideo) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            showInfoModal("Solo imágenes o vídeo.", true); return;
        }
    } else {
        if (!file.type.startsWith('image/')) {
            showInfoModal("Solo imágenes.", true); return;
        }
    }

    const maxSize = (isVideo && file.type.startsWith('video/')) ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showInfoModal(`Archivo muy grande (Max ${maxSize / 1024 / 1024}MB).`, true); return;
    }

    showLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');

    try {
        const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
        const result = await res.json();

        if (!res.ok || !result.success) throw new Error(result.message || "Error al subir");

        if (targetInput) targetInput.value = result.url;
        showInfoModal("Archivo subido.", false);
        return result.url;

    } catch (e) {
        console.error("Upload error", e);
        showInfoModal("Error subiendo archivo: " + e.message, true);
    } finally {
        showLoading(false);
    }
}

export async function handleMultipleFileUpload(files, hiddenInputId, onUpdateCallback) {
    if (!files || files.length === 0) return;
    const hiddenInput = document.getElementById(hiddenInputId);

    showLoading(true);
    const promises = [];
    const newUrls = [];

    for (const file of files) {
        if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'image');

            promises.push(
                fetch(UPLOAD_URL, { method: 'POST', body: formData })
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.url) newUrls.push(data.url);
                    })
                    .catch(e => console.error(e))
            );
        }
    }

    await Promise.all(promises);
    showLoading(false);

    if (newUrls.length > 0) {
        const current = hiddenInput.value ? hiddenInput.value.split('\n') : [];
        const updated = [...current, ...newUrls];
        hiddenInput.value = updated.join('\n');
        showInfoModal(`${newUrls.length} imágenes subidas.`, false);
        if (onUpdateCallback) onUpdateCallback(updated);
    } else {
        showInfoModal("No se pudieron subir las imágenes.", true);
    }
}
