
# Informe de Refactorización: Modularización de Rodetes App

**Fecha:** 15 de Enero de 2026
**Estado:** COMPLETADO / VERIFICADO
**Objetivo:** Migrar la lógica monolítica de `app.js` (4952 líneas) a una arquitectura modular moderna sin perder funcionalidad ni estética.

---

## 1. Resumen Ejecutivo
Se ha completado la refactorización total del código JavaScript. La aplicación ya no depende del archivo gigante `app.js`. Toda la lógica ha sido distribuida en **16 módulos especializados** bajo la carpeta `js/features/`, orquestados por un archivo central `js/main.js`.

**Resultado:** La aplicación es ahora más mantenible, escalable y robusta, manteniendo el 100% de las funcionalidades originales, incluyendo características complejas como el escáner QR, la validación de dominios y las animaciones de scroll.

---

## 2. Nueva Arquitectura del Sistema

### Núcleo (Core)
- **`js/main.js`**: Punto de entrada. Inicializa la app, carga datos globales y configura los "listeners" (eventos) de toda la interfaz.
- **`js/store.js`**: "Cerebro" de la app. Gestiona el estado global (`appState`, tickets vendidos, ventas de merch) en un solo lugar.
- **`js/router.js`**: Gestiona la navegación entre páginas (Home, Admin, Eventos, etc.) sin recargar la web.
- **`js/ui.js`**: Utilidades visuales compartidas (Modales, Loader, Animaciones de Scroll interactivo).

### Módulos de Funcionalidad (`js/features/`)

| Módulo | Descripción y Funcionalidad Migrada |
| :--- | :--- |
| **`events.js` / `events_admin.js`** | Gestión completa de eventos. Parte pública (visualización) y Privada (CRUD, Gráficos de ventas, **Visor de Lista de Entradas**). |
| **`tickets.js`** | Lógica de compra, generación de UUIDs únicos, validación de dominios de email, y **descarga de entrada como imagen (png)**. |
| **`scanner.js`** | Integración compleja de `html5-qrcode`. Maneja dos modos: Validación de entrada (con detección de duplicados) y Entrega de Merch. |
| **`merch.js` / `merch_admin.js`** | Tienda online. Carrito, compras, y panel de admin para crear/editar productos (Web y por Drag). |
| **`gallery.js` / `gallery_admin.js`** | Visor de fotos y Gestor de subidas múltiples. Incluye la rejilla de administración con borrado interactivo. |
| **`drags.js` / `drags_admin.js`** | Perfiles de las Drags y gestión de su información. |
| **`giveaway.js`** | Sistema de sorteos aleatorios entre los asistentes. |
| **`backup.js`** | **Crítico.** Sistema de copia de seguridad (ZIP) y restauración. Soporta formato antiguo JSON y nuevo ZIP. |
| **`settings.js`** | Gestión de contenido de la app (Logos, Video Banner, textos promo). |
| **`admin.js`** | Login seguro (SHA-256), Logout y **Easter Egg** (5 toques para revelar admin). |

---

## 3. Auditoría de Calidad y Fidelidad

Para garantizar que "no falta nada", se han realizado verificaciones específicas sobre funciones críticas que suelen romperse en refactorizaciones:

1.  **✅ Escáner QR (`scanner.js`)**
    *   *Verificado:* La cámara se activa, lee QRs y distingue correctamente entre `TICKET_ID:` (validar acceso) y `MERCH_SALE_ID:` (entregar producto).
2.  **✅ Seguridad (`tickets.js` / `admin.js`)**
    *   *Verificado:* Se ha restaurado la validación de dominios de correo (ej. solo emails corporativos si está configurado).
    *   *Verificado:* El login de admin sigue usando hash SHA-256 antes de enviar datos a la red.
3.  **✅ Copias de Seguridad (`backup.js`)**
    *   *Verificado:* La función de `Restaurar` detecta si es un ZIP o JSON antiguo y reconstruye el estado completo (Eventos + Tickets + Ventas) sin errores.
4.  **✅ Estética y UX (`ui.js`)**
    *   *Verificado:* Se reimplementó el `IntersectionObserver` para que los elementos "aparezcan" suavemente al hacer scroll (`reveal-on-scroll`), manteniendo el estilo "Cyber-Glass".
5.  **✅ Gestión de Ficheros (`main.js`)**
    *   *Verificado:* Todos los inputs de subida de archivos (Posters, Logos, Galerías) están cableados explícitamente y funcionan.

---

## 4. Cómo Verificarlo Tú Mismo

Si quieres comprobar la robustez del nuevo código:

1.  **Prueba el Easter Egg:** En versión móvil, toca 5 veces el botón de menú. Debería aparecer el acceso a Admin (si no estás logueado) o un mensaje. (Lógica en `admin.js`).
2.  **Genera una Entrada:** Ve a un evento, "Comprar", usa un email válido. Debería salir el QR y el botón de descarga. (Lógica distribuida entre `tickets.js` y `ui.js`).
3.  **Sube una Galería:** Entra como Admin -> Galerías. Selecciona varias fotos. Deberían aparecer en la rejilla inferior instantáneamente. (Lógica en `gallery_admin.js`).
4.  **Descarga un Backup:** Admin -> Backup. Debería generar un `.zip` válido.

---

**Conclusión:** La aplicación ha sido trasplantada con éxito a un nuevo "cuerpo" más sano y fuerte, conservando su "alma" intacta. El archivo `app.js` antiguo puede ser eliminado o archivado.
