// === Promo Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState } from '../../core/state.js';

/**
 * Render the "Next Event" promotional banner
 */
export function renderNextEventPromo() {
    if (!domRefs.nextEventPromoContainer || !domRefs.nextEventPromo) return;

    if (appState.promoEnabled && appState.promoCustomText) {
        domRefs.nextEventPromo.innerHTML = `<span class="animate-pulse">📣 ${appState.promoCustomText} 📣</span>`;

        // Aplicar color neón custom si existe
        if (appState.promoNeonColor) {
            domRefs.nextEventPromo.style.color = appState.promoNeonColor;
            domRefs.nextEventPromo.style.textShadow = `0 0 10px ${appState.promoNeonColor}, 0 0 20px ${appState.promoNeonColor}`;
            domRefs.nextEventPromoContainer.style.borderColor = appState.promoNeonColor;
        } else {
            // Fallback o reset a estilos por defecto (clases CSS)
            domRefs.nextEventPromo.style.color = '';
            domRefs.nextEventPromo.style.textShadow = '';
            domRefs.nextEventPromoContainer.style.borderColor = ''; // Heredar de clase
        }

        domRefs.nextEventPromoContainer.classList.remove('hidden');
    } else {
        domRefs.nextEventPromoContainer.classList.add('hidden');
    }
}
