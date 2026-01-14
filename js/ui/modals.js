// === Modals Module ===

import { domRefs } from './dom-refs.js';
import { SUCCESS_KEYWORDS, PLACEHOLDERS } from '../core/constants.js';
import { clearDynamicListListeners } from './event-listeners.js';
import {
    currentImageModalGallery,
    currentImageModalIndex,
    setImageModalState,
    clearImageModalState
} from '../core/state.js';
import { addTrackedListener } from './event-listeners.js';

let onInfoModalClose = null;

/**
 * Show or hide loading modal
 * @param {boolean} isLoading - True to show, false to hide
 */
export function showLoading(isLoading) {
    domRefs.loadingModal?.classList.toggle('hidden', !isLoading);
}

/**
 * Show information modal with message
 * @param {string} message - Message to display
 * @param {boolean} isError - True if error message
 * @param {Function|null} onClose - Callback when modal closes
 */
export function showInfoModal(message, isError = false, onClose = null) {
    if (!domRefs.infoModal || !domRefs.infoModalText) {
        alert(message);
        return;
    }

    domRefs.infoModalText.innerHTML = message;
    domRefs.infoModalText.classList.toggle('text-red-400', isError);

    // Detect success message
    const isSuccess = !isError && SUCCESS_KEYWORDS.some(kw =>
        message.toLowerCase().includes(kw)
    );
    domRefs.infoModalText.classList.toggle('text-green-400', isSuccess);
    domRefs.infoModalText.classList.toggle('text-gray-300', !isError && !isSuccess);

    domRefs.infoModalText.classList.remove('text-left');
    domRefs.infoModalText.classList.add('text-center');

    onInfoModalClose = onClose;
    domRefs.infoModal.classList.remove('hidden');
}

/**
 * Close modal by ID
 * @param {string} modalId - ID of modal to close
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal?.classList.add('hidden');

    // Callback for info-modal
    if (modalId === 'info-modal' && onInfoModalClose) {
        try {
            onInfoModalClose();
        } catch (e) {
            console.error("Error en callback de closeModal:", e);
        }
        onInfoModalClose = null;
    }

    // Cleanup for image-modal
    if (modalId === 'image-modal') {
        if (domRefs.imageModalPrevBtn) domRefs.imageModalPrevBtn.classList.add('hidden');
        if (domRefs.imageModalNextBtn) domRefs.imageModalNextBtn.classList.add('hidden');
        clearImageModalState();
        if (domRefs.imageModalContent) domRefs.imageModalContent.src = '';
    }

    // Cleanup for merch modals
    if (modalId === 'merch-gallery-modal') {
        clearDynamicListListeners('merchGalleryItems');
        if (domRefs.merchGalleryContent) domRefs.merchGalleryContent.innerHTML = '';
    }
    if (modalId === 'merch-purchase-modal' && domRefs.merchPurchaseForm) {
        domRefs.merchPurchaseForm.reset();
    }
    if (modalId === 'merch-qr-modal' && domRefs.merchQrCode) {
        domRefs.merchQrCode.innerHTML = '';
    }
    if (modalId === 'merch-sales-list-modal') {
        clearDynamicListListeners('merchSalesList');
        if (domRefs.merchSalesListContent) domRefs.merchSalesListContent.innerHTML = '';
    }

    // Cleanup for ticket list
    if (modalId === 'ticket-list-modal') {
        clearDynamicListListeners('ticketListItems');
        if (domRefs.ticketListContent) domRefs.ticketListContent.innerHTML = '';
    }

    // Cleanup for email modal
    if (modalId === 'email-modal' && domRefs.emailForm) {
        domRefs.emailForm.reset();
    }

    // Cleanup for ticket modal (QR)
    if (modalId === 'ticket-modal' && domRefs.ticketQrCode) {
        domRefs.ticketQrCode.innerHTML = '';
    }
}

/**
 * Show image modal with gallery navigation
 * @param {string} src - Image source
 * @param {Array} gallery - Array of images for navigation
 * @param {number} index - Current image index
 */
export function showImageModal(src, gallery = [], index = 0) {
    if (!domRefs.imageModal || !domRefs.imageModalContent) return;

    setImageModalState(gallery, index);

    domRefs.imageModalContent.src = src;
    domRefs.imageModalContent.onerror = () => {
        domRefs.imageModalContent.src = PLACEHOLDERS.MODAL_ERROR;
    };

    const showNav = gallery.length > 1;
    domRefs.imageModalPrevBtn?.classList.toggle('hidden', !showNav);
    domRefs.imageModalNextBtn?.classList.toggle('hidden', !showNav);

    domRefs.imageModal.classList.remove('hidden');
}

/**
 * Navigate to next image in image modal
 */
export function handleImageModalNext() {
    if (!domRefs.imageModalContent || currentImageModalGallery.length === 0) return;

    const newIndex = (currentImageModalIndex + 1) % currentImageModalGallery.length;
    setImageModalState(currentImageModalGallery, newIndex);
    domRefs.imageModalContent.src = currentImageModalGallery[newIndex];
}

/**
 * Navigate to previous image in image modal
 */
export function handleImageModalPrev() {
    if (!domRefs.imageModalContent || currentImageModalGallery.length === 0) return;

    const newIndex = (currentImageModalIndex - 1 + currentImageModalGallery.length) % currentImageModalGallery.length;
    setImageModalState(currentImageModalGallery, newIndex);
    domRefs.imageModalContent.src = currentImageModalGallery[newIndex];
}

/**
 * Render editable gallery grid for admin
 * @param {string} containerId - ID of grid container
 * @param {string} hiddenInputId - ID of hidden input for URLs
 * @param {Array} imageUrls - Array of image URLs
 */
export function renderAdminGalleryGrid(containerId, hiddenInputId, imageUrls) {
    const gridContainer = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    if (!gridContainer || !hiddenInput) {
        console.error(`Error: Contenedor (${containerId}) o input oculto (${hiddenInputId}) no encontrados.`);
        return;
    }

    const listenerType = `delete-img-${containerId}`;
    clearDynamicListListeners(listenerType);

    gridContainer.innerHTML = '';

    if (!imageUrls || imageUrls.length === 0) {
        gridContainer.innerHTML = `<p class="text-gray-500 font-pixel text-center col-span-full self-center">No hay imágenes en esta galería.</p>`;
        hiddenInput.value = '';
        return;
    }

    hiddenInput.value = imageUrls.join('\n');

    imageUrls.forEach((url, index) => {
        if (!url) return;

        const item = document.createElement('div');
        item.className = 'admin-gallery-item';
        item.innerHTML = `
                <img src="${url}" alt="Miniatura ${index + 1}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/100x100/000/fff?text=Error&font=vt323';">
                <button type="button" class="delete-img-btn" data-url="${url}" data-index="${index}" title="Eliminar imagen">&times;</button>
            `;
        gridContainer.appendChild(item);

        const deleteBtn = item.querySelector('.delete-img-btn');
        if (deleteBtn) {
            addTrackedListener(deleteBtn, 'click', (e) => {
                e.preventDefault();
                const urlToDelete = e.currentTarget.dataset.url;
                const updatedUrls = imageUrls.filter(imgUrl => imgUrl !== urlToDelete);
                renderAdminGalleryGrid(containerId, hiddenInputId, updatedUrls);
            }, listenerType);
        }
    });
}
