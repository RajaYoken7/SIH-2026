import React from 'react';
import MetricCard       from '../components/MetricCard.jsx';
import QualityBadge     from '../components/QualityBadge.jsx';
import QualityBreakdown from '../components/QualityBreakdown.jsx';
import BeforeAfterViewer from '../components/BeforeAfterViewer.jsx';

/**
 * AnalysisPage — main clinical dashboard
 *
 * Displays all MATLAB analysis results in the layout:
 *   - Original fundus image + metric cards
 *   - Overall quality status badge
 *   - Explainability breakdown table
 *   - Before/after CLAHE viewer
 *
 * Props:
 *   result   {object}   The full JSON from backend/MATLAB
 *   onReset  {Function} Back to upload
 */
export default function AnalysisPage({ result, onReset }) {
  const {
    image,
    rawMetrics: m,
    componentScores: scores,
    overallQualityScore,
    classification,
    overallStatus,
    recommendation,
    thresholds,
    originalImageUrl,
    enhancedImageUrl,
  } = result;

  const statusClass = {
    ACCEPTABLE: 'acceptable',
    BORDERLINE: 'borderline',
    INADEQUATE: 'inadequate',
  }[overallStatus] || 'inadequate';

  return (
    <main style={styles.page}>
      <div className="container">

        {/* ── Top action bar ── */}
        <div style={styles.actionBar}>
          <div>
            <h1 style={styles.pageTitle}>Image Quality Analysis</h1>
            {image?.originalName && (
              <p style={styles.fileName}>
                File: <strong>{image.originalName}</strong>
                {image.width && (
                  <span style={styles.dims}>
                    &nbsp;(analysed at {image.width}×{image.height} px)
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            id="analyzeAnotherButton"
            className="btn btn-outline"
            onClick={onReset}
          >
            ← Analyze Another Image
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            Section 1: Original Image + Metric Cards
        ══════════════════════════════════════════════════════════ */}
        <section style={styles.section} aria-label="Image and quality metrics">
          <div style={styles.topGrid}>

            {/* Left: Original fundus image */}
            <div className="card" style={styles.imageCard}>
              <h4 style={styles.sectionLabel}>ORIGINAL FUNDUS IMAGE</h4>
              <div style={styles.fundusImgWrap}>
                <img
                  src={originalImageUrl}
                  alt="Uploaded retinal fundus image"
                  style={styles.fundusImg}
                />
              </div>
              <div style={styles.imageMetaRow}>
                <span style={styles.imageMeta}>
                  Pipeline: <code style={{ fontFamily: 'monospace' }}>preprocessFundusImage()</code>
                  &nbsp;→ <code style={{ fontFamily: 'monospace' }}>512×512</code>, grayscale
                </span>
              </div>
            </div>

            {/* Right: Metric cards grid */}
            <div style={styles.metricsPanel}>
              <h4 style={styles.sectionLabel}>IMAGE QUALITY ASSESSMENT</h4>
              <div style={styles.metricsGrid}>
                <MetricCard
                  label="Brightness / Illumination"
                  score={scores.brightnessIllumination}
                  rawValue={m.meanBrightness}
                  rawUnit=" (0–1)"
                  description="MeanBrightness + IlluminationUniformity combined (0–100)"
                  highlight={scores.brightnessIllumination < 40}
                />
                <MetricCard
                  label="Contrast"
                  score={scores.contrast}
                  rawValue={m.contrast}
                  rawUnit=" (std)"
                  description="Std dev of grayscale pixels. Ref range: 20–90"
                  highlight={scores.contrast < 40}
                />
                <MetricCard
                  label="Sharpness / Blur"
                  score={scores.blurDetail}
                  rawValue={m.blurScore}
                  rawUnit=""
                  description="Variance of Laplacian (calculateBlurScore). Higher = sharper."
                  highlight={scores.blurDetail < 40}
                />
                <MetricCard
                  label="Edge / Structural Detail"
                  score={scores.edgeDetail}
                  rawValue={m.edgeDensity}
                  rawUnit=""
                  description="Canny edge density inside fundus mask. Ref: 0.01–0.25."
                  highlight={scores.edgeDetail < 40}
                />
              </div>

              {/* Overall score gauge */}
              <div style={styles.overallScoreBox}>
                <div style={styles.overallScoreRow}>
                  <span style={styles.overallLabel}>OVERALL QUALITY SCORE</span>
                  <span style={{ ...styles.overallNum, color: scoreColor(overallQualityScore) }}>
                    {overallQualityScore?.toFixed(1)}<span style={styles.overallDenom}>/100</span>
                  </span>
                </div>
                <div className="score-bar-track" style={{ marginTop: '0.5rem' }}>
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${Math.max(2, overallQualityScore)}%`,
                      background: scoreColor(overallQualityScore),
                    }}
                  />
                </div>
                <div style={styles.overallWeights}>
                  Weights: Brightness 30% · Contrast 20% · Blur 25% · Edge 25%
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 2: Overall Quality Status
        ══════════════════════════════════════════════════════════ */}
        <section style={styles.section} aria-label="Overall image quality status">
          <h4 style={styles.sectionLabel}>OVERALL IMAGE STATUS</h4>
          <QualityBadge
            status={overallStatus}
            label={classification?.label}
            confidence={classification?.confidence}
            recommendation={recommendation}
            reasons={classification?.reasons}
          />
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 3: Metric-level explainability
        ══════════════════════════════════════════════════════════ */}
        <section style={styles.section} aria-label="Metric-level quality breakdown">
          <QualityBreakdown
            metrics={m}
            scores={scores}
            thresholds={thresholds}
          />
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 4: Before / After CLAHE
        ══════════════════════════════════════════════════════════ */}
        <section style={styles.section} aria-label="CLAHE preprocessing comparison">
          <BeforeAfterViewer
            originalUrl={originalImageUrl}
            enhancedUrl={enhancedImageUrl}
            claheApplied={overallStatus === 'BORDERLINE'}
          />
        </section>

        {/* ══════════════════════════════════════════════════════════
            Section 5: Raw JSON debug panel (collapsible)
        ══════════════════════════════════════════════════════════ */}
        <section style={styles.section} aria-label="Raw MATLAB output">
          <RawOutputPanel result={result} />
        </section>

      </div>
    </main>
  );
}

/* ---- Raw output collapsible panel ---- */
function RawOutputPanel({ result }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      <button
        style={styles.rawToggle}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}>
          {'{}'} Raw MATLAB Output JSON
        </span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <pre style={styles.rawPre}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ---- Helpers ---- */
function scoreColor(score) {
  if (!score && score !== 0) return 'var(--slate-400)';
  if (score >= 65) return 'var(--green-600)';
  if (score >= 40) return 'var(--amber-600)';
  return 'var(--red-600)';
}

/* ---- Styles ---- */
const styles = {
  page: {
    padding: '2rem 0 5rem',
    minHeight: 'calc(100vh - 80px)',
  },
  actionBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
  },
  pageTitle: {
    color: 'var(--navy-800)',
    marginBottom: '0.25rem',
  },
  fileName: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  dims: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontFamily: 'JetBrains Mono, monospace',
  },
  section: {
    marginBottom: '2rem',
    animation: 'fadeInUp 0.35s ease forwards',
  },
  sectionLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '0.875rem',
    margin: '0 0 0.875rem 0',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '1.25rem',
    alignItems: 'start',
  },
  imageCard: {
    padding: '1.25rem',
  },
  fundusImgWrap: {
    background: '#000',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
  },
  fundusImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  imageMetaRow: {
    marginTop: '0.5rem',
  },
  imageMeta: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
  },
  metricsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  overallScoreBox: {
    background: 'var(--navy-900)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  overallScoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
  },
  overallNum: {
    fontSize: '2rem',
    fontWeight: '800',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  overallDenom: {
    fontSize: '1rem',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
  overallWeights: {
    fontSize: '0.72rem',
    color: 'rgba(255,255,255,0.35)',
    marginTop: '0.5rem',
  },
  rawToggle: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    padding: 0,
    fontSize: '0.875rem',
  },
  rawPre: {
    marginTop: '0.875rem',
    background: 'var(--slate-800)',
    color: 'var(--teal-100)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem',
    fontSize: '0.72rem',
    overflow: 'auto',
    maxHeight: '400px',
    fontFamily: 'JetBrains Mono, monospace',
    lineHeight: 1.6,
  },
};
