// === Drags Admin Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState, allMerchSales, setAllMerchSales } from '../../core/state.js'; // setAllMerchSales needed for delete
import { saveAppState } from '../../api/app-state-api.js';
import { saveMerchSalesState } from '../../api/merch-api.js';
import { showLoading, showInfoModal, renderAdminGalleryGrid } from '../../ui/modals.js';
import { clearDynamicListListeners, addTrackedListener } from '../../ui/event-listeners.js';
import { resetDragForm, setEditingDragId, editingDragId } from './drag-form.js';
import { renderDragList } from './drags-public.js';
import { renderAdminMerch } from '../merch/merch-admin.js';

/**
 * Render Admin Drags List
 * @param {Array} drags 
 */
export function renderAdminDrags(drags) {
    clearDynamicListListeners('adminDrags');
    if (!domRefs.adminDragListUl) return;

    domRefs.adminDragListUl.innerHTML = '';
    if (!drags || drags.length === 0) {
        domRefs.adminDragListUl.innerHTML = '<li class="text-gray-400 text-center font-pixel">No hay drags registradas.</li>';
        return;
    }

    drags.forEach(drag => {
        try {
            const item = document.createElement('li');
            item.className = "bg-gray-800 p-4 border border-gray-500 flex justify-between items-center";
            const imageUrl = drag.coverImageUrl || 'https://placehold.co/50x50/333/ccc?text=?&font=vt323';

            item.innerHTML = `
					<div class="flex items-center gap-4">
						<img src="${imageUrl}" alt="${drag.name || 'Drag'}" class="w-12 h-12 object-cover border border-gray-600 rounded-full" onerror="this.onerror=null;this.src='https://placehold.co/50x50/333/ccc?text=?&font=vt323';">
						<div>
							<span class="font-pixel text-lg text-white block">${drag.name || 'Drag sin nombre'}</span>
							<span class="text-xs text-gray-400 block break-all">@${drag.instagramHandle || '...'}</span>
						</div>
					</div>
					<div class="flex space-x-2">
						<button data-drag-id="${drag.id}" class="edit-drag-btn bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-none text-sm font-pixel transition-colors">EDITAR</button>
						<button data-drag-id="${drag.id}" class="delete-drag-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-none text-sm font-pixel transition-colors">ELIMINAR</button>
					</div>`;
            domRefs.adminDragListUl.appendChild(item);
        } catch (e) {
            console.error(`Error renderizando drag admin ${drag?.id}:`, e);
        }
    });

    // Re-attach listeners
    domRefs.adminDragListUl.querySelectorAll('.edit-drag-btn').forEach(btn => addTrackedListener(btn, 'click', handleEditDragClick));
    domRefs.adminDragListUl.querySelectorAll('.delete-drag-btn').forEach(btn => addTrackedListener(btn, 'click', handleDeleteDrag));
}

/**
 * Handle Save Drag (Add or Edit)
 */
export async function handleSaveDrag(e) {
    e.preventDefault();
    if (!domRefs.addDragForm || !appState) return;

    const dragIdToSave = editingDragId;
    const formData = new FormData(domRefs.addDragForm);
    const hiddenDragGalleryInput = document.getElementById('drag-gallery-urls');

    const dragName = formData.get('drag-name')?.trim() || '';
    const dragInsta = formData.get('drag-instagram')?.trim().replace('@', '') || '';
    const dragColor = formData.get('drag-card-color')?.trim() || '#FFFFFF';
    const dragDesc = formData.get('drag-description')?.trim() || '';
    const dragCoverUrl = formData.get('drag-cover-url')?.trim() || '';
    const dragGalleryUrls = (hiddenDragGalleryInput?.value || '')
        .split('\n')
        .filter(url => url);

    // Validation
    if (!dragName || !dragDesc) {
        showInfoModal("Nombre y Descripción son obligatorios.", true); return;
    }
    if (dragCoverUrl && !(dragCoverUrl.startsWith('http') || dragCoverUrl.startsWith('uploads/'))) {
        showInfoModal("La URL de portada no es válida (http o uploads/).", true); return;
    }
    if (!/^#[0-9A-F]{6}$/i.test(dragColor)) {
        showInfoModal("El color debe ser un código hexadecimal válido (ej: #F02D7D).", true); return;
    }

    showLoading(true);
    try {
        if (dragIdToSave !== null) { // Update existing
            const dragIndex = appState.drags.findIndex(d => d.id === dragIdToSave);
            if (dragIndex > -1) {
                const existingDrag = appState.drags[dragIndex];
                appState.drags[dragIndex] = {
                    ...existingDrag,
                    name: dragName,
                    description: dragDesc,
                    instagramHandle: dragInsta,
                    cardColor: dragColor,
                    coverImageUrl: dragCoverUrl,
                    galleryImages: dragGalleryUrls
                };
                await saveAppState();
                showInfoModal("¡DRAG ACTUALIZADA!", false);
            } else {
                throw new Error("Drag a editar no encontrada.");
            }
        } else { // Add new
            const newDrag = {
                id: appState.nextDragId++,
                name: dragName,
                description: dragDesc,
                instagramHandle: dragInsta,
                cardColor: dragColor,
                coverImageUrl: dragCoverUrl,
                galleryImages: dragGalleryUrls,
                merchItems: []
            };
            if (!Array.isArray(appState.drags)) appState.drags = [];
            appState.drags.push(newDrag);
            await saveAppState();
            showInfoModal("¡DRAG AÑADIDA!", false);
        }

        resetDragForm();
        renderDragList();
        renderAdminDrags(appState.drags);
        renderAdminMerch(); // Update merch select
    } catch (error) {
        console.error("Error saving drag:", error);
        showInfoModal("Error al guardar la drag: " + error.message, true);
    } finally {
        showLoading(false);
    }
}

/**
 * Handle Edit Drag Button Click
 */
export function handleEditDragClick(e) {
    const dragId = parseInt(e.target.dataset.dragId, 10);
    if (isNaN(dragId) || !appState || !appState.drags) return;

    const dragToEdit = appState.drags.find(d => d.id === dragId);
    if (!dragToEdit || !domRefs.addDragForm) {
        showInfoModal("Error: Drag no encontrada para editar.", true);
        return;
    }

    // Populate form
    domRefs.addDragForm['edit-drag-id'].value = dragToEdit.id;
    domRefs.addDragForm['drag-name'].value = dragToEdit.name || '';
    domRefs.addDragForm['drag-instagram'].value = dragToEdit.instagramHandle || '';
    domRefs.addDragForm['drag-card-color'].value = dragToEdit.cardColor || '#FFFFFF';
    domRefs.addDragForm['drag-description'].value = dragToEdit.description || '';
    domRefs.addDragForm['drag-cover-url'].value = dragToEdit.coverImageUrl || '';

    // Populate gallery grid
    const dragGalleryUrls = dragToEdit.galleryImages || [];
    renderAdminGalleryGrid('admin-drag-gallery-preview-grid', 'drag-gallery-urls', dragGalleryUrls);

    setEditingDragId(dragToEdit.id);

    // Update button
    if (domRefs.addDragFormButton) {
        domRefs.addDragFormButton.textContent = "ACTUALIZAR DRAG";
        domRefs.addDragFormButton.classList.add('bg-blue-600', 'hover:bg-blue-500');
        domRefs.addDragFormButton.classList.remove('bg-white', 'hover:bg-gray-300');
    }

    domRefs.addDragForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Handle Delete Drag
 */
export async function handleDeleteDrag(e) {
    const dragId = parseInt(e.target.dataset.dragId, 10);
    if (isNaN(dragId) || !appState || !appState.drags) return;

    const dragToDelete = appState.drags.find(d => d.id === dragId);
    if (!dragToDelete) return;

    console.warn(`Simulando confirmación para eliminar drag: ${dragToDelete.name} (ID: ${dragId})`);
    showLoading(true);
    try {
        appState.drags = appState.drags.filter(d => d.id !== dragId);

        // Remove associated merch sales
        const initialSalesCount = allMerchSales.length;
        const updatedSales = allMerchSales.filter(s => s.dragId !== dragId);
        setAllMerchSales(updatedSales);

        const removedSalesCount = initialSalesCount - updatedSales.length;
        if (removedSalesCount > 0) {
            console.log(`Eliminadas ${removedSalesCount} ventas de merch asociadas a la drag ${dragId}.`);
        }

        if (editingDragId === dragId) {
            resetDragForm();
        }

        await saveAppState();
        await saveMerchSalesState();

        showLoading(false);
        showInfoModal(`DRAG "${dragToDelete.name}" Y SUS VENTAS ELIMINADAS.`, false);

        renderDragList();
        renderAdminDrags(appState.drags);
        renderAdminMerch();

    } catch (error) {
        showLoading(false);
        console.error("Error deleting drag:", error);
        showInfoModal("Error al eliminar la drag: " + error.message, true);
    }
}

export { resetDragForm };
