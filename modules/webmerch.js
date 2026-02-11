/**
 * modules/webmerch.js
 * Web Merch and Drag Merch management
 */

// Global variables needed (defined in app.js)
let editingWebMerchId = null;
let editingDragMerchId = null;
let currentSelectedDragForMerch = null;

// ===== WEB MERCH FUNCTIONS =====

/**
 * Muestra el formulario de Web Merch
 */
function showWebMerchForm() {
	const webMerchForm = document.getElementById('webMerchForm');
	if (!webMerchForm) return;
	webMerchForm.classList.remove('hidden');
	resetWebMerchForm();
}

/**
 * Oculta y resetea el formulario de Web Merch
 */
function hideWebMerchForm() {
	const webMerchForm = document.getElementById('webMerchForm');
	if (!webMerchForm) return;
	webMerchForm.classList.add('hidden');
	resetWebMerchForm();
}

/**
 * Resetea el formulario de Web Merch
 */
function resetWebMerchForm() {
	const webMerchForm = document.getElementById('webMerchForm');
	if (!webMerchForm) return;
	webMerchForm.reset();
	editingWebMerchId = null;
	const editIdInput = document.getElementById('edit-web-merch-id');
	if (editIdInput) editIdInput.value = '';
	const uploadInput = document.getElementById('webMerchImageUploadInput');
	if (uploadInput) uploadInput.value = '';
}

/**
 * Renderiza la lista de Web Merch en el admin
 */
function renderWebMerchList() {
	const webMerchListContainer = document.getElementById('webMerchListContainer');
	if (!webMerchListContainer || !appState || !appState.webMerch) return;
	
	if (typeof clearDynamicListListeners === 'function') {
		clearDynamicListListeners('webMerchList');
	}
	
	webMerchListContainer.innerHTML = '';

	const webMerchItems = appState.webMerch || [];

	if (webMerchItems.length === 0) {
		webMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">No hay artículos de Web Merch.</li>';
		return;
	}

	webMerchItems.forEach(item => {
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
					<button data-web-merch-id="${item.id}" class="edit-web-merch-btn bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-none text-sm font-pixel">EDITAR</button>
					<button data-web-merch-id="${item.id}" class="delete-web-merch-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-none text-sm font-pixel">ELIMINAR</button>
				</div>
			`;
			webMerchListContainer.appendChild(li);
		} catch (e) {
			console.error(`Error renderizando Web Merch item ${item?.id}:`, e);
		}
	});

	// Añadir listeners
	if (typeof addTrackedListener === 'function') {
		webMerchListContainer.querySelectorAll('.edit-web-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleEditWebMerch));
		webMerchListContainer.querySelectorAll('.delete-web-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleDeleteWebMerch));
	}
}

/**
 * Maneja el guardado de Web Merch (crear o editar)
 */
async function handleSaveWebMerch(e) {
	e.preventDefault();
	const webMerchForm = document.getElementById('webMerchForm');
	if (!webMerchForm || !appState) return;

	const formData = new FormData(webMerchForm);
	const itemName = formData.get('web-merch-name')?.trim() || '';
	const itemPrice = parseFloat(formData.get('web-merch-price'));
	const itemImageUrl = formData.get('web-merch-image-url')?.trim() || '';

	// Validaciones
	if (!itemName) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("El nombre del artículo es obligatorio.", true);
		}
		return;
	}
	if (isNaN(itemPrice) || itemPrice < 0) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("El precio debe ser un número válido (0 o mayor).", true);
		}
		return;
	}

	if (typeof showLoading === 'function') showLoading(true);
	try {
		if (!appState.webMerch) appState.webMerch = [];

		if (editingWebMerchId !== null) {
			// Actualizar item existente
			const itemIndex = appState.webMerch.findIndex(item => item.id === editingWebMerchId);
			if (itemIndex > -1) {
				appState.webMerch[itemIndex] = {
					...appState.webMerch[itemIndex],
					name: itemName,
					price: itemPrice,
					imageUrl: itemImageUrl
				};
				if (typeof saveAppState === 'function') await saveAppState();
				if (typeof showInfoModal === 'function') showInfoModal('¡Artículo de Web Merch actualizado!', false);
			} else {
				throw new Error("Artículo a editar no encontrado.");
			}
		} else {
			// Añadir nuevo item
			const newItem = {
				id: appState.nextMerchItemId++,
				name: itemName,
				price: itemPrice,
				imageUrl: itemImageUrl
			};
			appState.webMerch.push(newItem);
			if (typeof saveAppState === 'function') await saveAppState();
			if (typeof showInfoModal === 'function') showInfoModal('¡Artículo añadido a Web Merch!', false);
		}

		hideWebMerchForm();
		renderWebMerchList();
		if (typeof renderWebMerchSalesSummary === 'function') renderWebMerchSalesSummary();
		if (typeof renderMerchPage === 'function') renderMerchPage(); // Re-renderizar página pública
	} catch (error) {
		console.error("Error saving Web Merch item:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al guardar el artículo: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Maneja la edición de un artículo de Web Merch
 */
function handleEditWebMerch(e) {
	const webMerchForm = document.getElementById('webMerchForm');
	if (!appState || !webMerchForm) return;
	const merchId = parseInt(e.currentTarget.dataset.webMerchId, 10);
	if (isNaN(merchId)) return;

	const itemToEdit = appState.webMerch?.find(item => item.id === merchId);
	if (!itemToEdit) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Artículo no encontrado para editar.", true);
		}
		return;
	}

	// Rellenar formulario
	const editIdInput = document.getElementById('edit-web-merch-id');
	if (editIdInput) editIdInput.value = itemToEdit.id;

	const nameInput = document.getElementById('webMerchName');
	if (nameInput) nameInput.value = itemToEdit.name || '';

	const priceInput = document.getElementById('webMerchPrice');
	if (priceInput) priceInput.value = itemToEdit.price || 0;

	const urlInput = document.getElementById('webMerchImageUrl');
	if (urlInput) urlInput.value = itemToEdit.imageUrl || '';

	editingWebMerchId = itemToEdit.id;
	webMerchForm.classList.remove('hidden');
	webMerchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Maneja la eliminación de un artículo de Web Merch
 */
async function handleDeleteWebMerch(e) {
	if (!appState) return;
	const merchId = parseInt(e.currentTarget.dataset.webMerchId, 10);
	if (isNaN(merchId)) return;

	const itemIndex = appState.webMerch?.findIndex(item => item.id === merchId);
	if (itemIndex === undefined || itemIndex === -1) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Artículo no encontrado.", true);
		}
		return;
	}

	const itemName = appState.webMerch[itemIndex].name || 'este artículo';

	if (!confirm(`¿Eliminar "${itemName}"?`)) return;

	if (typeof showLoading === 'function') showLoading(true);
	try {
		appState.webMerch.splice(itemIndex, 1);

		if (editingWebMerchId === merchId) {
			resetWebMerchForm();
		}

		if (typeof saveAppState === 'function') await saveAppState();
		if (typeof showInfoModal === 'function') {
			showInfoModal(`Artículo "${itemName}" eliminado.`, false);
		}

		renderWebMerchList();
		if (typeof renderWebMerchSalesSummary === 'function') renderWebMerchSalesSummary();
		if (typeof renderMerchPage === 'function') renderMerchPage();
	} catch (error) {
		console.error("Error deleting Web Merch item:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al eliminar el artículo: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Renderiza el resumen de ventas de Web Merch
 */
function renderWebMerchSalesSummary() {
	const webMerchSalesSummary = document.getElementById('webMerchSalesSummary');
	const webMerchTotalItems = document.getElementById('webMerchTotalItems');
	const webMerchTotalRevenue = document.getElementById('webMerchTotalRevenue');
	const webMerchViewSalesBtn = document.getElementById('webMerchViewSalesBtn');

	if (!webMerchSalesSummary || !webMerchTotalItems || !webMerchTotalRevenue || !webMerchViewSalesBtn) return;

	const salesForWeb = (allMerchSales || []).filter(s => s.dragId === 'web');
	const deliveredSales = salesForWeb.filter(s => s.status === 'Delivered');
	const pendingSalesCount = salesForWeb.length - deliveredSales.length;

	let totalItemsDelivered = 0;
	let totalRevenueDelivered = 0;

	deliveredSales.forEach(sale => {
		totalItemsDelivered += sale.quantity || 0;
		totalRevenueDelivered += (sale.quantity || 0) * (sale.itemPrice || 0);
	});

	webMerchTotalItems.textContent = totalItemsDelivered.toString();
	webMerchTotalRevenue.textContent = totalRevenueDelivered.toFixed(2) + ' €';

	if (salesForWeb.length > 0) {
		webMerchViewSalesBtn.textContent = `VER LISTA PEDIDOS (${pendingSalesCount} PENDIENTES)`;
		webMerchViewSalesBtn.disabled = false;
	} else {
		webMerchViewSalesBtn.textContent = `NO HAY PEDIDOS REGISTRADOS`;
		webMerchViewSalesBtn.disabled = true;
	}
}

/**
 * Muestra el modal con la lista de ventas de Web Merch
 */
function handleViewWebMerchSales() {
	const merchSalesListModal = document.getElementById('merchSalesListModal');
	const merchSalesListTitle = document.getElementById('merchSalesListTitle');
	
	if (!merchSalesListModal || !merchSalesListTitle) return;

	merchSalesListTitle.textContent = `Pedidos de Merch: RODETES OFICIAL (WEB)`;
	if (typeof renderMerchSalesListForDrag === 'function') {
		renderMerchSalesListForDrag('web');
	}
	merchSalesListModal.classList.remove('hidden');
}

// ===== DRAG MERCH FUNCTIONS =====

/**
 * Renderiza el selector de drags para Drag Merch
 */
function renderDragMerchSelect() {
	const dragMerchSelectDrag = document.getElementById('dragMerchSelectDrag');
	if (!dragMerchSelectDrag || !appState || !appState.drags) return;

	const previousSelectedDragId = dragMerchSelectDrag.value;

	dragMerchSelectDrag.innerHTML = '<option value="">-- SELECCIONA UNA DRAG --</option>';

	[...(appState.drags)]
		.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
		.forEach(drag => {
			const option = document.createElement('option');
			option.value = drag.id;
			option.textContent = drag.name || `Drag ID ${drag.id}`;
			dragMerchSelectDrag.appendChild(option);
		});

	// Restaurar selección si es válida
	if (previousSelectedDragId && appState.drags.some(d => d.id === parseInt(previousSelectedDragId))) {
		dragMerchSelectDrag.value = previousSelectedDragId;
		currentSelectedDragForMerch = parseInt(previousSelectedDragId);
	} else {
		currentSelectedDragForMerch = null;
	}

	renderDragMerchList();
}

/**
 * Maneja el cambio de selección de drag para Drag Merch
 */
function handleDragMerchSelectChange(e) {
	const val = e.target.value;
	if (val) {
		currentSelectedDragForMerch = parseInt(val, 10);
	} else {
		currentSelectedDragForMerch = null;
	}
	renderDragMerchList();
	if (typeof renderDragMerchSalesSummary === 'function') {
		renderDragMerchSalesSummary();
	}
}

/**
 * Muestra el formulario de Drag Merch
 */
function showDragMerchForm() {
	const dragMerchForm = document.getElementById('dragMerchForm');
	if (!dragMerchForm) return;
	dragMerchForm.classList.remove('hidden');
	resetDragMerchForm();
}

/**
 * Oculta y resetea el formulario de Drag Merch
 */
function hideDragMerchForm() {
	const dragMerchForm = document.getElementById('dragMerchForm');
	if (!dragMerchForm) return;
	dragMerchForm.classList.add('hidden');
	resetDragMerchForm();
}

/**
 * Resetea el formulario de Drag Merch
 */
function resetDragMerchForm() {
	const dragMerchForm = document.getElementById('dragMerchForm');
	if (!dragMerchForm) return;
	dragMerchForm.reset();
	editingDragMerchId = null;
	const editIdInput = document.getElementById('edit-drag-merch-id');
	if (editIdInput) editIdInput.value = '';
	const uploadInput = document.getElementById('dragMerchImageUploadInput');
	if (uploadInput) uploadInput.value = '';
}

/**
 * Renderiza la lista de Drag Merch según la drag seleccionada
 */
function renderDragMerchList() {
	const dragMerchListContainer = document.getElementById('dragMerchListContainer');
	const dragMerchForm = document.getElementById('dragMerchForm');
	const dragMerchSalesSummary = document.getElementById('dragMerchSalesSummary');

	if (!dragMerchListContainer || !appState) return;
	
	if (typeof clearDynamicListListeners === 'function') {
		clearDynamicListListeners('dragMerchList');
	}
	
	dragMerchListContainer.innerHTML = '';

	if (currentSelectedDragForMerch === null) {
		dragMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">Selecciona una drag para ver/añadir merch.</li>';
		if (dragMerchForm) dragMerchForm.classList.add('hidden');
		if (dragMerchSalesSummary) dragMerchSalesSummary.classList.add('hidden');
		return;
	}

	// Mostrar formulario y resumen cuando hay drag seleccionada
	if (dragMerchSalesSummary) dragMerchSalesSummary.classList.remove('hidden');

	const drag = appState.drags.find(d => d.id === currentSelectedDragForMerch);
	if (!drag) {
		dragMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">Drag no encontrada.</li>';
		return;
	}

	const merchItems = drag.merchItems || [];

	if (merchItems.length === 0) {
		dragMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">No hay artículos de merch para esta drag.</li>';
		return;
	}

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
					<button data-drag-merch-id="${item.id}" class="edit-drag-merch-btn bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-none text-sm font-pixel">EDITAR</button>
					<button data-drag-merch-id="${item.id}" class="delete-drag-merch-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-none text-sm font-pixel">ELIMINAR</button>
				</div>
			`;
			dragMerchListContainer.appendChild(li);
		} catch (e) {
			console.error(`Error renderizando Drag Merch item ${item?.id}:`, e);
		}
	});

	// Añadir listeners
	if (typeof addTrackedListener === 'function') {
		dragMerchListContainer.querySelectorAll('.edit-drag-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleEditDragMerch));
		dragMerchListContainer.querySelectorAll('.delete-drag-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleDeleteDragMerch));
	}
}

/**
 * Maneja el guardado de Drag Merch (crear o editar)
 */
async function handleSaveDragMerch(e) {
	e.preventDefault();
	const dragMerchForm = document.getElementById('dragMerchForm');
	if (!dragMerchForm || !appState || currentSelectedDragForMerch === null) return;

	const dragIndex = appState.drags.findIndex(d => d.id === currentSelectedDragForMerch);
	if (dragIndex === -1) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Drag no encontrada.", true);
		}
		return;
	}

	const formData = new FormData(dragMerchForm);
	const itemName = formData.get('drag-merch-name')?.trim() || '';
	const itemPrice = parseFloat(formData.get('drag-merch-price'));
	const itemImageUrl = formData.get('drag-merch-image-url')?.trim() || '';

	// Validaciones
	if (!itemName) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("El nombre del artículo es obligatorio.", true);
		}
		return;
	}
	if (isNaN(itemPrice) || itemPrice < 0) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("El precio debe ser un número válido (0 o mayor).", true);
		}
		return;
	}

	if (typeof showLoading === 'function') showLoading(true);
	try {
		if (!appState.drags[dragIndex].merchItems) {
			appState.drags[dragIndex].merchItems = [];
		}

		const merchItems = appState.drags[dragIndex].merchItems;

		if (editingDragMerchId !== null) {
			// Actualizar item existente
			const itemIndex = merchItems.findIndex(item => item.id === editingDragMerchId);
			if (itemIndex > -1) {
				merchItems[itemIndex] = {
					...merchItems[itemIndex],
					name: itemName,
					price: itemPrice,
					imageUrl: itemImageUrl
				};
				if (typeof saveAppState === 'function') await saveAppState();
				if (typeof showInfoModal === 'function') {
					showInfoModal(`¡Artículo de ${appState.drags[dragIndex].name} actualizado!`, false);
				}
			} else {
				throw new Error("Artículo a editar no encontrado.");
			}
		} else {
			// Añadir nuevo item
			const newItem = {
				id: appState.nextMerchItemId++,
				name: itemName,
				price: itemPrice,
				imageUrl: itemImageUrl
			};
			merchItems.push(newItem);
			if (typeof saveAppState === 'function') await saveAppState();
			if (typeof showInfoModal === 'function') {
				showInfoModal(`¡Artículo añadido a ${appState.drags[dragIndex].name}!`, false);
			}
		}

		hideDragMerchForm();
		renderDragMerchList();
		if (typeof renderDragMerchSalesSummary === 'function') renderDragMerchSalesSummary();
		if (typeof renderDragList === 'function') renderDragList(); // Actualizar contador
		if (typeof renderMerchPage === 'function') renderMerchPage(); // Re-renderizar página pública
	} catch (error) {
		console.error("Error saving Drag Merch item:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al guardar el artículo: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Maneja la edición de un artículo de Drag Merch
 */
function handleEditDragMerch(e) {
	const dragMerchForm = document.getElementById('dragMerchForm');
	if (!appState || !dragMerchForm || currentSelectedDragForMerch === null) return;
	const merchId = parseInt(e.currentTarget.dataset.dragMerchId, 10);
	if (isNaN(merchId)) return;

	const drag = appState.drags.find(d => d.id === currentSelectedDragForMerch);
	const itemToEdit = drag?.merchItems?.find(item => item.id === merchId);

	if (!itemToEdit) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Artículo no encontrado para editar.", true);
		}
		return;
	}

	// Rellenar formulario
	const editIdInput = document.getElementById('edit-drag-merch-id');
	if (editIdInput) editIdInput.value = itemToEdit.id;

	const nameInput = document.getElementById('dragMerchName');
	if (nameInput) nameInput.value = itemToEdit.name || '';

	const priceInput = document.getElementById('dragMerchPrice');
	if (priceInput) priceInput.value = itemToEdit.price || 0;

	const urlInput = document.getElementById('dragMerchImageUrl');
	if (urlInput) urlInput.value = itemToEdit.imageUrl || '';

	editingDragMerchId = itemToEdit.id;
	dragMerchForm.classList.remove('hidden');
	dragMerchForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Maneja la eliminación de un artículo de Drag Merch
 */
async function handleDeleteDragMerch(e) {
	if (!appState || currentSelectedDragForMerch === null) return;
	const merchId = parseInt(e.currentTarget.dataset.dragMerchId, 10);
	if (isNaN(merchId)) return;

	const dragIndex = appState.drags.findIndex(d => d.id === currentSelectedDragForMerch);
	if (dragIndex === -1) return;

	const merchItems = appState.drags[dragIndex].merchItems || [];
	const itemIndex = merchItems.findIndex(item => item.id === merchId);

	if (itemIndex === -1) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Artículo no encontrado.", true);
		}
		return;
	}

	const itemName = merchItems[itemIndex].name || 'este artículo';

	if (!confirm(`¿Eliminar "${itemName}"?`)) return;

	if (typeof showLoading === 'function') showLoading(true);
	try {
		merchItems.splice(itemIndex, 1);

		if (editingDragMerchId === merchId) {
			resetDragMerchForm();
		}

		if (typeof saveAppState === 'function') await saveAppState();
		if (typeof showInfoModal === 'function') {
			showInfoModal(`Artículo "${itemName}" eliminado.`, false);
		}

		renderDragMerchList();
		if (typeof renderDragMerchSalesSummary === 'function') renderDragMerchSalesSummary();
		if (typeof renderDragList === 'function') renderDragList();
		if (typeof renderMerchPage === 'function') renderMerchPage();
	} catch (error) {
		console.error("Error deleting Drag Merch item:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al eliminar el artículo: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Renderiza el resumen de ventas de Drag Merch
 */
function renderDragMerchSalesSummary() {
	const dragMerchSalesSummary = document.getElementById('dragMerchSalesSummary');
	const dragMerchTotalItems = document.getElementById('dragMerchTotalItems');
	const dragMerchTotalRevenue = document.getElementById('dragMerchTotalRevenue');
	const dragMerchViewSalesBtn = document.getElementById('dragMerchViewSalesBtn');

	if (!dragMerchSalesSummary || !dragMerchTotalItems || !dragMerchTotalRevenue || !dragMerchViewSalesBtn || currentSelectedDragForMerch === null) return;

	const salesForDrag = (allMerchSales || []).filter(s => parseInt(s.dragId) === parseInt(currentSelectedDragForMerch));
	const deliveredSales = salesForDrag.filter(s => s.status === 'Delivered');
	const pendingSalesCount = salesForDrag.length - deliveredSales.length;

	const totalSales = salesForDrag;
	let totalItems = 0;
	let totalRevenue = 0;

	totalSales.forEach(sale => {
		totalItems += sale.quantity || 0;
		totalRevenue += (sale.quantity || 0) * (sale.itemPrice || 0);
	});

	dragMerchTotalItems.textContent = totalItems.toString();
	dragMerchTotalRevenue.textContent = totalRevenue.toFixed(2) + ' €';

	if (salesForDrag.length > 0) {
		dragMerchViewSalesBtn.textContent = `VER LISTA PEDIDOS (${pendingSalesCount} PENDIENTES)`;
		dragMerchViewSalesBtn.disabled = false;
	} else {
		dragMerchViewSalesBtn.textContent = `NO HAY PEDIDOS REGISTRADOS`;
		dragMerchViewSalesBtn.disabled = true;
	}
}

/**
 * Muestra el modal con la lista de ventas de Drag Merch
 */
function handleViewDragMerchSales() {
	const merchSalesListModal = document.getElementById('merchSalesListModal');
	const merchSalesListTitle = document.getElementById('merchSalesListTitle');
	
	if (!merchSalesListModal || !merchSalesListTitle || currentSelectedDragForMerch === null) return;

	const drag = appState.drags.find(d => d.id === currentSelectedDragForMerch);
	const dragName = drag ? drag.name : 'Drag';

	merchSalesListTitle.textContent = `Pedidos de Merch: ${dragName}`;
	if (typeof renderMerchSalesListForDrag === 'function') {
		renderMerchSalesListForDrag(currentSelectedDragForMerch);
	}
	merchSalesListModal.classList.remove('hidden');
}

// All functions above are available in global scope automatically when script loads
