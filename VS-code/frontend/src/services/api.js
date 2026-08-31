/**
 * api.js — Frontend API service layer
 *
 * Talks to the Express backend via Vite's dev proxy (/api → :3001).
 * In production, set VITE_API_BASE_URL to the backend URL.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * analyzeImage
 *
 * Uploads a File object to POST /api/analyze and returns the parsed result.
 *
 * @param {File}     file              The fundus image File object
 * @param {Function} onProgress        Optional callback(percent: number)
 * @returns {Promise<object>}          The MATLAB analysis result JSON
 * @throws  {ApiError}                 On HTTP errors or network failures
 */
export async function analyzeImage(file, onProgress) {
    const formData = new FormData();
    formData.append('image', file);

    // Use XMLHttpRequest for upload progress tracking
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            });
        }

        xhr.addEventListener('load', () => {
            let body;
            try {
                body = JSON.parse(xhr.responseText);
            } catch {
                reject(new ApiError('PARSE_ERROR', 'Server returned an unreadable response.'));
                return;
            }

            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(body);
            } else {
                reject(new ApiError(
                    body.errorCode || 'HTTP_ERROR',
                    body.errorMessage || `Server error ${xhr.status}`
                ));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new ApiError(
                'NETWORK_ERROR',
                'Cannot connect to the analysis server. ' +
                'Make sure the backend is running on port 3001.'
            ));
        });

        xhr.addEventListener('timeout', () => {
            reject(new ApiError('TIMEOUT', 'The request timed out. Please try again.'));
        });

        xhr.timeout = 180_000; // 3 minutes
        xhr.open('POST', `${BASE_URL}/api/analyze`);
        xhr.send(formData);
    });
}

/**
 * checkHealth
 * @returns {Promise<object>}
 */
export async function checkHealth() {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new ApiError('HEALTH_ERROR', 'Backend health check failed.');
    return res.json();
}

// ---- Custom error class ----
export class ApiError extends Error {
    constructor(code, message) {
        super(message);
        this.name    = 'ApiError';
        this.code    = code;
        this.message = message;
    }
}
