// === Initialization Module ===

import { appState, setAllTickets, setAllMerchSales, setIsLoggedIn, setAdminEmail, getAllTickets } from '../core/state.js';
import { saveAppState } from './app-state-api.js';

/**
 * Load initial data from server (provided by PHP in window object)
 */
export function loadInitialDataFromServer() {
    try {
        // Load App State (datos_app.json)
        if (window.PHP_INITIAL_STATE) {
            Object.assign(appState, window.PHP_INITIAL_STATE);

            // Ensure data structures exist regardless of source version
            appState.events = appState.events || [];
            appState.drags = appState.drags || [];
            appState.webMerch = appState.webMerch || [];
            appState.allowedDomains = appState.allowedDomains || [];
            appState.scannedTickets = appState.scannedTickets || {};
            appState.nextEventId = appState.nextEventId || 1;
            appState.nextDragId = appState.nextDragId || 1;
            appState.nextMerchItemId = appState.nextMerchItemId || 1;

            console.log("App state cargado desde servidor:", appState);
        } else {
            console.warn("No se encontró estado principal (datos_app.json) en el servidor o estaba vacío. AppState puede estar incompleto.");
            // Ensure minimum structures
            appState.events = appState.events || [];
            appState.drags = appState.drags || [];
            appState.webMerch = appState.webMerch || [];
            appState.allowedDomains = appState.allowedDomains || [];
            appState.scannedTickets = appState.scannedTickets || {};
            appState.nextEventId = appState.nextEventId || 1;
            appState.nextDragId = appState.nextDragId || 1;
            appState.nextMerchItemId = appState.nextMerchItemId || 1;
        }

        // Load Tickets (entradas_db.json)
        if (window.PHP_INITIAL_TICKETS && Array.isArray(window.PHP_INITIAL_TICKETS)) {
            setAllTickets(window.PHP_INITIAL_TICKETS);
            console.log("Ticket state cargado desde servidor:", window.PHP_INITIAL_TICKETS);
        } else {
            setAllTickets([]);
            console.warn("No se encontró estado de entradas (entradas_db.json) en el servidor o estaba vacío/inválido.");
        }

        // Load Merch Sales (merch_vendido.json)
        if (window.PHP_INITIAL_MERCH_SALES && Array.isArray(window.PHP_INITIAL_MERCH_SALES)) {
            setAllMerchSales(window.PHP_INITIAL_MERCH_SALES);
            console.log("Merch Sales state cargado desde servidor:", window.PHP_INITIAL_MERCH_SALES);
        } else {
            setAllMerchSales([]);
            console.warn("No se encontró estado de ventas de merch (merch_vendido.json) en el servidor o estaba vacío/inválido.");
        }

        // Load Login State (from session.php via index.php)
        setIsLoggedIn(window.PHP_IS_LOGGED_IN === true);
        setAdminEmail(window.PHP_ADMIN_EMAIL || '');
        console.log(`Estado inicial de login: ${window.PHP_IS_LOGGED_IN ? `Logueado como ${window.PHP_ADMIN_EMAIL}` : 'No logueado'}`);

        // Sync ticket counters
        syncTicketCounters();

    } catch (e) {
        console.error("Error crítico procesando datos iniciales desde PHP:", e);
        // Initialize to safe/empty states
        appState.events = [];
        appState.drags = [];
        appState.webMerch = [];
        appState.allowedDomains = [];
        appState.scannedTickets = {};
        appState.nextEventId = 1;
        appState.nextDragId = 1;
        appState.nextMerchItemId = 1;
        setAllTickets([]);
        setAllMerchSales([]);
        setIsLoggedIn(false);
        setAdminEmail('');

        // Will need to import showInfoModal when available
        if (typeof window.showInfoModal === 'function') {
            window.showInfoModal("Error grave al cargar datos iniciales. La aplicación puede no funcionar correctamente.", true);
        }
    }
}

/**
 * Sync ticket counters in events with actual ticket data
 */
export async function syncTicketCounters() {
    if (!appState || !appState.events) return;

    console.log("Sincronizando contadores de entradas...");
    let discrepanciesFound = 0;
    const tickets = getAllTickets();

    appState.events.forEach(event => {
        // Calculate real total quantity sold for this event
        const realTotalQuantity = tickets
            .filter(t => t.eventId === event.id)
            .reduce((sum, t) => sum + (t.quantity || 0), 0);

        // Compare and correct if there's a discrepancy
        if (event.ticketsSold !== realTotalQuantity) {
            console.warn(`Corrigiendo discrepancia para evento ${event.id} ('${event.name}'): appState tenía ${event.ticketsSold}, el real es ${realTotalQuantity}.`);
            event.ticketsSold = realTotalQuantity;
            discrepanciesFound++;
        }
    });

    if (discrepanciesFound > 0) {
        console.log(`Se corrigieron ${discrepanciesFound} contadores de eventos.`);
        try {
            await saveAppState(); // Persist corrections
            console.log("Correcciones de contadores guardadas en servidor.");
        } catch (e) {
            console.error("No se pudieron guardar las correcciones de contadores:", e);
        }
    } else {
        console.log("Contadores de entradas ya estaban sincronizados.");
    }
}
