/**
 * matlabService.js
 *
 * Orchestrates Node.js → MATLAB communication.
 *
 * Strategy:
 *   1. Copy the uploaded image to backend/uploads/<uuid>.ext
 *   2. Spawn  matlab -batch "runAnalysis('inputPath','outputJson','outputImg')"
 *   3. Read the output JSON file that MATLAB wrote
 *   4. Attach image URLs and return the result to the controller
 *
 * Environment variables (all from .env):
 *   MATLAB_PATH        – matlab executable path or command name
 *   MATLAB_SRC_PATH    – absolute path to Mat-Lab/DR-project
 *   MATLAB_TIMEOUT_MS  – ms before we kill the MATLAB process
 *   OUTPUTS_DIR        – where JSON + images are written
 */

const { spawn }  = require('child_process');
const path       = require('path');
const fs         = require('fs');
require('dotenv').config();

// ----------------------------------------------------------------
// Resolved paths
// ----------------------------------------------------------------
const MATLAB_CMD       = process.env.MATLAB_PATH     || 'matlab';
const MATLAB_SRC_PATH  = process.env.MATLAB_SRC_PATH || '';
const TIMEOUT_MS       = parseInt(process.env.MATLAB_TIMEOUT_MS || '120000', 10);
const OUTPUTS_DIR      = path.resolve(process.env.OUTPUTS_DIR || 'outputs');

// Path to runAnalysis.m in THIS backend's matlab/ folder
const RUN_ANALYSIS_M   = path.resolve(__dirname, '..', 'matlab', 'runAnalysis.m');
// The folder containing runAnalysis.m (used as MATLAB working dir)
const MATLAB_ENTRY_DIR = path.dirname(RUN_ANALYSIS_M);

// ----------------------------------------------------------------
// Ensure output directory exists
// ----------------------------------------------------------------
if (!fs.existsSync(OUTPUTS_DIR)) {
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

// ----------------------------------------------------------------
// Main exported function
// ----------------------------------------------------------------

/**
 * runMatlabAnalysis
 *
 * @param {string} uploadedImagePath  Absolute path to the uploaded image
 * @param {string} sessionId          UUID for this analysis session
 * @param {string} originalName       Original filename for display
 * @returns {Promise<object>}         Structured result matching JSON schema
 */
async function runMatlabAnalysis(uploadedImagePath, sessionId, originalName) {
    const outputJsonPath  = path.join(OUTPUTS_DIR, `${sessionId}_result.json`);
    const outputImgPath   = path.join(OUTPUTS_DIR, `${sessionId}_enhanced.png`);
    const originalImgCopy = path.join(OUTPUTS_DIR, `${sessionId}_original.png`);

    // Copy original image to outputs so frontend can display it
    await copyImageToOutput(uploadedImagePath, originalImgCopy);

    // Run MATLAB
    await executeMatlabBatch(uploadedImagePath, outputJsonPath, outputImgPath);

    // Parse MATLAB output
    const result = readJsonResult(outputJsonPath);

    // Attach URLs (served statically by Express)
    result.enhancedImageUrl  = `/outputs/${sessionId}_enhanced.png`;
    result.originalImageUrl  = `/outputs/${sessionId}_original.png`;
    result.image             = result.image || {};
    result.image.originalName = originalName;

    return result;
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------

/**
 * Copy uploaded image to outputs directory as PNG-named file.
 * We keep the extension as-is but expose via a session-id URL.
 */
async function copyImageToOutput(src, dest) {
    return new Promise((resolve, reject) => {
        fs.copyFile(src, dest, (err) => {
            if (err) {
                // Non-fatal: original preview just won't show
                console.warn('[matlabService] Could not copy original image:', err.message);
            }
            resolve(); // always continue
        });
    });
}

/**
 * Spawn MATLAB -batch and wait for exit.
 */
function executeMatlabBatch(inputImagePath, outputJsonPath, outputImgPath) {
    return new Promise((resolve, reject) => {
        // Escape backslashes for MATLAB string literals
        const escapedInput  = inputImagePath.replace(/\\/g, '\\\\');
        const escapedJson   = outputJsonPath.replace(/\\/g, '\\\\');
        const escapedImg    = outputImgPath.replace(/\\/g, '\\\\');

        // The -batch command adds the entry dir to path then calls runAnalysis
        const batchCmd = [
            `addpath('${MATLAB_ENTRY_DIR.replace(/\\/g, '\\\\')}');`,
            `runAnalysis('${escapedInput}','${escapedJson}','${escapedImg}')`
        ].join(' ');

        const args = ['-batch', batchCmd, '-nosplash', '-nodesktop'];

        // Propagate MATLAB_SRC_PATH so runAnalysis.m can locate the DR-project
        const env = { ...process.env };
        if (MATLAB_SRC_PATH) {
            env.MATLAB_SRC_PATH = MATLAB_SRC_PATH;
        }

        console.log(`[matlabService] Spawning: ${MATLAB_CMD} ${args.join(' ')}`);

        let killed = false;
        const proc = spawn(MATLAB_CMD, args, { env, shell: false });

        // Collect MATLAB stdout / stderr for logging
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d) => { stdout += d.toString(); });
        proc.stderr.on('data', (d) => { stderr += d.toString(); });

        // Timeout watchdog
        const timer = setTimeout(() => {
            killed = true;
            proc.kill('SIGTERM');
            reject(new MatlabError(
                'TIMEOUT',
                `MATLAB did not complete within ${TIMEOUT_MS / 1000} seconds.`
            ));
        }, TIMEOUT_MS);

        proc.on('error', (err) => {
            clearTimeout(timer);
            if (err.code === 'ENOENT') {
                reject(new MatlabError(
                    'MATLAB_NOT_FOUND',
                    `MATLAB executable not found at "${MATLAB_CMD}". ` +
                    `Check MATLAB_PATH in your .env file.`
                ));
            } else {
                reject(new MatlabError('SPAWN_ERROR', err.message));
            }
        });

        proc.on('close', (code) => {
            clearTimeout(timer);
            if (killed) return; // timeout already rejected

            if (stdout) console.log('[MATLAB stdout]', stdout.slice(0, 2000));
            if (stderr) console.error('[MATLAB stderr]', stderr.slice(0, 2000));

            if (code !== 0) {
                // MATLAB may have written an error JSON — try to read it
                const partialResult = tryReadJson(outputJsonPath);
                if (partialResult && !partialResult.success) {
                    reject(new MatlabError(
                        partialResult.errorCode || 'MATLAB_ERROR',
                        partialResult.errorMessage || `MATLAB exited with code ${code}`
                    ));
                } else {
                    reject(new MatlabError(
                        'MATLAB_NONZERO_EXIT',
                        `MATLAB exited with code ${code}. ` +
                        `Check that MATLAB_SRC_PATH is correct and all .m files are present.`
                    ));
                }
                return;
            }
            resolve();
        });
    });
}

/**
 * Read and parse the JSON file written by runAnalysis.m
 */
function readJsonResult(jsonPath) {
    if (!fs.existsSync(jsonPath)) {
        throw new MatlabError(
            'NO_OUTPUT_JSON',
            'MATLAB completed but did not produce an output file. ' +
            'Check that MATLAB_SRC_PATH is set correctly.'
        );
    }
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    try {
        return JSON.parse(raw);
    } catch {
        throw new MatlabError(
            'JSON_PARSE_ERROR',
            'MATLAB output could not be parsed as JSON.'
        );
    }
}

/**
 * Attempt to read JSON without throwing
 */
function tryReadJson(jsonPath) {
    try {
        if (!fs.existsSync(jsonPath)) return null;
        return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    } catch {
        return null;
    }
}

// ----------------------------------------------------------------
// Custom error class
// ----------------------------------------------------------------
class MatlabError extends Error {
    constructor(code, message) {
        super(message);
        this.name    = 'MatlabError';
        this.code    = code;
        this.message = message;
    }
}

// ----------------------------------------------------------------
// Exports
// ----------------------------------------------------------------
module.exports = { runMatlabAnalysis, MatlabError };
