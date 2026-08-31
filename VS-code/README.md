# DR Screening System
### SIH 2026 — Problem Statement 26038
### Explainable AI for Diabetic Retinopathy Screening in Rural India

---

## Overview

A full-stack web application that wraps the existing MATLAB image quality analysis pipeline with a clinical-grade React frontend and a Node/Express backend.

The MATLAB algorithms are **unchanged**. The web layer only orchestrates them.

```
Browser (React/Vite)
   │  HTTP multipart upload
   ▼
Express (Node.js) — matlabService.js
   │  matlab -batch "runAnalysis(...)"
   ▼
MATLAB Pipeline (your existing .m files)
   │  preprocessFundusImage → calculateQualityMetrics →
   │  calculateIlluminationMetrics → calculateEdgeDensity →
   │  calculateQualityScores → fuseQualityScores →
   │  classifyImageQuality
   │  Writes: result JSON + CLAHE-enhanced PNG
   ▼
Express reads JSON → returns to browser
   ▼
React clinical dashboard
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js** ≥ 18 | [nodejs.org](https://nodejs.org) |
| **MATLAB** (any release with Image Processing Toolbox) | Required for `adapthisteq`, `imfilter`, `edge` |
| Image Processing Toolbox | Required by all `.m` files |

---

## Project Structure

```
SIH-2026/
├── Mat-Lab/
│   └── DR-project/          ← Your existing MATLAB code (unchanged)
│       ├── config/
│       │   └── qualityThresholds.m
│       ├── src/
│       │   ├── metrics/
│       │   ├── quality/
│       │   ├── scoring/
│       │   ├── preprocessing/
│       │   └── evaluation/
│       └── scripts/
│
└── VS-code/
    ├── backend/             ← Node.js / Express
    │   ├── matlab/
    │   │   └── runAnalysis.m      ← Only new MATLAB file (orchestration only)
    │   ├── services/
    │   │   └── matlabService.js
    │   ├── controllers/
    │   │   └── analysisController.js
    │   ├── routes/
    │   │   └── analysis.js
    │   ├── uploads/          ← Temp uploaded images (auto-created)
    │   ├── outputs/          ← MATLAB JSON + images (auto-created)
    │   ├── server.js
    │   ├── .env
    │   ├── .env.example
    │   └── package.json
    │
    └── frontend/            ← React + Vite
        ├── src/
        │   ├── components/
        │   ├── pages/
        │   ├── services/
        │   ├── App.jsx
        │   └── index.css
        ├── index.html
        ├── vite.config.js
        └── package.json
```

---

## Setup & Run

### 1. Install backend dependencies

```powershell
cd C:\Me\coding\SIH-2026\VS-code\backend
npm install
```

### 2. Install frontend dependencies

```powershell
cd C:\Me\coding\SIH-2026\VS-code\frontend
npm install
```

### 3. Configure MATLAB path

Edit `backend/.env`:

```env
# Full path to matlab.exe — or just "matlab" if it's on your PATH
MATLAB_PATH=matlab

# Absolute path to your DR-project folder (contains src/ and config/)
MATLAB_SRC_PATH=C:\Me\coding\SIH-2026\Mat-Lab\DR-project
```

**Finding your MATLAB path:**
- Windows: `where matlab` in PowerShell, or look in `C:\Program Files\MATLAB\R20XXx\bin\`
- To verify: `matlab -batch "disp('ok')"` should print `ok`

### 4. Start the Express backend

```powershell
cd C:\Me\coding\SIH-2026\VS-code\backend
npm run dev
```

Expected output:
```
╔══════════════════════════════════════════════════╗
║   DR Screening System — Backend                  ║
║   Server:       http://localhost:3001             ║
║   MATLAB path:  matlab                            ║
║   MATLAB src:   configured                        ║
╚══════════════════════════════════════════════════╝
```

### 5. Start the Vite frontend

In a **second terminal**:

```powershell
cd C:\Me\coding\SIH-2026\VS-code\frontend
npm run dev
```

Vite will start at `http://localhost:5173`

### 6. Upload a fundus image

1. Open `http://localhost:5173` in your browser
2. Drag & drop or click to upload a retinal fundus image (JPG or PNG)
3. Click **Analyze Fundus Image**
4. Wait 30–120 seconds (MATLAB startup + analysis)
5. The clinical dashboard will display all results

---

## How Node.js Communicates with MATLAB

```
matlabService.js
  │
  │  Uses child_process.spawn() to run:
  │
  │  matlab -batch "addpath('...'); runAnalysis('input.jpg', 'result.json', 'enhanced.png')"
  │             └─ -nosplash -nodesktop (no GUI)
  │
  ▼
runAnalysis.m (backend/matlab/runAnalysis.m)
  │  Sets addpath to Mat-Lab/DR-project/src and config
  │  Calls all existing pipeline functions
  │  Writes: result.json (jsonencode output)
  │  Writes: enhanced.png (CLAHE image)
  │  exit(0) on success, exit(1) on failure
  │
  ▼
matlabService.js reads result.json
  │
  ▼
Express returns JSON to React frontend
```

**Required MATLAB toolboxes:**
- Image Processing Toolbox (`adapthisteq`, `imfilter`, `edge`, `imgaussfilt`, `im2double`, `imresize`, `rgb2gray`)

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/analyze` | Upload fundus image (multipart `image` field), returns analysis JSON |
| `GET` | `/api/health` | Server health check |
| `GET` | `/outputs/:filename` | Serve MATLAB output images |

### POST /api/analyze — Response Schema

```json
{
  "success": true,
  "image": { "width": 512, "height": 512, "originalName": "fundus.jpg" },
  "rawMetrics": {
    "brightness": 128.4,
    "contrast": 62.1,
    "foregroundBrightness": 130.2,
    "blurScore": 0.00043,
    "meanBrightness": 0.503,
    "illuminationUniformity": 0.782,
    "validPixelFraction": 0.714,
    "edgeDensity": 0.089
  },
  "componentScores": {
    "brightnessIllumination": 74.2,
    "contrast": 60.1,
    "blurDetail": 68.9,
    "edgeDetail": 56.0
  },
  "overallQualityScore": 65.4,
  "classification": {
    "label": "GOOD",
    "confidence": 0.60,
    "reasons": ["Brightness and contrast passed the prototype thresholds."]
  },
  "overallStatus": "ACCEPTABLE",
  "recommendation": "Image is suitable for retinal analysis.",
  "thresholds": {
    "foregroundBrightnessDarkMax": 90,
    "contrastBlurryMax": 54,
    "metadata": { "type": "Prototype heuristic", "calibrationSamples": 3, "medicallyValidated": false }
  },
  "enhancedImageUrl": "/outputs/<uuid>_enhanced.png",
  "originalImageUrl": "/outputs/<uuid>_original.png"
}
```

### Error response:

```json
{
  "success": false,
  "errorCode": "MATLAB_NOT_FOUND",
  "errorMessage": "MATLAB executable not found. Check MATLAB_PATH in .env."
}
```

---

## MATLAB Function Reference

| File | Function | What it computes |
|---|---|---|
| `preprocessFundusImage.m` | `preprocessFundusImage(path)` | Resize 512×512, rgb2gray, CLAHE (adapthisteq) |
| `createFundusRegionMask.m` | `createFundusRegionMask(gray)` | Excludes black background; threshold = max(0.02, 0.05×max) |
| `calculateQualityMetrics.m` | `calculateQualityMetrics(gray)` | Brightness, Contrast (std), ForegroundBrightness, Sharpness, BlurScore |
| `calculateBlurScore.m` | `calculateBlurScore(gray)` | Variance of Laplacian `[0 1 0; 1 -4 1; 0 1 0]` |
| `calculateIlluminationMetrics.m` | `calculateIlluminationMetrics(gray)` | MeanBrightness, IlluminationUniformity (Gaussian σ=15) |
| `calculateEdgeDensity.m` | `calculateEdgeDensity(gray)` | Canny edges inside fundus mask |
| `calculateQualityScores.m` | `calculateQualityScores(metrics)` | Maps raw → 0–100 scores |
| `normalizeQualityMetric.m` | `normalizeQualityMetric(val, lo, hi)` | Linear clamp to 0–100 |
| `fuseQualityScores.m` | `fuseQualityScores(scores)` | Weighted mean (brightness 30%, contrast 20%, blur 25%, edge 25%) |
| `classifyImageQuality.m` | `classifyImageQuality(metrics, thresholds)` | GOOD / DARK / BLURRY |
| `qualityThresholds.m` | `qualityThresholds()` | ForegroundBrightnessDarkMax=90, ContrastBlurryMax=54 |

---

## Thresholds (from qualityThresholds.m)

| Threshold | Value | Classification Rule |
|---|---|---|
| `ForegroundBrightnessDarkMax` | **90** (uint8) | FgBrightness < 90 → **DARK** → INADEQUATE |
| `ContrastBlurryMax` | **54** (std) | Contrast < 54 → **BLURRY** → BORDERLINE |
| Otherwise | — | **GOOD** → ACCEPTABLE |

**⚠ These are prototype heuristics calibrated on 3 samples only. Not medically validated.**

---

## Troubleshooting

### MATLAB not found
```
errorCode: "MATLAB_NOT_FOUND"
```
→ Set `MATLAB_PATH` in `backend/.env` to the full path of `matlab.exe`

### MATLAB_SRC_PATH not set
```
[server] WARNING: MATLAB_SRC_PATH is not set in .env.
```
→ Add `MATLAB_SRC_PATH=C:\Me\coding\SIH-2026\Mat-Lab\DR-project` to `.env`

### Analysis timeout
→ Increase `MATLAB_TIMEOUT_MS` in `.env` (default: 120000 = 2 min)
→ First MATLAB startup is slowest; subsequent calls are faster

### Image reads as black / no valid region
```
errorCode: "PIPELINE_ERROR"
createFundusRegionMask:NoValidRegion
```
→ Ensure the image is an actual retinal fundus photo, not a completely black image

### Frontend can't connect to backend
→ Ensure Express is running on port 3001
→ Check `FRONTEND_ORIGIN=http://localhost:5173` in `.env`

---

## Future Extension Points

The backend is designed to extend with additional pipeline stages:

```
Image Quality          ← Current implementation
      ↓
Adaptive Preprocessing ← Current (CLAHE via preprocessFundusImage.m)
      ↓
Retinal Structure Analysis
      ↓
Lesion Detection
      ↓
DR Severity (0–4)
      ↓
Explainable Output
```

Add new routes in `backend/routes/` and new MATLAB function calls in `backend/matlab/runAnalysis.m`.

---

## Important Disclaimers

- Prototype thresholds calibrated on 3 samples. Require validation on a large, labelled clinical dataset before operational use.
- Results are for research/demonstration purposes only.
- Not a substitute for clinical diagnosis by a qualified ophthalmologist.
- No DR lesion detection or grading is implemented in the current version.
