
import { store } from '../store.js';
import { clearDynamicListListeners, addTrackedListener, showInfoModal, showLoading } from '../ui.js';
import { saveAppState } from '../api.js';

export function handleAdminMerchDragSelect(e) {
    const val = e.target.value;
    if (!val) {
        store.currentAdminMerchDragId = null;
    } else if (val === 'web') {
        store.currentAdminMerchDragId = 'web';
    } else {
        store.currentAdminMerchDragId = parseInt(val);
    }
    renderAdminMerch(); // Re-render list
}


export function renderAdminMerch() {
    const select = document.getElementById('admin-merch-select-drag');
    const container = document.getElementById('admin-merch-list-container');
    const form = document.getElementById('add-merch-item-form');
    const title = document.getElementById('admin-merch-drag-title'); // "Añadir merch para..."

    if (!select || !container) return;

    // Refresh Select Options (Preserving Selection)
    const savedVal = store.currentAdminMerchDragId;
    select.innerHTML = '<option value="">-- SELECCIONA --</option><option value="web" ' + (savedVal === 'web' ? 'selected' : '') + '>RODETES OFICIAL (WEB)</option>';

    (store.appState.drags || []).forEach(d => {
        const isSel = savedVal === d.id;
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        if (isSel) opt.selected = true;
        select.appendChild(opt);
    });

    clearDynamicListListeners('adminMerchItems');
    container.innerHTML = '';

    const dragId = store.currentAdminMerchDragId;

    if (!dragId) {
        container.innerHTML = '<li class="text-gray-500 text-center py-4">Selecciona una categoría/drag arriba.</li>';
        form?.classList.add('hidden');
        if (title) title.textContent = "Añadir Artículo";
        return;
    }

    form?.classList.remove('hidden');

    let items = [];
    let dragName = "Web";

    if (dragId === 'web') {
        items = store.appState.webMerch || [];
        dragName = "Rodetes Oficial";
    } else {
        const d = store.appState.drags.find(d => d.id === dragId);
        items = d?.merchItems || [];
        dragName = d?.name;
    }

    if (title) title.textContent = `Añadir Artículo para ${dragName}`;

    if (items.length === 0) {
        container.innerHTML = '<li class="text-gray-500 text-center py-4">No hay artículos. ¡Añade uno!</li>';
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = "bg-gray-800 p-3 mb-2 border border-gray-500 flex justify-between items-center";

        li.innerHTML = `
            <div class="flex items-center gap-3">
               <img src="${item.imageUrl}" class="w-12 h-12 object-cover border border-gray-600 bg-black">
               <div>
                  <div class="text-white font-pixel text-lg">${item.name}</div>
                  <div class="text-blue-400 font-bold">${item.price}€</div>
               </div>
            </div>
            <div>
                <button data-id="${item.id}" class="edit-merch-btn bg-blue-600 text-white px-2 py-1 text-xs font-pixel mr-2">EDITAR</button>
                <button data-id="${item.id}" class="delete-merch-btn bg-red-600 text-white px-2 py-1 text-xs font-pixel">BORRAR</button>
            </div>
        `;
        container.appendChild(li);
    });

    // Listeners
    container.querySelectorAll('.edit-merch-btn').forEach(b => addTrackedListener(b, 'click', handleEditMerchItem));
    container.querySelectorAll('.delete-merch-btn').forEach(b => addTrackedListener(b, 'click', handleDeleteMerchItem));
}

export async function handleSaveMerchItem(e) {
    e.preventDefault();
    if (!store.currentAdminMerchDragId) return;

    const form = e.target;
    const name = form['merch-item-name'].value;
    const price = parseFloat(form['merch-item-price'].value);
    const imgUrl = form['merch-item-image-url'].value;
    const dragId = store.currentAdminMerchDragId;
    const idToSave = store.editingMerchItemId;

    if (!name || isNaN(price)) { showInfoModal("Nombre y Precio obligatorios.", true); return; }

    showLoading(true);
    try {
        let itemsArr;
        // Determine target array
        if (dragId === 'web') {
            if (!store.appState.webMerch) store.appState.webMerch = [];
            itemsArr = store.appState.webMerch;
        } else {
            const drag = store.appState.drags.find(d => d.id === dragId);
            if (!drag) throw new Error("Drag no encontrada");
            if (!drag.merchItems) drag.merchItems = [];
            itemsArr = drag.merchItems;
        }

        if (idToSave !== null) {
            // Update
            const idx = itemsArr.findIndex(i => i.id === idToSave);
            if (idx > -1) {
                itemsArr[idx] = { ...itemsArr[idx], name, price, imageUrl: imgUrl };
            }
        } else {
            // Create
            itemsArr.push({
                id: store.appState.nextMerchItemId++,
                name, price, imageUrl: imgUrl
            });
        }

        await saveAppState();
        resetMerchItemForm();
        renderAdminMerch();
        // Also update public views? Logic is usually separate but 'renderMerchPage' handles it if active
        // renderMerchPage(); // Optional, if user switches tabs back and forth
        showInfoModal("Artículo guardado", false);

    } catch (err) {
        showInfoModal("Error guardando artículo", true);
    } finally {
        showLoading(false);
    }
}

export function resetMerchItemForm() {
    document.getElementById('add-merch-item-form')?.reset();
    store.editingMerchItemId = null;
    document.getElementById('add-merch-btn-text').textContent = "AÑADIR ARTÍCULO";
}

function handleEditMerchItem(e) {
    const itemId = parseInt(e.target.dataset.id);
    const dragId = store.currentAdminMerchDragId;

    let item;
    if (dragId === 'web') {
        item = store.appState.webMerch.find(i => i.id === itemId);
    } else {
        const drag = store.appState.drags.find(d => d.id === dragId);
        item = drag?.merchItems.find(i => i.id === itemId);
    }

    if (item) {
        store.editingMerchItemId = itemId;
        const form = document.getElementById('add-merch-item-form');
        form['merch-item-name'].value = item.name;
        form['merch-item-price'].value = item.price;
        form['merch-item-image-url'].value = item.imageUrl || '';
        document.getElementById('add-merch-btn-text').textContent = "ACTUALIZAR";
    }
}

async function handleDeleteMerchItem(e) {
    const itemId = parseInt(e.target.dataset.id);
    const dragId = store.currentAdminMerchDragId;
    if (!confirm("¿Borrar artículo?")) return;

    showLoading(true);
    try {
        if (dragId === 'web') {
            store.appState.webMerch = store.appState.webMerch.filter(i => i.id !== itemId);
        } else {
            const idx = store.appState.drags.findIndex(d => d.id === dragId);
            if (idx > -1) {
                store.appState.drags[idx].merchItems = store.appState.drags[idx].merchItems.filter(i => i.id !== itemId);
            }
        }
        await saveAppState();
        renderAdminMerch();

    } catch (err) {
        showInfoModal("Error borrando", true);
    } finally {
        showLoading(false);
    }
}

export function renderAdminMerchSalesSummary() {
    // Basic implementation of revenue summary
    const container = document.getElementById('admin-merch-total-revenue');
    if (!container) return;

    const dragId = store.currentAdminMerchDragId;
    if (!dragId) { container.textContent = "0.00 €"; return; }

    // Filter sales by drag ID
    // Note: 'web' string vs int ID handled by logic in merch.js sales creation
    const sales = store.allMerchSales.filter(s => s.dragId === dragId && s.status !== 'Cancelled'); // if we had cancelled status
    const total = sales.reduce((sum, s) => sum + (s.itemPrice * s.quantity), 0);

    container.textContent = `${total.toFixed(2)} €`;
}
