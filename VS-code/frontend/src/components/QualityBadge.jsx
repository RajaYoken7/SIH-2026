import React from 'react';

/**
 * QualityBadge — large overall status display
 *
 * Props:
 *   status   {string}  'ACCEPTABLE' | 'BORDERLINE' | 'INADEQUATE'
 *   label    {string}  MATLAB classification label (GOOD/DARK/BLURRY)
 *   confidence {number} 0.0–1.0
 *   recommendation {string}
 *   reasons  {string[]} Array of MATLAB reason strings
 */
export default function QualityBadge({ status, label, confidence, recommendation, reasons }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.INADEQUATE;

  return (
    <div
      style={{
        ...styles.container,
        background: config.bg,
        border: `2px solid ${config.borderColor}`,
      }}
    >
      {/* Icon + label */}
      <div style={styles.topRow}>
        <span style={{ fontSize: '2rem' }}>{config.icon}</span>
        <div>
          <div style={{ ...styles.statusText, color: config.color }}>
            {config.icon}&nbsp;&nbsp;{status}
          </div>
          <div style={styles.matlabLabel}>
            MATLAB classification:&nbsp;
            <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85em', fontWeight: '700' }}>
              {label}
            </code>
            {confidence !== undefined && (
              <span style={styles.confidence}>
                &nbsp;({Math.round(confidence * 100)}% prototype confidence)
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ ...styles.divider, background: config.borderColor }} />

      {/* Recommendation */}
      <p style={{ ...styles.recommendation, color: config.color }}>
        {recommendation}
      </p>

      {/* MATLAB reasons */}
      {reasons && reasons.length > 0 && (
        <div style={styles.reasonsBox}>
          <div style={styles.reasonsTitle}>Assessment reasons from MATLAB:</div>
          {reasons.map((r, i) => (
            <div key={i} style={styles.reasonRow}>
              <span style={{ color: config.color, marginRight: '0.4rem' }}>›</span>
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Config map ---- */
const STATUS_CONFIG = {
  ACCEPTABLE: {
    icon: '✓',
    color: 'var(--green-700)',
    bg: 'var(--green-50)',
    borderColor: 'var(--green-100)',
  },
  BORDERLINE: {
    icon: '⚠',
    color: 'var(--amber-700)',
    bg: 'var(--amber-50)',
    borderColor: 'var(--amber-100)',
  },
  INADEQUATE: {
    icon: '✕',
    color: 'var(--red-700)',
    bg: 'var(--red-50)',
    borderColor: 'var(--red-100)',
  },
};

/* ---- Styles ---- */
const styles = {
  container: {
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.875rem',
  },
  statusText: {
    fontSize: '1.625rem',
    fontWeight: '800',
    letterSpacing: '0.03em',
    lineHeight: 1.1,
  },
  matlabLabel: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  confidence: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
  },
  divider: {
    height: '1px',
    margin: '1rem 0',
    opacity: 0.5,
  },
  recommendation: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    lineHeight: 1.5,
  },
  reasonsBox: {
    marginTop: '0.875rem',
    padding: '0.75rem',
    background: 'rgba(255,255,255,0.6)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(0,0,0,0.06)',
  },
  reasonsTitle: {
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
  },
  reasonRow: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    paddingLeft: '0.5rem',
  },
};
