// === Logo Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState } from '../../core/state.js';

/**
 * Render the application logo
 */
export function renderAppLogo() {
    if (domRefs.headerLogoImg && appState.appLogoUrl) {
        domRefs.headerLogoImg.src = appState.appLogoUrl;
    }
    // También actualizar el logo en el banner si existe (creado dinámicamente)
    const bannerLogo = document.getElementById('header-logo-img-banner');
    if (bannerLogo && appState.appLogoUrl) {
        bannerLogo.src = appState.appLogoUrl;
    }
}
