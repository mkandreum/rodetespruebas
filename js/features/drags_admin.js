
import { store } from '../store.js';
import { clearDynamicListListeners, addTrackedListener, showInfoModal, showLoading } from '../ui.js';
import { saveAppState } from '../api.js';
import { renderDragList } from './drags.js';
import { renderAdminMerch } from './merch_admin.js';

export function renderAdminDrags(drags) {
    const ul = document.getElementById('admin-drags-list-ul');
    if (!ul) return;

    clearDynamicListListeners('adminDrags');
    ul.innerHTML = '';

    if (!drags || drags.length === 0) {
        ul.innerHTML = '<li class="text-gray-400 text-center">NO HAY DRAGS.</li>';
        return;
    }

    drags.forEach(drag => {
        const li = document.createElement('li');
        li.className = "bg-gray-800 p-4 border border-gray-500 flex justify-between items-center";
        li.innerHTML = `
            <div>
                <span class="text-white font-pixel text-xl">${drag.name}</span>
                <span class="text-gray-400 italic">(@${drag.instagramHandle})</span>
            </div>
            <div>
                <button data-drag-id="${drag.id}" class="edit-drag-btn bg-blue-600 text-white px-3 py-1 font-pixel text-sm">EDITAR</button>
                <button data-drag-id="${drag.id}" class="delete-drag-btn bg-red-600 text-white px-3 py-1 font-pixel text-sm">ELIMINAR</button>
            </div>
        `;
        ul.appendChild(li);
    });

    ul.querySelectorAll('.edit-drag-btn').forEach(btn => addTrackedListener(btn, 'click', handleEditDrag));
    ul.querySelectorAll('.delete-drag-btn').forEach(btn => addTrackedListener(btn, 'click', handleDeleteDrag));
}

export async function handleSaveDrag(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const idToSave = store.editingDragId;
    const name = formData.get('drag-name');
    const insta = formData.get('drag-instagram');

    if (!name) { showInfoModal("Nombre obligatorio", true); return; }

    showLoading(true);
    try {
        if (idToSave !== null) {
            const idx = store.appState.drags.findIndex(d => d.id === idToSave);
            if (idx > -1) {
                store.appState.drags[idx] = { ...store.appState.drags[idx], name, instagramHandle: insta };
            }
        } else {
            store.appState.drags.push({
                id: store.appState.nextDragId++,
                name, instagramHandle: insta,
                merchItems: [], galleryImages: []
            });
        }
        await saveAppState();
        resetDragForm();
        renderAdminDrags(store.appState.drags);
        renderDragList(); // public update
        renderAdminMerch(); // merch dropdown update
        showInfoModal("Drag guardada", false);
    } catch (e) { showInfoModal("Error", true); }
    finally { showLoading(false); }
}

export function resetDragForm() {
    document.getElementById('add-drag-form')?.reset();
    store.editingDragId = null;
}

function handleEditDrag(e) {
    const id = parseInt(e.target.dataset.dragId);
    const drag = store.appState.drags.find(d => d.id === id);
    if (drag) {
        store.editingDragId = id;
        const form = document.getElementById('add-drag-form');
        form['drag-name'].value = drag.name;
        form['drag-instagram'].value = drag.instagramHandle;
    }
}

async function handleDeleteDrag(e) {
    const id = parseInt(e.target.dataset.dragId);
    store.appState.drags = store.appState.drags.filter(d => d.id !== id);
    // Also remove merch sales? Logic in app.js says yes.
    store.allMerchSales = store.allMerchSales.filter(s => s.dragId !== id);

    await saveAppState(); // and saveMerchSalesState ideally
    renderAdminDrags(store.appState.drags);
    renderDragList();
    renderAdminMerch();
}
