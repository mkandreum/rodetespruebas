/**
 * modules/giveaway.js
 * Giveaway/sorteo system from app-old-broken.js
 */

/**
 * Renderiza la lista de eventos con entradas para sorteo.
 * Extraído de app-old-broken.js líneas 5023-5071
 */
function renderGiveawayEvents(events) {
	const giveawayEventListUl = document.getElementById('giveawayEventListUl');
	const giveawayWinnerResult = document.getElementById('giveawayWinnerResult');

	if (typeof clearDynamicListListeners === 'function') {
		clearDynamicListListeners('giveaway');
	}
	if (!giveawayEventListUl || !giveawayWinnerResult || !allTickets) return;

	giveawayEventListUl.innerHTML = ''; // Limpiar
	// Resetear resultado si no hay evento seleccionado
	giveawayWinnerResult.innerHTML = `<p class="text-gray-500 font-pixel">SELECCIONA UN EVENTO Y PULSA "INDICAR GANADOR"</p>`;

	if (!Array.isArray(events)) {
		giveawayEventListUl.innerHTML = '<li class="text-red-400 text-center font-pixel">Error cargando eventos para sorteo.</li>';
		return;
	}

	// Filtrar eventos que tengan al menos una entrada vendida
	const eventsWithTickets = events.filter(e => e && allTickets.some(t => t.eventId === e.id));

	if (eventsWithTickets.length === 0) {
		giveawayEventListUl.innerHTML = '<li class="text-gray-400 text-center font-pixel">NINGÚN EVENTO TIENE ENTRADAS VENDIDAS PARA SORTEAR.</li>';
		return;
	}

	// Ordenar por fecha descendente
	eventsWithTickets.sort((a, b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);

	eventsWithTickets.forEach(event => {
		try {
			// Contar registros de tickets para este evento
			const purchasedTicketsCount = allTickets.filter(t => t.eventId === event.id).length;
			const eventDateStr = event.date ? new Date(event.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Fecha N/A';

			const item = document.createElement('li');
			item.className = "flex flex-wrap justify-between items-center bg-gray-800 p-4 border border-gray-500 gap-4";
			item.innerHTML = `
					<div class="min-w-0 mr-4">
						<span class="font-pixel text-xl text-white block truncate">${event.name || 'Evento'} <span class="text-sm text-gray-400">(${eventDateStr})</span></span>
						<span class="text-sm text-gray-400 block sm:inline">(${purchasedTicketsCount} ${purchasedTicketsCount === 1 ? 'compra' : 'compras'})</span>
					</div>
					<button data-event-id="${event.id}" class="giveaway-btn flex-shrink-0 bg-white text-black font-pixel text-lg px-4 py-2 rounded-none border border-gray-400 hover:bg-gray-300">
						INDICAR GANADOR
					</button>`;
			giveawayEventListUl.appendChild(item);
		} catch (e) {
			console.error(`Error renderizando evento ${event?.id} para sorteo:`, e);
		}
	});

	// Re-adjuntar listeners
	if (typeof addTrackedListener === 'function') {
		giveawayEventListUl.querySelectorAll('.giveaway-btn').forEach(btn => addTrackedListener(btn, 'click', handleGiveawayClick));
	}
}

/**
 * Realiza el sorteo para un evento seleccionado.
 * Extraído de app-old-broken.js líneas 5082-5142
 */
function handleGiveawayClick(e) {
	const giveawayWinnerResult = document.getElementById('giveawayWinnerResult');

	const eventId = parseInt(e.target.dataset.eventId, 10);
	if (isNaN(eventId) || !appState || !appState.events || !allTickets || !giveawayWinnerResult) return;

	const event = appState.events.find(ev => ev.id === eventId);
	if (!event) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Evento no encontrado para sortear.", true);
		}
		return;
	}

	// Obtener TODOS los registros de tickets para este evento
	const ticketsForEvent = allTickets.filter(t => t.eventId === eventId);

	if (ticketsForEvent.length === 0) {
		giveawayWinnerResult.innerHTML = `<p class="text-yellow-400 font-pixel text-2xl">Este evento no tiene entradas para sortear.</p>`;
		return;
	}

	if (typeof showLoading === 'function') showLoading(true);
	// Simular pequeña espera para efecto
	setTimeout(() => {
		// Elegir un registro de ticket aleatorio
		const randomIndex = Math.floor(Math.random() * ticketsForEvent.length);
		const winningTicket = ticketsForEvent[randomIndex];

		const winningEmail = winningTicket.email || 'N/A';
		const ticketIdShort = (winningTicket.ticketId || 'N/A').substring(0, 13);
		const quantity = winningTicket.quantity || '?';
		// NUEVO: Nombre y apellidos
		const winnerName = `${winningTicket.nombre || ''} ${winningTicket.apellidos || ''}`.trim() || 'Nombre N/A';

		if (typeof showLoading === 'function') showLoading(false);

		// DISEÑO MEJORADO PARA MÓVIL Y BOTÓN EMAIL
		giveawayWinnerResult.innerHTML = `
				<div class="flex flex-col items-center gap-4 w-full animate-fade-in-up">
					<div class="text-center w-full px-2">
						<p class="text-gray-400 font-pixel text-sm sm:text-lg mb-1">EL GANADOR PARA</p>
						<h4 class="text-xl sm:text-2xl font-pixel text-white text-glow-white mb-4 break-words leading-tight border-b border-gray-700 pb-2 inline-block">${event.name || 'Evento'}</h4>
						
						<p class="text-gray-400 font-pixel text-sm sm:text-lg mb-2">ES:</p>
						<p class="text-3xl sm:text-5xl font-pixel text-green-400 text-glow-white mb-2 break-words leading-tight py-2">${winnerName}</p>
						
						<div class="bg-gray-800/50 p-4 rounded border border-gray-600 w-full max-w-md mx-auto mt-2 shadow-lg">
							<p class="text-sm sm:text-base text-gray-300 font-pixel break-all mb-1 font-bold">${winningEmail}</p>
							<p class="text-xs sm:text-sm text-gray-500 font-pixel mt-1">Ticket: ${ticketIdShort}... | Cant: ${quantity}</p>
						</div>
					</div>

					<button id="send-winner-email-btn" class="mt-6 bg-pink-600 hover:bg-pink-500 text-white font-pixel py-3 px-6 rounded-none text-base sm:text-lg border border-pink-400 shadow-[0_0_15px_rgba(240,45,125,0.4)] transition-all w-full sm:w-auto flex items-center justify-center gap-2">
						<span>📧</span> ENVIAR EMAIL PREMIO
					</button>
				</div>`;

		// Añadir listener al botón dinámicamente
		const sendBtn = document.getElementById('send-winner-email-btn');
		if (sendBtn && typeof sendWinnerNotification === 'function') {
			sendBtn.onclick = () => sendWinnerNotification(winnerName, winningEmail, event.name);
		}

	}, 300); // 300ms delay
}

