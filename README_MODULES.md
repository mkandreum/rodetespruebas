# 🎭 Estructura Modularizada de app.js

## Descripción General

El archivo `app.js` ha sido **refactorizado y modularizado** para mejorar la mantenibilidad y escalabilidad de la aplicación. El código ha sido distribuido en varios módulos independientes ubicados en la carpeta `/modules/`.

## Estructura de Módulos

### 📦 Módulos Disponibles

#### 1. **modules/utils.js** - Utilidades Generales
- Funciones de lectura de archivos
- Animaciones y scroll reveal
- Manejo de modales e información
- Funciones de validación
- Gestión de listeners

**Funciones principales:**
- `readFileAsDataURL()`, `readFileAsText()`, `readFileAsArrayBuffer()`
- `showLoading()`, `showInfoModal()`, `closeModal()`
- `showImageModal()`, `handleImageModalNext()`, `handleImageModalPrev()`
- `shuffleArray()`, `addTrackedListener()`, `clearEventListeners()`

---

#### 2. **modules/storage.js** - Almacenamiento y Sincronización
- Carga de datos iniciales desde PHP
- Guardado de estados en el servidor
- Subida de archivos con progreso

**Funciones principales:**
- `loadInitialDataFromServer()`
- `saveAppState()`, `saveTicketState()`, `saveMerchSalesState()`
- `uploadFileWithProgress()`

---

#### 3. **modules/galleries.js** - Galerías de Eventos y Drags
- Renderizado de galerías de eventos
- Renderizado de galerías de drags
- Listados de eventos/drags con galerías

**Funciones principales:**
- `renderGalleryEventList()`, `renderGalleryImages()`
- `renderPastGalleries()`
- `renderDragList()`, `renderDragGalleryImages()`

---

#### 4. **modules/tickets.js** - Sistema de Entradas
- Gestión de entradas/tickets
- Sincronización de contadores
- Validación y procesamiento de compras

**Funciones principales:**
- `syncTicketCounters()`
- `handleEmailSubmit()`, `handleDownloadTicket()`
- `getEventTickets()`, `getTicketById()`

---

#### 5. **modules/drags.js** - Gestión de Drags
- Renderizado de drags (público y admin)
- CRUD de drags
- Edición y eliminación

**Funciones principales:**
- `renderAdminDrags()`
- `handleSaveDrag()`, `resetDragForm()`
- `handleEditDragClick()`, `handleDeleteDrag()`
- `getDragById()`, `getDragsWithMerch()`

---

#### 6. **modules/merch.js** - Sistema de Merchandising
- Renderizado de página de merch
- Carrito de compras
- Procesamiento de ventas

**Funciones principales:**
- `renderMerchPage()`
- `createMerchCard()`
- `handleMerchBuyClick()`, `handleMerchPurchaseSubmit()`
- `generateMerchSale()`

---

#### 7. **modules/scanner.js** - Escáner QR
- Inicio/parada del escáner
- Procesamiento de QR escaneados
- Confirmación de entradas

**Funciones principales:**
- `startScanner()`, `stopScanner()`
- `handleQRScanned()`
- `handleScannerConfirm()`, `handleScannerCancel()`

---

#### 8. **modules/admin.js** - Panel Administrativo
- Gestión del panel admin
- Renderizado de eventos admin
- Sistema de login/logout
- Gestión de permisos

**Funciones principales:**
- `showAdminPage()`, `renderAdminEvents()`
- `checkAdminUI()`
- `handleAdminLogin()`, `handleLogout()`
- `renderAdminMerch()`

---

## 🔧 Cómo Usar los Módulos

### En index.php

Los módulos deben cargarse **ANTES** que `app.js` en el archivo index.php. Actualiza el orden de scripts:

```php
<!-- Cargar módulos primero -->
<script src="modules/utils.js"></script>
<script src="modules/storage.js"></script>
<script src="modules/galleries.js"></script>
<script src="modules/tickets.js"></script>
<script src="modules/drags.js"></script>
<script src="modules/merch.js"></script>
<script src="modules/scanner.js"></script>
<script src="modules/admin.js"></script>

<!-- Cargar app.js después para que tenga acceso a todos los módulos -->
<script src="app.js"></script>
```

### Importación en Otros Archivos JavaScript

Los módulos exportan sus funciones para ser usadas en otros contextos (si usas bundlers o importaciones ES6):

```javascript
// Ejemplo con ES6 modules (si usas bundler)
import { showLoading, showInfoModal } from './modules/utils.js';
import { saveAppState } from './modules/storage.js';

// Luego puedes usar:
showLoading(true, 'Procesando...');
```

---

## 📊 Beneficios de la Modularización

✅ **Mejor Mantenibilidad**: Cada módulo tiene una responsabilidad clara  
✅ **Facilita Debuggeo**: Errores aislados por funcionalidad  
✅ **Reutilización**: Funciones compartibles entre diferentes partes  
✅ **Colaboración**: Múltiples desarrolladores pueden trabajar en módulos diferentes  
✅ **Testing**: Más fácil escribir tests unitarios para módulos aislados  
✅ **Escalabilidad**: Agregar nuevas funcionalidades sin ensucia el código existente  

---

## 🔑 Variables Globales Necesarias

Los módulos acceden a estas variables globales (definidas en app.js):

- `appState` - Estado principal de la aplicación
- `allTickets` - Array de todas las entradas
- `allMerchSales` - Array de ventas de merchandise
- `isLoggedIn` - Estado de autenticación
- `adminEmail` - Email del admin logueado
- `currentEventFilter` - Filtro activo de eventos
- `editingEventId`, `editingDragId` - IDs en edición
- `currentImageModalGallery`, `currentImageModalIndex` - Estado del modal de imágenes
- `adminTapCounter` - Contador para easter egg

---

## 📝 Archivo de Inicialización (app.js)

El archivo `app.js` ahora contiene:

1. **Declaración de variables globales**
2. **Inicialización:** `DOMContentLoaded` event listener
3. **Carga de datos:** `loadInitialDataFromServer()`
4. **Setup de listeners:** attach event listeners a elementos del DOM
5. **Renderizado inicial:** home, galerías, etc.

**NO contiene** las funciones complejas (esas están en los módulos).

---

## 🎯 Flujo de Ejecución

```
1. HTML carga
   ↓
2. Módulos se cargan y registran sus funciones
   ↓
3. app.js se carga (puede acceder a todas las funciones de módulos)
   ↓
4. DOMContentLoaded dispara:
   - Carga datos desde servidor
   - Inicializa listeners
   - Renderiza página inicial
```

---

## 🚀 Próximos Pasos

- Considerar usar un bundler como **Webpack** o **Vite** para optimizar la carga
- Agregar **unit tests** para cada módulo
- Documentar tipos con **JSDoc** o **TypeScript**
- Extraer más funciones de `app.js` si es necesario

---

## 📞 Soporte

Para preguntas sobre la estructura modular, revisa los comentarios en cada archivo de módulo.
