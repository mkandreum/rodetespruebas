/**
 * Rodetes Party - Node.js/Express Server
 * Migrated from PHP backend - January 2026
 */

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const cors = require('cors');
const morgan = require('morgan');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 80;

// ============================================
// CONFIGURATION
// ============================================

const DATA_DIR = process.env.DATA_DIR || '/var/www/data_private';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rodetes.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SESSION_SECRET = process.env.SESSION_SECRET || 'rodetes-secret-key-change-in-production';

// File paths
const APP_STATE_FILE = path.join(DATA_DIR, 'datos_app.json');
const TICKETS_FILE = path.join(DATA_DIR, 'entradas_db.json');
const MERCH_SALES_FILE = path.join(DATA_DIR, 'merch_vendido.json');

// Ensure directories exist
[DATA_DIR, UPLOAD_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
    }
});

// ============================================
// MIDDLEWARE
// ============================================

app.use(morgan('dev')); // Logging
app.use(cors()); // CORS support
app.use(express.json({ limit: '50mb' })); // JSON body parser
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // URL-encoded body parser

// Session management
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));


// Static file serving - before API routes
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(__dirname, {
    index: 'index.html',
    extensions: ['html']
}));

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Read JSON file safely
 */
function readJsonFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content && content.trim()) {
                JSON.parse(content); // Validate JSON
                return content;
            }
        }
    } catch (err) {
        console.error(`Error reading ${path.basename(filePath)}:`, err.message);
    }
    return 'null';
}

/**
 * Write JSON file safely
 */
function writeJsonFile(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
        }
        fs.writeFileSync(filePath, data, 'utf8');
        return true;
    } catch (err) {
        console.error(`Error writing ${path.basename(filePath)}:`, err.message);
        return false;
    }
}

/**
 * Authentication middleware
 */
function requireAuth(req, res, next) {
    if (!req.session.isLoggedIn) {
        return res.status(403).json({
            success: false,
            message: 'No autorizado. Tu sesión puede haber expirado.'
        });
    }
    next();
}

// ============================================
// API ROUTES
// ============================================

/**
 * GET /api/initial-data
 * Load initial application state (replaces PHP inline data)
 */
app.get('/api/initial-data', (req, res) => {
    try {
        const appState = readJsonFile(APP_STATE_FILE);
        const tickets = readJsonFile(TICKETS_FILE);
        const merchSales = readJsonFile(MERCH_SALES_FILE);

        res.json({
            success: true,
            data: {
                appState: appState !== 'null' ? JSON.parse(appState) : null,
                tickets: tickets !== 'null' ? JSON.parse(tickets) : null,
                merchSales: merchSales !== 'null' ? JSON.parse(merchSales) : null,
                session: {
                    isLoggedIn: req.session.isLoggedIn || false,
                    adminEmail: req.session.adminEmail || ''
                }
            }
        });
    } catch (err) {
        console.error('Error loading initial data:', err);
        res.status(500).json({
            success: false,
            message: 'Error al cargar datos iniciales'
        });
    }
});

/**
 * POST /api/login
 * Admin authentication
 */
app.post('/api/login', (req, res) => {
    try {
        const { email, hash } = req.body;

        console.log('LOGIN ATTEMPT:', { email, hash });

        // Calculate expected hash
        const validPasswordHash = crypto
            .createHash('sha256')
            .update(ADMIN_PASSWORD)
            .digest('hex');

        if (email === ADMIN_EMAIL && hash === validPasswordHash) {
            req.session.isLoggedIn = true;
            req.session.adminEmail = email;

            res.json({ success: true });
        } else {
            console.log('Login failed:', email !== ADMIN_EMAIL ? 'Email mismatch' : 'Password mismatch');
            res.status(401).json({
                success: false,
                message: email !== ADMIN_EMAIL ? 'Email incorrecto' : 'Contraseña incorrecta'
            });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
});

/**
 * POST /api/logout
 * Logout admin
 */
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al cerrar sesión'
            });
        }
        res.json({ success: true });
    });
});

/**
 * POST /api/save
 * Save main application state
 */
app.post('/api/save', requireAuth, (req, res) => {
    try {
        const data = JSON.stringify(req.body);

        // Validate JSON
        JSON.parse(data);

        if (writeJsonFile(APP_STATE_FILE, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al escribir archivo'
            });
        }
    } catch (err) {
        console.error('Save error:', err);
        res.status(400).json({
            success: false,
            message: 'JSON inválido'
        });
    }
});

/**
 * POST /api/save-tickets
 * Save tickets database
 */
app.post('/api/save-tickets', (req, res) => {
    try {
        const data = JSON.stringify(req.body);

        // Validate JSON
        JSON.parse(data);

        if (writeJsonFile(TICKETS_FILE, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al guardar tickets'
            });
        }
    } catch (err) {
        console.error('Save tickets error:', err);
        res.status(400).json({
            success: false,
            message: 'Datos inválidos'
        });
    }
});

/**
 * POST /api/save-merch
 * Save merch sales
 */
app.post('/api/save-merch', (req, res) => {
    try {
        const data = JSON.stringify(req.body);

        // Validate JSON
        JSON.parse(data);

        if (writeJsonFile(MERCH_SALES_FILE, data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al guardar ventas'
            });
        }
    } catch (err) {
        console.error('Save merch error:', err);
        res.status(400).json({
            success: false,
            message: 'Datos inválidos'
        });
    }
});

/**
 * POST /api/upload
 * File upload (images/videos)
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}_${sanitized}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido: ' + file.mimetype));
        }
    }
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se recibió archivo'
            });
        }

        const url = `uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Archivo subido con éxito',
            url
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Error al subir archivo'
        });
    }
});

// Error handler for multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo excede el tamaño máximo permitido (10MB)'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Error en la subida: ' + err.message
        });
    }

    if (err) {
        console.error('Server error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Error en el servidor'
        });
    }

    next();
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('🎉 RODETES PARTY SERVER');
    console.log('='.repeat(50));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`📤 Upload directory: ${UPLOAD_DIR}`);
    console.log(`👤 Admin email: ${ADMIN_EMAIL}`);
    console.log('='.repeat(50));
});
