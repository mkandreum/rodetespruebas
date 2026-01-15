
import { store } from '/js/store.js';
import { clearDynamicListListeners, addTrackedListener, showInfoModal, showLoading } from '/js/ui.js';
import { saveAppState } from '/js/api.js';
import { renderGalleryEventList, renderPastGalleries, renderGalleryImages } from '/js/gallery.js';
import { renderDragList } from '/js/drags.js'; // If dragging updates drags
import { renderMerchPage } from '/js/merch.js'; // If updates merch images? rare

/**
 * Reusable grid renderer for Admin Gallery Management (Events & Drags).
 */
export function renderAdminGalleryGrid(containerId, hiddenInputId, imageUrls) {
    const gridContainer = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!gridContainer || !hiddenInput) return;

    // Clear old listeners specific to this grid ID
    const listenerType = `delete-img-${containerId}`;
    clearDynamicListListeners(listenerType);

    gridContainer.innerHTML = '';

    // Update hidden input with current URLs
    hiddenInput.value = (imageUrls || []).join('\n');

    if (!imageUrls || imageUrls.length === 0) {
        gridContainer.innerHTML = `<p class="text-gray-500 font-pixel text-center col-span-full self-center">No hay imágenes.</p>`;
        return;
    }

    imageUrls.forEach((url, index) => {
        if (!url) return;
        const item = document.createElement('div');
        item.className = 'bg-gray-800 relative group aspect-square border border-gray-600';
        item.innerHTML = `
            <img src="${url}" class="w-full h-full object-cover">
            <button type="button" class="delete-img-btn absolute top-1 right-1 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500" data-url="${url}">&times;</button>
        `;
        gridContainer.appendChild(item);

        const deleteBtn = item.querySelector('.delete-img-btn');
        // We use a custom listener type so we can clear just these listeners when re-rendering this specific grid
        addTrackedListener(deleteBtn, 'click', (e) => {
            e.preventDefault();
            const urlToDelete = e.currentTarget.dataset.url;
            const updated = imageUrls.filter(u => u !== urlToDelete);
            renderAdminGalleryGrid(containerId, hiddenInputId, updated);
        }, listenerType);
    });
}

/**
 * Loads the gallery images into the grid when an event is selected in Admin -> Gallery.
 */
export function handleGalleryEventSelect(e) {
    const select = e.target;
    const eventId = parseInt(select.value);
    const containerId = 'admin-gallery-preview-grid';
    const hiddenInputId = 'gallery-urls-input';

    let imageUrls = [];
    if (!isNaN(eventId)) {
        const evt = store.appState.events.find(e => e.id === eventId);
        imageUrls = evt?.galleryImages || [];
    }

    renderAdminGalleryGrid(containerId, hiddenInputId, imageUrls);

    const fileInput = document.getElementById('gallery-upload-input');
    if (fileInput) fileInput.value = '';
}

/**
 * Saves the gallery changes for an event.
 */
export async function handleSaveGallery(e) {
    e.preventDefault();
    const select = document.getElementById('gallery-event-select');
    const hiddenInput = document.getElementById('gallery-urls-input');

    if (!select || !hiddenInput) return;

    const eventId = parseInt(select.value);
    if (isNaN(eventId)) { showInfoModal("Selecciona un evento", true); return; }

    const evtIdx = store.appState.events.findIndex(ev => ev.id === eventId);
    if (evtIdx === -1) return;

    const newUrls = hiddenInput.value.split('\n').filter(u => u.trim() !== '');

    showLoading(true);
    try {
        store.appState.events[evtIdx].galleryImages = newUrls;
        await saveAppState(); // We don't save tickets here, just app state

        // Update UI
        renderGalleryEventList();
        renderPastGalleries(store.appState.events);
        // If we are currently viewing this gallery in public view, refresh it?
        // Logic omitted for brevity but recommended.

        showInfoModal("Galería Guardada", false);
        document.getElementById('gallery-upload-input').value = '';
    } catch (err) {
        showInfoModal("Error guardando galería", true);
    } finally {
        showLoading(false);
    }
}

/**
 * Loads content for Drags Gallery (if separate) or logic can be adapted.
 * Assuming similar logic for Drag Gallery if the UI has a 'drag-gallery-urls' input.
 */
// If needed, we can export `handleSaveDragGallery` here too.
