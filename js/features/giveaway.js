
import { store } from '/js/store.js';
import { clearDynamicListListeners, addTrackedListener, showInfoModal, showLoading } from '/js/ui.js';

export function renderGiveawayEvents(events) {
    clearDynamicListListeners('giveaway');
    const ul = document.getElementById('giveaway-event-list-ul');
    const resultDiv = document.getElementById('giveaway-winner-result');

    if (!ul || !resultDiv) return;

    ul.innerHTML = '';
    resultDiv.innerHTML = '<p class="text-gray-500 font-pixel">SELECCIONA UN EVENTO Y PULSA "INDICAR GANADOR"</p>';

    const eventsWithTickets = events.filter(e => store.allTickets.some(t => t.eventId === e.id));

    if (eventsWithTickets.length === 0) {
        ul.innerHTML = '<li class="text-gray-400 text-center font-pixel">NO HAY EVENTOS CON ENTRADAS PARA SORTEAR.</li>';
        return;
    }

    eventsWithTickets.sort((a, b) => new Date(b.date) - new Date(a.date));

    eventsWithTickets.forEach(evt => {
        const count = store.allTickets.filter(t => t.eventId === evt.id).length;
        const li = document.createElement('li');
        li.className = "flex flex-wrap justify-between items-center bg-gray-800 p-4 border border-gray-500 gap-4";
        li.innerHTML = `
            <div class="min-w-0 mr-4">
                <span class="font-pixel text-xl text-white block truncate">${evt.name}</span>
                <span class="text-sm text-gray-400">(${count} compras)</span>
            </div>
            <button data-event-id="${evt.id}" class="giveaway-btn bg-white text-black font-pixel text-lg px-4 py-2 border border-gray-400 hover:bg-gray-300">INDICAR GANADOR</button>
        `;
        ul.appendChild(li);
    });

    ul.querySelectorAll('.giveaway-btn').forEach(btn => addTrackedListener(btn, 'click', handleGiveawayClick));
}

function handleGiveawayClick(e) {
    const eventId = parseInt(e.target.dataset.eventId);
    const event = store.appState.events.find(e => e.id === eventId);
    if (!event) return;

    const tickets = store.allTickets.filter(t => t.eventId === eventId);
    if (tickets.length === 0) return;

    const resultDiv = document.getElementById('giveaway-winner-result');
    showLoading(true);

    setTimeout(() => {
        const winner = tickets[Math.floor(Math.random() * tickets.length)];
        const name = `${winner.nombre || ''} ${winner.apellidos || ''}`.trim() || 'Desconocido';

        showLoading(false);
        resultDiv.innerHTML = `
            <p class="text-gray-300 font-pixel text-xl mb-2">EL GANADOR PARA</p>
            <h4 class="text-3xl font-pixel text-white text-glow-white mb-4">${event.name}</h4>
            <p class="text-gray-300 font-pixel text-xl mb-2">ES:</p>
            <p class="text-4xl font-pixel text-green-400 text-glow-white mb-2 break-all">${name}</p>
            <p class="text-lg text-gray-400 font-pixel">(${winner.email})</p>
            <p class="text-gray-400 font-pixel text-base">Ticket ID: ${winner.ticketId.substring(0, 8)}...</p>
        `;
    }, 500); // Effect delay
}
