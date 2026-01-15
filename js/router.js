
import { store } from '/js/store.js';
import { renderPublicEvents, renderHomeEvents } from '/js/features/events.js';
import { renderMerchPage } from '/js/features/merch.js';
import { renderGalleryEventList, renderPastGalleries } from '/js/features/gallery.js';
import { renderDragList } from '/js/features/drags.js';
import { renderBannerVideo, renderNextEventPromo } from '/js/features/home.js';
import { renderAppLogo } from '/js/features/settings.js'; // Assuming settings.js handles logo
import { checkAdminUI, loadContentToAdmin } from '/js/features/admin.js';
// Admin renders
import { renderAdminEvents } from '/js/features/events_admin.js';
import { renderAdminDrags } from '/js/features/drags_admin.js';
import { renderAdminMerch } from '/js/features/merch_admin.js';
import { renderGiveawayEvents } from '/js/features/giveaway.js';
import { resetEventForm } from '/js/features/events_admin.js';
import { resetDragForm } from '/js/features/drags_admin.js';
import { resetMerchItemForm } from '/js/features/merch_admin.js';


export function showPage(pageId) {
    const pages = {
        home: document.getElementById('page-home'),
        events: document.getElementById('page-events'),
        gallery: document.getElementById('page-gallery'),
        drags: document.getElementById('page-drags'),
        merch: document.getElementById('page-merch'),
        admin: document.getElementById('page-admin')
    };

    Object.values(pages).forEach(page => {
        if (page) {
            page.classList.add('hidden');
            page.classList.remove('page-fade-in');
        }
    });

    if (pages[pageId]) {
        pages[pageId].classList.remove('hidden');
        void pages[pageId].offsetWidth;
        pages[pageId].classList.add('page-fade-in');
    } else {
        if (pages['home']) {
            pages['home'].classList.remove('hidden');
            pages['home'].classList.add('page-fade-in');
            pageId = 'home';
        }
    }

    updateNavStyles(pageId);

    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu?.classList.add('hidden');

    if (pageId === 'events') renderPublicEvents(store.appState.events);
    if (pageId === 'merch') renderMerchPage();
    if (pageId === 'gallery') renderGalleryEventList();
    if (pageId === 'drags') renderDragList();
    if (pageId === 'home') {
        renderPastGalleries(store.appState.events);
        renderHomeEvents(store.appState.events);
        renderBannerVideo();
        renderAppLogo();
        renderNextEventPromo();
    }
    if (pageId === 'admin') checkAdminUI();
}

function updateNavStyles(pageId) {
    // Mobile Nav
    document.querySelectorAll('#mobile-menu [data-nav]').forEach(link => {
        if (link.dataset.nav === pageId) {
            link.classList.add('bg-gray-700', 'text-white');
            link.classList.remove('text-gray-300');
        } else {
            link.classList.remove('bg-gray-700', 'text-white');
            link.classList.add('text-gray-300');
        }
    });

    // Main Nav
    document.querySelectorAll('#main-nav [data-nav]').forEach(link => {
        if (link.dataset.nav === pageId) {
            link.classList.add('text-white', 'text-glow-white');
            link.classList.remove('text-gray-500', 'hover:text-white');
        } else {
            link.classList.remove('text-white', 'text-glow-white');
            link.classList.add('text-gray-500', 'hover:text-white');
        }
    });

    // Secondary Nav
    document.querySelectorAll('#secondary-nav [data-nav]').forEach(link => {
        if (link.dataset.nav === pageId) {
            link.classList.add('text-white', 'text-glow-white');
            link.classList.remove('text-gray-500', 'hover:text-white');
        } else {
            link.classList.remove('text-white', 'text-glow-white');
            link.classList.add('text-gray-500', 'hover:text-white');
        }
    });
}

export function showAdminPage(adminPageId) {
    const adminPages = {
        events: document.getElementById('admin-page-events'),
        settings: document.getElementById('admin-page-settings'),
        gallery: document.getElementById('admin-page-gallery'),
        drags: document.getElementById('admin-page-drags'),
        merch: document.getElementById('admin-page-merch'),
        giveaway: document.getElementById('admin-page-giveaway')
    };

    Object.values(adminPages).forEach(page => page?.classList.add('hidden'));

    if (adminPages[adminPageId]) {
        adminPages[adminPageId].classList.remove('hidden');
    } else {
        if (adminPages['events']) adminPages['events'].classList.remove('hidden');
        adminPageId = 'events';
    }

    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        if (btn.dataset.adminNav === adminPageId) {
            btn.classList.add('bg-white', 'text-black');
            btn.classList.remove('bg-gray-700', 'text-white', 'hover:bg-gray-600');
        } else {
            btn.classList.remove('bg-white', 'text-black');
            btn.classList.add('bg-gray-700', 'text-white', 'hover:bg-gray-600');
        }
    });

    if (adminPageId === 'events') renderAdminEvents(store.appState.events);
    if (adminPageId === 'drags') renderAdminDrags(store.appState.drags);
    if (adminPageId === 'merch') renderAdminMerch();
    if (adminPageId === 'giveaway') renderGiveawayEvents(store.appState.events);
    if (adminPageId === 'gallery' || adminPageId === 'settings') loadContentToAdmin(); // 'settings' matches 'content' logic

    if (adminPageId !== 'events' && store.editingEventId !== null) resetEventForm();
    if (adminPageId !== 'drags' && store.editingDragId !== null) resetDragForm();
    if (adminPageId !== 'merch' && store.editingMerchItemId !== null) resetMerchItemForm();
}
