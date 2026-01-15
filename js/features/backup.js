
import { store } from '../store.js';
import { showInfoModal, showLoading } from '../ui.js';
import { saveAppState, saveTicketState, saveMerchSalesState } from '../api.js';
import { readFileAsText, readFileAsArrayBuffer } from '../utils.js';
import {
    renderAppLogo
} from './settings.js';
import {
    renderNextEventPromo
} from './home.js';
import { renderPublicEvents as rPE, renderHomeEvents as rHE } from './events.js';
import { renderGalleryEventList as rGE, renderPastGalleries as rPG } from './gallery.js';
import { renderDragList as rDL } from './drags.js';
import { renderAdminEvents } from './events_admin.js';
import { renderAdminDrags } from './drags_admin.js';
import { renderAdminMerch } from './merch_admin.js';
import { renderGiveawayEvents } from './giveaway.js';
import { checkAdminUI } from './admin.js';
import { loadContentToAdmin } from './settings.js';

export async function handleBackup() {
    if (typeof JSZip === 'undefined') {
        showInfoModal("Librería JSZip no encontrada.", true); return;
    }

    showLoading(true);
    try {
        const stateToBackup = {
            ...store.appState,
            events: (store.appState.events || []).map(e => {
                const { purchasedTickets, ...rest } = e;
                return rest;
            })
        };

        // @ts-ignore
        const zip = new JSZip();
        zip.file("datos_app.json", JSON.stringify(stateToBackup, null, 2));
        zip.file("entradas_db.json", JSON.stringify(store.allTickets || [], null, 2));
        zip.file("merch_vendido.json", JSON.stringify(store.allMerchSales || [], null, 2));

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rodetes_backup_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showInfoModal("Backup descargado.", false);
    } catch (e) {
        console.error(e);
        showInfoModal("Error creando backup.", true);
    } finally {
        showLoading(false);
    }
}

export async function handleRestore(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    showLoading(true);
    try {
        let restoredState = null;
        let restoredTickets = null;
        let restoredMerch = null;

        if (file.name.endsWith('.zip')) {
            // @ts-ignore
            if (typeof JSZip === 'undefined') throw new Error("JSZip faltante.");

            const zipData = await readFileAsArrayBuffer(file);
            // @ts-ignore
            const zip = await JSZip.loadAsync(zipData);

            const appF = zip.file("datos_app.json");
            const tickF = zip.file("entradas_db.json");
            const merchF = zip.file("merch_vendido.json");

            if (!appF || !tickF) throw new Error("ZIP inválido (faltan archivos JSON).");

            restoredState = JSON.parse(await appF.async("string"));
            restoredTickets = JSON.parse(await tickF.async("string"));
            if (merchF) restoredMerch = JSON.parse(await merchF.async("string"));
            else restoredMerch = [];

        } else if (file.name.endsWith('.json')) {
            // Legacy JSON support
            const txt = await readFileAsText(file);
            const legacyState = JSON.parse(txt);
            if (!legacyState.events) throw new Error("JSON antiguo inválido.");

            restoredTickets = [];
            legacyState.events.forEach(ev => {
                if (ev.purchasedTickets) {
                    Object.keys(ev.purchasedTickets).forEach(email => {
                        const t = ev.purchasedTickets[email];
                        restoredTickets.push({ ticketId: t.ticketId, eventId: ev.id, email, quantity: t.quantity });
                    });
                }
                delete ev.purchasedTickets;
            });
            restoredState = legacyState;
            restoredMerch = [];
        } else {
            throw new Error("Formato no soportado.");
        }

        if (!restoredState || !restoredTickets) throw new Error("Datos corruptos.");

        // Apply
        store.appState = {
            ...restoredState,
            events: (restoredState.events || []).map(e => ({ galleryImages: [], ...e })), // Ensure safe
            webMerch: restoredState.webMerch || []
        };
        store.allTickets = restoredTickets;
        store.allMerchSales = restoredMerch || [];

        // Save
        await Promise.all([saveAppState(), saveTicketState(), saveMerchSalesState()]);

        // Refresh UI
        refreshUI();

        showInfoModal("Restauración completada.", false);

    } catch (e) {
        console.error(e);
        showInfoModal("Error restaurando: " + e.message, true);
    } finally {
        showLoading(false);
        if (event.target) event.target.value = '';
    }
}

function refreshUI() {
    const evts = store.appState.events;
    rPE(evts); rHE(evts); rGE(); rPG(evts); rDL();
    if (store.isLoggedIn) {
        checkAdminUI();
        renderAdminEvents(evts);
        renderAdminDrags(store.appState.drags);
        renderAdminMerch();
        renderGiveawayEvents(evts);
        loadContentToAdmin();
    }
    // Simple way to refresh logo/promo without importing from settings/home (manual update)
    const logo = document.getElementById('header-logo-img');
    if (logo) logo.src = store.appState.appLogoUrl || '';
    // Promo init is handled by main.js observing or routed, simpler to just assume user navigates
}
