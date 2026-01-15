
import { store } from '/js/store.js';
import { clearDynamicListListeners, addTrackedListener, showInfoModal, showLoading, closeModal } from '/js/ui.js';
import { saveMerchSalesState } from '/js/api.js';

export function renderMerchPage() {
    console.log("Rendering Merch Page...");
    const webContainer = document.getElementById('web-merch-list-container');
    const dragContainer = document.getElementById('drags-merch-list-container');

    // --- Web Merch ---
    if (webContainer) {
        webContainer.innerHTML = '';
        const webItems = store.appState.webMerch || [];
        if (webItems.length === 0) {
            webContainer.innerHTML = '<p class="text-gray-400 font-pixel text-center col-span-full">Próximamente...</p>';
        } else {
            webItems.forEach(item => {
                const card = createMerchCard(item, { id: 'web', name: 'Rodetes Oficial' });
                webContainer.appendChild(card);
            });
        }
    }

    // --- Drags Merch (List of Drags) ---
    if (dragContainer) {
        clearDynamicListListeners('merchDragList'); // Ensure we have a type for this
        dragContainer.innerHTML = '';
        const drags = store.appState.drags || [];
        const dragsWithMerch = drags.filter(d => d.merchItems && d.merchItems.length > 0);

        if (dragsWithMerch.length === 0) {
            dragContainer.innerHTML = '<p class="text-gray-400 font-pixel text-center col-span-full">Aún no hay merch de Drags.</p>';
        } else {
            dragsWithMerch.forEach(drag => {
                const card = document.createElement('div');
                card.className = "bg-gray-800 border border-white p-4 flex flex-col hover:scale-[1.02] transition-transform";
                card.innerHTML = `
                    <div class="aspect-[3/4] bg-black mb-4 border border-gray-600 overflow-hidden relative group">
                        <img src="${drag.coverImageUrl || 'https://placehold.co/300x400?text=Drag'}" class="w-full h-full object-cover">
                    </div>
                    <h3 class="text-2xl font-pixel text-white mb-2 truncate text-glow-white">${drag.name}</h3>
                    <button data-drag-id="${drag.id}" class="merch-view-drag-btn mt-auto w-full border-2 border-white text-white font-pixel py-2 px-4 hover:bg-white hover:text-black">VER MERCH</button>
                `;
                dragContainer.appendChild(card);
            });

            dragContainer.querySelectorAll('.merch-view-drag-btn').forEach(btn =>
                addTrackedListener(btn, 'click', handleShowDragMerchModal)
            );
        }
    }
}

function createMerchCard(item, contextInfo) {
    const card = document.createElement('div');
    card.className = "bg-gray-800 border border-white p-4 flex flex-col hover:scale-[1.02] transition-transform";
    card.innerHTML = `
        <div class="w-full h-48 bg-black flex items-center justify-center mb-4 border border-gray-600 overflow-hidden">
            <img src="${item.imageUrl || ''}" class="w-full h-full object-contain" onerror="this.src='https://placehold.co/300x300?text=Merch'">
        </div>
        <h4 class="text-xl font-pixel text-white mb-1 truncate">${item.name}</h4>
        <p class="text-sm text-gray-400 mb-2 font-pixel">${contextInfo.name}</p>
        <p class="text-2xl font-bold text-white mb-4">${item.price.toFixed(2)} €</p>
        <button data-item-id="${item.id}" data-drag-id="${contextInfo.id}" class="merch-buy-btn mt-auto bg-white text-black font-pixel text-lg py-2 px-4 border border-gray-400 hover:bg-gray-300">COMPRAR</button>
    `;
    // Listeners must be attached after appending, or we attach to the element directly before returning
    const btn = card.querySelector('.merch-buy-btn');
    addTrackedListener(btn, 'click', handleMerchBuyClick);
    return card;
}

function handleShowDragMerchModal(e) {
    const dragId = parseInt(e.target.dataset.dragId);
    const drag = store.appState.drags.find(d => d.id === dragId);
    if (!drag) return;

    const modal = document.getElementById('merch-gallery-modal');
    const title = document.getElementById('merch-gallery-title');
    const content = document.getElementById('merch-gallery-content');

    title.textContent = `Merchandising de ${drag.name}`;
    content.innerHTML = '';

    drag.merchItems.forEach(item => {
        const card = createMerchCard(item, drag);
        content.appendChild(card);
    });

    modal.classList.remove('hidden');
}

function handleMerchBuyClick(e) {
    const itemId = parseInt(e.target.dataset.itemId);
    const dragId = e.target.dataset.dragId === 'web' ? 'web' : parseInt(e.target.dataset.dragId);

    let item, dragName;
    if (dragId === 'web') {
        item = store.appState.webMerch.find(i => i.id === itemId);
        dragName = "Rodetes Oficial";
    } else {
        const drag = store.appState.drags.find(d => d.id === dragId);
        item = drag?.merchItems.find(i => i.id === itemId);
        dragName = drag?.name;
    }

    if (!item) return;

    const form = document.getElementById('merch-purchase-form');
    form.reset();
    form['merch-item-id'].value = itemId;
    form['merch-drag-id'].value = dragId;
    document.getElementById('merch-purchase-item-name').textContent = item.name;

    document.getElementById('merch-purchase-modal').classList.remove('hidden');
}

export async function handleMerchPurchaseSubmit(e) {
    e.preventDefault();
    const form = e.target;
    // ... validate inputs (name, email, qty) ...
    const name = form['merch-nombre'].value;
    const surname = form['merch-apellidos'].value;
    const email = form['merch-email'].value;
    const qty = parseInt(form['merch-quantity'].value);
    const itemId = parseInt(form['merch-item-id'].value);
    const dragIdRaw = form['merch-drag-id'].value;
    const dragId = dragIdRaw === 'web' ? 'web' : parseInt(dragIdRaw);

    if (!name || !email || qty < 1) { showInfoModal("Datos inválidos", true); return; }

    // Find Item info for snapshot
    let item, dragName;
    if (dragId === 'web') {
        item = store.appState.webMerch.find(i => i.id === itemId);
        dragName = "Rodetes Oficial";
    } else {
        const drag = store.appState.drags.find(d => d.id === dragId);
        item = drag?.merchItems.find(i => i.id === itemId);
        dragName = drag?.name;
    }

    const saleId = crypto.randomUUID();
    const fullName = `${name} ${surname}`;

    const newSale = {
        saleId,
        dragId, dragName,
        itemId, itemName: item.name, itemPrice: item.price,
        quantity: qty,
        nombre: name, apellidos: surname, email,
        saleDate: new Date().toISOString(),
        status: 'Pending'
    };

    if (!store.allMerchSales) store.allMerchSales = [];
    store.allMerchSales.push(newSale);

    await saveMerchSalesState();
    closeModal('merch-purchase-modal');

    showMerchQrModal(newSale);
}

function showMerchQrModal(sale) {
    const modal = document.getElementById('merch-qr-modal');
    const qrCodeDiv = document.getElementById('merch-qr-code');
    const downloadBtn = document.getElementById('download-merch-qr-btn');

    document.getElementById('merch-holder-name').textContent = `${sale.nombre} ${sale.apellidos}`;
    document.getElementById('merch-qr-drag-name').textContent = sale.dragName;
    document.getElementById('merch-qr-item-name').textContent = sale.itemName;
    document.getElementById('merch-qr-quantity').textContent = `Cantidad: ${sale.quantity}`;

    qrCodeDiv.innerHTML = '';
    const qrText = `MERCH_SALE_ID:${sale.saleId}\nNOMBRE:${sale.nombre} ${sale.apellidos}\nDRAG:${sale.dragName}\nITEM:${sale.itemName}\nQTY:${sale.quantity}\nEMAIL:${sale.email}`;

    // @ts-ignore
    if (typeof QRCode !== 'undefined') new QRCode(qrCodeDiv, { text: qrText, width: 200, height: 200 });

    downloadBtn.dataset.saleId = sale.saleId;
    downloadBtn.dataset.holderName = `${sale.nombre}_${sale.apellidos}`;

    modal.classList.remove('hidden');
}
// handleDownloadMerchQr logic is in app.js and wired in main.js
