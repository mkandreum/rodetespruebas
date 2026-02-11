/**
 * modules/email.js
 * Email notifications, SMTP configuration, and email templates
 */

/**
 * Renderiza/Carga la configuración SMTP del servidor
 */
async function renderSMTPConfig() {
	console.log("Rendering SMTP Config...");
	const smtpConfigForm = document.getElementById('smtpConfigForm');
	
	if (!smtpConfigForm) {
		console.error("SMTP Config Form not found in DOM");
		return;
	}

	try {
		const response = await fetch(`api/get_smtp_config.php?t=${Date.now()}`);
		const result = await response.json();
		console.log("SMTP Config Loaded:", result);

		if (result.success && result.config) {
			const config = result.config;
			const hostEl = document.getElementById('smtp-host');
			const portEl = document.getElementById('smtp-port');
			const usernameEl = document.getElementById('smtp-username');
			const encryptionEl = document.getElementById('smtp-encryption');
			const fromEmailEl = document.getElementById('smtp-from-email');
			const fromNameEl = document.getElementById('smtp-from-name');
			const enabledEl = document.getElementById('smtp-enabled');

			if (hostEl) hostEl.value = config.host || '';
			if (portEl) portEl.value = config.port || '';
			if (usernameEl) usernameEl.value = config.username || '';
			// Password no se devuelve por seguridad, dejar vacío
			if (encryptionEl) encryptionEl.value = config.encryption || 'tls';
			if (fromEmailEl) fromEmailEl.value = config.from_email || '';
			if (fromNameEl) fromNameEl.value = config.from_name || '';
			if (enabledEl) enabledEl.checked = !!config.enabled;
		}
	} catch (error) {
		console.error("Error loading SMTP config:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al cargar configuración SMTP", true);
		}
	}
}

/**
 * Prueba la conexión SMTP
 */
async function testSMTPConnection() {
	const usernameEl = document.getElementById('smtp-username');
	if (!usernameEl || !usernameEl.value) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Guarda primero la configuración o introduce un usuario válido.", true);
		}
		return;
	}

	const username = usernameEl.value;
	if (!confirm(`Se enviará un email de prueba a ${username}. ¿Continuar?`)) return;

	if (typeof showLoading === 'function') showLoading(true);
	
	try {
		const response = await fetch('email/test_smtp.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: username,
				csrf_token: window.PHP_CSRF_TOKEN || ''
			})
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showInfoModal === 'function') {
				showInfoModal("✅ ¡Conexión Exitosa! Email enviado.", false);
			}
		} else {
			if (typeof showInfoModal === 'function') {
				showInfoModal("❌ Error de conexión: " + (result.message || 'Error desconocido'), true);
			}
		}

	} catch (error) {
		console.error("Error testing SMTP:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al probar conexión: No se pudo contactar con servidor de prueba", true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Renderiza la configuración de notificaciones (Web Merch y Drags)
 */
function renderEmailNotifications() {
	if (!appState) return;

	const webMerchNotifEmail = document.getElementById('webMerchNotifEmail');
	const webMerchBuyerTemplate = document.getElementById('webMerchBuyerTemplate');
	const dragEmailSelect = document.getElementById('dragEmailSelect');

	// Cargar configuración de Web Merch
	const emailNotifs = appState.emailNotifications || {};
	const webMerchConfig = emailNotifs.webMerch || {};

	if (webMerchNotifEmail) webMerchNotifEmail.value = webMerchConfig.notificationEmail || '';
	if (webMerchBuyerTemplate) webMerchBuyerTemplate.value = webMerchConfig.buyerTemplate || '';

	// Cargar select de drags
	if (dragEmailSelect && appState.drags) {
		const currentVal = dragEmailSelect.value;
		dragEmailSelect.innerHTML = '<option value="">-- SELECCIONA UNA DRAG --</option>';
		appState.drags.sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(drag => {
			const option = document.createElement('option');
			option.value = drag.id;
			option.textContent = drag.name;
			dragEmailSelect.appendChild(option);
		});
		if (currentVal) dragEmailSelect.value = currentVal;
	}
}

/**
 * Maneja la selección de drag para configurar email
 */
function handleDragEmailSelect(e) {
	const dragEmailConfigForm = document.getElementById('dragEmailConfigForm');
	const dragNotifEmail = document.getElementById('dragNotifEmail');
	const dragBuyerTemplate = document.getElementById('dragBuyerTemplate');

	const dragId = parseInt(e.target.value);
	if (!dragId || isNaN(dragId)) {
		if (dragEmailConfigForm) dragEmailConfigForm.classList.add('hidden');
		return;
	}

	if (dragEmailConfigForm) dragEmailConfigForm.classList.remove('hidden');

	// Buscar config actual
	const emailNotifs = appState.emailNotifications || {};
	const dragsConfig = emailNotifs.drags || [];
	const currentConfig = dragsConfig.find(c => c.dragId === dragId) || {};

	if (dragNotifEmail) dragNotifEmail.value = currentConfig.notificationEmail || '';
	if (dragBuyerTemplate) dragBuyerTemplate.value = currentConfig.buyerTemplate || '';
}

/**
 * Guarda la configuración de email de la drag seleccionada
 */
async function handleSaveDragEmailConfig() {
	const dragEmailSelect = document.getElementById('dragEmailSelect');
	const dragNotifEmail = document.getElementById('dragNotifEmail');
	const dragBuyerTemplate = document.getElementById('dragBuyerTemplate');

	if (!dragEmailSelect || !appState) return;
	const dragId = parseInt(dragEmailSelect.value);
	if (!dragId) return;

	if (!appState.emailNotifications) appState.emailNotifications = {};
	if (!appState.emailNotifications.drags) appState.emailNotifications.drags = [];

	const notifEmail = dragNotifEmail ? dragNotifEmail.value : '';
	const buyerMsg = dragBuyerTemplate ? dragBuyerTemplate.value : '';

	// Actualizar array
	const existingIndex = appState.emailNotifications.drags.findIndex(c => c.dragId === dragId);
	const newConfig = { dragId, notificationEmail: notifEmail, buyerTemplate: buyerMsg };

	if (existingIndex > -1) {
		appState.emailNotifications.drags[existingIndex] = newConfig;
	} else {
		appState.emailNotifications.drags.push(newConfig);
	}

	if (typeof saveAppState === 'function') {
		await saveAppState(); // Persistir en servidor (app_state.json)
	}

	if (typeof showInfoModal === 'function') {
		showInfoModal("Configuración de notificaciones de drag guardada.", false);
	}
}

/**
 * Guarda estado general de notificaciones (para Web Merch)
 */
async function saveEmailNotificationsState() {
	const webMerchNotifEmail = document.getElementById('webMerchNotifEmail');
	const webMerchBuyerTemplate = document.getElementById('webMerchBuyerTemplate');

	if (!appState) return;
	if (!appState.emailNotifications) appState.emailNotifications = {};

	appState.emailNotifications.webMerch = {
		notificationEmail: webMerchNotifEmail ? webMerchNotifEmail.value : '',
		buyerTemplate: webMerchBuyerTemplate ? webMerchBuyerTemplate.value : ''
	};

	if (typeof saveAppState === 'function') {
		await saveAppState(); // Persistir en servidor (datos_app.json)
	}

	if (typeof showInfoModal === 'function') {
		showInfoModal("Configuración Web Merch guardada.", false);
	}
}

/**
 * Envía un correo de notificación al ganador del sorteo
 */
async function sendWinnerNotification(name, email, eventName) {
	if (!confirm(`¿Enviar correo de confirmación de premio a ${name}?`)) return;

	if (typeof showLoading === 'function') {
		showLoading(true, "Enviando notificación...");
	}

	try {
		const response = await fetch('email/send_winner_notification.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				winnerName: name,
				winnerEmail: email,
				eventName: eventName
			})
		});
		const result = await response.json();

		if (result.success) {
			if (typeof showInfoModal === 'function') {
				showInfoModal(`¡Correo enviado a ${name} exitosamente!`, false);
			}
		} else {
			if (typeof showInfoModal === 'function') {
				showInfoModal(`Error al enviar correo: ${result.message}`, true);
			}
		}
	} catch (error) {
		console.error("Error sending winner email:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error de red al enviar el correo.", true);
		}
	} finally {
		if (typeof showLoading === 'function') {
			showLoading(false);
		}
	}
}

// All functions above are available in global scope automatically when script loads
