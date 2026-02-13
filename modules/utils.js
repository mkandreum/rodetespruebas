/**
 * modules/utils.js
 * Funciones auxiliares generales de la aplicación
 */

// --- File Reading Functions ---
function readFileAsDataURL(file) {
	return new Promise((res, rej) => {
		const reader = new FileReader();
		reader.onload = () => res(reader.result);
		reader.onerror = rej;
		reader.readAsDataURL(file);
	});
}

function readFileAsText(file) {
	return new Promise((res, rej) => {
		const reader = new FileReader();
		reader.onload = () => res(reader.result);
		reader.onerror = rej;
		reader.readAsText(file);
	});
}

function readFileAsArrayBuffer(file) {
	return new Promise((res, rej) => {
		const reader = new FileReader();
		reader.onload = () => res(reader.result);
		reader.onerror = rej;
		reader.readAsArrayBuffer(file);
	});
}

// --- DOM Animation Functions ---
function initScrollRevealAnimation() {
	const observer = new IntersectionObserver((entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('revealed'); // Clase que activa la animación CSS
				observer.unobserve(entry.target);
			}
		});
	}, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

	function observeRevealElements() {
		document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
	}
	observeRevealElements();

	const origHTMLInner = HTMLElement.prototype.innerHTML;
	Object.defineProperty(HTMLElement.prototype, 'innerHTML', {
		set(value) {
			origHTMLInner.__lookupSetter__.call(this, 'innerHTML').call(this, value);
			observeRevealElements();
		},
		get() {
			return origHTMLInner.__lookupGetter__.call(this, 'innerHTML').call(this);
		}
	});

	return observeRevealElements;
}

function updateNavIndicator(pageId) {
	document.querySelectorAll('[data-nav]').forEach(link => {
		link.classList.toggle('active', link.dataset.nav === pageId);
	});
}

// --- Modal and UI Functions ---
function showLoading(isLoading, message = "Cargando...", percent = null) {
	const loadingModal = document.getElementById('loading-modal');
	const loadingText = document.getElementById('loading-title');
	const loadingPercent = document.getElementById('loading-percent');

	if (!loadingModal) return;

	if (isLoading) {
		loadingModal.classList.remove('hidden');
		if (loadingText) loadingText.textContent = message;
		if (loadingPercent) {
			if (percent !== null) {
				loadingPercent.style.display = 'block';
				loadingPercent.textContent = `${percent}%`;
			} else {
				loadingPercent.style.display = 'none';
			}
		}
	} else {
		loadingModal.classList.add('hidden');
		if (loadingPercent) loadingPercent.style.display = 'none';
	}
}

function showInfoModal(message, isError = false, onClose = null) {
	const successKeywords = ['éxito', 'confirmado', 'guardado', 'completado', 'subido', 'realizado', 'success'];
	const isSuccess = !isError && successKeywords.some(kw => message.toLowerCase().includes(kw));

	const infoModal = document.getElementById('info-modal');
	const infoText = document.getElementById('info-modal-text');

	if (!infoModal || !infoText) return;

	infoText.innerHTML = message;
	infoModal.classList.remove('hidden', 'error-style', 'success-style');
	infoModal.classList.add(isSuccess ? 'success-style' : isError ? 'error-style' : 'info-style');

	const closeButton = infoModal.querySelector('[data-close-modal="info-modal"]') || infoModal.querySelector('button');
	if (closeButton) {
		closeButton.onclick = () => {
			closeModal('info-modal');
			if (onClose) onClose();
		};
	}
}

function closeModal(modalId) {
	const modal = document.getElementById(modalId);
	if (modal) {
		modal.classList.add('hidden');
	}
}

function shuffleArray(array) {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

// --- Image Utilities ---
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Image failed to load: ${src}`));
		img.src = src;
	});
}

function showImageModal(src, gallery = [], index = 0) {
	const imageModal = document.getElementById('image-modal');
	const imageModalImg = document.getElementById('image-modal-img');
	const imageCounter = document.getElementById('image-counter');

	if (!imageModal || !imageModalImg) return;

	currentImageModalGallery = gallery;
	currentImageModalIndex = index;

	imageModalImg.src = src;
	imageModal.classList.remove('hidden');

	if (gallery.length > 1 && imageCounter) {
		imageCounter.textContent = `${index + 1} / ${gallery.length}`;
	}
}

function handleImageModalNext() {
	if (currentImageModalGallery.length === 0) return;
	currentImageModalIndex = (currentImageModalIndex + 1) % currentImageModalGallery.length;
	const imageModalImg = document.getElementById('image-modal-img');
	if (imageModalImg) {
		imageModalImg.src = currentImageModalGallery[currentImageModalIndex];
		const imageCounter = document.getElementById('image-counter');
		if (imageCounter) imageCounter.textContent = `${currentImageModalIndex + 1} / ${currentImageModalGallery.length}`;
	}
}

function handleImageModalPrev() {
	if (currentImageModalGallery.length === 0) return;
	currentImageModalIndex = (currentImageModalIndex - 1 + currentImageModalGallery.length) % currentImageModalGallery.length;
	const imageModalImg = document.getElementById('image-modal-img');
	if (imageModalImg) {
		imageModalImg.src = currentImageModalGallery[currentImageModalIndex];
		const imageCounter = document.getElementById('image-counter');
		if (imageCounter) imageCounter.textContent = `${currentImageModalIndex + 1} / ${currentImageModalGallery.length}`;
	}
}

// --- Event Listener Management ---
const eventListeners = [];

function clearEventListeners() {
	eventListeners.forEach(({ element, type, handler }) => {
		if (element && typeof element.removeEventListener === 'function') {
			element.removeEventListener(type, handler);
		}
	});
	eventListeners.length = 0;
}

function clearDynamicListListeners(listType) {
	const dynamicListeners = eventListeners.filter(l => l.dynamicType === listType);
	dynamicListeners.forEach(({ element, type, handler }) => {
		if (element && typeof element.removeEventListener === 'function') {
			element.removeEventListener(type, handler);
		}
	});
	eventListeners.splice(...[eventListeners.indexOf(dynamicListeners[0]), dynamicListeners.length]);
}

function addTrackedListener(element, type, handler, dynamicType = null) {
	if (!element || typeof element.addEventListener !== 'function') return;
	element.addEventListener(type, handler);
	eventListeners.push({ element, type, handler, dynamicType });
}

// --- Validation ---
const isValidHex = (color) => color && /^#[0-9A-F]{6}$/i.test(color);

// --- Find Functions ---
function findNextUpcomingEvent(events) {
	const now = new Date();
	return events.find(e => e && e.date && !e.isArchived && new Date(e.date) > now);
}

// All functions above are available in global scope automatically when script loads

