// === Auth Logic Module ===

import { API_ENDPOINTS } from '../../core/config.js';
import { setIsLoggedIn, setAdminEmail, isLoggedIn } from '../../core/state.js'; // isLoggedIn needed?
import { showLoading, showInfoModal } from '../../ui/modals.js';
import { checkAdminUI, showPage, showAdminPage } from '../../ui/navigation.js';
import { stopScanner } from '../tickets/tickets-scanner.js';
import { domRefs } from '../../ui/dom-refs.js';

let adminTapCounter = 0; // Local var for tap counter logic if moved here? No, kept in nav.

/**
 * Handle Admin Login
 * @param {Event} e - Submit event
 */
export async function handleAdminLogin(e) {
    e.preventDefault();
    if (!domRefs.loginForm) return;

    const email = domRefs.loginForm.email.value.trim();
    const password = domRefs.loginForm.password.value;

    if (!email || !password) {
        showInfoModal("Introduce email y contraseña.", true);
        return;
    }

    showLoading(true);

    try {
        // Calculate SHA-256 hash
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, hash: passwordHash })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Error ${response.status}`);
        }

        if (result.success) {
            // Success!
            setIsLoggedIn(true);
            setAdminEmail(result.email || email);

            checkAdminUI();
            showAdminPage('events');
            domRefs.loginForm.reset();
        } else {
            throw new Error(result.message || 'Error desconocido en login.');
        }

    } catch (error) {
        console.error("Login error:", error);
        showInfoModal("Error de inicio de sesión: " + error.message, true);
        setIsLoggedIn(false);
        setAdminEmail('');
        checkAdminUI();
    } finally {
        showLoading(false);
    }
}

/**
 * Handle Logout
 * @param {boolean} showSuccess - Whether to show success modal
 */
export async function handleLogout(showSuccess = true) {
    showLoading(true);
    try {
        const response = await fetch(API_ENDPOINTS.LOGOUT, { method: 'POST' });

        if (!response.ok) {
            console.warn(`Logout request failed with status ${response.status}`);
        }

        setIsLoggedIn(false);
        setAdminEmail('');

        // Reset scanner if active
        try {
            stopScanner();
        } catch (e) {
            console.warn("Error stopping scanner during logout", e);
        }

        checkAdminUI();
        showPage('home');

        if (showSuccess) {
            showInfoModal("Sesión cerrada.", false);
        }

    } catch (error) {
        console.error("Logout error:", error);
        // Force logout state anyway
        setIsLoggedIn(false);
        checkAdminUI();
        showPage('home');
    } finally {
        showLoading(false);
    }
}

export { checkAdminUI } from '../../ui/navigation.js';
export { handleAdminLogin as handleLogin };
