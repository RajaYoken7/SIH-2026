import React, { useState, useRef, useCallback } from 'react';

/**
 * UploadPage — medical-style retinal fundus image upload workstation
 *
 * Props:
 *   onAnalyze(file)  {Function}  Called when user submits
 *   isLoading        {boolean}
 *   progress         {number}    Upload progress 0-100
 *   error            {string}    Error message or null
 */
export default function UploadPage({ onAnalyze, isLoading, progress, error }) {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [dimensions, setDimensions] = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [typeError, setTypeError] = useState(null);

  const inputRef = useRef(null);
  const ALLOWED  = new Set(['image/jpeg', 'image/jpg', 'image/png']);

  /* ---- File ingestion ---- */
  const acceptFile = useCallback((f) => {
    setTypeError(null);
    if (!f) return;

    if (!ALLOWED.has(f.type)) {
      setTypeError(`"${f.name}" is not a supported image. Please upload a JPG or PNG file.`);
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);

    const img = new Image();
    img.onload = () => setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, []);

  const handleInputChange = useCallback((e) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = ''; // reset so same file can be re-selected
  }, [acceptFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }, [acceptFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleSubmit = () => {
    if (file && !isLoading) onAnalyze(file);
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setDimensions(null);
    setTypeError(null);
  };

  return (
    <main style={styles.page}>
      <div className="container" style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Page heading */}
        <div style={styles.heading}>
          <h1 style={styles.h1}>Fundus Image Upload</h1>
          <p style={styles.lead}>
            Upload a retinal fundus photograph to begin image quality assessment.
            The image will be analyzed by the MATLAB pipeline to evaluate brightness,
            contrast, sharpness, illumination uniformity, and retinal coverage.
          </p>
        </div>

        {/* Upload zone */}
        <div
          className="card"
          style={{
            ...styles.dropZone,
            border: dragOver
              ? '2px dashed var(--teal-500)'
              : file
              ? '2px solid var(--green-600)'
              : '2px dashed var(--slate-300)',
            background: dragOver
              ? 'rgba(14,116,144,0.04)'
              : 'var(--bg-card)',
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !file && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload fundus image area"
          onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            id="fundusImageInput"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          {!file ? (
            /* Empty state */
            <div style={styles.emptyState}>
              <div style={styles.uploadIcon}>
                <RetinalIcon />
              </div>
              <h2 style={styles.emptyTitle}>Upload Fundus Image</h2>
              <p style={styles.emptyHint}>Drag & drop or click to browse</p>
              <p style={styles.emptyFormats}>Accepted formats: JPG / JPEG / PNG</p>
              <button
                className="btn btn-teal"
                style={{ marginTop: '1.25rem', pointerEvents: 'none' }}
                tabIndex={-1}
                aria-hidden="true"
              >
                Browse Files
              </button>
            </div>
          ) : (
            /* Preview state */
            <div style={styles.previewState} onClick={(e) => e.stopPropagation()}>
              <div style={styles.previewImageWrap}>
                <img
                  src={preview}
                  alt="Uploaded fundus image preview"
                  style={styles.previewImg}
                />
              </div>
              <div style={styles.previewMeta}>
                <div style={styles.previewFileName}>{file.name}</div>
                <div style={styles.previewDetails}>
                  <MetaItem icon="📐" label="Size" value={formatFileSize(file.size)} />
                  {dimensions && (
                    <MetaItem icon="🖼" label="Resolution" value={`${dimensions.w} × ${dimensions.h} px`} />
                  )}
                  <MetaItem icon="📋" label="Type" value={file.type} />
                </div>
                <div style={styles.previewNote}>
                  ℹ MATLAB will resize this image to 512×512 for analysis.
                </div>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: '0.875rem', fontSize: '0.82rem', padding: '0.4rem 1rem' }}
                  onClick={handleClear}
                >
                  ✕ Remove Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error messages */}
        {(typeError || error) && (
          <div style={styles.errorBox} role="alert">
            <span style={{ fontSize: '1.1rem' }}>⚠</span>
            <div>
              <div style={styles.errorTitle}>{typeError ? 'Invalid File' : 'Analysis Error'}</div>
              <div style={styles.errorMsg}>{typeError || error}</div>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isLoading && progress > 0 && progress < 100 && (
          <div style={styles.progressBox}>
            <div style={styles.progressLabel}>Uploading image… {progress}%</div>
            <div className="score-bar-track" style={{ marginTop: '0.4rem' }}>
              <div
                className="score-bar-fill"
                style={{ width: `${progress}%`, background: 'var(--teal-500)' }}
              />
            </div>
          </div>
        )}

        {/* Analyze button */}
        <div style={styles.analyzeRow}>
          <button
            id="analyzeButton"
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={!file || isLoading}
            style={styles.analyzeBtn}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                {progress >= 100
                  ? 'Running MATLAB Analysis…'
                  : progress > 0
                  ? 'Uploading…'
                  : 'Analyzing…'}
              </>
            ) : (
              <>
                <span>▶</span>
                Analyze Fundus Image
              </>
            )}
          </button>

          {isLoading && (
            <p style={styles.loadingHint}>
              MATLAB is processing the image quality pipeline.
              This may take 30–120 seconds on first run.
            </p>
          )}
        </div>

        {/* Pipeline info card */}
        <div className="card" style={styles.infoCard}>
          <h3 style={styles.infoTitle}>Analysis Pipeline</h3>
          <p style={styles.infoSubtitle}>
            The following MATLAB functions will be called in sequence:
          </p>
          <div style={styles.pipelineList}>
            {PIPELINE_STEPS.map((step, i) => (
              <div key={i} style={styles.pipelineRow}>
                <span style={styles.stepNum}>{i + 1}</span>
                <div>
                  <code style={styles.stepCode}>{step.fn}</code>
                  <span style={styles.stepDesc}> — {step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---- Sub-components ---- */
function MetaItem({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
      <span>{icon}</span>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{value}</span>
    </div>
  );
}

function RetinalIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="30" stroke="var(--slate-200)" strokeWidth="2" fill="var(--slate-50)" />
      <circle cx="32" cy="32" r="20" stroke="var(--slate-300)" strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="32" r="4" fill="var(--teal-400)" />
      {/* Vessel lines */}
      <line x1="32" y1="12" x2="32" y2="28" stroke="var(--teal-400)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="36" x2="32" y2="52" stroke="var(--teal-400)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="32" x2="28" y2="32" stroke="var(--teal-400)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="36" y1="32" x2="52" y2="32" stroke="var(--teal-400)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---- Data ---- */
const PIPELINE_STEPS = [
  { fn: 'preprocessFundusImage()',      desc: 'Resize to 512×512, rgb2gray, CLAHE (adapthisteq)' },
  { fn: 'calculateQualityMetrics()',    desc: 'Brightness, Contrast, Sharpness, BlurScore' },
  { fn: 'calculateIlluminationMetrics()', desc: 'MeanBrightness, IlluminationUniformity, CoV' },
  { fn: 'calculateEdgeDensity()',       desc: 'Canny edge density inside fundus mask' },
  { fn: 'calculateQualityScores()',     desc: 'Convert raw metrics to 0–100 scores' },
  { fn: 'fuseQualityScores()',          desc: 'Weighted overall quality score' },
  { fn: 'classifyImageQuality()',       desc: 'GOOD / DARK / BLURRY classification' },
];

/* ---- Helpers ---- */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ---- Styles ---- */
const styles = {
  page: {
    padding: '2.5rem 0 4rem',
    minHeight: 'calc(100vh - 80px)',
  },
  heading: {
    marginBottom: '1.75rem',
  },
  h1: {
    color: 'var(--navy-800)',
    marginBottom: '0.5rem',
  },
  lead: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    maxWidth: '580px',
    lineHeight: 1.6,
  },
  dropZone: {
    borderRadius: 'var(--radius-xl)',
    padding: '0',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    overflow: 'hidden',
    minHeight: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 2rem',
    textAlign: 'center',
  },
  uploadIcon: {
    marginBottom: '1.25rem',
  },
  emptyTitle: {
    color: 'var(--navy-800)',
    marginBottom: '0.25rem',
  },
  emptyHint: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginBottom: '0.25rem',
  },
  emptyFormats: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--slate-50)',
  },
  previewState: {
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    gap: 0,
  },
  previewImageWrap: {
    width: '50%',
    background: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '280px',
    borderRadius: 'var(--radius-xl) 0 0 var(--radius-xl)',
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    height: '100%',
    maxHeight: '320px',
    objectFit: 'contain',
    display: 'block',
  },
  previewMeta: {
    flex: 1,
    padding: '1.5rem 1.75rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  previewFileName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--navy-800)',
    wordBreak: 'break-all',
    marginBottom: '0.875rem',
  },
  previewDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  previewNote: {
    marginTop: '0.875rem',
    fontSize: '0.78rem',
    color: 'var(--teal-600)',
    background: 'var(--teal-100)',
    padding: '0.4rem 0.65rem',
    borderRadius: 'var(--radius-sm)',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginTop: '1rem',
    padding: '0.875rem 1rem',
    background: 'var(--red-50)',
    border: '1px solid var(--red-100)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--red-700)',
  },
  errorTitle: {
    fontWeight: '700',
    fontSize: '0.875rem',
  },
  errorMsg: {
    fontSize: '0.85rem',
    marginTop: '0.15rem',
    lineHeight: 1.5,
  },
  progressBox: {
    marginTop: '1rem',
    padding: '0.875rem',
    background: 'var(--teal-100)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(14,116,144,0.2)',
  },
  progressLabel: {
    fontSize: '0.82rem',
    color: 'var(--teal-600)',
    fontWeight: '600',
  },
  analyzeRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  analyzeBtn: {
    minWidth: '260px',
    gap: '0.75rem',
  },
  loadingHint: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    maxWidth: '400px',
    lineHeight: 1.5,
  },
  infoCard: {
    marginTop: '2rem',
    padding: '1.25rem 1.5rem',
  },
  infoTitle: {
    color: 'var(--navy-800)',
    marginBottom: '0.25rem',
  },
  infoSubtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginBottom: '0.875rem',
  },
  pipelineList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  pipelineRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  stepNum: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    background: 'var(--navy-800)',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
  },
  stepCode: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.82rem',
    color: 'var(--teal-600)',
    fontWeight: '600',
  },
  stepDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
};
