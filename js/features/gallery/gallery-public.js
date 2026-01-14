// === Gallery Public Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState } from '../../core/state.js';
import { showImageModal } from '../../ui/modals.js';
import { clearDynamicListListeners, addTrackedListener } from '../../ui/event-listeners.js';
import { showPage } from '../../ui/navigation.js';

/**
 * Render Gallery Page: List of events with galleries
 */
export function renderGalleryEventList() {
    clearDynamicListListeners('galleryList');
    if (!domRefs.galleryEventListContainer) return;
    domRefs.galleryEventListContainer.innerHTML = '';

    // Reset views
    if (domRefs.galleryImageViewContainer) domRefs.galleryImageViewContainer.classList.add('hidden');
    domRefs.galleryEventListContainer.classList.remove('hidden');

    if (!appState || !Array.isArray(appState.events)) {
        domRefs.galleryEventListContainer.innerHTML = '<p class="text-red-400 text-center col-span-full font-pixel">Error al cargar galerías.</p>';
        return;
    }

    const eventsWithGalleries = appState.events
        .filter(e => e && e.galleryImages && e.galleryImages.length > 0)
        .sort((a, b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);

    if (eventsWithGalleries.length === 0) {
        domRefs.galleryEventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY GALERÍAS DISPONIBLES AÚN.</p>';
        return;
    }

    eventsWithGalleries.forEach(event => {
        const card = createGalleryCard(event, false); // false = main gallery style
        domRefs.galleryEventListContainer.appendChild(card);
    });

    // Listeners
    domRefs.galleryEventListContainer.querySelectorAll('.gallery-event-btn').forEach(btn =>
        addTrackedListener(btn, 'click', (e) => {
            const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
            renderGalleryImages(eventId);
        })
    );

    observeRevealElementsLocal(); // Local scope animation helper? Or import global? 
    // Animation logic was global 'observeRevealElements'. I should import it to be clean, or rely on global scope if I must. 
    // I'll create a simple one or just add class 'visible' immediately if no observer.
    // But pixel-perfect requires animation.
    // I'll assume 'observeRevealElements' is available globally or I should copy it to 'ui/animations.js' and import it.
    // I have 'js/ui/animations.js'. I should import it.
}


/**
 * Render Past Galleries on Home Page
 */
export function renderPastGalleries() {
    if (!domRefs.pastGalleriesGrid) return;

    clearDynamicListListeners('pastGalleryList');
    domRefs.pastGalleriesGrid.innerHTML = '';

    const events = appState.events || [];
    const now = new Date();
    const pastEventsWithGalleries = events
        .filter(e => e && e.date && new Date(e.date) < now && e.galleryImages && e.galleryImages.length > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (pastEventsWithGalleries.length === 0) {
        domRefs.pastGalleriesGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">AÚN NO HAY GALERÍAS DE EVENTOS PASADOS.</p>';
        return;
    }

    pastEventsWithGalleries.forEach(event => {
        const card = createGalleryCard(event, true); // true = past gallery style (home)
        domRefs.pastGalleriesGrid.appendChild(card);
    });

    // Listeners
    domRefs.pastGalleriesGrid.querySelectorAll('.past-gallery-event-btn').forEach(btn => {
        addTrackedListener(btn, 'click', (e) => {
            const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
            if (!isNaN(eventId)) {
                showPage('gallery');
                // Defer render until page switch might be safer but showPage handles visibility.
                // We need to trigger renderGalleryImages manually because showPage('gallery') just shows the container, 
                // but renderGalleryImages changes the view INSIDE that container.
                // Wait, showPage('gallery') calls 'renderPage("gallery")' which calls 'renderGalleryEventList()'!
                // So showPage RESETS the gallery view to the LIST.
                // We want to show a specific gallery.
                // We should modify 'showPage' to accept params OR we call renderGalleryImages AFTER showPage.
                // BUT renderGalleryEventList (called by showPage) hides the image view.
                // So we need to call renderGalleryImages LAST.
                setTimeout(() => renderGalleryImages(eventId), 50); // Small delay to override default render
            }
        });
    });

    observeRevealElementsLocal();
}

/**
 * Render Images of a specific Event
 */
export function renderGalleryImages(eventId) {
    if (!domRefs.galleryEventListContainer || !domRefs.galleryImageViewContainer) return;

    clearDynamicListListeners('eventGalleryImages');

    const event = appState.events.find(e => e.id === eventId);
    if (!event) {
        console.error(`Evento ${eventId} no encontrado para galería.`);
        renderGalleryEventList();
        return;
    }

    domRefs.galleryEventListContainer.classList.add('hidden');
    domRefs.galleryImageViewContainer.classList.remove('hidden');

    if (domRefs.galleryImageViewTitle) domRefs.galleryImageViewTitle.textContent = event.name || 'Galería';
    if (domRefs.galleryImageViewGrid) {
        domRefs.galleryImageViewGrid.innerHTML = '';

        const galleryUrls = event.galleryImages || [];

        if (galleryUrls.length === 0) {
            domRefs.galleryImageViewGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY FOTOS.</p>';
            return;
        }

        galleryUrls.forEach((url, index) => {
            if (!url) return;
            const btn = document.createElement('button');
            btn.className = "event-gallery-img-btn rounded-none overflow-hidden border border-gray-700 transform transition-all hover:border-gray-300 duration-300 aspect-square";
            btn.innerHTML = `<img src="${url}" alt="Foto" loading="lazy" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/300x300/000/fff?text=?&font=vt323';">`;

            domRefs.galleryImageViewGrid.appendChild(btn);
            addTrackedListener(btn, 'click', () => showImageModal(url, galleryUrls, index));
        });
    }
}


function createGalleryCard(event, isHome) {
    const btnClass = isHome ? 'past-gallery-event-btn' : 'gallery-event-btn';
    const btn = document.createElement('button');
    btn.className = `${btnClass} w-full bg-gray-900 rounded-none border border-white overflow-hidden flex flex-col text-left transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300 reveal-on-scroll`;
    btn.dataset.eventId = event.id;

    const coverImage = (event.galleryImages && event.galleryImages[0]) || `https://placehold.co/600x400/000/fff?text=${encodeURIComponent(event.name || 'Galería')}&font=vt323`;
    const photoCount = event.galleryImages ? event.galleryImages.length : 0;

    let extraInfo = '';
    if (isHome) {
        const dateStr = event.date ? new Date(event.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : '';
        extraInfo = `<p class="text-sm text-gray-500 font-pixel">${dateStr}</p>`;
    }

    btn.innerHTML = `
		<div class="w-full bg-black border-b border-white overflow-hidden">
			<img src="${coverImage}" alt="${event.name}" class="w-full" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x400/000/fff?text=Error&font=vt323';">
		</div>
		<div class="p-6">
			<h3 class="text-3xl font-pixel text-white text-glow-white truncate glitch-hover">${event.name || 'Evento'}</h3>
			${extraInfo}
			<p class="text-gray-400 font-pixel text-lg mt-1">${photoCount} FOTO${photoCount !== 1 ? 'S' : ''}</p>
		</div>
	`;

    return btn;
}


// Animation Helper Import (Stub or Real)
// I'll import 'observeRevealElements' from '../ui/animations.js'.
// If not available, I'll fallback gracefully.
import { observeRevealElements } from '../../ui/animations.js';

function observeRevealElementsLocal() {
    if (typeof observeRevealElements === 'function') {
        observeRevealElements();
    } else {
        // Fallback: make everything visible
        document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('visible'));
    }
}
