/**
 * modules/auth.js
 * Autenticación, login, logout y configuración SMTP
 */

/**
 * Maneja el login del admin.
 */
async function handleAdminLogin(event) {
	event.preventDefault();

	const email = document.getElementById('email')?.value?.trim();
	const password = document.getElementById('password')?.value?.trim();

	if (!email || !password) {
		showInfoModal("Por favor, completa email y contraseña.", true);
		return;
	}

	showLoading(true, "Validando credenciales...");

	try {
		const response = await fetch('auth/login.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		const result = await response.json();

		if (result.success) {
			isLoggedIn = true;
			adminEmail = email;

			// Guardar email en localStorage
			localStorage.setItem('adminEmail', adminEmail);

			showLoading(false);
			showInfoModal("✅ ACCESO CONCEDIDO", false, () => {
			document.getElementById('email').value = '';
			document.getElementById('password').value = '';
				checkAdminUI();
				showAdminPage('events');
			});
		} else {
			showLoading(false);
			showInfoModal("❌ EMAIL O CONTRASEÑA INCORRECTOS", true);
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
async function handleLogout() {
	if (!confirm("¿Seguro que deseas cerrar sesión?")) {
		return;
	}

	showLoading(true, "Cerrando sesión...");

	try {
		const response = await fetch('auth/logout.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		});

		const result = await response.json();

		isLoggedIn = false;
		adminEmail = '';
		localStorage.removeItem('adminEmail');

		showLoading(false);
		showPage('admin');
		showInfoModal("✅ SESIÓN CERRADA", false);

	} catch (error) {
		showLoading(false);
		console.error("Error en logout:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Verifica y actualiza la UI del admin según estado.
 */
function checkAdminUI() {
	const adminPage = document.getElementById('admin-panel');
	const loginForm = document.getElementById('login-form');

	if (!adminPage) return;

	if (isLoggedIn) {
		adminPage.classList.remove('hidden');
		if (loginForm) loginForm.classList.add('hidden');
		adminTapCounter = 0; // Reset en logout
		document.getElementById('admin-logout-btn')?.classList.remove('hidden');
	} else {
		adminPage.classList.add('hidden');
		if (loginForm) loginForm.classList.remove('hidden');
		document.getElementById('admin-logout-btn')?.classList.add('hidden');
	}
}

/**
 * Obtiene la configuración actual de SMTP.
 */
async function getSMTPConfig() {
	try {
		const response = await fetch('api/get_smtp_config.php');
		const result = await response.json();
		return result;
	} catch (error) {
		console.error("Error obteniendo SMTP config:", error);
		return null;
	}
}

/**
 * Maneja el guardado de configuración SMTP.
 */
async function handleSaveSMTPConfig(event) {
	event?.preventDefault();

	const smtpHost = document.getElementById('smtpHost')?.value?.trim();
	const smtpPort = document.getElementById('smtpPort')?.value?.trim();
	const smtpUsername = document.getElementById('smtpUsername')?.value?.trim();
	const smtpPassword = document.getElementById('smtpPassword')?.value?.trim();
	const smtpFromEmail = document.getElementById('smtpFromEmail')?.value?.trim();

	if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromEmail) {
		showInfoModal("Por favor, completa todos los campos SMTP.", true);
		return;
	}

	showLoading(true, "Guardando configuración SMTP...");

	try {
		const response = await fetch('api/save_smtp_config.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				smtp_host: smtpHost,
				smtp_port: smtpPort,
				smtp_username: smtpUsername,
				smtp_password: smtpPassword,
				smtp_from_email: smtpFromEmail
			})
		});

		const result = await response.json();

		showLoading(false);

		if (result.success) {
			showInfoModal("✅ CONFIGURACIÓN SMTP GUARDADA", false);
		} else {
			showInfoModal(`Error: ${result.error}`, true);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error guardando SMTP config:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Prueba la conexión SMTP.
 */
async function handleTestSMTP() {
	const smtpHost = document.getElementById('smtpHost')?.value?.trim();
	const smtpPort = document.getElementById('smtpPort')?.value?.trim();
	const smtpUsername = document.getElementById('smtpUsername')?.value?.trim();
	const smtpPassword = document.getElementById('smtpPassword')?.value?.trim();
	const smtpFromEmail = document.getElementById('smtpFromEmail')?.value?.trim();

	if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromEmail) {
		showInfoModal("Por favor, completa todos los campos SMTP primero.", true);
		return;
	}

	showLoading(true, "Probando SMTP...");

	try {
		const response = await fetch('email/test_smtp.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				smtp_host: smtpHost,
				smtp_port: smtpPort,
				smtp_username: smtpUsername,
				smtp_password: smtpPassword,
				smtp_from_email: smtpFromEmail
			})
		});

		const result = await response.json();

		showLoading(false);

		if (result.success) {
			showInfoModal("✅ CONEXIÓN SMTP EXITOSA", false);
		} else {
			showInfoModal(`❌ Error SMTP: ${result.error}`, true);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error probando SMTP:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Envía notificación al ganador.
 */
async function handleSendWinnerNotification(ticketId) {
	if (!ticketId) {
		showInfoModal("Ticket no válido.", true);
		return;
	}

	if (!confirm("¿Deseas enviar la notificación de ganador?")) {
		return;
	}

	showLoading(true, "Enviando notificación...");

	try {
		const response = await fetch('email/send_winner_notification.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ticket_id: ticketId })
		});

		const result = await response.json();

		showLoading(false);

		if (result.success) {
			showInfoModal("✅ NOTIFICACIÓN ENVIADA", false);
		} else {
			showInfoModal(`Error: ${result.error}`, true);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error enviando notificación:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Reenvía email de ticket a un participante.
 */
async function handleResendTicketEmail(ticketId) {
	if (!ticketId) {
		showInfoModal("Ticket no válido.", true);
		return;
	}

	if (!confirm("¿Deseas reenviar el email del ticket?")) {
		return;
	}

	showLoading(true, "Reenviando email...");

	try {
		const response = await fetch('email/resend_ticket_email.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ticket_id: ticketId })
		});

		const result = await response.json();

		showLoading(false);

		if (result.success) {
			showInfoModal("✅ EMAIL REENVIADO", false);
		} else {
			showInfoModal(`Error: ${result.error}`, true);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error reenviando email:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

// All functions above are available in global scope automatically when script loads
