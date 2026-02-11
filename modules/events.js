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
				renderAdminEvents(appState.events);
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

	const eventToDelete = appState.events.find(e => e.id === eventId);
	if (!eventToDelete) return;

	if (!confirm(`¿ESTÁS SEGURO DE QUE QUIERES ELIMINAR EL EVENTO "${eventToDelete.name || 'sin nombre'}"?`)) {
		return;
	}

	showLoading(true, "Eliminando evento...");

	try {
		appState.events = appState.events.filter(e => e.id !== eventId);
		const saveResult = await saveAppState();
		showLoading(false);

		if (saveResult.ok) {
			showInfoModal("EVENTO ELIMINADO CORRECTAMENTE.", false, () => {
				renderAdminEvents(appState.events);
			});
		}
	} catch (error) {
		showLoading(false);
		console.error("Error eliminando evento:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Maneja el archivado de un evento.
 */
async function handleArchiveEvent(e) {
	const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
	if (!appState?.events) return;

	const event = appState.events.find(e => e.id === eventId);
	if (!event) return;

	if (!confirm(`¿ARCHIVAR EL EVENTO "${event.name || 'sin nombre'}"?`)) {
		return;
	}

	showLoading(true, "Archivando evento...");

	try {
		event.isArchived = true;
		const saveResult = await saveAppState();
		showLoading(false);

		if (saveResult.ok) {
			showInfoModal("EVENTO ARCHIVADO.", false, () => {
				renderAdminEvents(appState.events);
			});
		}
	} catch (error) {
		showLoading(false);
		console.error("Error archivando evento:", error);
		showInfoModal(`Error: ${error.message}`, true);
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

// Export functions
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		renderAdminEvents,
		handleSaveEvent,
		resetEventForm,
		handleEditEventClick,
		handleDeleteEvent,
		handleArchiveEvent,
		handleGetTicket,
		getEventById,
		getActiveEvents,
		getPastEvents
	};
}
