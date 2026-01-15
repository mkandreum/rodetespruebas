
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

// Initializes the store with data from API
export async function loadInitialData() {
    try {
        console.log("Cargando datos desde API Node.js...");

        const response = await fetch('/api/initial-data');
        if (!response.ok) throw new Error("Error HTTP " + response.status);

        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Error cargando datos");

        const { appState, tickets, merchSales, session } = result.data;

        // App State
        if (appState) {
            store.appState = appState;
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
        store.allTickets = Array.isArray(tickets) ? tickets : [];

        // Merch Sales
        store.allMerchSales = Array.isArray(merchSales) ? merchSales : [];

        // Login (from session)
        store.isLoggedIn = session?.isLoggedIn === true;
        store.adminEmail = session?.adminEmail || '';

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
