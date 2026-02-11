/**
 * modules/drags.js
 * Funciones relacionadas con las drags
 */

/**
 * Renderiza la lista de drags en el panel admin.
 */
function renderAdminDrags(drags) {
	const AdminDragsContainer = document.getElementById('admin-drags-list-ul');
	if (!AdminDragsContainer) return;

	clearDynamicListListeners('adminDrags');
	AdminDragsContainer.innerHTML = '';

	if (!Array.isArray(drags) || drags.length === 0) {
		AdminDragsContainer.innerHTML = '<p class="text-gray-400 font-pixel col-span-full text-center">No hay drags creadas.</p>';
		return;
	}

	drags.forEach(drag => {
		try {
			const card = document.createElement('div');
			card.className = "bg-gray-900 border border-gray-700 rounded-none p-4 flex justify-between items-center";

			const imageUrl = drag.coverImageUrl || `https://placehold.co/80x80/000/fff?text=${encodeURIComponent(drag.name || 'Drag')}&font=vt323`;
			const galleryCount = drag.galleryImages?.length || 0;
			const merchCount = drag.merchItems?.length || 0;

			card.innerHTML = `
				<div class="flex items-center gap-4 flex-grow">
					<img src="${imageUrl}" alt="${drag.name}" class="w-16 h-16 object-cover rounded-none border border-gray-600">
					<div>
						<h4 class="text-lg font-pixel text-white">${drag.name || 'Sin nombre'}</h4>
						<p class="text-sm text-gray-400">Fotos: ${galleryCount} | Merch: ${merchCount}</p>
					</div>
				</div>
				<div class="flex gap-2">
					<button data-drag-id="${drag.id}" class="edit-drag-btn px-3 py-1 bg-yellow-600 text-white font-pixel text-sm rounded-none hover:bg-yellow-700">EDITAR</button>
					<button data-drag-id="${drag.id}" class="delete-drag-btn px-3 py-1 bg-red-600 text-white font-pixel text-sm rounded-none hover:bg-red-700">ELIMINAR</button>
				</div>
			`;

			AdminDragsContainer.appendChild(card);
		} catch (e) {
			console.error(`Error renderizando drag ${drag?.id}:`, e);
		}
	});

	// Adjuntar listeners
	AdminDragsContainer.querySelectorAll('.edit-drag-btn').forEach(btn => {
		addTrackedListener(btn, 'click', handleEditDragClick);
	});
	AdminDragsContainer.querySelectorAll('.delete-drag-btn').forEach(btn => {
		addTrackedListener(btn, 'click', handleDeleteDrag);
	});
}

/**
 * Maneja el guardado de una drag (crear o actualizar).
 */
async function handleSaveDrag(e) {
	e.preventDefault();
	if (!addDragForm || !appState) return;

	const dragName = addDragForm['drag-name'].value.trim();
	const dragDescription = addDragForm['drag-description'].value.trim();
	const dragInstagram = addDragForm['drag-instagram'].value.trim();
	const dragColor = addDragForm['drag-color'].value.trim();
	const dragCoverUrl = addDragForm['drag-cover-url'].value.trim();
	const dragGalleryUrls = JSON.parse(addDragForm['drag-gallery-urls'].value || '[]');

	// Validaciones
	if (!dragName) {
		showInfoModal("POR FAVOR, INTRODUCE EL NOMBRE DE LA DRAG.", true);
		return;
	}

	showLoading(true, "Guardando drag...");

	try {
		const dragIdToSave = editingDragId;

		if (dragIdToSave) {
			// Actualizar drag existente
			const dragIndex = appState.drags.findIndex(d => d.id === dragIdToSave);
			if (dragIndex !== -1) {
				appState.drags[dragIndex] = {
					...appState.drags[dragIndex],
					name: dragName,
					description: dragDescription,
					instagramHandle: dragInstagram,
					cardColor: dragColor,
					coverImageUrl: dragCoverUrl,
					galleryImages: dragGalleryUrls
				};
				console.log("Drag actualizado:", appState.drags[dragIndex]);
			}
		} else {
			// Crear drag nueva
			const newDrag = {
				id: appState.nextDragId || 1,
				name: dragName,
				description: dragDescription,
				instagramHandle: dragInstagram,
				cardColor: dragColor,
				coverImageUrl: dragCoverUrl,
				galleryImages: dragGalleryUrls,
				merchItems: []
			};
			appState.drags.push(newDrag);
			appState.nextDragId = (appState.nextDragId || 1) + 1;
			console.log("Drag creada:", newDrag);
		}

		const saveResult = await saveAppState();
		showLoading(false);

		if (saveResult.ok) {
			showInfoModal("DRAG GUARDADA CORRECTAMENTE.", false, () => {
				resetDragForm();
				// Re-renderizar vistas públicas y admin (como en app-old-broken.js líneas 3038-3040)
				if (typeof renderDragList === 'function') renderDragList(); // Actualizar lista pública
				renderAdminDrags(appState.drags); // Actualizar lista admin
				if (typeof renderAdminMerch === 'function') renderAdminMerch(); // Actualizar select de merch
			});
		}
	} catch (error) {
		showLoading(false);
		console.error("Error guardando drag:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Resetea el formulario de drags.
 */
function resetDragForm() {
	if (!addDragForm) return;
	addDragForm.reset();
	addDragForm['drag-gallery-urls'].value = '[]';
	editingDragId = null;

	const clearGalleryBtn = document.querySelector('[data-action="clear-drag-gallery"]');
	if (clearGalleryBtn) clearGalleryBtn.click();

	const adminDragGalleryPreview = document.getElementById('admin-drag-gallery-preview-grid');
	if (adminDragGalleryPreview) adminDragGalleryPreview.innerHTML = '';
}

/**
 * Maneja la edición de una drag.
 */
function handleEditDragClick(e) {
	const dragId = parseInt(e.currentTarget.dataset.dragId, 10);
	if (!appState) return;

	const dragToEdit = appState.drags.find(d => d.id === dragId);
	if (!dragToEdit || !addDragForm) return;

	editingDragId = dragId;

	addDragForm['drag-name'].value = dragToEdit.name || '';
	addDragForm['drag-description'].value = dragToEdit.description || '';
	addDragForm['drag-instagram'].value = dragToEdit.instagramHandle || '';
	addDragForm['drag-color'].value = dragToEdit.cardColor || '#FFFFFF';
	addDragForm['drag-cover-url'].value = dragToEdit.coverImageUrl || '';
	addDragForm['drag-gallery-urls'].value = JSON.stringify(dragToEdit.galleryImages || []);

	// Renderizar galería actual
	const adminDragGalleryPreview = document.getElementById('admin-drag-gallery-preview-grid');
	if (adminDragGalleryPreview && dragToEdit.galleryImages) {
		renderAdminGalleryGrid('admin-drag-gallery-preview-grid', 'drag-gallery-urls', dragToEdit.galleryImages);
	}

	// Scroll al formulario
	if (addDragForm) {
		addDragForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}
}

/**
 * Maneja la eliminación de una drag.
 */
async function handleDeleteDrag(e) {
	const dragId = parseInt(e.currentTarget.dataset.dragId, 10);
	if (!appState) return;

	const dragIndex = appState.drags.findIndex(d => d.id === dragId);
	if (dragIndex === -1) return;

	const dragToDelete = appState.drags[dragIndex];
	const dragName = dragToDelete.name || 'esta drag';

	if (!confirm(`¿ESTÁS SEGURO DE QUE QUIERES ELIMINAR LA DRAG "${dragName}"?`)) {
		return;
	}

	console.warn(`Simulando confirmación para eliminar drag: ${dragName} (ID: ${dragId})`);
	showLoading(true);

	try {
		// Eliminar drag del array
		appState.drags.splice(dragIndex, 1);

		// Filtrar ventas de merch de esta drag
		const initialSalesCount = allMerchSales.length;
		allMerchSales = allMerchSales.filter(s => s.dragId !== dragId);
		const removedSalesCount = initialSalesCount - allMerchSales.length;
		if (removedSalesCount > 0) {
			console.log(`Eliminadas ${removedSalesCount} ventas de merch de la drag ${dragId}.`);
		}

		// Si se estaba editando esta drag, resetear form
		if (editingDragId === dragId) {
			resetDragForm();
		}

		// Guardar ambos estados
		await Promise.all([
			saveAppState(),
			saveMerchSalesState()
		]);

		showLoading(false);
		showInfoModal(`DRAG "${dragName}" Y SUS VENTAS ELIMINADAS.`, false);

		// Re-renderizar vistas afectadas (como en app-old-broken.js líneas 3163-3165)
		if (typeof renderDragList === 'function') renderDragList(); // Lista pública
		renderAdminDrags(appState.drags); // Lista admin
		if (typeof renderAdminMerch === 'function') renderAdminMerch(); // Actualizar select y lista de merch admin

	} catch (error) {
		showLoading(false);
		console.error("Error deleting drag:", error);
		showInfoModal("Error al eliminar la drag: " + error.message, true);
	}
}

/**
 * Obtiene una drag por ID.
 */
function getDragById(dragId) {
	if (!appState || !appState.drags) return null;
	return appState.drags.find(d => d.id === dragId);
}

/**
 * Obtiene todas las drags.
 */
function getAllDrags() {
	return appState?.drags || [];
}

/**
 * Obtiene las drags que tienen merch disponible.
 */
function getDragsWithMerch() {
	return (appState?.drags || []).filter(d => d.merchItems && d.merchItems.length > 0);
}

