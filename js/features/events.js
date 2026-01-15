
import { store } from '../store.js';
import { addTrackedListener, clearDynamicListListeners, showInfoModal, closeModal } from '../ui.js';
import { showPage } from '../router.js';
import { renderGalleryImages } from './gallery.js';
import { openTicketModal } from './tickets.js';

export function renderPublicEvents(events) {
    clearDynamicListListeners('publicEvents');
    const container = document.getElementById('event-list-container');
    if (!container) return;
    container.innerHTML = '';

    const now = new Date();
    // Sort: future events first (ascending by date), then past events (descending) -- or usually just descending?
    // App.js used: new Date(b.date) - new Date(a.date) (Newest first)
    const sorted = (events || []).filter(e => !e.isArchived).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center font-pixel">NO HAY EVENTOS PROGRAMADOS.</p>';
        return;
    }

    sorted.forEach(evt => {
        const isPast = new Date(evt.date) < now;
        const dateStr = new Date(evt.date).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        let btnHtml = '';
        if (isPast) {
            if (evt.galleryImages && evt.galleryImages.length > 0) {
                btnHtml = `<button data-event-id="${evt.id}" class="gallery-link-btn w-full neon-btn text-white font-pixel text-2xl py-3 px-4">VER GALERÍA</button>`;
            } else {
                btnHtml = `<button disabled class="w-full bg-gray-800 text-gray-500 font-pixel text-2xl py-3 px-4">FINALIZADO</button>`;
            }
        } else {
            btnHtml = `<button data-event-id="${evt.id}" class="get-ticket-btn w-full neon-btn font-pixel text-2xl py-3 px-4">CONSEGUIR ENTRADA</button>`;
        }

        const card = document.createElement('div');
        card.className = "relative bg-gray-900 border border-white flex flex-col reveal-on-scroll";
        card.innerHTML = `
            ${isPast ? '<div class="absolute top-0 left-0 bg-red-700 text-white font-pixel text-sm px-2 py-1">FINALIZADO</div>' : ''}
            <div class="w-full bg-black border-b border-white">
                <img src="${evt.posterImageUrl || ''}" class="w-full ${isPast ? 'opacity-60' : ''}" onerror="this.src='https://placehold.co/400x200?text=Evento';">
            </div>
            <div class="p-6 flex flex-col flex-grow">
                <h3 class="text-3xl font-pixel text-white mb-2">${evt.name}</h3>
                <p class="text-gray-400 font-semibold font-pixel text-lg mb-3">${dateStr}</p>
                <p class="text-4xl font-extrabold text-white mb-4">${evt.price.toFixed(2)} €</p>
                <p class="text-gray-400 mb-6 flex-grow">${evt.description}</p>
                ${btnHtml}
            </div>
        `;
        container.appendChild(card);
    });

    // Attach listeners
    container.querySelectorAll('.get-ticket-btn').forEach(btn =>
        addTrackedListener(btn, 'click', (e) => openTicketModal(e.target.dataset.eventId))
    );
    container.querySelectorAll('.gallery-link-btn').forEach(btn =>
        addTrackedListener(btn, 'click', (e) => {
            renderGalleryImages(parseInt(e.target.dataset.eventId));
            showPage('gallery');
        })
    );
}

export function renderHomeEvents(events) {
    const container = document.getElementById('home-event-list-container');
    if (!container) return;
    container.innerHTML = '';

    // Logic similar to public but limit to 2 future events
    const now = new Date();
    const future = events.filter(e => !e.isArchived && new Date(e.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (future.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center text-gray-500 font-pixel">No hay eventos próximos.</p>';
        return;
    }

    future.slice(0, 2).forEach(evt => {
        const dateStr = new Date(evt.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' });
        const card = document.createElement('div');
        card.className = "bg-gray-900 border border-white flex flex-col reveal-on-scroll";
        card.innerHTML = `
             <div class="bg-black border-b border-white h-48 overflow-hidden">
                 <img src="${evt.posterImageUrl}" class="w-full h-full object-cover">
             </div>
             <div class="p-4 flex flex-col flex-grow">
                 <h3 class="text-2xl font-pixel text-white text-glow-white mb-1">${evt.name}</h3>
                 <p class="text-pink-500 font-pixel text-lg mb-2">${dateStr}</p>
                 <button data-event-id="${evt.id}" class="get-ticket-btn mt-auto w-full neon-btn text-white font-pixel text-xl py-2">ENTRADAS</button>
             </div>
         `;
        container.appendChild(card);
    });

    container.querySelectorAll('.get-ticket-btn').forEach(btn =>
        addTrackedListener(btn, 'click', (e) => openTicketModal(e.target.dataset.eventId))
    );
}
