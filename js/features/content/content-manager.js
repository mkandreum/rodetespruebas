// === Content Manager Feature Module ===

import { API_ENDPOINTS } from '../../core/constants.js';
import { appState, setAllTickets, setAllMerchSales, allTickets, allMerchSales } from '../../core/state.js';
import { saveAppState, saveTicketState, saveMerchSalesState } from '../../api/init.js'; //init.js loads data but specific api files save it
import { saveTicketsState as apiSaveTickets } from '../../api/tickets-api.js'; // Fix import name
import { saveMerchSalesState as apiSaveMerch } from '../../api/merch-api.js';
import { saveAppState as apiSaveApp } from '../../api/app-state-api.js';

import { domRefs } from '../../ui/dom-refs.js';
import { showLoading, showInfoModal, renderAdminGalleryGrid } from '../../ui/modals.js';
import { readFileAsArrayBuffer, readFileAsText } from '../../utils/file-readers.js';

import { renderAppLogo } from './logo.js';
import { renderBannerVideo } from './banner.js';
import { renderNextEventPromo } from './promo.js';

// Import all renderers for full restore refresh
import { renderAdminEvents } from '../events/events-admin.js';
import { renderAdminDrags } from '../drags/drags-admin.js';
import { renderAdminMerch } from '../merch/merch-admin.js';
import { renderGiveawayEvents } from '../giveaway/giveaway.js';
import { renderPublicEvents, renderHomeEvents } from '../events/events-public.js';
import { renderDragList } from '../drags/drags-public.js';
import { renderGalleryEventList, renderPastGalleries } from '../gallery/gallery-public.js';
import { handleLogout } from '../auth/auth.js';


/**
 * Load content into Admin UI forms
 */
export function loadContentToAdmin() {
    if (!appState) return;

    if (domRefs.appLogoUrlInput) domRefs.appLogoUrlInput.value = appState.appLogoUrl || '';
    if (domRefs.ticketLogoUrlInput) domRefs.ticketLogoUrlInput.value = appState.ticketLogoUrl || '';
    if (domRefs.bannerUrlInput) domRefs.bannerUrlInput.value = appState.bannerVideoUrl || '';
    if (domRefs.promoEnableCheckbox) domRefs.promoEnableCheckbox.checked = appState.promoEnabled || false;
    if (domRefs.promoTextInput) domRefs.promoTextInput.value = appState.promoCustomText || '';
    if (domRefs.promoNeonColorInput) domRefs.promoNeonColorInput.value = appState.promoNeonColor || '#F02D7D';

    const allowedDomains = appState.allowedDomains || [];
    const domainsInput = document.getElementById('allowed-domains-input');
    if (domainsInput) {
        domainsInput.value = allowedDomains.join('\n');
    }

    // Update hidden sections UI logic (toggle promo input visibility if needed)
    // (Original code didn't have listener for checkbox but good practice)
}

/**
 * Handle Save Content Form Submit
 */
export async function handleSaveContent(e) {
    e.preventDefault();
    if (!domRefs.contentManageForm || !appState) return;

    const newAppLogoUrl = domRefs.appLogoUrlInput?.value.trim() || '';
    const newTicketLogoUrl = domRefs.ticketLogoUrlInput?.value.trim() || '';
    const newBannerUrl = domRefs.bannerUrlInput?.value.trim() || '';
    const newPromoEnabled = domRefs.promoEnableCheckbox?.checked || false;
    const newPromoText = domRefs.promoTextInput?.value.trim() || '';
    const newPromoNeonColor = domRefs.promoNeonColorInput?.value.trim() || '#F02D7D';

    const domainsInput = document.getElementById('allowed-domains-input');
    const newAllowedDomains = (domainsInput?.value || '')
        .split('\n')
        .map(d => d.trim().toLowerCase())
        .filter(d => d.startsWith('@'));

    showLoading(true);
    try {
        const validateUrl = (url, fieldName) => {
            if (url && !/^(https?:\/\/|uploads\/|data:)/i.test(url)) {
                throw new Error(`URL de ${fieldName} no válida. Debe empezar con http://, https://, uploads/ o data:.`);
            }
        };

        validateUrl(newAppLogoUrl, "Logo Principal");
        validateUrl(newTicketLogoUrl, "Logo de Entrada");
        validateUrl(newBannerUrl, "Banner");

        if (!/^#[0-9A-F]{6}$/i.test(newPromoNeonColor)) {
            throw new Error("El color neón debe ser un código hexadecimal válido (ej: #F02D7D).");
        }

        appState.appLogoUrl = newAppLogoUrl;
        appState.ticketLogoUrl = newTicketLogoUrl;
        appState.bannerVideoUrl = newBannerUrl;
        appState.promoEnabled = newPromoEnabled;
        appState.promoCustomText = newPromoText;
        appState.promoNeonColor = newPromoNeonColor;
        appState.allowedDomains = newAllowedDomains;

        // Save using specific API module
        await apiSaveApp();

        renderAppLogo();
        renderBannerVideo();
        renderNextEventPromo();

        showLoading(false);
        showInfoModal("¡CONTENIDO GENERAL ACTUALIZADO!", false);

        if (domRefs.appLogoUploadInput) domRefs.appLogoUploadInput.value = '';
        if (domRefs.ticketLogoUploadInput) domRefs.ticketLogoUploadInput.value = '';
        if (domRefs.bannerUploadInput) domRefs.bannerUploadInput.value = '';

    } catch (error) {
        console.error("Error saving content:", error);
        showLoading(false);
        showInfoModal(`Error al guardar contenido: ${error.message}`, true);
    }
}

/**
 * Handle Single File Upload
 */
export async function handleFileUpload(event, targetInput) {
    const file = event.target.files?.[0];
    if (!file || !targetInput) return;

    let acceptTypes = ['image/'];
    let fileTypeForUpload = 'image';
    const isBannerInput = targetInput === domRefs.bannerUrlInput;

    if (isBannerInput) {
        acceptTypes = ['image/', 'video/mp4', 'video/webm'];
        if (file.type.startsWith('video/')) {
            fileTypeForUpload = 'video';
        }
    }

    if (!acceptTypes.some(type => file.type.startsWith(type))) {
        showInfoModal(`Tipo de archivo no permitido. ${isBannerInput ? 'Sube imagen o vídeo MP4/WebM.' : 'Sube una imagen.'}`, true);
        event.target.value = ''; return;
    }

    const maxSizeMB = fileTypeForUpload === 'video' ? 10 : 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        showInfoModal(`Archivo "${file.name}" demasiado grande (Máx ${maxSizeMB}MB).`, true);
        event.target.value = ''; return;
    }

    showLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileTypeForUpload);

    try {
        const response = await fetch(API_ENDPOINTS.UPLOAD, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            let errorMessage = `Error HTTP ${response.status}.`;
            if (response.status === 403) {
                errorMessage = "Acceso denegado. Tu sesión puede haber expirado.";
                handleLogout(false);
            } else if (result && result.message) {
                errorMessage = result.message;
            }
            throw new Error(errorMessage);
        }

        if (result.success && result.url) {
            targetInput.value = result.url;
            showInfoModal(`${fileTypeForUpload === 'video' ? 'Vídeo' : 'Imagen'} "${file.name}" subido. Guarda los cambios del formulario.`, false);
        } else {
            throw new Error(result.message || 'Error desconocido del servidor al subir.');
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        showInfoModal(`Error al subir "${file.name}": ${error.message}`, true);
        event.target.value = '';
    } finally {
        showLoading(false);
    }
}

/**
 * Handle Multiple File Upload
 */
export async function handleMultipleFileUpload(event, hiddenInputId, gridContainerId) {
    const files = event.target.files;
    const targetHiddenInput = document.getElementById(hiddenInputId);

    if (!files || files.length === 0 || !targetHiddenInput) return;

    showLoading(true);
    const uploadPromises = [];
    let successCount = 0;
    let errorCount = 0;
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            console.warn("Omitiendo archivo no imagen:", file.name);
            errorCount++;
            showInfoModal(`"${file.name}" no es una imagen y fue omitido.`, true);
            continue;
        }
        if (file.size > maxSizeBytes) {
            console.warn(`Omitiendo archivo grande: ${file.name} (Máx ${maxSizeMB}MB)`);
            errorCount++;
            showInfoModal(`Error: "${file.name}" excede el límite (${maxSizeMB}MB).`, true);
            continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'image');

        uploadPromises.push(
            fetch(API_ENDPOINTS.UPLOAD, { method: 'POST', body: formData })
                .then(response => response.json().then(result => ({ ok: response.ok, status: response.status, result })))
                .then(({ ok, status, result }) => {
                    if (ok && result.success && result.url) {
                        successCount++;
                        return result.url;
                    } else {
                        errorCount++;
                        let errorMessage = `Error subiendo ${file.name}: `;
                        if (status === 403) errorMessage += "Acceso denegado (sesión?).";
                        else errorMessage += result.message || `Error HTTP ${status}.`;
                        console.warn(errorMessage);
                        showInfoModal(errorMessage, true);
                        return null;
                    }
                })
                .catch(err => {
                    errorCount++;
                    console.error(`Error de red subiendo ${file.name}:`, err);
                    showInfoModal(`Error de red subiendo ${file.name}.`, true);
                    return null;
                })
        );
    }

    try {
        const results = await Promise.all(uploadPromises);
        const newUrls = results.filter(url => url !== null);

        if (newUrls.length > 0) {
            const existingUrls = targetHiddenInput.value.trim();
            targetHiddenInput.value = existingUrls + (existingUrls ? '\n' : '') + newUrls.join('\n');

            if (gridContainerId) {
                const currentUrls = targetHiddenInput.value.split('\n').filter(Boolean);
                renderAdminGalleryGrid(gridContainerId, hiddenInputId, currentUrls);
            }
        }

        let message = `${successCount} imágen(es) añadida(s) a la lista.`;
        if (errorCount > 0) message += ` (${errorCount} fallaron o fueron omitidas).`;
        if (successCount > 0) message += " Pulsa Guardar para confirmar los cambios.";
        showInfoModal(message, errorCount > 0 && successCount === 0);

    } catch (error) {
        console.error("Error procesando subidas múltiples:", error);
        showInfoModal("Error inesperado al procesar las subidas.", true);
    } finally {
        showLoading(false);
        event.target.value = '';
    }
}

/**
 * Create Backup ZIP
 */
export async function handleBackup() {
    if (typeof JSZip === 'undefined') {
        showInfoModal("Error: Librería JSZip no cargada para crear backup.", true); return;
    }

    showLoading(true);
    try {
        const stateToBackup = {
            ...appState,
            events: (appState.events || []).map(event => {
                const { purchasedTickets, ...eventToSave } = event; return eventToSave;
            })
        };
        const jsonStringAppState = JSON.stringify(stateToBackup, null, 2);
        const jsonStringTickets = JSON.stringify(allTickets || [], null, 2);
        const jsonStringMerchSales = JSON.stringify(allMerchSales || [], null, 2);

        const zip = new JSZip();
        zip.file("datos_app.json", jsonStringAppState);
        zip.file("entradas_db.json", jsonStringTickets);
        zip.file("merch_vendido.json", jsonStringMerchSales);

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        link.download = `rodetes_backup_${dateStr}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showLoading(false);
        showInfoModal("Respaldo ZIP completo descargado.", false);

    } catch (error) {
        showLoading(false);
        console.error("Error creating zip backup:", error);
        showInfoModal("Error al crear el respaldo ZIP: " + error.message, true);
    }
}

/**
 * Restore from Backup
 */
export async function handleRestore(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    showLoading(true);
    let restoredState = null;
    let restoredTickets = null;
    let restoredMerchSales = null;

    try {
        if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
            if (typeof JSZip === 'undefined') {
                throw new Error("Librería JSZip no cargada para leer .zip.");
            }
            console.log("Restaurando desde archivo ZIP...");
            const zipData = await readFileAsArrayBuffer(file);
            const zip = await JSZip.loadAsync(zipData);

            const appFile = zip.file("datos_app.json");
            const ticketsFile = zip.file("entradas_db.json");
            const merchSalesFile = zip.file("merch_vendido.json");

            if (!appFile || !ticketsFile) {
                throw new Error("El ZIP debe contener 'datos_app.json' y 'entradas_db.json'.");
            }

            const appString = await appFile.async("string");
            const ticketsString = await ticketsFile.async("string");
            const merchSalesString = merchSalesFile ? await merchSalesFile.async("string") : '[]';

            restoredState = JSON.parse(appString);
            restoredTickets = JSON.parse(ticketsString);
            restoredMerchSales = JSON.parse(merchSalesString);

        } else if (file.type === 'application/json') {
            console.log("Restaurando desde archivo JSON (formato antiguo)...");
            const jsonString = await readFileAsText(file);
            const oldState = JSON.parse(jsonString);

            if (!oldState || typeof oldState !== 'object' || !Array.isArray(oldState.events)) {
                throw new Error("El archivo JSON antiguo no tiene el formato esperado.");
            }

            restoredTickets = [];
            if (oldState.events) {
                oldState.events.forEach(event => {
                    if (event.purchasedTickets && typeof event.purchasedTickets === 'object') {
                        Object.keys(event.purchasedTickets).forEach(email => {
                            const ticket = event.purchasedTickets[email];
                            if (ticket && ticket.ticketId && ticket.quantity) {
                                restoredTickets.push({
                                    ticketId: ticket.ticketId, eventId: event.id,
                                    email: email, quantity: ticket.quantity
                                });
                            }
                        });
                    }
                    delete event.purchasedTickets;
                });
            }

            restoredState = oldState;
            restoredMerchSales = [];

        } else {
            throw new Error("Tipo de archivo no soportado. Sube un .zip o .json.");
        }

        if (!restoredState || typeof restoredState !== 'object' || !Array.isArray(restoredState.events)) {
            throw new Error("Datos de 'datos_app.json' inválidos o corruptos.");
        }
        if (!Array.isArray(restoredTickets)) {
            throw new Error("Datos de 'entradas_db.json' inválidos o corruptos.");
        }
        if (!Array.isArray(restoredMerchSales)) {
            throw new Error("Datos de 'merch_vendido.json' inválidos o corruptos.");
        }

        console.log("Datos restaurados validados. Aplicando...");

        // Update State Locally
        // Clear current appState and assign restored properties
        Object.keys(appState).forEach(key => delete appState[key]);
        Object.assign(appState, restoredState);

        // Ensure minimum structure
        appState.events = appState.events || [];
        appState.drags = appState.drags || [];
        appState.webMerch = appState.webMerch || [];
        appState.allowedDomains = appState.allowedDomains || [];
        appState.nextEventId = appState.nextEventId || 1;
        appState.nextDragId = appState.nextDragId || 1;
        appState.nextMerchItemId = appState.nextMerchItemId || 1;
        appState.scannedTickets = appState.scannedTickets || {};

        setAllTickets(restoredTickets);
        setAllMerchSales(restoredMerchSales);

        // Save to Server
        await apiSaveApp();
        await apiSaveTickets();
        await apiSaveMerch();

        // Refresh UI
        renderAppLogo();
        renderBannerVideo();
        renderNextEventPromo();
        loadContentToAdmin();
        renderAdminEvents(appState.events);
        renderAdminDrags(appState.drags);
        renderAdminMerch();
        renderGiveawayEvents(appState.events);
        renderPublicEvents(appState.events);
        renderDragList();
        renderGalleryEventList();
        renderPastGalleries(appState.events);
        renderHomeEvents(appState.events);

        showLoading(false);
        showInfoModal("¡SISTEMA RESTAURADO Y GUARDADO CON ÉXITO!", false);

    } catch (error) {
        showLoading(false);
        console.error("Error restoring backup:", error);
        showInfoModal("Error al restaurar: " + error.message, true);
    } finally {
        event.target.value = ''; // Clean input
    }
}
