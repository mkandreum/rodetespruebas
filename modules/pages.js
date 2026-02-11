/**
 * modules/pages.js
 * Renderizado de páginas públicas (home, eventos, countdown, promos)
 */

// DOM element references
const homeEventListContainer = document.getElementById('home-event-list-container');
const eventListContainer = document.getElementById('event-list-container');
const nextEventPromoContainer = document.getElementById('next-event-promo-container');
const nextEventPromo = document.getElementById('next-event-promo');
const homeCountdownSection = document.getElementById('home-countdown-section');
const countdownTimer = document.getElementById('countdown-timer');
const countdownLabel = document.getElementById('countdown-label');
const countdownFooterDate = document.getElementById('countdown-footer-date');

let countdownInterval = null;
let currentEvents = [];

/**
 * Renderiza los eventos destacados en la página de inicio.
 */
function renderHomeEvents(events) {
	clearDynamicListListeners('homeEvents');
	if (!homeEventListContainer) return;
	homeEventListContainer.innerHTML = '';
	if (typeof observeRevealElements === 'function') observeRevealElements();

	if (!Array.isArray(events)) {
		homeEventListContainer.innerHTML = '<p class="text-red-400 text-center col-span-full font-pixel">Error al cargar eventos.</p>';
		return;
	}

	const now = new Date();
	const activeEvents = events
		.filter(e => e && !e.isArchived && e.date && new Date(e.date) > now)
		.sort((a, b) => new Date(a.date) - new Date(b.date));
	const nextActiveEvent = activeEvents[0] || null;

	const pastEvents = events
		.filter(e => e && !e.isArchived && e.date && new Date(e.date) < now)
		.sort((a, b) => new Date(b.date) - new Date(a.date));
	const mostRecentPastEvent = pastEvents[0] || null;

	const eventsToShow = [nextActiveEvent, mostRecentPastEvent].filter(Boolean);

	const allNonArchivedEventsCount = events.filter(e => e && !e.isArchived).length;
	const viewAllEventsContainer = document.getElementById('view-all-events-container');
	if (viewAllEventsContainer) {
		viewAllEventsContainer.classList.toggle('hidden', allNonArchivedEventsCount <= eventsToShow.length);
	}

	if (eventsToShow.length === 0) {
		homeEventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY EVENTOS PROGRAMADOS POR AHORA.</p>';
		return;
	}

	eventsToShow.forEach((event, index) => {
		try {
			const eventDate = new Date(event.date).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
			const isPastEvent = new Date(event.date) < now;
			const isNextEvent = nextActiveEvent && event.id === nextActiveEvent.id;

			let buttonHtml = '';
			let statusBadgeHtml = '';
			let cardBorderColor = 'border-white';
			let nextEventLabelHtml = '';
			let actionClass = '';
			let dataAttribute = `data-event-id="${event.id}"`;

			if (isNextEvent) {
				nextEventLabelHtml = `<div class="absolute top-0 left-0 text-white font-pixel text-sm px-2 py-1 rounded-none border-b border-r border-black z-10 shadow-md" style="background-color: #F02D7D;">PRÓXIMO EVENTO</div>`;
			} else if (isPastEvent) {
				statusBadgeHtml = '<div class="absolute top-0 left-0 bg-red-700 text-white font-pixel text-sm px-2 py-1 rounded-none border-b border-r border-black z-10 shadow-md">FINALIZADO</div>';
			}

			if (isPastEvent) {
				if (event.galleryImages && event.galleryImages.length > 0) {
					buttonHtml = `<button data-event-id="${event.id}" class="gallery-link-btn w-full neon-btn text-white font-pixel text-2xl py-3 px-4 rounded-none">VER GALERÍA</button>`;
					actionClass = 'gallery-link-btn cursor-pointer';
				} else {
					buttonHtml = `<button disabled class="w-full bg-gray-800 text-gray-500 font-pixel text-2xl py-3 px-4 rounded-none border border-gray-700 cursor-not-allowed">EVENTO FINALIZADO</button>`;
					dataAttribute = '';
				}
			} else {
				const capacity = event.ticketCapacity || 0;
				const sold = event.ticketsSold || 0;
				if (capacity > 0 && sold >= capacity) {
					buttonHtml = `<button disabled class="w-full bg-red-800 text-red-300 font-pixel text-2xl py-3 px-4 rounded-none border border-red-700 cursor-not-allowed">AGOTADO</button>`;
					dataAttribute = '';
				} else {
					buttonHtml = `<button data-event-id="${event.id}" class="get-ticket-btn w-full neon-btn font-pixel text-2xl py-3 px-4 rounded-none">CONSEGUIR ENTRADA</button>`;
					actionClass = 'get-ticket-btn cursor-pointer';
				}
			}

			const card = document.createElement('div');
			card.className = `relative bg-gray-900 rounded-none ${cardBorderColor} overflow-hidden flex flex-col transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300 reveal-on-scroll`;

			const imageUrl = event.posterImageUrl || `https://placehold.co/400x200/000000/ffffff?text=${encodeURIComponent(event.name || 'Evento')}&font=vt323`;
			const price = (event.price || 0).toFixed(2);
			const loadingAttr = index === 0 ? 'eager' : 'lazy';

			card.innerHTML = `
				${nextEventLabelHtml || statusBadgeHtml}
				<div class="w-full bg-black border-b ${cardBorderColor} overflow-hidden ${actionClass}" ${dataAttribute}>
					<img src="${imageUrl}" alt="${event.name || 'Evento'}" loading="${loadingAttr}" class="w-full ${isPastEvent ? 'opacity-60' : ''}" onerror="this.onerror=null;this.src='https://placehold.co/400x200/000/fff?text=Error&font=vt323';">
				</div>
				<div class="p-6 flex flex-col flex-grow">
					<h3 class="text-3xl font-pixel ${isPastEvent ? 'text-gray-500' : 'text-white text-glow-white'} mb-2 ${actionClass} glitch-hover" ${dataAttribute}>
					   ${event.name || 'Evento sin nombre'}
					</h3>
					<p class="text-gray-400 font-semibold font-pixel text-lg mb-3">${eventDate || 'Fecha no disponible'}</p>
					
					${!isPastEvent ? `<div class="event-countdown font-pixel text-neon-pink text-lg mb-3" data-date="${event.date}"></div>` : ''}
					
					<p class="text-4xl font-extrabold ${isPastEvent ? 'text-gray-600' : 'text-white'} mb-4">${price} €</p>
					<p class="text-gray-400 mb-6 flex-grow" style="white-space: pre-wrap;">${event.description || 'Sin descripción.'}</p>				
					${buttonHtml}
				</div>
			`;
			homeEventListContainer.appendChild(card);
		} catch (e) {
			console.error(`Error renderizando evento ${event?.id}:`, e);
		}
	});

	homeEventListContainer.querySelectorAll('.get-ticket-btn').forEach(btn => addTrackedListener(btn, 'click', handleGetTicket));
	homeEventListContainer.querySelectorAll('.gallery-link-btn').forEach(btn => addTrackedListener(btn, 'click', handleGalleryLink));

	if (typeof observeRevealElements === 'function') observeRevealElements();
	if (typeof startEventCountdowns === 'function') startEventCountdowns();
}

/**
 * Renderiza todos los eventos públicos no archivados.
 */
function renderPublicEvents(events) {
	clearDynamicListListeners('publicEvents');
	if (!eventListContainer) return;
	eventListContainer.innerHTML = '';

	if (!Array.isArray(events)) {
		eventListContainer.innerHTML = '<p class="text-red-400 text-center col-span-full font-pixel">Error al cargar eventos.</p>';
		return;
	}

	const now = new Date();
	const eventsToShow = events
		.filter(e => e && !e.isArchived)
		.sort((a, b) => (b.date && a.date) ? new Date(b.date) - new Date(a.date) : 0);

	if (eventsToShow.length === 0) {
		eventListContainer.innerHTML = '<p class="text-gray-400 text-center col-span-full font-pixel">NO HAY EVENTOS PROGRAMADOS POR AHORA.</p>';
		return;
	}

	eventsToShow.forEach(event => {
		try {
			const eventDate = event.date ? new Date(event.date).toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha no disponible';
			const isPastEvent = event.date ? new Date(event.date) < now : false;

			let buttonHtml = '';
			let statusBadgeHtml = '';
			let cardBorderColor = 'border-white';
			let actionClass = '';
			let dataAttribute = `data-event-id="${event.id}"`;

			if (isPastEvent) {
				statusBadgeHtml = '<div class="absolute top-0 left-0 bg-red-700 text-white font-pixel text-sm px-2 py-1 rounded-none border-b border-r border-black z-10 shadow-md">FINALIZADO</div>';
				if (event.galleryImages && event.galleryImages.length > 0) {
					buttonHtml = `<button data-event-id="${event.id}" class="gallery-link-btn w-full neon-btn text-white font-pixel text-2xl py-3 px-4 rounded-none">VER GALERÍA</button>`;
					actionClass = 'gallery-link-btn cursor-pointer';
				} else {
					buttonHtml = `<button disabled class="w-full bg-gray-800 text-gray-500 font-pixel text-2xl py-3 px-4 rounded-none border border-gray-700 cursor-not-allowed">EVENTO FINALIZADO</button>`;
					dataAttribute = '';
				}
			} else {
				const capacity = event.ticketCapacity || 0;
				const sold = event.ticketsSold || 0;
				if (capacity > 0 && sold >= capacity) {
					buttonHtml = `<button disabled class="w-full bg-red-800 text-red-300 font-pixel text-2xl py-3 px-4 rounded-none border border-red-700 cursor-not-allowed">AGOTADO</button>`;
					dataAttribute = '';
				} else {
					buttonHtml = `<button data-event-id="${event.id}" class="get-ticket-btn w-full neon-btn font-pixel text-2xl py-3 px-4 rounded-none">CONSEGUIR ENTRADA</button>`;
					actionClass = 'get-ticket-btn cursor-pointer';
				}
			}

			const card = document.createElement('div');
			card.className = `relative bg-gray-900 rounded-none ${cardBorderColor} overflow-hidden flex flex-col transform transition-all hover:border-gray-300 hover:shadow-white/30 duration-300 reveal-on-scroll`;

			const imageUrl = event.posterImageUrl || `https://placehold.co/400x200/000000/ffffff?text=${encodeURIComponent(event.name || 'Evento')}&font=vt323`;
			const price = (event.price || 0).toFixed(2);

			card.innerHTML = `
				${statusBadgeHtml}
				<div class="w-full bg-black border-b ${cardBorderColor} overflow-hidden ${actionClass}" ${dataAttribute}>
					<img src="${imageUrl}" alt="${event.name || 'Evento'}" class="w-full ${isPastEvent ? 'opacity-60' : ''}" onerror="this.onerror=null;this.src='https://placehold.co/400x200/000/fff?text=Error&font=vt323';">
				</div>
				<div class="p-6 flex flex-col flex-grow">
					 <h3 class="text-3xl font-pixel ${isPastEvent ? 'text-gray-500' : 'text-white text-glow-white'} mb-2 ${actionClass} glitch-hover" ${dataAttribute}>
						${event.name || 'Evento sin nombre'}
					 </h3>
					 <p class="text-gray-400 font-semibold font-pixel text-lg mb-3">${eventDate}</p>
					 
					 ${!isPastEvent ? `<div class="event-countdown font-pixel text-neon-pink text-lg mb-3" data-date="${event.date}"></div>` : ''}
					 
					 <p class="text-4xl font-extrabold ${isPastEvent ? 'text-gray-600' : 'text-white'} mb-4">${price} €</p>
					 <p class="text-gray-400 mb-6 flex-grow" style="white-space: pre-wrap;">${event.description || 'Sin descripción.'}</p>
					${buttonHtml}
				</div>
			`;
			eventListContainer.appendChild(card);
		} catch (e) {
			console.error(`Error renderizando evento ${event?.id}:`, e);
		}
	});

	eventListContainer.querySelectorAll('.get-ticket-btn').forEach(btn => addTrackedListener(btn, 'click', handleGetTicket));
	eventListContainer.querySelectorAll('.gallery-link-btn').forEach(btn => addTrackedListener(btn, 'click', handleGalleryLink));

	if (typeof observeRevealElements === 'function') observeRevealElements();
	if (typeof startEventCountdowns === 'function') startEventCountdowns();
}

/**
 * Renderiza el logo de la app.
 */
function renderAppLogo() {
	const logoContainer = document.getElementById('app-logo-container');
	if (!logoContainer || !appState) return;

	logoContainer.innerHTML = '';
	const logoUrl = appState.appLogoUrl || '';

	if (logoUrl) {
		const img = document.createElement('img');
		img.src = logoUrl;
		img.alt = 'Logo';
		img.className = 'h-full w-auto object-contain';
		img.onerror = () => {
			logoContainer.textContent = '🎭 Rodetes Party';
			logoContainer.className = 'font-pixel text-xl text-white';
		};
		logoContainer.appendChild(img);
	} else {
		logoContainer.textContent = '🎭 Rodetes Party';
		logoContainer.className = 'font-pixel text-xl text-white';
	}
}

/**
 * Renderiza la promo del próximo evento.
 */
function renderNextEventPromo() {
	if (!nextEventPromo || !nextEventPromoContainer || !appState) return;

	nextEventPromo.innerHTML = '';

	const nextEvent = findNextUpcomingEvent(currentEvents);
	const defaultColor = '#F02D7D';
	const isValidHex = (color) => color && /^#[0-9A-F]{6}$/i.test(color);
	const neonColor = isValidHex(appState.promoNeonColor) ? appState.promoNeonColor : defaultColor;

	if (nextEvent && appState.promoEnabled) {
		try {
			const eventDate = new Date(nextEvent.date);
			const shortDate = eventDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
			const fullDate = eventDate.toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

			let promoText = appState.promoCustomText || '¡PRÓXIMO EVENTO: {eventName} - {eventDate}! Consigue tus entradas ya.';

			promoText = promoText.replace('{eventName}', nextEvent.name || 'Evento');
			promoText = promoText.replace('{eventDate}', fullDate || 'Próximamente');
			promoText = promoText.replace('{eventShortDate}', shortDate || '??/??');
			promoText = promoText.replace('{eventPrice}', `${(nextEvent.price || 0).toFixed(2)}€`);

			document.documentElement.style.setProperty('--promo-neon-color', neonColor);

			const span = document.createElement('span');
			span.textContent = promoText;
			nextEventPromo.appendChild(span);

			nextEventPromoContainer.classList.add('promo-visible');
			document.body.classList.add('promo-active');

		} catch (e) {
			console.error("Error formateando promo:", e);
			nextEventPromoContainer.classList.remove('promo-visible');
			document.body.classList.remove('promo-active');
		}
	} else {
		nextEventPromoContainer.classList.remove('promo-visible');
		document.body.classList.remove('promo-active');
	}
}

/**
 * Renderiza la cuenta atrás hacia una fecha objetivo.
 */
function renderCountdown() {
	if (!homeCountdownSection || !appState) return;

	const now = new Date();
	const nextActiveEvent = currentEvents && currentEvents.find(e => e && !e.isArchived && e.date && new Date(e.date) > now);

	if (appState.countdownEnabled && appState.countdownTargetDate && !nextActiveEvent) {
		homeCountdownSection.classList.remove('hidden');
		if (countdownLabel) countdownLabel.textContent = appState.countdownTitle || 'PRÓXIMO EVENTO';
		if (countdownFooterDate) countdownFooterDate.textContent = appState.countdownDateText || '';

		startCountdownTimer();
	} else {
		homeCountdownSection.classList.add('hidden');
		if (countdownInterval) clearInterval(countdownInterval);
	}
}

/**
 * Inicia el temporizador de cuenta atrás.
 */
function startCountdownTimer() {
	if (countdownInterval) clearInterval(countdownInterval);

	const targetDate = new Date(appState.countdownTargetDate).getTime();

	function updateTimer() {
		const now = new Date().getTime();
		const distance = targetDate - now;

		if (distance < 0) {
			if (countdownTimer) countdownTimer.textContent = "00:00:00:00";
			clearInterval(countdownInterval);
			if (typeof renderNextEventPromo === 'function') renderNextEventPromo();
			return;
		}

		const days = Math.floor(distance / (1000 * 60 * 60 * 24));
		const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((distance % (1000 * 60)) / 1000);

		if (countdownTimer) {
			countdownTimer.textContent =
				(days < 10 ? "0" : "") + days + ":" +
				(hours < 10 ? "0" : "") + hours + ":" +
				(minutes < 10 ? "0" : "") + minutes + ":" +
				(seconds < 10 ? "0" : "") + seconds;
		}
	}

	updateTimer();
	countdownInterval = setInterval(updateTimer, 1000);
}

/**
 * Renderiza el banner de vídeo en la página de inicio.
 */
function renderBannerVideo() {
	const homeBannerContainer = document.getElementById('home-banner-container');
	if (!homeBannerContainer || !appState) return;
	homeBannerContainer.innerHTML = '';

	const url = appState.bannerVideoUrl || "";
	console.log("Rendering Banner with URL:", url);

	if (!url) {
		homeBannerContainer.innerHTML = '<div class="absolute inset-0 flex items-center justify-center bg-black text-gray-500 font-pixel">Banner no configurado</div>';
		return;
	}

	const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.startsWith('uploads/') || url.startsWith('data:image');
	const isVideoUrl = /\.(mp4|webm|ogv)$/i.test(url) || (url.startsWith('uploads/') && !isImageUrl) || url.startsWith('data:video');
	
	// Validate embed URLs more securely by checking the hostname exactly
	let isEmbedUrl = false;
	if (url.includes('/embed/') || url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo')) {
		try {
			const urlObj = new URL(url);
			const hostname = urlObj.hostname.toLowerCase();
			// Check if hostname exactly matches or ends with trusted domain
			isEmbedUrl = hostname === 'youtube.com' || hostname.endsWith('.youtube.com') ||
			             hostname === 'youtu.be' || hostname.endsWith('.youtu.be') ||
			             hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com') ||
			             hostname === 'youtube-nocookie.com' || hostname.endsWith('.youtube-nocookie.com');
		} catch (e) {
			isEmbedUrl = false;
		}
	}

	let element;
	let fallbackDiv;
	const setupFallback = (elementType) => {
		fallbackDiv = document.createElement('div');
		fallbackDiv.className = "absolute inset-0 flex items-center justify-center bg-black text-gray-500 font-pixel text-lg";
		fallbackDiv.textContent = `Cargando ${elementType}...`;
		homeBannerContainer.appendChild(fallbackDiv);
		let loadTimeout;

		const showFallbackMessage = (message) => {
			if (fallbackDiv) {
				fallbackDiv.textContent = message;
				fallbackDiv.style.display = 'flex';
			}
			clearTimeout(loadTimeout);
		};
		const hideFallbackMessage = () => {
			if (fallbackDiv) fallbackDiv.style.display = 'none';
			clearTimeout(loadTimeout);
		};

		loadTimeout = setTimeout(() => {
			if (fallbackDiv && fallbackDiv.style.display !== 'none') {
				showFallbackMessage(`Error: Timeout al cargar ${elementType}.`);
			}
		}, 10000);

		return { showFallbackMessage, hideFallbackMessage };
	};

	try {
		if (isImageUrl) {
			const { showFallbackMessage, hideFallbackMessage } = setupFallback('imagen');
			element = document.createElement('img');
			element.src = url;
			element.alt = "Banner Principal";
			element.className = "absolute top-0 left-0 w-full h-full object-cover border-0";
			element.onload = hideFallbackMessage;
			element.onerror = () => showFallbackMessage('Error al cargar imagen.');
		} else if (isVideoUrl) {
			const { showFallbackMessage, hideFallbackMessage } = setupFallback('vídeo');
			element = document.createElement('video');
			element.src = url;
			element.className = "absolute top-0 left-0 w-full h-full object-cover border-0";
			element.autoplay = true; element.loop = true; element.muted = true; element.playsInline = true;
			element.onloadeddata = hideFallbackMessage;
			element.onerror = (e) => {
				console.error('Video Error:', e, 'Source:', element.src.substring(0, 50) + '...');
				let errorMsg = 'Error al cargar vídeo';
				if (element.error) {
					switch (element.error.code) {
						case MediaError.MEDIA_ERR_ABORTED: errorMsg += ' (Abortado)'; break;
						case MediaError.MEDIA_ERR_NETWORK: errorMsg += ' (Error de red)'; break;
						case MediaError.MEDIA_ERR_DECODE: errorMsg += ' (Error de decodificación)'; break;
						case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: errorMsg += ' (Formato no soportado)'; break;
						default: errorMsg += ` (Código ${element.error.code})`; break;
					}
				}
				showFallbackMessage(errorMsg);
			};
		} else if (isEmbedUrl) {
			element = document.createElement('iframe');
			let embedUrl = url;
			if (url.includes('youtube.com/watch')) {
				const videoId = new URL(url).searchParams.get('v');
				if (videoId) embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
			} else if (url.includes('youtu.be/')) {
				const videoId = new URL(url).pathname.substring(1);
				if (videoId) embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
			}
			element.src = embedUrl;
			element.className = "absolute top-0 left-0 w-full h-full border-0";
			element.style.border = 'none';
			element.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
			element.setAttribute('allowfullscreen', '');
		} else {
			homeBannerContainer.innerHTML = `<div class="absolute inset-0 flex items-center justify-center bg-black text-yellow-500 font-pixel">Tipo de URL no soportado: ${url.substring(0, 30)}...</div>`;
			return;
		}

		if (element) {
			homeBannerContainer.appendChild(element);
		}
	} catch (e) {
		console.error("Error creando elemento de banner:", e);
		homeBannerContainer.innerHTML = '<div class="absolute inset-0 flex items-center justify-center bg-black text-red-500 font-pixel">Error al mostrar banner</div>';
	}
}

/**
 * Inicia los contadores de cuenta atrás para eventos.
 */
function startEventCountdowns() {
	if (window.eventCountdownInterval) clearInterval(window.eventCountdownInterval);

	const updateCountdowns = () => {
		const now = new Date().getTime();
		document.querySelectorAll('.event-countdown').forEach(el => {
			const dateStr = el.dataset.date;
			if (!dateStr) return;

			const targetDate = new Date(dateStr).getTime();
			const distance = targetDate - now;

			if (distance < 0) {
				el.innerHTML = "¡ES HOY!";
				el.classList.add('animate-pulse');
				return;
			}

			const days = Math.floor(distance / (1000 * 60 * 60 * 24));
			const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((distance % (1000 * 60)) / 1000);

			el.innerHTML = `<span class="text-[#F02D7D] font-bold text-xs" style="text-shadow: 0 0 2px #F02D7D;">FALTAN:</span> <span class="text-[#00FFFF] font-bold ml-1 text-glow-cyan">${days}d ${hours}h ${minutes}m ${seconds}s</span>`;
		});
	};

	updateCountdowns();
	window.eventCountdownInterval = setInterval(updateCountdowns, 1000);
}

