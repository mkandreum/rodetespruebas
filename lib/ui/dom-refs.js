// === DOM References Module ===
// This module initializes and exports all DOM element references

export let domRefs = {};

/**
 * Initialize all DOM references
 * Must be called after DOM is loaded
 */
export function initDOMRefs() {
    domRefs = {
        // Pages
        pages: {},
        adminPages: {},

        // Navigation Links
        adminNavLinks: {},
        mobileNavLinks: {},
        mainNavLinks: {},
        logoBtn: document.getElementById('logo-btn'),

        // Admin Link (Hidden/Easter Egg)
        adminLoginLink: document.querySelector('#mobile-menu a[data-nav="admin"]'),

        // Modals
        loadingModal: document.getElementById('loading-modal'),
        infoModal: document.getElementById('info-modal'),
        infoModalText: document.getElementById('info-modal-text'),
        ticketModal: document.getElementById('ticket-modal'),
        ticketListModal: document.getElementById('ticket-list-modal'),
        emailModal: document.getElementById('email-modal'),
        imageModal: document.getElementById('image-modal'),
        imageModalContent: document.getElementById('image-modal-content'),
        imageModalPrevBtn: document.getElementById('image-modal-prev'),
        imageModalNextBtn: document.getElementById('image-modal-next'),

        // Home Page Elements
        eventListContainer: document.getElementById('event-list-container'),
        nextEventPromoContainer: document.getElementById('next-event-promo-container'),
        nextEventPromo: document.getElementById('next-event-promo'),
        homeEventListContainer: document.getElementById('home-event-list-container'),
        viewAllEventsBtn: document.getElementById('view-all-events-btn'),
        pastGalleriesGrid: document.getElementById('past-galleries-grid'),
        homeBannerContainer: document.getElementById('home-banner-container'),

        // Auth Elements
        loginForm: document.getElementById('login-form'),
        adminPanel: document.getElementById('admin-panel'),
        logoutBtn: document.getElementById('logout-btn'),

        // Admin Events
        addEventForm: document.getElementById('add-event-form'),
        addEventFormButton: document.getElementById('add-event-form-button'),
        clearEventFormButton: document.getElementById('clear-event-form-button'),
        adminEventListUl: document.getElementById('admin-events-list-ul'),
        eventPosterUrlInput: document.getElementById('event-poster-url'),
        eventPosterUploadInput: document.getElementById('event-poster-upload'),

        //Content Management
        contentManageForm: document.getElementById('content-manage-form'),
        bannerUrlInput: document.getElementById('banner-url'),
        bannerUploadInput: document.getElementById('banner-upload'),
        promoEnableCheckbox: document.getElementById('promo-enable'),
        promoTextInput: document.getElementById('promo-text'),
        promoNeonColorInput: document.getElementById('promo-neon-color'),
        backupBtn: document.getElementById('backup-btn'),
        restoreInput: document.getElementById('restore-input'),

        // Gallery Management
        galleryManageForm: document.getElementById('gallery-manage-form'),
        galleryEventSelect: document.getElementById('gallery-event-select'),
        galleryUrlsInput: document.getElementById('gallery-urls-input'),
        galleryUploadInput: document.getElementById('gallery-upload'),
        addUploadedImagesBtn: document.getElementById('add-uploaded-images-btn'),
        galleryEventListContainer: document.getElementById('gallery-event-list-container'),
        adminGalleryPreviewGrid: document.getElementById('admin-gallery-preview-grid'),
        galleryImageViewContainer: document.getElementById('gallery-image-view-container'),
        galleryImageViewGrid: document.getElementById('gallery-image-view-grid'),
        galleryImageViewTitle: document.getElementById('gallery-image-view-title'),
        galleryBackBtn: document.getElementById('gallery-back-btn'),

        // QR Scanner
        scanQrBtn: document.getElementById('scan-qr-btn'),
        adminMainView: document.getElementById('admin-main-view'),
        adminScannerView: document.getElementById('admin-scanner-view'),
        scanBackBtn: document.getElementById('scan-back-btn'),
        scannerMessage: document.getElementById('scanner-message'),
        scannerVideoRegion: document.getElementById('scanner-video-region'),
        scannerInputView: document.getElementById('scanner-input-view'),
        scannerInputMessage: document.getElementById('scanner-input-message'),
        scannerQuantityInput: document.getElementById('scanner-quantity-input'),
        scannerConfirmBtn: document.getElementById('scanner-confirm-btn'),
        scannerCancelBtn: document.getElementById('scanner-cancel-btn'),
        scannerCloseBtn: document.getElementById('scanner-close-btn'),

        // Giveaway
        giveawayEventListUl: document.getElementById('giveaway-events-list-ul'),
        giveawayWinnerResult: document.getElementById('giveaway-winner-result'),

        // Ticket Modal
        ticketToDownload: document.getElementById('ticket-to-download'),
        ticketHolderName: document.getElementById('ticket-holder-name'),
        ticketEventName: document.getElementById('ticket-event-name'),
        ticketEventDate: document.getElementById('ticket-event-date'),
        ticketQuantityDetails: document.getElementById('ticket-quantity-details'),
        ticketQrCode: document.getElementById('ticket-qr-code'),
        downloadTicketBtn: document.getElementById('download-ticket-btn'),
        ticketListTitle: document.getElementById('ticket-list-title'),
        ticketListContent: document.getElementById('ticket-list-content'),

        // Email
        emailForm: document.getElementById('email-form'),

        // Logo
        headerLogoImg: document.getElementById('header-logo-img'),
        appLogoUrlInput: document.getElementById('app-logo-url'),
        appLogoUploadInput: document.getElementById('app-logo-upload'),
        ticketLogoUrlInput: document.getElementById('ticket-logo-url'),
        ticketLogoUploadInput: document.getElementById('ticket-logo-upload'),

        // Drags
        dragListContainer: document.getElementById('drag-list-container'),
        dragGalleryViewContainer: document.getElementById('drag-gallery-view-container'),
        dragGalleryBackBtn: document.getElementById('drag-gallery-back-btn'),
        dragGalleryViewTitle: document.getElementById('drag-gallery-view-title'),
        dragGalleryViewGrid: document.getElementById('drag-gallery-view-grid'),
        addDragForm: document.getElementById('add-drag-form'),
        addDragFormButton: document.getElementById('add-drag-form-button'),
        clearDragFormButton: document.getElementById('clear-drag-form-button'),
        adminDragListUl: document.getElementById('admin-drags-list-ul'),
        dragCoverUrlInput: document.getElementById('drag-cover-url'),
        dragCoverUploadInput: document.getElementById('drag-cover-upload'),
        dragGalleryUrlsInput: document.getElementById('drag-gallery-urls'),
        dragGalleryUploadInput: document.getElementById('drag-gallery-upload'),
        addDragGalleryUploadBtn: document.getElementById('add-drag-gallery-upload-btn'),
        adminDragGalleryPreviewGrid: document.getElementById('admin-drag-gallery-preview-grid'),

        // Admin Merch
        adminMerchSelectDrag: document.getElementById('admin-merch-select-drag'),
        adminMerchListContainer: document.getElementById('admin-merch-list-container'),
        addMerchItemForm: document.getElementById('add-merch-item-form'),
        addMerchItemFormButton: document.getElementById('add-merch-item-form-button'),
        clearMerchItemFormButton: document.getElementById('clear-merch-item-form-button'),
        merchItemImageUrlInput: document.getElementById('merch-item-image-url'),
        merchItemImageUploadInput: document.getElementById('merch-item-image-upload'),

        // Public Merch
        merchGalleryModal: document.getElementById('merch-gallery-modal'),
        merchGalleryTitle: document.getElementById('merch-gallery-title'),
        merchGalleryContent: document.getElementById('merch-gallery-content'),
        merchPurchaseModal: document.getElementById('merch-purchase-modal'),
        merchPurchaseForm: document.getElementById('merch-purchase-form'),
        merchPurchaseItemName: document.getElementById('merch-purchase-item-name'),
        merchQrModal: document.getElementById('merch-qr-modal'),
        merchQrToDownload: document.getElementById('merch-qr-to-download'),
        merchHolderName: document.getElementById('merch-holder-name'),
        merchQrLogoImg: document.getElementById('merch-qr-logo-img'),
        merchQrDragName: document.getElementById('merch-qr-drag-name'),
        merchQrItemName: document.getElementById('merch-qr-item-name'),
        merchQrQuantity: document.getElementById('merch-qr-quantity'),
        merchQrCode: document.getElementById('merch-qr-code'),
        downloadMerchQrBtn: document.getElementById('download-merch-qr-btn'),

        // Admin Merch Sales
        adminMerchSalesSummary: document.getElementById('admin-merch-sales-summary'),
        adminMerchTotalItems: document.getElementById('admin-merch-total-items'),
        adminMerchTotalRevenue: document.getElementById('admin-merch-total-revenue'),
        adminMerchViewSalesBtn: document.getElementById('admin-merch-view-sales-btn'),
        merchSalesListModal: document.getElementById('merch-sales-list-modal'),
        merchSalesListTitle: document.getElementById('merch-sales-list-title'),
        merchSalesListContent: document.getElementById('merch-sales-list-content')
    };

    // Initialize navigation links collection from main nav
    document.querySelectorAll('#main-nav [data-nav]').forEach(el => {
        domRefs.mainNavLinks[el.dataset.nav] = el;
    });

    console.log('DOM references initialized');
    return domRefs;
}
