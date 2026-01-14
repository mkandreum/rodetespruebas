// === App State API Module ===

import { API_ENDPOINTS } from '../core/constants.js';
import { fetchJSON } from './api-client.js';
import { appState } from '../core/state.js';

/**
 * Save app state to server
 * @throws {Error} If save fails
 */
export async function saveAppState() {
    const stateToSave = {
        appLogoUrl: appState.appLogoUrl,
        ticketLogoUrl: appState.ticketLogoUrl,
        bannerVideoUrl: appState.bannerVideoUrl,
        promoEnabled: appState.promoEnabled,
        promoCustomText: appState.promoCustomText,
        promoNeonColor: appState.promoNeonColor,
        allowedDomains: appState.allowedDomains || [],
        events: (appState.events || []).map(event => {
            const { purchasedTickets, ...eventToSave } = event;
            return eventToSave;
        }),
        drags: appState.drags || [],
        webMerch: appState.webMerch || [],
        nextEventId: appState.nextEventId || 1,
        nextDragId: appState.nextDragId || 1,
        nextMerchItemId: appState.nextMerchItemId || 1,
        scannedTickets: appState.scannedTickets || {}
    };

    await fetchJSON(API_ENDPOINTS.SAVE_APP_STATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateToSave)
    });

    console.log("App state guardado en el servidor:", stateToSave);
}
