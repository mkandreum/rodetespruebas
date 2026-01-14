// === Scroll Reveal Animations Module ===

let scrollObserver = null;

/**
 * Initialize the scroll reveal observer
 * @returns {IntersectionObserver} The observer instance
 */
export function initScrollRevealObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: unobserve if we only want animation once
                // scrollObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    console.log('Scroll reveal observer initialized');
    return scrollObserver;
}

/**
 * Observe all elements with the reveal-on-scroll class
 */
export function observeRevealElements() {
    if (!scrollObserver) {
        console.warn('Scroll observer not initialized. Call initScrollRevealObserver() first.');
        return;
    }

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });
}

/**
 * Get the current scroll observer instance
 * @returns {IntersectionObserver|null}
 */
export function getScrollObserver() {
    return scrollObserver;
}
