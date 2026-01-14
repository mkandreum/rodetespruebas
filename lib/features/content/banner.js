// === Banner Feature Module ===

import { domRefs } from '../../ui/dom-refs.js';
import { appState } from '../../core/state.js';

/**
 * Extract YouTube Video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID
 */
function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Render the home page banner video
 */
export function renderBannerVideo() {
    if (!domRefs.homeBannerContainer || !appState) return;
    const videoUrl = appState.bannerVideoUrl;

    if (videoUrl && videoUrl.includes('youtube.com/embed')) {
        domRefs.homeBannerContainer.innerHTML = `
				<div class="relative w-full pb-[56.25%] h-0 overflow-hidden shadow-2xl border-b-4 border-neon-pink">
					<iframe 
						src="${videoUrl}?autoplay=1&mute=1&loop=1&playlist=${extractVideoID(videoUrl)}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1" 
						frameborder="0" 
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
						allowfullscreen
						class="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
						title="Rodetes Party Promo">
					</iframe>
					<div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none"></div>
					<div class="absolute bottom-10 left-0 w-full text-center pointer-events-auto">
						<h1 class="text-6xl md:text-8xl font-pixel mb-4 text-neon-pink drop-shadow-[0_0_15px_rgba(240,45,125,0.8)] animate-pulse">
							RODETES PARTY
						</h1>
						<p class="text-white text-xl md:text-2xl font-pixel max-w-2xl mx-auto px-4 bg-black/50 p-2 rounded backdrop-blur-sm border border-neon-blue">
							La fiesta más icónica de Barcelona donde el arte drag, la música pop y el mejor ambiente se unen.
						</p>
					</div>
				</div>
			`;
    } else if (videoUrl) {
        // Video HTML5 directo (mp4) o fallback genérico si es otro tipo soportado
        domRefs.homeBannerContainer.innerHTML = `
				<div class="relative w-full h-[60vh] md:h-[80vh] overflow-hidden shadow-2xl border-b-4 border-neon-pink">
					<video autoplay muted loop playsinline class="absolute top-0 left-0 w-full h-full object-cover">
						<source src="${videoUrl}" type="video/mp4">
						Tu navegador no soporta video HTML5.
					</video>
					<div class="absolute inset-0 bg-black/40"></div> <!-- Overlay oscuro -->
					<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-4">
						<img id="header-logo-img-banner" src="${appState.appLogoUrl || 'img/logo_placeholder.png'}" alt="Rodetes Logo" class="mx-auto w-48 md:w-64 mb-6 drop-shadow-[0_0_20px_rgba(240,45,125,0.6)] animate-float">
						<h1 class="text-5xl md:text-7xl font-pixel text-white mb-2 text-glow-pink">RODETES PARTY</h1>
						<p class="text-xl md:text-2xl text-neon-blue font-pixel bg-black/60 inline-block px-4 py-2 rounded border border-neon-blue">
							DRAG • POP • FUN
						</p>
					</div>
				</div>
			`;
    } else {
        // Fallback si no hay video configurado
        domRefs.homeBannerContainer.innerHTML = `
			<div class="relative w-full h-[60vh] flex items-center justify-center bg-gray-900 border-b-4 border-neon-pink">
				<div class="text-center">
					<img src="${appState.appLogoUrl || 'img/logo_placeholder.png'}" alt="Rodetes Logo" class="mx-auto w-64 mb-8 opacity-80 animate-pulse">
					<h1 class="text-6xl font-pixel text-neon-pink">RODETES PARTY</h1>
				</div>
			</div>
		`;
    }
}
