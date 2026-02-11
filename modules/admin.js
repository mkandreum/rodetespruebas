/**
 * modules/admin.js
 * Funciones relacionadas con el panel administrativo
 */

let currentEventFilter = 'all';

/**
 * Muestra una página del admin.
 */
function showAdminPage(adminPageId) {
	if (!isLoggedIn) {
		showPage('login');
		return;
	}

	// Limpiar listeners de listas dinámicas
	clearDynamicListListeners('adminEvents');

	document.querySelectorAll('[data-admin-page]').forEach(el => {
		el.classList.toggle('hidden', el.dataset.adminPage !== adminPageId);
	});

	document.querySelectorAll('[data-admin-nav]').forEach(link => {
		link.classList.toggle('active', link.dataset.adminNav === adminPageId);
	});

	// Renderizar contenido específico
	if (adminPageId === 'admin-events') {
		renderAdminEvents(appState?.events || []);
	} else if (adminPageId === 'admin-drags') {
		renderAdminDrags(appState?.drags || []);
	} else if (adminPageId === 'admin-merch') {
		renderAdminMerch();
	} else if (adminPageId === 'admin-galleries') {
		renderGalleryEventList();
	}
}

/**
 * Renderiza la lista de eventos en el panel admin.
 */
function renderAdminEvents(events) {
	clearDynamicListListeners('adminEvents');
	const adminEventsContainer = document.getElementById('admin-events-list-container');

	if (!adminEventsContainer || !Array.isArray(events)) {
		console.error("Admin events container not found or invalid events");
		return;
	}

	adminEventsContainer.innerHTML = '';

	// Aplicar filtro
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

	// Adjuntar listeners
	adminEventsContainer.querySelectorAll('.edit-event-btn').forEach(btn => {
		addTrackedListener(btn, 'click', handleEditEventClick);
	});
	adminEventsContainer.querySelectorAll('.delete-event-btn').forEach(btn => {
		addTrackedListener(btn, 'click', handleDeleteEvent);
	});
}

/**
 * Maneja la edición de un evento.
 */
function handleEditEventClick(e) {
	const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
	if (!appState?.events) return;

	const eventToEdit = appState.events.find(e => e.id === eventId);
	if (!eventToEdit) return;

	editingEventId = eventId;

	// Rellenar formulario (asume que existe addEventForm)
	const addEventForm = document.getElementById('add-event-form');
	if (!addEventForm) return;

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
 * Renderiza el panel de merch del admin.
 */
function renderAdminMerch() {
	const adminMerchContainer = document.getElementById('admin-merch-container');
	if (!adminMerchContainer) return;

	adminMerchContainer.innerHTML = '<p class="text-gray-400 font-pixel">Cargando panel de merch...</p>';

	// Obtener drags con merch
	const dragsWithMerch = (appState?.drags || []).filter(d => d.merchItems && d.merchItems.length > 0);

	if (dragsWithMerch.length === 0) {
		adminMerchContainer.innerHTML = '<p class="text-gray-400 font-pixel">No hay drags con merch disponible.</p>';
		return;
	}

	let html = '<div class="space-y-6">';

	dragsWithMerch.forEach(drag => {
		html += `
			<div class="bg-gray-900 border border-gray-700 rounded-none p-4">
				<h3 class="text-xl font-pixel text-white mb-4">${drag.name || 'Drag sin nombre'}</h3>
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
		`;

		(drag.merchItems || []).forEach(item => {
			const price = (parseFloat(item.price) || 0).toFixed(2);
			const imageUrl = item.imageUrl || `https://placehold.co/150x150/000/fff?text=Merch`;

			html += `
				<div class="bg-black border border-gray-600 rounded-none p-2">
					<img src="${imageUrl}" alt="${item.name}" class="w-full h-20 object-cover mb-2" onerror="this.src='https://placehold.co/150x150/000/fff?text=Error'">
					<p class="text-sm font-pixel text-white truncate">${item.name || 'Item'}</p>
					<p class="text-sm font-bold text-pink-500">${price}€</p>
					${item.stock !== undefined ? `<p class="text-xs text-gray-400">Stock: ${item.stock}</p>` : ''}
				</div>
			`;
		});

		html += `
				</div>
			</div>
		`;
	});

	html += '</div>';
	adminMerchContainer.innerHTML = html;
}

/**
 * Verifica y actualiza la UI del admin.
 */
function checkAdminUI() {
	const adminSection = document.getElementById('admin-section');
	const loginSection = document.getElementById('login-section');

	if (isLoggedIn) {
		if (adminSection) adminSection.classList.remove('hidden');
		if (loginSection) loginSection.classList.add('hidden');
	} else {
		if (adminSection) adminSection.classList.add('hidden');
		if (loginSection) loginSection.classList.remove('hidden');
	}
}

/**
 * Maneja el login del admin.
 */
async function handleAdminLogin(e) {
	e.preventDefault();
	if (!loginForm) return;

	const email = loginForm['email'].value.trim().toLowerCase();
	const password = loginForm['password'].value;

	if (!email || !password) {
		showInfoModal("POR FAVOR, INTRODUCE EMAIL Y CONTRASEÑA.", true);
		return;
	}

	showLoading(true, "Autenticando...");

	try {
		const response = await fetch(LOGIN_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		const data = await response.json();
		showLoading(false);

		if (data.ok) {
			isLoggedIn = true;
			adminEmail = email;
			loginForm.reset();
			checkAdminUI();
			showAdminPage('admin-events');
			showInfoModal("¡ACCESO CONCEDIDO!", false);
		} else {
			showInfoModal(data.message || "Credenciales inválidas.", true);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error en login:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Maneja el logout del admin.
 */
async function handleLogout(showModal = true) {
	showLoading(true, "Cerrando sesión...");

	try {
		await fetch(LOGOUT_URL, { method: 'POST' });
		isLoggedIn = false;
		adminEmail = '';
		checkAdminUI();
		showPage('home');
		showLoading(false);

		if (showModal) {
			showInfoModal("SESIÓN CERRADA.", false);
		}
	} catch (error) {
		showLoading(false);
		console.error("Error en logout:", error);
	}
}

/**
 * Maneja el tap del menú móvil para easter egg.
 */
function handleAdminMenuTap() {
	adminTapCounter = (adminTapCounter || 0) + 1;
	if (adminTapCounter >= 5) {
		const adminLink = document.querySelector('[data-nav="admin"]');
		if (adminLink) {
			adminLink.classList.remove('hidden');
			showInfoModal("¡PANEL ADMIN DESBLOQUEADO!", false);
		}
		adminTapCounter = 0;
	}
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		showAdminPage,
		renderAdminEvents,
		handleEditEventClick,
		handleDeleteEvent,
		renderAdminMerch,
		checkAdminUI,
		handleAdminLogin,
		handleLogout,
		handleAdminMenuTap
	};
}
