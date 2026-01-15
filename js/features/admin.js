
import { store } from '../store.js';
import { LOGIN_URL, LOGOUT_URL } from '../config.js';
import { showInfoModal, showLoading } from '../ui.js';
import { showPage, showAdminPage } from '../router.js';
import { stopScanner } from './scanner.js';

let adminTapCounter = 0;

export async function handleAdminLogin(email, password) {
    showLoading(true);
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const res = await fetch(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, hash })
        });
        const result = await res.json();

        if (result.success) {
            store.isLoggedIn = true;
            store.adminEmail = result.email || email;
            checkAdminUI();
            showAdminPage('events');
        } else {
            throw new Error(result.message || "Login fallido");
        }
    } catch (e) {
        showInfoModal("Error de login: " + e.message, true);
    } finally {
        showLoading(false);
    }
}

export async function handleLogout() {
    showLoading(true);
    try {
        await fetch(LOGOUT_URL, { method: 'POST' });
    } catch (e) { console.warn(e); }

    store.isLoggedIn = false;
    store.adminEmail = '';
    adminTapCounter = 0; // Reset
    stopScanner();
    checkAdminUI();
    showPage('home');
    showInfoModal("Sesión cerrada.", false);
    showLoading(false);
}

export function checkAdminUI() {
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const mobileLink = document.querySelector('#mobile-menu a[data-nav="admin"]');

    if (store.isLoggedIn) {
        loginForm?.classList.add('hidden');
        adminPanel?.classList.remove('hidden');
        document.getElementById('admin-email').textContent = store.adminEmail;
        mobileLink?.classList.remove('hidden');
    } else {
        loginForm?.classList.remove('hidden');
        adminPanel?.classList.add('hidden');
        if (mobileLink && adminTapCounter < 5) mobileLink.classList.add('hidden');
    }
}

export function handleAdminMenuTap() {
    if (store.isLoggedIn) return;

    adminTapCounter++;
    console.log("Admin Tap:", adminTapCounter);

    if (adminTapCounter >= 5) {
        const mobileLink = document.querySelector('#mobile-menu a[data-nav="admin"]');
        if (mobileLink) {
            mobileLink.classList.remove('hidden');
            showInfoModal("¡Acceso Admin Revelado!", false);
        }
    }
}
