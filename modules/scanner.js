/**
 * modules/scanner.js
 * Funciones relacionadas con el escáner QR
 */

let currentScannedTicketInfo = null;
let html5QrcodeScanner = null;

/**
 * Inicia el escáner QR.
 */
function startScanner() {
	const codeReader = new ZXing.BrowserMultiFormatReader();
	const videoElement = document.getElementById('qr-video');
	const scannerVideoRegion = document.getElementById('scanner-video-region');

	if (!videoElement || !scannerVideoRegion) {
		console.error("Video element or scanner container not found");
		return;
	}

	showPage('qr-scanner');
	if (scannerVideoRegion) scannerVideoRegion.classList.remove('hidden');

	codeReader.decodeFromVideoDevice(undefined, videoElement, (result, err) => {
		if (result) {
			const qrCode = result.getText();
			console.log("QR leído:", qrCode);
			handleQRScanned(qrCode);
		}
	});
}

/**
 * Detiene el escáner QR.
 */
function stopScanner(showPanel = true) {
	const videoElement = document.getElementById('qr-video');
	if (videoElement && videoElement.srcObject) {
		videoElement.srcObject.getTracks().forEach(track => track.stop());
	}

	const scannerVideoRegion = document.getElementById('scanner-video-region');
	if (scannerVideoRegion) {
		scannerVideoRegion.innerHTML = '';
		scannerVideoRegion.classList.add('hidden');
	}

	if (showPanel) {
		showPage('admin-events');
	}
}

/**
 * Procesa el QR escaneado.
 */
function handleQRScanned(qrCode) {
	try {
		// Parsear el QR (puede ser un ticketId o entrada)
		let scannedData = null;

		// Intenta parsear como JSON primero (para QR complejos)
		try {
			scannedData = JSON.parse(qrCode);
		} catch (e) {
			// Si no es JSON, asume que es un ticketId simple
			scannedData = { ticketId: qrCode };
		}

		const ticketId = scannedData.ticketId;
		const ticketEntry = allTickets?.find(t => t.ticketId === ticketId);

		if (!ticketEntry) {
			showInfoModal("ENTRADA NO ENCONTRADA.", true);
			return;
		}

		// Mostrar información del ticket para confirmar
		showScannerConfirmationView(ticketEntry);

	} catch (error) {
		console.error("Error procesando QR:", error);
		showInfoModal(`ERROR AL PROCESAR QR: ${error.message}`, true);
	}
}

/**
 * Muestra la vista de confirmación del escáner.
 */
function showScannerConfirmationView(ticketEntry) {
	const scannerInputView = document.getElementById('scanner-input-view');
	const scannerVideoRegion = document.getElementById('scanner-video-region');

	if (!scannerInputView) return;

	currentScannedTicketInfo = ticketEntry;

	const ticketInfo = `
		<div class="bg-gray-900 border-2 border-white p-6 rounded-none text-center">
			<h3 class="text-2xl font-pixel text-white mb-4">ENTRADA ESCANEADA</h3>
			<p class="text-gray-300 mb-2"><strong>Entrada:</strong> ${ticketEntry.ticketId}</p>
			<p class="text-gray-300 mb-2"><strong>Nombre:</strong> ${ticketEntry.userName}</p>
			<p class="text-gray-300 mb-2"><strong>Evento:</strong> ${ticketEntry.eventName}</p>
			<p class="text-gray-300 mb-4"><strong>Cantidad:</strong> ${ticketEntry.quantity}</p>
			<p class="text-2xl font-bold text-green-400 mb-4">¿CONFIRMAR ENTRADA?</p>
		</div>
	`;

	scannerInputView.innerHTML = ticketInfo;
	scannerInputView.classList.remove('hidden');
	if (scannerVideoRegion) scannerVideoRegion.classList.add('hidden');
}

/**
 * Confirma una entrada escaneada.
 */
async function handleScannerConfirm() {
	if (!currentScannedTicketInfo) {
		showInfoModal("No hay entrada seleccionada para confirmar.", true);
		return;
	}

	showLoading(true, "Confirmando entrada...");

	try {
		const ticketEntry = currentScannedTicketInfo;
		const ticketId = ticketEntry.ticketId;

		if (!appState.scannedTickets) appState.scannedTickets = {};

		const available = ticketEntry.quantity - (appState.scannedTickets[ticketId] || 0);
		const quantityToUse = 1;

		if (available < quantityToUse) {
			throw new Error("No hay más entradas disponibles para esta entrada.");
		}

		appState.scannedTickets[ticketId] = (appState.scannedTickets[ticketId] || 0) + quantityToUse;

		await saveAppState();

		const remaining = available - quantityToUse;
		showInfoModal(`¡ENTRADA CONFIRMADA!<br>Usadas: ${quantityToUse}. Restantes: ${remaining}.`, false, () => {
			handleScannerCancel();
		});

	} catch (error) {
		showLoading(false);
		console.error("Error confirming scan:", error);
		showInfoModal(`ERROR AL CONFIRMAR: ${error.message}`, true);
	} finally {
		showLoading(false);
	}
}

/**
 * Cancela la confirmación del escáner.
 */
function handleScannerCancel() {
	currentScannedTicketInfo = null;
	const scannerInputView = document.getElementById('scanner-input-view');
	const scannerVideoRegion = document.getElementById('scanner-video-region');

	if (scannerInputView) scannerInputView.classList.add('hidden');
	if (scannerVideoRegion) {
		scannerVideoRegion.innerHTML = '';
		scannerVideoRegion.classList.remove('hidden');
	}

	startScanner();
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		startScanner,
		stopScanner,
		handleQRScanned,
		showScannerConfirmationView,
		handleScannerConfirm,
		handleScannerCancel
	};
}
