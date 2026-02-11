/**
 * modules/merch.js
 * Funciones relacionadas con merchandising
 */

/**
 * Renderiza la página principal de Merchandising (Web + Drags).
 */
function renderMerchPage() {
	const webMerchListContainer = document.getElementById('public-web-merch-list-container');
	const dragsMerchListContainer = document.getElementById('drags-merch-list-container');
	const merchDragsNavBar = document.getElementById('merch-drags-nav-bar');

	if (!webMerchListContainer || !dragsMerchListContainer) {
		console.error("Merch containers not found!");
		return;
	}

	// 1. Renderizar Web Merch
	webMerchListContainer.innerHTML = '';
	const webItems = appState?.webMerch || [];

	if (webItems.length === 0) {
		webMerchListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">Próximamente merch oficial...</p>';
	} else {
		webItems.forEach(item => {
			const card = createMerchCard(item, { id: 'web', name: 'Rodetes Web' });
			webMerchListContainer.appendChild(card);
		});
	}

	// 2. Renderizar Drags Merch
	dragsMerchListContainer.innerHTML = '';
	const dragsWithMerch = (appState?.drags || []).filter(d => d.merchItems && d.merchItems.length > 0);

	if (dragsWithMerch.length === 0) {
		dragsMerchListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">Ninguna drag tiene merch disponible aún.</p>';
	} else {
		const randomDragsWithMerch = shuffleArray(dragsWithMerch);

		if (merchDragsNavBar) merchDragsNavBar.innerHTML = '';

		randomDragsWithMerch.forEach(drag => {
			const card = document.createElement('div');
			const cardColor = drag.cardColor && /^#[0-9A-F]{6}$/i.test(drag.cardColor) ? drag.cardColor : '#FFFFFF';
			const cardScrollId = `merch-drag-card-${drag.id}`;
			card.id = cardScrollId;

			card.className = `bg-gray-900 rounded-none border overflow-hidden flex flex-col transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300`;
			card.style.borderColor = cardColor;

			if (merchDragsNavBar) {
				const navChip = document.createElement('button');
				navChip.textContent = drag.name || 'Drag';
				navChip.className = "font-pixel text-sm px-3 py-1 bg-transparent border-2 text-white transition-all duration-300 hover:text-black hover:scale-105";
				navChip.style.borderColor = cardColor;

				navChip.addEventListener('mouseenter', () => {
					navChip.style.backgroundColor = cardColor;
					navChip.style.color = '#000';
				});
				navChip.addEventListener('mouseleave', () => {
					navChip.style.backgroundColor = 'transparent';
					navChip.style.color = '#fff';
				});

				navChip.onclick = () => {
					const targetCard = document.getElementById(cardScrollId);
					if (targetCard) {
						targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
						targetCard.classList.add('ring-2', 'ring-white');
						setTimeout(() => targetCard.classList.remove('ring-2', 'ring-white'), 1500);
					}
				};
				merchDragsNavBar.appendChild(navChip);
			}

			const imageUrl = drag.coverImageUrl || `https://placehold.co/400x400/000/fff?text=${encodeURIComponent(drag.name || 'Drag')}&font=vt323`;
			const merchItems = drag.merchItems || [];

			let merchCarouselHtml = '';
			if (merchItems.length > 0) {
				let itemsHtml = '';
				merchItems.forEach(item => {
					const itemImage = item.imageUrl || `https://placehold.co/200x200/000/fff?text=${encodeURIComponent(item.name || 'Item')}&font=vt323`;
					const price = (parseFloat(item.price) || 0).toFixed(2);
					itemsHtml += `
						<div class="merch-grid-item flex flex-col h-full relative">
							${item.badge ? `<span class="merch-badge ${item.badge}">${item.badge === 'new' ? 'NUEVO' : item.badge === 'exclusive' ? 'EXCLUSIVO' : 'LIMITADO'}</span>` : ''}
							
							<div class="aspect-square bg-black overflow-hidden flex items-center justify-center mb-2 relative">
								<img src="${itemImage}" alt="${item.name}" class="merch-image object-contain w-full h-full smooth-transition" onerror="this.src='https://placehold.co/200x200/000/fff?text=Error&font=vt323'" onload="this.parentElement.classList.add('image-loaded')">
							</div>
							
							<div class="merch-info-box bg-black/60 border-x border-b border-white/10 p-2 flex-grow backdrop-blur-sm smooth-transition">
								<p class="text-white text-xs font-pixel truncate mb-1" title="${item.name}">${item.name}</p>
								<div class="flex items-center justify-between">
									<p class="merch-price text-pink-500 font-bold text-sm">${price}€</p>
									${item.stock !== undefined ? `<span class="stock-counter ${item.stock < 5 ? 'low' : ''}"><span class="stock-dot"></span>${item.stock}</span>` : ''}
								</div>
							</div>
							
							<div class="mt-0">
								<button 
									data-item-id="${item.id}" 
									data-drag-id="${drag.id}"
									class="auto-buy-merch-btn merch-buy-btn w-full bg-white text-black text-xs font-pixel py-2 hover:bg-pink-500 hover:text-white transition-colors relative z-10">
									<span class="btn-icon">🛒</span>COMPRAR
								</button>
							</div>
						</div>`;
				});

				merchCarouselHtml = `
					<div class="mt-4 mb-2 merch-carousel-container">
						<h4 class="text-sm font-pixel text-pink-400 mb-3 border-b border-gray-800 pb-1">TIENDA OFICIAL:</h4>
						<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
							${itemsHtml}
						</div>
					</div>`;
			}

			card.innerHTML = `
				<div class="w-full bg-black border-b p-6 flex items-center gap-4" style="border-color: ${cardColor};">
					<div class="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2" style="border-color: ${cardColor};">
						<img src="${imageUrl}" alt="${drag.name || 'Drag'}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/100x100/000/fff?text=Error&font=vt323';">
					</div>
					<h3 class="text-3xl sm:text-4xl md:text-5xl font-pixel font-bold flex-grow glitch-hover" style="color: ${cardColor}; text-shadow: 0 0 10px ${cardColor}, 0 0 20px ${cardColor};">${drag.name || 'Drag'}</h3>
				</div>
				<div class="p-6 flex flex-col flex-grow">
					<div class="space-y-3 mt-auto">
						${merchCarouselHtml}
					</div>
				</div>
			`;

			dragsMerchListContainer.appendChild(card);

			card.querySelectorAll('.auto-buy-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleMerchBuyClick));
		});
	}

	if (typeof observeRevealElements === 'function') observeRevealElements();
}

/**
 * Crea un elemento tarjeta para un artículo de merch.
 */
function createMerchCard(item, dragInfo) {
	const card = document.createElement('div');
	card.className = "merch-grid-item merch-parallax flex flex-col transform transition-all duration-300 hover:scale-[1.02] mb-6 relative";

	const imageUrl = item.imageUrl || `https://placehold.co/300x300/333/ccc?text=${encodeURIComponent(item.name || 'Merch')}&font=vt323`;
	const price = (item.price || 0).toFixed(2);

	card.innerHTML = `
		${item.badge ? `<span class="merch-badge ${item.badge}">${item.badge === 'new' ? 'NUEVO' : item.badge === 'exclusive' ? 'EXCLUSIVO' : 'LIMITADO'}</span>` : ''}
		
		<div class="w-full aspect-square bg-black overflow-hidden flex items-center justify-center relative">
			<img src="${imageUrl}" alt="${item.name || 'Artículo'}" class="merch-image w-full h-full object-cover smooth-transition" onerror="this.onerror=null;this.src='https://placehold.co/300x300/333/ccc?text=Error&font=vt323';" onload="this.parentElement.classList.add('image-loaded')">
		</div>
		
		<div class="merch-info-box bg-black/60 backdrop-blur-md border-x border-b border-white/10 p-4 smooth-transition">
			<h4 class="text-xl font-pixel text-white mb-1 truncate">${item.name || 'Artículo'}</h4>
			<p class="text-xs text-gray-500 mb-2 font-pixel tracking-wider">${dragInfo.name}</p>
			<div class="flex items-center justify-between">
				<p class="merch-price text-2xl font-bold text-pink-500">${price} €</p>
				${item.stock !== undefined ? `<span class="stock-counter ${item.stock < 5 ? 'low' : ''}"><span class="stock-dot"></span>${item.stock}</span>` : ''}
			</div>
		</div>
		
		<div class="mt-0">
			<button data-item-id="${item.id}" data-drag-id="${dragInfo.id}" 
				class="w-full bg-white text-black font-pixel text-lg py-3 px-4 hover:bg-pink-500 hover:text-white transition-all merch-buy-btn shadow-lg relative z-10">
				<span class="btn-icon">🛒</span> COMPRAR
			</button>
		</div>
	`;

	const buyBtn = card.querySelector('.merch-buy-btn');
	addTrackedListener(buyBtn, 'click', handleMerchBuyClick);

	return card;
}

/**
 * Maneja el click en un botón de compra de merch.
 */
function handleMerchBuyClick(e) {
	const itemId = parseInt(e.currentTarget.dataset.itemId, 10);
	let dragId = e.currentTarget.dataset.dragId;

	if (dragId !== 'web') {
		dragId = parseInt(dragId, 10);
	}

	if (!appState) return;

	let item, drag;

	if (dragId === 'web') {
		drag = { id: 'web', name: 'Rodetes Web' };
		item = (appState.webMerch || []).find(i => i.id === itemId);
	} else {
		if (isNaN(dragId)) return;
		drag = appState.drags?.find(d => d.id === dragId);
		item = drag?.merchItems?.find(i => i.id === itemId);
	}

	if (!item) {
		showInfoModal("Error al iniciar la compra del artículo.", true);
		return;
	}

	// Mostrar modal de compra (requiere un modal en el HTML)
	const merchPurchaseModal = document.getElementById('merch-purchase-modal');
	const merchPurchaseForm = document.getElementById('merch-purchase-form');
	const merchPurchaseItemName = document.getElementById('merch-purchase-item-name');

	if (!merchPurchaseModal || !merchPurchaseForm || !merchPurchaseItemName) {
		showInfoModal("Error: Modal de compra no encontrado.", true);
		return;
	}

	merchPurchaseForm.reset();
	merchPurchaseForm['merch-quantity'].value = 1;
	merchPurchaseItemName.textContent = item.name || 'Artículo';
	merchPurchaseForm['merch-item-id'].value = item.id;
	merchPurchaseForm['merch-drag-id'].value = drag.id;

	merchPurchaseModal.classList.remove('hidden');
}

/**
 * Procesa el formulario de compra de merch.
 */
async function handleMerchPurchaseSubmit(e) {
	e.preventDefault();
	if (!appState) return;

	const formData = new FormData(e.target);
	const userName = formData.get('merch-nombre')?.trim() || '';
	const userSurname = formData.get('merch-apellidos')?.trim() || '';
	const userEmail = formData.get('merch-email')?.trim().toLowerCase() || '';
	const quantity = parseInt(formData.get('merch-quantity') || 1, 10);
	const itemId = parseInt(formData.get('merch-item-id') || 0, 10);
	let dragId = formData.get('merch-drag-id') || '';

	if (dragId !== 'web') {
		dragId = parseInt(dragId, 10);
	}

	// Validaciones
	if (!userName || !userSurname) {
		showInfoModal("POR FAVOR, INTRODUCE TU NOMBRE Y APELLIDOS.", true);
		return;
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(userEmail)) {
		showInfoModal("POR FAVOR, INTRODUCE UN EMAIL VÁLIDO.", true);
		return;
	}

	showLoading(true, "Procesando compra...");

	try {
		const saleId = await generateMerchSale(dragId === 'web' ? { id: 'web', name: 'Rodetes Web' } : appState.drags?.find(d => d.id === dragId), itemId, userName, userSurname, userEmail, quantity);
		
		showLoading(false);
		showInfoModal("¡COMPRA REALIZADA! Revisa tu email para continuar.", false, () => {
			const modal = document.getElementById('merch-purchase-modal');
			if (modal) modal.classList.add('hidden');
			e.target.reset();
		});
	} catch (error) {
		showLoading(false);
		console.error("Error procesando compra:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Genera un registro de venta de merch y envía confirmación por email.
 */
async function generateMerchSale(drag, itemId, userName, userSurname, userEmail, quantity) {
	let item;

	if (drag.id === 'web') {
		item = (appState?.webMerch || []).find(i => i.id === itemId);
	} else {
		item = drag.merchItems?.find(i => i.id === itemId);
	}

	if (!item) throw new Error("Artículo no encontrado");

	const saleId = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const fullName = `${userName} ${userSurname}`;
	const totalPrice = (parseFloat(item.price) || 0) * quantity;

	const merch_sale = {
		id: saleId,
		dragId: drag.id,
		itemId,
		itemName: item.name,
		quantity,
		price: parseFloat(item.price) || 0,
		totalPrice,
		userName,
		userSurname,
		userEmail,
		purchaseDate: new Date().toISOString(),
		status: 'Pending'
	};

	allMerchSales.push(merch_sale);

	const saveResult = await saveMerchSalesState();
	if (!saveResult.ok) {
		allMerchSales.pop();
		throw new Error("Error al guardar venta");
	}

	// Enviar email de confirmación
	try {
		await fetch('email/send_email.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'merch_purchase',
				saleId,
				dragName: drag.name,
				itemName: item.name,
				quantity,
				totalPrice,
				userName: fullName,
				userEmail
			})
		});
	} catch (e) {
		console.error("Error enviando email de merch:", e);
	}

	return saleId;
}

/**
 * Muestra el modal final con el QR del pedido de merch.
 */
function showMerchQrModal(drag, item, sale, fullName) {
	const merchQrModal = document.getElementById('merchQrModal');
	const merchQrCode = document.getElementById('merchQrCode');
	const downloadMerchQrBtn = document.getElementById('downloadMerchQrBtn');
	const merchHolderName = document.getElementById('merchHolderName');
	const merchQrLogoImg = document.getElementById('merchQrLogoImg');
	const merchQrDragName = document.getElementById('merchQrDragName');
	const merchQrItemName = document.getElementById('merchQrItemName');
	const merchQrQuantity = document.getElementById('merchQrQuantity');

	if (!drag || !item || !sale || !fullName || !merchQrModal || !merchQrCode || !downloadMerchQrBtn || !merchHolderName) {
		console.error("Faltan elementos o datos para mostrar el modal QR de Merch");
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al mostrar el QR del pedido.", true);
		}
		return;
	}

	try {
		// Usar el logo de las entradas (ticketLogoUrl) si existe
		if (merchQrLogoImg) {
			const logoUrl = appState.ticketLogoUrl || '';
			merchQrLogoImg.src = logoUrl;
			merchQrLogoImg.onerror = () => { merchQrLogoImg.classList.add('hidden'); };
			merchQrLogoImg.classList.toggle('hidden', !logoUrl);
		}

		// Mostrar nombre completo
		merchHolderName.textContent = fullName;
		if (merchQrDragName) merchQrDragName.textContent = `Merch de ${drag.name || 'Drag'}`;
		if (merchQrItemName) merchQrItemName.textContent = item.name || 'Artículo';
		if (merchQrQuantity) merchQrQuantity.textContent = `Cantidad: ${sale.quantity}`;

		// Limpiar QR anterior y generar nuevo
		merchQrCode.innerHTML = '';
		const qrText = `MERCH_SALE_ID:${sale.saleId}\nNOMBRE:${fullName}\nDRAG:${drag.name}\nITEM:${item.name}\nQTY:${sale.quantity}\nEMAIL:${sale.email}`;

		if (typeof QRCode !== 'undefined') {
			new QRCode(merchQrCode, {
				text: qrText,
				width: 200, height: 200,
				colorDark: "#000000", colorLight: "#ffffff",
				correctLevel: QRCode.CorrectLevel.M
			});
		} else {
			merchQrCode.innerHTML = '<p class="text-red-500 font-pixel">Error: QR no cargado</p>';
		}

		// Guardar datos en el botón de descarga
		downloadMerchQrBtn.dataset.dragName = drag.name || 'drag';
		downloadMerchQrBtn.dataset.itemName = item.name || 'item';
		downloadMerchQrBtn.dataset.saleId = sale.saleId;
		downloadMerchQrBtn.dataset.holderName = fullName.replace(/\s+/g, '_');

		merchQrModal.classList.remove('hidden');

	} catch (error) {
		console.error("Error displaying merch QR modal:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al mostrar el QR del pedido.", true);
		}
	}
}

/**
 * Descarga el QR del pedido de merch como PNG.
 */
async function handleDownloadMerchQr() {
	const merchQrToDownload = document.getElementById('merchQrToDownload');
	const downloadMerchQrBtn = document.getElementById('downloadMerchQrBtn');

	if (!merchQrToDownload || typeof html2canvas === 'undefined' || !downloadMerchQrBtn) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: No se pudo iniciar la descarga (faltan elementos).", true);
		}
		return;
	}

	const dragName = downloadMerchQrBtn.dataset.dragName || 'drag';
	const itemName = downloadMerchQrBtn.dataset.itemName || 'item';
	const holderName = downloadMerchQrBtn.dataset.holderName || 'comprador';
	const saleIdShort = (downloadMerchQrBtn.dataset.saleId || crypto.randomUUID()).substring(0, 8);

	if (typeof showLoading === 'function') showLoading(true);
	try {
		const canvas = await html2canvas(merchQrToDownload, { scale: 2, backgroundColor: "#000000" });
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

		if (typeof showInfoModal === 'function') {
			showInfoModal("PEDIDO DESCARGADO (PNG).<br>¡Pásaselo por Instagram a la drag!", false);
		}

	} catch (error) {
		console.error("Error downloading merch QR image:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al descargar la imagen del pedido.", true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Renderiza la lista de ventas de merch para una drag específica (o 'web')
 */
function renderMerchSalesListForDrag(dragId) {
	const merchSalesListContent = document.getElementById('merchSalesListContent');
	if (!merchSalesListContent) return;

	if (typeof clearDynamicListListeners === 'function') {
		clearDynamicListListeners('merchSalesListForDrag');
	}
	merchSalesListContent.innerHTML = '';

	const salesForDrag = (allMerchSales || [])
		.filter(s => s.dragId === dragId || (dragId === 'web' && s.dragId === 'web'))
		.sort((a, b) => (b.saleDate && a.saleDate) ? new Date(b.saleDate) - new Date(a.saleDate) : 0);

	if (salesForDrag.length === 0) {
		merchSalesListContent.innerHTML = '<p class="text-gray-400 text-center font-pixel">NO HAY PEDIDOS REGISTRADOS.</p>';
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
				? `<div class="flex flex-col sm:flex-row gap-2">
					<button data-sale-id="${sale.saleId}" class="mark-merch-delivered-btn bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-none text-sm font-pixel">MARCAR ENTREGADO</button>
					<button data-sale-id="${sale.saleId}" class="delete-merch-order-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-none text-sm font-pixel">BORRAR</button>
				   </div>`
				: `<div class="flex flex-col sm:flex-row gap-2 items-center">
					<span class="text-gray-500 px-3 py-1 text-sm font-pixel">CONFIRMADO</span>
					<button data-sale-id="${sale.saleId}" class="delete-merch-order-btn bg-red-900 hover:bg-red-700 text-white px-3 py-1 rounded-none text-sm font-pixel text-xs">BORRAR</button>
				   </div>`;

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
	merchSalesListContent.innerHTML = listHtml;

	// Añadir listeners
	if (typeof addTrackedListener === 'function') {
		merchSalesListContent.querySelectorAll('.mark-merch-delivered-btn').forEach(btn => {
			addTrackedListener(btn, 'click', handleMarkMerchDeliveredFromList);
		});
		merchSalesListContent.querySelectorAll('.delete-merch-order-btn').forEach(btn => {
			addTrackedListener(btn, 'click', handleDeleteMerchOrder);
		});
	}
}

/**
 * Marca un pedido de merch como entregado desde la lista
 */
async function handleMarkMerchDeliveredFromList(e) {
	const saleId = e.currentTarget.dataset.saleId;
	if (!saleId || !allMerchSales) return;

	const saleIndex = allMerchSales.findIndex(s => s.saleId === saleId);
	if (saleIndex === -1) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Pedido no encontrado.", true);
		}
		return;
	}
	if (allMerchSales[saleIndex].status === 'Delivered') {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Este pedido ya está marcado como entregado.", false);
		}
		return;
	}

	if (typeof showLoading === 'function') showLoading(true);
	try {
		allMerchSales[saleIndex].status = 'Delivered';
		if (typeof saveMerchSalesState === 'function') {
			await saveMerchSalesState();
		}

		// Re-renderizar la lista actual y los resúmenes
		const dragId = allMerchSales[saleIndex].dragId;
		renderMerchSalesListForDrag(dragId);

		if (dragId === 'web') {
			if (typeof renderWebMerchSalesSummary === 'function') {
				renderWebMerchSalesSummary();
			}
		} else {
			if (typeof renderDragMerchSalesSummary === 'function') {
				renderDragMerchSalesSummary();
			}
		}

		if (typeof showInfoModal === 'function') {
			showInfoModal(`¡PEDIDO ${saleId.substring(0, 8)} CONFIRMADO COMO ENTREGADO!`, false);
		}
	} catch (error) {
		console.error("Error marking merch delivered:", error);
		allMerchSales[saleIndex].status = 'Pending'; // Revertir
		renderMerchSalesListForDrag(allMerchSales[saleIndex].dragId);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al confirmar la entrega: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Elimina un pedido de merch (por error o cancelación)
 */
async function handleDeleteMerchOrder(e) {
	const saleId = e.currentTarget.dataset.saleId;
	if (!saleId || !allMerchSales) return;

	if (!confirm("¿Seguro que quieres ELIMINAR este pedido permanentemente? Esta acción es irreversible.")) {
		return;
	}

	const saleIndex = allMerchSales.findIndex(s => s.saleId === saleId);
	if (saleIndex === -1) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Pedido no encontrado.", true);
		}
		return;
	}

	if (typeof showLoading === 'function') showLoading(true);
	try {
		const dragId = allMerchSales[saleIndex].dragId;
		
		// Eliminar del array
		allMerchSales.splice(saleIndex, 1);
		if (typeof saveMerchSalesState === 'function') {
			await saveMerchSalesState();
		}

		// Re-renderizar
		renderMerchSalesListForDrag(dragId);
		
		if (dragId === 'web') {
			if (typeof renderWebMerchSalesSummary === 'function') {
				renderWebMerchSalesSummary();
			}
		} else {
			if (typeof renderDragMerchSalesSummary === 'function') {
				renderDragMerchSalesSummary();
			}
		}

		if (typeof showInfoModal === 'function') {
			showInfoModal("Pedido eliminado correctamente.", false);
		}
	} catch (err) {
		console.error("Error eliminando pedido:", err);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al eliminar el pedido.", true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}


