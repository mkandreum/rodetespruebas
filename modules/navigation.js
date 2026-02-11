/**
 * modules/navigation.js
 * Navegación entre páginas y gestión de elementos DOM
 */

/**
 * Cambia a una página específica.
 */
function showPage(pageName) {
	const validPages = ['home', 'events', 'drags', 'galleries', 'merch', 'scanner', 'tickets', 'login', 'info'];

	if (!validPages.includes(pageName)) {
		console.warn(`Página no válida: ${pageName}`);
		return;
	}

	// Ocultar todas las páginas
	document.querySelectorAll('[id*="Page"]').forEach(page => {
		page.classList.add('hidden');
	});

	// Actualizar indicadores de navegación
	updateNavIndicator(pageName);

	// Mostrar la página solicitada
	const pageMap = {
		'home': 'homePage',
		'events': 'eventsPage',
		'drags': 'dragsPage',
		'galleries': 'galleriesPage',
		'merch': 'merchPage',
		'scanner': 'scannerPage',
		'tickets': 'ticketsPage',
		'login': 'loginPage',
		'info': 'infoPage'
	};

	const pageId = pageMap[pageName];

	if (pageId) {
		const pageElement = document.getElementById(pageId);
		if (pageElement) {
			pageElement.classList.remove('hidden');

			// Ejecutar init específicos por página
			switch (pageName) {
				case 'home':
					if (typeof renderPastGalleries === 'function') renderPastGalleries(appState.events || []);
					if (typeof renderHomeEvents === 'function') renderHomeEvents(currentEvents);
					if (typeof renderBannerVideo === 'function') renderBannerVideo();
					if (typeof renderAppLogo === 'function') renderAppLogo();
					if (typeof renderNextEventPromo === 'function') renderNextEventPromo();
					if (typeof renderCountdown === 'function') renderCountdown();
					break;
				case 'events':
					renderPublicEvents(currentEvents);
					break;
				case 'tickets':
					syncTicketCounters();
					break;
				case 'merch':
					renderMerchPage();
					break;
				case 'galleries':
					renderGalleryEventList();
					break;
				case 'scanner':
					startScanner();
					break;
				case 'drags':
					renderDragList();
					break;
			}
		}
	}

	// Scroll al top
	window.scrollTo(0, 0);
}

/**
 * Actualiza los indicadores visuales de navegación.
 */
function updateNavIndicator(currentPage) {
	const navButtons = {
		'home': 'homeNavBtn',
		'events': 'eventsNavBtn',
		'drags': 'dragsNavBtn',
		'galleries': 'galleriesNavBtn',
		'merch': 'merchNavBtn',
		'scanner': 'scannerNavBtn',
		'tickets': 'ticketsNavBtn',
		'login': 'loginNavBtn',
		'info': 'infoNavBtn'
	};

	// Quitar clase activa de todos los botones
	document.querySelectorAll('[id*="NavBtn"]').forEach(btn => {
		btn.classList.remove('border-b-4', 'border-yellow-400');
		btn.classList.add('border-transparent');
	});

	// Agregar clase activa al botón de la página actual
	const activeBtn = document.getElementById(navButtons[currentPage]);
	if (activeBtn) {
		activeBtn.classList.add('border-b-4', 'border-yellow-400');
		activeBtn.classList.remove('border-transparent');
	}
}

/**
 * Muestra la página de administrador.
 */
function showAdminPage() {
	const adminPage = document.getElementById('administratorPage');

	if (!adminPage) {
		console.warn("Página de admin no encontrada");
		return;
	}

	// Ocultar todas las páginas públicas
	document.querySelectorAll('[id*="Page"]').forEach(page => {
		if (page.id !== 'administratorPage') {
			page.classList.add('hidden');
		}
	});

	// Mostrar página de admin
	adminPage.classList.remove('hidden');

	// Inicializar UI del admin
	checkAdminUI();

	// Renderizar datos
	renderAdminEvents(appState.events);
	renderAdminDrags(appState.drags);
	renderMerchAdminPanel();
	renderGalleryAdminPanel();

	// Scroll al top
	window.scrollTo(0, 0);
}

/**
 * Alterna entre panel de eventos y panel de drags en admin.
 */
function toggleAdminPanel(panelName) {
	const adminPanels = {
		'events': 'adminEventsPanel',
		'drags': 'adminDragsPanel',
		'merch': 'adminMerchPanel',
		'galleries': 'adminGalleriesPanel',
		'config': 'adminConfigPanel'
	};

	// Ocultar todos los paneles
	Object.values(adminPanels).forEach(panelId => {
		const panel = document.getElementById(panelId);
		if (panel) {
			panel.classList.add('hidden');
		}
	});

	// Mostrar panel seleccionado
	const selectedPanelId = adminPanels[panelName];
	if (selectedPanelId) {
		const selectedPanel = document.getElementById(selectedPanelId);
		if (selectedPanel) {
			selectedPanel.classList.remove('hidden');

			// Actualizar botones de toggle
			document.querySelectorAll('[data-admin-panel-btn]').forEach(btn => {
				btn.classList.remove('border-b-4', 'border-yellow-400');
				btn.classList.add('border-transparent');
			});

			const activeBtn = document.querySelector(`[data-admin-panel-btn="${panelName}"]`);
			if (activeBtn) {
				activeBtn.classList.add('border-b-4', 'border-yellow-400');
			}
		}
	}
}

/**
 * Renderiza el panel de merch en admin.
 */
function renderMerchAdminPanel() {
	const container = document.getElementById('adminMerchPanel');
	if (!container) return;

	const panel = document.querySelector('.admin-merch-list');
	if (!panel) return;

	panel.innerHTML = '';

	appState.merch.forEach((item, index) => {
		const itemDiv = document.createElement('div');
		itemDiv.className = "bg-gray-800 p-4 border border-gray-600 mb-2";
		itemDiv.innerHTML = `
			<div class="flex justify-between items-center">
				<div>
					<p class="font-bold">${item.name}</p>
					<p class="text-sm text-gray-400">$${item.price}</p>
				</div>
				<div>
					<button class="edit-merch-btn px-3 py-1 bg-blue-600 rounded mr-2" data-index="${index}">EDITAR</button>
					<button class="delete-merch-btn px-3 py-1 bg-red-600 rounded" data-index="${index}">ELIMINAR</button>
				</div>
			</div>
		`;

		panel.appendChild(itemDiv);
	});

	// Event listeners
	panel.querySelectorAll('.edit-merch-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const index = parseInt(e.target.dataset.index);
			const item = appState.merch[index];
			document.getElementById('merchName').value = item.name;
			document.getElementById('merchPrice').value = item.price;
			document.getElementById('merchImage').value = item.image || '';
			editingMerchItemId = index;
		});
	});

	panel.querySelectorAll('.delete-merch-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const index = parseInt(e.target.dataset.index);
			if (confirm('¿Eliminar ítem?')) {
				appState.merch.splice(index, 1);
				saveAppState();
				renderMerchAdminPanel();
			}
		});
	});
}

/**
 * Renderiza el panel de galerías en admin.
 */
function renderGalleryAdminPanel() {
	const container = document.getElementById('adminGalleriesPanel');
	if (!container) return;

	const panel = document.querySelector('.admin-gallery-list');
	if (!panel) return;

	panel.innerHTML = '';

	appState.galleries.forEach((gallery, index) => {
		const galleryDiv = document.createElement('div');
		galleryDiv.className = "bg-gray-800 p-4 border border-gray-600 mb-2";
		galleryDiv.innerHTML = `
			<div class="flex justify-between items-center">
				<div>
					<p class="font-bold">${gallery.eventId ? 'Evento: ' + gallery.eventId : 'Stand Libre'}</p>
					<p class="text-sm text-gray-400">${gallery.images?.length || 0} imágenes</p>
				</div>
				<div>
					<button class="edit-gallery-btn px-3 py-1 bg-blue-600 rounded mr-2" data-index="${index}">EDITAR</button>
					<button class="delete-gallery-btn px-3 py-1 bg-red-600 rounded" data-index="${index}">ELIMINAR</button>
				</div>
			</div>
		`;

		panel.appendChild(galleryDiv);
	});

	// Event listeners
	panel.querySelectorAll('.edit-gallery-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const index = parseInt(e.target.dataset.index);
			editingGalleryId = index;
			const gallery = appState.galleries[index];
			document.getElementById('galleryEventId').value = gallery.eventId || '';
			document.getElementById('galleryImages').value = JSON.stringify(gallery.images || []);
			document.getElementById('galleryThumbnails').value = JSON.stringify(gallery.thumbnails || []);
			renderAdminGalleryGrid('galleryImageGrid', 'galleryImages', gallery.images || [], 'galleryThumbnails');
		});
	});

	panel.querySelectorAll('.delete-gallery-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const index = parseInt(e.target.dataset.index);
			if (confirm('¿Eliminar galería?')) {
				appState.galleries.splice(index, 1);
				saveAppState();
				renderGalleryAdminPanel();
			}
		});
	});
}

/**
 * Abre modal de información.
 */
function openInfoModal(title = '', content = '') {
	const modal = document.getElementById('infoModal');
	if (modal) {
		const titleEl = modal.querySelector('h2');
		const contentEl = modal.querySelector('.modal-content');

		if (titleEl) titleEl.textContent = title;
		if (contentEl) contentEl.innerHTML = content;

		modal.classList.remove('hidden');
		modal.classList.add('flex');
	}
}

/**
 * Cierra un modal específico o todos.
 */
function closeModal(modalId = null) {
	if (modalId) {
		const modal = document.getElementById(modalId);
		if (modal) {
			modal.classList.add('hidden');
			modal.classList.remove('flex');
		}
	} else {
		document.querySelectorAll('[id*="Modal"]').forEach(modal => {
			modal.classList.add('hidden');
			modal.classList.remove('flex');
		});
	}
}

/**
 * Abre el modal de imagen con navegación.
 */
function openImageModal(galleryArray, startIndex = 0) {
	if (!galleryArray || galleryArray.length === 0) return;

	currentImageModalGallery = galleryArray;
	currentImageModalIndex = startIndex;

	const modal = document.getElementById('imageModal');
	if (modal) {
		const img = modal.querySelector('img');
		if (img) {
			img.src = galleryArray[startIndex];
			img.onerror = () => {
				img.src = 'https://placehold.co/600x800/000/fff?text=Error';
			};
		}

		modal.classList.remove('hidden');
		modal.classList.add('flex');

		// Actualizar contador
		const counter = modal.querySelector('.image-counter');
		if (counter) {
			counter.textContent = `${startIndex + 1} / ${galleryArray.length}`;
		}
	}
}

// All functions above are available in global scope automatically when script loads

