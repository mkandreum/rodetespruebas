// === Drag Form Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { renderAdminGalleryGrid } from '../../ui/modals.js';
import { clearDynamicListListeners } from '../../ui/event-listeners.js';

export let editingDragId = null;

/**
 * Set the currently editing drag ID
 * @param {number|null} id 
 */
export function setEditingDragId(id) {
    editingDragId = id;
}

/**
 * Reset the add/edit drag form
 */
export function resetDragForm() {
    if (!domRefs.addDragForm) return;

    domRefs.addDragForm.reset();
    setEditingDragId(null);

    if (domRefs.addDragForm['edit-drag-id']) {
        domRefs.addDragForm['edit-drag-id'].value = '';
    }

    // Clean file inputs
    if (domRefs.dragCoverUploadInput) domRefs.dragCoverUploadInput.value = '';
    if (domRefs.dragGalleryUploadInput) domRefs.dragGalleryUploadInput.value = '';

    // Clear gallery preview grid
    if (domRefs.adminDragGalleryPreviewGrid) {
        domRefs.adminDragGalleryPreviewGrid.innerHTML = `<p class="text-gray-500 font-pixel text-center col-span-full self-center">Edita una drag existente o guarda una nueva para añadir imágenes.</p>`;
    }

    const hiddenDragGalleryInput = document.getElementById('drag-gallery-urls');
    if (hiddenDragGalleryInput) hiddenDragGalleryInput.value = '';

    clearDynamicListListeners('delete-img-admin-drag-gallery-preview-grid');

    // Restore button
    if (domRefs.addDragFormButton) {
        domRefs.addDragFormButton.textContent = "GUARDAR DRAG";
        domRefs.addDragFormButton.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        domRefs.addDragFormButton.classList.add('bg-white', 'hover:bg-gray-300');
    }
}
