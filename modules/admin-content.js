/**
 * modules/admin-content.js
 * Admin content management: logos, banners, galleries, countdown, promo
 */

/**
 * Carga los datos actuales del appState en los formularios de admin (Contenido, Galerías).
 */
function loadContentToAdmin() {
	if (!appState) return;

	// Referencias a elementos del DOM
	const appLogoUrlInput = document.getElementById('appLogoUrl');
	const ticketLogoUrlInput = document.getElementById('ticketLogoUrl');
	const bannerUrlInput = document.getElementById('bannerUrl');
	const promoEnableCheckbox = document.getElementById('promo-enable');
	const promoTextInput = document.getElementById('promo-text');
	const promoNeonColorInput = document.getElementById('promo-neon-color');
	const countdownEnableCheckbox = document.getElementById('countdown-enable');
	const countdownTitleInput = document.getElementById('countdown-title');
	const countdownTargetDateInput = document.getElementById('countdown-target-date');
	const countdownDateTextInput = document.getElementById('countdown-date-text');
	const galleryEventSelect = document.getElementById('galleryEventSelect');
	const adminGalleryPreviewGrid = document.getElementById('admin-gallery-preview-grid');

	// Sección Contenido
	if (appLogoUrlInput) appLogoUrlInput.value = appState.appLogoUrl || '';
	if (ticketLogoUrlInput) ticketLogoUrlInput.value = appState.ticketLogoUrl || '';
	if (bannerUrlInput) bannerUrlInput.value = appState.bannerVideoUrl || '';
	if (promoEnableCheckbox) promoEnableCheckbox.checked = appState.promoEnabled || false;
	if (promoTextInput) {
		const defaultTemplate = '¡PRÓXIMO EVENTO: {eventName} - {eventDate}! Consigue tus entradas ya.';
		promoTextInput.value = appState.promoCustomText || defaultTemplate;
	}
	if (promoNeonColorInput) promoNeonColorInput.value = appState.promoNeonColor || '#F02D7D';

	if (countdownEnableCheckbox) countdownEnableCheckbox.checked = appState.countdownEnabled === true;
	if (countdownTitleInput) countdownTitleInput.value = appState.countdownTitle || '';
	if (countdownTargetDateInput) countdownTargetDateInput.value = appState.countdownTargetDate || '';
	if (countdownDateTextInput) countdownDateTextInput.value = appState.countdownDateText || '';
	
	const domainsInput = document.getElementById('allowed-domains-input');
	if (domainsInput) {
		domainsInput.value = (appState.allowedDomains || []).join('\n');
	}

	// Sección Galerías
	if (galleryEventSelect) {
		const currentSelectedId = galleryEventSelect.value;
		galleryEventSelect.innerHTML = '<option value="">-- SELECCIONA UN EVENTO --</option>';

		// Limpiar rejilla al recargar el select
		if (adminGalleryPreviewGrid) {
			adminGalleryPreviewGrid.innerHTML = `<p class="text-gray-500 font-pixel text-center col-span-full self-center">Selecciona un evento para ver/añadir imágenes.</p>`;
		}
		const hiddenGalleryInput = document.getElementById('gallery-urls-input');
		if (hiddenGalleryInput) hiddenGalleryInput.value = '';

		// Poblar select con eventos ordenados por fecha
		const sortedEvents = [...(appState.events || [])]
			.sort((a, b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);

		sortedEvents.forEach(event => {
			const option = document.createElement('option');
			option.value = event.id;
			const dateStr = event.date ? new Date(event.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Fecha N/A';
			option.textContent = `${event.name || `Evento ${event.id}`} (${dateStr})${event.isArchived ? ' (Archivado)' : ''}`;
			galleryEventSelect.appendChild(option);
		});

		// Restaurar selección si aún existe
		if (currentSelectedId && galleryEventSelect.querySelector(`option[value="${currentSelectedId}"]`)) {
			galleryEventSelect.value = currentSelectedId;
			handleGalleryEventSelect();
		}
	}
}

/**
 * Guarda los cambios de contenido general (logos, banner, promo, dominios).
 */
async function handleSaveContent(e) {
	e.preventDefault();
	const contentManageForm = document.getElementById('contentManageForm');
	if (!contentManageForm || !appState) return;

	const appLogoUrlInput = document.getElementById('appLogoUrl');
	const ticketLogoUrlInput = document.getElementById('ticketLogoUrl');
	const bannerUrlInput = document.getElementById('bannerUrl');
	const promoEnableCheckbox = document.getElementById('promo-enable');
	const promoTextInput = document.getElementById('promo-text');
	const promoNeonColorInput = document.getElementById('promo-neon-color');
	const countdownEnableCheckbox = document.getElementById('countdown-enable');
	const countdownTitleInput = document.getElementById('countdown-title');
	const countdownTargetDateInput = document.getElementById('countdown-target-date');
	const countdownDateTextInput = document.getElementById('countdown-date-text');

	// Recoger valores
	const newAppLogoUrl = appLogoUrlInput?.value.trim() || '';
	const newTicketLogoUrl = ticketLogoUrlInput?.value.trim() || '';
	const newBannerUrl = bannerUrlInput?.value.trim() || '';
	const newPromoEnabled = promoEnableCheckbox?.checked || false;
	const newPromoText = promoTextInput?.value.trim() || '';
	const newPromoNeonColor = promoNeonColorInput?.value.trim() || '#F02D7D';

	const newCountdownEnabled = countdownEnableCheckbox?.checked || false;
	const newCountdownTitle = countdownTitleInput?.value.trim() || '';
	const newCountdownTargetDate = countdownTargetDateInput?.value || '';
	const newCountdownDateText = countdownDateTextInput?.value.trim() || '';

	const domainsInput = document.getElementById('allowed-domains-input');
	const newAllowedDomains = (domainsInput?.value || '')
		.split('\n')
		.map(d => d.trim().toLowerCase())
		.filter(d => d.startsWith('@'));

	if (typeof showLoading === 'function') showLoading(true);
	try {
		// Validar URLs
		const validateUrl = (url, fieldName) => {
			if (url && !/^(https?:\/\/|uploads\/|data:)/i.test(url)) {
				throw new Error(`URL de ${fieldName} no válida. Debe empezar con http://, https://, uploads/ o data:.`);
			}
		};

		validateUrl(newAppLogoUrl, "Logo Principal");
		validateUrl(newTicketLogoUrl, "Logo de Entrada");
		validateUrl(newBannerUrl, "Banner");

		// Validar Color Hex
		if (!/^#[0-9A-F]{6}$/i.test(newPromoNeonColor)) {
			throw new Error("El color neón debe ser un código hexadecimal válido (ej: #F02D7D).");
		}

		// Actualizar appState
		appState.appLogoUrl = newAppLogoUrl;
		appState.ticketLogoUrl = newTicketLogoUrl;
		appState.bannerVideoUrl = newBannerUrl;
		appState.promoEnabled = newPromoEnabled;
		appState.promoCustomText = newPromoText;
		appState.promoNeonColor = newPromoNeonColor;

		appState.countdownEnabled = newCountdownEnabled;
		appState.countdownTitle = newCountdownTitle;
		appState.countdownTargetDate = newCountdownTargetDate;
		appState.countdownDateText = newCountdownDateText;

		appState.allowedDomains = newAllowedDomains;

		// Guardar en servidor
		if (typeof saveAppState === 'function') await saveAppState();

		// Re-renderizar elementos afectados
		if (typeof renderAppLogo === 'function') renderAppLogo();
		if (typeof renderBannerVideo === 'function') renderBannerVideo();
		if (typeof renderNextEventPromo === 'function') renderNextEventPromo();

		if (typeof showInfoModal === 'function') {
			showInfoModal("¡CONTENIDO GENERAL ACTUALIZADO!", false);
		}

		// Limpiar inputs de archivo
		const appLogoUploadInput = document.getElementById('appLogoUploadInput');
		const ticketLogoUploadInput = document.getElementById('ticketLogoUploadInput');
		const bannerUploadInput = document.getElementById('bannerUploadInput');
		if (appLogoUploadInput) appLogoUploadInput.value = '';
		if (ticketLogoUploadInput) ticketLogoUploadInput.value = '';
		if (bannerUploadInput) bannerUploadInput.value = '';

	} catch (error) {
		console.error("Error saving content:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al guardar: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Guarda la galería de un evento.
 */
async function handleSaveGallery(e) {
	e.preventDefault();
	const hiddenGalleryInput = document.getElementById('gallery-urls-input');
	const galleryEventSelect = document.getElementById('galleryEventSelect');
	const galleryUploadInput = document.getElementById('galleryUploadInput');

	if (!galleryEventSelect || !hiddenGalleryInput || !appState || !appState.events) return;

	const eventId = parseInt(galleryEventSelect.value, 10);
	if (isNaN(eventId)) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Selecciona un evento para guardar la galería.", true);
		}
		return;
	}

	const eventIndex = appState.events.findIndex(e => e.id === eventId);
	if (eventIndex === -1) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Evento no encontrado.", true);
		}
		return;
	}

	// Obtener URLs del input oculto
	const newGalleryUrls = (hiddenGalleryInput.value || '')
		.split('\n')
		.filter(url => url);

	// Obtener Thumbnails
	const hiddenThumbnailInput = document.getElementById('gallery-thumbnails-input');
	const newThumbnailUrls = (hiddenThumbnailInput?.value || '')
		.split('\n')
		.filter(url => url);

	if (typeof showLoading === 'function') showLoading(true);
	try {
		// Actualizar galería en el evento
		if (!appState.events[eventIndex].galleryImages) {
			appState.events[eventIndex].galleryImages = [];
		}
		appState.events[eventIndex].galleryImages = newGalleryUrls;
		appState.events[eventIndex].galleryThumbnails = newThumbnailUrls;

		// Guardar estado completo
		if (typeof saveAppState === 'function') await saveAppState();

		// Re-renderizar vistas afectadas
		if (typeof renderGalleryEventList === 'function') renderGalleryEventList();
		if (typeof renderPastGalleries === 'function') renderPastGalleries(appState.events);
		if (typeof renderGalleryImages === 'function') {
			// Si estamos viendo esa galería, re-renderizarla
			const galleryImageViewContainer = document.getElementById('galleryImageViewContainer');
			const galleryImageViewTitle = document.getElementById('galleryImageViewTitle');
			if (galleryImageViewContainer && !galleryImageViewContainer.classList.contains('hidden')) {
				const currentGalleryTitle = galleryImageViewTitle?.textContent;
				const eventName = appState.events[eventIndex].name;
				if (currentGalleryTitle === eventName) {
					renderGalleryImages(eventId);
				}
			}
		}

		if (typeof showInfoModal === 'function') {
			showInfoModal("¡GALERÍA GUARDADA!", false);
		}
		if (galleryUploadInput) galleryUploadInput.value = '';

	} catch (error) {
		console.error("Error saving gallery:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al guardar la galería: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Carga las URLs de la galería del evento seleccionado.
 */
function handleGalleryEventSelect() {
	const galleryEventSelect = document.getElementById('galleryEventSelect');
	const adminGalleryPreviewGrid = document.getElementById('admin-gallery-preview-grid');
	const galleryUploadInput = document.getElementById('galleryUploadInput');

	if (!galleryEventSelect || !adminGalleryPreviewGrid || !appState || !appState.events) {
		console.error("Faltan elementos para manejar la selección de evento de galería.");
		return;
	}

	const eventId = parseInt(galleryEventSelect.value, 10);
	const hiddenInputId = 'gallery-urls-input';
	const containerId = 'admin-gallery-preview-grid';

	let imageUrls = [];
	let thumbnailUrls = [];

	if (!isNaN(eventId)) {
		const event = appState.events.find(e => e.id === eventId);
		imageUrls = event?.galleryImages || [];
		thumbnailUrls = event?.galleryThumbnails || [];
	}

	// Pre-popular el input de thumbnails
	const thumbnailInput = document.getElementById('gallery-thumbnails-input');
	if (thumbnailInput) {
		thumbnailInput.value = thumbnailUrls.join('\n');
	}

	// Renderizar la rejilla
	if (typeof renderAdminGalleryGrid === 'function') {
		renderAdminGalleryGrid(containerId, hiddenInputId, imageUrls, 'gallery-thumbnails-input');
	}

	// Limpiar input file
	if (galleryUploadInput) galleryUploadInput.value = '';
}

// All functions above are available in global scope automatically when script loads
