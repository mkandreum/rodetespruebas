/**
 * modules/upload.js
 * Manejo de carga de archivos, galerías, backup y restore
 */

/**
 * Maneja la subida de un archivo individual.
 */
async function handleFileUpload(event, targetInput) {
	const file = event.target.files?.[0];
	if (!file) return;

	event.target.value = ''; // Reset para permitir subir el mismo archivo

	try {
		showLoading(true, "Subiendo archivo...");

		let fileTypeForUpload = 'document';
		if (file.type.startsWith('image/')) {
			fileTypeForUpload = 'image';
		} else if (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm')) {
			fileTypeForUpload = 'video';
		}

		const { ok, status, result } = await uploadFileWithProgress(file, fileTypeForUpload, (percent) => {
			showLoading(true, `Subiendo: ${percent}%`, percent);
		});

		showLoading(false);

		if (ok && result.url) {
			if (targetInput) {
				targetInput.value = result.url;
			}
			showInfoModal(`✅ ARCHIVO SUBIDO: ${result.url.substring(0, 50)}...`, false);
		} else {
			showInfoModal(`Error al subir archivo: ${result?.error}`, true);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error en subida de archivo:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Maneja la subida de múltiples archivos.
 */
async function handleMultipleFileUpload(event, hiddenInputId, gridContainerId, thumbnailInputId = null) {
	const files = event.target.files;
	if (!files || files.length === 0) return;

	event.target.value = '';

	const hiddenInput = document.getElementById(hiddenInputId);
	if (!hiddenInput) return;

	let imageUrls = JSON.parse(hiddenInput.value || '[]');
	let thumbnailUrls = [];

	if (thumbnailInputId) {
		const thumbnailInput = document.getElementById(thumbnailInputId);
		if (thumbnailInput) {
			thumbnailUrls = JSON.parse(thumbnailInput.value || '[]');
		}
	}

	try {
		showLoading(true, `Subiendo ${files.length} archivo(s)...`);

		const uploadResults = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const { ok, status, result } = await uploadFileWithProgress(file, 'image', (percent) => {
				showLoading(true, `Subiendo ${i + 1}/${files.length}: ${percent}%`, percent);
			});

			if (ok && result.url) {
				uploadResults.push(result);
			}
		}

		showLoading(false);

		if (uploadResults.length > 0) {
			const newUrls = uploadResults.map(r => r.url);
			const newThumbnails = uploadResults.map(r => r.thumbnail);

			imageUrls = imageUrls.concat(newUrls);
			thumbnailUrls = thumbnailUrls.concat(newThumbnails);

			hiddenInput.value = JSON.stringify(imageUrls);

			if (thumbnailInputId) {
				const thumbnailInput = document.getElementById(thumbnailInputId);
				if (thumbnailInput) {
					thumbnailInput.value = JSON.stringify(thumbnailUrls);
				}
			}

			renderAdminGalleryGrid(gridContainerId, hiddenInputId, imageUrls, thumbnailInputId);
			showInfoModal(`✅ ${uploadResults.length} ARCHIVO(S) SUBIDO(S)`, false);
		}

	} catch (error) {
		showLoading(false);
		console.error("Error en carga múltiple:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Renderiza la grilla de galería con opciones de eliminar.
 */
function renderAdminGalleryGrid(containerId, hiddenInputId, imageUrls, thumbnailInputId = null) {
	const container = document.getElementById(containerId);
	const hiddenInput = document.getElementById(hiddenInputId);

	if (!container || !hiddenInput) return;

	container.innerHTML = '';

	imageUrls.forEach((url, index) => {
		if (!url) return;

		const wrapper = document.createElement('div');
		wrapper.className = "relative bg-gray-800 rounded-none border border-gray-600 overflow-hidden aspect-square group";

		const img = document.createElement('img');
		img.src = url;
		img.alt = `Galería ${index + 1}`;
		img.className = "w-full h-full object-cover";
		img.onerror = () => {
			img.src = 'https://placehold.co/300x300/000/fff?text=Error';
		};

		const deleteBtn = document.createElement('button');
		deleteBtn.type = 'button';
		deleteBtn.className = "absolute top-2 right-2 bg-red-600 text-white rounded-none px-2 py-1 text-sm font-pixel opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700";
		deleteBtn.textContent = 'ELIMINAR';

		deleteBtn.addEventListener('click', (e) => {
			e.preventDefault();
			const updatedUrls = imageUrls.filter((_, i) => i !== index);
			hiddenInput.value = JSON.stringify(updatedUrls);

			if (thumbnailInputId) {
				const thumbnailInput = document.getElementById(thumbnailInputId);
				if (thumbnailInput) {
					const thumbnailUrls = JSON.parse(thumbnailInput.value || '[]');
					const updatedThumbnails = thumbnailUrls.filter((_, i) => i !== index);
					thumbnailInput.value = JSON.stringify(updatedThumbnails);
				}
			}

			renderAdminGalleryGrid(containerId, hiddenInputId, updatedUrls, thumbnailInputId);
		});

		wrapper.appendChild(img);
		wrapper.appendChild(deleteBtn);
		container.appendChild(wrapper);
	});
}

/**
 * Descarga una imagen con marca de agua.
 */
async function downloadImageWithWatermark() {
	if (!currentImageModalIndex || currentImageModalGallery.length === 0) {
		showInfoModal("No hay imagen seleccionada.", true);
		return;
	}

	showLoading(true, "Preparando descarga...");

	try {
		const imageSrc = currentImageModalGallery[currentImageModalIndex];

		// Cargar imagen
		const image = await loadImage(imageSrc);

		// Crear canvas
		const canvas = document.createElement('canvas');
		canvas.width = image.width;
		canvas.height = image.height;

		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);

		// Añadir marca de agua
		ctx.font = `${Math.floor(canvas.width / 15)}px Arial`;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.textAlign = 'center';
		ctx.fillText('© Rodetes Party', canvas.width / 2, canvas.height - 50);

		// Descargar
		const link = document.createElement('a');
		link.href = canvas.toDataURL('image/png');
		link.download = `rodetes-party-${Date.now()}.png`;
		link.click();

		showLoading(false);
		showInfoModal("Imagen descargada correctamente.", false);

	} catch (error) {
		showLoading(false);
		console.error("Error descargando imagen:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

/**
 * Maneja el backup de datos.
 */
function handleBackup() {
	if (!appState || !allTickets || !allMerchSales) {
		showInfoModal("Error: Datos no cargados.", true);
		return;
	}

	const backup = {
		timestamp: new Date().toISOString(),
		appState,
		allTickets,
		allMerchSales
	};

	const dataStr = JSON.stringify(backup, null, 2);
	const dataBlob = new Blob([dataStr], { type: 'application/json' });
	const url = URL.createObjectURL(dataBlob);

	const link = document.createElement('a');
	link.href = url;
	link.download = `rodetes-backup-${Date.now()}.json`;
	link.click();

	URL.revokeObjectURL(url);
	showInfoModal("Backup descargado correctamente.", false);
}

/**
 * Maneja la restauración de datos desde un backup.
 */
async function handleRestore(event) {
	const file = event.target.files?.[0];
	if (!file) return;

	event.target.value = '';

	if (!file.name.endsWith('.json')) {
		showInfoModal("Por favor, selecciona un archivo JSON válido.", true);
		return;
	}

	if (!confirm("⚠️ ADVERTENCIA: ESTO SOBRESCRIBIRÁ TODOS LOS DATOS ACTUALES. ¿ESTÁS SEGURO?")) {
		return;
	}

	showLoading(true, "Restaurando datos...");

	try {
		const fileContent = await readFileAsText(file);
		const backup = JSON.parse(fileContent);

		if (!backup.appState || !backup.allTickets || !backup.allMerchSales) {
			throw new Error("Formato de backup inválido.");
		}

		// Restaurar
		appState = backup.appState;
		allTickets = backup.allTickets;
		allMerchSales = backup.allMerchSales;

		// Guardar en servidor
		await saveAppState();
		await saveTicketState();
		await saveMerchSalesState();

		showLoading(false);
		showInfoModal("DATOS RESTAURADOS CORRECTAMENTE. La página se recargará...", false, () => {
			window.location.reload();
		});

	} catch (error) {
		showLoading(false);
		console.error("Error restaurando backup:", error);
		showInfoModal(`Error: ${error.message}`, true);
	}
}

// All functions above are available in global scope automatically when script loads

