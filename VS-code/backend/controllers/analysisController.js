/**
 * analysisController.js
 *
 * Handles POST /api/analyze
 * Validates the uploaded file, calls matlabService, returns JSON.
 */

const path = require('path');
const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');
const { runMatlabAnalysis, MatlabError } = require('../services/matlabService');

// Supported image MIME types
const ALLOWED_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
]);

/**
 * POST /api/analyze
 */
async function analyzeImage(req, res) {
    // ----------------------------------------------------------
    // 1. Validate uploaded file (multer puts it in req.file)
    // ----------------------------------------------------------
    if (!req.file) {
        return res.status(400).json({
            success: false,
            errorCode: 'NO_FILE',
            errorMessage: 'No image file was uploaded. Please select a JPG or PNG file.',
        });
    }

    const { mimetype, path: uploadedPath, originalname, size } = req.file;

    if (!ALLOWED_TYPES.has(mimetype)) {
        // Remove the invalid upload
        safeUnlink(uploadedPath);
        return res.status(415).json({
            success: false,
            errorCode: 'UNSUPPORTED_FORMAT',
            errorMessage: `File type "${mimetype}" is not supported. Please upload a JPG or PNG image.`,
        });
    }

    // Basic size guard: reject obviously corrupt / empty files
    if (size === 0) {
        safeUnlink(uploadedPath);
        return res.status(400).json({
            success: false,
            errorCode: 'EMPTY_FILE',
            errorMessage: 'The uploaded file is empty.',
        });
    }

    // ----------------------------------------------------------
    // 2. Run MATLAB analysis pipeline
    // ----------------------------------------------------------
    const sessionId = uuidv4();
    console.log(`[controller] Analysis session ${sessionId} started for "${originalname}"`);

    try {
        const result = await runMatlabAnalysis(uploadedPath, sessionId, originalname);

        // Remove the temp upload (MATLAB has finished reading it)
        safeUnlink(uploadedPath);

        console.log(`[controller] Session ${sessionId} completed — status: ${result.overallStatus}`);
        return res.status(200).json(result);

    } catch (err) {
        safeUnlink(uploadedPath);

        if (err instanceof MatlabError) {
            console.error(`[controller] MatlabError [${err.code}]:`, err.message);

            // Map internal error codes to HTTP status + user-friendly messages
            const { status, userMessage } = mapMatlabError(err);
            return res.status(status).json({
                success: false,
                errorCode: err.code,
                errorMessage: userMessage,
                technicalDetail: err.message, // only logged server-side; shown in dev
            });
        }

        // Unexpected error
        console.error('[controller] Unexpected error:', err);
        return res.status(500).json({
            success: false,
            errorCode: 'INTERNAL_ERROR',
            errorMessage: 'An unexpected error occurred. Please try again.',
        });
    }
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function mapMatlabError(err) {
    switch (err.code) {
        case 'MATLAB_NOT_FOUND':
            return {
                status: 503,
                userMessage:
                    'MATLAB analysis engine is not available on this server. ' +
                    'Please check that MATLAB is installed and MATLAB_PATH is configured.',
            };
        case 'TIMEOUT':
            return {
                status: 504,
                userMessage:
                    'Analysis took too long and was cancelled. ' +
                    'Try a smaller image or check that the MATLAB path is correctly configured.',
            };
        case 'IMAGE_NOT_FOUND':
        case 'EMPTY_FILE':
            return {
                status: 400,
                userMessage: 'The uploaded image could not be read. Please try a different file.',
            };
        case 'PIPELINE_ERROR':
            return {
                status: 422,
                userMessage:
                    'The image quality analysis pipeline encountered an error. ' +
                    'Please ensure the image is a valid retinal fundus photograph.',
            };
        case 'NO_OUTPUT_JSON':
        case 'JSON_PARSE_ERROR':
            return {
                status: 500,
                userMessage:
                    'MATLAB completed but did not produce a readable result. ' +
                    'Check that MATLAB_SRC_PATH points to the correct DR-project folder.',
            };
        default:
            return {
                status: 500,
                userMessage:
                    'Analysis could not be completed. Please check the image and try again.',
            };
    }
}

function safeUnlink(filePath) {
    if (!filePath) return;
    fs.unlink(filePath, (err) => {
        if (err) console.warn('[controller] Could not delete temp file:', filePath);
    });
}

module.exports = { analyzeImage };
