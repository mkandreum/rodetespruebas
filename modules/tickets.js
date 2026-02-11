/**
 * modules/tickets.js
 * Funciones relacionadas con entradas (ticketing)
 */

/**
 * Sincroniza los contadores de entradas vendidas en appState.events
 * con los datos reales de allTickets.
 */
function syncTicketCounters() {
	if (!appState || !Array.isArray(appState.events)) return;
	if (!Array.isArray(allTickets)) return;

	appState.events.forEach(event => {
		if (!event) return;
		const ticketsForEvent = allTickets.filter(t => t && t.eventId === event.id);
		const totalSold = ticketsForEvent.reduce((sum, t) => sum + (t.quantity || 1), 0);
		event.ticketsSold = totalSold;
	});

	console.log("Ticket counters synced.");
}

/**
 * Maneja el envío del formulario de email.
 */
async function handleEmailSubmit(e) {
	e.preventDefault();
	if (!emailForm || !appState || !appState.events) return;

	const selectedEventId = parseInt(emailForm['event-select'].value, 10);
	const userEmail = emailForm['email'].value.trim().toLowerCase();
	const userName = emailForm['name'].value.trim();
	const userSurname = emailForm['surname'].value.trim();
	const quantity = parseInt(emailForm['quantity'].value, 10);

	// Validaciones
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(userEmail)) {
		showInfoModal("POR FAVOR, INTRODUCE UN EMAIL VÁLIDO.", true);
		return;
	}
	if (!userName || !userSurname) {
		showInfoModal("POR FAVOR, INTRODUCE TU NOMBRE Y APELLIDOS.", true);
		return;
	}
	if (quantity < 1 || quantity > 10) {
		showInfoModal("LA CANTIDAD DEBE ESTAR ENTRE 1 Y 10.", true);
		return;
	}

	// Validar disponibilidad
	const event = appState.events.find(e => e.id === selectedEventId);
	if (!event) {
		showInfoModal("Evento no encontrado.", true);
		return;
	}

	const capacity = event.ticketCapacity || 0;
	const sold = event.ticketsSold || 0;
	if (capacity > 0 && sold + quantity > capacity) {
		showInfoModal(`No hay suficientes entradas. Disponibles: ${capacity - sold}`, true);
		return;
	}

	// Llamar a generateTicket que maneja todo el flujo
	await generateTicket(selectedEventId, userName, userSurname, userEmail, quantity);
}

/**
 * Descarga el contenido del modal del ticket como imagen PNG.
 * Extraído de app-old-broken.js líneas 5987-6018
 */
async function handleDownloadTicket() {
	const ticketToDownload = document.getElementById('ticketToDownload');
	const downloadTicketBtn = document.getElementById('downloadTicketBtn');

	if (!ticketToDownload || typeof html2canvas === 'undefined' || !downloadTicketBtn) {
		showInfoModal("Error: No se pudo iniciar la descarga (faltan elementos).", true); return;
	}

	const eventName = downloadTicketBtn.dataset.eventName || 'evento';
	const holderName = downloadTicketBtn.dataset.holderName || 'comprador'; // Nuevo
	const safeEventName = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
	const safeHolderName = holderName.replace(/[^a-z0-9_]/gi, '').toLowerCase(); // Permitir guión bajo

	showLoading(true);
	try {
		const canvas = await html2canvas(ticketToDownload, { scale: 2, backgroundColor: "#000000" }); // Fondo negro
		const dataUrl = canvas.toDataURL('image/png');
		const link = document.createElement('a');
		link.href = dataUrl;
		// MODIFICADO: Añadir nombre al archivo
		link.download = `entrada_rodetes_${safeHolderName}_${safeEventName}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		// No revokeObjectURL para data URLs

		showLoading(false);
		// No mostramos modal de éxito aquí, ya se mostró al generar/recuperar el ticket.

	} catch (error) {
		console.error("Error downloading ticket image:", error);
		showLoading(false);
		showInfoModal("Error al descargar la imagen de la entrada.", true);
	}
}

/**
 * Obtiene los tickets de un evento.
 */
function getEventTickets(eventId) {
	return allTickets.filter(t => t && t.eventId === eventId);
}

/**
 * Obtiene los detalles de un ticket por ID.
 */
function getTicketById(ticketId) {
	return allTickets.find(t => t && t.ticketId === ticketId);
}

/**
 * Valida si un email es válido.
 */
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Genera un ticket nuevo y lo guarda.
 * Extraído de app-old-broken.js líneas 5814-5895
 */
async function generateTicket(eventId, userName, userSurname, userEmail, quantity) {
	if (!appState || !appState.events || !allTickets) return; // Comprobación robusta

	const eventIndex = appState.events.findIndex(ev => ev.id === eventId);
	if (eventIndex === -1) {
		showInfoModal("Error crítico: Evento no encontrado al generar ticket.", true); return;
	}
	const event = appState.events[eventIndex];

	let ticketId = null; // <-- CORRECCIÓN: Declarar ticketId aquí para scope

	showLoading(true);
	try {
		ticketId = crypto.randomUUID(); // Asignar el ID
		const fullName = `${userName} ${userSurname}`; // Combinar nombre

		// Crear objeto del nuevo ticket
		const newTicket = {
			ticketId: ticketId,
			eventId: event.id,
			// NUEVO: Guardar nombre y apellidos
			nombre: userName,
			apellidos: userSurname,
			email: userEmail,
			quantity: quantity
		};
		if (!Array.isArray(allTickets)) allTickets = []; // Asegurar array
		allTickets.push(newTicket); // Añadir al array global de tickets ANTES de calcular el nuevo total

		// Actualizar contador 'ticketsSold' en appState.events de forma segura
		// Recalcular la suma total de cantidades para este evento DESPUÉS de añadir el nuevo ticket
		const newTotalQuantitySold = allTickets
			.filter(t => t.eventId === eventId)
			.reduce((sum, t) => sum + (t.quantity || 0), 0);

		appState.events[eventIndex].ticketsSold = newTotalQuantitySold; // Sobrescribir con la suma correcta
		currentEvents = [...appState.events]; // Actualizar copia local

		// CORRECCIÓN: Guardar SÓLO el estado de los tickets (saveTicketState).
		// Un usuario normal NO PUEDE llamar a saveAppState() (que usa save.php)
		// y eso causaba el error 403 Forbidden.
		await saveTicketState();

		// Re-renderizar UI si el admin está logueado
		if (isLoggedIn) {
			renderAdminEvents(currentEvents);
			renderGiveawayEvents(currentEvents);
		}
		// Re-renderizar UI pública
		renderPublicEvents(currentEvents);
		renderHomeEvents(currentEvents);

		console.log(`Ticket NUEVO generado: ${quantity} para ${event.name} -> ${fullName} (${userEmail}) (ID: ${ticketId})`);

		// Mostrar el modal del QR
		// MODIFICADO: Pasar nombre completo al mostrar modal
		displayTicketModal(event, ticketId, userEmail, quantity, fullName);

	} catch (error) {
		console.error("Error generando ticket:", error);

		// CORRECCIÓN: El 'ticketId' ahora es accesible aquí
		if (ticketId) { // Solo intentar quitar si se generó un ID
			const addedTicketIndex = allTickets.findIndex(t => t.ticketId === ticketId);
			if (addedTicketIndex > -1) {
				allTickets.splice(addedTicketIndex, 1); // Quitar el ticket si falló el guardado
				// Recalcular contador si se quita el ticket? Sí, por consistencia local.
				const eventIndexFallback = appState.events.findIndex(ev => ev.id === eventId);
				if (eventIndexFallback > -1) {
					const fallbackTotal = allTickets
						.filter(t => t.eventId === eventId)
						.reduce((sum, t) => sum + (t.quantity || 0), 0);
					appState.events[eventIndexFallback].ticketsSold = fallbackTotal;
					currentEvents = [...appState.events];
				}
			}
		}
		showInfoModal("Error al generar tu entrada. Inténtalo de nuevo más tarde.", true);
	} finally {
		showLoading(false);
	}
}

/**
 * Muestra el modal con los detalles del ticket y el QR.
 * Extraído de app-old-broken.js líneas 5906-5980
 */
function displayTicketModal(event, ticketId, userEmail, quantity, fullName) {
	const ticketModal = document.getElementById('ticketModal');
	const ticketQrCode = document.getElementById('ticketQrCode');
	const downloadTicketBtn = document.getElementById('downloadTicketBtn');
	const ticketHolderName = document.getElementById('ticketHolderName');
	const ticketEventName = document.getElementById('ticketEventName');
	const ticketEventDate = document.getElementById('ticketEventDate');
	const ticketQuantityDetails = document.getElementById('ticketQuantityDetails');
	const loadingModal = document.getElementById('loadingModal');

	if (!event || !ticketId || !userEmail || quantity <= 0 || !fullName || !ticketModal || !ticketQrCode || !downloadTicketBtn || !ticketHolderName) {
		console.error("Faltan datos o elementos para mostrar el modal del ticket.");
		showInfoModal("Error al mostrar los detalles de tu entrada.", true);
		if (loadingModal && !loadingModal.classList.contains('hidden')) showLoading(false); // Asegurar quitar loading si falla aquí
		return;
	}

	try {
		// Referencias a los nuevos elementos del cartel
		const ticketEventPosterContainer = document.getElementById('ticket-event-poster-container');
		const ticketEventPosterImg = document.getElementById('ticket-event-poster-img');

		// Configurar logo del ticket
		const ticketLogoImg = document.getElementById('ticket-logo-img');
		if (ticketLogoImg) {
			const logoUrl = appState.ticketLogoUrl || '';
			ticketLogoImg.src = logoUrl;
			ticketLogoImg.onerror = () => { ticketLogoImg.classList.add('hidden'); };
			ticketLogoImg.classList.toggle('hidden', !logoUrl);
		}

		// --- NUEVO: Cartel del evento ---
		if (ticketEventPosterImg && ticketEventPosterContainer) {
			const posterUrl = event.posterImageUrl || '';
			if (posterUrl) {
				ticketEventPosterImg.src = posterUrl;
				ticketEventPosterImg.style.display = 'block';
				// Aseguramos que el contenedor esté visible y limpio de la clase 'hidden'
				ticketEventPosterContainer.classList.remove('hidden');
			} else {
				ticketEventPosterImg.src = '';
				ticketEventPosterImg.style.display = 'none';
				ticketEventPosterContainer.classList.add('hidden');
			}
		}
		// --- FIN NUEVO ---

		// Rellenar detalles del evento y nombre
		const eventDate = event.date ? new Date(event.date).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha N/A';
		// NUEVO: Mostrar nombre completo
		ticketHolderName.textContent = fullName;
		if (ticketEventName) ticketEventName.textContent = event.name || 'Evento';
		if (ticketEventDate) ticketEventDate.textContent = eventDate;
		if (ticketQuantityDetails) ticketQuantityDetails.textContent = `Cantidad: ${quantity}`;

		// Generar QR
		ticketQrCode.innerHTML = ''; // Limpiar anterior
		// MODIFICADO: Añadir NOMBRE al QR text
		const qrText = `TICKET_ID:${ticketId}`;

		if (typeof QRCode !== 'undefined') {
			new QRCode(ticketQrCode, {
				text: qrText,
				width: 200, height: 200,
				colorDark: "#000000", colorLight: "#ffffff",
				correctLevel: QRCode.CorrectLevel.M // Nivel M
			});
		} else {
			ticketQrCode.innerHTML = '<p class="text-red-500 font-pixel">Error: QR no cargado</p>';
		}

		// Configurar botón de descarga
		downloadTicketBtn.dataset.eventName = event.name || 'evento'; // Para nombre archivo
		// NUEVO: Guardar nombre para nombre archivo
		downloadTicketBtn.dataset.holderName = fullName.replace(/\s+/g, '_'); // Reemplazar espacios

		ticketModal.classList.remove('hidden'); // Mostrar modal

	} catch (error) {
		console.error("Error displaying ticket modal:", error);
		showInfoModal("Error al mostrar los detalles de tu entrada.", true);
		if (loadingModal && !loadingModal.classList.contains('hidden')) showLoading(false); // Asegurar quitar loading
	}
}

/**
 * Elimina un ticket del sistema.
 * Extraído de app-old-broken.js líneas 4888-4959
 */
async function handleDeleteTicket(e) {
	const ticketId = e.target.dataset.ticketId;
	const ticketListModal = document.getElementById('ticketListModal');
	const ticketListTitle = document.getElementById('ticketListTitle');

	if (!ticketId || !allTickets || !appState || !appState.events) return;

	const ticketIndex = allTickets.findIndex(t => t.ticketId === ticketId);
	if (ticketIndex === -1) {
		showInfoModal("Error: Entrada no encontrada para eliminar.", true); return;
	}

	const ticketToDelete = allTickets[ticketIndex];
	const eventId = ticketToDelete.eventId;
	const quantityToDelete = ticketToDelete.quantity || 0;
	const email = ticketToDelete.email || 'esta entrada';

	// Simulación de confirmación
	console.warn(`Simulando confirmación para eliminar ticket: ${email} (ID: ${ticketId})`);
	showLoading(true);
	try {
		// Eliminar ticket de allTickets
		allTickets.splice(ticketIndex, 1);

		// Actualizar contador ticketsSold en appState.events
		const eventIndex = appState.events.findIndex(ev => ev.id === eventId);
		if (eventIndex > -1) {
			// Asegurar que el contador existe y restar cantidad
			if (typeof appState.events[eventIndex].ticketsSold === 'number') {
				appState.events[eventIndex].ticketsSold = Math.max(0, appState.events[eventIndex].ticketsSold - quantityToDelete); // Evitar negativos
			} else {
				appState.events[eventIndex].ticketsSold = 0; // Si no existía, poner a 0
			}
			currentEvents = [...appState.events]; // Actualizar copia local
		} else {
			console.warn(`Evento ${eventId} no encontrado al intentar actualizar contador tras borrar ticket ${ticketId}.`);
		}

		// Guardar AMBOS estados
		await Promise.all([
			saveAppState(),
			saveTicketState()
		]);

		showLoading(false);
		showInfoModal(`ENTRADA DE ${email} ELIMINADA.`, false);

		// Re-renderizar lista de tickets en el modal si sigue abierto
		if (ticketListModal && !ticketListModal.classList.contains('hidden') && ticketListTitle) {
			// Reconstruir título para obtener ID del evento actual
			const titleText = ticketListTitle.textContent || '';
			const currentEventInModal = appState.events.find(ev => titleText.includes(ev.name || `Evento ${ev.id}`)); // Intenta encontrar evento por nombre en título
			if (currentEventInModal && currentEventInModal.id === eventId) {
				// Si el modal abierto es del evento afectado, recargar su contenido
				handleViewTickets({ target: { dataset: { eventId: eventId.toString() } } }); // Simular click en "Ver Lista"
			} else {
				// Si no se puede determinar o es de otro evento, cerrar modal por seguridad
				closeModal('ticket-list-modal');
			}
		}
		// Re-renderizar lista de eventos admin (para actualizar contador)
		renderAdminEvents(currentEvents);
		// Re-renderizar lista pública/home (para actualizar contador visual si afecta botón AGOTADO)
		renderPublicEvents(currentEvents);
		renderHomeEvents(currentEvents);
		// Re-renderizar sorteo
		renderGiveawayEvents(currentEvents);

	} catch (error) {
		showLoading(false);
		console.error("Error deleting ticket:", error);
		// Revertir cambios en memoria? Complicado. Mostrar error.
		showInfoModal("Error al eliminar la entrada: " + error.message, true);
	}
}


