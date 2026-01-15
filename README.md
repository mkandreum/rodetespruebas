# Rodetes Party - Event Management System

Sistema de gestión de eventos, tickets, merchandising y galerías migrado de PHP a Node.js.

## 🚀 Migración PHP → Node.js (Enero 2026)

Este proyecto ha sido **completamente migrado** de PHP/Apache a **Node.js/Express** para mejorar rendimiento, mantenibilidad y modernizar el stack tecnológico.

### Cambios Principales

- ✅ Backend en **Node.js 18 + Express**
- ✅ API REST en `/api/*`
- ✅ Sesiones con `express-session`
- ✅ Upload de archivos con `multer`
- ✅ Frontend 100% JavaScript modular (sin cambios)
- ✅ Docker con imagen Alpine (más ligera)

---

## 📦 Instalación

###  Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor (puerto 80)
npm start

# Modo desarrollo (con auto-reload)
 npm run dev
```

### 🐳 Docker

```bash
# Construir imagen
docker-compose build

# Iniciar contenedor
docker-compose up -d
```

---

## 🔧 Configuración

Crea un archivo `.env` en la raíz:

```env
PORT=80
ADMIN_EMAIL=admin@rodetes.com
ADMIN_PASSWORD=tu_contraseña_segura
SESSION_SECRET=cambia-esto-en-produccion
DATA_DIR=/var/www/data_private
UPLOAD_DIR=/app/uploads
```

---

## 🛠️ API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/initial-data` | Cargar datos iniciales (eventos, tickets, sesión) |
| `POST` | `/api/login` | Autenticación admin |
| `POST` | `/api/logout` | Cerrar sesión |
| `POST` | `/api/save` | Guardar estado de la aplicación |
| `POST` | `/api/save-tickets` | Guardar tickets vendidos |
| `POST` | `/api/save-merch` | Guardar ventas de merch |
| `POST` | `/api/upload` | Subir imágenes/videos |

---

## 📁 Estructura del Proyecto

```
c:/Users/daniel.gonzalez/Downloads/Nueva carpeta/
├── server.js                 # Servidor Express
├── package.json              # Dependencias Node.js
├── Dockerfile                # Imagen Node.js Alpine
├── docker-compose.yaml       # Orquestación Docker
├── index.html                # Frontend (sin PHP)
├── style.css                 # Estilos principales
├── js/                       # Módulos JavaScript
│   ├── main.js              # Punto de entrada
│   ├── config.js            # Configuración API
│   ├── store.js             # Estado global
│   ├── router.js            # Navegación SPA
│   └── features/            # Módulos por funcionalidad
├── data_private/            # Datos JSON (Git ignored)
└── uploads/                 # Archivos subidos (Git ignored)
```

---

## 🗑️ Archivos Eliminados (Ya no necesarios)

- ❌ `index.php`
- ❌ `login.php`
- ❌ `logout.php`
- ❌ `save.php`
- ❌ `upload.php`
- ❌ `save_tickets.php`
- ❌ `save_merch_sales.php`
- ❌ `get_initial_data.php`
- ❌ `docker-entrypoint.sh`
- ❌ `uploads.ini`

---

## 🔒 Seguridad

- Autenticación con hash SHA-256 (compatible con frontend existente)
- Sesiones HTTP-only cookies
- Validación de tipos de archivo en uploads
- Sanitización de nombres de archivo
- Middleware de autenticación para rutas protegidas

---

## 🧪 Testing

```bash
# Probar login
curl -X POST http://localhost/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rodetes.com","hash":"<SHA256_hash>"}'

# Probar datos iniciales
curl http://localhost/api/initial-data
```

---

## 📝 Notas de Migración

1. **Sesiones**: Ahora se gestionan con `express-session` en lugar de PHP sessions
2. **Datos iniciales**: Se cargan vía API `/api/initial-data` en lugar de inyección PHP inline
3. **Uploads**: Ruta actualizada de `/var/www/html/uploads` a `/app/uploads`
4. **Puerto**: Servidor escucha en puerto 80 por defecto (configurable vía `PORT` env var)

---

## 👤 Autor

**Rodetes Party** - Migrado a Node.js - Enero 2026

## 📄 Licencia

MIT
