/**
 * modules/events.js
 * Gestión de eventos (crear, editar, eliminar, archivar) Y renderizado admin
 */

/**
 * Renderiza la lista de eventos en el panel admin con filtros.
 */
function renderAdminEvents(events) {
	clearDynamicListListeners('adminEvents');
	const adminEventsContainer = document.getElementById('admin-events-list-container');

	if (!adminEventsContainer || !Array.isArray(events)) {
		console.error("Admin events container not found or invalid events");
		return;
	}

	adminEventsContainer.innerHTML = '';

	const filteredEvents = events.filter(e => {
		if (!e) return false;
		if (currentEventFilter === 'upcoming') {
			return new Date(e.date) > new Date();
		} else if (currentEventFilter === 'past') {
			return new Date(e.date) < new Date();
		}
		return true;
	});

	if (filteredEvents.length === 0) {
		adminEventsContainer.innerHTML = `<p class="text-gray-400 font-pixel col-span-full text-center">No hay eventos en este filtro.</p>`;
		return;
	}

	filteredEvents.forEach(event => {
		try {
			const card = document.createElement('div');
			card.className = "bg-gray-900 border border-gray-700 rounded-none p-4 flex justify-between items-center";

			const eventDate = event.date ? new Date(event.date).toLocaleDateString('es-ES') : 'Sin fecha';
			const imageUrl = event.posterImageUrl || `https://placehold.co/80x80/000/fff?text=${encodeURIComponent(event.name || 'Evento')}&font=vt323`;
			const capacity = event.ticketCapacity || 0;
			const sold = event.ticketsSold || 0;

			card.innerHTML = `
				<div class="flex items-center gap-4 flex-grow">
					<img src="${imageUrl}" alt="${event.name}" class="w-16 h-16 object-cover rounded-none border border-gray-600">
					<div>
						<h4 class="text-lg font-pixel text-white">${event.name || 'Sin nombre'}</h4>
						<p class="text-sm text-gray-400">${eventDate}</p>
						<p class="text-sm text-gray-500">Entradas: ${sold}/${capacity || '∞'}</p>
					</div>
				</div>
				<div class="flex gap-2">
					<button data-event-id="${event.id}" class="edit-event-btn px-3 py-1 bg-yellow-600 text-white font-pixel text-sm rounded-none hover:bg-yellow-700">EDITAR</button>
					<button data-event-id="${event.id}" class="delete-event-btn px-3 py-1 bg-red-600 text-white font-pixel text-sm rounded-none hover:bg-red-700">ELIMINAR</button>
				</div>
			`;

			adminEventsContainer.appendChild(card);
		} catch (e) {
			console.error(`Error renderizando evento ${event?.id}:`, e);
		}
	});

	adminEventsContainer.querySelectorAll('.edit-event-btn').forEach(btn => {
		addTrackedListener(btn, 'click', handleEditEventClick);
	});
	adminEventsContainer.querySelectorAll('.delete-event-btn').forEach(btn => {
		addTrackedListener(btn, 'click', handleDeleteEvent);
	});
}

/**
 * Maneja el guardado de un evento (crear o actualizar).
 */
async function handleSaveEvent(e) {
	e.preventDefault();
	if (!addEventForm || !appState) return;

	const eventName = addEventForm['event-name'].value.trim();
	const eventDate = addEventForm['event-date'].value;
	const eventPrice = parseFloat(addEventForm['event-price'].value) || 0;
	const eventCapacity = parseInt(addEventForm['event-capacity'].value, 10) || 0;
	const eventDescription = addEventForm['event-description'].value.trim();
	const eventPosterUrl = addEventForm['event-poster-url'].value.trim();

	if (!eventName || !eventDate) {
		showInfoModal("POR FAVOR, INTRODUCE NOMBRE Y FECHA.", true);
		return;
	}

	showLoading(true, "Guardando evento...");

	try {
		if (editingEventId) {
			const eventIndex = appState.events.findIndex(e => e.id === editingEventId);
			if (eventIndex !== -1) {
				appState.events[eventIndex] = {
					...appState.events[eventIndex],
					name: eventName,
					date: eventDate,
					price: eventPrice,
					ticketCapacity: eventCapacity,
					description: eventDescription,
					posterImageUrl: eventPosterUrl
				};
			}
		} else {
			const newEvent = {
				id: appState.nextEventId || 1,
				name: eventName,
				date: eventDate,
				price: eventPrice,
				ticketCapacity: eventCapacity,
				description: eventDescription,
				posterImageUrl: eventPosterUrl,
				galleryImages: [],
				galleryThumbnails: [],
				ticketsSold: 0,
				isArchived: false
			};
			appState.events.push(newEvent);
			appState.nextEventId = (appState.nextEventId || 1) + 1;
		}

		const saveResult = await saveAppState();
		showLoading(false);

		if (saveResult.ok) {
			showInfoModal("EVENTO GUARDADO CORRECTAMENTE.", false, () => {
				resetEventForm();
				// Re-renderizar todas las vistas afectadas (como en app-old-broken.js líneas 5539-5544)
				if (typeof renderPublicEvents === 'function') renderPublicEvents(appState.events);
				if (typeof renderHomeEvents === 'function') renderHomeEvents(appState.events);
				renderAdminEvents(appState.events);
				if (typeof renderGiveawayEvents === 'function') renderGiveawayEvents(appState.events);
				if (typeof renderNextEventPromo === 'function') renderNextEventPromo();
				if (typeof loadContentToAdmin === 'function') loadContentToAdmin(); // Recargar select de galerías
			});
		}
	} catch (error) {
		showLoading(false);
		console.error("Error guardando evento:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Resetea el formulario de eventos.
 */
function resetEventForm() {
	if (!addEventForm) return;
	addEventForm.reset();
	editingEventId = null;

	const clearPosterBtn = document.querySelector('[data-action="clear-event-poster"]');
	if (clearPosterBtn) clearPosterBtn.click();
}

/**
 * Maneja la edición de un evento.
 */
function handleEditEventClick(e) {
	const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
	if (!appState?.events) return;

	const eventToEdit = appState.events.find(e => e.id === eventId);
	if (!eventToEdit || !addEventForm) return;

	editingEventId = eventId;

	addEventForm['event-name'].value = eventToEdit.name || '';
	addEventForm['event-date'].value = eventToEdit.date || '';
	addEventForm['event-price'].value = eventToEdit.price || '';
	addEventForm['event-capacity'].value = eventToEdit.ticketCapacity || '';
	addEventForm['event-description'].value = eventToEdit.description || '';
	addEventForm['event-poster-url'].value = eventToEdit.posterImageUrl || '';

	if (addEventForm) {
		addEventForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}

/**
 * Maneja la eliminación de un evento.
 */
async function handleDeleteEvent(e) {
	const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
	if (!appState?.events) return;

	const eventIndex = appState.events.findIndex(e => e.id === eventId);
	if (eventIndex === -1) return;

	const eventToDelete = appState.events[eventIndex];
	const eventName = eventToDelete.name || 'este evento';

	if (!confirm(`¿ESTÁS SEGURO DE QUE QUIERES ELIMINAR EL EVENTO "${eventName}"?`)) {
		return;
	}

	// Simulación de confirmación
	console.warn(`Simulando confirmación para eliminar evento: ${eventName} (ID: ${eventId})`);
	showLoading(true);
	try {
		// Eliminar evento de appState
		appState.events.splice(eventIndex, 1);
		currentEvents = [...appState.events]; // Actualizar copia local

		// Filtrar tickets asociados
		const initialTicketCount = allTickets.length;
		allTickets = allTickets.filter(t => t.eventId !== eventId);
		const removedTicketCount = initialTicketCount - allTickets.length;
		if (removedTicketCount > 0) {
			console.log(`Eliminados ${removedTicketCount} tickets asociados al evento ${eventId}.`);
		}

		// Si se estaba editando este evento, resetear form
		if (editingEventId === eventId) {
			resetEventForm();
		}

		// Guardar ambos estados
		await saveAppState();
		await saveTicketState();

		showLoading(false);
		showInfoModal(`EVENTO "${eventName}" Y SUS ENTRADAS ELIMINADOS.`, false);

		// Re-renderizar TODO (como en app-old-broken.js líneas 5642-5649)
		if (typeof renderPublicEvents === 'function') renderPublicEvents(currentEvents);
		if (typeof renderHomeEvents === 'function') renderHomeEvents(currentEvents);
		renderAdminEvents(currentEvents);
		if (typeof renderGiveawayEvents === 'function') renderGiveawayEvents(currentEvents);
		if (typeof renderGalleryEventList === 'function') renderGalleryEventList();
		if (typeof renderPastGalleries === 'function') renderPastGalleries(currentEvents);
		if (typeof renderNextEventPromo === 'function') renderNextEventPromo();
		if (typeof loadContentToAdmin === 'function') loadContentToAdmin(); // Recargar selects

	} catch (error) {
		console.error("Error deleting event:", error);
		showLoading(false);
		showInfoModal("Error al eliminar el evento: " + error.message, true);
	}
}

/**
 * Maneja el archivado de un evento.
 */
async function handleArchiveEvent(e) {
	const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
	if (!appState?.events) return;

	const eventIndex = appState.events.findIndex(ev => ev.id === eventId);
	if (eventIndex === -1) return;

	const event = appState.events[eventIndex];
	const newArchivedState = !event.isArchived;
	const actionText = newArchivedState ? "archivar" : "desarchivar";

	if (!confirm(`¿Quieres ${actionText} el evento "${event.name || 'sin nombre'}"?`)) {
		return;
	}

	showLoading(true);
	try {
		appState.events[eventIndex].isArchived = newArchivedState;
		currentEvents = [...appState.events];
		await saveAppState();

		showLoading(false);
		const statusText = newArchivedState ? "archivado" : "activo";
		showInfoModal(`EVENTO "${event.name}" MARCADO COMO ${statusText.toUpperCase()}.`, false);

		// Re-renderizar vistas (como en app-old-broken.js líneas 5697-5701)
		if (typeof renderPublicEvents === 'function') renderPublicEvents(currentEvents);
		if (typeof renderHomeEvents === 'function') renderHomeEvents(currentEvents);
		renderAdminEvents(currentEvents);
		if (typeof loadContentToAdmin === 'function') loadContentToAdmin();

	} catch (error) {
		showLoading(false);
		console.error("Error al archivar evento:", error);
		showInfoModal("Error al cambiar el estado del evento: " + error.message, true);
	}
}

/**
 * Maneja el click en "Conseguir entrada" (usuario público).
 */
function handleGetTicket(e) {
	const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
	if (isNaN(eventId)) return;

	const event = appState?.events?.find(ev => ev.id === eventId);
	if (!event) return;

	if (emailForm) {
		emailForm.reset();
		emailForm['event-select'].value = eventId;
		if (emailForm['name']) emailForm['name'].focus();

		const emailModal = document.getElementById('get-ticket-modal');
		if (emailModal) emailModal.classList.remove('hidden');
	}
}

/**
 * Obtiene un evento por ID.
 */
function getEventById(eventId) {
	if (!appState || !appState.events) return null;
	return appState.events.find(e => e.id === eventId);
}

/**
 * Obtiene todos los eventos no archivados.
 */
function getActiveEvents() {
	return (appState?.events || []).filter(e => e && !e.isArchived);
}

/**
 * Obtiene eventos pasados.
 */
function getPastEvents() {
	const now = new Date();
	return (appState?.events || []).filter(e => e && e.date && new Date(e.date) < now);
}

// All functions above are available in global scope automatically when script loads

