
import { showInfoModal } from './ui.js';

export const store = {
    appState: {},
    allTickets: [],
    allMerchSales: [],
    isLoggedIn: false,
    adminEmail: '',

    // State variables
    pendingEventId: null,
    editingEventId: null,
    editingDragId: null,
    editingMerchItemId: null,
    currentAdminMerchDragId: null,
    adminTapCounter: 0,

    // Gallery Modal State
    currentImageModalGallery: [],
    currentImageModalIndex: 0,

    // Scanner
    html5QrCodeScanner: null,
    currentScannedTicketInfo: null,

    // Listeners
    allEventListeners: []
};

// Initializes the store with data from window.PHP_*
export function loadInitialData() {
    try {
        // App State
        if (window.PHP_INITIAL_STATE) {
            store.appState = window.PHP_INITIAL_STATE;
            console.log("App state cargado:", store.appState);
        } else {
            console.warn("No se encontró estado principal. Usando valores por defecto.");
            store.appState = {};
        }

        // Defaults
        store.appState.events = store.appState.events || [];
        store.appState.drags = store.appState.drags || [];
        store.appState.webMerch = store.appState.webMerch || [];
        store.appState.allowedDomains = store.appState.allowedDomains || [];
        store.appState.scannedTickets = store.appState.scannedTickets || {};
        store.appState.nextEventId = store.appState.nextEventId || 1;
        store.appState.nextDragId = store.appState.nextDragId || 1;
        store.appState.nextMerchItemId = store.appState.nextMerchItemId || 1;

        // Tickets
        if (window.PHP_INITIAL_TICKETS && Array.isArray(window.PHP_INITIAL_TICKETS)) {
            store.allTickets = window.PHP_INITIAL_TICKETS;
        } else {
            store.allTickets = [];
        }

        // Merch Sales
        if (window.PHP_INITIAL_MERCH_SALES && Array.isArray(window.PHP_INITIAL_MERCH_SALES)) {
            store.allMerchSales = window.PHP_INITIAL_MERCH_SALES;
        } else {
            store.allMerchSales = [];
        }

        // Login
        store.isLoggedIn = window.PHP_IS_LOGGED_IN === true;
        store.adminEmail = window.PHP_ADMIN_EMAIL || '';

        syncTicketCounters();

    } catch (e) {
        console.error("Error crítico procesando datos iniciales:", e);
        showInfoModal("Error grave al cargar datos iniciales.", true);
    }
}

function syncTicketCounters() {
    if (!store.appState || !store.appState.events || !store.allTickets) return;
    let discrepanciesFound = 0;
    store.appState.events.forEach(event => {
        const realTotalQuantity = store.allTickets
            .filter(t => t.eventId === event.id)
            .reduce((sum, t) => sum + (t.quantity || 0), 0);

        if (event.ticketsSold !== realTotalQuantity) {
            event.ticketsSold = realTotalQuantity;
            discrepanciesFound++;
        }
    });
    if (discrepanciesFound > 0) console.log(`Se corrigieron ${discrepanciesFound} contadores de eventos.`);
}
