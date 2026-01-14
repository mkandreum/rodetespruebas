// === Events Form Module ===

import { domRefs } from '../../ui/dom-refs.js';

export let editingEventId = null;

/**
 * Set current editing event ID
 * @param {number|null} id 
 */
export function setEditingEventId(id) {
    editingEventId = id;
}

/**
 * Reset Event Form
 */
export function resetEventForm() {
    if (!domRefs.addEventForm) return;

    domRefs.addEventForm.reset();
    setEditingEventId(null);

    if (domRefs.addEventForm['edit-event-id']) {
        domRefs.addEventForm['edit-event-id'].value = '';
    }

    if (domRefs.addEventButton) {
        domRefs.addEventButton.textContent = "AÑADIR EVENTO";
        domRefs.addEventButton.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        domRefs.addEventButton.classList.add('bg-pink-600', 'hover:bg-pink-500');
    }

    // Reset gallery management area in form (if exists)
    // Actually gallery management is usually in the events LIST (button to manage gallery), not in the add/edit form immediately.
    // But 'galleryUploadInput' logic is handled in events-admin.js separately or inside edit mode?
    // The original code reset galleryUploadInput in handleSaveEvent.

    const galleryUploadInput = document.getElementById('gallery-image-upload');
    if (galleryUploadInput) galleryUploadInput.value = '';

    // Also clear the preview grid for gallery if it's reused? 
    // The gallery admin grid is rendered when selecting an event in gallery admin, not in add/edit event form.
    // Add/Edit event form is for properties (name, date, price, poster).
    // Gallery logic is in 'Admin Gallery' section? 
    // Wait, original app had 'Admin Gallery' section separate from 'Create Event'.
    // Yes. 'admin-gallery-preview-grid' is for the gallery tab.
}
