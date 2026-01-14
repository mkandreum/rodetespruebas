// === Events Admin Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState, allTickets, setAllTickets } from '../../core/state.js';
import { saveAppState } from '../../api/app-state-api.js';
import { saveTicketState } from '../../api/tickets-api.js';
import { showLoading, showInfoModal, closeModal } from '../../ui/modals.js';
import { clearDynamicListListeners, addTrackedListener } from '../../ui/event-listeners.js';
import { resetEventForm, setEditingEventId, editingEventId } from './events-form.js';
import { renderHomeEvents, renderPublicEvents } from './events-public.js';
import { renderAdminGalleryEventSelect } from '../gallery/gallery-admin.js';
// We need to update gallery dropdown if events change.
// renderAdminGalleryEventSelect needs to be exported from gallery-admin.js (which I haven't written yet).
// I'll make a stub or use a reference setter if circular.
// gallery-admin.js depends on events list. events-admin.js triggers updates.
// Circular dependency is likely.
// I will export a setter for the update function in events-admin.js, or just check if the function is available globally?
// Better: in main app orchestration, I can listen to changes or manually trigger updates.
// But here I want to call 'updateAllUI' basically.
// For now I'll import it. If it fails due to circular (if gallery-admin imports events-admin), I'll use the setter pattern.
// events-public.js was imported.
// I'll omit renderAdminGalleryEventSelect import for now and add a Todo or loose coupling.

let updateGallerySelectCallback = null;
export function setUpdateGallerySelectCallback(fn) { updateGallerySelectCallback = fn; }


/**
 * Render Admin Events List
 */
export function renderAdminEvents(events) {
    clearDynamicListListeners('adminEvents');
    if (!domRefs.adminEventListUl) return;
    domRefs.adminEventListUl.innerHTML = '';

    const eventsToShow = events || [];
    if (eventsToShow.length === 0) {
        domRefs.adminEventListUl.innerHTML = '<li class="text-gray-400 text-center font-pixel">NO HAY EVENTOS.</li>';
        return;
    }

    [...eventsToShow].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(event => {
        try {
            const item = document.createElement('li');
            // Calculate real sold tickets
            const realSold = allTickets.filter(t => t.eventId === event.id).reduce((sum, t) => sum + (t.quantity || 0), 0);
            // Update state cache if needed (optional locally)
            event.ticketsSold = realSold;

            const eventDateStr = new Date(event.date).toLocaleDateString('es-ES');
            const isArchived = event.isArchived;

            item.className = `bg-gray-800 p-4 border ${isArchived ? 'border-gray-600 opacity-70' : 'border-gray-500'} flex flex-wrap justify-between items-center gap-y-2`;

            item.innerHTML = `
				<div class="flex-grow min-w-0 mr-4">
					<span class="font-pixel text-xl ${isArchived ? 'text-gray-400' : 'text-white'} truncate block">
						${event.name || 'Evento sin nombre'} ${isArchived ? '(ARCHIVADO)' : ''}
					</span>
					<span class="text-sm text-gray-400 block sm:inline">${eventDateStr}</span>
					<span class="text-sm text-blue-400 block sm:inline ml-0 sm:ml-2">
						(Vendidas: ${realSold} / ${event.ticketCapacity > 0 ? event.ticketCapacity : '∞'})
					</span>
				</div>
				<div class="flex-shrink-0 flex items-center flex-wrap gap-2">
					<button data-event-id="${event.id}" class="view-tickets-btn bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-none text-sm font-pixel">ENTRADAS</button>
					<button data-event-id="${event.id}" class="archive-event-btn ${isArchived ? 'bg-green-600 hover:bg-green-500' : 'bg-yellow-600 hover:bg-yellow-500'} text-white px-3 py-1 rounded-none text-sm font-pixel">
						${isArchived ? 'RESTAURAR' : 'ARCHIVAR'}
					</button>
					<button data-event-id="${event.id}" class="edit-event-btn bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-none text-sm font-pixel">EDITAR</button>
					<button data-event-id="${event.id}" class="delete-event-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-none text-sm font-pixel">ELIMINAR</button>
				</div>
			`;
            domRefs.adminEventListUl.appendChild(item);
        } catch (e) {
            console.error(`Error renderizando evento admin ${event?.id}:`, e);
        }
    });

    // Attach listeners
    const container = domRefs.adminEventListUl;
    container.querySelectorAll('.view-tickets-btn').forEach(btn => addTrackedListener(btn, 'click', handleViewTickets));
    container.querySelectorAll('.archive-event-btn').forEach(btn => addTrackedListener(btn, 'click', handleArchiveEvent));
    container.querySelectorAll('.edit-event-btn').forEach(btn => addTrackedListener(btn, 'click', handleEditEventClick));
    container.querySelectorAll('.delete-event-btn').forEach(btn => addTrackedListener(btn, 'click', handleDeleteEvent));
}


/**
 * Handle Save Event (Add/Edit)
 */
export async function handleSaveEvent(e) {
    e.preventDefault();
    if (!domRefs.addEventForm) return;

    const formData = new FormData(domRefs.addEventForm);
    const eventName = formData.get('event-name')?.trim().toUpperCase() || '';
    const eventDate = formData.get('event-date');
    const eventPrice = parseFloat(formData.get('event-price'));
    const eventCapacity = parseInt(formData.get('event-capacity'), 10);
    const eventDescription = formData.get('event-description')?.trim() || '';
    const eventPosterUrl = formData.get('event-poster-url')?.trim() || '';

    // Validations
    if (!eventName || !eventDescription) { showInfoModal("Nombre y Descripción son obligatorios.", true); return; }
    if (!eventDate) { showInfoModal("Fecha obligatoria.", true); return; }
    if (isNaN(eventPrice) || eventPrice < 0) { showInfoModal("Precio inválido.", true); return; }
    if (isNaN(eventCapacity) || eventCapacity < 0) { showInfoModal("Capacidad inválida.", true); return; }
    if (eventPosterUrl && !(eventPosterUrl.startsWith('http') || eventPosterUrl.startsWith('uploads/'))) { showInfoModal("URL de cartel inválida.", true); return; }

    // Date check vs editing to prevent accidental past date? 
    // Original code allowed past dates if preserving history.

    showLoading(true);

    try {
        if (editingEventId !== null) { // Edit
            const event = appState.events.find(e => e.id === editingEventId);
            if (event) {
                event.name = eventName;
                event.date = eventDate;
                event.price = eventPrice;
                event.ticketCapacity = eventCapacity;
                event.description = eventDescription;
                event.posterImageUrl = eventPosterUrl;

                await saveAppState();
                showInfoModal("¡EVENTO ACTUALIZADO!", false);
            } else {
                throw new Error("Evento a editar no encontrado");
            }
        } else { // Add
            const newEvent = {
                id: appState.nextEventId++,
                name: eventName,
                date: eventDate,
                price: eventPrice,
                ticketCapacity: eventCapacity,
                ticketsSold: 0,
                description: eventDescription,
                posterImageUrl: eventPosterUrl,
                galleryImages: [],
                isArchived: false,
                createdAt: new Date().toISOString()
            };
            appState.events.push(newEvent);
            await saveAppState();
            showInfoModal("¡EVENTO CREADO!", false);
        }

        resetEventForm();
        renderAdminEvents(appState.events);
        renderHomeEvents(); // Update public view
        renderPublicEvents(); // Update public view

        if (updateGallerySelectCallback) updateGallerySelectCallback(); // Update gallery admin dropdown

    } catch (error) {
        console.error("Error saving event:", error);
        showInfoModal("Error al guardar evento.", true);
    } finally {
        showLoading(false);
    }
}


export function handleEditEventClick(e) {
    const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
    if (isNaN(eventId)) return;

    const event = appState.events.find(e => e.id === eventId);
    if (!event || !domRefs.addEventForm) return;

    domRefs.addEventForm['edit-event-id'].value = event.id;
    domRefs.addEventForm['event-name'].value = event.name || '';
    domRefs.addEventForm['event-date'].value = event.date || '';
    domRefs.addEventForm['event-price'].value = event.price || 0;
    domRefs.addEventForm['event-capacity'].value = event.ticketCapacity || 0;
    domRefs.addEventForm['event-description'].value = event.description || '';
    domRefs.addEventForm['event-poster-url'].value = event.posterImageUrl || '';

    setEditingEventId(event.id);

    if (domRefs.addEventButton) {
        domRefs.addEventButton.textContent = "ACTUALIZAR EVENTO";
        domRefs.addEventButton.classList.remove('bg-pink-600', 'hover:bg-pink-500');
        domRefs.addEventButton.classList.add('bg-blue-600', 'hover:bg-blue-500');
    }

    domRefs.addEventForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


export async function handleDeleteEvent(e) {
    const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
    if (isNaN(eventId)) return;

    // Confirmation? Using dirty alert for now as per original or simple modal?
    // Original code used confirm().
    if (!confirm("¿ESTÁS SEGURO? ESTO ELIMINARÁ EL EVENTO Y SUS DATOS (PERO NO LOS REGISTROS DE VENTA HISTÓRICOS).")) return;

    showLoading(true);
    try {
        appState.events = appState.events.filter(ev => ev.id !== eventId);
        await saveAppState();

        // Should we delete tickets? 
        // Original code: "No borramos las entradas de allTickets para mantener histórico contable, pero quedan huérfanas de evento."
        // Accepted.

        if (editingEventId === eventId) resetEventForm();

        renderAdminEvents(appState.events);
        renderHomeEvents();
        renderPublicEvents();
        if (updateGallerySelectCallback) updateGallerySelectCallback();

        showLoading(false);
        showInfoModal("EVENTO ELIMINADO.", false);
    } catch (error) {
        console.error("Error deleting event:", error);
        showLoading(false);
        showInfoModal("Error al eliminar evento.", true);
    }
}


export async function handleArchiveEvent(e) {
    const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
    if (isNaN(eventId)) return;

    const event = appState.events.find(e => e.id === eventId);
    if (!event) return;

    showLoading(true);
    try {
        event.isArchived = !event.isArchived;
        await saveAppState();

        renderAdminEvents(appState.events);
        renderHomeEvents();
        renderPublicEvents();

        showLoading(false);
        // showInfoModal(event.isArchived ? "EVENTO ARCHIVADO." : "EVENTO RESTAURADO.", false); // Optional feedback
    } catch (error) {
        console.error("Error archiving event:", error);
        showLoading(false);
        showInfoModal("Error al cambiar estado de archivo.", true);
    }
}


// Ticket Management Logic

let currentTicketEventId = null;

export function handleViewTickets(e) {
    const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
    if (isNaN(eventId) || !domRefs.ticketListModal) return;

    currentTicketEventId = eventId;
    const event = appState.events.find(e => e.id === eventId);

    if (domRefs.ticketListTitle) domRefs.ticketListTitle.textContent = `Entradas: ${event ? event.name : 'Evento'}`;

    renderTicketList(eventId);
    domRefs.ticketListModal.classList.remove('hidden');
}


function renderTicketList(eventId) {
    if (!domRefs.ticketListContent) return;

    clearDynamicListListeners('ticketListItems');
    domRefs.ticketListContent.innerHTML = '';

    const tickets = allTickets.filter(t => t.eventId === eventId);

    if (tickets.length === 0) {
        domRefs.ticketListContent.innerHTML = '<p class="text-gray-400 text-center font-pixel">NO HAY ENTRADAS VENDIDAS PARA ESTE EVENTO.</p>';
        return;
    }

    let html = '<ul class="space-y-2">';
    tickets.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate)).forEach(ticket => {
        const dateStr = ticket.purchaseDate ? new Date(ticket.purchaseDate).toLocaleString('es-ES') : 'Fecha N/A';
        const name = `${ticket.nombre || ''} ${ticket.apellidos || ''}`.trim() || 'Sin nombre';
        const scanned = ticket.scannedCount || 0;
        const statusColor = scanned > 0 ? 'text-green-400' : 'text-yellow-400';

        html += `
			<li class="bg-gray-800 p-3 border border-gray-600 flex justify-between items-center text-sm">
				<div>
					<span class="block text-white font-bold">${name} (${ticket.email})</span>
					<span class="block text-gray-400">Cant: ${ticket.quantity} | ${dateStr}</span>
					<span class="block ${statusColor}">Escaneada: ${scanned} veces</span>
				</div>
				<button class="delete-ticket-btn bg-red-600 hover:bg-red-500 text-white px-2 py-1 text-xs font-pixel" data-ticket-id="${ticket.ticketId}">BORRAR</button>
			</li>
		`;
    });
    html += '</ul>';

    domRefs.ticketListContent.innerHTML = html;

    domRefs.ticketListContent.querySelectorAll('.delete-ticket-btn').forEach(btn => {
        addTrackedListener(btn, 'click', handleDeleteTicket);
    });
}


async function handleDeleteTicket(e) {
    const ticketId = e.currentTarget.dataset.ticketId;
    if (!ticketId) return;

    if (!confirm("¿Eliminar esta entrada permanentemente?")) return;

    showLoading(true);
    try {
        // Remove from state
        const idx = allTickets.findIndex(t => t.ticketId === ticketId);
        if (idx > -1) {
            const ticket = allTickets[idx];
            // Update ticketSold count in event?
            const event = appState.events.find(ev => ev.id === ticket.eventId);
            if (event) {
                event.ticketsSold = Math.max(0, (event.ticketsSold || 0) - (ticket.quantity || 0));
            }

            allTickets.splice(idx, 1); // Mutate array

            await saveTicketState();
            // We should save appState too if we updated ticketsSold, but as discussed before, we can rely on sync or save it.
            // Let's save appState to keep counters fresh.
            await saveAppState();

            renderTicketList(currentTicketEventId);
            renderAdminEvents(appState.events); // Refresh counters in list
        }

        showLoading(false);
    } catch (error) {
        console.error("Error deleting ticket:", error);
        showLoading(false);
        showInfoModal("Error al eliminar entrada.", true);
    }
}

export { resetEventForm };
