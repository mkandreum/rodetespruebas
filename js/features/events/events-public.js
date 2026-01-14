// === Events Public Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState, allTickets, setAllTickets } from '../../core/state.js';
import { saveTicketState } from '../../api/tickets-api.js';
import { showInfoModal, showLoading, closeModal } from '../../ui/modals.js';
import { clearDynamicListListeners, addTrackedListener } from '../../ui/event-listeners.js';
import { showPage } from '../../ui/navigation.js';
import { renderGalleryImages } from '../gallery/gallery-public.js';
// Wait, gallery logic should be in gallery module? 
// The original code handled gallery buttons in events list by calling renderGalleryImages.
// So yes, I need to call gallery module logic from here or navigation module logic.
// I will import renderGalleryImages if gallery-public.js exports it.
// If circular dependency, I might need to move renderGalleryImages to a shared place or use a callback pattern.
// gallery-public.js depends on appState. No major circle.

let pendingEventId = null;

// Helper to find next event
export function getNextEvent() {
    if (!appState.events) return null;
    const now = new Date();
    return appState.events
        .filter(e => e && !e.isArchived && e.date && new Date(e.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
}

/**
 * Render Home Events (Next and Recent Past)
 */
export function renderHomeEvents() {
    if (!domRefs.homeEventListContainer) return;

    clearDynamicListListeners('publicEvents'); // Shared list type with public events page? 
    // Actually home uses distinct container. Maybe specific list type? 
    // Original used 'publicEvents' for both? Let's check clearDynamicListListeners usage.
    // It uses selectors '.get-ticket-btn', etc. So safe to clear if scoped by container? 
    // clearDynamicListListeners removes GLOBAL listeners by selector. 
    // If I clear 'publicEvents', I might remove listeners from the Events Page if both are rendered?
    // Usually only one page is visible. But listeners are attached to elements. If elements are removed (innerHTML=''), listeners are gone too (GC handled if weak refs, but we track them manually).
    // So clearing listeners is good practice before clearing innerHTML.
    // However, if I use the SAME listType string for both sections, and I call renderHomeEvents, I clear ALL ticket buttons even in events page.
    // This is acceptable as usually we switch pages. But if home renders, events page is hidden.

    domRefs.homeEventListContainer.innerHTML = '';
    const events = appState.events || [];
    if (events.length === 0) {
        domRefs.homeEventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY EVENTOS.</p>';
        return;
    }

    const now = new Date();
    const activeEvents = events
        .filter(e => e && !e.isArchived && e.date && new Date(e.date) > now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    const nextActiveEvent = activeEvents[0] || null;

    const pastEvents = events
        .filter(e => e && !e.isArchived && e.date && new Date(e.date) < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    const mostRecentPastEvent = pastEvents[0] || null;

    const eventsToShow = [nextActiveEvent, mostRecentPastEvent].filter(Boolean);

    // "Ver Todos" visibility
    const allNonArchivedCount = events.filter(e => e && !e.isArchived).length;
    const viewAllContainer = document.getElementById('view-all-events-container');
    if (viewAllContainer) {
        viewAllContainer.classList.toggle('hidden', allNonArchivedCount <= eventsToShow.length);
    }

    if (eventsToShow.length === 0) {
        domRefs.homeEventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY EVENTOS PROGRAMADOS POR AHORA.</p>';
        return;
    }

    eventsToShow.forEach(event => {
        const card = createEventCard(event, nextActiveEvent);
        domRefs.homeEventListContainer.appendChild(card);
    });

    attachEventCardListeners(domRefs.homeEventListContainer);
}

/**
 * Render All Public Events
 */
export function renderPublicEvents() {
    if (!domRefs.eventListContainer) return;

    clearDynamicListListeners('publicEvents');
    domRefs.eventListContainer.innerHTML = '';

    const events = appState.events || [];
    if (events.length === 0) {
        domRefs.eventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY EVENTOS.</p>';
        return;
    }

    const now = new Date();
    const eventsToShow = events
        .filter(e => e && !e.isArchived)
        .sort((a, b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);

    if (eventsToShow.length === 0) {
        domRefs.eventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY EVENTOS PROGRAMADOS POR AHORA.</p>';
        return;
    }

    eventsToShow.forEach(event => {
        const card = createEventCard(event, null); // No "next label" on full list? Original code logic had it inside individual logic? 
        // Original 'renderPublicEvents' did NOT use Next Event logic, only Past/Active.
        domRefs.eventListContainer.appendChild(card);
    });

    attachEventCardListeners(domRefs.eventListContainer);
}


/**
 * Helper to create event card (used by both Home and Public list)
 */
function createEventCard(event, nextActiveEvent) {
    const now = new Date();
    const eventDate = new Date(event.date);
    const eventDateStr = eventDate.toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const isPastEvent = eventDate < now;
    const isNextEvent = nextActiveEvent && event.id === nextActiveEvent.id;

    let buttonHtml = '';
    let statusBadgeHtml = '';
    let cardBorderColor = 'border-white';
    let actionClass = '';
    let dataAttribute = `data-event-id="${event.id}"`;

    if (isNextEvent) {
        statusBadgeHtml = `<div class="absolute top-0 left-0 text-white font-pixel text-sm px-2 py-1 rounded-none border-b border-r border-black z-10 shadow-md" style="background-color: #F02D7D;">PRÓXIMO EVENTO</div>`;
    } else if (isPastEvent) {
        statusBadgeHtml = '<div class="absolute top-0 left-0 bg-red-700 text-white font-pixel text-sm px-2 py-1 rounded-none border-b border-r border-black z-10 shadow-md">FINALIZADO</div>';
    }

    if (isPastEvent) {
        if (event.galleryImages && event.galleryImages.length > 0) {
            buttonHtml = `<button data-event-id="${event.id}" class="gallery-link-btn w-full neon-btn text-white font-pixel text-2xl py-3 px-4 rounded-none">VER GALERÍA</button>`;
            actionClass = 'gallery-link-btn cursor-pointer';
        } else {
            buttonHtml = `<button disabled class="w-full bg-gray-800 text-gray-500 font-pixel text-2xl py-3 px-4 rounded-none border border-gray-700 cursor-not-allowed">EVENTO FINALIZADO</button>`;
            dataAttribute = '';
        }
    } else {
        // Logic for tickets
        const capacity = event.ticketCapacity || 0;
        // Sync with allTickets logic
        const currentSold = allTickets.filter(t => t.eventId === event.id).reduce((sum, t) => sum + (t.quantity || 0), 0);

        if (capacity > 0 && currentSold >= capacity) {
            buttonHtml = `<button disabled class="w-full bg-red-800 text-red-300 font-pixel text-2xl py-3 px-4 rounded-none border border-red-700 cursor-not-allowed">AGOTADO</button>`;
            dataAttribute = '';
        } else {
            buttonHtml = `<button data-event-id="${event.id}" class="get-ticket-btn w-full neon-btn font-pixel text-2xl py-3 px-4 rounded-none">CONSEGUIR ENTRADA</button>`;
            actionClass = 'get-ticket-btn cursor-pointer';
        }
    }

    const card = document.createElement('div');
    card.className = `relative bg-gray-900 rounded-none ${cardBorderColor} overflow-hidden flex flex-col transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300 reveal-on-scroll`;

    const imageUrl = event.posterImageUrl || `https://placehold.co/400x200/000000/ffffff?text=${encodeURIComponent(event.name || 'Evento')}&font=vt323`;
    const price = (event.price || 0).toFixed(2);

    card.innerHTML = `
		${statusBadgeHtml}
		<div class="w-full bg-black border-b ${cardBorderColor} overflow-hidden ${actionClass}" ${dataAttribute}>
			<img src="${imageUrl}" alt="${event.name || 'Evento'}" class="w-full ${isPastEvent ? 'opacity-60' : ''}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/400x200/000/fff?text=Error&font=vt323';">
		</div>
		<div class="p-6 flex flex-col flex-grow">
			<h3 class="text-3xl font-pixel ${isPastEvent ? 'text-gray-500' : 'text-white text-glow-white'} mb-2 ${actionClass} glitch-hover" ${dataAttribute}>
				${event.name || 'Evento sin nombre'}
			</h3>
			<p class="text-gray-400 font-semibold font-pixel text-lg mb-3">${eventDateStr}</p>
			<p class="text-4xl font-extrabold ${isPastEvent ? 'text-gray-600' : 'text-white'} mb-4">${price} €</p>
			<p class="text-gray-400 mb-6 flex-grow" style="white-space: pre-wrap;">${event.description || 'Sin descripción.'}</p>
			${buttonHtml}
		</div>
	`;

    return card;
}

function attachEventCardListeners(container) {
    container.querySelectorAll('.get-ticket-btn').forEach(btn => addTrackedListener(btn, 'click', handleGetTicket));
    container.querySelectorAll('.gallery-link-btn').forEach(btn => addTrackedListener(btn, 'click', handleGalleryLink));
}

// Handler definitions
function handleGalleryLink(e) {
    const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
    if (isNaN(eventId)) return;
    // Call gallery module
    try {
        if (typeof renderGalleryImages === 'function') {
            renderGalleryImages(eventId);
            showPage('gallery');
        } else {
            // Fallback if imported binding not ready?
            console.warn("renderGalleryImages not available");
        }
    } catch (e) { console.error(e); }
}

export function handleGetTicket(e) {
    const eventId = parseInt(e.currentTarget.dataset.eventId, 10);
    if (isNaN(eventId) || !appState || !appState.events) return;

    pendingEventId = eventId;
    const event = appState.events.find(ev => ev.id === eventId);
    if (!event) { showInfoModal("Error: Evento no encontrado.", true); pendingEventId = null; return; }

    if (event.isArchived) { showInfoModal("Este evento está archivado.", true); pendingEventId = null; return; }
    if (event.date && new Date(event.date) < new Date()) { showInfoModal("ESTE EVENTO YA HA FINALIZADO.", true); pendingEventId = null; return; }

    // Capacity check
    const capacity = event.ticketCapacity || 0;
    // Recalculate sold from tickets array for safety
    const sold = allTickets.filter(t => t.eventId === eventId).reduce((sum, t) => sum + (t.quantity || 0), 0);

    if (capacity > 0 && sold >= capacity) {
        showInfoModal("¡ENTRADAS AGOTADAS!", true); pendingEventId = null; return;
    }

    if (domRefs.emailForm) {
        domRefs.emailForm.reset();
        domRefs.emailForm['ticket-quantity'].value = 1;
    }
    domRefs.emailModal?.classList.remove('hidden');
}


// Email Submit Handler (Exported to be attached globally or in init)
export async function handleEmailSubmit(e) {
    e.preventDefault();
    if (!domRefs.emailForm || pendingEventId === null) {
        closeModal('email-modal');
        pendingEventId = null;
        return;
    }

    const userName = domRefs.emailForm['ticket-nombre'].value.trim();
    const userSurname = domRefs.emailForm['ticket-apellidos'].value.trim();
    const userEmail = domRefs.emailForm['ticket-email'].value.trim().toLowerCase();
    const quantity = parseInt(domRefs.emailForm['ticket-quantity'].value, 10);
    const eventId = pendingEventId;
    pendingEventId = null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userName || !userSurname) { showInfoModal("POR FAVOR, INTRODUCE TU NOMBRE Y APELLIDOS.", true); return; }
    if (!userEmail || !emailRegex.test(userEmail)) { showInfoModal("POR FAVOR, INTRODUCE UN EMAIL VÁLIDO.", true); return; }

    const allowedDomains = appState.allowedDomains || [];
    const isDomainAllowed = allowedDomains.length === 0 || allowedDomains.some(domain => userEmail.endsWith(domain));
    if (!isDomainAllowed) { showInfoModal("Dominio de correo no permitido.", true); return; }

    if (isNaN(quantity) || quantity <= 0) { showInfoModal("CANTIDAD INVÁLIDA.", true); return; }

    const event = appState.events.find(ev => ev.id === eventId);
    if (!event) { showInfoModal("Error: Evento no encontrado.", true); closeModal('email-modal'); return; }

    // Check duplicates
    const existingTicket = allTickets.find(t => t.eventId === eventId && t.email === userEmail);
    if (existingTicket) {
        closeModal('email-modal');
        const holderName = `${existingTicket.nombre || ''} ${existingTicket.apellidos || ''}`.trim() || userEmail;
        showInfoModal(`Este email ya tiene ${existingTicket.quantity} entrada(s).<br>Cierra para ver QR.`, false,
            () => displayTicketModal(event, existingTicket.ticketId, userEmail, existingTicket.quantity, holderName));
        return;
    }

    // Final capacity check
    const capacity = event.ticketCapacity || 0;
    const currentSold = allTickets.filter(t => t.eventId === eventId).reduce((sum, t) => sum + (t.quantity || 0), 0);

    if (capacity > 0 && (currentSold + quantity) > capacity) {
        const remaining = Math.max(0, capacity - currentSold);
        showInfoModal(remaining === 0 ? "¡ENTRADAS AGOTADAS!" : `Solo quedan ${remaining} entrada(s).`, true);
        pendingEventId = eventId;
        return;
    }

    closeModal('email-modal');
    await generateTicket(eventId, userName, userSurname, userEmail, quantity, event.name);
}


async function generateTicket(eventId, userName, userSurname, userEmail, quantity, eventName) {
    showLoading(true);
    try {
        const ticketId = crypto.randomUUID();
        const purchaseDate = new Date().toISOString();

        const newTicket = {
            ticketId: ticketId,
            eventId: eventId,
            nombre: userName,
            apellidos: userSurname,
            email: userEmail,
            quantity: quantity,
            purchaseDate: purchaseDate,
            scannedCount: 0
        };

        // Push to live array
        allTickets.push(newTicket);
        // Note: event.ticketsSold will be updated by sync logic or next render, but better to update it? 
        // Actually appState.events is single source of truth for display? 
        // The original code updated event.ticketsSold.
        // I will rely on getter/calculation or update it.
        // Let's update it to be safe.
        const evt = appState.events.find(e => e.id === eventId);
        if (evt) evt.ticketsSold = (evt.ticketsSold || 0) + quantity;

        await saveTicketState(); // saves allTickets to DB
        // Also should save appState if ticketsSold changed? 
        // Yes, ticketsSold is in appState json.
        // Wait, safeTicketState saves to tickets_db.json. 
        // appState saves to datos_app.json. They are separate.
        // So we must save appState too?
        // Original code: await saveTicketState(); ... saveAppState is NOT called for ticket purchase? 
        // Yes, syncTicketCounters runs on init. 
        // But in runtime? 
        // Original handleEmailSubmit -> generateTicket -> saveTicketState. 
        // Does NOT save appState. So 'ticketsSold' in appState is just a cache/counter that might drift until next sync.
        // I will respect original logic: Only saveTicketState.

        const fullName = `${userName} ${userSurname}`;
        displayTicketModal(evt, ticketId, userEmail, quantity, fullName);

    } catch (error) {
        console.error("Error generating ticket:", error);
        showInfoModal("Error al generar la entrada.", true);
    } finally {
        showLoading(false);
    }
}


function displayTicketModal(event, ticketId, email, quantity, holderName) {
    if (!domRefs.ticketModal || !domRefs.ticketQrCode) return;

    if (domRefs.ticketLogoImg) {
        domRefs.ticketLogoImg.src = appState.ticketLogoUrl || '';
        domRefs.ticketLogoImg.classList.toggle('hidden', !appState.ticketLogoUrl);
    }

    if (domRefs.ticketEventName) domRefs.ticketEventName.textContent = event.name || 'Evento';
    if (domRefs.ticketType) domRefs.ticketType.textContent = "GENERAL";
    if (domRefs.ticketHolder) domRefs.ticketHolder.textContent = holderName;
    if (domRefs.ticketQuantity) domRefs.ticketQuantity.textContent = `VÁLIDA PARA ${quantity} PERSONA(S)`;
    if (domRefs.ticketIdDisplay) domRefs.ticketIdDisplay.textContent = `ID: ${ticketId.substring(0, 8)}`;

    if (domRefs.bankInfoText) {
        domRefs.bankInfoText.textContent = appState.bankInfo || "Información de pago no disponible.";
    }

    domRefs.ticketQrCode.innerHTML = '';
    // QR Format: TICKET:{ticketId}
    const qrText = `TICKET:${ticketId}`;

    if (typeof QRCode !== 'undefined') {
        new QRCode(domRefs.ticketQrCode, {
            text: qrText,
            width: 200, height: 200,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    if (domRefs.downloadTicketBtn) {
        domRefs.downloadTicketBtn.dataset.ticketId = ticketId;
        domRefs.downloadTicketBtn.dataset.eventName = event.name || 'evento';
        domRefs.downloadTicketBtn.dataset.holderName = holderName.replace(/\s+/g, '_');
    }

    domRefs.ticketModal.classList.remove('hidden');
}


export async function handleDownloadTicketQr() {
    if (!domRefs.ticketQrToDownload || typeof html2canvas === 'undefined' || !domRefs.downloadTicketBtn) {
        showInfoModal("Error descarga.", true); return;
    }

    const ticketId = domRefs.downloadTicketBtn.dataset.ticketId || 'id';
    const eventName = domRefs.downloadTicketBtn.dataset.eventName || 'evento';
    const holderName = domRefs.downloadTicketBtn.dataset.holderName || 'entrada';

    showLoading(true);
    try {
        const canvas = await html2canvas(domRefs.ticketQrToDownload, { scale: 2, backgroundColor: "#000000" });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;

        const safeEventName = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeHolderAndId = `${holderName.replace(/[^a-z0-9_]/gi, '').toLowerCase()}_${ticketId.substring(0, 8)}`;

        link.download = `entrada_${safeEventName}_${safeHolderAndId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showLoading(false);
        showInfoModal("ENTRADA DESCARGADA.", false);
    } catch (error) {
        console.error("Error download ticket:", error);
        showLoading(false);
        showInfoModal("Error al descargar entrada.", true);
    }
}
