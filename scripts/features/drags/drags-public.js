// === Drags Public Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState } from '../../core/state.js';
import { clearDynamicListListeners, addTrackedListener } from '../../ui/event-listeners.js';
import { showImageModal } from '../../ui/modals.js';
import { observeRevealElements } from '../../ui/animations.js';
import { handleShowMerch } from '../merch/merch-public.js';

/**
 * Render the list of Drags in the public page
 */
export function renderDragList() {
    clearDynamicListListeners('dragList');
    if (!domRefs.dragListContainer) return;

    domRefs.dragListContainer.innerHTML = '';
    if (domRefs.dragGalleryViewContainer) domRefs.dragGalleryViewContainer.classList.add('hidden');
    domRefs.dragListContainer.classList.remove('hidden');

    const dragsToShow = appState.drags || [];

    if (dragsToShow.length === 0) {
        domRefs.dragListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY DRAGS REGISTRADAS POR AHORA.</p>';
        return;
    }

    dragsToShow.sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(drag => {
        try {
            const card = document.createElement('div');
            const cardColor = drag.cardColor && /^#[0-9A-F]{6}$/i.test(drag.cardColor) ? drag.cardColor : '#FFFFFF';
            card.className = `bg-gray-900 rounded-none border overflow-hidden flex flex-col transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300`;
            card.style.borderColor = cardColor;

            const imageUrl = drag.coverImageUrl || `https://placehold.co/400x400/000/fff?text=${encodeURIComponent(drag.name || 'Drag')}&font=vt323`;
            const galleryCount = drag.galleryImages?.length || 0;
            const merchCount = drag.merchItems?.length || 0;

            let merchBtnHtml = '';
            if (merchCount > 0) {
                merchBtnHtml = `
						<button data-drag-id="${drag.id}" class="drag-merch-btn w-full bg-pink-600 text-white font-pixel text-lg py-2 px-4 rounded-none border border-pink-500 hover:bg-pink-500 transition-colors duration-300">
							MERCHANDISING (${merchCount})
						</button>`;
            } else {
                merchBtnHtml = `
						<button disabled class="w-full bg-gray-800 text-gray-500 font-pixel text-lg py-2 px-4 rounded-none border border-gray-700 cursor-not-allowed">
							MERCHANDISING (0)
						</button>`;
            }

            const instagramBtnHtml = drag.instagramHandle
                ? `<a href="https://www.instagram.com/${drag.instagramHandle}" target="_blank" rel="noopener noreferrer" class="drag-instagram-btn w-full bg-gray-700 text-white font-pixel text-lg py-2 px-4 rounded-none border border-gray-600 hover:bg-gray-600 transition-colors duration-300 flex items-center justify-center gap-2">
			   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
			   @${drag.instagramHandle}
		   </a>`
                : '';

            card.innerHTML = `
					<div class="w-full bg-black border-b overflow-hidden" style="border-color: ${cardColor};">
						<img src="${imageUrl}" alt="${drag.name || 'Drag'}" class="w-full" onerror="this.onerror=null;this.src='https://placehold.co/400x400/000/fff?text=Error&font=vt323';">
					</div>
					<div class="p-6 flex flex-col flex-grow">
						<h3 class="text-3xl font-pixel text-white text-glow-white mb-2 truncate glitch-hover">${drag.name || 'Drag sin nombre'}</h3>
						<p class="text-gray-400 mb-6 flex-grow">${drag.description || 'Sin descripción.'}</p>
						<div class="space-y-3">
							<button data-drag-id="${drag.id}" class="drag-gallery-btn w-full neon-btn text-white font-pixel text-lg py-2 px-4 rounded-none ${galleryCount === 0 ? 'hidden' : ''}">
								VER GALERÍA (${galleryCount})
							</button>
							 <button disabled class="w-full bg-gray-800 text-gray-500 font-pixel text-lg py-2 px-4 rounded-none border border-gray-700 cursor-not-allowed ${galleryCount > 0 ? 'hidden' : ''}">
								GALERÍA (0)
							</button>
							${merchBtnHtml}
							${instagramBtnHtml}
						</div>
					</div>
				`;

            card.classList.add('reveal-on-scroll');
            domRefs.dragListContainer.appendChild(card);
        } catch (e) {
            console.error(`Error renderizando drag ${drag?.id}:`, e);
        }
    });

    // Re-attach listeners
    domRefs.dragListContainer.querySelectorAll('.drag-gallery-btn').forEach(btn => addTrackedListener(btn, 'click', (e) => renderDragGalleryImages(parseInt(e.currentTarget.dataset.dragId, 10))));
    domRefs.dragListContainer.querySelectorAll('.drag-merch-btn:not([disabled])').forEach(btn => addTrackedListener(btn, 'click', handleShowMerch));

    observeRevealElements();
}

/**
 * Render Gallery Images for a specific Drag
 * @param {number} dragId 
 */
export function renderDragGalleryImages(dragId) {
    clearDynamicListListeners('dragGalleryImages');

    if (!domRefs.dragListContainer || !domRefs.dragGalleryViewContainer || !domRefs.dragGalleryViewTitle || !domRefs.dragGalleryViewGrid || !appState || !appState.drags) return;

    const drag = appState.drags.find(d => d.id === dragId);
    if (!drag) {
        console.error(`Drag ${dragId} no encontrada para mostrar galería.`);
        renderDragList();
        return;
    }

    domRefs.dragListContainer.classList.add('hidden');
    domRefs.dragGalleryViewContainer.classList.remove('hidden');
    domRefs.dragGalleryViewTitle.textContent = drag.name || 'Galería Drag';
    domRefs.dragGalleryViewGrid.innerHTML = '';

    const galleryUrls = drag.galleryImages || [];

    if (galleryUrls.length === 0) {
        domRefs.dragGalleryViewGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY FOTOS EN ESTA GALERÍA.</p>';
        return;
    }

    galleryUrls.forEach((url, index) => {
        if (!url) return;
        const imgWrapper = document.createElement('button');
        imgWrapper.className = "drag-gallery-img-btn rounded-none overflow-hidden border border-gray-700 transform transition-all hover:border-gray-300 duration-300 aspect-square";

        imgWrapper.innerHTML = `<img src="${url}" alt="Foto de ${drag.name || 'drag'}" loading="lazy" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/300x300/000/fff?text=Error&font=vt323';">`;
        domRefs.dragGalleryViewGrid.appendChild(imgWrapper);

        addTrackedListener(imgWrapper, 'click', () => showImageModal(url, galleryUrls, index));
    });
}
