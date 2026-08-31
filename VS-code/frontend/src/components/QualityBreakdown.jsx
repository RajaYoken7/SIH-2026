import React from 'react';

/**
 * QualityBreakdown — per-metric explainability table
 *
 * Shows every contributing metric with a clear PASS / CONCERN / FAIL
 * indicator so clinicians can see at a glance which metric drove the
 * classification decision.
 *
 * Props:
 *   metrics  {object}  rawMetrics from MATLAB
 *   scores   {object}  componentScores from MATLAB
 *   thresholds {object} thresholds from MATLAB config
 */
export default function QualityBreakdown({ metrics, scores, thresholds }) {
  const rows = buildRows(metrics, scores, thresholds);

  return (
    <div className="card" style={styles.container}>
      <h4 style={styles.sectionTitle}>Metric-Level Quality Breakdown</h4>
      <p style={styles.subtitle}>
        Shows exactly which measurements contributed to the overall assessment.
      </p>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, textAlign: 'left' }}>Metric</th>
            <th style={styles.th}>Score /100</th>
            <th style={styles.th}>Raw Value</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.key}
              style={{
                background: i % 2 === 0 ? 'var(--slate-50)' : 'var(--white)',
              }}
            >
              <td style={styles.tdLabel}>
                <div style={styles.metricName}>{row.label}</div>
                <div style={styles.metricDesc}>{row.description}</div>
              </td>
              <td style={styles.tdCenter}>
                <div style={styles.miniBarWrap}>
                  <div style={styles.miniBarTrack}>
                    <div
                      style={{
                        ...styles.miniBarFill,
                        width: `${Math.max(2, row.score)}%`,
                        background: barColor(row.score),
                      }}
                    />
                  </div>
                  <span style={{ ...styles.scoreText, color: barColor(row.score) }}>
                    {row.score !== null ? row.score.toFixed(1) : '–'}
                  </span>
                </div>
              </td>
              <td style={{ ...styles.tdCenter, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}>
                {formatRaw(row.raw, row.rawUnit)}
              </td>
              <td style={styles.tdCenter}>
                <StatusPill status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Threshold reference */}
      {thresholds && (
        <div style={styles.thresholdBox}>
          <div style={styles.thresholdTitle}>Prototype Thresholds (from qualityThresholds.m)</div>
          <div style={styles.thresholdGrid}>
            <ThresholdItem
              label="Foreground Brightness Dark Max"
              value={thresholds.foregroundBrightnessDarkMax}
              unit=" (uint8)"
              rule="FgBrightness < threshold → DARK"
            />
            <ThresholdItem
              label="Contrast Blurry Max"
              value={thresholds.contrastBlurryMax}
              unit=" (std)"
              rule="Contrast < threshold → BLURRY"
            />
          </div>
          {thresholds.metadata && (
            <div style={styles.thresholdNote}>
              ⚠ Calibration: {thresholds.metadata.calibrationSamples} samples.
              Medically validated: {thresholds.metadata.medicallyValidated ? 'Yes' : 'No'}.
              Type: {thresholds.metadata.type}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Data builder ---- */
function buildRows(metrics, scores, thresholds) {
  if (!metrics || !scores) return [];

  const fgBrightness = metrics.foregroundBrightness ?? metrics.brightness;
  const darkThresh   = thresholds?.foregroundBrightnessDarkMax ?? 90;
  const blurryThresh = thresholds?.contrastBlurryMax ?? 54;

  return [
    {
      key: 'brightness',
      label: 'Brightness / Illumination',
      description: 'Combined score from MeanBrightness (0–1 scale) + IlluminationUniformity',
      score: scores.brightnessIllumination,
      raw: metrics.meanBrightness,
      rawUnit: ' (0–1)',
      status: scoreStatus(scores.brightnessIllumination),
    },
    {
      key: 'fgBrightness',
      label: 'Foreground Brightness',
      description: `Pixels 15–245 (uint8). Threshold for DARK: < ${darkThresh}`,
      score: null, // no direct 0-100 score for this
      raw: fgBrightness,
      rawUnit: ' (uint8)',
      status: fgBrightness < darkThresh ? 'FAIL' : 'PASS',
    },
    {
      key: 'contrast',
      label: 'Contrast',
      description: `Standard deviation of grayscale pixel values. Threshold for BLURRY: < ${blurryThresh}`,
      score: scores.contrast,
      raw: metrics.contrast,
      rawUnit: ' (std)',
      status: scoreStatus(scores.contrast),
    },
    {
      key: 'blur',
      label: 'Sharpness / Blur',
      description: 'Variance of the Laplacian (calculateBlurScore). Higher = sharper.',
      score: scores.blurDetail,
      raw: metrics.blurScore,
      rawUnit: '',
      status: scoreStatus(scores.blurDetail),
    },
    {
      key: 'edge',
      label: 'Edge / Structural Detail',
      description: 'Canny edge density inside the fundus mask. Reflects detectable retinal structures.',
      score: scores.edgeDetail,
      raw: metrics.edgeDensity,
      rawUnit: '',
      status: scoreStatus(scores.edgeDetail),
    },
    {
      key: 'illuminationUniformity',
      label: 'Illumination Uniformity',
      description: 'fieldMean / (fieldMean + fieldStd) — Gaussian-smoothed. Higher = more even.',
      score: null,
      raw: metrics.illuminationUniformity,
      rawUnit: ' (0–1)',
      status: metrics.illuminationUniformity >= 0.6 ? 'PASS' : metrics.illuminationUniformity >= 0.45 ? 'CONCERN' : 'FAIL',
    },
    {
      key: 'coverage',
      label: 'Retinal Coverage',
      description: 'ValidPixelFraction — proportion of non-black fundus pixels inside the mask.',
      score: null,
      raw: metrics.validPixelFraction,
      rawUnit: '',
      status: metrics.validPixelFraction >= 0.4 ? 'PASS' : 'CONCERN',
    },
  ];
}

function scoreStatus(score) {
  if (score === null || score === undefined) return 'UNKNOWN';
  if (score >= 65) return 'PASS';
  if (score >= 40) return 'CONCERN';
  return 'FAIL';
}

/* ---- StatusPill ---- */
function StatusPill({ status }) {
  const MAP = {
    PASS:    { text: '✓ Adequate',    color: 'var(--green-700)', bg: 'var(--green-100)' },
    CONCERN: { text: '⚠ Low',         color: 'var(--amber-700)', bg: 'var(--amber-100)' },
    FAIL:    { text: '✕ Below range', color: 'var(--red-700)',   bg: 'var(--red-100)' },
    UNKNOWN: { text: '– N/A',         color: 'var(--slate-500)', bg: 'var(--slate-100)' },
  };
  const cfg = MAP[status] || MAP.UNKNOWN;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: '700',
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      {cfg.text}
    </span>
  );
}

/* ---- ThresholdItem ---- */
function ThresholdItem({ label, value, unit, rule }) {
  return (
    <div style={styles.thresholdItem}>
      <div style={styles.thresholdLabel}>{label}</div>
      <div style={styles.thresholdValue}>
        <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}{unit}</code>
      </div>
      <div style={styles.thresholdRule}>{rule}</div>
    </div>
  );
}

/* ---- Helpers ---- */
function barColor(score) {
  if (score === null || score === undefined) return 'var(--slate-300)';
  if (score >= 65) return 'var(--green-600)';
  if (score >= 40) return 'var(--amber-600)';
  return 'var(--red-600)';
}

function formatRaw(val, unit = '') {
  if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return '–';
  let str;
  if (typeof val === 'number') {
    if (Math.abs(val) < 0.0001 && val !== 0) str = val.toExponential(3);
    else if (Number.isInteger(val)) str = val.toString();
    else str = val.toFixed(4).replace(/\.?0+$/, '');
  } else {
    str = String(val);
  }
  return str + unit;
}

/* ---- Styles ---- */
const styles = {
  container: {
    padding: '1.5rem',
  },
  sectionTitle: {
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--border)',
  },
  th: {
    padding: '0.6rem 0.75rem',
    fontSize: '0.68rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--text-muted)',
    background: 'var(--slate-50)',
    textAlign: 'center',
    borderBottom: '1px solid var(--border)',
  },
  tdLabel: {
    padding: '0.75rem 0.875rem',
    borderBottom: '1px solid var(--border)',
  },
  tdCenter: {
    padding: '0.75rem 0.875rem',
    textAlign: 'center',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--border)',
  },
  metricName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  metricDesc: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '0.1rem',
  },
  miniBarWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
  },
  miniBarTrack: {
    width: '80px',
    height: '5px',
    background: 'var(--slate-200)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.8s ease',
  },
  scoreText: {
    fontSize: '0.82rem',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums',
  },
  thresholdBox: {
    marginTop: '1.25rem',
    padding: '0.875rem',
    background: 'var(--slate-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
  thresholdTitle: {
    fontSize: '0.68rem',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '0.625rem',
  },
  thresholdGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  thresholdItem: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.625rem 0.75rem',
  },
  thresholdLabel: {
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  thresholdValue: {
    fontSize: '0.9rem',
    color: 'var(--navy-800)',
    fontWeight: '700',
    margin: '0.15rem 0',
  },
  thresholdRule: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
  },
  thresholdNote: {
    marginTop: '0.625rem',
    fontSize: '0.75rem',
    color: 'var(--amber-700)',
    background: 'var(--amber-50)',
    padding: '0.4rem 0.6rem',
    borderRadius: 'var(--radius-sm)',
  },
};
