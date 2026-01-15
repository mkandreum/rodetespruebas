
import { store } from '../store.js';
import { showInfoModal, showLoading } from '../ui.js';
import { saveAppState } from '../api.js';
import { renderAppLogo as uiRenderAppLogo } from './settings.js'; // To refresh immediately
import { renderNextEventPromo } from './home.js';

export function renderAppLogo() {
    uiRenderAppLogo(); // Bridge to the simple render function
}

export async function handleSaveContent(e) {
    e.preventDefault();
    const form = e.target;
    // content-manage-form has inputs: app-logo-url, ticket-logo-url, banner-video-url, promo-text, promo-enabled

    const logoUrl = form['app-logo-url'].value;
    const ticketLogoUrl = form['ticket-logo-url'].value;
    const bannerUrl = form['banner-video-url'].value;
    const promoText = form['promo-text'].value;
    const promoEnabled = form['promo-enabled'].checked;

    showLoading(true);
    try {
        store.appState.appLogoUrl = logoUrl;
        store.appState.ticketLogoUrl = ticketLogoUrl;
        store.appState.bannerVideoUrl = bannerUrl;
        store.appState.promoCustomText = promoText;
        store.appState.promoEnabled = promoEnabled;

        await saveAppState();

        // Refresh UI
        renderAppLogo();
        renderNextEventPromo();
        // Update Banner visual if on home page?
        const video = document.getElementById('banner-video');
        if (video) video.src = bannerUrl;

        showInfoModal("Contenido actualizado", false);

        // Clear file inputs
        document.getElementById('app-logo-upload').value = '';
        document.getElementById('ticket-logo-upload').value = '';
        document.getElementById('banner-upload').value = '';

    } catch (err) {
        showInfoModal("Error guardando contenido", true);
    } finally {
        showLoading(false);
    }
}

export function loadContentToAdmin() {
    // Populate form with current values
    const form = document.getElementById('content-manage-form');
    if (!form) return;

    form['app-logo-url'].value = store.appState.appLogoUrl || '';
    form['ticket-logo-url'].value = store.appState.ticketLogoUrl || '';
    form['banner-video-url'].value = store.appState.bannerVideoUrl || '';
    form['promo-text'].value = store.appState.promoCustomText || '';
    form['promo-enabled'].checked = !!store.appState.promoEnabled;
}
