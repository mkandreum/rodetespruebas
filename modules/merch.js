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


