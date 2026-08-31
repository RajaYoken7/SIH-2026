import React from 'react';

/**
 * Header — persistent top bar for the DR Screening System.
 * Displays logo, system name, and optional patient/session context.
 */
export default function Header({ sessionId }) {
  return (
    <header style={styles.header}>
      <div className="container" style={styles.inner}>
        {/* Left: logo + title */}
        <div style={styles.brand}>
          <EyeIcon />
          <div>
            <div style={styles.sysName}>DR SCREENING SYSTEM</div>
            <div style={styles.sysSubtitle}>Retinal Fundus Image Quality Assessment</div>
          </div>
        </div>

        {/* Right: session / info */}
        <div style={styles.meta}>
          <span style={styles.badge}>SIH 2026 · PS 26038</span>
          {sessionId && (
            <span style={styles.sessionId} title="Analysis session ID">
              Session: <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem' }}>
                {sessionId.slice(0, 8)}…
              </code>
            </span>
          )}
        </div>
      </div>

      {/* Prototype disclaimer bar */}
      <div style={styles.disclaimerBar}>
        <div className="container" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.70)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⚠</span>
          <span>
            <strong>Research Prototype — Not for Clinical Use.</strong>&nbsp;
            Thresholds calibrated on a small sample set. Results require expert clinical review.
          </span>
        </div>
      </div>
    </header>
  );
}

/* ---- SVG Eye Icon ---- */
function EyeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" fill="#22b8d4" />
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="#22b8d4"
        strokeWidth="1.8"
        fill="none"
      />
    </svg>
  );
}

/* ---- Styles ---- */
const styles = {
  header: {
    background: 'var(--navy-800)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1.5rem',
    gap: '1rem',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  sysName: {
    color: '#ffffff',
    fontSize: '1.0625rem',
    fontWeight: '700',
    letterSpacing: '0.04em',
  },
  sysSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.75rem',
    letterSpacing: '0.02em',
    marginTop: '1px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  badge: {
    background: 'rgba(34,184,212,0.15)',
    border: '1px solid rgba(34,184,212,0.3)',
    color: '#22b8d4',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    letterSpacing: '0.04em',
  },
  sessionId: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.78rem',
  },
  disclaimerBar: {
    background: 'rgba(0,0,0,0.25)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '0.3rem 0',
  },
};
