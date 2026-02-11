/**
 * modules/navigation.js
 * Navegación entre páginas y gestión de elementos DOM
 */

/**
 * Cambia a una página específica.
 */
function showPage(pageId) {
	// Ocultar todas las páginas
	document.querySelectorAll('[data-page]').forEach(page => {
		page.classList.add('hidden');
		page.classList.remove('page-fade-in');
	});

	// Buscar página por data-page attribute
	const pageElement = document.querySelector(`[data-page="${pageId}"]`);
	
	if (pageElement) {
		pageElement.classList.remove('hidden');
		void pageElement.offsetWidth; // Trigger reflow for animation
		pageElement.classList.add('page-fade-in');
	} else {
		console.warn(`Página "${pageId}" no encontrada. Mostrando 'home'.`);
		const homePage = document.querySelector('[data-page="home"]');
		if (homePage) {
			homePage.classList.remove('hidden');
			homePage.classList.add('page-fade-in');
			pageId = 'home';
		}
	}

	// Cerrar menú móvil si está abierto
	const mobileMenu = document.getElementById('mobile-menu');
	if (mobileMenu) {
		mobileMenu.classList.add('hidden');
	}

	// Actualizar indicadores de navegación
	updateNavIndicator(pageId);

	// Ejecutar init específicos por página
	switch (pageId) {
		case 'home':
			if (typeof renderPastGalleries === 'function') renderPastGalleries(appState.events || []);
			if (typeof renderHomeEvents === 'function') renderHomeEvents(currentEvents);
			if (typeof renderBannerVideo === 'function') renderBannerVideo();
			if (typeof renderAppLogo === 'function') renderAppLogo();
			if (typeof renderNextEventPromo === 'function') renderNextEventPromo();
			if (typeof renderCountdown === 'function') renderCountdown();
			break;
		case 'events':
			if (typeof renderPublicEvents === 'function') renderPublicEvents(currentEvents);
			break;
		case 'tickets':
			if (typeof syncTicketCounters === 'function') syncTicketCounters();
			break;
		case 'merch':
			if (typeof renderMerchPage === 'function') renderMerchPage();
			break;
		case 'gallery':
			if (typeof renderGalleryEventList === 'function') renderGalleryEventList();
			break;
		case 'scanner':
			if (typeof startScanner === 'function') startScanner();
			break;
		case 'drags':
			if (typeof renderDragList === 'function') renderDragList();
			break;
		case 'admin':
			if (typeof checkAdminUI === 'function') checkAdminUI();
			// Show events admin page by default
			if (typeof showAdminPage === 'function') showAdminPage('events');
			break;
	}

	// Scroll al top
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Actualiza los indicadores visuales de navegación.
 */
function updateNavIndicator(currentPage) {
	// Actualizar todos los enlaces de navegación (bottom pill nav y mobile menu)
	document.querySelectorAll('[data-nav]').forEach(link => {
		if (link.dataset.nav === currentPage) {
			link.classList.add('active');
		} else {
			link.classList.remove('active');
		}
	});

	// Mover el indicador de la barra inferior si existe
	const navActiveIndicator = document.querySelector('.nav-active-indicator');
	const bottomPillNav = document.getElementById('bottom-pill-nav');
	
	if (navActiveIndicator && bottomPillNav) {
		const activeLink = bottomPillNav.querySelector(`[data-nav="${currentPage}"]`);
		if (activeLink) {
			const rect = activeLink.getBoundingClientRect();
			const navRect = bottomPillNav.getBoundingClientRect();
			const left = rect.left - navRect.left;
			const width = rect.width;
			
			navActiveIndicator.style.left = `${left}px`;
			navActiveIndicator.style.width = `${width}px`;
		}
	}
}

/**
 * Muestra la página de administrador.
 */
function showAdminPage(adminPageId) {
	// Hide all admin pages
	document.querySelectorAll('[data-admin-page]').forEach(page => {
		page.classList.add('hidden');
	});

	// Show selected admin page
	const selectedPage = document.querySelector(`[data-admin-page="${adminPageId}"]`);
	if (selectedPage) {
		selectedPage.classList.remove('hidden');
	} else {
		console.warn(`Admin page "${adminPageId}" not found. Showing 'events'.`);
		const eventsPage = document.querySelector('[data-admin-page="events"]');
		if (eventsPage) {
			eventsPage.classList.remove('hidden');
			adminPageId = 'events';
		}
	}

	// Update nav button styles
	document.querySelectorAll('[data-admin-nav]').forEach(btn => {
		btn.classList.remove('bg-white', 'text-black');
		btn.classList.add('bg-gray-700', 'text-white', 'hover:bg-gray-600');
	});

	const activeBtn = document.querySelector(`[data-admin-nav="${adminPageId}"]`);
	if (activeBtn) {
		activeBtn.classList.add('bg-white', 'text-black');
		activeBtn.classList.remove('bg-gray-700', 'text-white', 'hover:bg-gray-600');
	}

	// Re-render dynamic content when changing admin tabs
	if (adminPageId === 'events') {
		if (typeof renderAdminEvents === 'function') renderAdminEvents(currentEvents);
	}
	if (adminPageId === 'drags') {
		if (typeof renderAdminDrags === 'function') renderAdminDrags(appState.drags);
	}
	if (adminPageId === 'merch') {
		if (typeof renderAdminMerch === 'function') renderAdminMerch();
		if (typeof renderWebMerchList === 'function') renderWebMerchList();
		if (typeof renderWebMerchSalesSummary === 'function') renderWebMerchSalesSummary();
		if (typeof renderDragMerchSelect === 'function') renderDragMerchSelect();
		if (typeof renderDragMerchSalesSummary === 'function') renderDragMerchSalesSummary();
	}
	if (adminPageId === 'smtp') {
		if (typeof renderSMTPConfig === 'function') renderSMTPConfig();
		if (typeof renderEmailNotifications === 'function') renderEmailNotifications();
	}
	if (adminPageId === 'giveaway') {
		if (typeof renderGiveawayEvents === 'function') renderGiveawayEvents(currentEvents);
	}
	if (adminPageId === 'gallery' || adminPageId === 'settings') {
		if (typeof loadContentToAdmin === 'function') loadContentToAdmin();
	}

	// Reset forms when leaving their tab while editing
	if (adminPageId !== 'events' && editingEventId !== null) {
		if (typeof resetEventForm === 'function') resetEventForm();
	}
	if (adminPageId !== 'drags' && editingDragId !== null) {
		if (typeof resetDragForm === 'function') resetDragForm();
	}
	if (adminPageId !== 'merch' && editingMerchItemId !== null) {
		if (typeof resetMerchItemForm === 'function') resetMerchItemForm();
	}
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

