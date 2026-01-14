// === Giveaway Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { allTickets } from '../../core/state.js';
import { showInfoModal, showLoading } from '../../ui/modals.js';

export function renderGiveawayEvents(events) {
    if (!domRefs.giveawaySelect || !domRefs.giveawayResult) return;

    const previousValue = domRefs.giveawaySelect.value;
    domRefs.giveawaySelect.innerHTML = '<option value="">-- ELIGE UN EVENTO --</option>';

    const eventsToShow = events || [];
    // Mostrar solo eventos con entradas vendidas (aunque podríamos mostrar todos y que diga "nadie")
    // Mejor ordenados por fecha
    [...eventsToShow].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(event => {
        const sold = allTickets.filter(t => t.eventId === event.id).reduce((sum, t) => sum + (t.quantity || 0), 0);
        if (sold > 0) {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = `${event.name || 'Evento'} (${sold} participantes)`;
            domRefs.giveawaySelect.appendChild(option);
        }
    });

    if (previousValue && [...domRefs.giveawaySelect.options].some(o => o.value === previousValue)) {
        domRefs.giveawaySelect.value = previousValue;
    } else {
        domRefs.giveawaySelect.value = "";
    }

    // Reset result view
    if (domRefs.giveawayResultContainer) domRefs.giveawayResultContainer.classList.add('hidden');
    if (domRefs.giveawayResult) domRefs.giveawayResult.textContent = '...';
}


export async function handleGiveaway(e) {
    e.preventDefault();
    if (!domRefs.giveawaySelect || !domRefs.giveawayResult || !allTickets) return;

    const eventId = parseInt(domRefs.giveawaySelect.value, 10);
    if (isNaN(eventId)) {
        showInfoModal("Selecciona un evento válido con participantes.", true); return;
    }

    // Obtener lista de TICKETS (cada ticket es una oportunidad de ganar? O por persona?)
    // Normalmente 1 entrada = 1 oportunidad.
    // Si un ticket tiene quantity=3, ¿son 3 oportunidades?
    // El código original usaba "tickets" array. 
    // Vamos a expandir los tickets según su quantity para el pool de sorteo.

    const participants = [];
    allTickets.filter(t => t.eventId === eventId).forEach(ticket => {
        const qty = ticket.quantity || 1;
        for (let i = 0; i < qty; i++) {
            participants.push({
                name: `${ticket.nombre || ''} ${ticket.apellidos || ''}`.trim() || ticket.email,
                email: ticket.email,
                ticketId: ticket.ticketId
            });
        }
    });

    if (participants.length === 0) {
        showInfoModal("No hay participantes para este evento.", true); return;
    }

    // Animación
    domRefs.giveawayResultContainer.classList.remove('hidden');
    const btn = domRefs.giveawayBtn; // Assuming specific button reference passed or global? 
    // The listener calls this handler.
    if (e.currentTarget) e.currentTarget.disabled = true;

    const duration = 3000; // 3 segundos
    const intervalTime = 50;
    const iterations = duration / intervalTime;
    let count = 0;

    const interval = setInterval(() => {
        const randomIdx = Math.floor(Math.random() * participants.length);
        domRefs.giveawayResult.textContent = participants[randomIdx].name;
        domRefs.giveawayResult.style.color = count % 2 === 0 ? '#F02D7D' : '#00f3ff';
        count++;

        if (count >= iterations) {
            clearInterval(interval);
            // Ganador final
            const winnerIdx = Math.floor(Math.random() * participants.length);
            const winner = participants[winnerIdx];

            domRefs.giveawayResult.textContent = `¡${winner.name}!`;
            domRefs.giveawayResult.style.color = '#00ff00';
            domRefs.giveawayResult.classList.add('animate-bounce');

            if (e.currentTarget) e.currentTarget.disabled = false;

            // Confeti
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#F02D7D', '#00f3ff', '#ffffff']
                });
            }
        }
    }, intervalTime);
}
