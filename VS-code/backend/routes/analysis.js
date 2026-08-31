/**
 * routes/analysis.js
 *
 * POST /api/analyze   – Upload a fundus image and run MATLAB analysis
 * GET  /api/health    – Quick liveness check
 */

const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const { analyzeImage } = require('../controllers/analysisController');

const router = express.Router();

// ------------------------------------------------------------------
// Multer configuration
// ------------------------------------------------------------------
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
        // Use timestamp + original name to avoid collisions
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const ext    = path.extname(file.originalname).toLowerCase();
        cb(null, `upload-${unique}${ext}`);
    },
});

// Guard: only accept image MIME types at the multer level
function fileFilter(_req, file, cb) {
    const allowed = /jpeg|jpg|png/i;
    const extOk   = allowed.test(path.extname(file.originalname));
    const mimeOk  = allowed.test(file.mimetype.split('/')[1]);
    if (extOk && mimeOk) {
        cb(null, true);
    } else {
        // Pass null error — we let the controller return the friendly message
        cb(null, false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 30 * 1024 * 1024, // 30 MB max
        files: 1,
    },
});

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

/**
 * POST /api/analyze
 * Accepts: multipart/form-data with field "image"
 */
router.post('/analyze', upload.single('image'), analyzeImage);

/**
 * GET /api/health
 * Returns server status and basic config info (no secrets).
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DR Screening Backend',
        version: '1.0.0',
        matlabPath: process.env.MATLAB_PATH || 'matlab (default)',
        matlabSrcConfigured: !!(process.env.MATLAB_SRC_PATH),
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
