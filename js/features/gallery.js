
import { store } from '/js/store.js';
import { addTrackedListener, clearDynamicListListeners, showImageModal } from '/js/ui.js';
import { showPage } from '/js/router.js';

export function renderGalleryEventList() {
    clearDynamicListListeners('galleryList');
    const container = document.getElementById('gallery-event-list-container');
    if (!container) return;
    container.innerHTML = '';

    document.getElementById('gallery-image-view-container')?.classList.add('hidden');
    container.classList.remove('hidden');

    if (!store.appState || !Array.isArray(store.appState.events)) {
        container.innerHTML = '<p class="text-red-400 text-center font-pixel">Error al cargar galerías.</p>';
        return;
    }

    const eventsWithGalleries = store.appState.events
        .filter(e => e && e.galleryImages && e.galleryImages.length > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (eventsWithGalleries.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center font-pixel">NO HAY GALERÍAS DISPONIBLES.</p>';
        return;
    }

    eventsWithGalleries.forEach(event => {
        const card = document.createElement('button');
        card.className = "gallery-event-btn w-full bg-gray-900 rounded-none border border-white overflow-hidden flex flex-col text-left hover:border-gray-300 hover:shadow-white/30 transition-all duration-300 reveal-on-scroll";
        card.dataset.eventId = event.id;

        const cover = event.galleryImages[0];
        const count = event.galleryImages.length;

        card.innerHTML = `
            <div class="w-full bg-black border-b border-white overflow-hidden">
                <img src="${cover}" alt="${event.name}" class="w-full" loading="lazy">
            </div>
            <div class="p-6">
                <h3 class="text-3xl font-pixel text-white text-glow-white truncate">${event.name}</h3>
                <p class="text-gray-400 font-pixel text-lg mt-1">${count} FOTOS</p>
            </div>
        `;
        container.appendChild(card);
    });

    container.querySelectorAll('.gallery-event-btn').forEach(btn => {
        addTrackedListener(btn, 'click', (e) => {
            renderGalleryImages(parseInt(e.currentTarget.dataset.eventId, 10));
        });
    });
}

export function renderPastGalleries(events) {
    const grid = document.getElementById('past-galleries-grid');
    if (!grid) return;
    clearDynamicListListeners('pastGalleryList');
    grid.innerHTML = '';

    const now = new Date();
    const past = events
        .filter(e => e.date && new Date(e.date) < now && e.galleryImages?.length > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (past.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 text-center font-pixel">AÚN NO HAY GALERÍAS.</p>';
        return;
    }

    past.forEach(event => {
        const card = document.createElement('button');
        card.className = "past-gallery-event-btn w-full bg-gray-900 rounded-none border border-white overflow-hidden flex flex-col text-left hover:border-gray-300 transition-all reveal-on-scroll";
        card.dataset.eventId = event.id;

        const cover = event.galleryImages[0];
        const dateStr = new Date(event.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });

        card.innerHTML = `
            <div class="w-full bg-black border-b border-white overflow-hidden">
                <img src="${cover}" class="w-full">
            </div>
            <div class="p-6">
                 <h3 class="text-3xl font-pixel text-white">${event.name}</h3>
                 <p class="text-sm text-gray-500 font-pixel">${dateStr}</p>
                 <p class="text-gray-400 font-pixel text-lg mt-1">${event.galleryImages.length} FOTOS</p>
            </div>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll('.past-gallery-event-btn').forEach(btn => {
        addTrackedListener(btn, 'click', (e) => {
            renderGalleryImages(parseInt(e.currentTarget.dataset.eventId, 10));
            showPage('gallery');
        });
    });
}

export function renderGalleryImages(eventId) {
    clearDynamicListListeners('eventGalleryImages');
    const container = document.getElementById('gallery-image-view-container');
    const listContainer = document.getElementById('gallery-event-list-container');
    const title = document.getElementById('gallery-image-view-title');
    const grid = document.getElementById('gallery-image-view-grid');

    if (!container || !listContainer) return;

    const event = store.appState.events.find(e => e.id === eventId);
    if (!event) {
        renderGalleryEventList();
        return;
    }

    listContainer.classList.add('hidden');
    container.classList.remove('hidden');
    if (title) title.textContent = event.name;
    if (grid) grid.innerHTML = '';

    const urls = event.galleryImages || [];
    if (urls.length === 0) {
        grid.innerHTML = '<p class="text-gray-400">NO HAY FOTOS.</p>';
        return;
    }

    urls.forEach((url, index) => {
        const btn = document.createElement('button');
        btn.className = "event-gallery-img-btn rounded-none border border-gray-700 hover:border-gray-300 aspect-square overflow-hidden";
        btn.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        grid.appendChild(btn);

        addTrackedListener(btn, 'click', () => showImageModal(url, urls, index));
    });
}
