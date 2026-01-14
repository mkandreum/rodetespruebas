// === Merch Form Module ===

import { domRefs } from '../../ui/dom-refs.js';

export let editingMerchItemId = null;

/**
 * Set current editing item ID
 * @param {number|null} id 
 */
export function setEditingMerchItemId(id) {
    editingMerchItemId = id;
}

/**
 * Reset Merch Item Form
 */
export function resetMerchItemForm() {
    if (!domRefs.addMerchItemForm) return;

    domRefs.addMerchItemForm.reset();
    setEditingMerchItemId(null);

    if (domRefs.addMerchItemForm['edit-merch-item-id']) {
        domRefs.addMerchItemForm['edit-merch-item-id'].value = '';
    }

    if (domRefs.merchImageUploadInput) domRefs.merchImageUploadInput.value = '';

    if (domRefs.addMerchItemButton) {
        domRefs.addMerchItemButton.textContent = "AÑADIR ARTÍCULO";
        domRefs.addMerchItemButton.classList.remove('bg-blue-600', 'hover:bg-blue-500');
        domRefs.addMerchItemButton.classList.add('bg-pink-600', 'hover:bg-pink-500');
    }
}
