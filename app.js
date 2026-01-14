// === RODETES PARTY MAIN APP MODULE ===

// Core & UI
import { domRefs, initDOMRefs } from './scripts/ui/dom-refs.js';
import { loadInitialData, syncTicketCounters } from './scripts/api/init.js';
import { appState, isLoggedIn } from './scripts/core/state.js';
import { addTrackedListener } from './scripts/ui/event-listeners.js';
import { showPage, showAdminPage } from './scripts/ui/navigation.js';
import { showInfoModal, closeModal, showLoading, handleImageModalPrev, handleImageModalNext } from './scripts/ui/modals.js';

// Features - Auth
import { handleLogin, handleLogout, checkAdminUI } from './scripts/features/auth/auth.js';

// Features - Content
import { renderAppLogo } from './scripts/features/content/logo.js';
import { renderBannerVideo } from './scripts/features/content/banner.js';
import { renderNextEventPromo } from './scripts/features/content/promo.js';
import { handleSaveContent, handleFileUpload, handleMultipleFileUpload, handleBackup, handleRestore, loadContentToAdmin } from './scripts/features/content/content-manager.js';

// Features - Events
import { renderHomeEvents, renderPublicEvents, handleEmailSubmit, handleDownloadTicketQr } from './scripts/features/events/events-public.js';
import { renderAdminEvents, handleSaveEvent, handleEditEventClick, handleDeleteEvent, handleArchiveEvent, handleViewTickets, resetEventForm } from './scripts/features/events/events-admin.js';

// Features - Drags
import { renderDragList } from './scripts/features/drags/drags-public.js';
import { renderAdminDrags, handleSaveDrag, handleEditDragClick, handleDeleteDrag, resetDragForm } from './scripts/features/drags/drags-admin.js';

// Features - Merch
import { renderMerchPage, handleMerchPurchase, handleDownloadMerchQr } from './scripts/features/merch/merch-public.js';
import { renderAdminMerch, handleSaveMerchItem, handleEditMerchItemClick, handleDeleteMerchItem, handleAdminMerchDragSelect, handleViewMerchSales, renderAdminMerchSalesSummary, resetMerchItemForm } from './scripts/features/merch/merch-admin.js';
// Note: handleMerchPurchaseSubmit is handleMerchPurchase in my file? 
// Let's check 'merch-public.js'. It exports 'handleMerchPurchase' (triggered by form submit).
// So I map handleMerchPurchaseSubmit -> handleMerchPurchase.

// Features - Gallery
import { renderGalleryEventList, renderPastGalleries, renderGalleryImages } from './scripts/features/gallery/gallery-public.js';
import { renderAdminGalleryEventSelect, handleGalleryEventSelect, handleGalleryImageUpload, handleSaveGalleryChanges } from './scripts/features/gallery/gallery-admin.js';

// Features - Giveaway
import { renderGiveawayEvents, handleGiveaway } from './scripts/features/giveaway/giveaway.js';

// Features - Scanner
import { startScanner, stopScanner, handleScannerConfirm, handleScannerCancel } from './scripts/features/scanner/tickets-scanner.js';


// === Easter Egg Logic ===
let logoTapCount = 0;
let logoTapTimer = null;

function handleAdminMenuTap() {
	logoTapCount++;
	if (logoTapTimer) clearTimeout(logoTapTimer);
	logoTapTimer = setTimeout(() => { logoTapCount = 0; }, 1000);

	if (logoTapCount === 5) {
		if (domRefs.adminLoginLink) domRefs.adminLoginLink.classList.remove('hidden');
		showInfoModal("¡Menú Admin Revelado!", false);
		logoTapCount = 0;
	}
}


// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
	console.log("🚀 Rodetes App Starting...");

	// 0. Initialize DOM References FIRST
	initDOMRefs();

	// 1. Load Data
	await loadInitialData();
	await syncTicketCounters();

	// 2. Initial Renders
	renderAppLogo();
	renderBannerVideo();
	renderNextEventPromo();

	// Render Public Views
	renderHomeEvents();
	renderPublicEvents();
	renderDragList();
	renderMerchPage();
	renderGalleryEventList();
	renderPastGalleries();

	// 3. Setup Listeners
	setupEventListeners();

	// 4. Check UI State (Auth)
	checkAdminUI();
	loadContentToAdmin(); // Populate content form if admin

	// 5. Default Page
	showPage('home');
});


function setupEventListeners() {
	// Navigation - Public
	document.querySelectorAll('[data-nav]').forEach(link => {
		addTrackedListener(link, 'click', (e) => {
			e.preventDefault();
			showPage(e.currentTarget.dataset.nav);
		});
	});

	if (domRefs.logoBtn) addTrackedListener(domRefs.logoBtn, 'click', (e) => { e.preventDefault(); showPage('home'); });

	// Button "Ver todos los eventos" 
	const viewAllEventsBtn = document.getElementById('view-all-events-btn');
	if (viewAllEventsBtn) addTrackedListener(viewAllEventsBtn, 'click', (e) => { e.preventDefault(); showPage('events'); });

	// Mobile Menu
	if (domRefs.mobileMenuBtn) {
		addTrackedListener(domRefs.mobileMenuBtn, 'click', (e) => {
			e.preventDefault();
			handleAdminMenuTap();
			domRefs.mobileMenu?.classList.toggle('hidden');
		});
	}

	// Auth
	if (domRefs.loginForm) addTrackedListener(domRefs.loginForm, 'submit', handleLogin);
	if (domRefs.logoutBtn) addTrackedListener(domRefs.logoutBtn, 'click', () => handleLogout(true));

	// Admin Navigation
	document.querySelectorAll('[data-admin-nav]').forEach(link => {
		addTrackedListener(link, 'click', (e) => {
			e.preventDefault();
			if (isLoggedIn) showAdminPage(e.currentTarget.dataset.adminNav);
		});
	});

	// Content Management
	if (domRefs.contentManageForm) addTrackedListener(domRefs.contentManageForm, 'submit', handleSaveContent);
	// File Inputs
	if (domRefs.appLogoUploadInput && domRefs.appLogoUrlInput)
		addTrackedListener(domRefs.appLogoUploadInput, 'change', (e) => handleFileUpload(e, domRefs.appLogoUrlInput));
	if (domRefs.ticketLogoUploadInput && domRefs.ticketLogoUrlInput)
		addTrackedListener(domRefs.ticketLogoUploadInput, 'change', (e) => handleFileUpload(e, domRefs.ticketLogoUrlInput));
	if (domRefs.bannerUploadInput && domRefs.bannerUrlInput)
		addTrackedListener(domRefs.bannerUploadInput, 'change', (e) => handleFileUpload(e, domRefs.bannerUrlInput));
	if (domRefs.backupBtn) addTrackedListener(domRefs.backupBtn, 'click', handleBackup);
	const restoreInput = document.getElementById('restore-file-input');
	if (restoreInput) addTrackedListener(restoreInput, 'change', handleRestore);

	// Events Admin
	if (domRefs.addEventForm) addTrackedListener(domRefs.addEventForm, 'submit', handleSaveEvent);
	if (domRefs.clearEventFormButton) addTrackedListener(domRefs.clearEventFormButton, 'click', resetEventForm);
	const eventPosterUpload = document.getElementById('event-poster-upload');
	const eventPosterUrl = document.getElementById('event-poster-url');
	if (eventPosterUpload && eventPosterUrl)
		addTrackedListener(eventPosterUpload, 'change', (e) => handleFileUpload(e, eventPosterUrl));

	// Drags Admin
	if (domRefs.addDragForm) addTrackedListener(domRefs.addDragForm, 'submit', handleSaveDrag);
	if (domRefs.clearDragFormButton) addTrackedListener(domRefs.clearDragFormButton, 'click', resetDragForm);
	if (domRefs.dragCoverUploadInput && domRefs.dragCoverUrlInput)
		addTrackedListener(domRefs.dragCoverUploadInput, 'change', (e) => handleFileUpload(e, domRefs.dragCoverUrlInput));
	if (domRefs.dragGalleryUploadInput)
		addTrackedListener(domRefs.dragGalleryUploadInput, 'change', (e) => handleMultipleFileUpload(e, 'drag-gallery-urls', 'admin-drag-gallery-preview-grid'));
	const dragGalleryBackBtn = document.getElementById('drag-gallery-back-btn');
	if (dragGalleryBackBtn) addTrackedListener(dragGalleryBackBtn, 'click', (e) => { e.preventDefault(); renderDragList(); });

	// Merch Admin
	if (domRefs.addMerchItemForm) addTrackedListener(domRefs.addMerchItemForm, 'submit', handleSaveMerchItem);
	if (domRefs.clearMerchItemFormButton) addTrackedListener(domRefs.clearMerchItemFormButton, 'click', resetMerchItemForm);
	if (domRefs.merchItemImageUploadInput && domRefs.merchItemImageUrlInput)
		addTrackedListener(domRefs.merchItemImageUploadInput, 'change', (e) => handleFileUpload(e, domRefs.merchItemImageUrlInput));
	if (domRefs.adminMerchSelectDrag) addTrackedListener(domRefs.adminMerchSelectDrag, 'change', handleAdminMerchDragSelect);
	if (domRefs.adminMerchViewSalesBtn) addTrackedListener(domRefs.adminMerchViewSalesBtn, 'click', handleViewMerchSales);

	// Gallery Admin
	const galleryManageForm = document.getElementById('gallery-manage-form'); // Actually used to save? Or save button?
	// In gallery-admin.js I implemented 'handleSaveGalleryChanges'.
	// I need to search for the save button.
	const saveGalleryBtn = document.getElementById('save-gallery-btn');
	if (saveGalleryBtn) addTrackedListener(saveGalleryBtn, 'click', handleSaveGalleryChanges);
	if (domRefs.galleryEventSelect) addTrackedListener(domRefs.galleryEventSelect, 'change', handleGalleryEventSelect);
	if (domRefs.galleryUploadInput)
		addTrackedListener(domRefs.galleryUploadInput, 'change', handleGalleryImageUpload);
	const galleryBackBtn = document.getElementById('gallery-back-btn');
	if (galleryBackBtn) addTrackedListener(galleryBackBtn, 'click', (e) => { e.preventDefault(); renderGalleryEventList(); });

	// Giveaway
	if (domRefs.giveawayBtn) addTrackedListener(domRefs.giveawayBtn, 'click', handleGiveaway);

	// Scanner
	const scanQrBtn = document.getElementById('scan-qr-btn');
	const scanBackBtn = document.getElementById('scan-back-btn'); // In scanner view
	const scannerCloseBtn = document.getElementById('scanner-close-btn');
	const scannerConfirmBtn = document.getElementById('scanner-confirm-btn');
	const scannerCancelBtn = document.getElementById('scanner-cancel-btn');

	if (scanQrBtn) addTrackedListener(scanQrBtn, 'click', (e) => { e.preventDefault(); startScanner(); });
	if (scanBackBtn) addTrackedListener(scanBackBtn, 'click', (e) => { e.preventDefault(); stopScanner(false); });
	if (scannerCloseBtn) addTrackedListener(scannerCloseBtn, 'click', (e) => { e.preventDefault(); stopScanner(false); });
	if (scannerConfirmBtn) addTrackedListener(scannerConfirmBtn, 'click', handleScannerConfirm);
	if (scannerCancelBtn) addTrackedListener(scannerCancelBtn, 'click', handleScannerCancel);

	// Public Forms
	if (domRefs.emailForm) addTrackedListener(domRefs.emailForm, 'submit', handleEmailSubmit);
	if (domRefs.downloadTicketBtn) addTrackedListener(domRefs.downloadTicketBtn, 'click', handleDownloadTicketQr);

	const merchPurchaseForm = document.getElementById('merch-purchase-form');
	if (merchPurchaseForm) addTrackedListener(merchPurchaseForm, 'submit', handleMerchPurchase); // Mapped
	if (domRefs.downloadMerchQrBtn) addTrackedListener(domRefs.downloadMerchQrBtn, 'click', handleDownloadMerchQr);

	// Modals
	document.querySelectorAll('[data-close-modal]').forEach(btn => {
		addTrackedListener(btn, 'click', (e) => closeModal(e.currentTarget.dataset.closeModal));
	});
	if (domRefs.imageModalPrevBtn) addTrackedListener(domRefs.imageModalPrevBtn, 'click', (e) => { e.stopPropagation(); handleImageModalPrev(); });
	if (domRefs.imageModalNextBtn) addTrackedListener(domRefs.imageModalNextBtn, 'click', (e) => { e.stopPropagation(); handleImageModalNext(); });

}

// Expose render functions for circular updates if needed (e.g. from content manager)
// Not strictly needed if modules import each other, but for debugging:
window.rodetesApp = {
	appState,
	renderHomeEvents
};
