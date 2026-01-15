
import { store } from '../store.js';
import { showInfoModal, showLoading } from '../ui.js';
import { saveAppState, saveMerchSalesState } from '../api.js';
import { renderAdminEvents } from './events_admin.js';
import { renderAdminMerchSalesSummary } from './merch_admin.js';

// Internal state for scanner
let html5QrCodeScanner = null;
let currentScannedTicketInfo = null;

// DOM elements will be fetched when needed to avoid null references if DOM isn't ready
const getElements = () => ({
    scannerVideoRegion: document.getElementById('scanner-video-region'),
    scannerMessage: document.getElementById('scanner-message'),
    scannerInputView: document.getElementById('scanner-input-view'),
    adminScannerView: document.getElementById('admin-page-scanner'), // Assuming this ID, check app.js
    adminMainView: document.getElementById('admin-panel'), // Or whatever the main admin view container is
    scannerQuantityInput: document.getElementById('scanner-quantity-input'),
    scannerInputMessage: document.getElementById('scanner-input-message'),
    scannerConfirmBtn: document.getElementById('scanner-confirm-btn'),
    // These might be needed to toggle views correctly
    scanQrBtn: document.getElementById('scan-qr-btn'),
    adminPanel: document.getElementById('admin-panel')
});


export function startScanner() {
    const els = getElements();
    // Assuming adminScannerView corresponds to 'admin-scanner-view' or similar in HTML
    // Based on app.js reading: adminScannerView is id="admin-scanner-view" probably
    // Actually the read showed `adminScannerView` variable. I need to find the specific ID in index.php or assume standard naming.
    // Looking at index.php (I have it in context? no, I read chunks). 
    // I recall `admin-scanner-view` might be the ID.
    // Let's use the IDs from app.js logic I read:
    const adminScannerView = document.getElementById('admin-scanner-view');
    const adminMainView = document.getElementById('admin-main-view'); // Check this ID

    if (!els.scannerVideoRegion || !els.scannerMessage || !els.scannerInputView || !adminScannerView || !adminMainView) {
        console.error("Faltan elementos del DOM para el escáner.", els);
        showInfoModal("Error interno al iniciar el escáner.", true);
        return;
    }

    // Toggle views
    adminMainView.classList.add('hidden');
    adminScannerView.classList.remove('hidden');
    els.scannerInputView.classList.add('hidden');

    els.scannerMessage.innerHTML = "Iniciando cámara...";
    els.scannerMessage.className = "text-center text-gray-400 mt-4 h-12 flex items-center justify-center font-pixel text-lg";
    els.scannerVideoRegion.classList.remove('hidden');
    els.scannerVideoRegion.innerHTML = '';
    currentScannedTicketInfo = null;

    try {
        // @ts-ignore
        html5QrCodeScanner = new Html5Qrcode("scanner-video-region", true);

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        };

        const successCallback = (decodedText, decodedResult) => {
            console.log(`Código encontrado: ${decodedText}`);
            stopScanner(true);
            handleScannedCode(decodedText);
        };

        const errorCallback = (errorMessage) => {
            // Ignorar errores de "no QR found"
        };

        els.scannerMessage.innerHTML = "Apuntando a código QR...";
        html5QrCodeScanner.start(
            { facingMode: "environment" },
            config,
            successCallback,
            errorCallback
        ).catch(err => {
            console.error("Error start scanner:", err);
            els.scannerMessage.innerHTML = "Error al iniciar la cámara. Revisa permisos.";
            els.scannerMessage.className = "text-center text-red-400 mt-4 h-12 flex items-center justify-center font-pixel text-lg";
            html5QrCodeScanner = null;
        });

    } catch (e) {
        console.error("Exception scanner:", e);
        els.scannerMessage.innerHTML = "Error crítico del escáner.";
        html5QrCodeScanner = null;
    }
}

export function stopScanner(keepScannerView = false) {
    const els = getElements();
    const adminScannerView = document.getElementById('admin-scanner-view');
    const adminMainView = document.getElementById('admin-main-view');

    if (html5QrCodeScanner) {
        try {
            if (html5QrCodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
                html5QrCodeScanner.stop();
            }
        } catch (e) { console.warn("Error stopping scanner", e); }
        html5QrCodeScanner = null;
    }

    if (!keepScannerView) {
        adminScannerView?.classList.add('hidden');
        adminMainView?.classList.remove('hidden');
        if (els.scannerVideoRegion) els.scannerVideoRegion.innerHTML = '';
    }

    // If we are just stopping but want to keep the view (e.g. found code), we don't hide adminScannerView
    currentScannedTicketInfo = null;
}

function parseQRData(qrText) {
    if (!qrText || typeof qrText !== 'string') return null;
    const lines = qrText.split('\n');
    const data = { qrType: 'Unknown' };

    if (qrText.includes("MERCH_SALE_ID:")) {
        data.qrType = 'Merch_Sale';
        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim().toUpperCase().replace(/\s+/g, '_');
                const value = parts.slice(1).join(':').trim();
                data[key] = value;
            }
        });
        if (!data.MERCH_SALE_ID) return null;
        return data;
    }

    if (qrText.includes("TICKET_ID:") && !qrText.includes("EVENTO:")) {
        const match = qrText.match(/TICKET_ID:(.+)/i);
        if (match && match[1]) {
            data.qrType = 'Ticket_Simple';
            data.TICKET_ID = match[1].trim();
            return data;
        }
    }

    if (qrText.includes("TICKET_ID:") && qrText.includes("EVENTO:")) {
        data.qrType = 'Ticket_Legacy';
        lines.forEach(line => {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const key = parts[0].trim().toUpperCase().replace(/\s+/g, '_');
                const value = parts.slice(1).join(':').trim();
                data[key] = value;
            }
        });
        if (!data.TICKET_ID || !data.CANTIDAD) return null;
        return data;
    }

    if (qrText.includes("MERCH_ITEM_ID:") && qrText.includes("DRAG:")) {
        data.qrType = 'Merch_Legacy';
        return data;
    }

    return null;
}

function handleScannedCode(decodedText) {
    const qrData = parseQRData(decodedText);
    const els = getElements();
    let msg = "";
    let isError = true;
    let requiresConfirmation = false;
    let vibrationPattern = [200, 100, 200];

    els.scannerVideoRegion.classList.remove('hidden');
    els.scannerInputView.classList.add('hidden');

    if (!qrData) {
        msg = "ERROR: CÓDIGO QR NO VÁLIDO.";
    } else if (qrData.qrType === 'Merch_Legacy') {
        msg = "ERROR: QR DE MERCH ANTIGUO.";
    } else if (qrData.qrType === 'Merch_Sale') {
        const saleId = qrData.MERCH_SALE_ID;
        const sale = store.allMerchSales.find(s => s.saleId === saleId);

        if (!sale) {
            msg = `ERROR: PEDIDO NO ENCONTRADO (${saleId.substring(0, 8)}...)`;
        } else if (sale.status === 'Delivered') {
            msg = "AVISO: PEDIDO YA ENTREGADO.";
            isError = false;
            vibrationPattern = [50, 50, 50];
        } else {
            isError = false;
            requiresConfirmation = true;
            currentScannedTicketInfo = { qrData, sale };
            const buyerName = qrData.NOMBRE || `${sale.nombre || ''} ${sale.apellidos || ''}`.trim() || 'N/A';

            els.scannerQuantityInput.value = sale.quantity || 1;
            els.scannerQuantityInput.disabled = true;
            els.scannerInputMessage.innerHTML = `
                <span class="text-3xl text-yellow-400">¡PEDIDO MERCH PENDIENTE!</span>
                <span class="text-xl text-white mt-2">${buyerName}</span>
                <span class="text-lg text-white mt-1">DRAG: ${sale.dragName}</span>
                <span class="text-lg text-white">ITEM: ${sale.itemName}</span>
                <span class="text-xl text-white">CANTIDAD: ${sale.quantity}</span>
            `;
            if (els.scannerConfirmBtn) els.scannerConfirmBtn.textContent = 'CONFIRMAR ENTREGA';
            vibrationPattern = [100, 50, 100, 50, 100];
        }
    } else if (qrData.qrType === 'Ticket_Legacy' || qrData.qrType === 'Ticket_Simple') {
        const ticketId = qrData.TICKET_ID;
        const ticketEntry = store.allTickets.find(t => t.ticketId === ticketId);
        const event = store.appState.events.find(e => e.id === ticketEntry?.eventId);
        const usedCount = (store.appState.scannedTickets && store.appState.scannedTickets[ticketId]) || 0;
        const totalQty = ticketEntry?.quantity || 0;
        const available = totalQty - usedCount;

        if (!ticketEntry || !event) {
            msg = `ERROR: ENTRADA NO ENCONTRADA.`;
        } else if (available <= 0) {
            msg = `ERROR: ENTRADA AGOTADA. (${usedCount}/${totalQty})`;
        } else if (event.isArchived) {
            msg = "ERROR: EVENTO ARCHIVADO.";
        } else {
            isError = false;
            requiresConfirmation = true;
            currentScannedTicketInfo = { qrData, ticketEntry, event, available };
            const holderName = `${ticketEntry.nombre || ''} ${ticketEntry.apellidos || ''}`.trim() || ticketEntry.email;

            els.scannerQuantityInput.value = 1;
            els.scannerQuantityInput.max = available;
            els.scannerQuantityInput.min = 1;
            els.scannerQuantityInput.disabled = false;

            els.scannerInputMessage.innerHTML = `
                <span class="text-3xl text-green-400">¡ENTRADA VÁLIDA!</span>
                <span class="text-xl text-white mt-2">${holderName}</span>
                <span class="text-lg text-white mt-1">EVENTO: ${event.name}</span>
                <span class="text-xl text-white mt-1">DISPO: ${available} / ${totalQty}</span>
            `;
            if (els.scannerConfirmBtn) els.scannerConfirmBtn.textContent = 'CONFIRMAR ENTRADA';
            vibrationPattern = [100, 50, 100, 50, 100];
        }
    }

    if (navigator.vibrate) navigator.vibrate(vibrationPattern);

    if (requiresConfirmation) {
        els.scannerVideoRegion.classList.add('hidden');
        els.scannerVideoRegion.innerHTML = ''; // Turn off camera
        els.scannerInputView.classList.remove('hidden');
    } else {
        els.scannerMessage.innerHTML = msg;
        els.scannerMessage.className = `text-center ${isError ? 'text-red-400' : 'text-yellow-400'} mt-4 font-pixel text-lg`;
        // Restart scanner
        setTimeout(startScanner, 3000);
    }
}

export async function handleScannerConfirm() {
    if (!currentScannedTicketInfo) return;
    const { qrData } = currentScannedTicketInfo;
    const els = getElements();

    showLoading(true);
    try {
        if (qrData.qrType === 'Merch_Sale') {
            const { sale } = currentScannedTicketInfo;
            const saleIndex = store.allMerchSales.findIndex(s => s.saleId === sale.saleId);
            if (saleIndex > -1 && store.allMerchSales[saleIndex].status === 'Pending') {
                store.allMerchSales[saleIndex].status = 'Delivered';
                await saveMerchSalesState();
                // update UI if needed
                // renderAdminMerchSalesSummary(); // circular dep potential? Imported
                showInfoModal("¡PEDIDO CONFIRMADO!", false, startScanner);
            } else {
                throw new Error("Pedido no válido.");
            }
        } else {
            const { ticketEntry, available } = currentScannedTicketInfo;
            const qty = parseInt(els.scannerQuantityInput.value, 10);
            if (isNaN(qty) || qty <= 0 || qty > available) throw new Error("Cantidad inválida");

            if (!store.appState.scannedTickets) store.appState.scannedTickets = {};
            store.appState.scannedTickets[ticketEntry.ticketId] = (store.appState.scannedTickets[ticketEntry.ticketId] || 0) + qty;

            await saveAppState();
            // renderAdminEvents(store.appState.events); // Update tickets visual
            showInfoModal(`¡${qty} ENTRADA(S) VALIDADA(S)!`, false, startScanner);
        }
    } catch (e) {
        showInfoModal("Error al confirmar: " + e.message, true, startScanner);
    } finally {
        showLoading(false);
        els.scannerInputView.classList.add('hidden');
        currentScannedTicketInfo = null;
    }
}

export function handleScannerCancel() {
    const els = getElements();
    els.scannerInputView.classList.add('hidden');
    startScanner();
}
