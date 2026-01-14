// === Event Listeners Management Module ===

let allEventListeners = [];

/**
 * Clear all tracked event listeners
 */
export function clearEventListeners() {
    allEventListeners.forEach(({ element, type, handler }) => {
        try {
            element?.removeEventListener(type, handler);
        } catch (e) {
            console.warn("Could not remove listener", element, type, e);
        }
    });
    allEventListeners = [];
}

/**
 * Clear dynamic event listeners by type
 * @param {string} listType - Type of listeners to clear
 */
export function clearDynamicListListeners(listType) {
    let classSelector = '';
    let dynamicTypePrefix = '';

    switch (listType) {
        case 'publicEvents':
            classSelector = '.get-ticket-btn, .gallery-link-btn';
            break;
        case 'galleryList':
            classSelector = '.gallery-event-btn';
            break;
        case 'eventGalleryImages':
            classSelector = '.event-gallery-img-btn';
            break;
        case 'dragList':
            classSelector = '.drag-gallery-btn, .drag-instagram-btn, .drag-merch-btn';
            break;
        case 'dragGalleryImages':
            classSelector = '.drag-gallery-img-btn';
            break;
        case 'merchGalleryItems':
            classSelector = '.merch-buy-btn';
            break;
        case 'merchSalesList':
            classSelector = '.mark-delivered-btn';
            break;
        case 'adminDrags':
            classSelector = '.edit-drag-btn, .delete-drag-btn';
            break;
        case 'adminMerchItems':
            classSelector = '.edit-merch-btn, .delete-merch-btn';
            break;
        case 'pastGalleryList':
            classSelector = '.past-gallery-event-btn';
            break;
        case 'adminEvents':
            classSelector = '.archive-event-btn, .edit-event-btn, .delete-event-btn, .view-tickets-btn';
            break;
        case 'giveaway':
            classSelector = '.giveaway-btn';
            break;
        case 'ticketListItems':
            classSelector = '.delete-ticket-btn';
            break;
        default:
            if (listType && listType.startsWith('delete-img-')) {
                classSelector = '.delete-img-btn';
                dynamicTypePrefix = listType;
            } else {
                return;
            }
            break;
    }

    allEventListeners = allEventListeners.filter(({ element, type, handler, dynamicType }) => {
        let shouldRemove = false;
        if (element && typeof element.matches === 'function') {
            if (classSelector && element.matches(classSelector)) {
                if (dynamicTypePrefix) {
                    if (dynamicType === dynamicTypePrefix) {
                        shouldRemove = true;
                    }
                } else {
                    shouldRemove = true;
                }
            }
        }

        if (shouldRemove) {
            try {
                element.removeEventListener(type, handler);
            } catch (e) {
                console.warn("Could not remove dynamic listener", element, type, e);
            }
            return false;
        }
        return true;
    });
}

/**
 * Add a tracked event listener
 * @param {Element} element - DOM element
 * @param {string} type - Event type
 * @param {Function} handler - Event handler
 * @param {string|null} dynamicType - Optional dynamic type identifier
 */
export function addTrackedListener(element, type, handler, dynamicType = null) {
    if (!element) {
        console.warn("Attempted to add listener to null element", type, handler);
        return;
    }
    element.addEventListener(type, handler);
    allEventListeners.push({ element, type, handler, dynamicType });
}

/**
 * Get all tracked listeners (for debugging)
 * @returns {Array} Array of listener objects
 */
export function getAllTrackedListeners() {
    return allEventListeners;
}
