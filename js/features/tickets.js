
import { store } from '../store.js';
import { showInfoModal, closeModal, showLoading } from '../ui.js';
import { saveTicketState, saveAppState } from '../api.js';

export function openTicketModal(eventId) {
    const event = store.appState.events.find(e => e.id === parseInt(eventId));
    if (!event) return;

    if (event.isArchived || new Date(event.date) < new Date()) {
        showInfoModal("Este evento ya no está disponible", true); return;
    }

    const form = document.getElementById('email-form');
    form.reset();
    form['ticket-quantity'].value = 1;
    store.pendingEventId = event.id;
    document.getElementById('email-modal').classList.remove('hidden');
}

export async function handleEmailFormSubmit(e) {
    e.preventDefault();
    const eventId = store.pendingEventId;
    if (!eventId) return;

    const form = e.target;
    const name = form['ticket-nombre'].value;
    const surname = form['ticket-apellidos'].value;
    const email = form['ticket-email'].value.toLowerCase();
    const qty = parseInt(form['ticket-quantity'].value);

    if (!name || !email || qty < 1) { showInfoModal("Datos inválidos", true); return; }

    // --- RESTORED DOMAIN VALIDATION ---
    const allowedDomains = store.appState.allowedDomains || [];
    if (allowedDomains.length > 0) {
        const isAllowed = allowedDomains.some(d => email.endsWith(d));
        if (!isAllowed) {
            showInfoModal("Dominio de correo no permitido.", true);
            return;
        }
    }
    // ----------------------------------

    const event = store.appState.events.find(e => e.id === eventId);

    const existing = store.allTickets.find(t => t.eventId === eventId && t.email === email);
    if (existing) {
        closeModal('email-modal');
        showInfoModal(`Ya tienes ${existing.quantity} entrada(s). Cierra para ver tu QR.`, false, () => {
            displayTicketModal(event, existing.ticketId, email, existing.quantity, `${existing.nombre} ${existing.apellidos}`);
        });
        return;
    }

    closeModal('email-modal');
    await generateTicket(event, name, surname, email, qty);
}

export async function generateTicket(event, name, surname, email, qty) {
    showLoading(true);
    try {
        const ticketId = crypto.randomUUID();
        const newTicket = {
            ticketId,
            eventId: event.id,
            nombre: name, apellidos: surname, email, quantity: qty,
            isUsed: false
        };

        store.allTickets.push(newTicket);

        const totalSold = store.allTickets.filter(t => t.eventId === event.id).reduce((s, t) => s + (t.quantity || 0), 0);
        const evtIdx = store.appState.events.findIndex(e => e.id === event.id);
        if (evtIdx > -1) store.appState.events[evtIdx].ticketsSold = totalSold;

        await saveTicketState();
        displayTicketModal(event, ticketId, email, qty, `${name} ${surname}`);

    } catch (e) {
        console.error(e);
        showInfoModal("Error generando ticket", true);
    } finally {
        showLoading(false);
    }
}

export function displayTicketModal(event, ticketId, email, qty, fullName) {
    const modal = document.getElementById('ticket-modal');
    const qrDiv = document.getElementById('ticket-qr-code');

    document.getElementById('ticket-holder-name').textContent = fullName;
    document.getElementById('ticket-event-name').textContent = event.name;
    document.getElementById('ticket-event-date').textContent = new Date(event.date).toLocaleDateString();
    document.getElementById('ticket-quantity-details').textContent = `Cantidad: ${qty}`;

    qrDiv.innerHTML = '';
    // @ts-ignore
    if (typeof QRCode !== 'undefined') new QRCode(qrDiv, { text: `TICKET_ID:${ticketId}`, width: 200, height: 200 });

    const dlBtn = document.getElementById('download-ticket-btn');
    dlBtn.dataset.holderName = fullName.replace(/\s+/g, '_');
    dlBtn.dataset.eventName = event.name;

    const posterImg = document.getElementById('ticket-event-poster-img');
    const posterCont = document.getElementById('ticket-event-poster-container');
    if (posterImg && posterCont) {
        if (event.posterImageUrl) {
            posterImg.src = event.posterImageUrl;
            posterCont.classList.remove('hidden');
        } else {
            posterCont.classList.add('hidden');
        }
    }
    modal.classList.remove('hidden');
}

export async function handleDownloadTicket() {
    const ticketElement = document.getElementById('ticket-modal').querySelector('.border-4');

    if (!ticketElement || typeof html2canvas === 'undefined') {
        showInfoModal("No se puede descargar (Error interno).", true); return;
    }

    const btn = document.getElementById('download-ticket-btn');
    const holder = btn.dataset.holderName || 'ticket';
    const evt = btn.dataset.eventName || 'evento';

    showLoading(true);
    try {
        const canvas = await html2canvas(ticketElement, { scale: 2, backgroundColor: "#000000" });
        const link = document.createElement('a');
        link.download = `entrada_rodetes_${holder}_${evt}.png`.replace(/\s+/g, '_');
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error(e);
        showInfoModal("Error descargando entrada", true);
    } finally {
        showLoading(false);
    }
}
