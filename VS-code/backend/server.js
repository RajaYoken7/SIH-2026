/**
 * server.js — Express application entry point
 *
 * DR Retinal Screening System — Backend
 * SIH 2026, Problem Statement 26038
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const analysisRoutes = require('./routes/analysis');

// ----------------------------------------------------------------
// Directories that must exist on startup
// ----------------------------------------------------------------
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || 'uploads');
const OUTPUTS_DIR = path.resolve(process.env.OUTPUTS_DIR || 'outputs');

[UPLOADS_DIR, OUTPUTS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[server] Created directory: ${dir}`);
    }
});

// ----------------------------------------------------------------
// Express app
// ----------------------------------------------------------------
const app  = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS — allow only the configured frontend origin
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman) in development
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ----------------------------------------------------------------
// Static file serving
// ----------------------------------------------------------------
// Serve MATLAB output images (original + enhanced) to the frontend.
// URLs like:  http://localhost:3001/outputs/<sessionId>_enhanced.png
app.use('/outputs', express.static(OUTPUTS_DIR, {
    maxAge: '1h',
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    },
}));

// ----------------------------------------------------------------
// API Routes
// ----------------------------------------------------------------
app.use('/api', analysisRoutes);

// ----------------------------------------------------------------
// 404 handler
// ----------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        errorCode: 'NOT_FOUND',
        errorMessage: `Route ${req.method} ${req.path} not found.`,
    });
});

// ----------------------------------------------------------------
// Global error handler
// ----------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    console.error('[server] Unhandled error:', err);

    // Handle multer file-size limit
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            errorCode: 'FILE_TOO_LARGE',
            errorMessage: 'The uploaded file exceeds the 30 MB limit.',
        });
    }

    res.status(500).json({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        errorMessage: 'An unexpected server error occurred.',
    });
});

// ----------------------------------------------------------------
// Start
// ----------------------------------------------------------------
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   DR Screening System — Backend                  ║');
    console.log('║   SIH 2026 — Problem Statement 26038             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║   Server:       http://localhost:${PORT}             ║`);
    console.log(`║   MATLAB path:  ${(process.env.MATLAB_PATH || 'matlab (default)').padEnd(30)} ║`);
    console.log(`║   MATLAB src:   ${(process.env.MATLAB_SRC_PATH ? 'configured' : 'NOT SET — check .env').padEnd(30)} ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    if (!process.env.MATLAB_SRC_PATH) {
        console.warn(
            '[server] WARNING: MATLAB_SRC_PATH is not set in .env.\n' +
            '         MATLAB analysis will fail until this is configured.\n' +
            '         Set it to the absolute path of your DR-project folder.\n'
        );
    }
});

module.exports = app;
