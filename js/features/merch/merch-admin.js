// === Merch Admin Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState, allMerchSales, setAllMerchSales } from '../../core/state.js';
import { saveAppState } from '../../api/app-state-api.js';
import { saveMerchSalesState } from '../../api/merch-api.js';
import { showLoading, showInfoModal } from '../../ui/modals.js';
import { clearDynamicListListeners, addTrackedListener } from '../../ui/event-listeners.js';
import { resetMerchItemForm, setEditingMerchItemId, editingMerchItemId } from './merch-form.js';
import { renderMerchPage } from './merch-public.js';

let currentAdminMerchDragId = null;

// Helper to update render ref in public module (if needed, but imports are live bindings, so maybe not strictly needed if we just call the exported function directly)
// But 'renderAdminMerchSalesSummary' is called FROM public module. So I exported a setter there.
// I should call that setter here at init time? No, I'll do it if I have an init. 
// Or I can just rely on the fact that I'm implementing it here and exporting it.
import { setRenderAdminMerchSalesSummaryRef } from './merch-public.js';

// Set the reference immediately
setRenderAdminMerchSalesSummaryRef(renderAdminMerchSalesSummary);


/**
 * Handle Drag Select Change in Merch Admin
 */
export function handleAdminMerchDragSelect(e) {
    const val = e ? e.target.value : (domRefs.adminMerchSelectDrag?.value);

    if (val === 'web') {
        currentAdminMerchDragId = 'web';
    } else if (val) {
        currentAdminMerchDragId = parseInt(val, 10);
    } else {
        currentAdminMerchDragId = null;
    }
    renderAdminMerch();
}

/**
 * Render Admin Merch Panel
 */
export function renderAdminMerch() {
    if (!domRefs.adminMerchSelectDrag || !domRefs.adminMerchListContainer || !appState || !appState.drags) return;

    clearDynamicListListeners('adminMerchItems');

    const previousSelectedDragId = domRefs.adminMerchSelectDrag.value;

    // Populate dropdown
    domRefs.adminMerchSelectDrag.innerHTML = '<option value="">-- SELECCIONA UNA DRAG --</option>';

    const webOption = document.createElement('option');
    webOption.value = 'web';
    webOption.textContent = 'RODETES OFICIAL (WEB MERCH)';
    webOption.style.fontWeight = 'bold';
    webOption.style.color = '#F02D7D';
    domRefs.adminMerchSelectDrag.appendChild(webOption);

    [...(appState.drags)]
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .forEach(drag => {
            const option = document.createElement('option');
            option.value = drag.id;
            option.textContent = drag.name || `Drag ID ${drag.id}`;
            domRefs.adminMerchSelectDrag.appendChild(option);
        });

    // Restore selection
    if (previousSelectedDragId === 'web') {
        domRefs.adminMerchSelectDrag.value = 'web';
        currentAdminMerchDragId = 'web';
    } else if (previousSelectedDragId && appState.drags.some(d => d.id === parseInt(previousSelectedDragId))) {
        domRefs.adminMerchSelectDrag.value = previousSelectedDragId;
        currentAdminMerchDragId = parseInt(previousSelectedDragId);
    } else {
        currentAdminMerchDragId = null;
        domRefs.adminMerchSelectDrag.value = "";
    }

    // Render items list
    domRefs.adminMerchListContainer.innerHTML = '';
    if (currentAdminMerchDragId === null) {
        domRefs.adminMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">Selecciona una drag o Web Merch para ver/añadir items.</li>';
        domRefs.addMerchItemForm?.classList.add('hidden');
        domRefs.adminMerchSalesSummary?.classList.add('hidden');
    } else {
        domRefs.addMerchItemForm?.classList.remove('hidden');
        renderAdminMerchSalesSummary();

        let merchItems = [];
        if (currentAdminMerchDragId === 'web') {
            merchItems = appState.webMerch || [];
        } else {
            const drag = appState.drags.find(d => d.id === currentAdminMerchDragId);
            merchItems = drag?.merchItems || [];
        }

        if (merchItems.length === 0) {
            domRefs.adminMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">No hay artículos de merchandising añadidos.</li>';
        } else {
            merchItems.forEach(item => {
                try {
                    const li = document.createElement('li');
                    li.className = "bg-gray-800 p-4 border border-gray-500 flex flex-wrap justify-between items-center gap-4";
                    const itemImageUrl = item.imageUrl || 'https://placehold.co/60x60/333/ccc?text=?&font=vt323';
                    const price = (item.price || 0).toFixed(2);

                    li.innerHTML = `
						<div class="flex items-center gap-4 flex-grow min-w-0">
							<img src="${itemImageUrl}" alt="${item.name || 'Artículo'}" class="w-12 h-12 object-contain border border-gray-600 flex-shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/60x60/333/ccc?text=ERR&font=vt323';">
							<div class="min-w-0">
								<span class="font-pixel text-lg text-white block truncate" title="${item.name || ''}">${item.name || 'Artículo sin nombre'}</span>
								<span class="text-base text-blue-400 font-bold">${price}€</span>
							</div>
						</div>
						<div class="flex space-x-2 flex-shrink-0">
							<button data-merch-id="${item.id}" class="edit-merch-btn bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-none text-sm font-pixel">EDITAR</button>
							<button data-merch-id="${item.id}" class="delete-merch-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-none text-sm font-pixel">ELIMINAR</button>
						</div>
					`;
                    domRefs.adminMerchListContainer.appendChild(li);
                } catch (e) {
                    console.error(`Error renderizando item merch admin ${item?.id}:`, e);
                }
            });

            domRefs.adminMerchListContainer.querySelectorAll('.edit-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleEditMerchItemClick));
            domRefs.adminMerchListContainer.querySelectorAll('.delete-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleDeleteMerchItem));
        }
    }

    resetMerchItemForm();
}

/**
 * Handle Save Merch Item
 */
export async function handleSaveMerchItem(e) {
    e.preventDefault();
    if (!domRefs.addMerchItemForm || !appState || currentAdminMerchDragId === null) return;

    const itemIdToSave = editingMerchItemId;
    const formData = new FormData(domRefs.addMerchItemForm);

    const itemName = formData.get('merch-name')?.trim() || '';
    const itemPrice = parseFloat(formData.get('merch-price'));
    const itemDesc = formData.get('merch-description')?.trim() || '';
    const itemImageUrl = formData.get('merch-image-url')?.trim() || '';

    if (!itemName) { showInfoModal("El nombre del artículo es obligatorio.", true); return; }
    if (isNaN(itemPrice) || itemPrice < 0) { showInfoModal("El precio debe ser un número válido >= 0.", true); return; }
    if (itemImageUrl && !(itemImageUrl.startsWith('http') || itemImageUrl.startsWith('uploads/'))) { showInfoModal("URL de imagen no válida.", true); return; }

    showLoading(true);
    try {
        let itemsArray;
        const isWeb = currentAdminMerchDragId === 'web';

        if (isWeb) {
            if (!appState.webMerch) appState.webMerch = [];
            itemsArray = appState.webMerch;
        } else {
            const drag = appState.drags.find(d => d.id === currentAdminMerchDragId);
            if (!drag) throw new Error("Drag no encontrada.");
            if (!drag.merchItems) drag.merchItems = [];
            itemsArray = drag.merchItems;
        }

        if (itemIdToSave !== null) { // Update
            const itemIndex = itemsArray.findIndex(i => i.id === itemIdToSave);
            if (itemIndex > -1) {
                itemsArray[itemIndex] = {
                    ...itemsArray[itemIndex],
                    name: itemName,
                    price: itemPrice,
                    description: itemDesc,
                    imageUrl: itemImageUrl
                };
                await saveAppState();
                showInfoModal("¡ARTÍCULO ACTUALIZADO!", false);
            } else {
                throw new Error("Artículo a editar no encontrado.");
            }
        } else { // Add new
            const newItem = {
                id: appState.nextMerchItemId++,
                name: itemName,
                price: itemPrice,
                description: itemDesc,
                imageUrl: itemImageUrl
            };
            itemsArray.push(newItem);
            await saveAppState();
            showInfoModal("¡ARTÍCULO AÑADIDO!", false);
        }

        resetMerchItemForm();
        renderAdminMerch();
        renderMerchPage();

    } catch (error) {
        console.error("Error saving merch item:", error);
        showInfoModal("Error al guardar el artículo: " + error.message, true);
    } finally {
        showLoading(false);
    }
}

/**
 * Handle Edit Merch Item Click
 */
export function handleEditMerchItemClick(e) {
    const itemId = parseInt(e.target.dataset.merchId, 10);
    if (isNaN(itemId) || !appState || currentAdminMerchDragId === null) return;

    let item = null;
    if (currentAdminMerchDragId === 'web') {
        item = appState.webMerch?.find(i => i.id === itemId);
    } else {
        const drag = appState.drags?.find(d => d.id === currentAdminMerchDragId);
        item = drag?.merchItems?.find(i => i.id === itemId);
    }

    if (!item || !domRefs.addMerchItemForm) {
        showInfoModal("Error: Artículo no encontrado.", true); return;
    }

    domRefs.addMerchItemForm['edit-merch-item-id'].value = item.id;
    domRefs.addMerchItemForm['merch-name'].value = item.name || '';
    domRefs.addMerchItemForm['merch-price'].value = item.price || 0;
    domRefs.addMerchItemForm['merch-description'].value = item.description || '';
    domRefs.addMerchItemForm['merch-image-url'].value = item.imageUrl || '';

    setEditingMerchItemId(item.id);

    if (domRefs.addMerchItemButton) {
        domRefs.addMerchItemButton.textContent = "ACTUALIZAR ARTÍCULO";
        domRefs.addMerchItemButton.classList.add('bg-blue-600', 'hover:bg-blue-500');
        domRefs.addMerchItemButton.classList.remove('bg-pink-600', 'hover:bg-pink-500');
    }

    domRefs.addMerchItemForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Handle Delete Merch Item
 */
export async function handleDeleteMerchItem(e) {
    const itemId = parseInt(e.target.dataset.merchId, 10);
    if (isNaN(itemId) || !appState || currentAdminMerchDragId === null) return;

    console.warn(`Simulando eliminación de merch item ID: ${itemId}`);
    showLoading(true);

    try {
        const isWeb = currentAdminMerchDragId === 'web';
        let itemsArray;

        if (isWeb) {
            if (!appState.webMerch) appState.webMerch = [];
            itemsArray = appState.webMerch;
        } else {
            const drag = appState.drags.find(d => d.id === currentAdminMerchDragId);
            if (!drag) throw new Error("Drag no encontrada.");
            itemsArray = drag.merchItems;
        }

        const initialLength = itemsArray.length;
        if (isWeb) {
            appState.webMerch = appState.webMerch.filter(i => i.id !== itemId);
        } else {
            const drag = appState.drags.find(d => d.id === currentAdminMerchDragId);
            drag.merchItems = drag.merchItems.filter(i => i.id !== itemId);
        }

        if (itemsArray.length === initialLength) { // Si no cambió la longitud, no se borró nada o ya no estaba
            // No error, maybe already deleted
        }

        // Clean up sales? Logic said so in previous conversation, but maybe just keep sales history.
        // Usually sales history should persist even if item is deleted. The Sale record copies Item Name and Price.
        // So we do NOT delete sales.

        if (editingMerchItemId === itemId) {
            resetMerchItemForm();
        }

        await saveAppState();

        showLoading(false);
        showInfoModal("ARTÍCULO ELIMINADO.", false);

        renderAdminMerch();
        renderMerchPage();

    } catch (error) {
        console.error("Error deleting merch item:", error);
        showLoading(false);
        showInfoModal("Error al eliminar el artículo: " + error.message, true);
    }
}


/**
 * Render Sales Summary for Selected Drag
 */
export function renderAdminMerchSalesSummary() {
    if (!domRefs.adminMerchSalesSummary || currentAdminMerchDragId === null) return;

    domRefs.adminMerchSalesSummary.classList.remove('hidden');

    const salesForDrag = (allMerchSales || []).filter(s => s.dragId === currentAdminMerchDragId);
    const deliveredSales = salesForDrag.filter(s => s.status === 'Delivered');
    const pendingSalesCount = salesForDrag.length - deliveredSales.length;

    let totalItemsDelivered = 0;
    let totalRevenueDelivered = 0;

    deliveredSales.forEach(sale => {
        totalItemsDelivered += sale.quantity || 0;
        totalRevenueDelivered += (sale.quantity || 0) * (sale.itemPrice || 0);
    });

    if (domRefs.adminMerchTotalItems) domRefs.adminMerchTotalItems.textContent = totalItemsDelivered.toString();
    if (domRefs.adminMerchTotalRevenue) domRefs.adminMerchTotalRevenue.textContent = totalRevenueDelivered.toFixed(2) + ' €';

    if (domRefs.adminMerchViewSalesBtn) {
        if (salesForDrag.length > 0) {
            domRefs.adminMerchViewSalesBtn.textContent = `VER LISTA PEDIDOS (${pendingSalesCount} PENDIENTES)`;
            domRefs.adminMerchViewSalesBtn.disabled = false;
        } else {
            domRefs.adminMerchViewSalesBtn.textContent = `NO HAY PEDIDOS REGISTRADOS`;
            domRefs.adminMerchViewSalesBtn.disabled = true;
        }
    }
}

/**
 * Handle View Sales Button
 */
export function handleViewMerchSales() {
    if (!domRefs.merchSalesListModal || !domRefs.merchSalesListTitle || currentAdminMerchDragId === null || !appState) return;

    let dragName = 'Rodetes Web';
    if (currentAdminMerchDragId !== 'web') {
        const drag = appState.drags.find(d => d.id === currentAdminMerchDragId);
        if (drag) dragName = drag.name;
    }

    domRefs.merchSalesListTitle.textContent = `Pedidos de Merch: ${dragName}`;
    renderMerchSalesList();
    domRefs.merchSalesListModal.classList.remove('hidden');
}

/**
 * Render Sales List in Modal
 */
export function renderMerchSalesList() {
    if (!domRefs.merchSalesListContent || currentAdminMerchDragId === null) return;

    clearDynamicListListeners('merchSalesList');
    domRefs.merchSalesListContent.innerHTML = '';

    const salesForDrag = (allMerchSales || [])
        .filter(s => s.dragId === currentAdminMerchDragId)
        .sort((a, b) => (b.saleDate && a.saleDate) ? new Date(b.saleDate) - new Date(a.saleDate) : 0);

    if (salesForDrag.length === 0) {
        domRefs.merchSalesListContent.innerHTML = '<p class="text-gray-400 text-center font-pixel">NO HAY PEDIDOS DE MERCH REGISTRADOS.</p>';
        return;
    }

    let listHtml = `<ul class="text-left space-y-4">`;
    salesForDrag.forEach(sale => {
        try {
            const isPending = sale.status === 'Pending';
            const statusText = isPending ? 'PENDIENTE' : 'ENTREGADO';
            const statusColor = isPending ? 'text-yellow-400' : 'text-green-400';
            const totalAmount = ((sale.itemPrice || 0) * (sale.quantity || 0)).toFixed(2);
            const saleDateStr = sale.saleDate ? new Date(sale.saleDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Fecha N/A';
            const saleIdShort = (sale.saleId || 'N/A').substring(0, 8);
            const buyerName = `${sale.nombre || ''} ${sale.apellidos || ''}`.trim() || 'Nombre N/A';

            const buttonHtml = isPending
                ? `<button data-sale-id="${sale.saleId}" class="mark-delivered-btn bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-none text-sm font-pixel">MARCAR ENTREGADO</button>`
                : `<span class="text-gray-500 px-3 py-1 text-sm font-pixel">CONFIRMADO</span>`;

            listHtml += `
					<li class="p-3 bg-gray-800 border border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
						<div class="min-w-0 flex-grow">
							<span class="font-pixel text-lg text-white block truncate" title="${sale.itemName || ''}">${sale.itemName || 'Artículo'} x ${sale.quantity || '?'}</span>
							<span class="text-sm ${statusColor} font-bold block">${statusText} (${totalAmount} €)</span>
							<span class="text-xs text-gray-400 block break-words" title="${buyerName}">${buyerName}</span>
							<span class="text-xs text-gray-500 block break-all" title="${sale.email || ''}">Email: ${sale.email || 'N/A'}</span>
							<span class="text-xs text-gray-500 block">ID: ${saleIdShort}... (${saleDateStr})</span>
						</div>
						<div class="flex-shrink-0 mt-2 sm:mt-0">
							${buttonHtml}
						</div>
					</li>
				`;
        } catch (e) {
            console.error(`Error renderizando venta ${sale?.saleId}:`, e);
        }
    });
    listHtml += '</ul>';
    domRefs.merchSalesListContent.innerHTML = listHtml;

    domRefs.merchSalesListContent.querySelectorAll('.mark-delivered-btn').forEach(btn => {
        addTrackedListener(btn, 'click', handleMarkMerchDelivered);
    });
}

/**
 * Handle Mark Delivered
 */
export async function handleMarkMerchDelivered(e) {
    const saleId = e.currentTarget.dataset.saleId;
    if (!saleId || !allMerchSales) return;

    const saleIndex = allMerchSales.findIndex(s => s.saleId === saleId);
    if (saleIndex === -1) {
        showInfoModal("Error: Pedido no encontrado.", true); return;
    }
    if (allMerchSales[saleIndex].status === 'Delivered') {
        showInfoModal("Este pedido ya está marcado como entregado.", false); return;
    }

    showLoading(true);
    try {
        allMerchSales[saleIndex].status = 'Delivered';
        await saveMerchSalesState();

        renderMerchSalesList();
        renderAdminMerchSalesSummary();

        showLoading(false);
        showInfoModal(`¡PEDIDO CONFIRMADO COMO ENTREGADO!`, false);

    } catch (error) {
        showLoading(false);
        console.error("Error marking merch delivered:", error);
        allMerchSales[saleIndex].status = 'Pending'; // Revert
        renderMerchSalesList();
        renderAdminMerchSalesSummary();
        showInfoModal("Error al confirmar la entrega: " + error.message, true);
    }
}

export { resetMerchItemForm };
