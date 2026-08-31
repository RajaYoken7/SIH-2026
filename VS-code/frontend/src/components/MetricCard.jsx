import React from 'react';

/**
 * MetricCard
 *
 * Displays a single image-quality metric with:
 *   - Label (e.g. "Brightness Illumination")
 *   - Raw value (formatted appropriately)
 *   - 0-100 component score as a progress bar
 *   - Qualitative rating (GOOD / LOW / VERY LOW / HIGH)
 *
 * Props:
 *   label       {string}  Metric display name
 *   rawValue    {number}  The raw MATLAB value (for display)
 *   rawUnit     {string}  Unit string e.g. "/100" or "%" or ""
 *   score       {number}  0-100 component score from calculateQualityScores
 *   description {string}  One-line explanation of what this metric means
 *   highlight   {boolean} Whether this metric is a quality concern
 */
export default function MetricCard({ label, rawValue, rawUnit = '', score, description, highlight }) {
  const { rating, color, bg, borderColor } = classifyScore(score);

  return (
    <div
      className="card"
      style={{
        ...styles.card,
        border: `1px solid ${highlight ? borderColor : 'var(--border)'}`,
        background: highlight ? bg : 'var(--bg-card)',
      }}
    >
      {/* Header row */}
      <div style={styles.topRow}>
        <h4 style={{ ...styles.label, color: highlight ? color : 'var(--text-secondary)' }}>
          {label}
        </h4>
        <span
          style={{
            ...styles.ratingBadge,
            color,
            background: bg,
            border: `1px solid ${borderColor}`,
          }}
        >
          {rating}
        </span>
      </div>

      {/* Score value */}
      <div style={styles.scoreRow}>
        <span style={{ ...styles.scoreNum, color: highlight ? color : 'var(--text-primary)' }}>
          {formatScore(score)}
        </span>
        <span style={styles.scoreUnit}>/100</span>
      </div>

      {/* Progress bar */}
      <div className="score-bar-track" style={{ marginTop: '0.5rem' }}>
        <div
          className="score-bar-fill"
          style={{
            width: `${Math.max(2, score)}%`,
            background: barColor(score),
          }}
        />
      </div>

      {/* Raw value */}
      {rawValue !== undefined && (
        <div style={styles.rawRow}>
          <span style={styles.rawLabel}>Raw value:</span>
          <code style={styles.rawVal}>{formatRaw(rawValue)}{rawUnit}</code>
        </div>
      )}

      {/* Description */}
      {description && (
        <p style={styles.description}>{description}</p>
      )}
    </div>
  );
}

/* ---- Helpers ---- */

function classifyScore(score) {
  if (score >= 65) return { rating: 'GOOD',     color: 'var(--green-700)', bg: 'var(--green-50)',  borderColor: 'var(--green-100)' };
  if (score >= 40) return { rating: 'LOW',       color: 'var(--amber-700)', bg: 'var(--amber-50)',  borderColor: 'var(--amber-100)' };
  return              { rating: 'VERY LOW',  color: 'var(--red-700)',   bg: 'var(--red-50)',    borderColor: 'var(--red-100)' };
}

function barColor(score) {
  if (score >= 65) return 'var(--green-600)';
  if (score >= 40) return 'var(--amber-600)';
  return 'var(--red-600)';
}

function formatScore(score) {
  if (score === null || score === undefined || isNaN(score)) return '–';
  return score.toFixed(1);
}

function formatRaw(val) {
  if (val === null || val === undefined || isNaN(val)) return '–';
  if (Math.abs(val) < 0.001 && val !== 0) return val.toExponential(3);
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(4).replace(/\.?0+$/, '');
}

/* ---- Styles ---- */
const styles = {
  card: {
    padding: '1.125rem 1.25rem',
    borderRadius: 'var(--radius-lg)',
    transition: 'box-shadow var(--transition-base)',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.375rem',
  },
  label: {
    fontSize: '0.7rem',
    fontWeight: '600',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    margin: 0,
  },
  ratingBadge: {
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    letterSpacing: '0.05em',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.2rem',
    marginTop: '0.25rem',
  },
  scoreNum: {
    fontSize: '1.75rem',
    fontWeight: '700',
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  scoreUnit: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  rawRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.625rem',
    padding: '0.3rem 0.5rem',
    background: 'var(--slate-50)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--slate-200)',
  },
  rawLabel: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  rawVal: {
    fontSize: '0.78rem',
    color: 'var(--slate-700)',
    fontFamily: 'JetBrains Mono, monospace',
  },
  description: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '0.5rem',
    lineHeight: 1.5,
  },
};
