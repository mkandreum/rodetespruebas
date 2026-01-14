// === Merch Public Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState, allMerchSales, isLoggedIn } from '../../core/state.js'; // isLoggedIn used for updating admin summary
import { saveMerchSalesState } from '../../api/merch-api.js';
import { showInfoModal, showLoading, closeModal } from '../../ui/modals.js';
import { clearDynamicListListeners, addTrackedListener } from '../../ui/event-listeners.js';
import { renderAdminMerchSalesSummary } from '../merch/merch-admin.js'; // Circular dep avoided if implemented carefully?
// renderAdminMerchSalesSummary is in admin module. Import it? If circular, maybe move summary logic to shared or check imports.
// renderAdminMerchSalesSummary is not exported yet. I need to implement merch-admin.js next. 
// I will import it, but run it inside a try-catch or check if available to avoid init crashes if possible.
// Actually, circular dependencies are fine in ESM functions if not called at top level.

import { showPage } from '../../ui/navigation.js';

let renderAdminMerchSalesSummaryRef = null;
export function setRenderAdminMerchSalesSummaryRef(fn) { renderAdminMerchSalesSummaryRef = fn; }


/**
 * Render Main Merch Page
 */
export function renderMerchPage() {
    if (!domRefs.webMerchListContainer || !domRefs.dragsMerchListContainer) return;

    // 1. Web Merch
    domRefs.webMerchListContainer.innerHTML = '';
    const webItems = appState.webMerch || [];

    if (webItems.length === 0) {
        domRefs.webMerchListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">PRÓXIMAMENTE WEB MERCH.</p>';
    } else {
        webItems.forEach(item => {
            domRefs.webMerchListContainer.appendChild(createMerchCard(item, 'web'));
        });
    }

    // 2. Drags Merch
    domRefs.dragsMerchListContainer.innerHTML = '';
    const dragsWithMerch = (appState.drags || []).filter(d => d.merchItems && d.merchItems.length > 0);

    if (dragsWithMerch.length === 0) {
        domRefs.dragsMerchListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY MERCH DE DRAGS DISPONIBLE AÚN.</p>';
    } else {
        dragsWithMerch.forEach(drag => {
            // Container for this drag's merch
            const dragSection = document.createElement('div');
            dragSection.className = "mb-12";
            dragSection.id = `drag-merch-section-${drag.id}`; // Anchor for scrolling

            const dragHeader = document.createElement('div');
            dragHeader.className = "flex items-center gap-4 mb-6 border-b border-gray-700 pb-2";
            dragHeader.innerHTML = `
				<h3 class="text-3xl font-pixel text-white text-glow-pink">${drag.name}</h3>
				<span class="text-gray-400 font-pixel text-sm">(${drag.merchItems.length} artículos)</span>
			`;
            dragSection.appendChild(dragHeader);

            const grid = document.createElement('div');
            grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";

            drag.merchItems.forEach(item => {
                grid.appendChild(createMerchCard(item, drag.id));
            });

            dragSection.appendChild(grid);
            domRefs.dragsMerchListContainer.appendChild(dragSection);
        });
    }

    // Re-attach listeners is handled inside createMerchCard via addTrackedListener? 
    // Actually better to do it here for bulk or attach individually in createMerchCard.
    // I'll attach individually in createMerchCard helper.
}

/**
 * Create a Merch Card Element
 */
function createMerchCard(item, dragId) {
    const card = document.createElement('div');
    card.className = "bg-gray-900 border border-gray-700 hover:border-pink-500 transition-all duration-300 flex flex-col group overflow-hidden";

    const imageUrl = item.imageUrl || 'https://placehold.co/400x400/000/fff?text=Merch&font=vt323';
    const priceRef = item.price || 0;
    const isWeb = dragId === 'web';

    card.innerHTML = `
		<div class="relative overflow-hidden aspect-square border-b border-gray-800">
			<img src="${imageUrl}" alt="${item.name}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" loading="lazy">
			<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
				<p class="text-white font-pixel text-sm truncate">${item.description || 'Sin descripción'}</p>
			</div>
		</div>
		<div class="p-4 flex flex-col flex-grow">
			<div class="flex justify-between items-start mb-2">
				<h4 class="text-xl font-pixel text-white truncate w-2/3" title="${item.name}">${item.name}</h4>
				<span class="text-xl font-bold text-neon-blue">${priceRef.toFixed(2)}€</span>
			</div>
			<button class="merch-buy-btn mt-auto w-full bg-pink-600 text-white font-pixel text-lg py-2 rounded-none hover:bg-pink-500 transition-colors border-2 border-transparent hover:border-white shadow-[0_0_10px_rgba(236,72,153,0.5)]">
				COMPRAR
			</button>
		</div>
	`;

    const buyBtn = card.querySelector('.merch-buy-btn');
    addTrackedListener(buyBtn, 'click', () => openMerchModal(item, dragId));

    return card;
}

/**
 * Handle "Ver Merch" button click from Drag List
 */
export function handleShowMerch(e) {
    const dragId = parseInt(e.currentTarget.dataset.dragId, 10);
    showPage('merch');

    if (!isNaN(dragId)) {
        setTimeout(() => {
            const section = document.getElementById(`drag-merch-section-${dragId}`);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                section.classList.add('animate-pulse'); // Highlight
                setTimeout(() => section.classList.remove('animate-pulse'), 2000);
            }
        }, 100);
    }
}

/**
 * Open Merch Purchase Modal
 */
function openMerchModal(item, dragId) {
    if (!domRefs.merchPurchaseModal || !domRefs.merchPurchaseForm) return;

    // Populate basic info
    const modalTitle = domRefs.merchPurchaseModal.querySelector('h2');
    if (modalTitle) modalTitle.textContent = `COMPRAR: ${item.name}`;

    // Set hidden inputs
    domRefs.merchPurchaseForm['merch-item-id'].value = item.id;
    domRefs.merchPurchaseForm['merch-drag-id'].value = dragId;

    // Reset inputs
    domRefs.merchPurchaseForm['user-name'].value = '';
    domRefs.merchPurchaseForm['user-surname'].value = '';
    domRefs.merchPurchaseForm['user-email'].value = '';
    domRefs.merchPurchaseForm['quantity'].value = 1;

    domRefs.merchPurchaseModal.classList.remove('hidden');
}


// Attach global listeners for modal forms (needs to be done once, probably in init.js or here if we check existence)
// But since this module handles merch public logic, I'll export the handler and attach it in initial setup or run it here if DOM is ready.
// I'll attach it to the form directly if I can resolve the reference.

/**
 * Handle Purchase Form Submit
 */
export async function handleMerchPurchase(e) {
    e.preventDefault();
    if (!domRefs.merchPurchaseForm) return;

    const formData = new FormData(domRefs.merchPurchaseForm);
    const userName = formData.get('user-name')?.trim();
    const userSurname = formData.get('user-surname')?.trim();
    const userEmail = formData.get('user-email')?.trim();
    const quantity = parseInt(formData.get('quantity'), 10);
    const itemId = parseInt(formData.get('merch-item-id'), 10);
    const dragIdVal = formData.get('merch-drag-id');
    const dragId = dragIdVal === 'web' ? 'web' : parseInt(dragIdVal, 10);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userName || !userSurname) {
        showInfoModal("POR FAVOR, INTRODUCE TU NOMBRE Y APELLIDOS.", true); return;
    }
    if (!userEmail || !emailRegex.test(userEmail)) {
        showInfoModal("POR FAVOR, INTRODUCE UN EMAIL VÁLIDO.", true); return;
    }

    const allowedDomains = appState.allowedDomains || [];
    const isDomainAllowed = allowedDomains.length === 0 || allowedDomains.some(domain => userEmail.endsWith(domain));
    if (!isDomainAllowed) {
        showInfoModal("Dominio de correo no permitido.", true); return;
    }
    if (isNaN(quantity) || quantity <= 0) {
        showInfoModal("POR FAVOR, INTRODUCE UNA CANTIDAD MAYOR QUE CERO.", true); return;
    }

    // Find item
    let item = null;
    let dragName = 'Rodetes Web';

    if (dragId === 'web') {
        item = appState.webMerch?.find(i => i.id === itemId);
        dragName = 'Rodetes Web';
    } else {
        const drag = appState.drags?.find(d => d.id === dragId);
        item = drag?.merchItems?.find(i => i.id === itemId);
        dragName = drag?.name || 'Drag';
    }

    if (!item) {
        showInfoModal("Error: Artículo no encontrado.", true); return;
    }

    closeModal('merch-purchase-modal');
    await generateMerchSale(dragId, dragName, item, userName, userSurname, userEmail, quantity);
}

/**
 * Generate Sale Record
 */
async function generateMerchSale(dragId, dragName, item, userName, userSurname, userEmail, quantity) {
    showLoading(true);
    try {
        const saleId = crypto.randomUUID();
        const saleDate = new Date().toISOString();
        const fullName = `${userName} ${userSurname}`;

        const newSale = {
            saleId: saleId,
            dragId: dragId,
            dragName: dragName,
            itemId: item.id,
            itemName: item.name || 'Artículo desconocido',
            itemPrice: item.price || 0,
            quantity: quantity,
            nombre: userName,
            apellidos: userSurname,
            email: userEmail,
            saleDate: saleDate,
            status: 'Pending'
        };

        if (!Array.isArray(allMerchSales)) {
            // This should come from state import, but if it is readonly...
            // In state.js I exported allMerchSales as let, but imported as const usually.
            // I need access to modify it or a setter.
            // I imported 'allMerchSales' but I cannot reassign it if I imported it. 
            // Wait, in JS ESM, imports are live bindings. But I cannot reassign the variable.
            // I need to use the setter 'setAllMerchSales' or modify array content (push).
            // allMerchSales.push IS allowed.
        }

        allMerchSales.push(newSale);
        await saveMerchSalesState();

        showMerchQrModal(dragName, item, newSale, fullName);

        // Update Admin Summary if function ref is available
        if (renderAdminMerchSalesSummaryRef) {
            try { renderAdminMerchSalesSummaryRef(); } catch (e) { }
        }

    } catch (error) {
        console.error("Error generating merch sale:", error);
        showInfoModal("Error al generar el pedido. Inténtalo de nuevo.", true);
    } finally {
        showLoading(false);
    }
}


/**
 * Show QR Modal
 */
function showMerchQrModal(dragName, item, sale, fullName) {
    if (!domRefs.merchQrModal || !domRefs.merchQrCode) return;

    if (domRefs.merchQrLogoImg) {
        domRefs.merchQrLogoImg.src = appState.ticketLogoUrl || '';
        domRefs.merchQrLogoImg.classList.toggle('hidden', !appState.ticketLogoUrl);
    }

    if (domRefs.merchHolderName) domRefs.merchHolderName.textContent = fullName;
    if (domRefs.merchQrDragName) domRefs.merchQrDragName.textContent = `Merch de ${dragName}`;
    if (domRefs.merchQrItemName) domRefs.merchQrItemName.textContent = item.name;
    if (domRefs.merchQrQuantity) domRefs.merchQrQuantity.textContent = `Cantidad: ${sale.quantity}`;

    domRefs.merchQrCode.innerHTML = '';
    const qrText = `MERCH_SALE_ID:${sale.saleId}\nNOMBRE:${fullName}\nDRAG:${dragName}\nITEM:${item.name}\nQTY:${sale.quantity}\nEMAIL:${sale.email}`;

    if (typeof QRCode !== 'undefined') {
        new QRCode(domRefs.merchQrCode, {
            text: qrText,
            width: 200, height: 200,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    } else {
        domRefs.merchQrCode.innerHTML = '<p class="text-red-500 font-pixel">Error: QR no cargado</p>';
    }

    if (domRefs.downloadMerchQrBtn) {
        domRefs.downloadMerchQrBtn.dataset.dragName = dragName;
        domRefs.downloadMerchQrBtn.dataset.itemName = item.name;
        domRefs.downloadMerchQrBtn.dataset.saleId = sale.saleId;
        domRefs.downloadMerchQrBtn.dataset.holderName = fullName.replace(/\s+/g, '_');
    }

    domRefs.merchQrModal.classList.remove('hidden');
}

/**
 * Handle Download QR
 */
export async function handleDownloadMerchQr() {
    if (!domRefs.merchQrToDownload || typeof html2canvas === 'undefined' || !domRefs.downloadMerchQrBtn) {
        showInfoModal("Error: No se pudo iniciar la descarga.", true); return;
    }

    const dragName = domRefs.downloadMerchQrBtn.dataset.dragName || 'drag';
    const itemName = domRefs.downloadMerchQrBtn.dataset.itemName || 'item';
    const holderName = domRefs.downloadMerchQrBtn.dataset.holderName || 'comprador';
    const saleIdShort = (domRefs.downloadMerchQrBtn.dataset.saleId || crypto.randomUUID()).substring(0, 8);

    showLoading(true);
    try {
        const canvas = await html2canvas(domRefs.merchQrToDownload, { scale: 2, backgroundColor: "#000000" });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;

        const safeDragName = dragName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeItemName = itemName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeHolderName = holderName.replace(/[^a-z0-9_]/gi, '').toLowerCase();

        link.download = `pedido_merch_${safeHolderName}_${safeDragName}_${safeItemName}_${saleIdShort}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showLoading(false);
        showInfoModal("PEDIDO DESCARGADO (PNG).<br>¡Pásaselo por Instagram a la drag!", false);

    } catch (error) {
        console.error("Error downloading merch QR image:", error);
        showLoading(false);
        showInfoModal("Error al descargar la imagen del pedido.", true);
    }
}
