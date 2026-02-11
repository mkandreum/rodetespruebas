/**
 * APP.JS - REFACTORED
 * 
 * Core application file after aggressive modularization.
 * All major functionality is now delegated to modules/:
 * - utils.js: Core utilities (modal, loading, listeners)
 * - storage.js: Server data loading and state persistence
 * - galleries.js: Event/drag gallery rendering
 * - tickets.js: Ticket management
 * - drags.js: Drag CRUD operations
 * - merch.js: Merchandise system
 * - scanner.js: QR code scanning
 * - admin.js: Admin panel management
 * - pages.js: Public page rendering (home, countdown, events)
 * - events.js: Event CRUD and admin rendering
 * - upload.js: File uploads, gallery management, backup/restore
 * - auth.js: Authentication and email configuration
 * - navigation.js: Page switching and navigation logic
 * 
 * This file contains:
 * - Global application state
 * - Data loading from server
 * - DOMContentLoaded event listener setup
 * - Event handler bindings for user interactions
 */

// --- ===== GLOBAL APPLICATION STATE ===== ---

let appState = {}; // Estado principal (eventos, drags, contenido, etc.)
let allTickets = []; // Array de entradas vendidas
let allMerchSales = []; // Array de ventas de merch

let isLoggedIn = false; // Estado de autenticación
let adminEmail = ''; // Email del admin logueado
let pendingEventId = null;
let editingEventId = null;
let editingDragId = null;
let editingGalleryId = null; // Nuevo para galerías
let currentEventFilter = 'all'; // Filtro actual de eventos
let editingMerchItemId = null;
let currentAdminMerchDragId = null;
let adminTapCounter = 0; // Easter Egg counter

// Modal state
let currentImageModalGallery = [];
let currentImageModalIndex = 0;
let currentScannedTicketInfo = null; // Info del QR escaneado actual

// Scanner instance (html5-qrcode)
let html5QrCodeScanner = null;

// --- ===== SERVER API ENDPOINTS ===== ---
const SAVE_APP_STATE_URL = 'api/save.php';
const SAVE_TICKETS_URL = 'api/save_tickets.php';
const SAVE_MERCH_SALES_URL = 'api/save_merch_sales.php';
const UPLOAD_URL = 'api/upload.php';
const LOGIN_URL = 'auth/login.php';
const LOGOUT_URL = 'auth/logout.php';

// --- ===== UTILITY: FILE READERS ===== ---

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

// --- ===== DATA Loading & INITIALIZATION ===== ---

/**
 * Carga los datos iniciales desde PHP/servidor al iniciar la aplicación.
 * Estos datos se inyectan desde index.php en variables globales window.PHP_*
 */
function loadInitialDataFromServer() {
	try {
		// Cargar App State
		if (window.PHP_INITIAL_STATE) {
			appState = window.PHP_INITIAL_STATE;
			console.log("App state cargado:", appState);
		} else {
			console.warn("No se encontró APP STATE. Inicializando valores mínimos...");
			appState = {
				events: [],
				drags: [],
				galleries: [], // Cambio: galleries ahora es array, no propiedad de eventos
				webMerch: [],
				merch: [], // Merch items global
				allowedDomains: [],
				scannedTickets: {},
				nextEventId: 1,
				nextDragId: 1,
				nextMerchItemId: 1
			};
		}

		// Cargar Tickets
		if (window.PHP_INITIAL_TICKETS && Array.isArray(window.PHP_INITIAL_TICKETS)) {
			allTickets = window.PHP_INITIAL_TICKETS;
			console.log("Tickets cargados:", allTickets.length);
		} else {
			allTickets = [];
			console.warn("No se encontraron TICKETS");
		}

		// Cargar Ventas de Merch
		if (window.PHP_INITIAL_MERCH_SALES && Array.isArray(window.PHP_INITIAL_MERCH_SALES)) {
			allMerchSales = window.PHP_INITIAL_MERCH_SALES;
			console.log("Merch Sales cargados:", allMerchSales.length);
		} else {
			allMerchSales = [];
			console.warn("No se encontraron MERCH SALES");
		}

		// Cargar estado de login
		isLoggedIn = window.PHP_IS_LOGGED_IN === true;
		adminEmail = window.PHP_ADMIN_EMAIL || '';
		console.log(`Estado login: ${isLoggedIn ? `Logueado como ${adminEmail}` : 'No logueado'}`);

		// Sincronizar contadores
		if (typeof syncTicketCounters === 'function') {
			syncTicketCounters();
		}

	} catch (error) {
		console.error("Error cargando datos:", error);
		showInfoModal("Error crítico al cargar la app. Intenta recargar.", true);
	}
}

// --- ===== DOMCONTENTLOADED EVENT ===== ---

window.addEventListener('DOMContentLoaded', async () => {
	console.log("📱 Iniciando aplicación...");

	// 1. Cargar datos desde servidor PHP
	loadInitialDataFromServer();

	// 2. PWA Auto-reload en pruebas
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
	const isAllowedEnv = window.location.hostname.includes('pruebas') ||
		window.location.hostname.includes('rodetesparty') ||
		window.location.hostname === 'localhost';

	if (isStandalone && isAllowedEnv) {
		const sessionReloaded = sessionStorage.getItem('pwa_auto_reloaded');
		if (!sessionReloaded) {
			sessionStorage.setItem('pwa_auto_reloaded', 'true');
			console.log("PWA detectado: Recargando para asegurar última versión");
			window.location.reload();
			return;
		}
	}

	// 3. Reference data arrays
	let currentEvents = [...(appState.events || [])];

	// 4. Intersection Observer para scroll reveal
	const observerOptions = {
		root: null,
		rootMargin: '50px',
		threshold: 0.1
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('visible');
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);

	function observeRevealElements() {
		document.querySelectorAll('.reveal-on-scroll').forEach(el => {
			observer.observe(el);
		});
	}

	// 5. DOM References
	const pages = {};
	const adminPages = {};
	const adminNavLinks = {};
	const mobileNavLinks = {};
	const bottomPillNavLinks = {};

	const navActiveIndicator = document.querySelector('.nav-active-indicator');
	const loadingModal = document.getElementById('loading-modal');
	const loginForm = document.getElementById('loginForm');
	const adminPanel = document.getElementById('administratorPage');
	const mobileMenu = document.getElementById('mobile-menu');
	const mobileMenuBtn = document.getElementById('mobile-menu-btn');

	// Elemento selector de página
	const homeEventListContainer = document.getElementById('home-events-container');
	const viewAllEventsBtn = document.getElementById('view-all-events-btn');
	const logoBtn = document.getElementById('logo-btn');
	const adminLogoutBtn = document.getElementById('adminLogoutBtn');
	const scanQrBtn = document.getElementById('scan-qr-btn');

	// Elementos de formularios
	const addEventForm = document.getElementById('addEventForm');
	const clearEventFormButton = document.getElementById('clearEventFormButton');
	const addDragForm = document.getElementById('addDragForm');
	const clearDragFormButton = document.getElementById('clearDragFormButton');
	const addMerchItemForm = document.getElementById('addMerchItemForm');
	const clearMerchItemFormButton = document.getElementById('clearMerchItemFormButton');

	// Elementos de subida de archivos
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

	// Elementos de merch
	const merchPurchaseForm = document.getElementById('merchPurchaseForm');
	const downloadMerchQrBtn = document.getElementById('downloadMerchQrBtn');
	const adminMerchSelectDrag = document.getElementById('adminMerchSelectDrag');
	const adminMerchViewSalesBtn = document.getElementById('adminMerchViewSalesBtn');

	// Elementos de galerías
	const contentManageForm = document.getElementById('contentManageForm');
	const galleryManageForm = document.getElementById('galleryManageForm');
	const galleryEventSelect = document.getElementById('galleryEventSelect');
	const galleryBackBtn = document.getElementById('galleryBackBtn');
	const dragGalleryBackBtn = document.getElementById('dragGalleryBackBtn');

	// Elementos de tickets y descarga
	const emailForm = document.getElementById('emailForm');
	const downloadTicketBtn = document.getElementById('downloadTicketBtn');

	// Elementos de escáner QR
	const scanBackBtn = document.getElementById('scanBackBtn');
	const scannerConfirmBtn = document.getElementById('scannerConfirmBtn');
	const scannerCancelBtn = document.getElementById('scannerCancelBtn');
	const scannerQuantityInput = document.getElementById('scannerQuantityInput');

	// Scanner view regions
	const adminScannerView = document.getElementById('adminScannerView');
	const adminMainView = document.getElementById('adminMainView');
	const scannerVideoRegion = document.getElementById('scanner-video-region');
	const scannerMessage = document.getElementById('scannerMessage');
	const scannerInputView = document.getElementById('scannerInputView');
	const scannerInputMessage = document.getElementById('scannerInputMessage');
	const scannerCloseBtn = document.getElementById('scannerCloseBtn');

	// Elementos de backup/restore
	const backupBtn = document.getElementById('backupBtn');
	const restoreInput = document.getElementById('restoreInput');

	// Elementos de admin auth
	const logoutBtn = document.getElementById('adminLogoutBtn');

	// Elementos de SMTP
	const smtpConfigForm = document.getElementById('smtpConfigForm');
	const testSMTPBtn = document.getElementById('testSMTPBtn');
	const dragEmailSelect = document.getElementById('dragEmailSelect');
	const saveDragEmailConfigBtn = document.getElementById('saveDragEmailConfigBtn');
	const saveWebMerchConfigBtn = document.getElementById('saveWebMerchConfigBtn');

	// Elementos de imagen modal
	const imageModalPrevBtn = document.getElementById('imageModalPrevBtn');
	const imageModalNextBtn = document.getElementById('imageModalNextBtn');

	// Web/Drag Merch elements (si existen)
	const addWebMerchBtn = document.getElementById('addWebMerchBtn');
	const webMerchForm = document.getElementById('webMerchForm');
	const cancelWebMerchBtn = document.getElementById('cancelWebMerchBtn');
	const webMerchImageUploadInput = document.getElementById('webMerchImageUploadInput');
	const webMerchImageUrlInput = document.getElementById('webMerchImageUrl');
	const webMerchViewSalesBtn = document.getElementById('webMerchViewSalesBtn');
	const dragMerchSelectDrag = document.getElementById('dragMerchSelectDrag');
	const addDragMerchBtn = document.getElementById('addDragMerchBtn');
	const dragMerchForm = document.getElementById('dragMerchForm');
	const cancelDragMerchBtn = document.getElementById('cancelDragMerchBtn');
	const dragMerchImageUploadInput = document.getElementById('dragMerchImageUploadInput');
	const dragMerchImageUrlInput = document.getElementById('dragMerchImageUrl');
	const dragMerchViewSalesBtn = document.getElementById('dragMerchViewSalesBtn');

	// 6. Llenar mapas de página
	document.querySelectorAll('[data-page]').forEach(el => pages[el.dataset.page] = el);
	document.querySelectorAll('[data-admin-page]').forEach(el => adminPages[el.dataset.adminPage] = el);
	document.querySelectorAll('#admin-nav [data-nav]').forEach(el => adminNavLinks[el.dataset.nav] = el);
	document.querySelectorAll('#bottom-pill-nav [data-nav]').forEach(el => bottomPillNavLinks[el.dataset.nav] = el);
	document.querySelectorAll('#mobile-menu a[data-nav]').forEach(el => mobileNavLinks[el.dataset.nav] = el);

	// --- ===== EVENT LISTENERS SETUP ===== ---

	// Navegación principal
	document.querySelectorAll('[data-nav]').forEach(link => {
		addTrackedListener(link, 'click', (e) => {
			e.preventDefault();
			const navTarget = link.dataset.nav;
			showPage(navTarget);
		});
	});

	// Logo (vuelve a home)
	if (logoBtn) {
		addTrackedListener(logoBtn, 'click', (e) => { e.preventDefault(); showPage('home'); });
	}

	// Ver todos los eventos
	if (viewAllEventsBtn) {
		addTrackedListener(viewAllEventsBtn, 'click', (e) => { e.preventDefault(); showPage('events'); });
	}

	// Filtros de eventos admin
	document.querySelectorAll('.event-filter-btn').forEach(btn => {
		addTrackedListener(btn, 'click', (e) => {
			e.preventDefault();
			currentEventFilter = e.currentTarget.dataset.filter;
			if (typeof renderAdminEvents === 'function') {
				renderAdminEvents(currentEvents);
			}
		});
	});

	// Navegación admin (pestañas internas)
	document.querySelectorAll('[data-admin-nav]').forEach(link => {
		addTrackedListener(link, 'click', (e) => {
			e.preventDefault();
			if (!isLoggedIn) return;
			if (typeof showAdminPage === 'function') {
				showAdminPage(e.currentTarget.dataset.adminNav);
			}
		});
	});

	// Formularios Admin
	if (addEventForm && typeof handleSaveEvent === 'function') {
		addTrackedListener(addEventForm, 'submit', handleSaveEvent);
	}
	if (clearEventFormButton && typeof resetEventForm === 'function') {
		addTrackedListener(clearEventFormButton, 'click', resetEventForm);
	}
	if (addDragForm && typeof handleSaveDrag === 'function') {
		addTrackedListener(addDragForm, 'submit', handleSaveDrag);
	}
	if (clearDragFormButton && typeof resetDragForm === 'function') {
		addTrackedListener(clearDragFormButton, 'click', resetDragForm);
	}
	if (addMerchItemForm && typeof handleSaveMerchItem === 'function') {
		addTrackedListener(addMerchItemForm, 'submit', handleSaveMerchItem);
	}
	if (clearMerchItemFormButton && typeof resetMerchItemForm === 'function') {
		addTrackedListener(clearMerchItemFormButton, 'click', resetMerchItemForm);
	}

	// Modales generales
	document.querySelectorAll('[data-close-modal]').forEach(btn => {
		addTrackedListener(btn, 'click', (e) => closeModal(e.currentTarget.dataset.closeModal));
	});
	if (imageModalPrevBtn && typeof handleImageModalPrev === 'function') {
		addTrackedListener(imageModalPrevBtn, 'click', (e) => { e.stopPropagation(); handleImageModalPrev(); });
	}
	if (imageModalNextBtn && typeof handleImageModalNext === 'function') {
		addTrackedListener(imageModalNextBtn, 'click', (e) => { e.stopPropagation(); handleImageModalNext(); });
	}
	const downloadImageBtn = document.getElementById('download-image-btn');
	if (downloadImageBtn && typeof downloadImageWithWatermark === 'function') {
		addTrackedListener(downloadImageBtn, 'click', (e) => { e.stopPropagation(); downloadImageWithWatermark(); });
	}

	// Merch público
	if (merchPurchaseForm && typeof handleMerchPurchaseSubmit === 'function') {
		addTrackedListener(merchPurchaseForm, 'submit', handleMerchPurchaseSubmit);
	}
	if (downloadMerchQrBtn && typeof handleDownloadMerchQr === 'function') {
		addTrackedListener(downloadMerchQrBtn, 'click', handleDownloadMerchQr);
	}

	// Admin merch
	if (adminMerchSelectDrag && typeof handleAdminMerchDragSelect === 'function') {
		addTrackedListener(adminMerchSelectDrag, 'change', handleAdminMerchDragSelect);
	}
	if (adminMerchViewSalesBtn && typeof handleViewMerchSales === 'function') {
		addTrackedListener(adminMerchViewSalesBtn, 'click', handleViewMerchSales);
	}

	// Subida de archivos
	if (contentManageForm && typeof handleSaveContent === 'function') {
		addTrackedListener(contentManageForm, 'submit', handleSaveContent);
	}
	if (eventPosterUploadInput && eventPosterUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(eventPosterUploadInput, 'change', (e) => handleFileUpload(e, eventPosterUrlInput));
	}
	if (appLogoUploadInput && appLogoUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(appLogoUploadInput, 'change', (e) => handleFileUpload(e, appLogoUrlInput));
	}
	if (ticketLogoUploadInput && ticketLogoUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(ticketLogoUploadInput, 'change', (e) => handleFileUpload(e, ticketLogoUrlInput));
	}
	if (bannerUploadInput && bannerUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(bannerUploadInput, 'change', (e) => handleFileUpload(e, bannerUrlInput));
	}
	if (galleryUploadInput && typeof handleMultipleFileUpload === 'function') {
		addTrackedListener(galleryUploadInput, 'change', (e) => handleMultipleFileUpload(e, 'gallery-urls-input', 'admin-gallery-preview-grid', 'gallery-thumbnails-input'));
	}
	if (dragCoverUploadInput && dragCoverUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(dragCoverUploadInput, 'change', (e) => handleFileUpload(e, dragCoverUrlInput));
	}
	if (dragGalleryUploadInput && typeof handleMultipleFileUpload === 'function') {
		addTrackedListener(dragGalleryUploadInput, 'change', (e) => handleMultipleFileUpload(e, 'drag-gallery-urls', 'admin-drag-gallery-preview-grid'));
	}
	if (merchItemImageUploadInput && merchItemImageUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(merchItemImageUploadInput, 'change', (e) => handleFileUpload(e, merchItemImageUrlInput));
	}

	// Web Merch
	if (addWebMerchBtn && typeof showWebMerchForm === 'function') {
		addTrackedListener(addWebMerchBtn, 'click', () => showWebMerchForm());
	}
	if (webMerchForm && typeof handleSaveWebMerch === 'function') {
		addTrackedListener(webMerchForm, 'submit', handleSaveWebMerch);
	}
	if (cancelWebMerchBtn && typeof hideWebMerchForm === 'function') {
		addTrackedListener(cancelWebMerchBtn, 'click', () => hideWebMerchForm());
	}
	if (webMerchImageUploadInput && webMerchImageUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(webMerchImageUploadInput, 'change', (e) => handleFileUpload(e, webMerchImageUrlInput));
	}
	if (webMerchViewSalesBtn && typeof handleViewWebMerchSales === 'function') {
		addTrackedListener(webMerchViewSalesBtn, 'click', handleViewWebMerchSales);
	}

	// Drag Merch
	if (dragMerchSelectDrag && typeof handleDragMerchSelectChange === 'function') {
		addTrackedListener(dragMerchSelectDrag, 'change', handleDragMerchSelectChange);
	}
	if (addDragMerchBtn && typeof showDragMerchForm === 'function') {
		addTrackedListener(addDragMerchBtn, 'click', () => showDragMerchForm());
	}
	if (dragMerchForm && typeof handleSaveDragMerch === 'function') {
		addTrackedListener(dragMerchForm, 'submit', handleSaveDragMerch);
	}
	if (cancelDragMerchBtn && typeof hideDragMerchForm === 'function') {
		addTrackedListener(cancelDragMerchBtn, 'click', () => hideDragMerchForm());
	}
	if (dragMerchImageUploadInput && dragMerchImageUrlInput && typeof handleFileUpload === 'function') {
		addTrackedListener(dragMerchImageUploadInput, 'change', (e) => handleFileUpload(e, dragMerchImageUrlInput));
	}
	if (dragMerchViewSalesBtn && typeof handleViewDragMerchSales === 'function') {
		addTrackedListener(dragMerchViewSalesBtn, 'click', handleViewDragMerchSales);
	}

	// SMTP
	if (smtpConfigForm && typeof handleSaveSMTPConfig === 'function') {
		addTrackedListener(smtpConfigForm, 'submit', handleSaveSMTPConfig);
	}
	if (testSMTPBtn && typeof handleTestSMTP === 'function') {
		addTrackedListener(testSMTPBtn, 'click', handleTestSMTP);
	}
	if (dragEmailSelect && typeof handleDragEmailSelect === 'function') {
		addTrackedListener(dragEmailSelect, 'change', handleDragEmailSelect);
	}
	if (saveDragEmailConfigBtn && typeof handleSaveDragEmailConfig === 'function') {
		addTrackedListener(saveDragEmailConfigBtn, 'click', handleSaveDragEmailConfig);
	}
	if (saveWebMerchConfigBtn && typeof saveEmailNotificationsState === 'function') {
		addTrackedListener(saveWebMerchConfigBtn, 'click', saveEmailNotificationsState);
	}

	// Galerías admin
	if (galleryManageForm && typeof handleSaveGallery === 'function') {
		addTrackedListener(galleryManageForm, 'submit', handleSaveGallery);
	}
	if (galleryEventSelect && typeof handleGalleryEventSelect === 'function') {
		addTrackedListener(galleryEventSelect, 'change', handleGalleryEventSelect);
	}
	if (galleryBackBtn && typeof renderGalleryEventList === 'function') {
		addTrackedListener(galleryBackBtn, 'click', (e) => { e.preventDefault(); renderGalleryEventList(); });
	}
	if (dragGalleryBackBtn && typeof renderDragList === 'function') {
		addTrackedListener(dragGalleryBackBtn, 'click', (e) => { e.preventDefault(); renderDragList(); });
	}

	// Backup/Restore
	if (backupBtn && typeof handleBackup === 'function') {
		addTrackedListener(backupBtn, 'click', handleBackup);
	}
	if (restoreInput && typeof handleRestore === 'function') {
		addTrackedListener(restoreInput, 'change', handleRestore);
	}

	// Ticketing público
	if (emailForm && typeof handleEmailSubmit === 'function') {
		addTrackedListener(emailForm, 'submit', handleEmailSubmit);
	}
	if (downloadTicketBtn && typeof handleDownloadTicket === 'function') {
		addTrackedListener(downloadTicketBtn, 'click', handleDownloadTicket);
	}

	// QR Scanner
	if (scanQrBtn && typeof startScanner === 'function') {
		addTrackedListener(scanQrBtn, 'click', (e) => { e.preventDefault(); startScanner(); });
	}
	if (scanBackBtn && typeof stopScanner === 'function') {
		addTrackedListener(scanBackBtn, 'click', (e) => { e.preventDefault(); stopScanner(false); });
	}
	if (scannerConfirmBtn && typeof handleScannerConfirm === 'function') {
		addTrackedListener(scannerConfirmBtn, 'click', handleScannerConfirm);
	}
	if (scannerCancelBtn && typeof handleScannerCancel === 'function') {
		addTrackedListener(scannerCancelBtn, 'click', handleScannerCancel);
	}
	if (scannerCloseBtn && typeof stopScanner === 'function') {
		addTrackedListener(scannerCloseBtn, 'click', (e) => { e.preventDefault(); stopScanner(false); });
	}

	// Auth (Login, Logout)
	if (loginForm && typeof handleAdminLogin === 'function') {
		addTrackedListener(loginForm, 'submit', handleAdminLogin);
	}
	if (logoutBtn && typeof handleLogout === 'function') {
		addTrackedListener(logoutBtn, 'click', () => handleLogout(true));
	}

	// Mobile menu Easter Egg
	if (mobileMenuBtn) {
		addTrackedListener(mobileMenuBtn, 'click', (e) => {
			e.preventDefault();
			if (typeof handleAdminMenuTap === 'function') {
				handleAdminMenuTap();
			}
			if (mobileMenu) {
				mobileMenu.classList.toggle('hidden');
			}
		});
	}

	// --- ===== FINAL INITIALIZATION ===== ---
	console.log("✅ Configurando interfaz inicial...");

	if (typeof checkAdminUI === 'function') {
		checkAdminUI(); // Establecer UI correcta (login/panel)
	}
	if (typeof renderAppLogo === 'function') {
		renderAppLogo(); // Renderizar logo
	}
	if (typeof renderNextEventPromo === 'function') {
		renderNextEventPromo(); // Renderizar promo
	}
	if (typeof showPage === 'function') {
		showPage('home'); // Mostrar página inicio
	}

	console.log("🚀 Aplicación lista!");
});

// --- ===== PWA SERVICE WORKER ===== ---
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
			.then((registration) => console.log('SW registered:', registration))
			.catch((error) => console.log('SW registration failed:', error));
	});
}
