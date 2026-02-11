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
	const userPhone = emailForm['phone'].value.trim();
	const quantity = parseInt(emailForm['quantity'].value, 10);

	// Validaciones
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(userEmail)) {
		showInfoModal("POR FAVOR, INTRODUCE UN EMAIL VÁLIDO.", true);
		return;
	}
	if (!userName) {
		showInfoModal("POR FAVOR, INTRODUCE TU NOMBRE.", true);
		return;
	}
	if (!userPhone) {
		showInfoModal("POR FAVOR, INTRODUCE TU TELÉFONO.", true);
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

	showLoading(true, "Procesando entrada...");

	try {
		// Generar ID único para la entrada
		const ticketId = `${selectedEventId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// Crear objeto de entrada
		const ticketEntry = {
			ticketId,
			eventId: selectedEventId,
			eventName: event.name,
			userName,
			userEmail,
			userPhone,
			quantity,
			purchaseDate: new Date().toISOString(),
			status: 'active'
		};

		// Añadir a array
		allTickets.push(ticketEntry);

		// Actualizar contador
		syncTicketCounters();

		// Guardar en servidor
		const saveResult = await saveTicketState();
		if (!saveResult.ok) {
			allTickets.pop(); // Revertir si falla
			showLoading(false);
			return;
		}

		// Enviar email
		const emailResponse = await fetch('email/send_email.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				eventId: selectedEventId,
				ticketId,
				userName,
				userEmail,
				userPhone,
				quantity,
				eventName: event.name
			})
		});

		const emailData = await emailResponse.json();
		showLoading(false);

		if (emailData.ok) {
			showInfoModal("¡ENTRADA CONFIRMADA! Revisa tu email para más información.", false, () => {
				emailForm.reset();
				renderPublicEvents(appState.events);
			});
		} else {
			showInfoModal(`Entrada creada, pero error al enviar email: ${emailData.message}`, true);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error procesando entrada:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Maneja la descarga del ticket en PDF.
 */
async function handleDownloadTicket() {
	// Esta función requiere que haya un ticket activo en la sesión
	// La implementación dependerá de cómo se gestione en tu app
	showInfoModal("Funcionalidad de descarga de ticket a implementar.", false);
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

// Export functions
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		syncTicketCounters,
		handleEmailSubmit,
		handleDownloadTicket,
		getEventTickets,
		getTicketById,
		isValidEmail
	};
}
