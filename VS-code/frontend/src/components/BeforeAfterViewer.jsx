import React, { useState, useRef, useCallback } from 'react';

/**
 * BeforeAfterViewer
 *
 * Displays the original and CLAHE-enhanced fundus images side by side,
 * with a drag slider for comparison.
 *
 * Props:
 *   originalUrl  {string}  URL of the original image (served from /outputs/)
 *   enhancedUrl  {string}  URL of the CLAHE-enhanced image
 *   claheApplied {boolean} Whether CLAHE enhancement was applied
 */
export default function BeforeAfterViewer({ originalUrl, enhancedUrl, claheApplied }) {
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const containerRef = useRef(null);
  const dragging     = useRef(false);

  const handlePointerDown = useCallback((e) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSlider(e);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragging.current) return;
    updateSlider(e);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  function updateSlider(e) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x    = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPos(Math.round((x / rect.width) * 100));
  }

  return (
    <div className="card" style={styles.outerCard}>
      <div style={styles.headerRow}>
        <h4 style={styles.title}>ADAPTIVE PREPROCESSING — CLAHE Enhancement</h4>
        {claheApplied && (
          <span style={styles.claheTag}>CLAHE via adapthisteq()</span>
        )}
      </div>

      <p style={styles.subtitle}>
        {claheApplied
          ? 'Contrast-Limited Adaptive Histogram Equalization has been applied to the grayscale fundus image.'
          : 'CLAHE preprocessing is always applied during analysis (preprocessFundusImage.m line 41).'}
      </p>

      {/* Comparison container */}
      <div
        ref={containerRef}
        style={styles.compareBox}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Original image — full width underneath */}
        <img
          src={originalUrl}
          alt="Original fundus image"
          style={styles.img}
          draggable={false}
        />

        {/* Enhanced image — clipped to right side of slider */}
        <div
          style={{
            ...styles.enhancedOverlay,
            clipPath: `inset(0 0 0 ${sliderPos}%)`,
          }}
        >
          <img
            src={enhancedUrl}
            alt="CLAHE-enhanced fundus image"
            style={styles.img}
            draggable={false}
          />
        </div>

        {/* Slider handle */}
        <div style={{ ...styles.sliderLine, left: `${sliderPos}%` }}>
          <div style={styles.sliderHandle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M15 18l-6-6 6-6" />
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div style={{ ...styles.imgLabel, left: '0.75rem' }}>ORIGINAL</div>
        <div style={{ ...styles.imgLabel, right: '0.75rem', left: 'auto' }}>ENHANCED</div>
      </div>

      {/* Caption row */}
      <div style={styles.captionRow}>
        <div style={styles.captionItem}>
          <div style={{ ...styles.captionDot, background: 'var(--slate-400)' }} />
          <div>
            <div style={styles.captionLabel}>Original</div>
            <div style={styles.captionSub}>Resized to 512×512, rgb2gray</div>
          </div>
        </div>
        <div style={styles.captionArrow}>→</div>
        <div style={styles.captionItem}>
          <div style={{ ...styles.captionDot, background: 'var(--teal-500)' }} />
          <div>
            <div style={styles.captionLabel}>CLAHE Enhanced</div>
            <div style={styles.captionSub}>adapthisteq() applied to uint8 gray</div>
          </div>
        </div>
      </div>

      <div style={styles.noteBox}>
        <strong>Note:</strong> CLAHE enhancement is an image-quality preprocessing step only.
        It does not constitute diagnosis or claim to improve clinical accuracy.
        Results must be reviewed by a qualified ophthalmologist.
      </div>
    </div>
  );
}

/* ---- Styles ---- */
const styles = {
  outerCard: {
    padding: '1.5rem',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.3rem',
  },
  title: {
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  claheTag: {
    background: 'var(--teal-100)',
    color: 'var(--teal-600)',
    fontSize: '0.72rem',
    fontWeight: '600',
    fontFamily: 'JetBrains Mono, monospace',
    padding: '0.2rem 0.6rem',
    borderRadius: '999px',
    border: '1px solid rgba(14,116,144,0.2)',
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
  },
  compareBox: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    maxHeight: '480px',
    overflow: 'hidden',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    cursor: 'col-resize',
    background: '#000',
    userSelect: 'none',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    pointerEvents: 'none',
  },
  enhancedOverlay: {
    position: 'absolute',
    inset: 0,
  },
  sliderLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    background: 'rgba(255,255,255,0.85)',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
  },
  sliderHandle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'var(--teal-500)',
    border: '2px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  imgLabel: {
    position: 'absolute',
    top: '0.75rem',
    background: 'rgba(0,0,0,0.55)',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: '700',
    letterSpacing: '0.07em',
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    pointerEvents: 'none',
  },
  captionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1rem',
    padding: '0.75rem',
    background: 'var(--slate-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
  },
  captionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
  },
  captionDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  captionLabel: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  captionSub: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    fontFamily: 'JetBrains Mono, monospace',
  },
  captionArrow: {
    fontSize: '1.25rem',
    color: 'var(--teal-500)',
    fontWeight: '700',
  },
  noteBox: {
    marginTop: '0.875rem',
    fontSize: '0.78rem',
    color: 'var(--slate-600)',
    background: 'var(--slate-50)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.625rem 0.75rem',
    lineHeight: 1.5,
  },
};
