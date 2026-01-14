// === Navigation Module ===

import { domRefs } from './dom-refs.js';
import { appState, isLoggedIn, adminEmail } from '../core/state.js';
import { showInfoModal } from './modals.js';

// Import Feature Renderers (Stubs or Real)
import { renderPublicEvents, renderHomeEvents } from '../features/events/events-public.js';
import { renderMerchPage } from '../features/merch/merch-public.js';
import { renderGalleryEventList, renderPastGalleries } from '../features/gallery/gallery-public.js';
import { renderDragList } from '../features/drags/drags-public.js';
import { renderBannerVideo } from '../features/content/banner.js';
import { renderAppLogo } from '../features/content/logo.js';
import { renderNextEventPromo } from '../features/content/promo.js';

// Import Admin Renderers (Stubs or Real)
import { renderAdminEvents } from '../features/events/events-admin.js';
import { renderAdminDrags } from '../features/drags/drags-admin.js';
import { renderAdminMerch } from '../features/merch/merch-admin.js';
import { renderGiveawayEvents } from '../features/giveaway/giveaway.js';
import { loadContentToAdmin } from '../features/content/content-manager.js';

// Import Form Resetters (Stubs or Real)
import { resetEventForm, editingEventId } from '../features/events/events-form.js';
import { resetDragForm, editingDragId } from '../features/drags/drag-form.js';
import { resetMerchItemForm, editingMerchItemId } from '../features/merch/merch-form.js';

let adminTapCounter = 0;

/**
 * Show a specific public page
 * @param {string} pageId - ID of the page to show
 */
export function showPage(pageId) {
    const pages = {
        'home': document.getElementById('home-page'),
        'events': document.getElementById('events-page'),
        'gallery': document.getElementById('gallery-page'),
        'drags': document.getElementById('drags-page'),
        'merch': document.getElementById('merch-page'),
        'admin': document.getElementById('admin-page')
    };

    Object.values(pages).forEach(page => {
        if (page) {
            page.classList.add('hidden');
            page.classList.remove('page-fade-in');
        }
    });

    if (pages[pageId]) {
        pages[pageId].classList.remove('hidden');
        void pages[pageId].offsetWidth; // Trigger reflow for animation
        pages[pageId].classList.add('page-fade-in');
    } else {
        console.warn(`Página "${pageId}" no encontrada. Mostrando 'home'.`);
        if (pages['home']) {
            pages['home'].classList.remove('hidden');
            pages['home'].classList.add('page-fade-in');
            pageId = 'home';
        }
    }

    // Update Mobile Nav Styles
    Object.values(domRefs.mobileNavLinks).forEach(link => {
        link.classList.remove('bg-gray-700', 'text-white');
        link.classList.add('text-gray-300');
    });
    if (domRefs.mobileNavLinks[pageId]) {
        domRefs.mobileNavLinks[pageId].classList.add('bg-gray-700', 'text-white');
        domRefs.mobileNavLinks[pageId].classList.remove('text-gray-300');
    }

    // Update Main Nav Styles
    Object.values(domRefs.mainNavLinks).forEach(link => {
        link.classList.remove('text-white', 'text-glow-white');
        link.classList.add('text-gray-500', 'hover:text-white');
    });
    if (domRefs.mainNavLinks[pageId]) {
        domRefs.mainNavLinks[pageId].classList.add('text-white', 'text-glow-white');
        domRefs.mainNavLinks[pageId].classList.remove('text-gray-500', 'hover:text-white');
    }

    // Update Secondary Nav Styles
    Object.values(domRefs.secondaryNavLinks).forEach(link => {
        link.classList.remove('text-white', 'text-glow-white');
        link.classList.add('text-gray-500', 'hover:text-white');
    });
    if (domRefs.secondaryNavLinks[pageId]) {
        domRefs.secondaryNavLinks[pageId].classList.add('text-white', 'text-glow-white');
        domRefs.secondaryNavLinks[pageId].classList.remove('text-gray-500', 'hover:text-white');
    }

    domRefs.mobileMenu?.classList.add('hidden');

    // Render dynamic content
    const currentEvents = appState.events || []; // Use updated list always

    if (pageId === 'events') {
        renderPublicEvents(currentEvents);
    }
    if (pageId === 'merch') {
        renderMerchPage();
    }
    if (pageId === 'gallery') {
        renderGalleryEventList();
    }
    if (pageId === 'drags') {
        renderDragList();
    }
    if (pageId === 'home') {
        renderPastGalleries(currentEvents);
        renderHomeEvents(currentEvents);
        renderBannerVideo();
        renderAppLogo();
        renderNextEventPromo();
    }

    if (pageId === 'admin') {
        checkAdminUI();
    }
}

/**
 * Show a specific admin page (tab)
 * @param {string} adminPageId - ID of the admin tab to show
 */
export function showAdminPage(adminPageId) {
    // Re-map admin pages as they might not be initialized in domRefs fully if using lazy loading
    const adminPages = {
        'events': document.getElementById('admin-events'),
        'drags': document.getElementById('admin-drags'),
        'merch': document.getElementById('admin-merch'),
        'giveaway': document.getElementById('admin-giveaway'),
        'gallery': document.getElementById('admin-gallery'),
        'content': document.getElementById('admin-content')
    };

    Object.values(adminPages).forEach(page => page?.classList.add('hidden'));

    if (adminPages[adminPageId]) {
        adminPages[adminPageId].classList.remove('hidden');
    } else {
        console.warn(`Admin page "${adminPageId}" not found. Showing 'events'.`);
        if (adminPages['events']) adminPages['events'].classList.remove('hidden');
        adminPageId = 'events';
    }

    // Update Admin Nav Styles
    if (domRefs.adminNavLinks) {
        Object.values(domRefs.adminNavLinks).forEach(link => {
            link.classList.remove('bg-white', 'text-black');
            link.classList.add('bg-gray-700', 'text-white', 'hover:bg-gray-600');
        });
        if (domRefs.adminNavLinks[adminPageId]) {
            domRefs.adminNavLinks[adminPageId].classList.add('bg-white', 'text-black');
            domRefs.adminNavLinks[adminPageId].classList.remove('bg-gray-700', 'text-white', 'hover:bg-gray-600');
        }
    }

    const currentEvents = appState.events || [];

    if (adminPageId === 'events') {
        renderAdminEvents(currentEvents);
    }
    if (adminPageId === 'drags') {
        renderAdminDrags(appState.drags);
    }
    if (adminPageId === 'merch') {
        renderAdminMerch();
    }
    if (adminPageId === 'giveaway') {
        renderGiveawayEvents(currentEvents);
    }
    if (adminPageId === 'gallery' || adminPageId === 'content') {
        loadContentToAdmin();
    }

    // Reset forms if leaving their tab
    if (adminPageId !== 'events' && editingEventId !== null) {
        resetEventForm();
    }
    if (adminPageId !== 'drags' && editingDragId !== null) {
        resetDragForm();
    }
    if (adminPageId !== 'merch' && editingMerchItemId !== null) {
        resetMerchItemForm();
    }
}

/**
 * Update Admin UI based on login status
 */
export function checkAdminUI() {
    const adminEmailEl = document.getElementById('admin-email');
    const mobileAdminLink = domRefs.mobileNavLinks['admin'];

    if (isLoggedIn) {
        // Logged In
        if (domRefs.loginForm) domRefs.loginForm.classList.add('hidden');
        if (domRefs.adminPanel) domRefs.adminPanel.classList.remove('hidden');
        if (adminEmailEl) adminEmailEl.textContent = adminEmail;
        if (domRefs.scanQrBtn) domRefs.scanQrBtn.classList.remove('hidden');
        if (mobileAdminLink) mobileAdminLink.classList.remove('hidden');

        loadContentToAdmin();
        renderAdminEvents(appState.events || []);
        renderAdminDrags(appState.drags || []);
        renderAdminMerch();
        renderGiveawayEvents(appState.events || []);

    } else {
        // Public
        if (domRefs.loginForm) domRefs.loginForm.classList.remove('hidden');
        if (domRefs.adminPanel) domRefs.adminPanel.classList.add('hidden');
        if (domRefs.scanQrBtn) domRefs.scanQrBtn.classList.add('hidden');
        if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
    }
}

/**
 * Handler for admin menu tap (Easter Egg)
 */
export function handleAdminMenuTap() {
    const mobileAdminLink = domRefs.mobileNavLinks['admin'];
    if (!mobileAdminLink) return;

    if (isLoggedIn) {
        adminTapCounter = 0;
        return;
    }

    if (mobileAdminLink.classList.contains('hidden')) {
        adminTapCounter++;
        console.log("Admin tap:", adminTapCounter);
        if (adminTapCounter >= 5) {
            mobileAdminLink.classList.remove('hidden');
            showInfoModal("Acceso a Panel Administrador ¡Concedido!", false);
            adminTapCounter = 0;
        }
    } else {
        adminTapCounter = 0;
    }
}
