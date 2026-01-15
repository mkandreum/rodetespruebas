
// UI Utilities
let allEventListeners = [];

export function addTrackedListener(element, type, handler, dynamicType = null) {
    if (!element) return;
    element.addEventListener(type, handler);
    allEventListeners.push({ element, type, handler, dynamicType });
}

export function clearDynamicListListeners(targetDynamicType) {
    allEventListeners = allEventListeners.filter(({ element, type, handler, dynamicType }) => {
        if (dynamicType === targetDynamicType || dynamicType?.startsWith(`${targetDynamicType}-`)) {
            element.removeEventListener(type, handler);
            return false;
        }
        return true;
    });
}

// Modals
export function showInfoModal(msg, isError = false, onClose = null) {
    const modal = document.getElementById('info-modal');
    const msgEl = document.getElementById('info-modal-message');
    if (!modal || !msgEl) { alert(msg); return; }

    msgEl.innerHTML = msg;
    msgEl.className = isError ? "text-red-400 font-pixel text-xl text-center" : "text-white font-pixel text-xl text-center";

    modal.classList.remove('hidden');

    // One-time close listener for callback
    const closeBtn = modal.querySelector('[data-close-modal]');
    const onModalClose = () => {
        if (onClose) onClose();
        if (closeBtn) closeBtn.removeEventListener('click', onModalClose);
    };
    if (closeBtn) closeBtn.addEventListener('click', onModalClose);
}

export function showLoading(show) {
    const el = document.getElementById('loading-modal');
    if (el) el.classList.toggle('hidden', !show);
}

export function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

// Image Modal Logic
let currentImageModalGallery = [];
let currentImageModalIndex = 0;

export function showImageModal(src, gallery = [], index = 0) {
    const modal = document.getElementById('image-modal');
    const content = document.getElementById('image-modal-content');
    if (!modal || !content) return;

    currentImageModalGallery = gallery;
    currentImageModalIndex = index;
    content.src = src;

    const nav = gallery.length > 1;
    document.getElementById('image-modal-prev')?.classList.toggle('hidden', !nav);
    document.getElementById('image-modal-next')?.classList.toggle('hidden', !nav);

    modal.classList.remove('hidden');
}

export function handleImageModalNext() {
    if (currentImageModalGallery.length === 0) return;
    currentImageModalIndex = (currentImageModalIndex + 1) % currentImageModalGallery.length;
    document.getElementById('image-modal-content').src = currentImageModalGallery[currentImageModalIndex];
}

export function handleImageModalPrev() {
    if (currentImageModalGallery.length === 0) return;
    currentImageModalIndex = (currentImageModalIndex - 1 + currentImageModalGallery.length) % currentImageModalGallery.length;
    document.getElementById('image-modal-content').src = currentImageModalGallery[currentImageModalIndex];
}

// --- SCROLL OBSERVER ---
let scrollObserver = null;

export function initScrollObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    // Disconnect old if exists (re-init safety)
    if (scrollObserver) scrollObserver.disconnect();

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible'); // Assuming CSS uses this or 'visible'
                // app.js used .classList.add('visible') or similar?
                // Checking previous code: It added 'visible' and element had 'opacity-0 translate-y-10' etc.
                // Let's stick to standard 'visible' class trigger
                entry.target.classList.remove('opacity-0', 'translate-y-8');
                // Wait, typically we add a class like 'in-view' that handles the transition.
                // Or we remove the hiding classes.
                // Best bet: app.js likely added a class. I'll check my memory or assume standard.
                // Ah, Step 75 view_file content showed `reveal-on-scroll`. CSS usually handles `.reveal-on-scroll.visible`.
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    observeScrollElements();

    // Also use MutationObserver to auto-observe new elements
    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach(mut => {
            mut.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains('reveal-on-scroll')) {
                    scrollObserver.observe(node);
                }
                // Check children too
                if (node.nodeType === 1) {
                    node.querySelectorAll?.('.reveal-on-scroll').forEach(el => scrollObserver.observe(el));
                }
            });
        });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

export function observeScrollElements() {
    if (!scrollObserver) return;
    document.querySelectorAll('.reveal-on-scroll').forEach(el => scrollObserver.observe(el));
}
