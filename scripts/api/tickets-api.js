// === Tickets API Module ===

import { API_ENDPOINTS } from '../core/config.js';
import { allTickets } from '../core/state.js';

/**
 * Save tickets state to server
 * @throws {Error} If save fails
 */
export async function saveTicketState() {
    const response = await fetch(API_ENDPOINTS.SAVE_TICKETS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allTickets || [])
    });

    if (!response.ok) {
        let errorText = await response.text();
        let errorMessage = `Error HTTP ${response.status}.`;
        try {
            const errorResult = JSON.parse(errorText);
            if (errorResult && errorResult.message) {
                errorMessage = errorResult.message;
            }
        } catch (e) {
            errorMessage += ` Respuesta del servidor: ${errorText.substring(0, 100)}${errorText.length > 100 ? '...' : ''}`;
            console.error("Respuesta no JSON del servidor:", errorText);
        }
        throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message || "El servidor reportó un error desconocido al guardar (ticketState).");
    }

    console.log("Ticket state guardado en el servidor:", allTickets);
}
