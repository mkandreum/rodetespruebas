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
let currentEventFilter = 'all';
let editingMerchItemId = null;
let currentAdminMerchDragId = null;
let adminTapCounter = 0;

let currentImageModalGallery = [];
let currentImageModalIndex = 0;
let currentScannedTicketInfo = null;
let html5QrCodeScanner = null;

// ===== API URLs =====
const SAVE_APP_STATE_URL = 'api/save.php';
const SAVE_TICKETS_URL = 'api/save_tickets.php';
const SAVE_MERCH_SALES_URL = 'api/save_merch_sales.php';
const UPLOAD_URL = 'api/upload.php';
const LOGIN_URL = 'auth/login.php';
const LOGOUT_URL = 'auth/logout.php';

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

	let currentEvents = [...(appState.events || [])];

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
	const loginForm = document.getElementById('loginForm');
	const adminPanel = document.getElementById('administratorPage');
	const mobileMenu = document.getElementById('mobile-menu');
	const mobileMenuBtn = document.getElementById('mobile-menu-btn');
	const homeEventListContainer = document.getElementById('home-events-container');
	const viewAllEventsBtn = document.getElementById('view-all-events-btn');
	const logoBtn = document.getElementById('logo-btn');
	const scanQrBtn = document.getElementById('scan-qr-btn');

	// Form elements references
	const addEventForm = document.getElementById('addEventForm');
	const clearEventFormButton = document.getElementById('clearEventFormButton');
	const addDragForm = document.getElementById('addDragForm');
	const clearDragFormButton = document.getElementById('clearDragFormButton');
	const addMerchItemForm = document.getElementById('addMerchItemForm');
	const clearMerchItemFormButton = document.getElementById('clearMerchItemFormButton');

	// Upload input references
	const eventPosterUploadInput = document.getElementById('eventPosterUploadInput');
	const eventPosterUrlInput = document.getElementById('eventPosterUrl');
	const appLogoUploadInput = document.getElementById('appLogoUploadInput');
	const appLogoUrlInput = document.getElementById('appLogoUrl');
	const ticketLogoUploadInput = document.getElementById('ticketLogoUploadInput');
	const ticketLogoUrlInput = document.getElementById('ticketLogoUrl');
	const bannerUploadInput = document.getElementById('bannerUploadInput');
	const bannerUrlInput = document.getElementById('bannerUrl');
	const galleryUploadInput = document.getElementById('galleryUploadInput');
	const dragCoverUploadInput = document.getElementById('dragCoverUploadInput');
	const dragCoverUrlInput = document.getElementById('dragCoverUrl');
	const dragGalleryUploadInput = document.getElementById('dragGalleryUploadInput');
	const merchItemImageUploadInput = document.getElementById('merchItemImageUploadInput');
	const merchItemImageUrlInput = document.getElementById('merchItemImageUrl');

	// Merch references
	const merchPurchaseForm = document.getElementById('merchPurchaseForm');
	const downloadMerchQrBtn = document.getElementById('downloadMerchQrBtn');
	const adminMerchSelectDrag = document.getElementById('adminMerchSelectDrag');
	const adminMerchViewSalesBtn = document.getElementById('adminMerchViewSalesBtn');

	// Gallery references
	const contentManageForm = document.getElementById('contentManageForm');
	const galleryManageForm = document.getElementById('galleryManageForm');
	const galleryEventSelect = document.getElementById('galleryEventSelect');
	const galleryBackBtn = document.getElementById('galleryBackBtn');
	const dragGalleryBackBtn = document.getElementById('dragGalleryBackBtn');

	// Ticket references
	const emailForm = document.getElementById('emailForm');
	const downloadTicketBtn = document.getElementById('downloadTicketBtn');

	// Scanner references
	const scanBackBtn = document.getElementById('scanBackBtn');
	const scannerConfirmBtn = document.getElementById('scannerConfirmBtn');
	const scannerCancelBtn = document.getElementById('scannerCancelBtn');
	const scannerQuantityInput = document.getElementById('scannerQuantityInput');
	const adminScannerView = document.getElementById('adminScannerView');
	const adminMainView = document.getElementById('adminMainView');
	const scannerVideoRegion = document.getElementById('scanner-video-region');
	const scannerMessage = document.getElementById('scannerMessage');
	const scannerInputView = document.getElementById('scannerInputView');
	const scannerInputMessage = document.getElementById('scannerInputMessage');
	const scannerCloseBtn = document.getElementById('scannerCloseBtn');

	// Backup/restore references
	const backupBtn = document.getElementById('backupBtn');
	const restoreInput = document.getElementById('restoreInput');

	// Auth references
	const logoutBtn = document.getElementById('adminLogoutBtn');

	// SMTP references
	const smtpConfigForm = document.getElementById('smtpConfigForm');
	const testSMTPBtn = document.getElementById('testSMTPBtn');
	const dragEmailSelect = document.getElementById('dragEmailSelect');
	const saveDragEmailConfigBtn = document.getElementById('saveDragEmailConfigBtn');
	const saveWebMerchConfigBtn = document.getElementById('saveWebMerchConfigBtn');

	// Image modal references
	const imageModalPrevBtn = document.getElementById('imageModalPrevBtn');
	const imageModalNextBtn = document.getElementById('imageModalNextBtn');

	// Web/Drag merch references
	const addWebMerchBtn = document.getElementById('addWebMerchBtn');
	const webMerchForm = document.getElementById('webMerchForm');
	const cancelWebMerchBtn = document.getElementById('cancelWebMerchBtn');
	const webMerchImageUploadInput = document.getElementById('webMerchImageUploadInput');
	const webMerchImageUrlInput = document.getElementById('webMerchImageUrl');
	const webMerchViewSalesBtn = document.getElementById('webMerchViewSalesBtn');
	const dragMerchSelectDrag = document.getElementById('dragMerchSelectDrag');
	const addDragMerchBtn =document.getElementById('addDragMerchBtn');
	const dragMerchForm = document.getElementById('dragMerchForm');
	const cancelDragMerchBtn = document.getElementById('cancelDragMerchBtn');
	const dragMerchImageUploadInput = document.getElementById('dragMerchImageUploadInput');
	const dragMerchImageUrlInput = document.getElementById('dragMerchImageUrl');
	const dragMerchViewSalesBtn = document.getElementById('dragMerchViewSalesBtn');

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
