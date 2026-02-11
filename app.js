/**
 * APP.JS - REFACTORED (v2 - Fixed browser compatibility)
 * 
 * After aggressive modularization, this file contains ONLY:
 * - Global application state
 * - Utility functions (FileReaders)
 * - Data loading from server
 * - Event listener setup (delegating to modules)
 * - DOMContentLoaded initialization
 * 
 * All major functionality is in modules/ directory:
 * utils.js, storage.js, galleries.js, tickets.js, drags.js,
 * merch.js, scanner.js, admin.js, pages.js, events.js,
 * upload.js, auth.js, navigation.js
 */

// ===== GLOBAL STATE =====
let appState = {};
let allTickets = [];
let allMerchSales = [];

let isLoggedIn = false;
let adminEmail = '';
let pendingEventId = null;
let editingEventId = null;
let editingDragId = null;
let editingGalleryId = null;
let adminTapCounter = 0;

// Form references (shared with modules)
let addEventForm = null;
let addDragForm = null;
let addMerchItemForm = null;
let emailForm = null;

let currentImageModalGallery = [];
let currentImageModalIndex = 0;
let html5QrCodeScanner = null;

// ===== FILE READER UTILITIES =====
function readFileAsDataURL(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function readFileAsText(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

function readFileAsArrayBuffer(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	});
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = url;
	});
}

// ===== DATA LOADING =====
function loadInitialDataFromServer() {
	try {
		if (window.PHP_INITIAL_STATE) {
			appState = window.PHP_INITIAL_STATE;
			console.log("✅ App state loaded");
		} else {
			console.warn("⚠️ No app state");
			appState = {
				events: [], drags: [], galleries: [], webMerch: [], merch: [],
				allowedDomains: [], scannedTickets: {},
				nextEventId: 1, nextDragId: 1, nextMerchItemId: 1
			};
		}

		allTickets = (window.PHP_INITIAL_TICKETS && Array.isArray(window.PHP_INITIAL_TICKETS)) ?
			window.PHP_INITIAL_TICKETS : [];

		allMerchSales = (window.PHP_INITIAL_MERCH_SALES && Array.isArray(window.PHP_INITIAL_MERCH_SALES)) ?
			window.PHP_INITIAL_MERCH_SALES : [];

		isLoggedIn = window.PHP_IS_LOGGED_IN === true;
		adminEmail = window.PHP_ADMIN_EMAIL || '';

		if (typeof syncTicketCounters === 'function') {
			syncTicketCounters();
		}
	} catch (error) {
		console.error("❌ Error loading data:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Critical error loading application data", true);
		}
	}
}

// ===== DOMCONTENTLOADED =====
window.addEventListener('DOMContentLoaded', async () => {
	console.log("🚀 Initializing application...");

	loadInitialDataFromServer();

	// PWA auto-reload
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
	const isAllowedEnv = window.location.hostname.includes('pruebas') ||
		window.location.hostname.includes('rodetesparty') ||
		window.location.hostname === 'localhost';

	if (isStandalone && isAllowedEnv) {
		const sessionReloaded = sessionStorage.getItem('pwa_auto_reloaded');
		if (!sessionReloaded) {
			sessionStorage.setItem('pwa_auto_reloaded', 'true');
			console.log("PWA detected: Reloading");
			window.location.reload();
			return;
		}
	}

	// Update global currentEvents (declared in pages.js) with loaded events
	currentEvents = [...(appState.events || [])];

	// Intersection Observer for scroll reveal animations
	const observerOptions = { root: null, rootMargin: '50px', threshold: 0.1 };
	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	// Global function to observe elements with reveal-on-scroll class
	window.observeRevealElements = function() {
		document.querySelectorAll('.reveal-on-scroll').forEach(el => {
			observer.observe(el);
		});
	};

	// DOM References
	const pages = {}, adminPages = {}, adminNavLinks = {}, mobileNavLinks = {}, bottomPillNavLinks = {};

	document.querySelectorAll('[data-page]').forEach(el => pages[el.dataset.page] = el);
	document.querySelectorAll('[data-admin-page]').forEach(el => adminPages[el.dataset.adminPage] = el);
	document.querySelectorAll('#admin-nav [data-nav]').forEach(el => adminNavLinks[el.dataset.nav] = el);
	document.querySelectorAll('#bottom-pill-nav [data-nav]').forEach(el => bottomPillNavLinks[el.dataset.nav] = el);
	document.querySelectorAll('#mobile-menu a[data-nav]').forEach(el => mobileNavLinks[el.dataset.nav] = el);

	const navActiveIndicator = document.querySelector('.nav-active-indicator');
	const loginForm = document.getElementById('login-form');
	const adminPanel = document.getElementById('admin-panel');
	const mobileMenu = document.getElementById('mobile-menu');
	const mobileMenuBtn = document.getElementById('mobile-menu-btn');
	const viewAllEventsBtn = document.getElementById('view-all-events-btn');
	const logoBtn = document.getElementById('logo-btn');
	const scanQrBtn = document.getElementById('scan-qr-btn');

	// Form elements references
	addEventForm = document.getElementById('add-event-form');
	const clearEventFormButton = document.getElementById('clear-event-form-button');
	addDragForm = document.getElementById('add-drag-form');
	const clearDragFormButton = document.getElementById('clear-drag-form-button');
	addMerchItemForm = document.getElementById('drag-merch-form');
	const clearMerchItemFormButton = document.getElementById('cancel-drag-merch-btn');

	// Upload input references
	const eventPosterUploadInput = document.getElementById('event-poster-upload');
	const eventPosterUrlInput = document.getElementById('event-poster-url');
	const appLogoUploadInput = document.getElementById('app-logo-upload');
	const appLogoUrlInput = document.getElementById('app-logo-url');
	const ticketLogoUploadInput = document.getElementById('ticket-logo-upload');
	const ticketLogoUrlInput = document.getElementById('ticket-logo-url');
	const bannerUploadInput = document.getElementById('banner-upload');
	const bannerUrlInput = document.getElementById('banner-url');
	const galleryUploadInput = document.getElementById('gallery-upload');
	const dragCoverUploadInput = document.getElementById('drag-cover-upload');
	const dragCoverUrlInput = document.getElementById('drag-cover-url');
	const dragGalleryUploadInput = document.getElementById('drag-gallery-upload');
	const merchItemImageUploadInput = document.getElementById('web-merch-image-upload');
	const merchItemImageUrlInput = document.getElementById('web-merch-image-url');

	// Merch references
	const merchPurchaseForm = document.getElementById('merch-purchase-form');
	const downloadMerchQrBtn = document.getElementById('download-merch-qr-btn');
	const adminMerchSelectDrag = document.getElementById('drag-merch-select-drag');
	const adminMerchViewSalesBtn = document.getElementById('drag-merch-view-sales-btn');

	// Gallery references
	const contentManageForm = document.getElementById('content-manage-form');
	const galleryManageForm = document.getElementById('gallery-manage-form');
	const galleryEventSelect = document.getElementById('gallery-event-select');
	const galleryBackBtn = document.getElementById('gallery-back-btn');
	const dragGalleryBackBtn = document.getElementById('drag-gallery-back-btn');

	// Ticket references
	emailForm = document.getElementById('email-form');
	const downloadTicketBtn = document.getElementById('download-ticket-btn');

	// Scanner references
	const scanBackBtn = document.getElementById('scan-back-btn');
	const scannerConfirmBtn = document.getElementById('scanner-confirm-btn');
	const scannerCancelBtn = document.getElementById('scanner-cancel-btn');
	const scannerQuantityInput = document.getElementById('scanner-quantity-input');
	const adminScannerView = document.getElementById('admin-scanner-view');
	const adminMainView = document.getElementById('admin-main-view');
	const scannerVideoRegion = document.getElementById('scanner-video-region');
	const scannerMessage = document.getElementById('scanner-message');
	const scannerInputView = document.getElementById('scanner-input-view');
	const scannerInputMessage = document.getElementById('scanner-input-message');
	const scannerCloseBtn = document.getElementById('scanner-close-btn');

	// Backup/restore references
	const backupBtn = document.getElementById('backup-btn');
	const restoreInput = document.getElementById('restore-input');

	// Auth references
	const logoutBtn = document.getElementById('admin-logout-btn');

	// SMTP references
	const smtpConfigForm = document.getElementById('smtp-config-form');
	const testSMTPBtn = document.getElementById('test-smtp-btn');
	const dragEmailSelect = document.getElementById('drag-email-select');
	const saveDragEmailConfigBtn = document.getElementById('save-drag-email-config-btn');
	const saveWebMerchConfigBtn = document.getElementById('save-web-merch-config-btn');

	// Image modal references
	const imageModalPrevBtn = document.getElementById('image-modal-prev-btn');
	const imageModalNextBtn = document.getElementById('image-modal-next-btn');

	// Web/Drag merch references
	const addWebMerchBtn = document.getElementById('add-web-merch-btn');
	const webMerchForm = document.getElementById('web-merch-form');
	const cancelWebMerchBtn = document.getElementById('cancel-web-merch-btn');
	const webMerchImageUploadInput = document.getElementById('web-merch-image-upload');
	const webMerchImageUrlInput = document.getElementById('web-merch-image-url');
	const webMerchViewSalesBtn = document.getElementById('web-merch-view-sales-btn');
	const dragMerchSelectDrag = document.getElementById('drag-merch-select-drag');
	const addDragMerchBtn =document.getElementById('add-drag-merch-btn');
	const dragMerchForm = document.getElementById('drag-merch-form');
	const cancelDragMerchBtn = document.getElementById('cancel-drag-merch-btn');
	const dragMerchImageUploadInput = document.getElementById('drag-merch-image-upload');
	const dragMerchImageUrlInput = document.getElementById('drag-merch-image-url');
	const dragMerchViewSalesBtn = document.getElementById('drag-merch-view-sales-btn');

	// ===== EVENT LISTENERS =====

	// Navigation
	document.querySelectorAll('[data-nav]').forEach(link => {
		if (typeof addTrackedListener === 'function') {
			addTrackedListener(link, 'click', (e) => {
				e.preventDefault();
				if (typeof showPage === 'function') showPage(link.dataset.nav);
			});
		}
	});

	if (logoBtn && typeof addTrackedListener === 'function') {
		addTrackedListener(logoBtn, 'click', (e) => {
			e.preventDefault();
			if (typeof showPage === 'function') showPage('home');
		});
	}

	if (viewAllEventsBtn && typeof addTrackedListener === 'function') {
		addTrackedListener(viewAllEventsBtn, 'click', (e) => {
			e.preventDefault();
			if (typeof showPage === 'function') showPage('events');
		});
	}

	// Event filters
	document.querySelectorAll('.event-filter-btn').forEach(btn => {
		if (typeof addTrackedListener === 'function') {
			addTrackedListener(btn, 'click', (e) => {
				e.preventDefault();
				currentEventFilter = e.currentTarget.dataset.filter;
				if (typeof renderAdminEvents === 'function') renderAdminEvents(currentEvents);
			});
		}
	});

	// Admin nav
	document.querySelectorAll('[data-admin-nav]').forEach(link => {
		if (typeof addTrackedListener === 'function') {
			addTrackedListener(link, 'click', (e) => {
				e.preventDefault();
				if (!isLoggedIn) return;
				if (typeof showAdminPage === 'function') showAdminPage(link.dataset.adminNav);
			});
		}
	});

	// Bind forms
	if (addEventForm && typeof addTrackedListener === 'function' && typeof handleSaveEvent === 'function') {
		addTrackedListener(addEventForm, 'submit', handleSaveEvent);
	}
	if (clearEventFormButton && typeof addTrackedListener === 'function' && typeof resetEventForm === 'function') {
		addTrackedListener(clearEventFormButton, 'click', resetEventForm);
	}
	if (addDragForm && typeof addTrackedListener === 'function' && typeof handleSaveDrag === 'function') {
		addTrackedListener(addDragForm, 'submit', handleSaveDrag);
	}
	if (clearDragFormButton && typeof addTrackedListener === 'function' && typeof resetDragForm === 'function') {
		addTrackedListener(clearDragFormButton, 'click', resetDragForm);
	}
	if (addMerchItemForm && typeof addTrackedListener === 'function' && typeof handleSaveMerchItem === 'function') {
		addTrackedListener(addMerchItemForm, 'submit', handleSaveMerchItem);
	}
	if (clearMerchItemFormButton && typeof addTrackedListener === 'function' && typeof resetMerchItemForm === 'function') {
		addTrackedListener(clearMerchItemFormButton, 'click', resetMerchItemForm);
	}

	// Modals
	document.querySelectorAll('[data-close-modal]').forEach(btn => {
		if (typeof addTrackedListener === 'function') {
			addTrackedListener(btn, 'click', (e) => {
				if (typeof closeModal === 'function') closeModal(e.currentTarget.dataset.closeModal);
			});
		}
	});

	if (imageModalPrevBtn && typeof addTrackedListener === 'function' && typeof handleImageModalPrev === 'function') {
		addTrackedListener(imageModalPrevBtn, 'click', (e) => { e.stopPropagation(); handleImageModalPrev(); });
	}

	if (imageModalNextBtn && typeof addTrackedListener === 'function' && typeof handleImageModalNext === 'function') {
		addTrackedListener(imageModalNextBtn, 'click', (e) => { e.stopPropagation(); handleImageModalNext(); });
	}

	const downloadImageBtn = document.getElementById('download-image-btn');
	if (downloadImageBtn && typeof addTrackedListener === 'function' && typeof downloadImageWithWatermark === 'function') {
		addTrackedListener(downloadImageBtn, 'click', (e) => { e.stopPropagation(); downloadImageWithWatermark(); });
	}

	// Merch public
	if (merchPurchaseForm && typeof addTrackedListener === 'function' && typeof handleMerchPurchaseSubmit === 'function') {
		addTrackedListener(merchPurchaseForm, 'submit', handleMerchPurchaseSubmit);
	}
	if (downloadMerchQrBtn && typeof addTrackedListener === 'function' && typeof handleDownloadMerchQr === 'function') {
		addTrackedListener(downloadMerchQrBtn, 'click', handleDownloadMerchQr);
	}

	// Admin merch
	if (adminMerchSelectDrag && typeof addTrackedListener === 'function' && typeof handleAdminMerchDragSelect === 'function') {
		addTrackedListener(adminMerchSelectDrag, 'change', handleAdminMerchDragSelect);
	}
	if (adminMerchViewSalesBtn && typeof addTrackedListener === 'function' && typeof handleViewMerchSales === 'function') {
		addTrackedListener(adminMerchViewSalesBtn, 'click', handleViewMerchSales);
	}

	// File uploads
	if (eventPosterUploadInput && eventPosterUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(eventPosterUploadInput, 'change', (e) => handleFileUpload(e, eventPosterUrlInput));
	}
	if (appLogoUploadInput && appLogoUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(appLogoUploadInput, 'change', (e) => handleFileUpload(e, appLogoUrlInput));
	}
	if (ticketLogoUploadInput && ticketLogoUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(ticketLogoUploadInput, 'change', (e) => handleFileUpload(e, ticketLogoUrlInput));
	}
	if (bannerUploadInput && bannerUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(bannerUploadInput, 'change', (e) => handleFileUpload(e, bannerUrlInput));
	}
	if (dragCoverUploadInput && dragCoverUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(dragCoverUploadInput, 'change', (e) => handleFileUpload(e, dragCoverUrlInput));
	}
	if (merchItemImageUploadInput && merchItemImageUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(merchItemImageUploadInput, 'change', (e) => handleFileUpload(e, merchItemImageUrlInput));
	}

	// Multiple file uploads
	if (galleryUploadInput && typeof addTrackedListener === 'function' && typeof handleMultipleFileUpload === 'function') {
		addTrackedListener(galleryUploadInput, 'change', (e) => handleMultipleFileUpload(e, 'gallery-urls-input', 'admin-gallery-preview-grid', 'gallery-thumbnails-input'));
	}
	if (dragGalleryUploadInput && typeof addTrackedListener === 'function' && typeof handleMultipleFileUpload === 'function') {
		addTrackedListener(dragGalleryUploadInput, 'change', (e) => handleMultipleFileUpload(e, 'drag-gallery-urls', 'admin-drag-gallery-preview-grid'));
	}

	// Web merch
	if (addWebMerchBtn && typeof addTrackedListener === 'function' && typeof showWebMerchForm === 'function') {
		addTrackedListener(addWebMerchBtn, 'click', () => showWebMerchForm());
	}
	if (webMerchForm && typeof addTrackedListener === 'function' && typeof handleSaveWebMerch === 'function') {
		addTrackedListener(webMerchForm, 'submit', handleSaveWebMerch);
	}
	if (cancelWebMerchBtn && typeof addTrackedListener === 'function' && typeof hideWebMerchForm === 'function') {
		addTrackedListener(cancelWebMerchBtn, 'click', () => hideWebMerchForm());
	}
	if (webMerchImageUploadInput && webMerchImageUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(webMerchImageUploadInput, 'change', (e) => handleFileUpload(e, webMerchImageUrlInput));
	}
	if (webMerchViewSalesBtn && typeof addTrackedListener === 'function' && typeof handleViewWebMerchSales === 'function') {
		addTrackedListener(webMerchViewSalesBtn, 'click', handleViewWebMerchSales);
	}

	// Drag merch
	if (dragMerchSelectDrag && typeof addTrackedListener === 'function' && typeof handleDragMerchSelectChange === 'function') {
		addTrackedListener(dragMerchSelectDrag, 'change', handleDragMerchSelectChange);
	}
	if (addDragMerchBtn && typeof addTrackedListener === 'function' && typeof showDragMerchForm === 'function') {
		addTrackedListener(addDragMerchBtn, 'click', () => showDragMerchForm());
	}
	if (dragMerchForm && typeof addTrackedListener === 'function' && typeof handleSaveDragMerch === 'function') {
		addTrackedListener(dragMerchForm, 'submit', handleSaveDragMerch);
	}
	if (cancelDragMerchBtn && typeof addTrackedListener === 'function' && typeof hideDragMerchForm === 'function') {
		addTrackedListener(cancelDragMerchBtn, 'click', () => hideDragMerchForm());
	}
	if (dragMerchImageUploadInput && dragMerchImageUrlInput && typeof addTrackedListener === 'function' && typeof handleFileUpload === 'function') {
		addTrackedListener(dragMerchImageUploadInput, 'change', (e) => handleFileUpload(e, dragMerchImageUrlInput));
	}
	if (dragMerchViewSalesBtn && typeof addTrackedListener === 'function' && typeof handleViewDragMerchSales === 'function') {
		addTrackedListener(dragMerchViewSalesBtn, 'click', handleViewDragMerchSales);
	}

	// SMTP
	if (smtpConfigForm && typeof addTrackedListener === 'function' && typeof handleSaveSMTPConfig === 'function') {
		addTrackedListener(smtpConfigForm, 'submit', handleSaveSMTPConfig);
	}
	if (testSMTPBtn && typeof addTrackedListener === 'function' && typeof handleTestSMTP === 'function') {
		addTrackedListener(testSMTPBtn, 'click', handleTestSMTP);
	}
	if (dragEmailSelect && typeof addTrackedListener === 'function' && typeof handleDragEmailSelect === 'function') {
		addTrackedListener(dragEmailSelect, 'change', handleDragEmailSelect);
	}
	if (saveDragEmailConfigBtn && typeof addTrackedListener === 'function' && typeof handleSaveDragEmailConfig === 'function') {
		addTrackedListener(saveDragEmailConfigBtn, 'click', handleSaveDragEmailConfig);
	}
	if (saveWebMerchConfigBtn && typeof addTrackedListener === 'function' && typeof saveEmailNotificationsState === 'function') {
		addTrackedListener(saveWebMerchConfigBtn, 'click', saveEmailNotificationsState);
	}

	// Galleries
	if (galleryManageForm && typeof addTrackedListener === 'function' && typeof handleSaveGallery === 'function') {
		addTrackedListener(galleryManageForm, 'submit', handleSaveGallery);
	}
	if (galleryEventSelect && typeof addTrackedListener === 'function' && typeof handleGalleryEventSelect === 'function') {
		addTrackedListener(galleryEventSelect, 'change', handleGalleryEventSelect);
	}
	if (galleryBackBtn && typeof addTrackedListener === 'function' && typeof renderGalleryEventList === 'function') {
		addTrackedListener(galleryBackBtn, 'click', (e) => { e.preventDefault(); renderGalleryEventList(); });
	}
	if (dragGalleryBackBtn && typeof addTrackedListener === 'function' && typeof renderDragList === 'function') {
		addTrackedListener(dragGalleryBackBtn, 'click', (e) => { e.preventDefault(); renderDragList(); });
	}

	// Content management
	if (contentManageForm && typeof addTrackedListener === 'function' && typeof handleSaveContent === 'function') {
		addTrackedListener(contentManageForm, 'submit', handleSaveContent);
	}

	// Backup/restore
	if (backupBtn && typeof addTrackedListener === 'function' && typeof handleBackup === 'function') {
		addTrackedListener(backupBtn, 'click', handleBackup);
	}
	if (restoreInput && typeof addTrackedListener === 'function' && typeof handleRestore === 'function') {
		addTrackedListener(restoreInput, 'change', handleRestore);
	}

	// Tickets
	if (emailForm && typeof addTrackedListener === 'function' && typeof handleEmailSubmit === 'function') {
		addTrackedListener(emailForm, 'submit', handleEmailSubmit);
	}
	if (downloadTicketBtn && typeof addTrackedListener === 'function' && typeof handleDownloadTicket === 'function') {
		addTrackedListener(downloadTicketBtn, 'click', handleDownloadTicket);
	}

	// QR scanner
	if (scanQrBtn && typeof addTrackedListener === 'function' && typeof startScanner === 'function') {
		addTrackedListener(scanQrBtn, 'click', (e) => { e.preventDefault(); startScanner(); });
	}
	if (scanBackBtn && typeof addTrackedListener === 'function' && typeof stopScanner === 'function') {
		addTrackedListener(scanBackBtn, 'click', (e) => { e.preventDefault(); stopScanner(false); });
	}
	if (scannerConfirmBtn && typeof addTrackedListener === 'function' && typeof handleScannerConfirm === 'function') {
		addTrackedListener(scannerConfirmBtn, 'click', handleScannerConfirm);
	}
	if (scannerCancelBtn && typeof addTrackedListener === 'function' && typeof handleScannerCancel === 'function') {
		addTrackedListener(scannerCancelBtn, 'click', handleScannerCancel);
	}
	if (scannerCloseBtn && typeof addTrackedListener === 'function' && typeof stopScanner === 'function') {
		addTrackedListener(scannerCloseBtn, 'click', (e) => { e.preventDefault(); stopScanner(false); });
	}

	// Auth
	if (loginForm && typeof addTrackedListener === 'function' && typeof handleAdminLogin === 'function') {
		addTrackedListener(loginForm, 'submit', handleAdminLogin);
	}
	if (logoutBtn && typeof addTrackedListener === 'function' && typeof handleLogout === 'function') {
		addTrackedListener(logoutBtn, 'click', () => handleLogout(true));
	}

	// Mobile menu (Easter Egg)
	if (mobileMenuBtn && typeof addTrackedListener === 'function') {
		addTrackedListener(mobileMenuBtn, 'click', (e) => {
			e.preventDefault();
			if (typeof handleAdminMenuTap === 'function') handleAdminMenuTap();
			if (mobileMenu) mobileMenu.classList.toggle('hidden');
		});
	}

	// ===== INITIALIZATION =====
	console.log("⚙️ Setting up UI...");

	if (typeof checkAdminUI === 'function') checkAdminUI();
	if (typeof renderAppLogo === 'function') renderAppLogo();
	if (typeof renderNextEventPromo === 'function') renderNextEventPromo();
	if (typeof showPage === 'function') showPage('home');

	console.log("✅ Application ready!");
});

// ===== PWA =====
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
			.then((registration) => console.log('🔄 SW registered'))
			.catch((error) => console.log('❌ SW failed:', error));
	});
}
