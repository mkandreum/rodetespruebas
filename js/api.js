
import { store } from './store.js';
import { showInfoModal } from './ui.js';
import { SAVE_APP_STATE_URL, SAVE_TICKETS_URL, SAVE_MERCH_SALES_URL } from './config.js';

export async function saveAppState() {
    try {
        const stateToSave = {
            appLogoUrl: store.appState.appLogoUrl,
            ticketLogoUrl: store.appState.ticketLogoUrl,
            bannerVideoUrl: store.appState.bannerVideoUrl,
            promoEnabled: store.appState.promoEnabled,
            promoCustomText: store.appState.promoCustomText,
            promoNeonColor: store.appState.promoNeonColor,
            allowedDomains: store.appState.allowedDomains || [],
            events: (store.appState.events || []).map(event => {
                const { purchasedTickets, ...eventToSave } = event;
                return eventToSave;
            }),
            drags: store.appState.drags || [],
            nextEventId: store.appState.nextEventId || 1,
            nextDragId: store.appState.nextDragId || 1,
            nextMerchItemId: store.appState.nextMerchItemId || 1,
            scannedTickets: store.appState.scannedTickets || {}
        };

        const response = await fetch(SAVE_APP_STATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stateToSave)
        });

        const result = await response.json();

        if (!response.ok) {
            let errorMessage = `Error HTTP ${response.status}.`;
            if (response.status === 403) {
                errorMessage = "Acceso denegado.";
                // handleLogout would be imported or triggered via event
            } else if (result && result.message) {
                errorMessage = result.message;
            }
            throw new Error(errorMessage);
        }

        if (result.success) {
            console.log("App state guardado.");
        } else {
            throw new Error(result.message || "Error desconocido al guardar appState.");
        }
    } catch (e) {
        console.error("Error guardando app state:", e);
        showInfoModal("Error al guardar la configuración: " + e.message, true);
    }
}

export async function saveTicketState() {
    try {
        const response = await fetch(SAVE_TICKETS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(store.allTickets || [])
        });

        if (!response.ok) {
            let errorText = await response.text();
            let errorMessage = `Error HTTP ${response.status}.`;
            try {
                const errorResult = JSON.parse(errorText);
                if (errorResult && errorResult.message) errorMessage = errorResult.message;
            } catch (e) {
                errorMessage += ` Respuesta: ${errorText.substring(0, 100)}`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        if (result.success) {
            console.log("Ticket state guardado.");
        } else {
            throw new Error(result.message || "Error al guardar tickets.");
        }
    } catch (e) {
        console.error("Error crítico guardando tickets:", e);
        showInfoModal("Error grave al guardar entradas. Contacta al administrador.", true);
    }
}

export async function saveMerchSalesState() {
    try {
        const response = await fetch(SAVE_MERCH_SALES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(store.allMerchSales || [])
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Error HTTP ${response.status}`);

        if (result.success) {
            console.log("Merch Sales guardado.");
        } else {
            throw new Error(result.message || "Error al guardar ventas merch.");
        }
    } catch (e) {
        console.error("Error guardando merch sales:", e);
    }
}
