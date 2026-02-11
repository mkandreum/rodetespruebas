/**
 * modules/admin-merch.js
 * Admin panel merch management - Complete system from app-old-broken.js
 */

// Global variables needed
let editingMerchItemId = null;
let currentAdminMerchDragId = null;

/**
 * Maneja el cambio de selección en el dropdown de drags (o web merch).
 * Extraído de app-old-broken.js líneas 3180-3190
 */
function handleAdminMerchDragSelect(e) {
	const val = e.target.value;
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
 * Renderiza la sección de admin de Merch (select de drag y lista de items).
 * Extraído de app-old-broken.js líneas 3195-3299
 */
function renderAdminMerch() {
	const adminMerchSelectDrag = document.getElementById('drag-merch-select-drag');
	const adminMerchListContainer = document.getElementById('drag-merch-list-container');
	const addMerchItemForm = document.getElementById('drag-merch-form');
	const adminMerchSalesSummary = document.getElementById('drag-merch-sales-summary');

	if (!adminMerchSelectDrag || !adminMerchListContainer || !appState || !appState.drags) return;
	
	if (typeof clearDynamicListListeners === 'function') {
		clearDynamicListListeners('adminMerchItems');
	}

	// Guardar selección actual antes de limpiar
	const previousSelectedDragId = adminMerchSelectDrag.value;
	console.log("renderAdminMerch - Previous selection:", previousSelectedDragId);

	// Poblar select: Placeholder + Web Merch + Drags
	adminMerchSelectDrag.innerHTML = '<option value="">-- SELECCIONA UNA DRAG --</option>';

	// PRIMERO: Añadir opción Web Merch
	const webOption = document.createElement('option');
	webOption.value = 'web';
	webOption.textContent = 'RODETES OFICIAL (WEB MERCH)';
	webOption.style.fontWeight = 'bold';
	webOption.style.color = '#F02D7D';
	adminMerchSelectDrag.appendChild(webOption);

	// SEGUNDO: Añadir drags ordenadas
	[...(appState.drags)]
		.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
		.forEach(drag => {
			const option = document.createElement('option');
			option.value = drag.id;
			option.textContent = drag.name || `Drag ID ${drag.id}`;
			adminMerchSelectDrag.appendChild(option);
		});

	console.log("renderAdminMerch - Options added. Total:", adminMerchSelectDrag.options.length);

	// TERCERO: Restaurar selección si es válida
	if (previousSelectedDragId === 'web') {
		adminMerchSelectDrag.value = 'web';
		currentAdminMerchDragId = 'web';
		console.log("renderAdminMerch - Restored Web Merch");
	} else if (previousSelectedDragId && appState.drags.some(d => d.id === parseInt(previousSelectedDragId))) {
		adminMerchSelectDrag.value = previousSelectedDragId;
		currentAdminMerchDragId = parseInt(previousSelectedDragId);
		console.log("renderAdminMerch - Restored drag:", currentAdminMerchDragId);
	} else {
		// No hay selección válida previa
		currentAdminMerchDragId = null;
		adminMerchSelectDrag.value = "";
		console.log("renderAdminMerch - No valid previous selection");
	}

	// Renderizar lista de items o mensaje según la selección
	adminMerchListContainer.innerHTML = '';
	if (currentAdminMerchDragId === null) {
		adminMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">Selecciona una drag o Web Merch para ver/añadir items.</li>';
		if (addMerchItemForm) addMerchItemForm.classList.add('hidden'); // Ocultar form
		if (adminMerchSalesSummary) adminMerchSalesSummary.classList.add('hidden'); // Ocultar resumen ventas
	} else {
		if (addMerchItemForm) addMerchItemForm.classList.remove('hidden'); // Mostrar form
		if (typeof renderAdminMerchSalesSummary === 'function') {
			renderAdminMerchSalesSummary(); // Mostrar/Actualizar resumen ventas
		}

		let merchItems = [];

		// --- LÓGICA DIFERENCIADA WEB vs DRAG ---
		if (currentAdminMerchDragId === 'web') {
			merchItems = appState.webMerch || [];
		} else {
			const drag = appState.drags.find(d => d.id === currentAdminMerchDragId);
			merchItems = drag?.merchItems || [];
		}

		if (merchItems.length === 0) {
			adminMerchListContainer.innerHTML = '<li class="text-gray-400 text-center font-pixel">No hay artículos de merchandising añadidos.</li>';
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
					adminMerchListContainer.appendChild(li);
				} catch (e) {
					console.error(`Error renderizando item merch admin ${item?.id}:`, e);
				}
			});

			// Añadir listeners a los botones de la lista
			if (typeof addTrackedListener === 'function') {
				adminMerchListContainer.querySelectorAll('.edit-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleEditMerchItemClick));
				adminMerchListContainer.querySelectorAll('.delete-merch-btn').forEach(btn => addTrackedListener(btn, 'click', handleDeleteMerchItem));
			}
		}
	}
	// Resetea siempre el form al cambiar de drag o renderizar
	resetMerchItemForm();
}

/**
 * Resetea el formulario de añadir/editar item de merch.
 * Extraído de app-old-broken.js líneas 3472-3485
 */
function resetMerchItemForm() {
	const addMerchItemForm = document.getElementById('drag-merch-form');
	const merchItemImageUploadInput = document.getElementById('drag-merch-image-upload');
	const addMerchItemFormButton = document.getElementById('save-drag-merch-btn');

	if (!addMerchItemForm) return;
	addMerchItemForm.reset();
	editingMerchItemId = null; // No estamos editando
	if (addMerchItemForm['edit-drag-merch-id']) {
		addMerchItemForm['edit-drag-merch-id'].value = ''; // Limpiar ID oculto
	}
	if (merchItemImageUploadInput) merchItemImageUploadInput.value = ''; // Limpiar input file

	// Restaurar botón
	if (addMerchItemFormButton) {
		addMerchItemFormButton.textContent = "AÑADIR ARTÍCULO";
		addMerchItemFormButton.classList.remove('bg-blue-600', 'hover:bg-blue-500');
		addMerchItemFormButton.classList.add('bg-white', 'hover:bg-gray-300'); // Estilo por defecto
	}
}

/**
 * Rellena el form de merch para editar un item existente.
 * Extraído de app-old-broken.js líneas 3490-3523
 */
function handleEditMerchItemClick(e) {
	const addMerchItemForm = document.getElementById('drag-merch-form');
	const addMerchItemFormButton = document.getElementById('save-drag-merch-btn');

	if (currentAdminMerchDragId === null || !appState) return;
	const merchId = parseInt(e.target.dataset.merchId, 10);
	if (isNaN(merchId)) return;

	let itemToEdit = null;
	if (currentAdminMerchDragId === 'web') {
		itemToEdit = appState.webMerch?.find(item => item.id === merchId);
	} else {
		const drag = appState.drags.find(d => d.id === currentAdminMerchDragId);
		itemToEdit = drag?.merchItems?.find(item => item.id === merchId);
	}

	if (!itemToEdit || !addMerchItemForm) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Artículo no encontrado para editar.", true);
		}
		return;
	}

	// Rellenar formulario
	if (addMerchItemForm['edit-drag-merch-id']) {
		addMerchItemForm['edit-drag-merch-id'].value = itemToEdit.id;
	}
	addMerchItemForm['drag-merch-name'].value = itemToEdit.name || '';
	addMerchItemForm['drag-merch-price'].value = itemToEdit.price || 0;
	addMerchItemForm['drag-merch-image-url'].value = itemToEdit.imageUrl || '';

	editingMerchItemId = itemToEdit.id; // Marcar como editando

	// Cambiar botón
	if (addMerchItemFormButton) {
		addMerchItemFormButton.textContent = "ACTUALIZAR ARTÍCULO";
		addMerchItemFormButton.classList.add('bg-blue-600', 'hover:bg-blue-500');
		addMerchItemFormButton.classList.remove('bg-white', 'hover:bg-gray-300');
	}
	addMerchItemForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Guarda un nuevo item de merch o actualiza uno existente para la drag seleccionada.
 * Extraído de app-old-broken.js líneas 3528-3609
 */
async function handleSaveMerchItem(e) {
	e.preventDefault();
	const addMerchItemForm = document.getElementById('drag-merch-form');

	if (!addMerchItemForm || currentAdminMerchDragId === null || !appState) return;

	// Determinar dónde guardar (Web o Drag)
	let targetArray = null;
	let contextName = "";
	let dragIndex = -1;

	if (currentAdminMerchDragId === 'web') {
		if (!appState.webMerch) appState.webMerch = [];
		targetArray = appState.webMerch;
		contextName = "Web Merch";
	} else {
		dragIndex = appState.drags.findIndex(d => d.id === currentAdminMerchDragId);
		if (dragIndex === -1) {
			if (typeof showInfoModal === 'function') {
				showInfoModal("Error: Drag no encontrada para guardar el artículo.", true);
			}
			return;
		}
		if (!appState.drags[dragIndex].merchItems) appState.drags[dragIndex].merchItems = [];
		targetArray = appState.drags[dragIndex].merchItems;
		contextName = appState.drags[dragIndex].name || "Drag";
	}

	const formData = new FormData(addMerchItemForm);
	const itemIdToSave = editingMerchItemId; // Null si es nuevo
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
	if (itemImageUrl && !(itemImageUrl.startsWith('http') || itemImageUrl.startsWith('uploads/'))) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("La URL de imagen no es válida (http o uploads/).", true);
		}
		return;
	}

	if (typeof showLoading === 'function') showLoading(true);
	try {
		// (Ya tenemos targetArray definido arriba)
		const merchItems = targetArray; // Referencia al array correcto

		if (itemIdToSave !== null) { // Actualizar item existente
			const itemIndex = merchItems.findIndex(item => item.id === itemIdToSave);
			if (itemIndex > -1) {
				merchItems[itemIndex] = {
					...merchItems[itemIndex], // Mantener ID
					name: itemName,
					price: itemPrice,
					imageUrl: itemImageUrl
				};
				if (typeof saveAppState === 'function') {
					await saveAppState(); // Guardar todo el appState
				}
				if (typeof showInfoModal === 'function') {
					showInfoModal(`¡Artículo de ${contextName} actualizado!`, false);
				}
			} else { 
				throw new Error("Artículo a editar no encontrado."); 
			}
		} else { // Añadir nuevo item
			const newItem = {
				id: appState.nextMerchItemId++, // Usar ID global y luego incrementar
				name: itemName,
				price: itemPrice,
				imageUrl: itemImageUrl
			};
			merchItems.push(newItem); // Añadir al array correcto
			if (typeof saveAppState === 'function') {
				await saveAppState(); // Guardar todo el appState
			}
			if (typeof showInfoModal === 'function') {
				showInfoModal(`¡Artículo añadido a ${contextName}!`, false);
			}
		}
		resetMerchItemForm(); // Limpiar formulario
		renderAdminMerch(); // Re-renderizar la sección de merch admin

		// Re-renderizar vistas públicas
		if (typeof renderDragList === 'function') renderDragList();
		if (typeof renderMerchPage === 'function') renderMerchPage(); // Re-renderizar página pública de merch

	} catch (error) {
		console.error("Error saving merch item:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al guardar el artículo de merch: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}

/**
 * Elimina un item de merch de la drag seleccionada.
 * Extraído de app-old-broken.js líneas 3614-3666
 */
async function handleDeleteMerchItem(e) {
	if (currentAdminMerchDragId === null || !appState || !appState.drags) return;
	const merchId = parseInt(e.target.dataset.merchId, 10);
	if (isNaN(merchId)) return;

	let targetArray = null;
	if (currentAdminMerchDragId === 'web') {
		targetArray = appState.webMerch;
	} else {
		const dragIndex = appState.drags.findIndex(d => d.id === currentAdminMerchDragId);
		if (dragIndex === -1) return;
		targetArray = appState.drags[dragIndex].merchItems;
	}

	if (!targetArray) return;

	const itemIndex = targetArray.findIndex(item => item.id === merchId);
	if (itemIndex === -1) {
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error: Artículo no encontrado para eliminar.", true);
		}
		return; // Item no encontrado
	}

	const itemName = targetArray[itemIndex].name || 'este artículo';

	// Simulación de confirmación
	console.warn(`Simulando confirmación para eliminar merch: ${itemName} (ID: ${merchId})`);
	if (typeof showLoading === 'function') showLoading(true);
	try {
		// Eliminar el item del array
		targetArray.splice(itemIndex, 1);

		// Si se estaba editando este item, resetear el form
		if (editingMerchItemId === merchId) {
			resetMerchItemForm();
		}

		// Guardar el estado de la aplicación (que ahora tiene el item menos)
		if (typeof saveAppState === 'function') {
			await saveAppState();
		}
		// Nota: NO eliminamos las ventas asociadas (historial)

		if (typeof showInfoModal === 'function') {
			showInfoModal(`Artículo "${itemName}" eliminado.`, false);
		}

		// Re-renderizar vistas
		renderAdminMerch(); // Actualizar lista admin
		if (typeof renderDragList === 'function') renderDragList(); // Actualizar contador en lista pública

	} catch (error) {
		console.error("Error deleting merch item:", error);
		if (typeof showInfoModal === 'function') {
			showInfoModal("Error al eliminar el artículo: " + error.message, true);
		}
	} finally {
		if (typeof showLoading === 'function') showLoading(false);
	}
}
