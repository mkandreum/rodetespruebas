/**
 * modules/storage.js
 * Funciones de almacenamiento y sincronización con el servidor
 */

const SAVE_APP_STATE_URL = 'api/save.php';
const SAVE_TICKETS_URL = 'api/save_tickets.php';
const SAVE_MERCH_SALES_URL = 'api/save_merch_sales.php';
const UPLOAD_URL = 'api/upload.php';
const LOGIN_URL = 'auth/login.php';
const LOGOUT_URL = 'auth/logout.php';

/**
 * Carga los datos iniciales proporcionados por PHP en index.php.
 */
function loadInitialDataFromServer() {
	try {
		// Cargar App State (datos_app.json)
		if (window.PHP_INITIAL_STATE) {
			appState = window.PHP_INITIAL_STATE;
			console.log("App state cargado desde servidor:", appState);
		} else {
			console.warn("No se encontró estado principal (datos_app.json) en el servidor o estaba vacío.");
			appState.events = appState.events || [];
			appState.drags = appState.drags || [];
			appState.webMerch = appState.webMerch || [];
			appState.allowedDomains = appState.allowedDomains || [];
			appState.scannedTickets = appState.scannedTickets || {};
			appState.nextEventId = appState.nextEventId || 1;
			appState.nextDragId = appState.nextDragId || 1;
			appState.nextMerchItemId = appState.nextMerchItemId || 1;
		}

		// Cargar Tickets
		if (window.PHP_INITIAL_TICKETS && Array.isArray(window.PHP_INITIAL_TICKETS)) {
			allTickets = window.PHP_INITIAL_TICKETS;
			console.log("Ticket state cargado desde servidor:", allTickets);
		} else {
			allTickets = [];
			console.warn("No se encontró estado de entradas (entradas_db.json)");
		}

		// Cargar Ventas de Merch
		if (window.PHP_INITIAL_MERCH_SALES && Array.isArray(window.PHP_INITIAL_MERCH_SALES)) {
			allMerchSales = window.PHP_INITIAL_MERCH_SALES;
			console.log("Merch Sales state cargado desde servidor:", allMerchSales);
		} else {
			allMerchSales = [];
			console.warn("No se encontró estado de ventas de merch");
		}

		// Cargar Estado de Login
		isLoggedIn = window.PHP_IS_LOGGED_IN === true;
		adminEmail = window.PHP_ADMIN_EMAIL || '';
		console.log(`Estado inicial de login: ${isLoggedIn ? `Logueado como ${adminEmail}` : 'No logueado'}`);

		// Sincronizar contadores
		if (typeof syncTicketCounters === 'function') {
			syncTicketCounters();
		}

	} catch (e) {
		console.error("Error crítico procesando datos iniciales desde PHP:", e);
		appState = { events: [], drags: [], webMerch: [], allowedDomains: [], scannedTickets: {}, nextEventId: 1, nextDragId: 1, nextMerchItemId: 1 };
		allTickets = [];
		allMerchSales = [];
		isLoggedIn = false;
		adminEmail = '';
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error grave al cargar datos iniciales.", true);
		}
	}
}

/**
 * Guarda el estado principal (appState) en el servidor.
 */
async function saveAppState() {
	try {
		if (typeof showLoading === 'function') showLoading(true, "Guardando datos...");

		const response = await fetch(SAVE_APP_STATE_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(appState)
		});

		if (!response.ok) {
			throw new Error(`Server returned ${response.status}`);
		}

		const data = await response.json();
		if (typeof showLoading === 'function') showLoading(false);
		console.log("App state guardado correctamente:", data);
		return { ok: true, data };

	} catch (e) {
		console.error("Error guardando app state:", e);
		if (typeof showLoading === 'function') showLoading(false);
		if (typeof showInfoModal === 'function') {
			showInfoModal(`Error al guardar: ${e.message}`, true);
		}
		return { ok: false, error: e.message };
	}
}

/**
 * Guarda el estado de tickets en el servidor.
 */
async function saveTicketState() {
	try {
		if (typeof showLoading === 'function') showLoading(true, "Guardando entradas...");

		const response = await fetch(SAVE_TICKETS_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(allTickets)
		});

		const contentType = response.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			const data = await response.json();
			if (response.ok) {
				if (typeof showLoading === 'function') showLoading(false);
				console.log("Ticket state guardado correctamente:", data);
				return { ok: true, data };
			} else {
				if (typeof showLoading === 'function') showLoading(false);
				console.error("Error respuesta servidor tickets:", data);
				if (typeof showInfoModal === 'function') {
					showInfoModal(`Error: ${data?.message || 'No se guardaron las entradas'}`, true);
				}
				return { ok: false, error: data?.message };
			}
		} else {
			throw new Error("Respuesta no JSON del servidor");
		}
	} catch (e) {
		console.error("Error guardando ticket state:", e);
		if (typeof showLoading === 'function') showLoading(false);
		if (typeof showInfoModal === 'function') {
			showInfoModal(`Error al guardar entradas: ${e.message}`, true);
		}
		return { ok: false, error: e.message };
	}
}

/**
 * Guarda el estado de ventas de merch en el servidor.
 */
async function saveMerchSalesState() {
	try {
		if (typeof showLoading === 'function') showLoading(true, "Guardando ventas de merch...");

		const response = await fetch(SAVE_MERCH_SALES_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(allMerchSales)
		});

		if (!response.ok) {
			throw new Error(`Server returned ${response.status}`);
		}

		const data = await response.json();
		if (typeof showLoading === 'function') showLoading(false);
		console.log("Merch sales guardadas correctamente:", data);
		return { ok: true, data };

	} catch (e) {
		console.error("Error guardando merch sales:", e);
		if (typeof showLoading === 'function') showLoading(false);
		if (typeof showInfoModal === 'function') {
			showInfoModal(`Error al guardar merch: ${e.message}`, true);
		}
		return { ok: false, error: e.message };
	}
}

/**
 * Sube un archivo al servidor y retorna la URL.
 */
function uploadFileWithProgress(file, type, onProgress) {
	return new Promise((resolve, reject) => {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', type);

		const xhr = new XMLHttpRequest();

		if (onProgress) {
			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const percent = Math.round((e.loaded / e.total) * 100);
					onProgress(percent);
				}
			});
		}

		xhr.addEventListener('load', () => {
			try {
				const response = JSON.parse(xhr.responseText);
				if (xhr.status === 200 && response.ok) {
					resolve({ ok: true, status: xhr.status, result: response });
				} else {
					reject(new Error(response.error || 'Upload failed'));
				}
			} catch (e) {
				reject(new Error('Invalid server response'));
			}
		});

		xhr.addEventListener('error', () => {
			reject(new Error('Upload failed'));
		});

		xhr.open('POST', UPLOAD_URL);
		xhr.send(formData);
	});
}


