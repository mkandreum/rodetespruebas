/**
 * modules/galleries.js
 * Funciones de galerías de eventos y de drags
 */

/**
 * Renderiza la lista de eventos con galerías en la página de Galería.
 */
function renderGalleryEventList() {
	clearDynamicListListeners('galleryList');
	if (!galleryEventListContainer) return;
	galleryEventListContainer.innerHTML = '';

	if (galleryImageViewContainer) galleryImageViewContainer.classList.add('hidden');
	galleryEventListContainer.classList.remove('hidden');

	if (!appState || !Array.isArray(appState.events)) {
		galleryEventListContainer.innerHTML = '<p class="text-red-400 text-center col-span-full font-pixel">Error al cargar galerías.</p>';
		return;
	}

	const eventsWithGalleries = appState.events
		.filter(e => e && e.galleryImages && e.galleryImages.length > 0)
		.sort((a, b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);

	if (eventsWithGalleries.length === 0) {
		galleryEventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY GALERÍAS DISPONIBLES.</p>';
		return;
	}

	eventsWithGalleries.forEach(event => {
		try {
			const card = document.createElement('button');
			card.className = "gallery-event-btn w-full bg-gray-900 rounded-none border border-white overflow-hidden flex flex-col text-left transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300";
			card.dataset.eventId = event.id;

			const coverImage = event.galleryImages[0] || `https://placehold.co/600x400/000/fff?text=${encodeURIComponent(event.name || 'Galería')}&font=vt323`;
			const photoCount = event.galleryImages.length;

			card.innerHTML = `
				<div class="w-full bg-black border-b border-white overflow-hidden">
					<img src="${coverImage}" alt="${event.name || 'Evento'}" class="w-full" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x400/000/fff?text=Error&font=vt323';">
				</div>
				<div class="p-6">
					<h3 class="text-3xl font-pixel text-white text-glow-white truncate glitch-hover">${event.name || 'Evento sin nombre'}</h3>
					<p class="text-gray-400 font-pixel text-lg mt-1">${photoCount} FOTO${photoCount !== 1 ? 'S' : ''}</p>
				</div>`;

			card.classList.add('reveal-on-scroll');
			galleryEventListContainer.appendChild(card);
		} catch (e) {
			console.error(`Error renderizando galería para evento ${event?.id}:`, e);
		}
	});

	// Re-adjuntar listeners
	galleryEventListContainer.querySelectorAll('.gallery-event-btn').forEach(btn => addTrackedListener(btn, 'click', (e) => renderGalleryImages(parseInt(e.currentTarget.dataset.eventId, 10))));

	// Iniciar animación
	if (typeof observeRevealElements === 'function') observeRevealElements();
}

/**
 * Renderiza las galerías de eventos pasados en la página de inicio.
 */
function renderPastGalleries(events) {
	if (!pastGalleriesGrid) return;
	clearDynamicListListeners('pastGalleryList');
	pastGalleriesGrid.innerHTML = '';

	if (!Array.isArray(events)) {
		pastGalleriesGrid.innerHTML = '<p class="text-red-400 text-center col-span-full font-pixel">Error al cargar galerías pasadas.</p>';
		return;
	}

	const now = new Date();
	const pastEventsWithGalleries = events
		.filter(e => e && e.date && new Date(e.date) < now && e.galleryImages && e.galleryImages.length > 0)
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	if (pastEventsWithGalleries.length === 0) {
		pastGalleriesGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">AÚN NO HAY GALERÍAS DE EVENTOS PASADOS.</p>';
		return;
	}

	pastEventsWithGalleries.forEach(event => {
		try {
			const card = document.createElement('button');
			card.className = "past-gallery-event-btn w-full bg-gray-900 rounded-none border border-white overflow-hidden flex flex-col text-left transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300";
			card.dataset.eventId = event.id;

			const coverImage = event.galleryImages[0] || `https://placehold.co/600x400/000/fff?text=${encodeURIComponent(event.name || 'Galería')}&font=vt323`;
			const eventDateStr = new Date(event.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
			const photoCount = event.galleryImages.length;

			card.innerHTML = `
				<div class="w-full bg-black border-b border-white overflow-hidden">
					<img src="${coverImage}" alt="${event.name || 'Evento'}" class="w-full" onerror="this.onerror=null;this.src='https://placehold.co/600x400/000/fff?text=Error&font=vt323';">
				</div>
				<div class="p-6">
					<h3 class="text-3xl font-pixel text-white text-glow-white truncate glitch-hover">${event.name || 'Evento sin nombre'}</h3>
					<p class="text-sm text-gray-500 font-pixel">${eventDateStr || 'Fecha desconocida'}</p>
					<p class="text-gray-400 font-pixel text-lg mt-1">${photoCount} FOTO${photoCount !== 1 ? 'S' : ''}</p>
				</div>`;

			card.classList.add('reveal-on-scroll');
			pastGalleriesGrid.appendChild(card);
		} catch (e) {
			console.error(`Error renderizando galería pasada ${event?.id}:`, e);
		}
	});

	// Re-adjuntar listeners
	pastGalleriesGrid.querySelectorAll('.past-gallery-event-btn').forEach(btn => {
		addTrackedListener(btn, 'click', (e) => {
			const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
			if (!isNaN(eventId)) {
				renderGalleryImages(eventId);
				if (typeof showPage === 'function') showPage('gallery');
			}
		});
	});

	// Iniciar animación
	if (typeof observeRevealElements === 'function') observeRevealElements();
}

/**
 * Renderiza las imágenes de una galería específica.
 */
function renderGalleryImages(eventId) {
	clearDynamicListListeners('eventGalleryImages');

	if (!galleryEventListContainer || !galleryImageViewContainer || !galleryImageViewTitle || !galleryImageViewGrid || !appState || !appState.events) return;

	const event = appState.events.find(e => e.id === eventId);
	if (!event) {
		console.error(`Evento ${eventId} no encontrado para mostrar galería.`);
		renderGalleryEventList();
		return;
	}

	galleryEventListContainer.classList.add('hidden');
	galleryImageViewContainer.classList.remove('hidden');
	galleryImageViewTitle.textContent = event.name || 'Galería';
	galleryImageViewGrid.innerHTML = '';

	const galleryUrls = event.galleryImages || [];
	const thumbnailUrls = event.galleryThumbnails || [];

	if (galleryUrls.length === 0) {
		galleryImageViewGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY FOTOS EN ESTA GALERÍA.</p>';
		return;
	}

	galleryUrls.forEach((url, index) => {
		if (!url) return;
		const imgWrapper = document.createElement('button');
		imgWrapper.className = "event-gallery-img-btn rounded-none overflow-hidden border border-gray-700 transform transition-all hover:border-gray-300 duration-300 aspect-square";

		const thumbnailUrl = thumbnailUrls[index] || url;

		imgWrapper.innerHTML = `<img src="${thumbnailUrl}" alt="Foto de ${event.name || 'evento'}" loading="lazy" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/300x300/000/fff?text=Error&font=vt323';">`;
		galleryImageViewGrid.appendChild(imgWrapper);

		addTrackedListener(imgWrapper, 'click', () => {
			if (typeof showImageModal === 'function') {
				showImageModal(url, galleryUrls, index);
			}
		});
	});
}

/**
 * Renderiza la lista de Drags en la página pública.
 */
function renderDragList() {
	clearDynamicListListeners('dragList');
	if (!dragListContainer) return;
	dragListContainer.innerHTML = '';

	if (dragGalleryViewContainer) dragGalleryViewContainer.classList.add('hidden');
	dragListContainer.classList.remove('hidden');

	const dragsToShow = appState.drags || [];

	if (dragsToShow.length === 0) {
		dragListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY DRAGS REGISTRADAS POR AHORA.</p>';
		return;
	}

	const dragsNavBar = document.getElementById('drags-nav-bar');
	if (dragsNavBar) dragsNavBar.innerHTML = '';

	const randomDrags = shuffleArray(dragsToShow);

	randomDrags.forEach(drag => {
		try {
			const card = document.createElement('div');
			const cardColor = drag.cardColor && /^#[0-9A-F]{6}$/i.test(drag.cardColor) ? drag.cardColor : '#FFFFFF';
			card.className = `bg-gray-900 rounded-none border overflow-hidden flex flex-col transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300`;
			card.style.borderColor = cardColor;

			const cardId = `drag-card-${drag.id}`;
			card.id = cardId;

			if (dragsNavBar) {
				const navChip = document.createElement('button');
				navChip.textContent = drag.name || 'Drag';
				navChip.className = "font-pixel text-sm px-3 py-1 bg-transparent border-2 text-white transition-all duration-300 hover:text-black hover:scale-105";
				navChip.style.borderColor = cardColor;

				navChip.addEventListener('mouseenter', () => {
					navChip.style.backgroundColor = cardColor;
					navChip.style.color = '#000';
				});
				navChip.addEventListener('mouseleave', () => {
					navChip.style.backgroundColor = 'transparent';
					navChip.style.color = '#fff';
				});

				navChip.onclick = () => {
					const targetCard = document.getElementById(cardId);
					if (targetCard) {
						targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
						targetCard.classList.add('ring-2', 'ring-white');
						setTimeout(() => targetCard.classList.remove('ring-2', 'ring-white'), 1500);
					}
				};
				dragsNavBar.appendChild(navChip);
			}

			const imageUrl = drag.coverImageUrl || `https://placehold.co/400x400/000/fff?text=${encodeURIComponent(drag.name || 'Drag')}&font=vt323`;
			const galleryCount = drag.galleryImages?.length || 0;
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
						${instagramBtnHtml}
					</div>
				</div>
			`;

			card.classList.add('reveal-on-scroll');
			dragListContainer.appendChild(card);
		} catch (e) {
			console.error(`Error renderizando drag ${drag?.id}:`, e);
		}
	});

	dragListContainer.querySelectorAll('.drag-gallery-btn').forEach(btn => addTrackedListener(btn, 'click', (e) => renderDragGalleryImages(parseInt(e.currentTarget.dataset.dragId, 10))));

	if (typeof observeRevealElements === 'function') observeRevealElements();
}

/**
 * Renderiza las imágenes de la galería de una drag específica.
 */
function renderDragGalleryImages(dragId) {
	clearDynamicListListeners('dragGalleryImages');

	if (!dragListContainer || !dragGalleryViewContainer || !dragGalleryViewTitle || !dragGalleryViewGrid || !appState || !appState.drags) return;

	const drag = appState.drags.find(d => d.id === dragId);
	if (!drag) {
		console.error(`Drag ${dragId} no encontrada para mostrar galería.`);
		renderDragList();
		return;
	}

	dragListContainer.classList.add('hidden');
	dragGalleryViewContainer.classList.remove('hidden');
	dragGalleryViewTitle.textContent = drag.name || 'Galería Drag';
	dragGalleryViewGrid.innerHTML = '';

	const galleryUrls = drag.galleryImages || [];

	if (galleryUrls.length === 0) {
		dragGalleryViewGrid.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY FOTOS EN ESTA GALERÍA.</p>';
		return;
	}

	galleryUrls.forEach((url, index) => {
		if (!url) return;
		const imgWrapper = document.createElement('button');
		imgWrapper.className = "drag-gallery-img-btn rounded-none overflow-hidden border border-gray-700 transform transition-all hover:border-gray-300 duration-300 aspect-square";

		imgWrapper.innerHTML = `<img src="${url}" alt="Foto de ${drag.name || 'drag'}" loading="lazy" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/300x300/000/fff?text=Error&font=vt323';">`;
		dragGalleryViewGrid.appendChild(imgWrapper);

		addTrackedListener(imgWrapper, 'click', () => {
			if (typeof showImageModal === 'function') {
				showImageModal(url, galleryUrls, index);
			}
		});
	});
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		renderGalleryEventList,
		renderPastGalleries,
		renderGalleryImages,
		renderDragList,
		renderDragGalleryImages
	};
}
