
import { store } from '/js/store.js';
import { addTrackedListener, clearDynamicListListeners, showImageModal } from '/js/ui.js';

export function renderDragList() {
    clearDynamicListListeners('dragList');
    const container = document.getElementById('drag-list-container');
    if (!container) return;
    container.innerHTML = '';

    const viewContainer = document.getElementById('drag-gallery-view-container');
    if (viewContainer) viewContainer.classList.add('hidden');
    container.classList.remove('hidden');

    const drags = (store.appState.drags || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (drags.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center font-pixel">NO HAY DRAGS.</p>';
        return;
    }

    drags.forEach(drag => {
        const card = document.createElement('div');
        // ... styling ...
        card.innerHTML = `<h3>${drag.name}</h3>`; // Simplified for brevity, assume similar structure to app.js
        container.appendChild(card);
        // ... listeners for gallery btn ...
    });
}

// ... renderDragGalleryImages ...
