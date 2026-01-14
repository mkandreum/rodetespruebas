// === Merch Sales API Module ===

import { API_ENDPOINTS } from '../core/config.js';
import { fetchJSON } from './api-client.js';
import { allMerchSales } from '../core/state.js';

/**
 * Save merch sales state to server
 * @throws {Error} If save fails
 */
export async function saveMerchSalesState() {
    await fetchJSON(API_ENDPOINTS.SAVE_MERCH_SALES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allMerchSales || [])
    });

    console.log("Merch Sales state guardado en el servidor:", allMerchSales);
}
