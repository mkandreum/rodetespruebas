
import { store } from '../store.js';
import { clearDynamicListListeners, addTrackedListener, showInfoModal, showLoading, closeModal } from '../ui.js';
import { saveAppState, saveTicketState } from '../api.js';
import { renderPublicEvents } from './events.js';

// ... (renderAdminEvents, handleSaveEvent, resetEventForm exports from previous step remain here - I will include them to ensure file integrity)

export function renderAdminEvents(events) {
    const ul = document.getElementById('admin-events-list-ul');
    if (!ul) return;

    clearDynamicListListeners('adminEvents');
    ul.innerHTML = '';

    if (!events || events.length === 0) {
        ul.innerHTML = '<li class="text-gray-400 text-center font-pixel">NO HAY EVENTOS.</li>';
        return;
    }

    const sorted = [...events].sort((a, b) => {
        if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
        return new Date(b.date) - new Date(a.date);
    });

    sorted.forEach(evt => {
        const tickets = store.allTickets.filter(t => t.eventId === evt.id);
        const soldQty = tickets.reduce((s, t) => s + (t.quantity || 0), 0);
        const purchasedCount = tickets.length; // Number of "orders"
        const capacity = evt.ticketCapacity || 0;
        const isArchived = evt.isArchived;
        const barWidth = capacity > 0 ? Math.min((soldQty / capacity) * 100, 100) : 0;

        const li = document.createElement('li');
        li.className = `bg-gray-800 p-4 border ${isArchived ? 'border-gray-700 opacity-60' : 'border-gray-500'}`;
        li.innerHTML = `
            <div class="flex flex-wrap justify-between items-center mb-3 gap-y-2">
                <div class="flex-grow min-w-0 mr-4">
                    <span class="font-pixel text-xl ${isArchived ? 'line-through text-gray-500' : 'text-white'}">${evt.name}</span>
                    <span class="text-sm text-gray-400 ml-2">(${new Date(evt.date).toLocaleDateString()})</span>
                </div>
                <div class="flex-shrink-0 flex gap-2">
                    <span class="text-lg text-blue-400 font-bold">${evt.price.toFixed(2)}€</span>
                    <button data-event-id="${evt.id}" class="view-tickets-btn bg-green-600 text-white px-3 py-1 font-pixel text-sm hover:bg-green-500">LISTA (${soldQty})</button>
                    ${!isArchived ? `<button data-event-id="${evt.id}" class="edit-event-btn bg-blue-600 text-white px-3 py-1 font-pixel text-sm hover:bg-blue-500">EDITAR</button>` : ''}
                    <button data-event-id="${evt.id}" class="archive-event-btn ${isArchived ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-500'} text-white px-3 py-1 font-pixel text-sm">
                        ${isArchived ? 'ARCHIVADO' : 'ARCHIVAR'}
                    </button>
                    <button data-event-id="${evt.id}" class="delete-event-btn bg-red-600 text-white px-3 py-1 font-pixel text-sm hover:bg-red-500">ELIMINAR</button>
                </div>
            </div>
             <div class="w-full bg-gray-600 h-4 border border-gray-400 overflow-hidden">
                <div class="bg-green-500 h-full" style="width: ${barWidth}%;"></div>
            </div>
            <div class="text-sm text-gray-300 mt-1">Órdenes: <strong>${purchasedCount}</strong> | Entradas: <strong>${soldQty}</strong> / ${capacity || '∞'}</div>
        `;
        ul.appendChild(li);
    });

    // Listeners
    ul.querySelectorAll('.view-tickets-btn').forEach(b => addTrackedListener(b, 'click', handleViewTickets));
    ul.querySelectorAll('.edit-event-btn').forEach(b => addTrackedListener(b, 'click', handleEditEvent));
    ul.querySelectorAll('.delete-event-btn').forEach(b => addTrackedListener(b, 'click', handleDeleteEvent));
    ul.querySelectorAll('.archive-event-btn').forEach(b => addTrackedListener(b, 'click', handleArchiveEvent));
}

export async function handleSaveEvent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const idToSave = store.editingEventId;
    const name = formData.get('event-name');
    const date = formData.get('event-date');
    const price = parseFloat(formData.get('event-price'));
    const capacity = parseInt(formData.get('event-capacity'));
    const desc = formData.get('event-description');
    const poster = formData.get('event-poster-url');

    if (!name || !date) { showInfoModal("Nombre y Fecha requeridos", true); return; }

    showLoading(true);
    try {
        if (idToSave !== null) {
            const idx = store.appState.events.findIndex(e => e.id === idToSave);
            if (idx > -1) {
                store.appState.events[idx] = {
                    ...store.appState.events[idx],
                    name, date, price, ticketCapacity: capacity, description: desc, posterImageUrl: poster
                };
            }
        } else {
            store.appState.events.push({
                id: store.appState.nextEventId++,
                name, date, price, ticketCapacity: capacity, description: desc, posterImageUrl: poster,
                isArchived: false,
                galleryImages: [], ticketsSold: 0
            });
        }
        await saveAppState();
        resetEventForm();
        renderAdminEvents(store.appState.events);
        renderPublicEvents(store.appState.events);
        showInfoModal("Evento Guardado", false);
    } catch (e) { console.error(e); showInfoModal("Error guardando", true); }
    finally { showLoading(false); }
}

export function resetEventForm() {
    document.getElementById('add-event-form')?.reset();
    store.editingEventId = null;
    const btnText = document.getElementById('add-event-btn-text');
    if (btnText) btnText.textContent = "GUARDAR EVENTO";
}

function handleEditEvent(e) {
    const id = parseInt(e.target.dataset.eventId);
    const ev = store.appState.events.find(e => e.id === id);
    if (!ev) return;

    store.editingEventId = id;
    const form = document.getElementById('add-event-form');
    form['event-name'].value = ev.name;
    form['event-date'].value = ev.date;
    form['event-price'].value = ev.price;
    form['event-capacity'].value = ev.ticketCapacity;
    form['event-description'].value = ev.description || '';
    form['event-poster-url'].value = ev.posterImageUrl || '';

    const btnText = document.getElementById('add-event-btn-text');
    if (btnText) btnText.textContent = "ACTUALIZAR EVENTO";

    document.getElementById('admin-events').scrollIntoView({ behavior: 'smooth' }); // Scroll top
}

async function handleArchiveEvent(e) {
    const id = parseInt(e.target.dataset.eventId);
    const ev = store.appState.events.find(e => e.id === id);
    if (!ev) return;
    ev.isArchived = !ev.isArchived; // Toggle? No, usually just archive. Logic from app.js was one-way but toggle makes sense. 
    // App.js checked 'if isArchived return'. I'll stick to Archive Only for now to mimic app.js
    if (ev.isArchived === true) return;

    ev.isArchived = true;
    await saveAppState();
    renderAdminEvents(store.appState.events);
    renderPublicEvents(store.appState.events);
}

async function handleDeleteEvent(e) {
    const id = parseInt(e.target.dataset.eventId);
    if (!confirm("¿Eliminar evento y sus entradas?")) return;

    store.appState.events = store.appState.events.filter(e => e.id !== id);
    store.allTickets = store.allTickets.filter(t => t.eventId !== id);
    await Promise.all([saveAppState(), saveTicketState()]);

    if (store.editingEventId === id) resetEventForm();

    renderAdminEvents(store.appState.events);
    renderPublicEvents(store.appState.events);
}

export function handleViewTickets(e) {
    const eventId = parseInt(e.target.dataset.eventId);
    const event = store.appState.events.find(ev => ev.id === eventId);
    if (!event) return;

    const modal = document.getElementById('ticket-list-modal');
    const ul = document.getElementById('ticket-list-ul');
    const title = document.getElementById('ticket-list-event-title');

    if (title) title.textContent = event.name;
    if (!ul) return;

    // Filter tickets
    const tickets = store.allTickets.filter(t => t.eventId === eventId); // Sort if needed

    renderTicketList(ul, tickets, eventId);
    modal.classList.remove('hidden');
}

function renderTicketList(ul, tickets, eventId) {
    clearDynamicListListeners('ticketModalList'); // Helper function works per list type
    ul.innerHTML = '';

    if (tickets.length === 0) {
        ul.innerHTML = '<li class="text-gray-400 p-2 text-center">No hay entradas vendidas.</li>';
        return;
    }

    // Sort logic (can be optional)
    tickets.forEach(ticket => {
        const li = document.createElement('li');
        li.className = "bg-gray-700 p-3 mb-2 border border-gray-500 flex justify-between items-center";
        const isUsed = store.appState.scannedTickets && store.appState.scannedTickets[ticket.ticketId];

        li.innerHTML = `
            <div>
                <p class="text-white font-bold">${ticket.nombre || ''} ${ticket.apellidos || ''}</p>
                <p class="text-sm text-gray-300">${ticket.email}</p>
                <p class="text-xs text-gray-400 font-mono">ID: ${ticket.ticketId.substring(0, 8)}...</p>
                ${isUsed ? `<span class="text-xs text-yellow-400 font-bold">[USADA: ${isUsed}/${ticket.quantity}]</span>` : ''}
            </div>
            <div class="text-right">
                <span class="block text-xl font-pixel text-white">${ticket.quantity} ud.</span>
                <button class="delete-ticket-btn text-red-400 text-xs hover:text-red-300 underline mt-1" data-ticket-id="${ticket.ticketId}">ELIMINAR</button>
            </div>
        `;
        ul.appendChild(li);
    });

    ul.querySelectorAll('.delete-ticket-btn').forEach(btn => {
        addTrackedListener(btn, 'click', (e) => handleDeleteTicket(e, eventId));
    });
}

async function handleDeleteTicket(e, eventId) {
    const ticketId = e.target.dataset.ticketId;
    if (!confirm("¿Borrar esta entrada?")) return;

    showLoading(true);
    try {
        store.allTickets = store.allTickets.filter(t => t.ticketId !== ticketId);

        // Update sold count on event
        const totalSold = store.allTickets.filter(t => t.eventId === eventId).reduce((s, t) => s + (t.quantity || 0), 0);
        const evIdx = store.appState.events.findIndex(ev => ev.id === eventId);
        if (evIdx > -1) store.appState.events[evIdx].ticketsSold = totalSold;

        await Promise.all([saveTicketState(), saveAppState()]); // Save updated count and tickets

        // Re-render list inside modal
        const ul = document.getElementById('ticket-list-ul');
        if (ul) renderTicketList(ul, store.allTickets.filter(t => t.eventId === eventId), eventId);

        // Re-render admin event list "background" to update count bars
        renderAdminEvents(store.appState.events);

    } catch (err) {
        showInfoModal("Error borrando ticket", true);
    } finally {
        showLoading(false);
    }
}
