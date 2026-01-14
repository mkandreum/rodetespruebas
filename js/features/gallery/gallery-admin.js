// === Gallery Admin Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState } from '../../core/state.js';
import { saveAppState } from '../../api/app-state-api.js';
import { showLoading, showInfoModal, renderAdminGalleryGrid } from '../../ui/modals.js';
import { handleMultipleFileUpload } from '../content/content-manager.js';
import { renderGalleryEventList, renderPastGalleries } from './gallery-public.js';

/**
 * Render Gallery Event Select Dropdown
 */
export function renderAdminGalleryEventSelect(events) {
    if (!domRefs.adminGallerySelect) return;

    const previousValue = domRefs.adminGallerySelect.value;
    domRefs.adminGallerySelect.innerHTML = '<option value="">-- SELECCIONA UN EVENTO --</option>';

    const eventsToShow = events || [];
    // Mostrar todos los eventos, pasados y futuros, para gestionar sus galerías
    [...eventsToShow].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        const eventDateStr = new Date(event.date).toLocaleDateString('es-ES');
        option.textContent = `${event.name || 'Evento'} (${eventDateStr})`;
        domRefs.adminGallerySelect.appendChild(option);
    });

    // Restore selection
    if (previousValue && eventsToShow.some(e => e.id === parseInt(previousValue, 10))) {
        domRefs.adminGallerySelect.value = previousValue;
        handleGalleryEventSelect(); // Trigger render grid
    } else {
        domRefs.adminGallerySelect.value = "";
        handleGalleryEventSelect();
    }
}

/**
 * Handle Gallery Select Change
 */
export function handleGalleryEventSelect() {
    if (!domRefs.adminGallerySelect || !appState || !appState.events) return;

    const eventId = parseInt(domRefs.adminGallerySelect.value, 10);
    const hiddenInputId = 'gallery-urls-input';
    const containerId = 'admin-gallery-preview-grid';

    let imageUrls = [];

    if (!isNaN(eventId)) {
        const event = appState.events.find(e => e.id === eventId);
        imageUrls = event?.galleryImages || [];
    }

    // Helper from modals.js handles the grid and delete listeners
    renderAdminGalleryGrid(containerId, hiddenInputId, imageUrls);

    // Reset upload input
    if (domRefs.galleryUploadInput) domRefs.galleryUploadInput.value = '';
}

/**
 * Handle Gallery Image Upload (Manual or Bulk via content-manager helper)
 */
export async function handleGalleryImageUpload(e) {
    // We use the helper from content-manager which handles multiple files, upload, and grid update.
    // But grid update logic in helper uses 'renderAdminGalleryGrid' too.
    // It updates the hidden input value.
    // We need to SAVE after upload? 
    // The helper `handleMultipleFileUpload` says: "Pulsa Guardar para confirmar los cambios."
    // It updates the hidden input and grid, but NOT appState.
    // So we need a "Guardar Galería" button handler? 
    // Or autosave?
    // Original code: There was a "GUARDAR GALERÍA" button in the form?
    // Let's check app.js.

    // app.js:3380 handleSaveVenueGallery (renamed?) or just handleSaveGallery?
    // Ah, there is a `save-gallery-btn` if I recall. 
    // I need to find the listener for saving gallery updates.
    // Or maybe the gallery upload updates state immediately? 
    // `handleMultipleFileUpload` does NOT update state.

    // Wait, `handleMultipleFileUpload` updates the HIDDEN INPUT.
    // We need a handler that reads the hidden input and saves to appState.

    await handleMultipleFileUpload(e, 'gallery-urls-input', 'admin-gallery-preview-grid');
}

/**
 * Save Gallery Changes (triggered by button)
 */
export async function handleSaveGalleryChanges() {
    // This function needs to be attached to a button, e.g. .save-gallery-btn?
    // Or is it automatic? 
    // In the original code, there was `handleGalleryUpdate`?
    // app.js:3390 `btnGuardarGaleria.addEventListener('click', ...)`

    if (!domRefs.adminGallerySelect || !appState) return;

    const eventId = parseInt(domRefs.adminGallerySelect.value, 10);
    if (isNaN(eventId)) {
        showInfoModal("Selecciona un evento primero.", true); return;
    }

    const hiddenInput = document.getElementById('gallery-urls-input');
    if (!hiddenInput) return;

    const urls = hiddenInput.value.split('\n').filter(u => u.trim() !== '');

    const event = appState.events.find(e => e.id === eventId);
    if (!event) {
        showInfoModal("Evento no encontrado.", true); return;
    }

    showLoading(true);
    try {
        event.galleryImages = urls;
        await saveAppState();

        showInfoModal("¡GALERÍA GUARDADA!", false);

        // Refresh public views
        renderGalleryEventList();
        renderPastGalleries(); // Should pass events? Actually renderPastGalleries reads appState internally or passed arg?
        // My implementation reads appState.events internally if not passed, or I should update it to do so. 
        // In gallery-public.js I wrote: const events = appState.events || [];
        // So yes, just calling it works.
        renderPastGalleries();

    } catch (error) {
        console.error("Error saving gallery:", error);
        showInfoModal("Error al guardar galería.", true);
    } finally {
        showLoading(false);
    }
}
