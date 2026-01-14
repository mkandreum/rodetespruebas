// === Tickets Scanner Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState, allTickets, allMerchSales } from '../../core/state.js';
import { saveAppState } from '../../api/app-state-api.js';
import { saveTicketState } from '../../api/tickets-api.js';
import { saveMerchSalesState } from '../../api/merch-api.js';
import { showInfoModal, showLoading } from '../../ui/modals.js';
import { renderAdminMerchSalesSummary } from '../merch/merch-admin.js';
import { showPage } from '../../ui/navigation.js';

let html5QrCode = null;
let currentScannedTicketInfo = null;


// Helper for short IDs
const saleIdShort = (id) => id && id.length > 8 ? id.substring(0, 8) + '...' : id;

/**
 * Start QR Scanner
 */
export function startScanner() {
    if (!domRefs.scannerView || !domRefs.scannerVideoRegion) return;

    // Switch UI to Scanner View
    showPage('admin-panel'); // Ensure we are in admin context visually or kept hidden?
    // Actually scanner is an overlay or a section.
    // In index.html, scanner-view is a top level section.

    // Hide all other admin sections manually if showPage is not enough?
    // showPage('admin-panel') might not hide everything if scanner is special.
    // Original code logic: Show scannerView, hide adminPanel.

    if (domRefs.adminPanel) domRefs.adminPanel.classList.add('hidden');
    if (domRefs.scannerView) domRefs.scannerView.classList.remove('hidden');

    // Reset internal views
    if (domRefs.scannerInputView) domRefs.scannerInputView.classList.add('hidden');
    if (domRefs.scannerVideoRegion) {
        domRefs.scannerVideoRegion.classList.remove('hidden');
        domRefs.scannerVideoRegion.innerHTML = ''; // Clear previous
    }
    if (domRefs.scannerMessage) {
        domRefs.scannerMessage.textContent = "Apunte la cámara al código QR...";
        domRefs.scannerMessage.className = "text-center text-gray-400 mt-4 font-pixel text-lg";
    }

    currentScannedTicketInfo = null;

    if (typeof Html5Qrcode === 'undefined') {
        if (domRefs.scannerMessage) domRefs.scannerMessage.innerHTML = '<span class="text-red-500">Error: Librería QR no cargada.</span>';
        return;
    }

    // Initialize
    if (html5QrCode) {
        // Stop if running
        try { html5QrCode.stop().catch(() => { }); html5QrCode.clear(); } catch (e) { }
    }

    html5QrCode = new Html5Qrcode("scanner-video-region");
    const config = { fps: 10, qrbox: 250 };

    html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => handleScannedCode(decodedText),
        (errorMessage) => { /* ignore frame errors */ }
    ).catch(err => {
        console.error("Error starting scanner:", err);
        if (domRefs.scannerMessage) {
            domRefs.scannerMessage.innerHTML = `<span class="text-red-500">No se pudo iniciar la cámara: ${err.message}</span>`;
        }
    });
}

/**
 * Stop Scanner
 */
export async function stopScanner(returnToPanel = true) {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
            html5QrCode.clear();
        } catch (e) { console.warn("Error stopping scanner:", e); }
        html5QrCode = null;
    }

    if (domRefs.scannerView) domRefs.scannerView.classList.add('hidden');
    if (returnToPanel && domRefs.adminPanel) domRefs.adminPanel.classList.remove('hidden');
}


function parseQRData(qrText) {
    if (!qrText) return null;

    // Pattern 1: Ticket New (TICKET:UUID)
    if (qrText.startsWith('TICKET:')) {
        const id = qrText.split(':')[1];
        return { qrType: 'Ticket_Simple', TICKET_ID: id };
    }

    // Pattern 2: Merch Sale (MERCH_SALE_ID:...)
    if (qrText.includes('MERCH_SALE_ID:')) {
        const lines = qrText.split('\n');
        const data = { qrType: 'Merch_Sale' };
        lines.forEach(line => {
            const [key, val] = line.split(':');
            if (key && val) data[key.trim()] = val.trim();
        });
        if (data.MERCH_SALE_ID) return data;
    }

    return null; // Unknown
}

/**
 * Handle Scanned Code Logic
 */
function handleScannedCode(qrText) {
    if (html5QrCode) {
        // Pause scanning
        html5QrCode.pause();
    }

    const qrData = parseQRData(qrText);
    const restartDelay = 2000;
    let msg = "";
    let isError = true;
    let requiresConfirmation = false;
    let scanData = null; // Internal obj

    if (!qrData) {
        msg = "CÓDIGO QR NO RECONOCIDO O INVÁLIDO.";
    } else if (qrData.qrType === 'Merch_Sale') {
        const saleId = qrData.MERCH_SALE_ID;
        const sale = allMerchSales.find(s => s.saleId === saleId);

        if (!sale) {
            msg = `PEDIDO NO ENCONTRADO (${saleIdShort(saleId)})`;
        } else if (sale.status === 'Delivered') {
            msg = `PEDIDO YA ENTREGADO (${saleIdShort(saleId)})`;
            isError = false; // Just warning
        } else {
            // Success Merch
            isError = false;
            requiresConfirmation = true;
            scanData = { type: 'merch', sale, qrData };

            // Setup Confirmation UI
            setupMerchConfirmation(sale, qrData);
        }

    } else if (qrData.qrType === 'Ticket_Simple') {
        const ticketId = qrData.TICKET_ID;
        const ticket = allTickets.find(t => t.ticketId === ticketId);

        if (!ticket) {
            msg = `ENTRADA NO ENCONTRADA (${saleIdShort(ticketId)})`;
        } else {
            const event = appState.events.find(e => e.id === ticket.eventId);
            const usedCount = appState.scannedTickets[ticketId] || 0;
            const available = (ticket.quantity || 0) - usedCount;

            if (!event) { msg = "EVENTO INVÁLIDO/BORRADO."; }
            else if (available <= 0) { msg = `ENTRADA AGOTADA/USADA (${usedCount}/${ticket.quantity})`; }
            else {
                // Success Ticket
                isError = false;
                requiresConfirmation = true;
                scanData = { type: 'ticket', ticket, event, available };

                setupTicketConfirmation(ticket, event, available, usedCount);
            }
        }
    }

    // Feedback
    if (navigator.vibrate) navigator.vibrate(isError ? [200, 100, 200] : [100]);

    if (requiresConfirmation) {
        currentScannedTicketInfo = scanData;
        if (domRefs.scannerVideoRegion) domRefs.scannerVideoRegion.classList.add('hidden');
        if (domRefs.scannerInputView) domRefs.scannerInputView.classList.remove('hidden');
    } else {
        // Show message and resume
        updateScannerMessage(msg, isError);
        setTimeout(() => {
            if (html5QrCode && domRefs.scannerView && !domRefs.scannerView.classList.contains('hidden')) {
                html5QrCode.resume();
                updateScannerMessage("Escaneando...", false, true);
                if (domRefs.scannerVideoRegion) domRefs.scannerVideoRegion.classList.remove('hidden');
            }
        }, restartDelay);
    }
}

function updateScannerMessage(msg, isError, isReset = false) {
    if (!domRefs.scannerMessage) return;
    domRefs.scannerMessage.innerHTML = msg;
    domRefs.scannerMessage.className = `text-center ${isReset ? 'text-gray-400' : (isError ? 'text-red-400' : 'text-yellow-400')} mt-4 font-pixel text-lg leading-tight`;
}

function setupMerchConfirmation(sale, qrData) {
    if (!domRefs.scannerInputMessage || !domRefs.scannerQuantityInput || !domRefs.scannerConfirmBtn) return;

    const buyerName = qrData.NOMBRE || `${sale.nombre || ''} ${sale.apellidos || ''}`.trim() || 'Desconocido';
    domRefs.scannerQuantityInput.value = sale.quantity || 1;
    domRefs.scannerQuantityInput.disabled = true;

    domRefs.scannerInputMessage.innerHTML = `
		<div class="text-3xl text-yellow-400 mb-2">¡PEDIDO MERCH!</div>
		<div class="text-white text-xl">${buyerName}</div>
		<div class="text-gray-300 text-sm mb-4">${sale.email}</div>
		<div class="text-white text-lg">ITEM: ${sale.itemName}</div>
		<div class="text-white text-lg">DRAG: ${sale.dragName}</div>
		<div class="text-white text-lg font-bold">CANTIDAD: ${sale.quantity}</div>
	`;
    domRefs.scannerConfirmBtn.textContent = 'CONFIRMAR ENTREGA';
}

function setupTicketConfirmation(ticket, event, available, used) {
    if (!domRefs.scannerInputMessage || !domRefs.scannerQuantityInput || !domRefs.scannerConfirmBtn) return;

    const holderName = `${ticket.nombre || ''} ${ticket.apellidos || ''}`.trim() || 'Desconocido';

    domRefs.scannerQuantityInput.disabled = false;
    domRefs.scannerQuantityInput.min = 1;
    domRefs.scannerQuantityInput.max = available;
    domRefs.scannerQuantityInput.value = 1;

    domRefs.scannerInputMessage.innerHTML = `
		<div class="text-3xl text-green-400 mb-2">¡ENTRADA VÁLIDA!</div>
		<div class="text-white text-xl">${holderName}</div>
		<div class="text-gray-300 text-sm mb-4">${ticket.email}</div>
		<div class="text-white text-lg">EVENTO: ${event.name}</div>
		<div class="text-white text-sm mt-2">
			Total: ${ticket.quantity} | Usadas: ${used} | <span class="text-green-400 font-bold">Disp: ${available}</span>
		</div>
	`;
    domRefs.scannerConfirmBtn.textContent = 'VALIDAR ACCESO';
}

/**
 * Handle Confirm Action
 */
export async function handleScannerConfirm() {
    if (!currentScannedTicketInfo) return;

    const { type } = currentScannedTicketInfo;
    showLoading(true);

    try {
        if (type === 'merch') {
            const { sale } = currentScannedTicketInfo;
            // Update status
            const realSale = allMerchSales.find(s => s.saleId === sale.saleId);
            if (realSale) {
                realSale.status = 'Delivered';
                await saveMerchSalesState();
                renderAdminMerchSalesSummary(); // Update UI if needed
                showInfoModal("¡ENTREGA CONFIRMADA!", false, () => resetScannerUI());
            } else {
                throw new Error("Pedido no encontrado al guardar.");
            }

        } else if (type === 'ticket') {
            const { ticket, available } = currentScannedTicketInfo;
            const qtyToUse = parseInt(domRefs.scannerQuantityInput.value, 10);

            if (isNaN(qtyToUse) || qtyToUse <= 0 || qtyToUse > available) {
                throw new Error("Cantidad inválida.");
            }

            if (!appState.scannedTickets) appState.scannedTickets = {};
            appState.scannedTickets[ticket.ticketId] = (appState.scannedTickets[ticket.ticketId] || 0) + qtyToUse;

            await saveAppState(); // Persist scan count

            const remaining = available - qtyToUse;
            showInfoModal(`¡ACCESO VALIDADO!<br>Validado: ${qtyToUse}. Quedan: ${remaining}.`, false, () => resetScannerUI());
        }

    } catch (e) {
        console.error("Scan confirm error:", e);
        showInfoModal(`Error: ${e.message}`, true, () => resetScannerUI());
    } finally {
        showLoading(false);
    }
}

/**
 * Handle Cancel Action
 */
export function handleScannerCancel() {
    resetScannerUI();
}

function resetScannerUI() {
    currentScannedTicketInfo = null;
    if (domRefs.scannerInputView) domRefs.scannerInputView.classList.add('hidden');
    if (domRefs.scannerVideoRegion) domRefs.scannerVideoRegion.classList.remove('hidden');

    updateScannerMessage("Escaneando...", false, true);

    if (html5QrCode) {
        html5QrCode.resume();
    } else {
        startScanner(); // Restart if failed or stopped
    }
}
