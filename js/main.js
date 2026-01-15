
import { loadInitialData, store } from './store.js';
import { showPage, showAdminPage } from './router.js';
import { handleEmailFormSubmit } from './features/tickets.js';
import { closeModal, initScrollObserver } from './ui.js';
import { handleAdminLogin, handleLogout, checkAdminUI, handleAdminMenuTap } from './features/admin.js';
import { handleSaveEvent, resetEventForm } from './features/events_admin.js';
import { handleSaveDrag, resetDragForm } from './features/drags_admin.js';
import { handleSaveMerchItem, resetMerchItemForm, handleAdminMerchDragSelect } from './features/merch_admin.js';
import { handleSaveContent, loadContentToAdmin as loadSettingsToAdmin } from './features/settings.js';
import { startScanner, stopScanner, handleScannerConfirm, handleScannerCancel } from './features/scanner.js';
import { handleBackup, handleRestore } from './features/backup.js';
import { handleMultipleFileUpload, handleFileUpload } from './features/upload.js';
import { handleSaveGallery, handleGalleryEventSelect, renderAdminGalleryGrid } from './features/gallery_admin.js';
import { renderGalleryEventList } from './features/gallery.js';
import { handleMerchPurchaseSubmit } from './features/merch.js';
import { handleDownloadTicket } from './features/tickets.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Initializing Modular App...");

    await loadInitialData();
    setupGlobalListeners();
    setupAdminListeners();

    initScrollObserver(); // START OBSERVER

    showPage('home');
    checkAdminUI();
    loadSettingsToAdmin();
});

function setupGlobalListeners() {
    document.querySelectorAll('[data-nav]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(e.currentTarget.dataset.nav);
        });
    });

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleAdminMenuTap(); // EASTER EGG
            document.getElementById('mobile-menu')?.classList.toggle('hidden');
        });
    }

    document.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(e.currentTarget.dataset.closeModal);
        });
    });

    document.getElementById('email-form')?.addEventListener('submit', handleEmailFormSubmit);
    document.getElementById('merch-purchase-form')?.addEventListener('submit', handleMerchPurchaseSubmit);
    document.getElementById('download-ticket-btn')?.addEventListener('click', handleDownloadTicket);

    document.getElementById('image-modal-next')?.addEventListener('click', async () => {
        const { handleImageModalNext } = await import('./ui.js');
        handleImageModalNext();
    });
    document.getElementById('image-modal-prev')?.addEventListener('click', async () => {
        const { handleImageModalPrev } = await import('./ui.js');
        handleImageModalPrev();
    });

    document.getElementById('gallery-back-btn')?.addEventListener('click', (e) => {
        e.preventDefault(); renderGalleryEventList(); showPage('gallery');
    });
}

function setupAdminListeners() {
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAdminLogin(e.target.email.value, e.target.password.value);
    });
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault(); handleLogout();
    });

    document.querySelectorAll('[data-admin-nav]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            if (!store.isLoggedIn) return;
            showAdminPage(e.currentTarget.dataset.adminNav);
        });
    });

    document.getElementById('add-event-form')?.addEventListener('submit', handleSaveEvent);
    document.getElementById('clear-event-form-btn')?.addEventListener('click', resetEventForm);
    document.getElementById('add-drag-form')?.addEventListener('submit', handleSaveDrag);
    document.getElementById('clear-drag-form-btn')?.addEventListener('click', resetDragForm);
    document.getElementById('add-merch-item-form')?.addEventListener('submit', handleSaveMerchItem);
    document.getElementById('clear-merch-item-btn')?.addEventListener('click', resetMerchItemForm);
    document.getElementById('admin-merch-select-drag')?.addEventListener('change', handleAdminMerchDragSelect);
    document.getElementById('content-manage-form')?.addEventListener('submit', handleSaveContent);
    document.getElementById('gallery-manage-form')?.addEventListener('submit', handleSaveGallery);
    document.getElementById('gallery-event-select')?.addEventListener('change', handleGalleryEventSelect);

    document.getElementById('scan-qr-btn')?.addEventListener('click', (e) => { e.preventDefault(); startScanner(); });
    document.getElementById('scanner-confirm-btn')?.addEventListener('click', handleScannerConfirm);
    document.getElementById('scanner-cancel-btn')?.addEventListener('click', handleScannerCancel);
    const stopScan = (e) => { e.preventDefault(); stopScanner(false); };
    document.getElementById('scan-back-btn')?.addEventListener('click', stopScan);
    document.getElementById('scanner-close-btn')?.addEventListener('click', stopScan);

    document.getElementById('backup-btn')?.addEventListener('click', handleBackup);
    document.getElementById('restore-file-input')?.addEventListener('change', handleRestore); // WIRED RESTORE

    const wireUpload = (inputId, urlId, isVideo = false) => {
        const inp = document.getElementById(inputId);
        if (inp) {
            inp.addEventListener('change', (e) => handleFileUpload(e.target.files[0], urlId, isVideo));
        }
    };

    wireUpload('event-poster-upload', 'event-poster-url');
    wireUpload('app-logo-upload', 'app-logo-url');
    wireUpload('ticket-logo-upload', 'ticket-logo-url');
    wireUpload('banner-upload', 'banner-video-url', true);
    wireUpload('drag-cover-upload', 'drag-cover-url');
    wireUpload('merch-item-image-upload', 'merch-item-image-url');

    const gallInp = document.getElementById('gallery-upload-input');
    if (gallInp) {
        gallInp.addEventListener('change', (e) => handleMultipleFileUpload(e.target.files, 'gallery-urls-input', (urls) => {
            renderAdminGalleryGrid('admin-gallery-preview-grid', 'gallery-urls-input', urls);
        }));
    }
    const dragGallInp = document.getElementById('drag-gallery-upload-input');
    if (dragGallInp) {
        dragGallInp.addEventListener('change', (e) => handleMultipleFileUpload(e.target.files, 'drag-gallery-urls', (urls) => {
            renderAdminGalleryGrid('admin-drag-gallery-preview-grid', 'drag-gallery-urls', urls);
        }));
    }
}
