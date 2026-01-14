// === Application State ===

// Main app state object
export const appState = {
    events: [],
    drags: [],
    webMerch: [],
    allowedDomains: [],
    scannedTickets: {},
    nextEventId: 1,
    nextDragId: 1,
    nextMerchItemId: 1,
    appLogoUrl: '',
    ticketLogoUrl: '',
    bannerVideoUrl: '',
    promoEnabled: false,
    promoCustomText: '',
    promoNeonColor: '#F02D7D'
};

// Tickets state
export let allTickets = [];

// Merch sales state
export let allMerchSales = [];

// Authentication state
export let isLoggedIn = false;
export let adminEmail = '';

// UI state
export let pendingEventId = null;
export let editingEventId = null;
export let editingDragId = null;
export let editingMerchItemId = null;
export let currentAdminMerchDragId = null;
export let adminTapCounter = 0;

// Image modal state
export let currentImageModalGallery = [];
export let currentImageModalIndex = 0;

// === Setters for state modification ===

export function setAllTickets(tickets) {
    allTickets = tickets;
}

export function getAllTickets() {
    return allTickets;
}

export function setAllMerchSales(sales) {
    allMerchSales = sales;
}

export function getAllMerchSales() {
    return allMerchSales;
}

export function setIsLoggedIn(status) {
    isLoggedIn = status;
}

export function setAdminEmail(email) {
    adminEmail = email;
}

export function setPendingEventId(id) {
    pendingEventId = id;
}

export function setEditingEventId(id) {
    editingEventId = id;
}

export function setEditingDragId(id) {
    editingDragId = id;
}

export function setEditingMerchItemId(id) {
    editingMerchItemId = id;
}

export function setCurrentAdminMerchDragId(id) {
    currentAdminMerchDragId = id;
}

export function incrementAdminTapCounter() {
    adminTapCounter++;
    return adminTapCounter;
}

export function resetAdminTapCounter() {
    adminTapCounter = 0;
}

export function setImageModalState(gallery, index) {
    currentImageModalGallery = gallery;
    currentImageModalIndex = index;
}

export function clearImageModalState() {
    currentImageModalGallery = [];
    currentImageModalIndex = 0;
}
